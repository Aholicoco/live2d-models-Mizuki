import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const modelsRoot = path.join(root, "assets", "pio", "models");
const registryPath = path.join(modelsRoot, "registry.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sanitizeSegment(value) {
  return (
    value
      .toLowerCase()
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "outfit"
  );
}

function toGeneratedRelative(entry) {
  if (typeof entry !== "string") return entry;
  if (entry.startsWith("../")) return entry;
  return `../${entry.replace(/^\.\//, "")}`;
}

function hasFile(dirPath, fileName) {
  return fs.existsSync(path.join(dirPath, fileName));
}

function getModelDirs() {
  return fs
    .readdirSync(modelsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => hasFile(path.join(modelsRoot, name), "index.json"));
}

function getBaseModelJson(modelDir) {
  const indexPath = path.join(modelDir, "index.json");
  if (!fs.existsSync(indexPath)) return null;

  try {
    return readJson(indexPath);
  } catch {
    return null;
  }
}

function readTexturesCache(modelDir) {
  const cachePath = path.join(modelDir, "textures.cache");
  if (!fs.existsSync(cachePath)) return null;

  const data = readJson(cachePath);
  if (!Array.isArray(data)) return null;

  return data
    .map((item) => {
      if (Array.isArray(item)) {
        return item.filter((entry) => typeof entry === "string" && entry.trim());
      }
      if (typeof item === "string" && item.trim()) {
        return [item.trim()];
      }
      return [];
    })
    .filter((group) => group.length > 0);
}

function readBaseTextures(modelDir) {
  const baseJson = getBaseModelJson(modelDir);
  if (!baseJson || !Array.isArray(baseJson.textures)) return [];

  return baseJson.textures.filter((entry) => typeof entry === "string" && entry.trim());
}

function scanTextures(modelDir) {
  const texturesDir = path.join(modelDir, "textures");
  if (!fs.existsSync(texturesDir)) return [];

  return fs
    .readdirSync(texturesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /\.(png|jpg|jpeg|webp)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, "en"))
    .map((name) => [`textures/${name}`]);
}

function resolveTextureGroups(modelDir) {
  const cacheGroups = readTexturesCache(modelDir);
  if (cacheGroups && cacheGroups.length) {
    return cacheGroups;
  }

  const baseTextures = readBaseTextures(modelDir);
  if (baseTextures.length) {
    return [baseTextures];
  }

  return scanTextures(modelDir);
}

function buildOutfits(textureGroups) {
  return textureGroups.map((textures, index) => {
    const firstTexture = textures[0] || `textures/outfit-${index + 1}.png`;
    const label = path.basename(firstTexture).replace(/\.[^.]+$/, "");
    return {
      id: `${String(index + 1).padStart(3, "0")}-${sanitizeSegment(firstTexture)}`,
      name: label,
      textures,
    };
  });
}

function createManifest(modelId, modelDir) {
  const textureGroups = resolveTextureGroups(modelDir);
  return {
    id: modelId,
    name: modelId.charAt(0).toUpperCase() + modelId.slice(1),
    base: `/pio/models/${modelId}/index.json`,
    outfits: buildOutfits(textureGroups),
  };
}

function ensureManifest(modelId) {
  const modelDir = path.join(modelsRoot, modelId);
  const manifestPath = path.join(modelDir, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    writeJson(manifestPath, createManifest(modelId, modelDir));
  }

  const manifest = readJson(manifestPath);
  if (!Array.isArray(manifest.outfits)) {
    manifest.outfits = [];
  }

  if (!manifest.id) manifest.id = modelId;
  if (!manifest.name) manifest.name = modelId.charAt(0).toUpperCase() + modelId.slice(1);
  if (!manifest.base) manifest.base = `/pio/models/${modelId}/index.json`;

  writeJson(manifestPath, manifest);
  return manifest;
}

function syncRegistry(modelIds) {
  const currentRegistry = fs.existsSync(registryPath)
    ? readJson(registryPath)
    : { defaultModel: modelIds[0] || null, models: [] };

  const registry = {
    defaultModel:
      currentRegistry.defaultModel && modelIds.includes(currentRegistry.defaultModel)
        ? currentRegistry.defaultModel
        : modelIds[0] || null,
    models: modelIds,
  };

  writeJson(registryPath, registry);
  return registry;
}

function clearGeneratedDir(generatedDir) {
  if (!fs.existsSync(generatedDir)) {
    ensureDir(generatedDir);
    return;
  }

  for (const entry of fs.readdirSync(generatedDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".json")) {
      fs.unlinkSync(path.join(generatedDir, entry.name));
    }
  }
}

function generateModelFiles(modelId, manifest) {
  const modelDir = path.join(modelsRoot, modelId);
  const basePath = manifest.base
    ? path.join(root, "assets", manifest.base.replace(/^\/+/, "").replaceAll("/", path.sep))
    : path.join(modelDir, "index.json");

  if (!fs.existsSync(basePath)) {
    throw new Error(`Base model json not found: ${basePath}`);
  }

  const baseJson = readJson(basePath);
  const generatedDir = path.join(modelDir, "generated");
  clearGeneratedDir(generatedDir);

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

ensureDir(modelsRoot);
const modelIds = getModelDirs();
syncRegistry(modelIds);

for (const modelId of modelIds) {
  const manifest = ensureManifest(modelId);
  generateModelFiles(modelId, manifest);
}
