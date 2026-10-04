'use client';

import { useMemo, useState } from 'react';
import type { AgentAnalytics, DailyPoint } from '@/lib/agentAnalytics';

const INK = '#1C1A17';
const MUTED = '#77706A';
const FAINT = '#ECE7E0';
const SURFACE = '#FFFFFF';
const BAR = '#9A6B1F';

function inr(usd: number, rate: number) {
  return `₹${Math.round(usd * rate).toLocaleString('en-IN')}`;
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function shortDay(day: string) {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function niceMax(value: number) {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find(candidate => candidate * power >= value) ?? 10;
  return step * power;
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ background: SURFACE, borderColor: FAINT }}>
      <p className="text-[12px] font-medium uppercase tracking-[0.08em]" style={{ color: MUTED }}>{label}</p>
      <p className="mt-2 text-[26px] font-semibold tabular-nums leading-none" style={{ color: INK }}>{value}</p>
      {sub ? <p className="mt-1.5 text-[12px]" style={{ color: MUTED }}>{sub}</p> : null}
    </div>
  );
}

/** A single-series daily column chart: one hue, hover tooltip, table view. */
function DailyBars({ title, points, format, summary = 'total' }: {
  title: string;
  points: DailyPoint[];
  format: (value: number) => string;
  /** Daily counts of distinct people don't add up; show their average instead. */
  summary?: 'total' | 'average';
}) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 620;
  const height = 180;
  const left = 44;
  const bottom = 22;
  const top = 10;
  const plotWidth = width - left - 8;
  const plotHeight = height - bottom - top;
  const max = niceMax(Math.max(...points.map(point => point.value), 0));
  const slot = plotWidth / points.length;
  const barWidth = Math.min(24, slot - 2);
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const ticks = [0, max / 2, max];

  return (
    <section className="rounded-2xl border p-4" style={{ background: SURFACE, borderColor: FAINT }}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[14px] font-semibold" style={{ color: INK }}>{title}</h3>
        <p className="text-[12px] tabular-nums" style={{ color: MUTED }}>
          30 days · {summary === 'average' ? `${format(total / Math.max(points.length, 1))} a day on average` : format(total)}
        </p>
      </div>
      <div className="relative mt-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`${title}, last 30 days`}>
          {ticks.map(tick => {
            const y = top + plotHeight - (tick / max) * plotHeight;
            return (
              <g key={tick}>
                <line x1={left} x2={width - 8} y1={y} y2={y} stroke={FAINT} strokeWidth={1} />
                <text x={left - 6} y={y + 4} textAnchor="end" fontSize={11} fill={MUTED}>{format(tick)}</text>
              </g>
            );
          })}
          {points.map((point, index) => {
            const barHeight = (point.value / max) * plotHeight;
            const x = left + index * slot + (slot - barWidth) / 2;
            const y = top + plotHeight - barHeight;
            const radius = Math.min(4, barHeight / 2, barWidth / 2);
            const path = barHeight > 0
              ? `M${x},${top + plotHeight} V${y + radius} Q${x},${y} ${x + radius},${y} H${x + barWidth - radius} Q${x + barWidth},${y} ${x + barWidth},${y + radius} V${top + plotHeight} Z`
              : '';
            return (
              <g key={point.day} onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)}>
                <rect x={left + index * slot} y={top} width={slot} height={plotHeight} fill="transparent" />
                {path ? <path d={path} fill={BAR} opacity={hover === null || hover === index ? 1 : 0.45} /> : null}
              </g>
            );
          })}
          {[0, Math.floor(points.length / 2), points.length - 1].map(index => (
            <text key={index} x={left + index * slot + slot / 2} y={height - 6} textAnchor="middle" fontSize={11} fill={MUTED}>
              {shortDay(points[index].day)}
            </text>
          ))}
        </svg>
        {hover !== null ? (
          <div
            className="pointer-events-none absolute -top-2 rounded-lg px-2.5 py-1.5 text-[12px] shadow-md"
            style={{
              left: `${((left + hover * slot + slot / 2) / width) * 100}%`,
              transform: 'translate(-50%, -100%)',
              background: INK,
              color: '#fff',
            }}
          >
            {shortDay(points[hover].day)} · <b className="tabular-nums">{format(points[hover].value)}</b>
          </div>
        ) : null}
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-[12px]" style={{ color: MUTED }}>Table view</summary>
        <table className="mt-2 w-full text-[12px] tabular-nums" style={{ color: INK }}>
          <tbody>
            {points.map(point => (
              <tr key={point.day} className="border-t" style={{ borderColor: FAINT }}>
                <td className="py-1">{shortDay(point.day)}</td>
                <td className="py-1 text-right">{format(point.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

/** Horizontal bars for a ranked list; label and value in ink, bar carries magnitude. */
function RankedBars({ rows, format }: { rows: Array<{ label: string; value: number; note?: string }>; format: (value: number) => string }) {
  const max = Math.max(...rows.map(row => row.value), 1);
  if (!rows.length) return <p className="text-[13px]" style={{ color: MUTED }}>Nothing yet.</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map(row => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span style={{ color: INK }}>{row.label}</span>
            <span className="tabular-nums" style={{ color: INK }}>
              {format(row.value)}{row.note ? <span style={{ color: MUTED }}> · {row.note}</span> : null}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full" style={{ background: FAINT }}>
            <div className="h-2 rounded-full" style={{ width: `${(row.value / max) * 100}%`, background: BAR }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Panel({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border p-5" style={{ background: SURFACE, borderColor: FAINT }}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold" style={{ color: INK }}>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function InviteForm() {
  const [count, setCount] = useState(10);
  const [maxUses, setMaxUses] = useState(1);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Array<{ code: string; link: string | null }>>([]);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const response = await fetch('/api/agent/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count, maxUses, note }),
    }).catch(() => null);
    setBusy(false);
    if (!response?.ok) { setError('Could not create codes.'); return; }
    const body = await response.json() as { invites: Array<{ code: string; link: string | null }> };
    setCreated(body.invites);
  };

  const copyAll = () => {
    void navigator.clipboard.writeText(created.map(invite => invite.link ?? invite.code).join('\n')).catch(() => undefined);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <label className="text-[12px]" style={{ color: MUTED }}>Codes
          <input type="number" min={1} max={200} value={count} onChange={event => setCount(Number(event.target.value))}
            className="mt-1 h-10 w-full rounded-lg border px-2 text-[14px]" style={{ borderColor: FAINT, color: INK }} />
        </label>
        <label className="text-[12px]" style={{ color: MUTED }}>Uses each
          <input type="number" min={1} max={10000} value={maxUses} onChange={event => setMaxUses(Number(event.target.value))}
            className="mt-1 h-10 w-full rounded-lg border px-2 text-[14px]" style={{ borderColor: FAINT, color: INK }} />
        </label>
        <label className="text-[12px]" style={{ color: MUTED }}>Note
          <input value={note} onChange={event => setNote(event.target.value)} placeholder="First wave"
            className="mt-1 h-10 w-full rounded-lg border px-2 text-[14px]" style={{ borderColor: FAINT, color: INK }} />
        </label>
      </div>
      <button type="submit" disabled={busy} className="h-10 rounded-lg px-4 text-[14px] font-medium text-white disabled:opacity-60" style={{ background: INK }}>
        {busy ? 'Creating…' : 'Create invite codes'}
      </button>
      {error ? <p className="text-[13px] text-[#A2442C]">{error}</p> : null}
      {created.length ? (
        <div className="rounded-lg border p-3" style={{ borderColor: FAINT }}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[12px]" style={{ color: MUTED }}>{created.length} codes · send the links on WhatsApp</p>
            <button type="button" onClick={copyAll} className="text-[12px] font-medium underline" style={{ color: INK }}>Copy all links</button>
          </div>
          <ul className="max-h-48 space-y-1 overflow-auto font-mono text-[12px]" style={{ color: INK }}>
            {created.map(invite => <li key={invite.code}>{invite.code}{invite.link ? ` — ${invite.link}` : ''}</li>)}
          </ul>
        </div>
      ) : null}
    </form>
  );
}

function CampaignForm() {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ code: string; link: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError('');
    const response = await fetch('/api/agent/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign: name }),
    }).catch(() => null);
    setBusy(false);
    if (!response?.ok) { setError('Could not create the link.'); return; }
    const body = await response.json() as { campaign: { code: string; link: string | null } };
    setCreated(body.campaign);
    setCopied(false);
  };
  const copy = () => {
    if (!created?.link) return;
    void navigator.clipboard.writeText(created.link).then(() => setCopied(true)).catch(() => undefined);
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[220px] flex-1 text-[12px]" style={{ color: MUTED }}>Campaign name
          <input value={name} onChange={event => setName(event.target.value)} placeholder="Colour reel — 5 Oct"
            className="mt-1 h-10 w-full rounded-lg border px-2 text-[14px]" style={{ borderColor: FAINT, color: INK }} />
        </label>
        <button type="submit" disabled={busy || !name.trim()} className="h-10 rounded-lg px-4 text-[14px] font-medium text-white disabled:opacity-50" style={{ background: INK }}>
          {busy ? 'Creating…' : 'Create link'}
        </button>
      </div>
      <p className="text-[12px]" style={{ color: MUTED }}>
        Opens WhatsApp with &ldquo;I want my free colour analysis 🎨&rdquo; typed in. Anyone can join with it — no waitlist.
      </p>
      {error ? <p className="text-[13px] text-[#A2442C]">{error}</p> : null}
      {created ? (
        <div className="rounded-lg border p-3" style={{ borderColor: FAINT }}>
          <p className="break-all font-mono text-[12px]" style={{ color: INK }}>{created.link ?? created.code}</p>
          <button type="button" onClick={copy} className="mt-2 text-[12px] font-medium underline" style={{ color: INK }}>
            {copied ? 'Copied ✓' : 'Copy link'}
          </button>
        </div>
      ) : null}
    </form>
  );
}

function AdmitForm({ waiting }: { waiting: number }) {
  const [count, setCount] = useState(Math.min(10, Math.max(1, waiting)));
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const response = await fetch('/api/agent/admin/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    }).catch(() => null);
    setBusy(false);
    if (!response?.ok) { setResult('Could not admit.'); return; }
    const body = await response.json() as { admitted: number; notified: number };
    setResult(`Admitted ${body.admitted}; ${body.notified} told now (inside WhatsApp's 24h window), the rest join when they next message.`);
  };
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <label className="text-[12px]" style={{ color: MUTED }}>Let in
        <input type="number" min={1} max={500} value={count} onChange={event => setCount(Number(event.target.value))}
          className="mt-1 h-10 w-24 rounded-lg border px-2 text-[14px]" style={{ borderColor: FAINT, color: INK }} />
      </label>
      <button type="submit" disabled={busy || !waiting} className="h-10 rounded-lg px-4 text-[14px] font-medium text-white disabled:opacity-50" style={{ background: INK }}>
        {busy ? 'Admitting…' : 'Admit from waitlist'}
      </button>
      {result ? <p className="w-full text-[13px]" style={{ color: MUTED }}>{result}</p> : null}
    </form>
  );
}

export default function AgentDashboard({ data, fxRate }: { data: AgentAnalytics; fxRate: number }) {
  const { totals, series, looks, growth } = data;
  const count = (value: number) => Math.round(value).toLocaleString('en-IN');
  const money = (usd: number) => inr(usd, fxRate);
  const funnelTop = Math.max(data.funnel[0]?.value ?? 0, 1);
  const kindLabels: Record<string, string> = {
    chat: 'Conversation', search: 'Product search', product_check: 'Store checks', memory: 'Memory',
    followup: 'Card summaries', checkin: 'Event check-ins', other: 'Other',
  };
  const spendRows = useMemo(
    () => data.spendByKind.map(row => ({ label: kindLabels[row.kind] ?? row.kind, value: row.usd })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.spendByKind],
  );

  return (
    <main className="min-h-screen pb-16" style={{ background: '#F7F4EF', color: INK }}>
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.14em]" style={{ color: MUTED }}>ICONIK Agent</p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight">Analytics</h1>
          </div>
          <p className="text-[12px]" style={{ color: MUTED }}>
            Updated {new Date(data.generatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' })} ·
            {' '}<a href="/agent/admin" className="underline">Refresh</a>
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tile label="Users" value={count(totals.users)} sub={`${count(totals.freeUsers)} free · ${count(totals.blueprintUsers)} Blueprint · +${count(totals.newUsers7)} this week`} />
          <Tile label="Active today" value={count(totals.active1)} sub={`${count(totals.active7)} active in 7 days`} />
          <Tile label="Colour cards, 7 days" value={count(totals.colourCards7)} sub={`${count(totals.colourCardsTotal)} all time · ${count(totals.inviteShares7)} invites shared`} />
          <Tile label="Product hunts, 7 days" value={count(totals.runs7)} sub={`${count(totals.clickOuts7)} store click-outs`} />
          <Tile label="AI spend, 7 days" value={money(totals.spend7)} sub={`${money(totals.spend30)} in 30 days`} />
          <Tile label="Messages, 7 days" value={count(totals.messages7)} sub={`${money(totals.costPerActiveUser7)} AI cost per active user`} />
          <Tile label="Cost per product hunt" value={money(totals.costPerRun30)} sub="search + checks + cards, 30 days" />
          <Tile label="Viral coefficient" value={growth.kFactor.toFixed(2)} sub={`${count(growth.referralJoins)} friends joined by invite`} />
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          <DailyBars title="Daily active users" points={series.activeUsers} format={count} summary="average" />
          <DailyBars title="Messages received" points={series.messages} format={count} />
          <DailyBars title="Product hunts" points={series.shoppingRuns} format={count} />
          <DailyBars title="Store click-outs" points={series.clickOuts} format={count} />
          <DailyBars title="New users" points={series.newUsers} format={count} />
          <DailyBars title="Colour cards sent" points={series.colourCards} format={count} />
          <DailyBars title="AI spend (₹)" points={series.spendUsd.map(point => ({ ...point, value: point.value * fxRate }))} format={value => `₹${Math.round(value).toLocaleString('en-IN')}`} />
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          <Panel title="Reel & campaign links">
            <CampaignForm />
          </Panel>
          <Panel title="Campaign results" aside={<span className="text-[12px]" style={{ color: MUTED }}>since each link was made</span>}>
            {data.campaigns.length ? (
              <div className="-mx-5 overflow-x-auto px-5">
                <table className="w-full min-w-[460px] text-[13px] tabular-nums">
                  <thead>
                    <tr style={{ color: MUTED }}>
                      {['Campaign', 'Joined', 'Colour cards', 'Did a hunt', 'Friends brought'].map(heading => (
                        <th key={heading} className={`pb-2 font-medium ${heading === 'Campaign' ? 'text-left' : 'text-right'}`}>{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns.map(campaign => (
                      <tr key={campaign.code} className="border-t" style={{ borderColor: FAINT }}>
                        <td className="py-2">{campaign.name}<span className="ml-2 font-mono text-[11px]" style={{ color: MUTED }}>{campaign.code}</span></td>
                        <td className="py-2 text-right">{count(campaign.joined)}</td>
                        <td className="py-2 text-right">{count(campaign.colourCards)}{campaign.joined ? <span style={{ color: MUTED }}> · {pct(campaign.colourCards / campaign.joined)}</span> : null}</td>
                        <td className="py-2 text-right">{count(campaign.hunted)}</td>
                        <td className="py-2 text-right">{count(campaign.friendsBrought)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-[13px]" style={{ color: MUTED }}>Create a link for your reel to see who joins through it.</p>}
          </Panel>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          <Panel title="Free-user funnel">
            <RankedBars rows={data.funnel.map(step => ({ label: step.label, value: step.value, note: pct(step.value / funnelTop) }))} format={count} />
          </Panel>
          <Panel title="Retention by signup week" aside={<span className="text-[12px]" style={{ color: MUTED }}>share who messaged again</span>}>
            {data.cohorts.length ? (
              <table className="w-full text-[13px] tabular-nums">
                <thead>
                  <tr style={{ color: MUTED }}>
                    <th className="pb-2 text-left font-medium">Week of</th>
                    <th className="pb-2 text-right font-medium">Users</th>
                    <th className="pb-2 text-right font-medium">Week 1</th>
                    <th className="pb-2 text-right font-medium">Week 2</th>
                    <th className="pb-2 text-right font-medium">Week 4</th>
                  </tr>
                </thead>
                <tbody>
                  {data.cohorts.map(cohort => (
                    <tr key={cohort.week} className="border-t" style={{ borderColor: FAINT }}>
                      <td className="py-2">{shortDay(cohort.week)}</td>
                      <td className="py-2 text-right">{cohort.users}</td>
                      {cohort.retention.map((value, index) => (
                        <td key={index} className="py-1 text-right">
                          {value === null ? <span style={{ color: MUTED }}>—</span> : (
                            <span className="inline-block min-w-12 rounded-md px-2 py-1" style={{ background: `rgba(154,107,31,${0.08 + value * 0.5})` }}>{pct(value)}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-[13px]" style={{ color: MUTED }}>No signups yet.</p>}
          </Panel>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          <Panel title="Look pages, 30 days">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
              {[
                ['Looks sent', looks.created30], ['Views', looks.views30], ['Loves', looks.likes30], ['Saves', looks.saves30],
                ['Friend votes', looks.votes30], ['Shares', looks.shares30], ['Click-outs', looks.clickOuts30],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt style={{ color: MUTED }}>{label}</dt>
                  <dd className="text-[18px] font-semibold tabular-nums">{count(Number(value))}</dd>
                </div>
              ))}
              <div>
                <dt style={{ color: MUTED }}>Click-through</dt>
                <dd className="text-[18px] font-semibold tabular-nums">{pct(looks.clickThroughRate)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-[12px]" style={{ color: MUTED }}>{pct(looks.verifiedRate)} of checked products were confirmed in stock.</p>
          </Panel>
          <Panel title="Click-outs by store">
            <RankedBars rows={looks.topRetailers.map(row => ({ label: row.retailer, value: row.clicks }))} format={count} />
          </Panel>
          <Panel title="Where AI spend goes, 30 days">
            <RankedBars rows={spendRows} format={money} />
          </Panel>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          <Panel title="Invites" aside={<span className="text-[12px]" style={{ color: MUTED }}>{count(growth.redemptions)} redeemed</span>}>
            <InviteForm />
            {growth.teamInvites.length ? (
              <details className="mt-4">
                <summary className="cursor-pointer text-[12px]" style={{ color: MUTED }}>Recent team codes</summary>
                <ul className="mt-2 space-y-1 font-mono text-[12px]">
                  {growth.teamInvites.map(invite => (
                    <li key={invite.code}>{invite.code} · {invite.uses}/{invite.maxUses}{invite.note ? ` · ${invite.note}` : ''}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </Panel>
          <Panel title="Waitlist & referrals">
            <dl className="mb-4 grid grid-cols-3 gap-3 text-[13px]">
              <div><dt style={{ color: MUTED }}>Waiting</dt><dd className="text-[18px] font-semibold tabular-nums">{count(growth.waitlistWaiting)}</dd></div>
              <div><dt style={{ color: MUTED }}>Admitted</dt><dd className="text-[18px] font-semibold tabular-nums">{count(growth.waitlistAdmitted)}</dd></div>
              <div><dt style={{ color: MUTED }}>Joined</dt><dd className="text-[18px] font-semibold tabular-nums">{count(growth.waitlistJoined)}</dd></div>
            </dl>
            <AdmitForm waiting={growth.waitlistWaiting} />
            <h3 className="mb-2 mt-5 text-[13px] font-semibold">Top inviters</h3>
            <RankedBars rows={growth.topInviters.map(row => ({ label: row.name, value: row.friends }))} format={value => `${count(value)} friends`} />
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title="Users" aside={<span className="text-[12px]" style={{ color: MUTED }}>most recently active</span>}>
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[720px] text-[13px] tabular-nums">
                <thead>
                  <tr style={{ color: MUTED }}>
                    {['Name', 'Phone', 'Tier', 'Joined', 'Last active', 'Msgs 30d', 'Hunts', 'Runs left', 'AI spend'].map(heading => (
                      <th key={heading} className={`pb-2 font-medium ${['Name', 'Phone', 'Tier'].includes(heading) ? 'text-left' : 'text-right'}`}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recentUsers.map(user => (
                    <tr key={user.id} className="border-t" style={{ borderColor: FAINT }}>
                      <td className="py-2">{user.name}{user.upgraded ? <span className="ml-2 rounded-full px-2 py-0.5 text-[11px]" style={{ background: FAINT }}>bought Blueprint</span> : null}</td>
                      <td className="py-2" style={{ color: MUTED }}>{user.phone}</td>
                      <td className="py-2">{user.tier === 'free' ? 'Free' : 'Blueprint'}{user.line ? <span style={{ color: MUTED }}> · {user.line === 'man' ? 'men' : 'women'}</span> : null}</td>
                      <td className="py-2 text-right">{shortDay(user.joined.slice(0, 10))}</td>
                      <td className="py-2 text-right">{user.lastActive ? shortDay(user.lastActive.slice(0, 10)) : '—'}</td>
                      <td className="py-2 text-right">{user.messages30}</td>
                      <td className="py-2 text-right">{user.runs}</td>
                      <td className="py-2 text-right">{user.credits ?? '∞'}</td>
                      <td className="py-2 text-right">{money(user.spendUsd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
