const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const checks = [
  [process.execPath, ["--check", "assets/app.js"]],
  [process.execPath, ["--check", "assets/life-program.js"]],
  [process.execPath, ["tests/life-program-matrix.cjs"]],
  [process.execPath, ["tests/local-link-audit.cjs"]],
];

for (const [command, args] of checks) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
  });
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  if (result.status !== 0) process.exit(result.status || 1);
}

JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
console.log("Configuracion: manifest.webmanifest valido.");
console.log("OK: pruebas automaticas completadas.");
