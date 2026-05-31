import 'server-only';

import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin } from './supabase';
import { logStyleEditEvent } from './styleEditProfile';
import type {
  StyleEditPageData,
  StyleEditPersonalizationProfile,
  StyleEditTopicPlan,
} from './styleEditTypes';

const ai = process.env.GOOGLE_AI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY }) : null;

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {};
}

function cleanJson(text: string) {
  return text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
}

async function callGeminiJSON<T>(prompt: string): Promise<T | null> {
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
    });
    return JSON.parse(cleanJson(response.text ?? '{}')) as T;
  } catch (error) {
    console.warn('[style-edit] Gemini generation fallback:', error);
    return null;
  }
}

function fallbackTopic(profile: StyleEditPersonalizationProfile, issueNumber: number): StyleEditTopicPlan {
  const topics = [
    ['Workwear Refresh', 'Make weekday outfits sharper without adding complexity'],
    ['Travel Capsule', 'Build repeatable outfits that pack well and still look intentional'],
    ['Colour Pairing Week', 'Use the client palette in practical combinations'],
    ['Denim Upgrade', 'Make casual denim feel polished and body-aware'],
    ['Accessories Audit', 'Use jewellery, bags, and shoes to finish looks cleanly'],
    ['Seasonal Transition', 'Layer the current style direction into changing weather'],
    ['Dinner Formula', 'Create evening outfits that feel elevated but personal'],
    ['Cultural Event Polish', 'Balance occasion dressing with the client style codes'],
  ];
  const recent = new Set(profile.recentIssueTopics.map(topic => topic.toLowerCase()));
  const picked = topics.find(([title]) => !recent.has(title.toLowerCase())) ?? topics[issueNumber % topics.length];
  return {
    title: picked[0],
    theme: picked[1],
    rationale: `Chosen from ${profile.styleProfile.archetype || 'the client style direction'} and the current Blueprint priorities.`,
    focusAreas: [
      profile.colour.paletteName || 'personal palette',
      profile.body.focusAreas[0] || profile.body.geometry || 'proportion',
      profile.styleProfile.signatureCodes[0] || 'signature styling',
    ].filter(Boolean),
    avoidRepeats: profile.recentIssueTopics,
  };
}

function fallbackPage(profile: StyleEditPersonalizationProfile, topic: StyleEditTopicPlan, weekStart: string): StyleEditPageData {
  const name = profile.client.name || profile.client.email.split('@')[0];
  return {
    issueTitle: topic.title,
    subtitle: topic.theme,
    weekLabel: `Week of ${new Date(`${weekStart}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`,
    clientName: name,
    theme: topic.theme,
    diagnosis: `This week is about applying ${profile.styleProfile.archetype || 'your style direction'} through outfits that respect ${profile.body.geometry || 'your proportions'} and ${profile.colour.paletteName || 'your palette'}. Keep the look intentional, edited, and easy to repeat.`,
    outfits: [
      {
        title: 'The Anchor Look',
        occasion: 'Work or polished daytime',
        formula: 'Structured top + clean trouser or skirt + refined shoe + one decisive accessory.',
        colourLogic: `Start with ${profile.colour.paletteName || 'your strongest neutral direction'} and add one controlled accent.`,
        stylingNotes: 'Keep the waist, neckline, and shoe line aligned with the Blueprint silhouette rules.',
      },
      {
        title: 'The Easy Upgrade',
        occasion: 'Casual social plans',
        formula: 'Elevated knit or shirt + best-fit denim + modern flat or low heel + compact bag.',
        colourLogic: 'Use a low-contrast base, then repeat one accent in the shoe, lip, bag, or jewellery.',
        stylingNotes: 'Avoid adding volume in every area at once; let one part of the outfit carry structure.',
      },
      {
        title: 'The Evening Version',
        occasion: 'Dinner or event',
        formula: 'Column base or dress + longer layer + metallic or textured accessory.',
        colourLogic: 'Choose depth close to the face and keep the lower half visually lengthened.',
        stylingNotes: 'Finish with one signature code instead of multiple competing details.',
      },
    ],
    paletteNotes: [
      profile.colour.paletteName ? `Use ${profile.colour.paletteName} as the filter before buying anything this week.` : 'Keep colour decisions close to your personal palette.',
      'Repeat one colour twice in the outfit so it feels styled, not assembled.',
    ],
    shoppingRules: [
      'Buy only pieces that support at least two formulas above.',
      'Check neckline, fabric weight, and hem placement before colour or trend.',
      'Skip anything that needs a completely new wardrobe to work.',
    ],
    avoidThisWeek: [
      profile.styleProfile.antiCodes[0] || 'Unstructured pieces that erase the intended silhouette.',
      profile.colour.avoidColours[0] || 'Colours that sit outside the palette and make the outfit harder to combine.',
    ],
    replyPrompt: 'Reply with one outfit you want to build this week and we will help you refine it.',
    generatedAt: new Date().toISOString(),
  };
}

export async function generateStyleEditTopicPlan(
  profile: StyleEditPersonalizationProfile,
  issueNumber: number,
): Promise<StyleEditTopicPlan> {
  const fallback = fallbackTopic(profile, issueNumber);
  const prompt = `You are ICONIK's weekly style editor.
Return ONLY valid JSON with this exact shape:
{"title":"","theme":"","rationale":"","focusAreas":[""],"avoidRepeats":[""]}

Create one weekly ICONIK Edit topic for this client. It must feel personal, specific, and operational.
Avoid repeating recent issue topics.

PROFILE:
${JSON.stringify(profile, null, 2)}

ISSUE NUMBER: ${issueNumber}`;

  const generated = await callGeminiJSON<StyleEditTopicPlan>(prompt);
  return generated?.title ? generated : fallback;
}

export async function generateStyleEditPageData(input: {
  profile: StyleEditPersonalizationProfile;
  topicPlan: StyleEditTopicPlan;
  weekStart: string;
}): Promise<StyleEditPageData> {
  const fallback = fallbackPage(input.profile, input.topicPlan, input.weekStart);
  const prompt = `You are ICONIK, a premium weekly style editor for women.
Return ONLY valid JSON. No markdown.

Required shape:
{
  "issueTitle":"",
  "subtitle":"",
  "weekLabel":"",
  "clientName":"",
  "theme":"",
  "diagnosis":"",
  "outfits":[{"title":"","occasion":"","formula":"","colourLogic":"","stylingNotes":""}],
  "paletteNotes":[""],
  "shoppingRules":[""],
  "avoidThisWeek":[""],
  "replyPrompt":"",
  "generatedAt":""
}

Rules:
- Write for one private static weekly style page.
- Generate 3 to 5 outfit formulas.
- Be specific to the body, colour, lifestyle, and taste profile.
- Do not mention AI.
- Keep every field customer-ready.

TOPIC:
${JSON.stringify(input.topicPlan, null, 2)}

PROFILE:
${JSON.stringify(input.profile, null, 2)}

WEEK START: ${input.weekStart}`;

  const generated = await callGeminiJSON<StyleEditPageData>(prompt);
  if (!generated?.issueTitle || !Array.isArray(generated.outfits)) return fallback;
  return { ...fallback, ...generated, generatedAt: new Date().toISOString() };
}

async function updateIssue(issueId: string, patch: Record<string, unknown>) {
  await supabaseAdmin
    .from('style_edit_issues')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', issueId);
}

export async function runStyleEditIssuePipeline(issueId: string) {
  let stage = 'loading';
  const { data: issue, error } = await supabaseAdmin
    .from('style_edit_issues')
    .select('*, style_edit_client_profiles(*)')
    .eq('id', issueId)
    .single();

  if (error || !issue) throw new Error('Style Edit issue not found');

  const profileRow = asRecord(issue.style_edit_client_profiles);
  const profile = asRecord(profileRow.personalization_profile) as unknown as StyleEditPersonalizationProfile;

  try {
    stage = 'topic';
    await updateIssue(issueId, { status: 'generating', progress_stage: stage, error_message: null });
    const topicPlan = Object.keys(asRecord(issue.topic_plan)).length
      ? asRecord(issue.topic_plan) as unknown as StyleEditTopicPlan
      : await generateStyleEditTopicPlan(profile, Number(issue.issue_number ?? 1));

    await updateIssue(issueId, { status: 'topic_ready', topic_plan: topicPlan, progress_stage: 'copy' });
    await logStyleEditEvent({
      issueId,
      profileId: issue.profile_id,
      subscriptionId: issue.subscription_id,
      eventType: 'topic_generated',
      status: 'topic_ready',
      metadata: { topicPlan },
    });

    stage = 'copy';
    await updateIssue(issueId, { status: 'generating', progress_stage: stage });
    const pageData = await generateStyleEditPageData({
      profile,
      topicPlan,
      weekStart: String(issue.week_start),
    });

    await updateIssue(issueId, {
      status: 'draft_ready',
      progress_stage: null,
      page_data: pageData,
      generated_at: new Date().toISOString(),
      error_message: null,
    });
    await logStyleEditEvent({
      issueId,
      profileId: issue.profile_id,
      subscriptionId: issue.subscription_id,
      eventType: 'issue_generated',
      status: 'draft_ready',
      metadata: { issueTitle: pageData.issueTitle },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Style Edit generation failed';
    await updateIssue(issueId, {
      status: 'error',
      progress_stage: null,
      error_message: `${stage}: ${message}`,
      retry_count: Number(issue.retry_count ?? 0) + 1,
    });
    await logStyleEditEvent({
      issueId,
      profileId: issue.profile_id,
      subscriptionId: issue.subscription_id,
      eventType: 'issue_generation_failed',
      status: 'error',
      message,
    });
    throw err;
  }
}
