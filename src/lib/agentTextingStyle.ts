// How this person texts, read from their own messages, so the agent can text
// back the same way: short and lowercase to someone who writes "pink", fuller
// sentences to someone who writes paragraphs, Hinglish to someone who uses it.
// Pure, so it can be tested.

const EMOJI = /\p{Extended_Pictographic}/gu;
const DEVANAGARI = /[ऀ-ॿ]/;
// Common Hinglish words written in Latin script. Whole words only, so "hai" in
// "chai" or "to" in "top" doesn't count.
const HINGLISH = /\b(?:hai|hain|kya|kaise|kaisa|kaisi|nahi|nahin|haan|acha|accha|achha|yaar|bhi|mujhe|mera|meri|mere|kar|karo|karna|chahiye|lagega|lagta|lag|rha|raha|rahi|thik|theek|bahut|bohot|kuch|aur|wala|wali|kyun|kab|abhi|batao|bata|dikhao|sahi|bilkul|ji)\b/i;

export interface TextingStyle {
  /** Messages it was read from (their own typed text only). */
  sampled: number;
  averageWords: number;
  /** Most messages start lower-case. */
  lowercase: boolean;
  emojiPerMessage: number;
  hinglish: boolean;
  devanagari: boolean;
  /** "u", "pls", "thnx"… */
  shorthand: boolean;
}

/** Text a person typed themselves: not our campaign link's prefilled text, a code, or a system note. */
function ownWords(text: string) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith('[')) return false;
  if (/\bICK-[A-Z0-9]{4,}\b/.test(trimmed)) return false;
  if (/^hi iconik!/i.test(trimmed)) return false;
  return true;
}

export function readTextingStyle(messages: string[]): TextingStyle | null {
  const texts = messages.filter(ownWords).slice(-20);
  if (!texts.length) return null;
  const words = texts.map(text => text.split(/\s+/).filter(Boolean).length);
  const startsWithLetter = texts.filter(text => /^[a-z]/i.test(text.trim()));
  const lower = startsWithLetter.filter(text => /^[a-z]/.test(text.trim())).length;
  const emojis = texts.reduce((sum, text) => sum + (text.match(EMOJI)?.length ?? 0), 0);
  return {
    sampled: texts.length,
    averageWords: Math.round((words.reduce((sum, count) => sum + count, 0) / texts.length) * 10) / 10,
    lowercase: startsWithLetter.length >= 2 && lower / startsWithLetter.length >= 0.6,
    emojiPerMessage: Math.round((emojis / texts.length) * 10) / 10,
    hinglish: texts.some(text => HINGLISH.test(text)),
    devanagari: texts.some(text => DEVANAGARI.test(text)),
    shorthand: texts.some(text => /\b(?:u|ur|pls|plz|thnx|tq|btw|rn|wid)\b/i.test(text)),
  };
}

/**
 * The style as an instruction for the model. Mirroring is about form — length,
 * case, emoji, language — never about copying their spelling mistakes.
 */
export function describeTextingStyle(style: TextingStyle | null) {
  if (!style) return "You haven't seen how they text yet. Start warm and brief (bubbles under about 25 words), then mirror them once they write.";
  const length = style.averageWords <= 4
    ? 'very short messages (a few words)'
    : style.averageWords <= 12
      ? 'short messages (one line)'
      : 'fuller messages (a few sentences)';
  const notes = [
    `They write ${length}.`,
    style.lowercase ? 'Mostly lowercase, casual.' : null,
    style.emojiPerMessage === 0 ? 'No emojis.' : style.emojiPerMessage >= 1 ? 'Lots of emojis.' : 'The odd emoji.',
    style.devanagari ? 'They use Hindi/Marathi script.' : style.hinglish ? 'They mix in Hinglish.' : null,
    style.shorthand ? 'They use texting shorthand.' : null,
  ].filter(Boolean).join(' ');
  const mirror = [
    style.averageWords <= 4
      ? 'Keep yours short too: one or two bubbles of under 15 words each.'
      : style.averageWords > 12 ? 'You can be a little fuller: bubbles of up to about 40 words.' : 'Keep each bubble under about 25 words.',
    style.lowercase ? 'Relaxed casing is fine.' : null,
    style.emojiPerMessage === 0 ? 'Go easy on emojis — one at most, often none.' : style.emojiPerMessage >= 1 ? 'Emojis are welcome.' : null,
    style.devanagari || style.hinglish ? 'Mix in the same Hinglish naturally ("ekdum sahi", "yeh wala"), keeping fashion words in English.' : null,
  ].filter(Boolean).join(' ');
  return `${notes} Mirror that: ${mirror} Never copy spelling mistakes.`;
}
