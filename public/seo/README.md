# SEO editorial images

Each registered article receives one 4:5 editorial source and one deterministic Open Graph derivative.

## Source-image rules

- Generate a fictional Indian model or editorial scene without embedded typography, logos, callout lines, or watermarks.
- Keep the subject and important garment details away from the extreme edges.
- Use the same identity and body in comparison visuals; change styling, not the person's body.
- Save only final web assets here. Keep discarded generation variants outside the public bundle.

## Build derivatives

```bash
npm run seo:images -- \
  --input /absolute/path/to/generated-source.png \
  --cluster body-type \
  --slug how-to-look-taller-clothing \
  --title "How to Look Taller in Clothes" \
  --eyebrow "Silhouette Intelligence"
```

Outputs:

- `public/seo/{cluster}/{slug}.webp` — 1600×2000 article visual
- `public/seo/{cluster}/{slug}-og.webp` — 1200×630 branded social card

The command refuses to overwrite existing assets unless `--overwrite` is supplied.
