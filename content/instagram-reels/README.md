# ICONIK Reel-to-Resource Workflow

Each selected `@iconik.style` Reel should become a useful article section, not a video-only embed.

For every Reel, collect:

1. The public Reel permalink (`https://www.instagram.com/reel/.../`)
2. The original caption
3. A plain-text transcript or spoken script
4. The original MP4 and cover image, if available
5. The most relevant ICONIK article path

Then add an entry to `src/lib/instagramReels.ts` with:

- `slug`: stable internal ID
- `articlePath`: article where the Reel should appear
- `primaryKeyword`: the search intent it supports
- `permalink`: public Instagram Reel URL
- `title`: a reader-first teaching title
- `summary`: the idea in two or three useful sentences
- `takeaways`: three to five specific points a reader can apply
- `transcript`: accessible text version of the spoken content
- `relatedGuide`: the most useful next article

The shared article system automatically renders approved entries with the official Instagram embed, companion text, takeaways, transcript, and an internal link.
