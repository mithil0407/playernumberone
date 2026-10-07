'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, RefreshCw, Send, Users } from 'lucide-react';
import { Button, Pill, Segmented, type PillTone } from '@/components/manAdmin/ui';
import { occasionCampaign } from '@/lib/agentOccasionLooks';
import '@/components/manAdmin/man-admin.css';
import '../agent-admin.css';

export interface BoardLook {
  id: string;
  status: 'pending' | 'generating' | 'ready' | 'approved' | 'sent' | 'rejected' | 'failed';
  firstName: string | null;
  email: string | null;
  phone: string | null;
  outfit: string | null;
  hook: string | null;
  /** Only once he asked to see it. */
  imageUrl: string | null;
  error: string | null;
  whatsappChannel: 'template' | 'in_window' | null;
  whatsappSentAt: string | null;
  whatsappError: string | null;
  emailSentAt: string | null;
  emailError: string | null;
  response: string | null;
  reportToken: string;
}

type Filter = 'all' | 'to_invite' | 'invited' | 'engaged' | 'problems';
type SendMode = 'email' | 'whatsapp';

const SEND_MODES: Record<SendMode, { label: string; help: string; channels: { email: boolean; whatsapp: boolean } }> = {
  email: {
    label: '1 · Email',
    help: 'Free. "Your Diwali look is ready", with one button that opens WhatsApp with "Show me my Diwali look" typed. He sends it, and only then is his look drawn.',
    channels: { email: true, whatsapp: false },
  },
  whatsapp: {
    label: "2 · WhatsApp to those who didn't reply",
    help: 'A day or two after the email: the WhatsApp template (paid per message, text only) with a "Show me my look" button, to men who haven\'t replied yet. Free if his chat is already open.',
    channels: { email: false, whatsapp: true },
  },
};

interface SendSummary {
  dryRun: boolean;
  plan: Array<{ id: string; name: string | null; whatsapp: 'in_window' | 'template' | 'none'; email: boolean }>;
  whatsappSent: number;
  emailsSent: number;
  failed: Array<{ id: string; error: string }>;
  remaining: number;
}

function stage(look: BoardLook): { label: string; tone: PillTone } {
  if (look.status === 'rejected') return { label: 'Left out', tone: 'neutral' };
  if (look.status === 'approved') return { label: 'To invite', tone: 'amber' };
  if (look.response === 'love') return { label: 'Loved it', tone: 'green' };
  if (look.response === 'another') return { label: 'Wanted another', tone: 'blue' };
  if (look.imageUrl) return { label: 'Saw his look', tone: 'accent' };
  if (look.response) return { label: 'Replied', tone: 'blue' };
  return { label: 'Invited', tone: 'neutral' };
}

function matches(look: BoardLook, filter: Filter) {
  if (filter === 'to_invite') return look.status === 'approved';
  if (filter === 'invited') return look.status === 'sent' && !look.imageUrl && !look.response;
  if (filter === 'engaged') return Boolean(look.imageUrl || look.response);
  if (filter === 'problems') return Boolean(look.whatsappError || look.emailError || (look.error && !look.imageUrl));
  return true;
}

function planLine(summary: SendSummary, mode: SendMode) {
  if (mode === 'email') {
    const emails = summary.plan.filter(item => item.email).length;
    const without = summary.plan.length - emails;
    return `${emails} email${emails === 1 ? '' : 's'} to send${without ? ` · ${without} with no email (they'll get the WhatsApp step)` : ''}.`;
  }
  const template = summary.plan.filter(item => item.whatsapp === 'template').length;
  const inWindow = summary.plan.filter(item => item.whatsapp === 'in_window').length;
  return `${template} by WhatsApp template (paid) · ${inWindow} in an open chat (free).`;
}

async function post<T>(payload: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/agent/admin/looks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) throw new Error(body?.error || 'That did not work. Please try again.');
  return body as T;
}

function sentLine(look: BoardLook) {
  const parts = [
    look.emailSentAt && 'Email',
    look.whatsappSentAt && (look.whatsappChannel === 'template' ? 'WhatsApp template' : 'WhatsApp'),
  ].filter(Boolean);
  return parts.length ? `Invited by ${parts.join(' + ')}` : null;
}

function PersonRow({ look, busy, onSkip }: { look: BoardLook; busy: boolean; onSkip: (id: string, skip: boolean) => void }) {
  const current = stage(look);
  const problem = [look.whatsappError && `WhatsApp: ${look.whatsappError}`, look.emailError && `Email: ${look.emailError}`, !look.imageUrl && look.error && `Drawing: ${look.error}`]
    .filter(Boolean).join(' · ');
  return (
    <li className="al-row">
      <div className="al-thumb">{look.imageUrl ? <img src={look.imageUrl} alt={`${look.firstName ?? 'Client'} in his look`} loading="lazy" /> : <span>{(look.firstName ?? '?').charAt(0)}</span>}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="al-name">{look.firstName ?? 'No name'}</span>
          <Pill tone={current.tone} dot>{current.label}</Pill>
        </div>
        <p className="ma-faint mt-1 truncate text-[11px]">{[look.phone, look.email].filter(Boolean).join(' · ') || 'No contact'}{sentLine(look) ? ` · ${sentLine(look)}` : ''}</p>
        {look.outfit && <p className="al-outfit">{look.outfit}</p>}
        {problem && <p className="al-error">{problem}</p>}
      </div>
      <div className="al-row__actions">
        {look.status === 'approved' && <Button size="sm" variant="ghost" disabled={busy} onClick={() => onSkip(look.id, true)}>Leave out</Button>}
        {look.status === 'rejected' && <Button size="sm" disabled={busy} onClick={() => onSkip(look.id, false)}>Include</Button>}
        <a className="aa-text-action" href={`/man/report/${look.reportToken}`} target="_blank" rel="noreferrer">Report</a>
      </div>
    </li>
  );
}

export default function LooksBoard({ campaign, looks, loadError }: { campaign: string; looks: BoardLook[]; loadError: boolean }) {
  const router = useRouter();
  const config = occasionCampaign(campaign);
  const [filter, setFilter] = useState<Filter>('all');
  const [mode, setMode] = useState<SendMode>('email');
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ error?: string; message?: string }>({});
  const [plan, setPlan] = useState<SendSummary | null>(null);
  const [refreshing, startRefresh] = useTransition();
  const refresh = () => startRefresh(() => router.refresh());
  const chooseMode = (next: SendMode) => { setMode(next); setPlan(null); };

  const counts = useMemo(() => {
    const by = (test: (look: BoardLook) => boolean) => looks.filter(test).length;
    return {
      toInvite: by(look => look.status === 'approved'),
      invited: by(look => look.status === 'sent'),
      saw: by(look => Boolean(look.imageUrl)),
      loved: by(look => look.response === 'love'),
      engaged: by(look => matches(look, 'engaged')),
      waiting: by(look => matches(look, 'invited')),
      problems: by(look => matches(look, 'problems')),
    };
  }, [looks]);

  const run = async (key: string, task: () => Promise<string | void>) => {
    setBusy(key); setFeedback({});
    try {
      const message = await task();
      if (message) setFeedback({ message });
      router.refresh();
    } catch (error) {
      setFeedback({ error: error instanceof Error ? error.message : 'That did not work.' });
    } finally {
      setBusy(null);
    }
  };

  const prepare = () => run('prepare', async () => {
    const result = await post<{ listed: number; skipped: number }>({ campaign, action: 'prepare' });
    const skipped = result.skipped ? ` ${result.skipped} left out (no intake photos, no contact, or stopped messages).` : '';
    return result.listed
      ? `${result.listed} client${result.listed === 1 ? '' : 's'} added. Nothing is drawn until someone asks to see his look.${skipped}`
      : `Everyone with a delivered Blueprint is already on the list.${skipped}`;
  });
  const dryRun = () => run('dry', async () => {
    setPlan(await post<SendSummary>({ campaign, action: 'send', dryRun: true, ...SEND_MODES[mode].channels }));
  });
  const send = () => run('send', async () => {
    if (!plan) return;
    if (!window.confirm(`Send now? This messages real clients.\n\n${planLine(plan, mode)}`)) return;
    const summary = await post<SendSummary>({ campaign, action: 'send', dryRun: false, ...SEND_MODES[mode].channels });
    setPlan(null);
    return `Sent ${summary.emailsSent} email${summary.emailsSent === 1 ? '' : 's'} and ${summary.whatsappSent} WhatsApp message${summary.whatsappSent === 1 ? '' : 's'}.${summary.failed.length ? ` ${summary.failed.length} couldn't be sent (see Problems).` : ''}${summary.remaining ? ` ${summary.remaining} still to go: send again for the next batch.` : ''}`;
  });
  const skip = (id: string, leaveOut: boolean) => run(id, async () => { await post({ campaign, action: leaveOut ? 'skip' : 'unskip', id }); });

  const shown = looks.filter(look => matches(look, filter));

  return (
    <div className="ma-root aa-root">
      <header className="ma-glass aa-header">
        <div className="aa-header__inner">
          <Link href="/agent/admin" className="aa-brand">ICONIK<span>AGENT</span></Link>
          <Link href="/agent/admin" className="ma-btn ma-btn--ghost ma-btn--sm"><ArrowLeft size={13} /> Dashboard</Link>
        </div>
      </header>

      <main className="aa-main">
        <div className="aa-page-heading">
          <div>
            <div className="ma-eyebrow mb-3">ICONIK Agent · Occasion looks</div>
            <h1 className="ma-title aa-title">{config?.occasion ?? 'Occasion'} looks</h1>
            <p className="ma-muted mt-3 max-w-[640px] text-[14px] leading-relaxed">
              Tell every man with a delivered Blueprint that his look is ready. His look is only designed and drawn when he messages to see it,
              so credits go to people who engage. If he loves it, the agent asks for his pincode and size and finds the pieces that reach him in time.
            </p>
          </div>
          <div className="aa-page-actions">
            <Button iconOnly icon={<RefreshCw size={16} />} loading={refreshing} onClick={refresh} aria-label="Refresh" title="Refresh" />
            <Button variant="primary" icon={<Users size={15} />} loading={busy === 'prepare'} disabled={Boolean(busy)} onClick={() => void prepare()}>
              {looks.length ? 'Add new clients' : 'List Blueprint clients'}
            </Button>
          </div>
        </div>

        {loadError && <p role="alert" className="aa-form-feedback aa-form-feedback--error mb-5">Could not load the list. Has the agent_occasion_looks migration been run?</p>}

        <div className="al-stats">
          {([
            ['To invite', counts.toInvite],
            ['Invited', counts.invited],
            ['Saw his look', counts.saw],
            ['Loved it', counts.loved],
          ] as const).map(([label, value]) => (
            <div key={label} className="ma-card al-stat"><span className="ma-faint text-[11px]">{label}</span><span className="ma-num al-stat__value">{value}</span></div>
          ))}
        </div>

        <section className="ma-card al-send">
          <div className="min-w-0">
            <h2 className="ma-h2">Invite</h2>
            <div className="mt-3 max-w-full overflow-x-auto">
              <Segmented<SendMode> value={mode} onChange={chooseMode} options={(['email', 'whatsapp'] as const).map(value => ({ value, label: SEND_MODES[value].label }))} />
            </div>
            <p className="ma-faint mt-3 text-[12px] leading-relaxed">{SEND_MODES[mode].help}</p>
            <p className="mt-2 text-[12px] leading-relaxed">{plan ? planLine(plan, mode) : 'Check who gets what first. Sends go out 9am–9pm IST, up to 40 at a time.'}</p>
          </div>
          <div className="al-send__actions">
            <Button icon={<Eye size={14} />} disabled={!looks.length || Boolean(busy)} loading={busy === 'dry'} onClick={() => void dryRun()}>Check send</Button>
            <Button variant="dark" icon={<Send size={14} />} disabled={!plan || !plan.plan.length || Boolean(busy)} loading={busy === 'send'} onClick={() => void send()}>Send now</Button>
          </div>
        </section>

        {(feedback.error || feedback.message) && <p className={`aa-form-feedback ${feedback.error ? 'aa-form-feedback--error' : ''}`} role={feedback.error ? 'alert' : 'status'}>{feedback.error || feedback.message}</p>}

        <div className="al-toolbar">
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All', count: looks.length },
              { value: 'to_invite', label: 'To invite', count: counts.toInvite },
              { value: 'invited', label: 'No reply yet', count: counts.waiting },
              { value: 'engaged', label: 'Engaged', count: counts.engaged },
              { value: 'problems', label: 'Problems', count: counts.problems },
            ]}
          />
        </div>

        {shown.length
          ? <ul className="ma-card al-list">{shown.map(look => <PersonRow key={look.id} look={look} busy={busy === look.id} onSkip={skip} />)}</ul>
          : <div className="aa-empty"><p className="text-[14px] font-semibold">{looks.length ? 'Nobody here' : 'No clients listed yet'}</p><p className="ma-faint mx-auto mt-1 max-w-[320px] text-[12px] leading-relaxed">{looks.length ? 'Try another filter.' : 'List every man with a delivered Blueprint. It costs nothing.'}</p></div>}
      </main>
    </div>
  );
}
