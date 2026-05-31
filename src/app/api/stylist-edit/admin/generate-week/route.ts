import { NextRequest, NextResponse, after } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { ensureStyleEditClientProfile, getWeekStart, logStyleEditEvent } from '@/lib/styleEditProfile';
import { generateStyleEditTopicPlan } from '@/lib/styleEditGenerator';
import type { StyleEditPersonalizationProfile } from '@/lib/styleEditTypes';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  if (!isAdminAuthenticatedFromCookieValue(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const weekStart = body.week_start || getWeekStart();
  const subscriptionId = typeof body.subscription_id === 'string' ? body.subscription_id : '';

  let query = supabaseAdmin
    .from('style_edit_subscriptions')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(200);

  if (subscriptionId) query = query.eq('id', subscriptionId);

  const { data: subscriptions, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const created: string[] = [];
  const skipped: Array<{ subscriptionId: string; reason: string }> = [];

  for (const subscription of subscriptions ?? []) {
    try {
      const profile = await ensureStyleEditClientProfile(subscription.id);
      if (profile.status !== 'ready') {
        skipped.push({ subscriptionId: subscription.id, reason: profile.status });
        continue;
      }

      const { count } = await supabaseAdmin
        .from('style_edit_issues')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', profile.id);
      const issueNumber = (count ?? 0) + 1;
      const topicPlan = await generateStyleEditTopicPlan(profile.personalization_profile as StyleEditPersonalizationProfile, issueNumber);

      const { data: issue, error: issueError } = await supabaseAdmin
        .from('style_edit_issues')
        .upsert({
          profile_id: profile.id,
          subscription_id: subscription.id,
          week_start: weekStart,
          issue_number: issueNumber,
          status: 'topic_ready',
          topic_plan: topicPlan,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'profile_id,week_start' })
        .select('id')
        .single();

      if (issueError || !issue) throw new Error(issueError?.message || 'Issue create failed');
      created.push(issue.id);
      await logStyleEditEvent({
        issueId: issue.id,
        profileId: profile.id,
        subscriptionId: subscription.id,
        eventType: 'weekly_issue_created',
        status: 'topic_ready',
        metadata: { weekStart, topicPlan },
      });
    } catch (err) {
      skipped.push({ subscriptionId: subscription.id, reason: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  if (body.generate !== false) {
    after(async () => {
      const { runStyleEditIssuePipeline } = await import('@/lib/styleEditGenerator');
      for (const issueId of created) {
        await runStyleEditIssuePipeline(issueId).catch(() => {});
      }
    });
  }

  return NextResponse.json({ weekStart, created, skipped });
}
