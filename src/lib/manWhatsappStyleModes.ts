export type ManWhatsappStyleFamily =
  | 'refined_classic'
  | 'street_youth'
  | 'rugged_utility'
  | 'expressive_evening'
  | 'sport_leisure'
  | 'indian_cultural';

export interface ManWhatsappStyleMode {
  id: string;
  name: string;
  family: ManWhatsappStyleFamily;
  desiredPerception: string;
  formula: string;
  avoid: string;
  cues: string[];
  contexts: string[];
  classicLibraryCompatible: boolean;
}

export interface ResolvedManWhatsappStylePortfolio {
  modes: ManWhatsappStyleMode[];
  confident: boolean;
  evidence: string[];
}

export const MAN_WHATSAPP_STYLE_MODES: readonly ManWhatsappStyleMode[] = [
  {
    id: 'heritage_gentleman', name: 'Heritage Gentleman', family: 'refined_classic',
    desiredPerception: 'established, tasteful and naturally polished',
    formula: 'collared foundation + traditional knit or light jacket + classic trousers + brown leather footwear',
    avoid: 'distressed pieces, loud logos, spray-on fits and trend-heavy sneakers',
    cues: ['heritage gentleman', 'ralph lauren', 'old money', 'preppy', 'country club', 'ivy style', 'classic gentleman'],
    contexts: ['work', 'office', 'family', 'brunch', 'day'], classicLibraryCompatible: true,
  },
  {
    id: 'modern_scholar', name: 'Modern Scholar', family: 'refined_classic',
    desiredPerception: 'intelligent, cultured and quietly interesting',
    formula: 'rugby, cardigan or Oxford shirt + relaxed pleated trousers + loafers or derbies',
    avoid: 'costume-like bow ties, corporate chinos, running shoes and overly matched prep',
    cues: ['modern scholar', 'nerdy', 'intellectual', 'academic', 'bookish', 'japanese ivy', 'black ivy', 'cultured'],
    contexts: ['work', 'office', 'cafe', 'coffee', 'day'], classicLibraryCompatible: true,
  },
  {
    id: 'understated_authority', name: 'Understated Authority', family: 'refined_classic',
    desiredPerception: 'successful, composed and expensive without looking flashy',
    formula: 'soft tailoring or fine knit + pleated trousers + refined loafers + minimal branding',
    avoid: 'bright logos, shiny fabrics, rigid corporate suits and obvious trend pieces',
    cues: ['understated authority', 'quiet luxury', 'soft tailoring', 'successful', 'founder look', 'tech founder', 'expensive looking'],
    contexts: ['work', 'office', 'meeting', 'business', 'investor'], classicLibraryCompatible: true,
  },
  {
    id: 'modern_minimalist', name: 'Modern Minimalist', family: 'refined_classic',
    desiredPerception: 'clean, intelligent and intentional',
    formula: 'solid top + straight or relaxed trousers + clean overshirt or jacket + minimal footwear',
    avoid: 'busy patterns, excess accessories, fussy layering and decorative details',
    cues: ['modern minimalist', 'minimalist', 'minimal', 'clean lines', 'monochrome', 'simple and clean', 'no accessories'],
    contexts: ['work', 'day', 'casual', 'travel'], classicLibraryCompatible: true,
  },
  {
    id: 'riviera_sophisticate', name: 'Riviera Sophisticate', family: 'refined_classic',
    desiredPerception: 'relaxed, desirable and well travelled',
    formula: 'knitted polo or linen shirt + cream or navy relaxed trousers + loafers, moccasins or sandals',
    avoid: 'loud tropical prints, sports shorts, chunky runners and skinny linen trousers',
    cues: ['riviera', 'mediterranean', 'resort', 'coastal', 'nautical', 'holiday chic', 'summer luxury'],
    contexts: ['holiday', 'resort', 'brunch', 'date', 'travel'], classicLibraryCompatible: true,
  },
  {
    id: 'elevated_streetwear', name: 'Elevated Streetwear', family: 'street_youth',
    desiredPerception: 'youthful, current and relaxed without looking sloppy',
    formula: 'boxy or fitted hero top + baggy jeans or relaxed trousers + bomber or overshirt + clean statement sneakers',
    avoid: 'random hype pieces, excessive logos, skinny bottoms and over-accessorising',
    cues: ['elevated streetwear', 'streetwear', 'baggy jeans', 'wide leg jeans', 'wide-leg jeans', 'youthful', 'trendy', 'boxy tee', 'oversized tee'],
    contexts: ['casual', 'coffee', 'day', 'weekend', 'date'], classicLibraryCompatible: false,
  },
  {
    id: 'graphic_culture', name: 'Graphic Culture', family: 'street_youth',
    desiredPerception: 'expressive, culturally aware and personal',
    formula: 'one strong graphic or sports top + baggy denim or cargos + statement sneakers + restrained layers',
    avoid: 'several competing graphics, formal shoes and unrelated accessories',
    cues: ['graphic culture', 'graphic tee', 'graphic t-shirt', 'band tee', 'football jersey', 'sports jersey', 'vintage jersey'],
    contexts: ['casual', 'concert', 'festival', 'day'], classicLibraryCompatible: false,
  },
  {
    id: 'modern_skater', name: 'Modern Skater', family: 'street_youth',
    desiredPerception: 'effortless, youthful and slightly rebellious',
    formula: 'boxy tee or hoodie + loose denim + overshirt + low-profile skate shoes',
    avoid: 'formal tailoring, polished loafers, skinny denim and too many skate references',
    cues: ['modern skater', 'skater', 'skate style', 'vans', 'loose denim', 'skate shoes', 'beanie'],
    contexts: ['casual', 'concert', 'coffee', 'day'], classicLibraryCompatible: false,
  },
  {
    id: 'y2k_street', name: 'Y2K Street', family: 'street_youth',
    desiredPerception: 'trend-led, playful and fashion aware',
    formula: 'fitted or layered top + oversized cargos or washed wide denim + chunky or technical footwear',
    avoid: 'mixing every Y2K signal at once, costume styling and tight trousers',
    cues: ['y2k', 'oversized cargos', 'baggy cargos', 'washed denim', 'chunky shoes', 'technical sunglasses'],
    contexts: ['casual', 'party', 'concert', 'day'], classicLibraryCompatible: false,
  },
  {
    id: 'luxury_street', name: 'Luxury Street', family: 'street_youth',
    desiredPerception: 'expensive, modern and relaxed',
    formula: 'premium oversized basic + wide trousers + leather bomber or refined outerwear + sleek sneakers',
    avoid: 'large luxury logos, distressed overload and cheap-looking shiny fabrics',
    cues: ['luxury street', 'luxury streetwear', 'leather bomber', 'premium oversized', 'high end streetwear'],
    contexts: ['date', 'party', 'travel', 'casual'], classicLibraryCompatible: false,
  },
  {
    id: 'modern_wrangler', name: 'Modern Wrangler', family: 'rugged_utility',
    desiredPerception: 'rugged, independent and distinctive',
    formula: 'one Western or suede hero piece + substantial denim or earthy trousers + leather boots',
    avoid: 'cowboy costume signals, giant buckles, fringe and multiple Western pieces',
    cues: ['modern wrangler', 'western style', 'western shirt', 'cowboy', 'bootcut jeans', 'pointed boots', 'vintage americana'],
    contexts: ['casual', 'date', 'concert', 'travel'], classicLibraryCompatible: false,
  },
  {
    id: 'refined_workwear', name: 'Refined Workwear', family: 'rugged_utility',
    desiredPerception: 'masculine, practical and put together',
    formula: 'heavyweight tee or shirt + chore jacket + relaxed denim or canvas trousers + sturdy shoes',
    avoid: 'dirty-looking distressing, worksite cosplay and excessive utility pockets',
    cues: ['refined workwear', 'workwear', 'chore jacket', 'canvas trousers', 'moc toe', 'heritage workwear'],
    contexts: ['casual', 'weekend', 'travel', 'day'], classicLibraryCompatible: false,
  },
  {
    id: 'urban_utility', name: 'Urban Utility', family: 'rugged_utility',
    desiredPerception: 'functional, modern and city ready',
    formula: 'technical overshirt + heavyweight base + relaxed cargos + functional sneakers or boots',
    avoid: 'military costume styling, too many pockets and mismatched technical fabrics',
    cues: ['urban utility', 'utility style', 'technical overshirt', 'modular', 'technical cargos', 'functional style'],
    contexts: ['travel', 'casual', 'day', 'concert'], classicLibraryCompatible: false,
  },
  {
    id: 'gorpcore_explorer', name: 'Gorpcore Explorer', family: 'rugged_utility',
    desiredPerception: 'adventurous, capable and contemporary',
    formula: 'technical jacket or fleece + hiking-inspired trousers + trail sneakers + one performance accessory',
    avoid: 'wearing full hiking kit in the city and mixing unrelated outdoor colours',
    cues: ['gorpcore', 'trail sneakers', 'hiking style', 'technical jacket', 'fleece', 'outdoor style'],
    contexts: ['travel', 'outdoor', 'casual'], classicLibraryCompatible: false,
  },
  {
    id: 'after_dark_icon', name: 'After-Dark Icon', family: 'expressive_evening',
    desiredPerception: 'magnetic, confident and slightly dangerous',
    formula: 'dark fitted or fluid inner layer + statement jacket + wide dark trousers + sharp boots or loafers',
    avoid: 'office shirts, business ties, white running shoes and competing jewellery',
    cues: ['after-dark icon', 'after dark', 'seductive', 'magnetic', 'playboy', 'sexy', 'night out', 'dark luxury'],
    contexts: ['night', 'date', 'bar', 'party', 'evening'], classicLibraryCompatible: true,
  },
  {
    id: 'modern_rock_rebel', name: 'Modern Rock Rebel', family: 'expressive_evening',
    desiredPerception: 'rebellious, masculine and performance ready',
    formula: 'band tee or dark open collar + faded black denim + leather jacket + boots',
    avoid: 'costume studs, excessive jewellery and pristine corporate pieces',
    cues: ['rock rebel', 'rock style', 'leather jacket', 'band tee', 'faded black denim', 'rockstar'],
    contexts: ['night', 'concert', 'party', 'date'], classicLibraryCompatible: false,
  },
  {
    id: 'contemporary_grunge', name: 'Contemporary Grunge', family: 'expressive_evening',
    desiredPerception: 'creative, undone and intentional',
    formula: 'distressed knit or layered tee + washed loose denim + oversized shirt + substantial footwear',
    avoid: 'looking unwashed, random tears and shapeless head-to-toe volume',
    cues: ['grunge', 'distressed knit', 'layered tees', 'washed black', 'oversized flannel'],
    contexts: ['concert', 'casual', 'night'], classicLibraryCompatible: false,
  },
  {
    id: 'avant_garde_creative', name: 'Avant-Garde Creative', family: 'expressive_evening',
    desiredPerception: 'directional, artistic and unconventional',
    formula: 'unusual proportion or asymmetric layer + controlled base + directional footwear',
    avoid: 'adding novelty to every piece and sacrificing wearability',
    cues: ['avant garde', 'avant-garde', 'asymmetric', 'directional', 'experimental fashion', 'runway'],
    contexts: ['creative', 'event', 'night'], classicLibraryCompatible: false,
  },
  {
    id: 'modern_maximalist', name: 'Modern Maximalist', family: 'expressive_evening',
    desiredPerception: 'bold, expressive and memorable',
    formula: 'one bold pattern or colour hero + simpler supporting pieces + intentional accessories',
    avoid: 'several unrelated statements, uncontrolled colour and accessory overload',
    cues: ['maximalist', 'bold patterns', 'expressive colour', 'statement outfit', 'colourful style'],
    contexts: ['party', 'wedding', 'event', 'night'], classicLibraryCompatible: false,
  },
  {
    id: 'sport_luxe', name: 'Sport Luxe', family: 'sport_leisure',
    desiredPerception: 'athletic, polished and expensive',
    formula: 'refined athletic hero + clean relaxed trouser or premium track pant + sophisticated sneakers',
    avoid: 'mismatched gym kit, shiny synthetics and excessive team branding',
    cues: ['sport luxe', 'sporty luxury', 'premium tracksuit', 'athletic but polished'],
    contexts: ['travel', 'casual', 'day'], classicLibraryCompatible: false,
  },
  {
    id: 'retro_sport', name: 'Retro Sport', family: 'sport_leisure',
    desiredPerception: 'nostalgic, energetic and culturally current',
    formula: 'rugby, football jersey or track jacket + relaxed denim or track trousers + vintage sneakers',
    avoid: 'full match kit away from sport and mixing several team references',
    cues: ['retro sport', 'football shirt', 'football jersey', 'rugby jersey', 'track jacket', 'vintage sneakers'],
    contexts: ['casual', 'football', 'concert', 'day'], classicLibraryCompatible: false,
  },
  {
    id: 'minimal_athleisure', name: 'Minimal Athleisure', family: 'sport_leisure',
    desiredPerception: 'clean, capable and understated',
    formula: 'tonal performance top + refined jogger or short + technical layer + understated sneakers',
    avoid: 'bodybuilding fits, neon accents, shiny fabric and random gym accessories',
    cues: ['minimal athleisure', 'athleisure', 'tonal gym', 'minimal gym', 'refined joggers', 'gym outfit'],
    contexts: ['gym', 'training', 'travel', 'casual'], classicLibraryCompatible: false,
  },
  {
    id: 'indian_modernist', name: 'Indian Modernist', family: 'indian_cultural',
    desiredPerception: 'culturally confident, contemporary and restrained',
    formula: 'tonal or textured kurta + contemporary trouser + optional clean Nehru jacket + modern mojris or loafers',
    avoid: 'shiny fabric, excessive embroidery, loud contrast jackets and kurta-jeans combinations',
    cues: ['indian modernist', 'modern indian', 'contemporary kurta', 'minimal kurta', 'restrained indianwear'],
    contexts: ['wedding', 'festive', 'diwali', 'pooja', 'puja', 'sangeet'], classicLibraryCompatible: false,
  },
  {
    id: 'indian_heritage_gentleman', name: 'Indian Heritage Gentleman', family: 'indian_cultural',
    desiredPerception: 'traditional, distinguished and rooted',
    formula: 'rich heritage textile + classic Indian silhouette + disciplined embroidery + traditional footwear',
    avoid: 'cheap shine, clashing embroidery and trend-led Western accessories',
    cues: ['indian heritage', 'traditional indian', 'heritage kurta', 'classic sherwani', 'sabyasachi style'],
    contexts: ['wedding', 'festive', 'diwali', 'reception'], classicLibraryCompatible: false,
  },
  {
    id: 'indian_after_dark', name: 'Indian After-Dark', family: 'indian_cultural',
    desiredPerception: 'dark, sophisticated and magnetic',
    formula: 'black, oxblood or midnight kurta or bandhgala + tonal relaxed trousers + sharp dark footwear',
    avoid: 'bright groom-like contrast, heavy sparkle and office-style shoes',
    cues: ['indian after dark', 'black kurta', 'dark bandhgala', 'oxblood kurta', 'dark indianwear'],
    contexts: ['reception', 'sangeet', 'wedding', 'night'], classicLibraryCompatible: false,
  },
  {
    id: 'indian_experimentalist', name: 'Indian Experimentalist', family: 'indian_cultural',
    desiredPerception: 'fashion-forward, cultural and individual',
    formula: 'asymmetric Indian layer + draped or wide trouser + cropped jacket or directional footwear',
    avoid: 'uncontrolled draping, costume styling and too many statement details',
    cues: ['indian experimentalist', 'experimental indian', 'asymmetric kurta', 'draped trousers', 'cropped nehru'],
    contexts: ['wedding', 'fashion event', 'sangeet'], classicLibraryCompatible: false,
  },
] as const;

function includesCue(haystack: string, cue: string) {
  return haystack.includes(cue.toLowerCase());
}

function contextWords(message: string) {
  const normalized = message.toLowerCase();
  return MAN_WHATSAPP_STYLE_MODES.flatMap(mode => mode.contexts.filter(context => normalized.includes(context)));
}

function contextualDefaultModeIds(message: string) {
  const normalized = message.toLowerCase();
  if (/\b(?:wedding|sangeet|reception|diwali|pooja|puja|festive)\b/.test(normalized)) return ['indian_modernist'];
  if (/\b(?:gym|workout|training)\b/.test(normalized)) return ['minimal_athleisure'];
  if (/\b(?:football|soccer)\b/.test(normalized)) return ['retro_sport'];
  if (/\b(?:investor|boardroom|client meeting|business meeting|conference)\b/.test(normalized)) return ['understated_authority'];
  if (/\b(?:office|work|interview|presentation)\b/.test(normalized)) return ['modern_scholar', 'understated_authority'];
  if (/\b(?:date|dinner|bar|cocktail|night out|evening party)\b/.test(normalized)) return ['after_dark_icon'];
  if (/\b(?:holiday|resort|beach|destination wedding)\b/.test(normalized)) return ['riviera_sophisticate'];
  if (/\b(?:concert|festival|gig)\b/.test(normalized)) return ['graphic_culture', 'modern_rock_rebel'];
  if (/\b(?:airport|travel|flight)\b/.test(normalized)) return ['urban_utility'];
  return [];
}

export function resolveManWhatsappStylePortfolio(input: {
  message: string;
  profileText?: string;
  memories?: string[];
  conversationReference?: string;
}): ResolvedManWhatsappStylePortfolio {
  const sources = [
    { label: 'current request', text: input.message.toLowerCase(), weight: 5 },
    { label: 'saved preference', text: (input.memories ?? []).join(' ').toLowerCase(), weight: 3 },
    { label: 'client profile', text: (input.profileText ?? '').toLowerCase(), weight: 2 },
    { label: 'recent outfit', text: (input.conversationReference ?? '').toLowerCase(), weight: 1 },
  ];
  const activeContexts = contextWords(input.message);
  const hasExplicitStyleCue = MAN_WHATSAPP_STYLE_MODES.some(mode => (
    mode.cues.some(cue => includesCue(input.message.toLowerCase(), cue))
  ));
  const persistentStyleText = `${(input.memories ?? []).join(' ')} ${input.profileText ?? ''}`.toLowerCase();
  const hasPersistentStyleCue = MAN_WHATSAPP_STYLE_MODES.some(mode => (
    mode.cues.some(cue => includesCue(persistentStyleText, cue))
  ));
  const contextualDefaults = !hasExplicitStyleCue && hasPersistentStyleCue
    ? contextualDefaultModeIds(input.message)
    : [];
  const ranked = MAN_WHATSAPP_STYLE_MODES.map(mode => {
    let score = 0;
    const evidence: string[] = [];
    for (const source of sources) {
      const matches = mode.cues.filter(cue => includesCue(source.text, cue));
      if (!matches.length) continue;
      score += source.weight * Math.min(matches.length, 2);
      evidence.push(`${source.label}: ${matches.slice(0, 2).join(', ')}`);
    }
    if (activeContexts.some(context => mode.contexts.includes(context))) score += 1;
    const contextualDefaultIndex = contextualDefaults.indexOf(mode.id);
    if (contextualDefaultIndex >= 0) {
      score += 8 - contextualDefaultIndex;
      evidence.push('occasion mode');
    }
    return { mode, score, evidence };
  }).filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.mode.name.localeCompare(b.mode.name));

  const strongest = ranked[0];
  if (!strongest || strongest.score < 3) return { modes: [], confident: false, evidence: [] };
  const modes = [strongest];
  const secondary = ranked[1];
  const secondaryHasPersistentEvidence = secondary?.evidence.some(evidence => (
    evidence.startsWith('saved preference:') || evidence.startsWith('client profile:')
  ));
  if (
    secondary
    && secondary.score >= 3
    && (secondaryHasPersistentEvidence || secondary.score >= strongest.score * 0.6)
    && secondary.mode.family !== strongest.mode.family
  ) {
    modes.push(secondary);
  }
  return {
    modes: modes.map(item => item.mode),
    confident: strongest.score >= 5,
    evidence: modes.flatMap(item => item.evidence),
  };
}

export function formatManWhatsappStylePortfolio(portfolio: ResolvedManWhatsappStylePortfolio) {
  if (!portfolio.modes.length) {
    return `STYLE DIRECTION IS UNCLEAR
Ask one natural question before recommending an outfit. Offer 3-4 plain-language directions suited to the occasion; do not list internal identity names unless the client asks.`;
  }
  const modeLines = portfolio.modes.map((mode, index) => `${index === 0 ? 'PRIMARY' : 'SECONDARY'} MODE — ${mode.name}
Desired impression: ${mode.desiredPerception}
Outfit formula: ${mode.formula}
Avoid: ${mode.avoid}`).join('\n\n');
  return `CLIENT STYLE PORTFOLIO
${modeLines}

Build this turn as roughly 60% occasion-specific primary mode, 30% permanent client anchors, and 10% experimentation. The mode may change with context while silhouette, colour comfort, footwear and branding preferences keep the client recognisable.`;
}
