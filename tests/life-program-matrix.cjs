const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(
  path.join(root, "assets", "life-program.js"),
  "utf8"
);
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox);

const areas = [
  "mentalidad",
  "bienestar",
  "profesional",
  "finanzas",
  "relaciones",
];
const minutes = [2, 10, 20];
const energies = ["low", "steady", "high"];
const requiredStrings = [
  "module",
  "outcome",
  "guideMessage",
  "rhythm",
  "focus",
  "focusLabel",
  "safety",
];

let combinations = 0;
for (let day = 1; day <= 100; day += 1) {
  for (const lifeArea of areas) {
    for (const dose of minutes) {
      for (const energy of energies) {
        const program = sandbox.window.getLifeProgram(day, {
          lifeArea,
          minutes: dose,
          energy,
        });
        combinations += 1;

        if (program.day !== day) {
          throw new Error(`Dia incorrecto: ${day}`);
        }
        for (const key of requiredStrings) {
          if (typeof program[key] !== "string" || !program[key].trim()) {
            throw new Error(`Campo vacio ${key}: dia ${day}`);
          }
        }
        for (const key of ["learning", "movement", "finance", "connection"]) {
          if (!program[key]?.title || !program[key]?.action) {
            throw new Error(`Practica incompleta ${key}: dia ${day}`);
          }
        }
        if (
          !program.learning.resource?.url?.startsWith("https://") ||
          !program.video.resource?.url?.startsWith("https://")
        ) {
          throw new Error(`Recurso invalido: dia ${day}`);
        }
        if (program.dose.minutes !== dose || program.dose.energy !== energy) {
          throw new Error(`Dosis incoherente: dia ${day}`);
        }
        if (JSON.stringify(program).includes("undefined")) {
          throw new Error(`Valor undefined: dia ${day}`);
        }
      }
    }
  }
}

if (sandbox.window.LIFE_MODULES.length !== 15) {
  throw new Error("Se esperaban 15 etapas del programa.");
}
if (sandbox.window.LIFE_RESOURCES.length < 10) {
  throw new Error("La biblioteca base esta incompleta.");
}

console.log(
  `Programa: ${combinations} combinaciones, 100 dias, ${sandbox.window.LIFE_MODULES.length} etapas y ${sandbox.window.LIFE_RESOURCES.length} recursos.`
);
