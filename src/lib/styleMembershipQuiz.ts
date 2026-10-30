// Style Membership quiz, screen by screen. The quiz engine renders whatever is
// listed here: change the order, copy or options in this file and the URLs,
// progress bar and per-screen tracking follow. Each screen's id is its URL
// slug (/style-membership/quiz/<id>) and its tracking name.

import {
  SHAPES,
  SHAPE_ORDER,
  SKIN_TONES,
  SWIPE_LOOKS,
  type MirrorId,
  type QuizAnswers,
  type SwipeLook,
} from './styleMembershipLogic';

export type ChapterId = 'life' | 'body' | 'colours' | 'style' | 'shopping' | 'coming';

export const CHAPTERS: Array<{ id: ChapterId; label: string }> = [
  { id: 'life', label: 'Your life' },
  { id: 'body', label: 'Your body' },
  { id: 'colours', label: 'Your colours' },
  { id: 'style', label: 'Your style' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'coming', label: 'Coming up' },
];

export type ScreenKind =
  | 'welcome'
  | 'proof'
  | 'choice'
  | 'height'
  | 'metal'
  | 'swipe'
  | 'mirror'
  | 'loading'
  | 'gate'
  | 'selfie';

export interface QuizOption {
  value: string;
  label: string;
  hint?: string;
  image?: string;
  swatch?: string;
}

export interface QuizScreen {
  id: string;
  kind: ScreenKind;
  chapter: ChapterId | null;
  title?: string;
  subtitle?: string;
  field?: keyof QuizAnswers;
  multi?: boolean;
  options?: QuizOption[];
  /** list: full-width rows; grid: 2 columns; images: picture cards; swatches: colour dots. */
  layout?: 'list' | 'grid' | 'images' | 'swatches' | 'tiles';
  /** Shows "Skip" instead of requiring an answer. */
  optional?: boolean;
  /** An option that clears the others in a multi-select ("Nothing"). */
  exclusive?: string;
  /** Most options a multi-select takes; picking another drops the oldest. */
  maxSelect?: number;
  showIf?: (answers: QuizAnswers) => boolean;
  look?: SwipeLook;
  mirror?: MirrorId;
  /** Hidden from members who paid first (the bio-link sales page): they skip the gate. */
  leadsOnly?: boolean;
}

const swipeScreens: QuizScreen[] = SWIPE_LOOKS.map((look, index) => ({
  id: `swipe-${look.id}`,
  kind: 'swipe',
  chapter: 'style',
  title: index === 0 ? 'Would you wear this?' : 'And this?',
  subtitle: `${index + 1} of ${SWIPE_LOOKS.length}`,
  field: 'swipes',
  look,
}));

export const QUIZ_SCREENS: QuizScreen[] = [
  {
    id: 'welcome',
    kind: 'welcome',
    chapter: null,
    title: 'First, how old are you?',
    field: 'age',
    options: [
      { value: '18-24', label: '18–24' },
      { value: '25-34', label: '25–34' },
      { value: '35-44', label: '35–44' },
      { value: '45+', label: '45+' },
    ],
  },
  { id: 'styled-by-iconik', kind: 'proof', chapter: null },

  // Chapter 1: your life
  {
    id: 'dress-for',
    kind: 'choice',
    chapter: 'life',
    title: 'What do you dress for most weeks?',
    subtitle: 'Pick all that apply.',
    field: 'dressFor',
    multi: true,
    layout: 'grid',
    options: [
      { value: 'office', label: 'Office' },
      { value: 'wfh', label: 'Work from home' },
      { value: 'family', label: 'Family functions' },
      { value: 'weddings', label: 'Weddings' },
      { value: 'travel', label: 'Travel' },
      { value: 'dates', label: 'Dates and dinners' },
      { value: 'college', label: 'College' },
    ],
  },
  {
    id: 'climate',
    kind: 'choice',
    chapter: 'life',
    title: 'What’s the weather like where you live?',
    field: 'climate',
    options: [
      { value: 'hot-humid', label: 'Hot and humid', hint: 'Mumbai, Chennai, Kolkata' },
      { value: 'hot-dry', label: 'Hot and dry', hint: 'Delhi summers, Jaipur, Ahmedabad' },
      { value: 'mild', label: 'Mild most of the year', hint: 'Bengaluru, Pune' },
      { value: 'cold-winters', label: 'Proper cold winters', hint: 'Delhi NCR, Chandigarh, Lucknow' },
    ],
  },
  {
    id: 'goal',
    kind: 'choice',
    chapter: 'life',
    title: 'What would you most like to change?',
    field: 'goal',
    options: [
      { value: 'find-style', label: 'Find a style that feels like me' },
      { value: 'polished-work', label: 'Look polished at work' },
      { value: 'dress-body', label: 'Dress for the body I have now' },
      { value: 'shop-smarter', label: 'Stop buying things I never wear' },
      { value: 'occasions', label: 'Get festive and wedding looks right' },
    ],
  },
  {
    id: 'getting-ready',
    kind: 'choice',
    chapter: 'life',
    title: 'How does getting ready usually go?',
    field: 'gettingReady',
    options: [
      { value: 'change-3-4', label: 'I change 3–4 times' },
      { value: 'same-5', label: 'I wear the same 5 outfits on repeat' },
      { value: 'quick', label: 'Quick, but I want it to look better' },
      { value: 'late', label: 'I’m always late because of it' },
    ],
  },
  { id: 'two-wardrobes', kind: 'mirror', chapter: 'life', mirror: 'life' },

  // Chapter 2: your body
  { id: 'height', kind: 'height', chapter: 'body', title: 'How tall are you?', field: 'heightCm' },
  {
    id: 'body-shape',
    kind: 'choice',
    chapter: 'body',
    title: 'Which shape is closest to yours?',
    subtitle: 'No wrong answers. Most women aren’t sure.',
    field: 'shape',
    layout: 'images',
    options: [
      ...SHAPE_ORDER.map(id => ({ value: id, label: SHAPES[id].label, hint: SHAPES[id].short, image: SHAPES[id].illustration })),
      { value: 'not-sure', label: 'Not sure', hint: 'Two quick questions instead' },
    ],
  },
  {
    id: 'shoulders-or-hips',
    kind: 'choice',
    chapter: 'body',
    title: 'Which is wider: your shoulders or your hips?',
    field: 'shapeShoulders',
    options: [
      { value: 'shoulders', label: 'My shoulders' },
      { value: 'hips', label: 'My hips' },
      { value: 'same', label: 'About the same' },
    ],
    showIf: answers => answers.shape === 'not-sure',
  },
  {
    id: 'weight-first',
    kind: 'choice',
    chapter: 'body',
    title: 'Where do you put on weight first?',
    field: 'shapeGain',
    options: [
      { value: 'tummy', label: 'Tummy and waist' },
      { value: 'hips', label: 'Hips and thighs' },
      { value: 'bust', label: 'Bust, arms and back' },
      { value: 'evenly', label: 'Evenly all over' },
    ],
    showIf: answers => answers.shape === 'not-sure',
  },
  {
    id: 'show-off',
    kind: 'choice',
    chapter: 'body',
    title: 'What do you like to show off?',
    subtitle: 'Pick any.',
    field: 'showOff',
    multi: true,
    layout: 'grid',
    exclusive: 'none',
    options: [
      { value: 'waist', label: 'Waist' },
      { value: 'legs', label: 'Legs' },
      { value: 'arms', label: 'Arms' },
      { value: 'shoulders', label: 'Shoulders' },
      { value: 'collarbones', label: 'Neck and collarbones' },
      { value: 'none', label: 'Nothing in particular' },
    ],
  },
  {
    id: 'play-down',
    kind: 'choice',
    chapter: 'body',
    title: 'And what would you rather play down?',
    subtitle: 'Pick any. This stays between you and your stylist.',
    field: 'playDown',
    multi: true,
    layout: 'grid',
    exclusive: 'none',
    options: [
      { value: 'tummy', label: 'Tummy' },
      { value: 'arms', label: 'Arms' },
      { value: 'hips', label: 'Hips' },
      { value: 'bust', label: 'Bust' },
      { value: 'thighs', label: 'Thighs' },
      { value: 'none', label: 'Nothing' },
    ],
  },
  {
    id: 'body-changed',
    kind: 'choice',
    chapter: 'body',
    title: 'Has your body changed recently?',
    subtitle: 'Optional. It helps us skip clothes that worked before but don’t now.',
    field: 'bodyChanged',
    optional: true,
    options: [
      { value: 'baby', label: 'Yes, after a baby' },
      { value: 'gain', label: 'Yes, I’ve gained weight' },
      { value: 'loss', label: 'Yes, I’ve lost weight' },
      { value: 'no', label: 'Not really' },
    ],
  },
  { id: 'your-shape', kind: 'mirror', chapter: 'body', mirror: 'body' },

  // Chapter 3: your colours
  {
    id: 'skin-tone',
    kind: 'choice',
    chapter: 'colours',
    title: 'Which skin tone is closest to yours?',
    subtitle: 'In daylight, without makeup.',
    field: 'skinTone',
    layout: 'swatches',
    options: SKIN_TONES.map(tone => ({ value: tone.id, label: tone.label, image: tone.image, swatch: tone.hex })),
  },
  {
    id: 'gold-or-silver',
    kind: 'metal',
    chapter: 'colours',
    title: 'Gold or silver: which makes your skin glow?',
    subtitle: 'Shown on a model with your skin tone.',
    field: 'metal',
  },
  {
    id: 'vein-check',
    kind: 'choice',
    chapter: 'colours',
    title: 'Look at the veins on your inner wrist. What colour are they?',
    subtitle: 'Check in daylight. It takes 5 seconds.',
    field: 'veins',
    options: [
      { value: 'green', label: 'Greenish', swatch: '#6E8A55' },
      { value: 'blue', label: 'Blue or purple', swatch: '#5E5E9A' },
      { value: 'both', label: 'A mix of both', swatch: 'linear-gradient(90deg,#6E8A55 50%,#5E5E9A 50%)' },
      { value: 'unsure', label: 'I can’t tell' },
    ],
  },
  {
    id: 'compliments',
    kind: 'choice',
    chapter: 'colours',
    title: 'Which colours get you the most compliments?',
    subtitle: 'Pick up to 3.',
    field: 'compliments',
    multi: true,
    maxSelect: 3,
    layout: 'swatches',
    options: [
      { value: 'maroon', label: 'Maroon', swatch: '#6E1F2A' },
      { value: 'mustard', label: 'Mustard', swatch: '#C9951B' },
      { value: 'navy', label: 'Navy', swatch: '#1F2A55' },
      { value: 'emerald', label: 'Emerald', swatch: '#0B7A55' },
      { value: 'blush', label: 'Blush', swatch: '#E8B4B8' },
      { value: 'white', label: 'White', swatch: '#FFFFFF' },
      { value: 'black', label: 'Black', swatch: '#111111' },
      { value: 'rust', label: 'Rust', swatch: '#A9471E' },
    ],
  },
  { id: 'your-colours', kind: 'mirror', chapter: 'colours', mirror: 'colour' },

  // Chapter 4: your style
  ...swipeScreens,
  { id: 'your-style', kind: 'mirror', chapter: 'style', mirror: 'style' },

  // Chapter 5: shopping
  {
    id: 'stores',
    kind: 'choice',
    chapter: 'shopping',
    title: 'Where do you usually shop?',
    subtitle: 'Pick all that apply.',
    field: 'stores',
    multi: true,
    layout: 'tiles',
    options: [
      { value: 'myntra', label: 'Myntra' },
      { value: 'ajio', label: 'AJIO' },
      { value: 'zara', label: 'Zara' },
      { value: 'hm', label: 'H&M' },
      { value: 'w', label: 'W' },
      { value: 'libas', label: 'Libas' },
      { value: 'fabindia', label: 'FabIndia' },
      { value: 'westside', label: 'Westside' },
      { value: 'tailor', label: 'Local tailor' },
    ],
  },
  {
    id: 'budget-everyday',
    kind: 'choice',
    chapter: 'shopping',
    title: 'What do you usually spend on an everyday top or kurta?',
    field: 'budgetEveryday',
    options: [
      { value: 'under-1k', label: 'Under ₹1,000' },
      { value: '1-2k', label: '₹1,000–2,000' },
      { value: '2-4k', label: '₹2,000–4,000' },
      { value: '4k-plus', label: 'More than ₹4,000' },
    ],
  },
  {
    id: 'budget-occasion',
    kind: 'choice',
    chapter: 'shopping',
    title: 'And on an outfit for a wedding or festival?',
    field: 'budgetOccasion',
    options: [
      { value: 'under-3k', label: 'Under ₹3,000' },
      { value: '3-6k', label: '₹3,000–6,000' },
      { value: '6-12k', label: '₹6,000–12,000' },
      { value: '12k-plus', label: 'More than ₹12,000' },
    ],
  },
  {
    id: 'size',
    kind: 'choice',
    chapter: 'shopping',
    title: 'What size do you usually buy?',
    subtitle: 'For tops and kurtas.',
    field: 'size',
    layout: 'tiles',
    options: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map(size => ({ value: size, label: size })),
  },
  { id: 'your-cupboard', kind: 'mirror', chapter: 'shopping', mirror: 'shopping' },

  // Chapter 6: coming up
  {
    id: 'coming-up',
    kind: 'choice',
    chapter: 'coming',
    title: 'What’s coming up in the next 60 days?',
    subtitle: 'Pick all that apply.',
    field: 'comingUp',
    multi: true,
    exclusive: 'nothing',
    options: [
      { value: 'diwali', label: 'Diwali' },
      { value: 'wedding', label: 'A wedding' },
      { value: 'office-party', label: 'An office party' },
      { value: 'trip', label: 'A trip' },
      { value: 'nothing', label: 'Nothing special' },
    ],
  },
  {
    id: 'wedding-functions',
    kind: 'choice',
    chapter: 'coming',
    title: 'How many functions are you going to?',
    field: 'weddingFunctions',
    options: [
      { value: '1', label: 'Just the wedding' },
      { value: '2-3', label: '2–3 functions' },
      { value: '4-plus', label: '4 or more' },
    ],
    showIf: answers => Boolean(answers.comingUp?.includes('wedding')),
  },
  { id: 'building-your-plan', kind: 'loading', chapter: 'coming' },

  { id: 'whatsapp', kind: 'gate', chapter: null, leadsOnly: true },
  { id: 'selfie', kind: 'selfie', chapter: null },
];

export interface QuizContext {
  answers: QuizAnswers;
  /** Paid first through the sales page: no gate, and the quiz ends in the hand-off. */
  member?: boolean;
}

export function isScreenVisible(screen: QuizScreen, context: QuizContext) {
  if (screen.leadsOnly && context.member) return false;
  return screen.showIf ? screen.showIf(context.answers) : true;
}

export function visibleScreens(context: QuizContext) {
  return QUIZ_SCREENS.filter(screen => isScreenVisible(screen, context));
}

export function screenById(id: string) {
  return QUIZ_SCREENS.find(screen => screen.id === id) ?? null;
}

export function nextScreenId(currentId: string, context: QuizContext): string | null {
  const index = QUIZ_SCREENS.findIndex(screen => screen.id === currentId);
  for (let next = index + 1; next < QUIZ_SCREENS.length; next += 1) {
    if (isScreenVisible(QUIZ_SCREENS[next], context)) return QUIZ_SCREENS[next].id;
  }
  return null;
}

export function previousScreenId(currentId: string, context: QuizContext): string | null {
  const index = QUIZ_SCREENS.findIndex(screen => screen.id === currentId);
  for (let previous = index - 1; previous >= 0; previous -= 1) {
    if (isScreenVisible(QUIZ_SCREENS[previous], context)) return QUIZ_SCREENS[previous].id;
  }
  return null;
}

/** Progress within each chapter, for the segmented bar: 0–1 per segment. */
export function chapterProgress(currentId: string, context: QuizContext) {
  const screens = visibleScreens(context);
  const current = screens.find(screen => screen.id === currentId);
  return CHAPTERS.map(chapter => {
    const inChapter = screens.filter(screen => screen.chapter === chapter.id);
    if (!current?.chapter) {
      const currentIndex = QUIZ_SCREENS.findIndex(screen => screen.id === currentId);
      const lastIndex = QUIZ_SCREENS.findIndex(screen => screen.id === inChapter[inChapter.length - 1]?.id);
      return { ...chapter, value: currentIndex > lastIndex ? 1 : 0 };
    }
    const chapterIndex = CHAPTERS.findIndex(item => item.id === current.chapter);
    const thisIndex = CHAPTERS.findIndex(item => item.id === chapter.id);
    if (thisIndex < chapterIndex) return { ...chapter, value: 1 };
    if (thisIndex > chapterIndex) return { ...chapter, value: 0 };
    const position = inChapter.findIndex(screen => screen.id === currentId);
    return { ...chapter, value: (position + 1) / inChapter.length };
  });
}

/** Whether the screen has what it needs to move on. */
export function screenAnswered(screen: QuizScreen, answers: QuizAnswers) {
  if (!screen.field) return true;
  if (screen.optional) return true;
  const value = answers[screen.field];
  if (screen.kind === 'swipe') return Boolean(screen.look && answers.swipes?.[screen.look.id]);
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== '';
}

/** Number of question screens before the gate, for "3-minute quiz" honesty checks. */
export function screensBeforeGate(context: QuizContext) {
  const screens = visibleScreens(context);
  const gate = screens.findIndex(screen => screen.kind === 'gate');
  return gate === -1 ? screens.length : gate;
}
