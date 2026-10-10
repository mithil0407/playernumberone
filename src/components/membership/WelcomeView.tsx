'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { MEMBERSHIP_PLANS, rupees, type MembershipPlanId } from '@/lib/styleMembershipConfig';
import { SUPPORT_WHATSAPP_URL } from '@/lib/siteFacts';
import { openRazorpay, postJson, readStore, trackAction, trackScreen, writeStore } from './client';
import type { MemberSession } from './QuizProvider';
import { Icon, Spinner, TopBar, cx } from './ui';
import s from './membership.module.css';

interface MemberData {
  membership: {
    id: string;
    status: string;
    plan: MembershipPlanId;
    bumps: string[];
    amountPaise: number;
    renewalPaise: number | null;
    currentPeriodEnd: string | null;
    autopayStatus: string;
    firstName: string | null;
    source: 'quiz' | 'sales_page';
  };
  quizDone: boolean;
  whatsappUrl: string | null;
  schedule: Array<{ title: string; dueAt: string }>;
}

function dateLabel(iso: string | null) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(iso));
}

export function WelcomeView() {
  const [session, setSession] = useState<MemberSession | null>(null);
  const [data, setData] = useState<MemberData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renewed, setRenewed] = useState(false);

  const load = useCallback(async (current: MemberSession) => {
    try {
      setData(await postJson<MemberData>('/api/style-membership/member', { membershipId: current.membershipId, code: current.code }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We couldn’t load your membership.');
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRenewed(params.get('renewed') === '1');
    const stored = readStore<MemberSession | null>('member', null);
    const fromUrl = params.get('m') && params.get('c') ? { membershipId: params.get('m')!, code: params.get('c')! } : null;
    const current = fromUrl ? { ...fromUrl, leadToken: stored?.membershipId === fromUrl.membershipId ? stored.leadToken : null } : stored;
    if (!current) {
      setError(params.get('renewed') === '1' ? null : 'Open this page from the link after your payment, or message us on WhatsApp.');
      return;
    }
    writeStore('member', current);
    setSession(current);
    void load(current);
    trackScreen('welcome', 0, null);
  }, [load]);

  if (renewed && !session) {
    return (
      <Shell>
        <h1 className={s.h1}>Thank you, you’re renewed</h1>
        <p className={s.lede}>Your next 3 months are paid. Your stylist is on WhatsApp whenever you need her.</p>
      </Shell>
    );
  }
  if (error) {
    return (
      <Shell>
        <h1 className={s.h1}>Your membership</h1>
        <p className={s.lede}>{error}</p>
        <a className={cx(s.cta, s.ctaWhatsapp)} href={SUPPORT_WHATSAPP_URL} style={{ marginTop: 24 }}><Icon name="whatsapp" /> Message ICONIK</a>
      </Shell>
    );
  }
  if (!data || !session) {
    return <Shell><div aria-busy="true" style={{ minHeight: 300 }} /></Shell>;
  }

  const { membership } = data;
  const plan = MEMBERSHIP_PLANS[membership.plan];
  const needsQuiz = membership.source === 'sales_page' && !data.quizDone;

  return (
    <Shell>
      <p className={s.eyebrow}>{membership.status === 'active' ? 'Payment received' : 'Almost there'}</p>
      <h1 className={s.h1}>{membership.firstName ? `Welcome, ${membership.firstName}.` : 'Welcome.'} You’re in.</h1>
      <p className={s.lede}>
        {plan.name}: {rupees(membership.amountPaise)} paid. Your membership runs to {dateLabel(membership.currentPeriodEnd)}.
      </p>

      {needsQuiz ? (
        <div className={s.card} style={{ marginTop: 22 }}>
          <p className={s.eyebrow} style={{ marginBottom: 6 }}>Step 1 of 2</p>
          <h2 className={s.h3}>Take your 3-minute style quiz</h2>
          <p className={s.small} style={{ margin: '6px 0 14px' }}>So your stylist knows your life, your shape and your colours before you say hello.</p>
          <Link href="/style-membership/quiz/welcome?member=1" className={s.cta} onClick={() => trackAction('member_quiz_start', { screen: 'welcome' })}>Start my quiz</Link>
        </div>
      ) : null}

      <div className={s.card} style={{ marginTop: 16 }}>
        {needsQuiz ? <p className={s.eyebrow} style={{ marginBottom: 6 }}>Step 2 of 2</p> : null}
        <h2 className={s.h3}>Say hello to your stylist on WhatsApp</h2>
        <p className={s.small} style={{ margin: '6px 0 14px' }}>The button opens WhatsApp with your member code typed in. Just tap send: the chat already knows you, so there’s nothing to install or log in to.</p>
        {data.whatsappUrl ? (
          <a className={cx(s.cta, s.ctaWhatsapp)} href={data.whatsappUrl} onClick={() => trackAction('whatsapp_open', { screen: 'welcome' })}>
            <Icon name="whatsapp" /> Open WhatsApp
          </a>
        ) : null}
        <p className={s.fine} style={{ margin: '10px 0 0', textAlign: 'center' }}>Your member code: <strong style={{ letterSpacing: '0.06em' }}>{session.code.toUpperCase()}</strong></p>
      </div>

      {membership.renewalPaise !== null ? <AutopayCard session={session} data={data} onDone={() => void load(session)} /> : null}

      <section className={s.section} aria-labelledby="next-title">
        <h2 id="next-title" className={s.h2} style={{ marginBottom: 16 }}>What happens next</h2>
        <ol className={s.timeline}>
          {data.schedule.slice(0, 8).map(step => (
            <li key={step.title}>{step.title}</li>
          ))}
        </ol>
      </section>

      <p className={s.fine} style={{ marginTop: 24 }}>
        Questions about your membership or a refund? <a href={SUPPORT_WHATSAPP_URL} style={{ color: 'inherit' }}>Message ICONIK support</a>.
      </p>
    </Shell>
  );
}

function AutopayCard({ session, data, onDone }: { session: MemberSession; data: MemberData; onDone: () => void }) {
  const { membership } = data;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(membership.autopayStatus === 'active');

  if (done) {
    return (
      <div className={s.notice} style={{ marginTop: 16, display: 'flex', gap: 10 }}>
        <Icon name="check" size={18} />
        <span>Autopay is set up. We’ll remind you on WhatsApp 3 days before each renewal of {rupees(membership.renewalPaise ?? 0)}.</span>
      </div>
    );
  }

  const setUp = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const mandate = await postJson<{ key: string; subscriptionId: string }>('/api/style-membership/mandate', { membershipId: session.membershipId, code: session.code });
      trackAction('mandate_open', { screen: 'welcome' });
      const response = await openRazorpay({
        key: mandate.key,
        subscription_id: mandate.subscriptionId,
        name: 'ICONIK',
        description: `Renews at ${rupees(membership.renewalPaise ?? 0)} every 3 months`,
        notes: { product: 'style_membership', membership_id: session.membershipId },
      });
      await postJson('/api/style-membership/mandate/confirm', { membershipId: session.membershipId, code: session.code, ...response });
      trackAction('mandate_done', { screen: 'welcome' });
      setDone(true);
      onDone();
    } catch (caught) {
      const text = caught instanceof Error ? caught.message : 'Please try again.';
      if (text !== 'dismissed') setMessage(text);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={s.card} style={{ marginTop: 16 }}>
      <p className={s.eyebrow} style={{ marginBottom: 6 }}>Optional</p>
      <h2 className={s.h3}>Set up autopay for your renewals</h2>
      <p className={s.small} style={{ margin: '6px 0 0' }}>
        Nothing is charged today. Your bank or UPI app approves renewals of {rupees(membership.renewalPaise ?? 0)} every 3 months, starting {dateLabel(membership.currentPeriodEnd)}. Some banks show a small authorisation that is refunded.
      </p>
      <ul className={s.small} style={{ margin: '10px 0 14px', paddingLeft: 18 }}>
        <li>A WhatsApp reminder 3 days before every charge</li>
        <li>Cancel anytime from WhatsApp or your UPI app</li>
        <li>Skip it, and we send a payment link before renewal instead</li>
      </ul>
      {message ? <p className={s.notice} role="status">{message}</p> : null}
      <button type="button" className={cx(s.cta, s.ctaSecondary)} onClick={() => void setUp()} disabled={busy} style={{ marginTop: message ? 12 : 0 }}>
        {busy ? <Spinner /> : null} Set up autopay
      </button>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <main className={s.page}>
        <div className={s.screen} style={{ paddingBottom: 48 }}>{children}</div>
      </main>
    </>
  );
}
