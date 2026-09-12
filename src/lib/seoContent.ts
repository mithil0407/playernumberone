import { leadMagnetLinks } from "@/lib/leadMagnets";

export type SeoLink = {
  href: string;
  title: string;
  description: string;
};

export type SeoPageStatus = "index" | "noindex" | "redirect" | "exclude";

export type SeoPageInventoryEntry = {
  path: string;
  status: SeoPageStatus;
  redirectTo?: string;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
};

export const methodologyLinks: SeoLink[] = [
  {
    href: "/methodology/geometric-silhouette-profiling",
    title: "Geometric Silhouette Profiling™",
    description: "A proportion-led styling framework for garment shape, length, fit and Indian wardrobe decisions.",
  },
  {
    href: "/methodology/chromatic-harmony-mapping",
    title: "Chromatic Harmony Mapping™",
    description: "A colour framework that combines undertone, depth, contrast and Indian wardrobe context.",
  },
  {
    href: "/methodology/facial-architecture-analysis",
    title: "Facial Architecture Analysis™",
    description: "Face-shape guidance for necklines, earrings, collars, and hair direction.",
  },
];

export const styleGuideLinks: SeoLink[] = [
  {
    href: "/style-guides/capsule-wardrobe-india",
    title: "Capsule Wardrobe India",
    description: "Build a connected Indian and western wardrobe around your calendar, climate, and laundry cycle.",
  },
  {
    href: "/style-guides/office-wear-indian-women",
    title: "Office Wear for Indian Women",
    description: "Professional outfit formulas that still feel like you.",
  },
  {
    href: "/style-guides/postpartum-fashion-india",
    title: "Postpartum Fashion India",
    description: "Body-specific outfit ideas for dressing confidently after major body changes.",
  },
  {
    href: "/style-guides/indian-wedding-guest-outfit",
    title: "Indian Wedding Guest Outfit",
    description: "How to choose colours, silhouettes, and outfit categories for wedding dressing.",
  },
  {
    href: "/style-guides/saree-draping-body-type",
    title: "Saree Draping by Body Type",
    description: "Body-shape specific saree draping guidance for Indian wardrobes.",
  },
  {
    href: "/style-guides/salwar-kameez-body-type",
    title: "Salwar Kameez by Body Type",
    description: "How to choose salwar, kurta, and dupatta shapes for your proportions.",
  },
  {
    href: "/style-guides/kurti-length-guide",
    title: "Kurti Length Guide",
    description: "Choose the hem by body landmark, bottom width, and the proportion you want to create.",
  },
  {
    href: "/style-guides/diwali-outfit-body-type",
    title: "Diwali Outfit by Body Type",
    description: "Festive outfit ideas mapped to silhouette and body geometry.",
  },
  {
    href: "/style-guides/dressing-after-weight-gain",
    title: "Dressing After Weight Gain",
    description: "Wardrobe guidance for body changes without defaulting to hiding.",
  },
  {
    href: "/style-guides/fashion-40s-india",
    title: "Fashion for Indian Women in Their 40s",
    description: "Polished wardrobe strategy for work, family events, and everyday life.",
  },
  {
    href: "/style-guides/modest-professional-fashion-india",
    title: "Modest Professional Fashion",
    description: "Office-ready modest dressing that still has structure and polish.",
  },
];

export const comparisonLinks: SeoLink[] = [
  {
    href: "/vs/online-vs-inperson-styling",
    title: "Online vs In-Person Styling",
    description: "What online styling can do well, and where in-person still has an edge.",
  },
  {
    href: "/vs/iconik-vs-styling-apps",
    title: "Iconik vs Styling Apps",
    description: "Compare automated recommendations with a human-reviewed, consultation-led styling service.",
  },
  {
    href: "/vs/style-blueprint-vs-quiz",
    title: "Style Blueprint vs Style Quiz",
    description: "The difference between a foundational framework and a lightweight quiz result.",
  },
  {
    href: "/vs/chromatic-harmony-mapping-vs-seasonal-colour-analysis",
    title: "CHM vs Seasonal Colour Analysis",
    description: "How Iconik's Indian-skin-tone colour system compares with imported seasonal analysis.",
  },
];

export const toolLinks: SeoLink[] = [
  {
    href: "/free-colour-analysis-quiz",
    title: "Free Colour Analysis Quiz",
    description: "The current Color Mirror quiz for fast undertone and colour-season discovery.",
  },
  ...leadMagnetLinks,
];

export const colourAnalysisLinks: SeoLink[] = [
  {
    href: "/colour-analysis",
    title: "Colour Analysis for Indian Skin Tones",
    description: "The pillar guide covering undertones, palettes, and why generic colour advice breaks down.",
  },
  {
    href: "/colour-analysis/how-to-find-undertone",
    title: "How to Find Your Undertone",
    description: "How to run controlled at-home colour comparisons and avoid relying on a single clue.",
  },
  {
    href: "/colour-analysis/warm-cool-neutral-undertone-india",
    title: "Warm, Cool, or Neutral Undertone",
    description: "A direct explainer for the three undertone families in the Indian context.",
  },
  {
    href: "/colour-analysis/warm-undertone",
    title: "Warm Undertone",
    description: "Earthy, golden, and warm palettes for Indian skin with warm undertones.",
  },
  {
    href: "/colour-analysis/cool-undertone",
    title: "Cool Undertone",
    description: "Jewel tones, blue-based colours, and cool palette guidance.",
  },
  {
    href: "/colour-analysis/neutral-undertone",
    title: "Neutral Undertone",
    description: "How to choose balanced colours when both warm and cool shades can work.",
  },
  {
    href: "/colour-analysis/indian-skin-tones",
    title: "Indian Skin Tone Colour Guide",
    description: "How to adapt colour systems to Indian skin-depth, undertone and wardrobe diversity.",
  },
  {
    href: "/colour-analysis/best-colours-dusky-skin",
    title: "Best Colours for Dusky Skin",
    description: "Palette guidance for deeper Indian complexions and undertone depth.",
  },
  {
    href: "/colour-analysis/best-colours-wheatish-skin-india",
    title: "Best Colours for Wheatish Skin",
    description: "Colour choices for one of the most common Indian skin tone ranges.",
  },
  {
    href: "/colour-analysis/best-colours-fair-skin-india",
    title: "Best Colours for Fair Skin",
    description: "How fair Indian skin differs from Western fair-skin palette advice.",
  },
  {
    href: "/colour-analysis/saree-colours-by-undertone",
    title: "Saree Colours by Undertone",
    description: "Ethnic occasion colour choices mapped to warm, cool, and neutral undertones.",
  },
  {
    href: "/colour-analysis/seasonal-colour-analysis-india",
    title: "Seasonal Colour Analysis India",
    description: "A balanced guide to where seasonal language helps and where simplified typing becomes limiting.",
  },
  {
    href: "/colour-analysis/olive-skin-india",
    title: "Olive Skin India",
    description: "Colour guidance for olive undertones, muted depth, and common misreads.",
  },
  {
    href: "/colour-analysis/colour-analysis-for-indian-weddings",
    title: "Indian Wedding Colour Analysis",
    description: "How to choose wedding colours around undertone, depth, and occasion context.",
  },
  {
    href: "/colour-analysis/dark-skin-colour-guide-india",
    title: "Dark Skin Colour Guide",
    description: "Colour recommendations for deep Indian skin tones and contrast levels.",
  },
];

export const bodyTypeLinks: SeoLink[] = [
  {
    href: "/body-type-styling",
    title: "Body Type Styling",
    description: "The core body-shape styling cluster for Indian women.",
  },
  {
    href: "/body-type-styling/apple-body-shape-india",
    title: "Apple Body Shape Styling",
    description: "Use shoulder direction, drape, hem placement, and vertical line without hiding the body.",
  },
  {
    href: "/body-type-styling/pear-body-shape-india",
    title: "Pear Body Shape Styling",
    description: "Test neckline, top hem, waistband fit, and lower-body fall one variable at a time.",
  },
  {
    href: "/body-type-styling/rectangle-body-shape-india",
    title: "Rectangle Body Shape India",
    description: "Waist definition and proportion guidance for rectangle frames.",
  },
  {
    href: "/body-type-styling/hourglass",
    title: "Hourglass Body Type",
    description: "How to preserve waist definition without overbuilding volume.",
  },
  {
    href: "/body-type-styling/plus-size",
    title: "Plus Size Body Type Styling",
    description: "Plus-size styling guidance centered on proportion and structure.",
  },
  {
    href: "/body-type-styling/heavy-arms-styling",
    title: "Heavy Arms Styling",
    description: "Sleeve, shoulder, and fabric guidance for arm-conscious dressing.",
  },
  {
    href: "/body-type-styling/how-to-dress-tummy",
    title: "How to Dress a Tummy",
    description: "Silhouettes and garment structures that avoid midsection cling.",
  },
  {
    href: "/body-type-styling/short-torso-styling",
    title: "Short Torso Styling",
    description: "How to adjust rise, waist placement, and vertical proportion.",
  },
  {
    href: "/body-type-styling/how-to-look-taller-clothing",
    title: "How to Look Taller with Clothing",
    description: "Vertical-line styling principles for petite and shorter frames.",
  },
  {
    href: "/body-type-styling/inverted-triangle",
    title: "Inverted Triangle Body Type",
    description: "Shoulder-balancing guidance for wider upper-body proportions.",
  },
  {
    href: "/body-type-styling/petite-india",
    title: "Petite Styling India",
    description: "Scale, length, and vertical-line advice for petite Indian women.",
  },
];

export const faqLinks: SeoLink[] = [
  {
    href: "/faq/how-much-does-personal-stylist-cost-india",
    title: "How Much Does a Personal Stylist Cost in India?",
    description: "A service-type breakdown for price-sensitive search intent.",
  },
  {
    href: "/faq/what-is-iconik-style-blueprint",
    title: "What Is the Iconik Style Blueprint?",
    description: "The best entry page for users who need the offer explained clearly.",
  },
  {
    href: "/faq/how-to-build-capsule-wardrobe-india",
    title: "How to Build a Capsule Wardrobe",
    description: "A practical answer page with strong informational intent.",
  },
  {
    href: "/faq/warm-or-cool-undertone",
    title: "Warm or Cool Undertone",
    description: "A quick answer for users trying to classify their undertone.",
  },
  {
    href: "/faq/colour-analysis-at-home",
    title: "Can I Do Colour Analysis at Home?",
    description: "A practical answer for at-home colour testing searches.",
  },
  {
    href: "/faq/colour-analysis-dark-skin",
    title: "Colour Analysis for Dark Skin",
    description: "A direct answer for deeper skin tone colour-analysis concerns.",
  },
  {
    href: "/faq/what-is-seasonal-colour-analysis",
    title: "What Is Seasonal Colour Analysis?",
    description: "A comparison-friendly explanation of seasonal colour systems.",
  },
  {
    href: "/faq/body-shape-vs-body-type",
    title: "Body Shape vs Body Type",
    description: "Clarifies two common search terms around silhouette analysis.",
  },
  {
    href: "/faq/most-common-body-type-india",
    title: "Most Common Body Type in India",
    description: "A short answer page for common body-type search intent.",
  },
  {
    href: "/faq/neckline-guide-face-shape-india",
    title: "Neckline Guide by Face Shape",
    description: "Face-shape guidance for necklines and visual balance.",
  },
  {
    href: "/faq/how-to-dress-for-job-interview-india",
    title: "How to Dress for a Job Interview",
    description: "Interview outfit guidance for the Indian professional context.",
  },
  {
    href: "/faq/what-colours-make-you-look-slimmer-india",
    title: "What Colours Make You Look Slimmer?",
    description: "Colour, contrast, and visual-line guidance for slimming effects.",
  },
  {
    href: "/faq/capsule-wardrobe-how-many-outfits",
    title: "How Many Outfits in a Capsule Wardrobe?",
    description: "A concise answer for capsule wardrobe sizing and outfit combinations.",
  },
  {
    href: "/faq/does-black-make-you-look-slimmer",
    title: "Does Black Make You Look Slimmer?",
    description: "A practical answer about black clothing, contrast, and slimming visual lines.",
  },
  {
    href: "/faq/neckline-round-face",
    title: "Best Neckline for a Round Face",
    description: "Face-shape guidance for choosing necklines that add length and balance.",
  },
];

export const cityLinks: SeoLink[] = [
  { href: "/personal-stylist-mumbai", title: "Mumbai", description: "Service page for Mumbai." },
  { href: "/personal-stylist-delhi", title: "Delhi", description: "Service page for Delhi." },
  { href: "/personal-stylist-bangalore", title: "Bangalore", description: "Service page for Bangalore." },
  { href: "/personal-stylist-hyderabad", title: "Hyderabad", description: "Service page for Hyderabad." },
  { href: "/personal-stylist-chennai", title: "Chennai", description: "Service page for Chennai." },
  { href: "/personal-stylist-pune", title: "Pune", description: "Service page for Pune." },
];

export const retiredCityPaths = [
  "/personal-stylist-ahmedabad",
  "/personal-stylist-bhopal",
  "/personal-stylist-chandigarh",
  "/personal-stylist-coimbatore",
  "/personal-stylist-indore",
  "/personal-stylist-jaipur",
  "/personal-stylist-kochi",
  "/personal-stylist-kolkata",
  "/personal-stylist-lucknow",
  "/personal-stylist-mysuru",
  "/personal-stylist-nagpur",
  "/personal-stylist-patna",
  "/personal-stylist-surat",
  "/personal-stylist-thiruvananthapuram",
  "/personal-stylist-vadodara",
  "/personal-stylist-visakhapatnam",
];

export const footerExploreGroups = [
  {
    title: "Start Here",
    links: [
      {
        href: "/how-it-works",
        title: "How It Works",
        description: "The full Iconik process, from intake to delivered Blueprint.",
      },
      {
        href: "/pricing",
        title: "Pricing",
        description: "A clear breakdown of the main styling offer and what is included.",
      },
      {
        href: "/results",
        title: "Results",
        description: "What changes clients typically get from a Blueprint-led wardrobe strategy.",
      },
    ],
  },
  {
    title: "Learn",
    links: [
      {
        href: "/colour-analysis",
        title: "Colour Analysis",
        description: "Undertones, palettes, and Indian skin tone guidance.",
      },
      {
        href: "/body-type-styling",
        title: "Body Type Styling",
        description: "The silhouette and body-shape pillar.",
      },
      {
        href: "/faq",
        title: "FAQ",
        description: "Fast answers to the most common pre-purchase questions.",
      },
      {
        href: "/tools",
        title: "Free Style Tools",
        description: "Interactive diagnostics for colour, body shape, proportions, and face architecture.",
      },
    ],
  },
  {
    title: "Compare",
    links: [
      {
        href: "/style-guides",
        title: "Style Guides",
        description: "Practical wardrobe advice for work, weddings, and everyday dressing.",
      },
      {
        href: "/vs",
        title: "Comparisons",
        description: "Decision pages for users comparing methods and alternatives.",
      },
      {
        href: "/methodology",
        title: "Methodology",
        description: "The three core Iconik systems behind the recommendations.",
      },
    ],
  },
  {
    title: "Popular Guides",
    links: [
      bodyTypeLinks[1],
      bodyTypeLinks[5],
      colourAnalysisLinks[1],
    ],
  },
  {
    title: "City Pages",
    links: cityLinks.slice(0, 3),
  },
];

export const coreCommercialPaths = [
  "/",
  "/about",
  "/contact",
  "/how-it-works",
  "/pricing",
  "/results",
  "/what-is-iconik",
  "/who-is-iconik-for",
  "/globe",
  "/man",
  "/iconik-club/join",
  "/monthly",
  "/monthly/indian",
  "/personal-stylist-india",
  "/online-personal-stylist-india",
  "/body-shape-consultation-india",
  "/colour-analysis-india",
  "/wardrobe-audit-india",
  "/capsule-wardrobe-service-india",
  "/personal-shopper-vs-personal-stylist-india",
  "/free-colour-analysis-quiz",
  "/tools",
  "/terms",
  "/privacy-policy",
  "/refund-policy",
  "/shipping",
];

export const hubPaths = [
  "/blog",
  "/body-type-styling",
  "/colour-analysis",
  "/faq",
  "/methodology",
  "/style-guides",
  "/vs",
  "/glossary/personal-styling-terms-india",
];

export const blogLinks: SeoLink[] = [
  {
    href: "/blog/is-personal-stylist-worth-it-india",
    title: "Is a Personal Stylist Worth It in India?",
    description: "A practical evaluation of when styling help is worth paying for.",
  },
];

export const seoSitemapPaths = Array.from(
  new Set([
    ...coreCommercialPaths,
    ...hubPaths,
    ...blogLinks.map((link) => link.href),
    ...methodologyLinks.map((link) => link.href),
    ...styleGuideLinks.map((link) => link.href),
    ...comparisonLinks.map((link) => link.href),
    ...leadMagnetLinks.map((link) => link.href),
    ...colourAnalysisLinks.map((link) => link.href),
    ...bodyTypeLinks.map((link) => link.href),
    ...faqLinks.map((link) => link.href),
    ...cityLinks.map((link) => link.href),
  ]),
);

export const redirectSeoPages: SeoPageInventoryEntry[] = [
  ...retiredCityPaths.map((path) => ({
    path,
    status: "redirect" as const,
    redirectTo: "/personal-stylist-india",
  })),
  { path: "/body-type-styling/apple", status: "redirect", redirectTo: "/body-type-styling/apple-body-shape-india" },
  { path: "/body-type-styling/pear", status: "redirect", redirectTo: "/body-type-styling/pear-body-shape-india" },
  { path: "/body-type-styling/rectangle", status: "redirect", redirectTo: "/body-type-styling/rectangle-body-shape-india" },
  { path: "/body-type-styling/rectangle-india", status: "redirect", redirectTo: "/body-type-styling/rectangle-body-shape-india" },
  { path: "/body-type-styling/hourglass-india", status: "redirect", redirectTo: "/body-type-styling/hourglass" },
  { path: "/body-type-styling/plus-size-india", status: "redirect", redirectTo: "/body-type-styling/plus-size" },
  { path: "/arms", status: "redirect", redirectTo: "/body-type-styling/heavy-arms-styling" },
  { path: "/tummy", status: "redirect", redirectTo: "/body-type-styling/how-to-dress-tummy" },
  { path: "/plus-size", status: "redirect", redirectTo: "/body-type-styling/plus-size" },
  { path: "/modest", status: "redirect", redirectTo: "/style-guides/modest-professional-fashion-india" },
  { path: "/iconik-methodology", status: "redirect", redirectTo: "/methodology" },
  {
    path: "/blog/what-is-geometric-silhouette-profiling",
    status: "redirect",
    redirectTo: "/methodology/geometric-silhouette-profiling",
  },
  {
    path: "/blog/what-is-chromatic-harmony-mapping",
    status: "redirect",
    redirectTo: "/methodology/chromatic-harmony-mapping",
  },
  {
    path: "/blog/what-is-facial-architecture-analysis",
    status: "redirect",
    redirectTo: "/methodology/facial-architecture-analysis",
  },
  { path: "/uae", status: "redirect", redirectTo: "/globe" },
  { path: "/au", status: "redirect", redirectTo: "/globe" },
  { path: "/us", status: "redirect", redirectTo: "/globe" },
  { path: "/global", status: "redirect", redirectTo: "/globe" },
];

export const noindexSeoPages: SeoPageInventoryEntry[] = [
  { path: "/checkout", status: "noindex" },
  { path: "/checkout/basic-success", status: "noindex" },
  { path: "/checkout/success", status: "noindex" },
  { path: "/checkout-monthly", status: "noindex" },
  { path: "/closet", status: "noindex" },
  { path: "/dashboard", status: "noindex" },
  { path: "/iconik-club/admin", status: "noindex" },
  { path: "/iconik-club/client", status: "noindex" },
  { path: "/iconik-club/join/success", status: "noindex" },
  { path: "/iconik-club/preview", status: "noindex" },
  { path: "/man/admin", status: "noindex" },
  { path: "/man/checkout", status: "noindex" },
  { path: "/man/intake", status: "noindex" },
  { path: "/man/report", status: "noindex" },
  { path: "/stylist/admin", status: "noindex" },
  { path: "/stylist/checkout", status: "noindex" },
  { path: "/stylist/intake", status: "noindex" },
  { path: "/stylist/report", status: "noindex" },
  { path: "/stylist/style-score", status: "noindex" },
  { path: "/stylist/style-score/scan", status: "noindex" },
  { path: "/stylist/style-score/result", status: "noindex" },
  { path: "/offer-2699", status: "noindex" },
  { path: "/offer-2699/checkout", status: "noindex" },
  { path: "/global/checkout", status: "noindex" },
  { path: "/global/intake", status: "noindex" },
  { path: "/global/thankyou", status: "noindex" },
  { path: "/globe/admin", status: "noindex" },
  { path: "/globe/checkout", status: "noindex" },
  { path: "/globe/intake", status: "noindex" },
  { path: "/globe/report", status: "noindex" },
  { path: "/globe/thankyou", status: "noindex" },
  { path: "/au/checkout", status: "noindex" },
  { path: "/au/intake", status: "noindex" },
  { path: "/au/thankyou", status: "noindex" },
  { path: "/uae/checkout", status: "noindex" },
  { path: "/uae/oto", status: "noindex" },
  { path: "/uae/quiz", status: "noindex" },
  { path: "/us/checkout", status: "noindex" },
  { path: "/monthly/checkout", status: "noindex" },
  { path: "/monthly/indian/checkout", status: "noindex" },
];

export const seoPageInventory: SeoPageInventoryEntry[] = [
  ...seoSitemapPaths.map((path) => ({
    path,
    status: "index" as const,
    changeFrequency: path === "/" ? "weekly" as const : "monthly" as const,
    priority:
      path === "/" ? 1 :
      coreCommercialPaths.includes(path) ? 0.85 :
      hubPaths.includes(path) ? 0.8 :
      cityLinks.some((link) => link.href === path) ? 0.72 :
      0.65,
  })),
  ...redirectSeoPages,
  ...noindexSeoPages,
];

export const indexedSeoPages = seoPageInventory.filter((entry) => entry.status === "index");
