# IndexNow

This site is configured for IndexNow with the key file:

`public/e991f1e1ee93484486ae4f47071e99a8.txt`

After deployment, it should be publicly available at:

`https://www.iconik.pro/e991f1e1ee93484486ae4f47071e99a8.txt`

## Submit URLs

Submit one page:

```bash
npm run indexnow -- --url /style-guides/capsule-wardrobe-india
```

Submit several pages:

```bash
npm run indexnow -- --urls /,/blog,/style-guides/capsule-wardrobe-india
```

Submit all URLs currently listed in the live sitemap:

```bash
npm run indexnow -- --all
```

Preview the payload without submitting:

```bash
npm run indexnow -- --all --dry-run
```

IndexNow is intended for URLs that were recently added, updated, redirected, or deleted. For normal crawling coverage, keep using `https://www.iconik.pro/sitemap.xml`.
