# Live2D Models Repository

This repository hosts standalone Live2D model assets for Cloudflare Workers/Pages.

## Structure

```text
assets/
  _headers
  pio/
    models/
      registry.json
      pio/
        index.json
        manifest.json
        generated/
        motions/
        textures/
        model.moc
      tia/
        index.json
        manifest.json
        generated/
        motions/
        textures/
        model.moc
```

## Maintenance

1. Add or update model files inside `assets/pio/models/<model-id>/`.
2. Edit that model's `manifest.json` to add or remove outfits.
3. Run `node scripts/generate-models.mjs` to refresh `generated/*.json`.
4. Deploy with Wrangler.

## Runtime URLs

After deployment, the blog can load:

- `/pio/models/registry.json`
- `/pio/models/<model-id>/manifest.json`
- `/pio/models/<model-id>/generated/<outfit-id>.json`

CORS headers are enabled in both `src/worker.js` and `assets/_headers`.
