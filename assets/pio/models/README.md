# Pio Models

## 当前结构

- `registry.json`
  负责声明站点启用了哪些模型，以及默认加载哪个模型。
- `<model-id>/manifest.json`
  负责声明该模型有哪些服装。

## 新增一个模型

1. 在 `public/pio/models/` 下新建模型目录，例如 `tia/`
2. 把该模型的 `model.moc`、`textures/`、`motions/`、模型 JSON 放进去
3. 在该目录创建 `manifest.json`
4. 在 `registry.json` 的 `models` 数组里追加 `"tia"`

## 给现有模型新增服装

1. 在模型目录里放好新的服装 JSON
2. 只修改该模型自己的 `manifest.json`
3. 不需要改 `src/config.ts`
4. 不需要改 `src/components/widget/Pio.svelte`
5. 不需要改 `public/pio/static/pio.js`

## manifest.json 示例

```json
{
  "id": "pio",
  "name": "Pio",
  "outfits": [
    {
      "id": "default",
      "name": "默认",
      "model": "/pio/models/pio/model_default_costume.json"
    }
  ]
}
```

## registry.json 示例

```json
{
  "defaultModel": "pio",
  "models": ["pio", "tia"]
}
```
