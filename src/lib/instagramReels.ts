import type { InstagramReelFeatureProps } from "@/components/seo/InstagramReelFeature";

export type InstagramReelContent = InstagramReelFeatureProps & {
  slug: string;
  articlePath: `/${string}`;
  primaryKeyword: string;
  publishedDate?: string;
};

// Approved @iconik.style posts are automatically rendered on the matching
// article with the official embed, summary, takeaways, and transcript.
export const featuredInstagramReels: InstagramReelContent[] = [
  {
    slug: "skinny-jeans-torso-proportion",
    articlePath: "/body-type-styling/how-to-look-taller-clothing",
    primaryKeyword: "best jeans for upper body volume",
    permalink: "https://www.instagram.com/p/DZ2lyh7Cy8a/",
    title: "Why Skinny Jeans Can Make the Torso Look Heavier",
    summary:
      "Slimming is a question of visual balance, not simply choosing the narrowest garment. When the lower leg becomes extremely narrow, it can reduce the visual weight below the waist and make volume through the bust, arms, stomach, or shoulders appear more dominant.",
    takeaways: [
      "Judge jeans by how they balance the full silhouette, not by the word “skinny”.",
      "A high rise can create a cleaner waist anchor and a longer leg line.",
      "Straight-leg, soft bootcut, and wide-straight cuts preserve vertical fall.",
      "A clean darker wash reduces visual interruption and supports length.",
    ],
    transcript:
      "Skinny jeans are not always slimming. If your upper body carries more volume — bust, arms, stomach, or shoulders — extremely narrow jeans can make your lower body visually disappear. And when the lower body looks smaller, the upper body automatically looks heavier. The fix is not just “wear loose jeans.” The fix is proportion. Choose jeans that create vertical fall: high-rise straight-leg, soft bootcut, or wide-straight jeans in a clean darker wash. The rise holds the waist. The leg line balances the torso. The darker wash makes the frame look longer, sharper, and more expensive. Same body. Different jeans. Different science.",
    relatedGuide: {
      href: "/body-type-styling/how-to-dress-tummy",
      label: "Read the tummy and trouser-balance guide",
    },
  },
  {
    slug: "indian-wear-office-ready",
    articlePath: "/style-guides/office-wear-indian-women",
    primaryKeyword: "office wear Indian women",
    permalink: "https://www.instagram.com/reel/DaLey2uiMn5/",
    title: "How to Make Indian Wear Look Office-Ready",
    summary:
      "Indian wear can look authoritative at work when the construction, print scale, drape, and accessories support a professional visual hierarchy. The category is not the problem; the execution determines whether the outfit reads as casual, festive, dated, or office-ready.",
    takeaways: [
      "Choose a kurta with visible structure instead of a soft boxy shape.",
      "Use straight or controlled bottoms rather than defaulting to leggings.",
      "Keep prints deliberate and let one element lead the outfit.",
      "Use vertical drape and one strong office accessory to create authority.",
    ],
    transcript:
      "Indian wear is not the problem. The problem is wearing it like daily wear and expecting it to look office-ready. Leggings, loud florals, boxy kurtis, casual flats, and soft bags can make even a good kurta look dated, festive, or shapeless. The fix is not to stop wearing Indian wear. The fix is to choose sharper pieces. Structured kurtas. Cleaner bottoms. Controlled prints. Vertical drapes. One strong office accessory. Same category. Different execution. At ICONIK, we study your body geometry, facial architecture, and colour palette to build outfits that work for your real life. Same body. Different science.",
    relatedGuide: {
      href: "/methodology/geometric-silhouette-profiling",
      label: "See how ICONIK analyses garment structure",
    },
  },
  {
    slug: "visual-hierarchy-intentional-style",
    articlePath: "/style-guides/office-wear-indian-women",
    primaryKeyword: "visual hierarchy in fashion",
    permalink: "https://www.instagram.com/reel/Dan57iTC7yI/",
    title: "Visual Hierarchy Makes an Outfit Look Intentional",
    summary:
      "This Reel uses a celebrity-style evolution as an editorial example of visual hierarchy. The useful lesson is not to copy a person’s wardrobe, but to control which silhouette, tone, neckline, detail, and accessory the eye notices first.",
    takeaways: [
      "Let one silhouette establish the outfit’s main direction.",
      "Connect two tones so the eye moves through the look without interruption.",
      "Use the neckline to frame the face rather than compete with it.",
      "Choose one hero detail and make every accessory support it.",
    ],
    transcript:
      "Early Alia dressed for attention. Now she dresses like she already owns it. The shift wasn’t from bold to boring. It was from visual noise to visual hierarchy. One dominant silhouette. Two connected tones. A neckline that frames the face. One hero detail. Accessories that support instead of compete. She didn’t become less experimental. She became more intentional. That’s the difference between wearing a statement and becoming the statement. Get your ICONIK Blueprint through the link in bio. AI model used only to demonstrate styling principles. No real client face was used.",
    relatedGuide: {
      href: "/methodology/facial-architecture-analysis",
      label: "Understand neckline and face framing",
    },
  },
  {
    slug: "palazzo-tummy-proportion",
    articlePath: "/body-type-styling/how-to-dress-tummy",
    primaryKeyword: "palazzo pants for heavy tummy",
    permalink: "https://www.instagram.com/reel/Dada31oim9c/",
    title: "Why Palazzos Alone Do Not Balance a Fuller Tummy",
    summary:
      "A wide trouser cannot correct the silhouette if the top creates a hard stopping point at the stomach. Evening-wear balance comes from coordinating neckline, waist treatment, top length, trouser fall, and footwear as one vertical system.",
    takeaways: [
      "Avoid a tight tuck or stiff fabric that grips the midsection.",
      "Use a soft neckline to keep attention moving toward the face.",
      "Choose a draped waist or peplum that skims instead of cutting across.",
      "Let full-length palazzos fall straight from the hip and extend the line with heels.",
    ],
    transcript:
      "Palazzos won’t fix a heavy tummy if the top is working against you. A tight satin top, stiff tuck, or short kurti ending at the stomach will still make the eye stop exactly there. For evening wear, the formula is different: Soft neckline. No tight tuck. Draped waist or peplum skim. Full-length palazzos falling straight from the hip. Heels to extend the line. The goal is not to hide your stomach. The goal is to make the outfit fall around it correctly. Same body. Different science. Click the link in bio to get your ICONIK Blueprint.",
    relatedGuide: {
      href: "/body-type-styling/how-to-look-taller-clothing",
      label: "Learn the vertical-line method",
    },
  },
];
