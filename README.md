# live2d-models-Mizuki

一个独立的 Live2D 模型仓库，用来给博客远程提供看板娘资源。

它负责：
- 存放模型、贴图、动作文件
- 管理模型清单和服装清单
- 生成前端可直接加载的 `generated/*.json`
- 部署到 Cloudflare，供博客跨域读取

## 目录结构

```text
assets/
  _headers
  pio/
    models/
      registry.json
      <model-id>/
        index.json
        manifest.json
        model.moc
        motions/
        textures/
        generated/

scripts/
  generate-models.mjs

src/
  worker.js

wrangler.toml
```

说明：
- `registry.json`：模型总清单
- `manifest.json`：单个模型的服装清单
- `generated/`：根据 `manifest.json` 自动生成，博客实际加载这里的 JSON
- `worker.js` 和 `_headers`：用于 Cloudflare 托管和 CORS

## 部署

先生成模型文件：

```bash
node scripts/generate-models.mjs
```

再部署到 Cloudflare：

```bash
npx wrangler deploy
```

部署成功后会得到一个域名，例如：

```text
https://live2d-models.novoai.top
```

## 博客接入

博客只需要配置注册表地址：

```ts
export const pioConfig = {
  enable: true,
  registryUrl: "https://live2d-models.novoai.top/pio/models/registry.json"
}
```

博客运行时会自动继续读取：
- `/pio/models/registry.json`
- `/pio/models/<model-id>/manifest.json`
- `/pio/models/<model-id>/generated/<outfit-id>.json`

## 数据结构

### registry.json

```json
{
  "defaultModel": "pio",
  "models": ["pio", "tia"]
}
```

### manifest.json

```json
{
  "id": "pio",
  "name": "Pio",
  "base": "/pio/models/pio/index.json",
  "outfits": [
    {
      "id": "117-textures-default-costume",
      "name": "default-costume",
      "textures": [
        "textures/default-costume.png"
      ]
    }
  ]
}
```

## 常用操作

### 新增模型

1. 新建目录 `assets/pio/models/<model-id>/`
2. 放入模型资源：`index.json`、`model.moc`、`motions/`、`textures/`
3. 新建 `manifest.json`
4. 把模型 ID 加入 `assets/pio/models/registry.json`
5. 执行：

```bash
node scripts/generate-models.mjs
npx wrangler deploy
```

### 新增服装

1. 把贴图放进对应模型的 `textures/`
2. 在该模型的 `manifest.json` 里新增一个 `outfit`
3. 执行：

```bash
node scripts/generate-models.mjs
npx wrangler deploy
```

示例：

```json
{
  "id": "120-textures-new-outfit",
  "name": "新服装",
  "textures": [
    "textures/new-outfit.png"
  ]
}
```

### 删除模型

1. 删除 `assets/pio/models/<model-id>/`
2. 从 `registry.json` 中移除对应 ID
3. 部署：

```bash
npx wrangler deploy
```

### 删除服装

1. 从模型的 `manifest.json` 中删除对应 `outfit`
2. 如有需要，删除对应贴图文件
3. 执行：

```bash
node scripts/generate-models.mjs
npx wrangler deploy
```

### 修改名称或默认模型

- 修改默认模型：编辑 `registry.json` 的 `defaultModel`
- 修改模型名称：编辑 `manifest.json` 的 `name`
- 修改服装名称：编辑 `manifest.json` 中 outfit 的 `name`

改完后建议仍然执行一次：

```bash
node scripts/generate-models.mjs
npx wrangler deploy
```

## 检查是否部署成功

至少检查这几个地址能正常打开：

```text
https://你的域名/pio/models/registry.json
https://你的域名/pio/models/pio/manifest.json
https://你的域名/pio/models/pio/generated/117-textures-default-costume.json
```

并确认响应头包含：

```text
Access-Control-Allow-Origin: *
```

## 注意

- 根域名打开是 `404` 也可能是正常的，这个仓库本来就不是展示网站
- 新增或删除服装后，如果没执行 `generate-models.mjs`，博客切换时会找不到文件
- `generated/` 里的文件是产物，不建议手工改

## 推荐流程

每次改模型资源时，按这个顺序走：

1. 改 `registry.json` 或 `manifest.json`
2. 增删模型文件、贴图或动作
3. 执行 `node scripts/generate-models.mjs`
4. 执行 `npx wrangler deploy`
5. 打开线上 URL 检查资源是否可访问
6. 回博客测试角色切换和服装切换
