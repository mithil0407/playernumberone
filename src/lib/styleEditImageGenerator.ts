import 'server-only';

import sharp from 'sharp';
import { supabaseAdmin } from './supabase';
import { logStyleEditEvent } from './styleEditProfile';
import type { ResolvedStyleEditImageUrls, StyleEditImagePaths, StyleEditPageData } from './styleEditTypes';

const BUCKET = 'style-edit-images';
const SIGNED_URL_TTL = 60 * 60;

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wrap(text: string, max = 42) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 8);
}

async function uploadSvg(issueId: string, fileName: string, svg: string) {
  const buffer = await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer();
  const path = `${issueId}/${fileName}.jpg`;
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return path;
}

function cardSvg(input: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  lines: string[];
  accent?: string;
}) {
  const accent = input.accent ?? '#B97A3A';
  const rendered = input.lines.flatMap(line => wrap(line, 44)).slice(0, 9);
  return `<svg width="1200" height="1500" viewBox="0 0 1200 1500" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="1500" fill="#FBF8F4"/>
    <rect x="74" y="74" width="1052" height="1352" rx="28" fill="#FFFFFF" stroke="#E8DDC9" stroke-width="2"/>
    <rect x="74" y="74" width="1052" height="18" fill="${accent}"/>
    <text x="120" y="180" font-family="Arial, sans-serif" font-size="24" letter-spacing="7" fill="${accent}" font-weight="700">${escapeXml(input.eyebrow.toUpperCase())}</text>
    <text x="120" y="292" font-family="Georgia, serif" font-size="70" fill="#1B1815">${escapeXml(input.title).slice(0, 34)}</text>
    ${input.subtitle ? `<text x="120" y="354" font-family="Arial, sans-serif" font-size="32" fill="#7A6A58">${escapeXml(input.subtitle).slice(0, 58)}</text>` : ''}
    ${rendered.map((line, index) => `<text x="120" y="${460 + index * 62}" font-family="Arial, sans-serif" font-size="34" fill="#4D463E">${escapeXml(line)}</text>`).join('')}
    <text x="120" y="1352" font-family="Arial, sans-serif" font-size="24" letter-spacing="6" fill="#8C5621">THE ICONIK EDIT</text>
  </svg>`;
}

export async function generateStyleEditImages(issueId: string, pageData: StyleEditPageData) {
  await supabaseAdmin
    .from('style_edit_issues')
    .update({ progress_stage: 'generating_images', updated_at: new Date().toISOString() })
    .eq('id', issueId);

  const heroCard = await uploadSvg(issueId, 'hero', cardSvg({
    eyebrow: pageData.weekLabel,
    title: pageData.issueTitle,
    subtitle: pageData.subtitle,
    lines: [pageData.diagnosis],
  }));

  const outfitCards = await Promise.all(pageData.outfits.slice(0, 5).map((outfit, index) => uploadSvg(issueId, `outfit-${index + 1}`, cardSvg({
    eyebrow: outfit.occasion || `Outfit ${index + 1}`,
    title: outfit.title || `Look ${index + 1}`,
    subtitle: outfit.colourLogic,
    lines: [outfit.formula, outfit.stylingNotes].filter(Boolean),
    accent: index % 2 === 0 ? '#B97A3A' : '#667A67',
  }))));

  const paletteCard = await uploadSvg(issueId, 'shopping-rules', cardSvg({
    eyebrow: 'Shopping Rules',
    title: 'This Week',
    lines: [...pageData.paletteNotes, ...pageData.shoppingRules].filter(Boolean),
    accent: '#7C6B5A',
  }));

  const imagePaths: StyleEditImagePaths = { heroCard, outfitCards, paletteCard };

  await supabaseAdmin
    .from('style_edit_issues')
    .update({ image_urls: imagePaths, progress_stage: null, updated_at: new Date().toISOString() })
    .eq('id', issueId);

  await logStyleEditEvent({
    issueId,
    eventType: 'images_generated',
    status: 'draft_ready',
    metadata: { imagePaths },
  });

  return imagePaths;
}

async function getSignedUrl(path: string) {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) throw new Error(`Signed URL failed for ${path}`);
  return data.signedUrl;
}

export async function resolveStyleEditImageUrls(paths: StyleEditImagePaths | null | undefined): Promise<ResolvedStyleEditImageUrls | null> {
  if (!paths) return null;
  const allPaths = [
    paths.heroCard ?? null,
    paths.paletteCard ?? null,
    ...(paths.outfitCards ?? []),
  ].filter((path): path is string => Boolean(path));
  const uniquePaths = [...new Set(allPaths)];
  const signedUrlMap = new Map<string, string>();

  if (uniquePaths.length) {
    const { data } = await supabaseAdmin.storage.from(BUCKET).createSignedUrls(uniquePaths, SIGNED_URL_TTL);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) signedUrlMap.set(item.path, item.signedUrl);
    }
    for (const path of uniquePaths) {
      if (!signedUrlMap.has(path)) signedUrlMap.set(path, await getSignedUrl(path));
    }
  }

  return {
    heroCard: paths.heroCard ? signedUrlMap.get(paths.heroCard) ?? null : null,
    paletteCard: paths.paletteCard ? signedUrlMap.get(paths.paletteCard) ?? null : null,
    outfitCards: (paths.outfitCards ?? []).map(path => path ? signedUrlMap.get(path) ?? null : null),
  };
}
