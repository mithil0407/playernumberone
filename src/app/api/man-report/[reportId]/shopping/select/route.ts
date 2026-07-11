// POST /api/man-report/[reportId]/shopping/select
//
// Stylist HITL decision for one garment slot's shopping links:
//   { outfitNumber, slot, action: 'pick',   pickedUrls: string[] }  — choose from candidates
//   { outfitNumber, slot, action: 'manual', manualUrl: string }     — paste a URL
//   { outfitNumber, slot, action: 'none' }                          — no link for this slot
//
// Writes shopping_data only — never report_data — so it can never race the
// outfit-edit routes.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isAdminAuthenticatedFromCookieValue, ADMIN_COOKIE } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { revalidateManReportCache } from '@/lib/manReportCache';
import {
  buildShoppingSlotKey,
  createEmptyShoppingState,
  MAN_SHOPPING_MAX_SELECTED,
  MAN_SHOPPING_SLOT_NAMES,
  type ManProductLink,
  type ManShoppingSlot,
  type ManShoppingSlotName,
  type ManShoppingState,
} from '@/lib/manShopping';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;
  const body = await request.json().catch(() => null);

  const outfitNumber = Number(body?.outfitNumber);
  const slotName = body?.slot as ManShoppingSlotName;
  const action = body?.action as 'pick' | 'manual' | 'none';

  if (!Number.isInteger(outfitNumber) || outfitNumber < 1
    || !MAN_SHOPPING_SLOT_NAMES.includes(slotName)
    || !['pick', 'manual', 'none'].includes(action)) {
    return NextResponse.json({ error: 'Invalid outfitNumber, slot or action' }, { status: 400 });
  }

  const { data: report, error } = await supabaseAdmin
    .from('man_reports')
    .select('id, shopping_data, share_token')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const state = (report.shopping_data as ManShoppingState | null) ?? createEmptyShoppingState();
  const key = buildShoppingSlotKey(outfitNumber, slotName);
  const existing = state.slots[key];

  let nextSlot: ManShoppingSlot;

  if (action === 'none') {
    nextSlot = {
      descriptor: existing?.descriptor ?? '',
      descriptorHash: existing?.descriptorHash ?? '',
      query: existing?.query ?? '',
      candidates: existing?.candidates ?? [],
      selected: [],
      status: 'skipped',
    };
  } else if (action === 'manual') {
    const manualUrl = typeof body?.manualUrl === 'string' ? body.manualUrl.trim() : '';
    let parsed: URL;
    try {
      parsed = new URL(manualUrl);
      if (parsed.protocol !== 'https:') throw new Error('not https');
    } catch {
      return NextResponse.json({ error: 'Manual URL must be a valid https:// link' }, { status: 400 });
    }

    const manualLink: ManProductLink = {
      title: typeof body?.manualTitle === 'string' && body.manualTitle.trim()
        ? body.manualTitle.trim().slice(0, 160)
        : parsed.hostname.replace(/^www\./, ''),
      merchant: parsed.hostname.replace(/^www\./, ''),
      url: parsed.toString(),
      source: 'manual',
    };

    nextSlot = {
      descriptor: existing?.descriptor ?? '',
      descriptorHash: existing?.descriptorHash ?? '',
      query: existing?.query ?? '',
      candidates: existing?.candidates ?? [],
      selected: [...(existing?.status === 'manual' ? existing.selected : []), manualLink]
        .slice(-MAN_SHOPPING_MAX_SELECTED),
      status: 'manual',
    };
  } else {
    if (!existing || existing.candidates.length === 0) {
      return NextResponse.json({ error: 'No fetched candidates to pick from for this slot' }, { status: 400 });
    }
    const pickedUrls = Array.isArray(body?.pickedUrls)
      ? (body.pickedUrls.filter((url: unknown) => typeof url === 'string') as string[])
      : [];
    const selected = pickedUrls
      .map(url => existing.candidates.find(candidate => candidate.url === url))
      .filter((link): link is ManProductLink => !!link)
      .slice(0, MAN_SHOPPING_MAX_SELECTED);

    if (selected.length === 0) {
      return NextResponse.json({ error: 'pickedUrls did not match any candidates' }, { status: 400 });
    }

    nextSlot = { ...existing, selected, status: 'ready' };
  }

  const nextState: ManShoppingState = {
    ...state,
    slots: { ...state.slots, [key]: nextSlot },
    updatedAt: new Date().toISOString(),
  };

  const { error: updateError } = await supabaseAdmin
    .from('man_reports')
    .update({ shopping_data: nextState, updated_at: new Date().toISOString() })
    .eq('id', reportId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await revalidateManReportCache(reportId, (report.share_token as string | null) ?? null);

  return NextResponse.json({ slotKey: key, slot: nextSlot });
}
