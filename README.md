# live2d-models-Mizuki

一个独立的 Live2D 模型仓库，适配于Mizuki主题的AStro博客，用于远程提供看板娘资源。

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
  sync-models.mjs

src/
  worker.js

wrangler.toml
package.json
```

说明：
- `registry.json`：模型总清单
- `manifest.json`：单个模型的服装清单
- `generated/`：自动生成，博客实际加载这里的 JSON
- `sync-models.mjs`：自动同步 `registry.json`、补 `manifest.json`、生成 `generated/*.json`
- `worker.js`、`_headers`：用于 Cloudflare 托管和跨域访问

## 方式一：本地添加模型

适合你想先在本地确认生成结果是否正常。

### 1. 新建模型目录

在下面创建新模型目录：

```text
assets/pio/models/<model-id>/
```

例如：

```text
assets/pio/models/haru/
```

### 2. 放入模型资源

至少需要这些文件：

```text
assets/pio/models/haru/
  index.json
  model.moc
  motions/
  textures/
```

如果模型包里有 `textures.cache`，也一起放进去，脚本会优先使用它生成服装列表。

### 3. 本地执行生成脚本

在仓库根目录运行：

```bash
node scripts/sync-models.mjs
```

这个脚本会自动完成：
- 更新 `registry.json`
- 如果没有 `manifest.json`，自动补生成
- 生成 `generated/*.json`

### 4. 本地检查结果

至少检查这几个地方：

```text
assets/pio/models/registry.json
assets/pio/models/<model-id>/manifest.json
assets/pio/models/<model-id>/generated/
```

如果这些文件都正常生成，说明这个模型已经可以被博客读取。

## 方式二：线上自动部署添加模型

适合你平时真正使用的流程。

现在仓库已经配置为：
- 推送到 GitHub 后
- Cloudflare Git 自动部署
- 部署前自动执行：

```bash
npm run prepare-models
```

而 `prepare-models` 实际会运行：

```bash
node scripts/sync-models.mjs
```

### 你要做的事

只需要：

1. 把模型目录放进仓库
2. 提交并推送到 GitHub

例如：

```bash
git add .
git commit -m "feat: add haru live2d model"
git push
```

### Cloudflare 会自动做的事

部署时会自动：
- 更新 `registry.json`
- 自动补 `manifest.json`
- 生成 `generated/*.json`
- 把结果部署上线

### 推荐使用方式

平时建议直接走这套线上流程。

也就是：
- 本地只负责把模型文件放进去
- 推送 GitHub
- Cloudflare 自动生成并部署

如果你只是想确认新模型有没有问题，再额外本地手动跑一次：

```bash
node scripts/sync-models.mjs
```
