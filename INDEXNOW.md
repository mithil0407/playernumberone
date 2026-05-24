# IndexNow

This site is configured for IndexNow with the key file:

`public/57eeefa763f74162b49a3024ee31d814.txt`

After deployment, it should be publicly available at:

`https://www.iconik.pro/57eeefa763f74162b49a3024ee31d814.txt`

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
