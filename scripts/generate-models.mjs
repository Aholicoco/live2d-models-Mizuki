import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const modelsRoot = path.join(root, "assets", "pio", "models");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toGeneratedRelative(entry) {
  if (typeof entry !== "string") return entry;
  if (entry.startsWith("../")) return entry;
  return `../${entry.replace(/^\.\//, "")}`;
}

function generateModelFiles(modelId) {
  const modelDir = path.join(modelsRoot, modelId);
  const manifestPath = path.join(modelDir, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    return;
  }

  const manifest = readJson(manifestPath);
  const basePath = manifest.base
    ? path.join(root, "assets", manifest.base.replace(/^\/+/, "").replaceAll("/", path.sep))
    : path.join(modelDir, "index.json");

  if (!fs.existsSync(basePath)) {
    throw new Error(`Base model json not found: ${basePath}`);
  }

  const baseJson = readJson(basePath);
  const generatedDir = path.join(modelDir, "generated");
  ensureDir(generatedDir);

  for (const outfit of manifest.outfits || []) {
    const generatedJson = JSON.parse(JSON.stringify(baseJson));
    generatedJson.model = toGeneratedRelative(generatedJson.model);
    generatedJson.textures = (outfit.textures || generatedJson.textures || []).map(toGeneratedRelative);

    if (generatedJson.motions && typeof generatedJson.motions === "object") {
      for (const motions of Object.values(generatedJson.motions)) {
        if (!Array.isArray(motions)) continue;
        for (const motion of motions) {
          if (motion && typeof motion.file === "string") {
            motion.file = toGeneratedRelative(motion.file);
          }
        }
      }
    }

    writeJson(path.join(generatedDir, `${outfit.id}.json`), generatedJson);
  }
}

const entries = fs
  .readdirSync(modelsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

for (const modelId of entries) {
  generateModelFiles(modelId);
}
