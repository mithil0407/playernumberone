import { getAttributionPayload } from "@/lib/attribution";

export type GrowthEventName =
  | "article_view"
  | "article_quiz_cta_view"
  | "article_quiz_cta_click"
  | "quiz_start"
  | "quiz_result_view"
  | "quiz_lead_submit"
  | "consultation_cta_click"
  | "checkout_started"
  | "purchase";

export type GrowthAudience = "women" | "men";

export type GrowthEventParameters = {
  article_id?: string;
  content_cluster?: string;
  audience?: GrowthAudience;
  hook_type?: string;
  visual_id?: string;
  visual_variant?: string;
  tool_id?: string;
  result_key?: string;
  content_source?: string;
  value?: number;
  currency?: string;
  transaction_id?: string;
};

type AnalyticsValue = string | number | boolean;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: "event", eventName: string, parameters?: Record<string, AnalyticsValue>) => void;
  }
}

const AI_REFERRERS: Array<[string, string]> = [
  ["chatgpt.com", "chatgpt"],
  ["chat.openai.com", "chatgpt"],
  ["perplexity.ai", "perplexity"],
  ["copilot.microsoft.com", "copilot"],
  ["gemini.google.com", "gemini"],
  ["claude.ai", "claude"],
];
const GROWTH_CONTEXT_KEY = "iconik_growth_context";
const CONTEXT_KEYS = [
  "article_id",
  "content_cluster",
  "audience",
  "hook_type",
  "visual_id",
  "visual_variant",
  "content_source",
] as const;

function cleanValue(value: unknown): AnalyticsValue | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 500) : undefined;
}

function hostname(value: string | null | undefined) {
  if (!value) return "";
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function classifyTrafficChannel(referrer: string | null | undefined) {
  const host = hostname(referrer);
  const aiSource = AI_REFERRERS.find(([domain]) => host === domain || host.endsWith(`.${domain}`));
  if (aiSource) return { traffic_channel: "ai_referral", ai_source: aiSource[1] };
  if (!host) return { traffic_channel: "direct", ai_source: "none" };
  if (host.includes("google.")) return { traffic_channel: "organic_search", ai_source: "none" };
  if (host.includes("bing.")) return { traffic_channel: "organic_search", ai_source: "none" };
  if (host.includes("instagram.com") || host === "l.instagram.com") {
    return { traffic_channel: "instagram", ai_source: "none" };
  }
  return { traffic_channel: "referral", ai_source: "none" };
}

function readStoredGrowthContext(): GrowthEventParameters {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.sessionStorage.getItem(GROWTH_CONTEXT_KEY);
    return stored ? JSON.parse(stored) as GrowthEventParameters : {};
  } catch {
    return {};
  }
}

function persistGrowthContext(input: GrowthEventParameters) {
  if (typeof window === "undefined") return;
  const context = Object.fromEntries(
    CONTEXT_KEYS
      .map((key) => [key, cleanValue(input[key])] as const)
      .filter((entry) => entry[1] !== undefined),
  );
  if (!Object.keys(context).length) return;
  try {
    window.sessionStorage.setItem(
      GROWTH_CONTEXT_KEY,
      JSON.stringify({ ...readStoredGrowthContext(), ...context }),
    );
  } catch {
    // Analytics must never block the user journey.
  }
}

export function readGrowthContextFromUrl(): GrowthEventParameters {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const audience = params.get("audience");
  const urlContext: GrowthEventParameters = {
    article_id: params.get("article_id") || undefined,
    content_cluster: params.get("content_cluster") || undefined,
    audience: audience === "men" || audience === "women" ? audience : undefined,
    hook_type: params.get("hook_type") || undefined,
    visual_id: params.get("visual_id") || undefined,
    visual_variant: params.get("visual_variant") || undefined,
    content_source: params.get("source") || undefined,
  };
  const definedUrlContext = Object.fromEntries(
    Object.entries(urlContext).filter(([, value]) => value !== undefined),
  ) as GrowthEventParameters;
  persistGrowthContext(definedUrlContext);
  return { ...readStoredGrowthContext(), ...definedUrlContext };
}

export function trackGrowthEvent(eventName: GrowthEventName, input: GrowthEventParameters = {}) {
  if (typeof window === "undefined") return;

  const attribution = getAttributionPayload();
  const urlContext = readGrowthContextFromUrl();
  persistGrowthContext(input);
  const channel = classifyTrafficChannel(attribution.referrer);
  const raw: Record<string, unknown> = {
    ...urlContext,
    ...input,
    ...channel,
    first_touch_source: attribution.utm_source,
    first_touch_medium: attribution.utm_medium,
    first_touch_campaign: attribution.utm_campaign,
    first_touch_referrer: attribution.referrer,
    first_touch_landing_page: attribution.landing_page,
    first_touch_at: attribution.first_touch_at,
  };
  const parameters = Object.fromEntries(
    Object.entries(raw)
      .map(([key, value]) => [key, cleanValue(value)] as const)
      .filter((entry): entry is [string, AnalyticsValue] => entry[1] !== undefined),
  );

  window.gtag?.("event", eventName, parameters);
  window.fbq?.("trackCustom", eventName, parameters);
}
