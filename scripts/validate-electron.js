const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const requiredFiles = [
  "electron/main.js",
  "electron/preload.js",
  "app/index.html",
  "app/styles.css",
  "app/renderer.js",
  "assets/characters/cat/working.png",
  "assets/characters/dog/working.png",
  "assets/characters/rabbit/working.png",
  "assets/characters/panda/working.png",
  "assets/characters/boy/working.png",
  "assets/characters/girl/working.png"
];

for (const file of requiredFiles) {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

for (const file of ["electron/main.js", "electron/preload.js", "app/renderer.js"]) {
  const result = spawnSync(process.execPath, ["--check", path.join(process.cwd(), file)], {
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout);
  }
}

console.log("Electron project files look good.");
