const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const pages = [
  "index.html",
  "acceso.html",
  "biblioteca.html",
  "embajadores.html",
  "terminos-embajadores.html",
  "gracias.html",
  "gracias-embajador.html",
  "privacidad.html",
  "terminos.html",
  "404.html",
];
const missing = [];
let references = 0;

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  const matches = html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi);
  for (const [, raw] of matches) {
    if (
      !raw ||
      raw.startsWith("#") ||
      raw.startsWith("http://") ||
      raw.startsWith("https://") ||
      raw.startsWith("mailto:") ||
      raw.startsWith("tel:") ||
      raw.startsWith("data:") ||
      raw.startsWith("javascript:")
    ) {
      continue;
    }
    references += 1;
    const withoutQuery = raw.split(/[?#]/, 1)[0];
    if (!withoutQuery) continue;
    const relative = decodeURIComponent(withoutQuery).replace(/^[/\\]+/, "");
    const target = path.resolve(root, path.dirname(page), relative);
    if (!fs.existsSync(target)) {
      missing.push(`${page} -> ${raw}`);
    }
  }
}

if (missing.length) {
  throw new Error(`Referencias locales ausentes:\n${missing.join("\n")}`);
}

console.log(
  `Enlaces: ${pages.length} paginas y ${references} referencias locales.`
);
