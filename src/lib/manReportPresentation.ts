export interface ManReportPaletteColour {
  name: string;
  hex: string;
}

export interface ResolvedManFormulaColour {
  name: string;
  hex: string;
}

const CANONICAL_MENSWEAR_COLOURS: ReadonlyArray<ResolvedManFormulaColour & { terms: string[] }> = [
  { name: 'Warm Ivory', hex: '#FFF8E7', terms: ['warm ivory'] },
  { name: 'Ink Navy', hex: '#17263A', terms: ['ink navy'] },
  { name: 'Warm Taupe', hex: '#A88F7A', terms: ['warm taupe'] },
  { name: 'Dark Taupe', hex: '#796A5D', terms: ['dark taupe'] },
  { name: 'Dark Chocolate', hex: '#4B2E24', terms: ['dark chocolate'] },
  { name: 'Deep Olive', hex: '#4F552B', terms: ['deep olive'] },
  { name: 'Forest Green', hex: '#2C4A35', terms: ['forest green'] },
  { name: 'Slate Blue', hex: '#5B6E8F', terms: ['slate blue'] },
  { name: 'Powder Blue', hex: '#A7BDD3', terms: ['powder blue'] },
  { name: 'Dusty Blue', hex: '#70899A', terms: ['dusty blue'] },
  { name: 'Warm Grey', hex: '#8B8378', terms: ['warm grey', 'warm gray'] },
  { name: 'Butter Yellow', hex: '#D8BC63', terms: ['butter yellow'] },
  { name: 'Dusty Pink', hex: '#B5828B', terms: ['dusty pink'] },
  { name: 'Muted Terracotta', hex: '#9E5B43', terms: ['muted terracotta'] },
  { name: 'Off-white', hex: '#F5F2EA', terms: ['off-white', 'off white'] },
  { name: 'Light Blue', hex: '#9CB7D1', terms: ['light blue'] },
  { name: 'Mid-blue', hex: '#547CA0', terms: ['mid-blue', 'mid blue'] },
  { name: 'Denim Blue', hex: '#5F82A3', terms: ['light-wash', 'light wash', 'mid-wash', 'mid wash', 'dark-wash', 'dark wash', 'denim', 'jeans'] },
  { name: 'Olive Brown', hex: '#5A5132', terms: ['olive brown'] },
  { name: 'Olive', hex: '#6B6B3D', terms: ['olive'] },
  { name: 'Ivory', hex: '#FFFFF0', terms: ['ivory'] },
  { name: 'Cream', hex: '#FFFDD0', terms: ['cream'] },
  { name: 'Ecru', hex: '#D6C9AC', terms: ['ecru'] },
  { name: 'Bone', hex: '#E4DBC8', terms: ['bone'] },
  { name: 'Chalk', hex: '#F2EFE6', terms: ['chalk'] },
  { name: 'White', hex: '#FFFFFF', terms: ['white'] },
  { name: 'Black', hex: '#1A1A1A', terms: ['black', 'jet'] },
  { name: 'Navy', hex: '#1F2A44', terms: ['navy'] },
  { name: 'Indigo', hex: '#34406B', terms: ['indigo'] },
  { name: 'Blue', hex: '#3E5C8A', terms: ['blue'] },
  { name: 'Charcoal', hex: '#36454F', terms: ['charcoal'] },
  { name: 'Graphite', hex: '#3A3D42', terms: ['graphite'] },
  { name: 'Slate', hex: '#6E7884', terms: ['slate'] },
  { name: 'Grey', hex: '#8C8C8C', terms: ['grey', 'gray'] },
  { name: 'Silver', hex: '#C7C9CC', terms: ['silver', 'steel'] },
  { name: 'Chocolate', hex: '#4A2F23', terms: ['chocolate'] },
  { name: 'Espresso', hex: '#3B2A21', terms: ['espresso'] },
  { name: 'Cocoa', hex: '#4B342A', terms: ['cocoa'] },
  { name: 'Tobacco', hex: '#8B5A2B', terms: ['tobacco'] },
  { name: 'Cognac', hex: '#9A5B34', terms: ['cognac'] },
  { name: 'Brown', hex: '#6B4A2F', terms: ['brown'] },
  { name: 'Camel', hex: '#C19A6B', terms: ['camel'] },
  { name: 'Tan', hex: '#C2A178', terms: ['tan'] },
  { name: 'Taupe', hex: '#A89A88', terms: ['taupe'] },
  { name: 'Stone', hex: '#C8BFAE', terms: ['stone'] },
  { name: 'Oatmeal', hex: '#D8CBB3', terms: ['oatmeal', 'oat'] },
  { name: 'Beige', hex: '#D9C7AC', terms: ['beige'] },
  { name: 'Sand', hex: '#D6C4A1', terms: ['sand'] },
  { name: 'Khaki', hex: '#9A8C68', terms: ['khaki'] },
  { name: 'Sage', hex: '#9BA790', terms: ['sage'] },
  { name: 'Emerald', hex: '#1F6E54', terms: ['emerald'] },
  { name: 'Teal', hex: '#2C6E6A', terms: ['teal'] },
  { name: 'Green', hex: '#4F6B4A', terms: ['green'] },
  { name: 'Burgundy', hex: '#6E2C39', terms: ['burgundy'] },
  { name: 'Oxblood', hex: '#5A2733', terms: ['oxblood'] },
  { name: 'Wine', hex: '#6A2C3E', terms: ['wine'] },
  { name: 'Maroon', hex: '#5C2E33', terms: ['maroon'] },
  { name: 'Plum', hex: '#5E3A57', terms: ['plum'] },
  { name: 'Rust', hex: '#9C5230', terms: ['rust'] },
  { name: 'Terracotta', hex: '#A4593B', terms: ['terracotta'] },
  { name: 'Brick', hex: '#944A3C', terms: ['brick'] },
  { name: 'Red', hex: '#9E3B36', terms: ['red'] },
  { name: 'Mustard', hex: '#C49A3A', terms: ['mustard'] },
  { name: 'Ochre', hex: '#BB8A3C', terms: ['ochre'] },
  { name: 'Gold', hex: '#B08D3F', terms: ['gold-tone', 'gold tone', 'golden', 'gold'] },
  { name: 'Bronze', hex: '#8C6A3E', terms: ['bronze'] },
  { name: 'Copper', hex: '#A56A3E', terms: ['copper'] },
];

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function phraseIndex(text: string, phrase: string): number {
  const match = new RegExp(`(^|[^a-z0-9])(${escapeRegExp(phrase.toLowerCase())})(?=$|[^a-z0-9])`, 'i').exec(text);
  return match?.index === undefined ? -1 : match.index + match[1].length;
}

export function extractFullManIdentityStatement(text: string): string {
  return text
    .replace(/^\s{0,3}#{1,6}\s+.*$/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isManReportStylistReviewed(status?: string | null, sentAt?: string | null): boolean {
  return status === 'approved' || status === 'sent' || Boolean(sentAt);
}

export function formatManReportOpeningNeed(styleBlocker: string, silhouetteType: string): string {
  const blocker = styleBlocker
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[-–—:\s]+|[-–—:\s.]+$/g, '')
    .trim();
  const frame = silhouetteType
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  if (!blocker || /^(?:none|nothing|not sure|unsure)$/i.test(blocker)) {
    return 'You wanted a clearer, more reliable way to get dressed.';
  }
  if (/body\s*type|body\s*shape|fit\s*requirements?|what\s+(?:fits|suits).*body/i.test(blocker)) {
    return frame
      ? `You wanted to know which fits work best for your ${frame} frame.`
      : 'You wanted to know which fits work best for your frame.';
  }
  if (/colou?r|skin\s*tone|undertone/i.test(blocker)) {
    return 'You wanted to know which colours genuinely suit you.';
  }
  if (/wardrobe|outfit|combine|mix\s+and\s+match|put.*together/i.test(blocker)) {
    return 'You wanted a wardrobe that is easier to combine and repeat.';
  }
  if (/professional|office|work|corporate/i.test(blocker)) {
    return 'You wanted to look sharper and feel more confident at work.';
  }

  const topic = blocker
    .replace(/^uncertainty\s+(?:regarding|about)\s+/i, '')
    .replace(/^(?:difficulty|trouble|struggling)\s+(?:with|to)\s+/i, '')
    .replace(/^(?:i\s+)?(?:am\s+)?(?:not\s+sure|unsure)\s+(?:about|how to)\s+/i, '')
    .replace(/^(?:i\s+)?(?:want|need)\s+(?:help|clarity)\s+(?:with|on|about)\s+/i, '');
  const naturalTopic = topic.charAt(0).toLowerCase() + topic.slice(1);
  return `You wanted a clearer answer on ${naturalTopic}.`;
}

export function resolveManFormulaColour(
  text: string,
  palette: ReadonlyArray<ManReportPaletteColour>,
): ResolvedManFormulaColour | null {
  const lower = text.toLowerCase();
  if (!lower.trim()) return null;

  const paletteMatches = palette
    .filter(colour => colour.name.trim() && HEX_PATTERN.test(colour.hex))
    .map(colour => ({
      colour: { name: colour.name.trim(), hex: colour.hex.toUpperCase() },
      index: phraseIndex(lower, colour.name.trim()),
      termLength: colour.name.trim().length,
      fromPalette: true,
    }))
    .filter(match => match.index >= 0);

  const canonicalMatches = CANONICAL_MENSWEAR_COLOURS.flatMap(colour =>
    colour.terms.map(term => ({
      colour: { name: colour.name, hex: colour.hex },
      index: phraseIndex(lower, term),
      termLength: term.length,
      fromPalette: false,
    })),
  ).filter(match => match.index >= 0);

  const first = [...paletteMatches, ...canonicalMatches].sort((a, b) =>
    a.index - b.index
    || Number(b.fromPalette) - Number(a.fromPalette)
    || b.termLength - a.termLength,
  )[0];

  return first?.colour ?? null;
}
