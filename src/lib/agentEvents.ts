// Event reminder stages for the ICONIK agent. A client mentions "my brother's
// sangeet on 14 Dec"; the agent saves it and, if they agreed to reminders, comes
// back at the moments a good stylist would. ICONIK sends no Meta templates, so a
// stage that falls while the client is outside the 24h window is not sent on
// WhatsApp — it is surfaced in the next conversation instead (see agentRuntime).

export const EVENT_NUDGE_STAGES = [
  { key: 't21', daysBefore: 21, brief: 'Three weeks out: offer to plan the looks now, while there is time to order.' },
  { key: 't10', daysBefore: 10, brief: 'Ten days out: last comfortable window to order online; check the plan is sorted.' },
  { key: 't2', daysBefore: 2, brief: 'Two days out: final checks — steaming, accessories, shoes, backup option.' },
  { key: 'after', daysBefore: -1, brief: 'The day after: ask how it went and for a photo if they are happy to share.' },
] as const;

export type EventNudgeStageKey = typeof EVENT_NUDGE_STAGES[number]['key'];

export interface AgentEventLike {
  id: string;
  title: string;
  event_date: string;
  status: string;
  reminders_enabled: boolean;
  nudges_sent: string[] | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's calendar date in India, as YYYY-MM-DD. */
export function indiaDateString(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
}

export function daysUntil(eventDate: string, now = new Date()) {
  const today = Date.parse(`${indiaDateString(now)}T00:00:00Z`);
  const event = Date.parse(`${eventDate}T00:00:00Z`);
  return Math.round((event - today) / DAY_MS);
}

export function isValidEventDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().startsWith(value);
}

/**
 * The single stage due for this event today, or null. A stage is due from its
 * day until the next stage's day, so a late or skipped scheduler run still
 * catches up once — but never sends two stages at once, and never re-sends.
 */
export function dueNudgeStage(event: AgentEventLike, now = new Date()) {
  if (event.status !== 'upcoming' || !event.reminders_enabled) return null;
  const remaining = daysUntil(event.event_date, now);
  const sent = new Set(event.nudges_sent ?? []);
  let due: typeof EVENT_NUDGE_STAGES[number] | null = null;
  for (const stage of EVENT_NUDGE_STAGES) {
    if (remaining <= stage.daysBefore) due = stage;
  }
  if (!due || sent.has(due.key)) return null;
  // "after" only makes sense in the first few days after the event.
  if (due.key === 'after' && remaining < -4) return null;
  return due;
}

export function describeEventTiming(eventDate: string, now = new Date()) {
  const remaining = daysUntil(eventDate, now);
  if (remaining === 0) return 'today';
  if (remaining === 1) return 'tomorrow';
  if (remaining === -1) return 'yesterday';
  if (remaining < 0) return `${Math.abs(remaining)} days ago`;
  return `in ${remaining} days`;
}
