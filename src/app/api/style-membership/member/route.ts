import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppBusinessNumber } from '@/lib/whatsapp';
import { SUPPORT_WHATSAPP_E164 } from '@/lib/siteFacts';
import { membershipForMember } from '@/lib/styleMembershipServer';
import { getLead } from '@/lib/styleMembershipStore';
import { membershipSchedule } from '@/lib/styleMembershipSchedule';
import { memberWhatsappLink } from '@/lib/styleMembershipTokens';
import { errorResponse, noStore, readJson } from '../_shared/http';

/** The welcome page: her plan, the WhatsApp button carrying her code, and what happens next. */
export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request);
    const membership = await membershipForMember(body.membershipId, body.code);
    const lead = membership.lead_id ? await getLead(membership.lead_id) : null;
    const businessNumber = await getWhatsAppBusinessNumber().catch(() => null) ?? SUPPORT_WHATSAPP_E164;
    const code = String(body.code).toUpperCase();
    const schedule = membershipSchedule(new Date(membership.paid_at ?? Date.now()), {
      plan: membership.plan,
      answers: lead?.answers ?? {},
      hasSelfie: Boolean(lead?.selfie_season),
    });
    return NextResponse.json({
      ok: true,
      membership: {
        id: membership.id,
        status: membership.status,
        plan: membership.plan,
        bumps: membership.bumps,
        amountPaise: membership.amount_paise,
        renewalPaise: membership.renewal_paise,
        currentPeriodEnd: membership.current_period_end,
        autopayStatus: membership.autopay_status,
        firstName: membership.first_name,
        source: membership.source,
      },
      quizDone: Boolean(lead && Object.keys(lead.answers ?? {}).some(key => key !== 'swipes') && lead.answers.skinTone),
      whatsappUrl: memberWhatsappLink(businessNumber, code, membership.first_name),
      schedule: schedule.map(step => ({ title: step.forHer, dueAt: step.dueAt })),
    }, { headers: noStore });
  } catch (error) {
    return errorResponse(error, 'member');
  }
}
