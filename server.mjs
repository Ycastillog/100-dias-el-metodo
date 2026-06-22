import { createServer } from "node:http";
import { createReadStream, readFileSync, statSync, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 4289);
const env = loadEnv(join(root, ".env.local"));
const apiKey = process.env.OPENAI_API_KEY || env.OPENAI_API_KEY;
const openaiModel = process.env.OPENAI_MODEL || env.OPENAI_MODEL || "gpt-5.5";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  const values = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 100_000) throw new Error("Request too large");
  }
  return JSON.parse(body || "{}");
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function getVideoPrompt(input) {
  const quantity = clampNumber(input.quantity, 1, 10, 5);
  const platform = String(input.platform || "YouTube Shorts, TikTok e Instagram Reels").slice(0, 120);
  const audience = String(input.audience || "personas hispanohablantes que quieren disciplina y direccion").slice(0, 220);
  const angle = String(input.angle || "estoicismo practico aplicado a 100 dias de ejecucion").slice(0, 220);
  const offer = String(input.offer || "100 Dias: El Metodo - Edicion Estoica").slice(0, 180);
  const tone = String(input.tone || "sobrio, firme, directo, adulto").slice(0, 160);

  return {
    quantity,
    prompt: [
      "Eres estratega de contenido short-form para vender un producto digital estoico en español.",
      "Genera un lote de videos verticales listos para producir.",
      "",
      `Cantidad: ${quantity}`,
      `Plataforma: ${platform}`,
      `Audiencia: ${audience}`,
      `Angulo: ${angle}`,
      `Oferta: ${offer}`,
      `Tono: ${tone}`,
      "",
      "Reglas:",
      "- Nada de promesas irreales de dinero, salud o transformacion magica.",
      "- No uses citas falsas atribuidas a filosofos.",
      "- Mantén el lenguaje claro para publico hispano.",
      "- Cada guion debe durar 30 a 60 segundos.",
      "- Cada video debe llevar a la landing o al lead magnet de 7 Dias de Control Estoico.",
      "- Devuelve solo JSON valido con el schema solicitado.",
    ].join("\n"),
  };
}

async function generateVideos(req, res) {
  let input;
  try {
    input = await readJson(req);
  } catch {
    sendJson(res, 400, { error: "Solicitud JSON invalida." });
    return;
  }

  const { quantity, prompt } = getVideoPrompt(input);
  if (input.mode === "demo") {
    sendJson(res, 200, getDemoBatch(input, quantity));
    return;
  }

  if (!apiKey) {
    sendJson(res, 500, {
      error: "OPENAI_API_KEY no esta configurada en el servidor local. Usa modo demo o configura la clave.",
    });
    return;
  }

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      strategy_note: { type: "string" },
      videos: {
        type: "array",
        minItems: quantity,
        maxItems: quantity,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            platform_fit: { type: "string" },
            hook: { type: "string" },
            script: { type: "string" },
            visual_direction: { type: "string" },
            voice_direction: { type: "string" },
            caption: { type: "string" },
            hashtags: {
              type: "array",
              minItems: 5,
              maxItems: 10,
              items: { type: "string" },
            },
            cta: { type: "string" },
            production_notes: { type: "string" },
          },
          required: [
            "title",
            "platform_fit",
            "hook",
            "script",
            "visual_direction",
            "voice_direction",
            "caption",
            "hashtags",
            "cta",
            "production_notes",
          ],
        },
      },
    },
    required: ["strategy_note", "videos"],
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: openaiModel,
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "stoic_video_batch",
            strict: true,
            schema,
          },
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data?.error?.message || "OpenAI no pudo generar el lote.";
      sendJson(res, response.status, {
        error: response.status === 429
          ? `OpenAI respondio limite o cuota insuficiente: ${message}`
          : message,
      });
      return;
    }

    const text = data.output_text || data.output?.flatMap((item) => item.content || []).find((part) => part.type === "output_text")?.text;
    if (!text) {
      sendJson(res, 502, { error: "La respuesta no trajo texto utilizable." });
      return;
    }

    sendJson(res, 200, JSON.parse(text));
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Error inesperado generando videos.",
    });
  }
}

function getDemoBatch(input, quantity) {
  const platform = String(input.platform || "YouTube Shorts, TikTok e Instagram Reels");
  const offer = String(input.offer || "100 Dias: El Metodo - Edicion Estoica");
  const concepts = [
    {
      title: "No necesitas motivacion",
      hook: "Si esperas tener ganas, ya perdiste el control del dia.",
      script: "La disciplina estoica empieza cuando dejas de pedirle permiso a tu estado de animo. Hoy no tienes que sentirte fuerte. Tienes que hacer una accion que dependa de ti. Una llamada. Una pagina. Una caminata. Un no dicho a tiempo. El metodo empieza ahi: cuando separas lo que controlas de lo que solo estas deseando controlar.",
    },
    {
      title: "La pregunta que ordena tu mente",
      hook: "Antes de reaccionar, hazte esta pregunta: que parte de esto depende de mi?",
      script: "La mayor parte del caos crece porque mezclamos dos cosas: lo que pasa y lo que interpretamos. El estoicismo no te pide ser frio. Te pide ser claro. Si depende de ti, actua. Si no depende de ti, suelta el teatro mental y vuelve a tu deber del dia.",
    },
    {
      title: "La incomodidad no es una senal",
      hook: "Sentirte incomodo no significa que debes detenerte.",
      script: "A veces la incomodidad es exactamente la prueba. No porque sufrir sea bueno, sino porque tu identidad anterior esta negociando para quedarse igual. Si hoy cumples una accion pequena aunque no tengas ganas, ya entrenaste fortaleza. No lo adornes. Registralo y sigue.",
    },
    {
      title: "100 dias para dejar de improvisar",
      hook: "Tu vida no cambia porque un dia te inspires. Cambia cuando dejas de improvisar.",
      script: "Cien dias no son una promesa magica. Son un marco. Dia tras dia, vuelves a lo mismo: que controlo, que ejecuto, que debo soltar. Al final no necesitas una personalidad nueva. Necesitas evidencia de que puedes sostener una direccion.",
    },
    {
      title: "No negocies con el animo",
      hook: "El animo es mal jefe. Cambia de opinion demasiado rapido.",
      script: "Si tu dia depende de como amaneciste, cualquier emocion gobierna. La practica estoica es otra: decides una accion minima y la cumples. Sin drama. Sin discurso. Sin esperar condiciones perfectas. Control, fortaleza y direccion se construyen asi.",
    },
  ];

  return {
    strategy_note: "Modo demo local: sirve para probar el flujo y el estilo mientras se activa cuota/billing de OpenAI.",
    videos: Array.from({ length: quantity }, (_, index) => {
      const item = concepts[index % concepts.length];
      return {
        title: item.title,
        platform_fit: platform,
        hook: item.hook,
        script: item.script,
        visual_direction: "Fondo vertical sobrio: escritorio limpio, libreta, luz natural, texto grande en pantalla con una frase central.",
        voice_direction: "Voz calmada, firme, sin energia exagerada. Pausas cortas despues del hook.",
        caption: `${item.hook} ${offer} convierte disciplina en estructura diaria.`,
        hashtags: ["#estoicismo", "#disciplina", "#desarrollopersonal", "#habitos", "#100dias", "#control"],
        cta: "Descarga 7 Dias de Control Estoico o entra al kit completo de 100 dias.",
        production_notes: "Duracion estimada 35-45 segundos. Usar subtitulos grandes y corte visual cada 4-6 segundos.",
      };
    }),
  };
}

createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/generate-videos") {
    await generateVideos(req, res);
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const requested = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[\\/])+/, "");
  let filePath = join(root, requested === "/" ? "index.html" : requested);

  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  if (statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }

  res.writeHead(200, {
    "Content-Type": types[extname(filePath).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  createReadStream(filePath).pipe(res);
}).listen(port, "127.0.0.1", () => {
  console.log(`100 Dias listo en http://127.0.0.1:${port}`);
});
