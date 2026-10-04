'use client';

import { useMemo, useState, useTransition, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity, ArrowRight, ArrowUpRight, Check, ChevronRight, Clock3,
  CreditCard, Heart, Link2, LogOut, MessageCircle, Palette, Plus, RefreshCw,
  Search, ShoppingBag, Sparkles, UserRound, Users, Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, Button, Pill, Sheet } from '@/components/manAdmin/ui';
import type { AgentAnalytics, DailyPoint } from '@/lib/agentAnalytics';
import ActivityChart, { Sparkline } from './ActivityChart';
import { AdmitForm, CampaignForm, InviteForm } from './GrowthForms';
import '@/components/manAdmin/man-admin.css';
import './agent-admin.css';

type Section = 'overview' | 'growth' | 'shopping' | 'people';
type User = AgentAnalytics['recentUsers'][number];
type UserFilter = 'all' | 'free' | 'blueprint' | 'upgraded';

const SECTIONS: Array<{ id: Section; label: string; icon: LucideIcon }> = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'growth', label: 'Growth', icon: Sparkles },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { id: 'people', label: 'People', icon: Users },
];
const PAGE_COPY: Record<Section, { title: string; description: string }> = {
  overview: { title: 'Your agent, at a glance.', description: 'Follow the conversations, growth, and shopping that matter.' },
  growth: { title: 'Give good style a wider circle.', description: 'Campaigns, referrals, and the people waiting to get started.' },
  shopping: { title: 'From a good look to a great find.', description: 'See how recommendations turn into store visits, and what they cost.' },
  people: { title: 'Meet your newest regulars.', description: 'A closer look at the 30 most recently active people.' },
};
const KIND_LABELS: Record<string, string> = {
  chat: 'Conversations', search: 'Product searches', product_check: 'Store checks', memory: 'Memory',
  followup: 'Card summaries', checkin: 'Check-ins', other: 'Other',
};

export const count = (value: number) => Math.round(value).toLocaleString('en-IN');
const pct = (value: number) => `${Math.round(value * 100)}%`;
export function shortDay(day: string) {
  return new Date(day.length === 10 ? `${day}T12:00:00Z` : day).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata',
  });
}

function Metric({ label, value, detail, icon: Icon, points, accent = false }: {
  label: string; value: string; detail: ReactNode; icon: LucideIcon; points?: DailyPoint[]; accent?: boolean;
}) {
  return (
    <div className={`aa-metric ma-card ${accent ? 'aa-metric--accent' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="aa-metric__label">{label}</p>
        <span className="aa-icon"><Icon size={17} strokeWidth={1.7} /></span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        <p className="aa-metric__value ma-num">{value}</p>
        {points && <Sparkline points={points} />}
      </div>
      <p className="aa-metric__detail">{detail}</p>
    </div>
  );
}

function Panel({ title, description, children, aside, className = '' }: {
  title: string; description?: string; children: ReactNode; aside?: ReactNode; className?: string;
}) {
  return (
    <section className={`ma-card aa-panel ${className}`}>
      <div className="aa-panel__heading">
        <div className="min-w-0">
          <h2 className="ma-h2">{title}</h2>
          {description && <p className="ma-faint mt-1 text-[12px] leading-relaxed">{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Empty({ icon: Icon = Sparkles, title, description }: { icon?: LucideIcon; title: string; description: string }) {
  return (
    <div className="aa-empty">
      <span className="aa-empty__icon"><Icon size={23} strokeWidth={1.5} /></span>
      <p className="mt-3 text-[14px] font-semibold">{title}</p>
      <p className="ma-faint mx-auto mt-1 max-w-[290px] text-[12px] leading-relaxed">{description}</p>
    </div>
  );
}

function RankedBars({ rows, format, empty = 'The first results will show up here.' }: {
  rows: Array<{ label: string; value: number; note?: string }>; format: (value: number) => string; empty?: string;
}) {
  const max = Math.max(...rows.map(row => row.value), 1);
  if (!rows.length) return <Empty title="Nothing to show just yet" description={empty} />;
  return (
    <ul className="space-y-5">
      {rows.map((row, index) => (
        <li key={`${row.label}-${index}`}>
          <div className="mb-2 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate ma-muted">{row.label}</span>
            <span className="shrink-0 ma-num font-semibold">{format(row.value)}{row.note && <span className="ma-faint ml-2 font-normal">{row.note}</span>}</span>
          </div>
          <div className="aa-track"><div className="aa-track__fill" style={{ width: `${row.value / max * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

function Milestones({ data }: { data: AgentAnalytics }) {
  const top = data.funnel[0]?.value ?? 0;
  const icons = [Users, Palette, Link2, ShoppingBag, ArrowRight, CreditCard];
  return (
    <Panel title="The free user journey" description="Milestones reached · share of all free users" aside={<Pill>All time</Pill>}>
      {top === 0 ? <Empty icon={Users} title="Every journey starts with a hello" description="As people join, you’ll see which milestones they reach here." /> : (
        <div className="aa-milestones">
          {data.funnel.map((step, index) => {
            const Icon = icons[index] ?? Check;
            const label = index === 2 ? 'Received an invite to share' : index === data.funnel.length - 1 ? 'Started a Blueprint intake' : step.label;
            const ratio = step.value / top;
            return (
              <div key={step.label} className="aa-milestone">
                <span className="aa-milestone__icon"><Icon size={15} strokeWidth={1.7} /></span>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <span className="text-[12px] ma-muted">{label}</span>
                    <span className="ma-num text-[12px]"><b>{count(step.value)}</b><span className="ma-faint ml-2">{pct(ratio)}</span></span>
                  </div>
                  <div className="aa-track"><div className="aa-track__fill" style={{ width: `${Math.min(ratio, 1) * 100}%`, opacity: 1 - index * 0.1 }} /></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function Retention({ data }: { data: AgentAnalytics }) {
  return (
    <Panel title="Do people come back?" description="People who messaged again after their signup week">
      {data.cohorts.length ? (
        <>
          <div className="aa-table-wrap">
            <table className="aa-table aa-retention">
              <caption className="sr-only">Retention by signup week</caption>
              <thead><tr><th>Signup week</th><th>People</th><th>Week 1</th><th>Week 2</th><th>Week 4</th></tr></thead>
              <tbody>{data.cohorts.map(cohort => (
                <tr key={cohort.week}>
                  <td>{shortDay(cohort.week)}</td><td className="ma-faint">{count(cohort.users)}</td>
                  {cohort.retention.map((value, index) => (
                    <td key={index}><span className={`aa-heat ${value === null ? 'aa-heat--pending' : ''}`}
                      title={value === null ? 'This cohort is not old enough yet' : `${pct(value)} messaged again`}
                      style={value === null ? undefined : { background: `rgba(106,31,43,${0.045 + value * 0.78})`, color: value > 0.5 ? '#fff' : 'var(--ma-accent)' }}>
                      {value === null ? '—' : pct(value)}
                    </span></td>
                  ))}
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[11px] ma-faint">
            <span>— Waiting for the cohort to mature</span>
            <span className="flex items-center gap-2">Lower <span className="aa-heat-key" /> Higher</span>
          </div>
        </>
      ) : <Empty icon={Clock3} title="Retention takes a little time" description="Signup cohorts will appear as your first people join." />}
    </Panel>
  );
}

function SpendBreakdown({ data, money }: { data: AgentAnalytics; money: (value: number) => string }) {
  const colors = ['#6a1f2b', '#b97b85', '#cfabb1', '#2f6b4f', '#b6c4b0', '#d1bda2', '#dad7d0'];
  const total = data.spendByKind.reduce((sum, row) => sum + row.usd, 0);
  let cursor = 0;
  const stops = data.spendByKind.map((row, index) => {
    const start = cursor;
    cursor += total ? row.usd / total * 100 : 0;
    return `${colors[index % colors.length]} ${start}% ${cursor}%`;
  });
  return (
    <Panel title="Where AI spend goes" description="By kind of work · last 30 days">
      <div className="aa-spend-total">
        <div className="aa-donut" style={{ background: total ? `conic-gradient(${stops.join(',')})` : 'var(--ma-line-2)' }} aria-hidden="true"><div><Wallet size={22} strokeWidth={1.5} /></div></div>
        <div><p className="ma-faint text-[12px]">Total AI spend</p><p className="mt-1 text-[29px] font-semibold tracking-tight ma-num">{money(total)}</p></div>
      </div>
      {data.spendByKind.length ? <ul className="mt-6 space-y-3">{data.spendByKind.map((row, index) => (
        <li key={row.kind} className="flex items-center gap-2.5 text-[12px]">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colors[index % colors.length] }} />
          <span className="ma-muted">{KIND_LABELS[row.kind] ?? row.kind}</span>
          <span className="ml-auto ma-num font-semibold">{money(row.usd)}</span>
          <span className="w-9 text-right ma-faint ma-num">{pct(total ? row.usd / total : 0)}</span>
        </li>
      ))}</ul> : <p className="mt-5 text-[12px] ma-faint">Spend appears here as the agent starts working.</p>}
    </Panel>
  );
}

function UserList({ data, money, onSelect, compact = false }: {
  data: AgentAnalytics; money: (value: number) => string; onSelect: (user: User) => void; compact?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<UserFilter>('all');
  const [sort, setSort] = useState('activity');
  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    const rows = data.recentUsers.filter(user => (!query || `${user.name} ${user.phone}`.toLowerCase().includes(query))
      && (filter === 'all' || (filter === 'upgraded' ? user.upgraded : user.tier === filter)));
    if (sort === 'spend') rows.sort((a, b) => b.spendUsd - a.spendUsd);
    if (sort === 'messages') rows.sort((a, b) => b.messages30 - a.messages30);
    return compact ? rows.slice(0, 5) : rows;
  }, [data.recentUsers, search, filter, sort, compact]);

  return (
    <>
      {!compact && <div className="aa-people-toolbar">
        <label className="aa-search">
          <Search size={15} className="ma-faint" />
          <input className="ma-input" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name or phone ending" aria-label="Search recent people" />
        </label>
        <select className="ma-select aa-sort" value={sort} onChange={event => setSort(event.target.value)} aria-label="Sort people">
          <option value="activity">Recent activity</option><option value="spend">Highest AI spend</option><option value="messages">Most messages</option>
        </select>
        <div className="aa-filters" aria-label="Filter by tier">{([
          ['all', 'Everyone'], ['free', 'Free'], ['blueprint', 'Blueprint'], ['upgraded', 'Upgraded'],
        ] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
      </div>}
      {filtered.length ? compact ? (
        <div className="aa-recent-list">{filtered.map(user => (
          <button key={user.id} type="button" className="aa-recent-person" onClick={() => onSelect(user)}>
            <Avatar name={user.name} />
            <span className="min-w-0 flex-1 text-left"><span className="block truncate text-[13px] font-semibold">{user.name === '—' ? 'New client' : user.name}</span><span className="ma-faint mt-0.5 block text-[11px]">{user.phone} · {user.lastActive ? `Active ${shortDay(user.lastActive)}` : 'No messages yet'}</span></span>
            <Pill tone={user.tier === 'blueprint' ? 'accent' : 'neutral'}>{user.tier === 'free' ? 'Free' : 'Blueprint'}</Pill>
            <ChevronRight size={14} className="ma-faint" />
          </button>
        ))}</div>
      ) : (
        <>
        <div className="aa-people-cards">{filtered.map(user => (
          <button type="button" key={user.id} className="aa-people-card" onClick={() => onSelect(user)}>
            <span className="flex items-center gap-3"><Avatar name={user.name} /><span className="min-w-0 flex-1"><b className="block truncate text-[13px] font-semibold">{user.name === '—' ? 'New client' : user.name}</b><span className="ma-faint block mt-1 text-[11px]">{user.phone} · {user.lastActive ? shortDay(user.lastActive) : 'Not active yet'}</span></span><Pill tone={user.tier === 'blueprint' ? 'accent' : user.upgraded ? 'green' : 'neutral'}>{user.upgraded ? 'Upgraded' : user.tier === 'free' ? 'Free' : 'Blueprint'}</Pill><ChevronRight size={14} className="ma-faint" /></span>
            <span className="aa-people-card__stats"><span><small>Messages · 30d</small><b>{count(user.messages30)}</b></span><span><small>Hunts · all time</small><b>{count(user.runs)}</b></span><span><small>AI spend · 60d</small><b>{money(user.spendUsd)}</b></span></span>
          </button>
        ))}</div>
        <div className="aa-table-wrap aa-people-table-wrap">
          <table className="aa-table aa-people-table">
            <caption className="sr-only">30 most recently active agent users</caption>
            <thead><tr><th>Person</th><th>Membership</th><th>Last active</th><th>Messages <small>30d</small></th><th>Hunts <small>all time</small></th><th>Runs left</th><th>AI spend <small>60d</small></th><th><span className="sr-only">Details</span></th></tr></thead>
            <tbody>{filtered.map(user => (
              <tr key={user.id}>
                <td><button type="button" className="aa-person-name" onClick={() => onSelect(user)}><Avatar name={user.name} /><span><b>{user.name === '—' ? 'New client' : user.name}</b><span className="ma-faint block text-[11px]">{user.phone}</span></span></button></td>
                <td><Pill tone={user.tier === 'blueprint' ? 'accent' : user.upgraded ? 'green' : 'neutral'}>{user.upgraded ? 'Upgraded' : user.tier === 'free' ? 'Free' : 'Blueprint'}</Pill><span className="ma-faint mt-1 block text-[11px]">{user.line === 'man' ? 'Menswear' : user.line === 'woman' ? 'Womenswear' : 'Style not set'}</span></td>
                <td className="ma-muted">{user.lastActive ? shortDay(user.lastActive) : '—'}</td><td>{count(user.messages30)}</td><td>{count(user.runs)}</td><td>{user.credits === null ? 'Unlimited' : count(user.credits)}</td><td>{money(user.spendUsd)}</td>
                <td><Button iconOnly size="sm" variant="ghost" icon={<ChevronRight size={16} />} aria-label={`View ${user.name === '—' ? 'client' : user.name}`} onClick={() => onSelect(user)} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        </>
      ) : <Empty icon={Users} title={data.recentUsers.length ? 'No people match this view' : 'Your first people belong here'} description={data.recentUsers.length ? 'Try a different search or membership filter.' : 'Once someone starts chatting, their activity and usage will appear here.'} />}
      {!compact && <p className="ma-faint mt-4 text-[11px]">Showing {filtered.length} of {data.recentUsers.length} recent people. Phone numbers are masked.</p>}
    </>
  );
}

export default function AgentDashboard({ data, fxRate }: { data: AgentAnalytics; fxRate: number }) {
  const router = useRouter();
  const [section, setSection] = useState<Section>('overview');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [refreshing, startRefresh] = useTransition();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const { totals, series, looks, growth } = data;
  const money = (usd: number) => `₹${Math.round(usd * fxRate).toLocaleString('en-IN')}`;
  const copy = PAGE_COPY[section];
  const navigateSection = (next: Section) => { setSection(next); window.scrollTo({ top: 0, behavior: 'auto' }); };
  const refresh = () => startRefresh(() => router.refresh());
  const signOut = async () => {
    setSigningOut(true); setSignOutError('');
    try {
      const response = await fetch('/api/iconik-club/admin/logout', { method: 'POST' });
      if (response.ok) { router.push('/man/admin/login'); router.refresh(); }
      else setSignOutError('Could not sign out. Please try again.');
    } catch {
      setSignOutError('Could not sign out. Please try again.');
    } finally { setSigningOut(false); }
  };
  const upgraded = data.funnel.at(-1)?.value ?? 0;

  return (
    <div className="ma-root aa-root">
      <header className="ma-glass aa-header">
        <div className="aa-header__inner">
          <Link href="/agent/admin" className="aa-brand">ICONIK<span>AGENT</span></Link>
          <nav className="ma-seg aa-nav" aria-label="Agent dashboard sections">
            {SECTIONS.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-pressed={section === id} onClick={() => navigateSection(id)}><Icon size={14} strokeWidth={1.8} /><span>{label}</span></button>)}
          </nav>
          <div className="aa-header__actions">
            <Link href="/man/admin/dashboard" className="ma-btn ma-btn--ghost ma-btn--sm aa-man-link">Man admin <ArrowUpRight size={13} /></Link>
            <Button variant="ghost" size="sm" iconOnly icon={<LogOut size={15} />} loading={signingOut} aria-label="Sign out" title="Sign out" onClick={() => void signOut()} />
          </div>
        </div>
      </header>

      <main className="aa-main">
        {signOutError && <p role="alert" className="aa-form-feedback aa-form-feedback--error mb-5">{signOutError}</p>}
        <div className="aa-page-heading">
          <div>
            <div className="ma-eyebrow mb-3">ICONIK Agent · {SECTIONS.find(item => item.id === section)?.label}</div>
            <h1 className="ma-title aa-title">{copy.title}</h1>
            <p className="ma-muted mt-3 text-[14px] leading-relaxed">{copy.description}</p>
          </div>
          <div className="aa-page-actions">
            <span className="aa-updated"><Clock3 size={12} />{new Date(data.generatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' })} IST</span>
            <Button iconOnly icon={<RefreshCw size={16} />} loading={refreshing} onClick={refresh} aria-label="Refresh dashboard" title="Refresh dashboard" />
            <Button variant="primary" icon={<Plus size={15} />} onClick={() => { navigateSection('growth'); window.setTimeout(() => document.getElementById('agent-campaign-name')?.focus(), 0); }}>New campaign</Button>
          </div>
        </div>

        {section === 'overview' && <div className="aa-section">
          <div className="aa-metrics">
            <Metric label="Your community" value={count(totals.users)} detail={`${count(totals.newUsers7)} joined in the last 7 days`} icon={Users} points={series.newUsers} accent />
            <Metric label="Active in 7 days" value={count(totals.active7)} detail={`${count(totals.active1)} active in the last 24 hours`} icon={MessageCircle} points={series.activeUsers} />
            <Metric label="Colour cards · 7d" value={count(totals.colourCards7)} detail={`${count(totals.colourCardsTotal)} cards delivered all time`} icon={Palette} points={series.colourCards} />
            <Metric label="AI spend · 7d" value={money(totals.spend7)} detail={`${money(totals.costPerActiveUser7)} per active person`} icon={Wallet} points={series.spendUsd} />
          </div>
          <div className="aa-overview-grid">
            <ActivityChart series={series} fxRate={fxRate} />
            <Panel title="A week in conversation" description="Last 7 days" className="aa-week-panel">
              <div className="aa-week-stat"><MessageCircle size={17} /><span>Messages received</span><b>{count(totals.messages7)}</b></div>
              <div className="aa-week-stat"><ShoppingBag size={17} /><span>Product hunts</span><b>{count(totals.runs7)}</b></div>
              <div className="aa-week-stat"><ArrowUpRight size={17} /><span>Store visits</span><b>{count(totals.clickOuts7)}</b></div>
              <div className="aa-week-stat"><Link2 size={17} /><span>Invites delivered</span><b>{count(totals.inviteShares7)}</b></div>
              <div className="aa-membership">
                <div className="flex items-center justify-between text-[12px]"><span className="ma-muted">Community mix</span><span className="ma-num">{count(totals.users)} people</span></div>
                <div className="aa-membership__bar"><span style={{ width: `${totals.users ? totals.blueprintUsers / totals.users * 100 : 0}%` }} /></div>
                <div className="flex justify-between text-[11px] ma-faint"><span>{count(totals.freeUsers)} free</span><span>{count(totals.blueprintUsers)} Blueprint</span></div>
              </div>
              <button type="button" className="aa-text-action mt-5" onClick={() => navigateSection('people')}>Meet the people <ArrowRight size={14} /></button>
            </Panel>
          </div>
          <div className="aa-two-col"><Milestones data={data} /><Retention data={data} /></div>
          <div className="aa-overview-grid">
            <Panel title="Recently in the conversation" description="Your most recently active people" aside={<button type="button" className="aa-text-action" onClick={() => navigateSection('people')}>View all <ArrowRight size={14} /></button>}><UserList compact data={data} money={money} onSelect={setSelectedUser} /></Panel>
            <Panel title="Growing by word of mouth" description="A snapshot of your referral network">
              <div className="aa-referral-number"><span className="ma-num">{growth.kFactor.toFixed(2)}</span><Pill tone="accent">Referrals per user</Pill></div>
              <p className="ma-muted mt-3 text-[13px] leading-relaxed">{count(growth.referralJoins)} people joined through a friend’s invite.</p>
              <p className="ma-faint mt-2 text-[11px] leading-relaxed">Total referral joins ÷ total users, across all time.</p>
              <div className="aa-divider my-5" />
              <button type="button" className="aa-text-action" onClick={() => navigateSection('growth')}>Explore growth <ArrowRight size={14} /></button>
            </Panel>
          </div>
        </div>}

        {section === 'growth' && <div className="aa-section">
          <div className="aa-metrics">
            <Metric label="New people · 7d" value={count(totals.newUsers7)} detail={`${count(totals.users)} people in the community`} icon={Users} points={series.newUsers} accent />
            <Metric label="Friend referrals" value={count(growth.referralJoins)} detail={`${growth.kFactor.toFixed(2)} referral joins per user · all time`} icon={Link2} />
            <Metric label="On the waitlist" value={count(growth.waitlistWaiting)} detail={`${count(growth.waitlistJoined)} joined from the waitlist`} icon={Clock3} />
            <Metric label="Blueprint upgrades" value={count(upgraded)} detail="Free users who started a Blueprint intake" icon={Sparkles} />
          </div>
          <div className="aa-growth-grid">
            <Panel title="Create a campaign link" description="Give a reel, ad, or launch its own entry point." className="aa-campaign-panel" aside={<span className="aa-icon"><Link2 size={18} /></span>}><CampaignForm onCreated={refresh} /></Panel>
            <Panel title="Your referral circle" description="People bringing their friends to ICONIK">
              <RankedBars rows={growth.topInviters.map(row => ({ label: row.name, value: row.friends }))} format={value => `${count(value)} ${value === 1 ? 'friend' : 'friends'}`} empty="Your first successful inviters will appear here." />
            </Panel>
          </div>
          <Panel title="Campaign performance" description="From joining to their first product hunt · since each campaign launched" aside={<Pill>{data.campaigns.length} campaigns</Pill>}>
            {data.campaigns.length ? <div className="aa-table-wrap"><table className="aa-table aa-campaign-table"><caption className="sr-only">Campaign performance</caption>
              <thead><tr><th>Campaign</th><th>Joined</th><th>Colour cards</th><th>Did a hunt</th><th>Friends brought</th></tr></thead>
              <tbody>{data.campaigns.map(campaign => <tr key={campaign.code}>
                <td><b className="block">{campaign.name}</b><span className="aa-code">{campaign.code}</span></td><td>{count(campaign.joined)}</td>
                <td>{count(campaign.colourCards)}<span className="aa-cell-note">{campaign.joined ? pct(campaign.colourCards / campaign.joined) : '—'} of joined</span></td>
                <td>{count(campaign.hunted)}<span className="aa-cell-note">{campaign.joined ? pct(campaign.hunted / campaign.joined) : '—'} of joined</span></td><td>{count(campaign.friendsBrought)}</td>
              </tr>)}</tbody></table></div> : <Empty icon={Link2} title="Your next reel can start here" description="Create a campaign link above to see how many people join and keep going." />}
          </Panel>
          <div className="aa-two-col">
            <Panel title="Personal invitations" description="Create codes for a first wave, a partner, or a small group." aside={<Pill>{count(growth.redemptions)} redeemed</Pill>}>
              <InviteForm onCreated={refresh} />
              {growth.teamInvites.length > 0 && <details className="aa-details mt-6"><summary>Recent team codes <ChevronRight size={14} /></summary>
                <ul className="aa-invite-list">{growth.teamInvites.map(invite => <li key={invite.code}><div><span className="aa-code">{invite.code}</span>{invite.note && <p className="ma-faint mt-1 text-[11px]">{invite.note}</p>}</div><Pill>{count(invite.uses)} / {count(invite.maxUses)} used</Pill></li>)}</ul>
              </details>}
            </Panel>
            <Panel title="Open the door" description="Admit the next people from your waitlist." aside={<span className="aa-icon"><Users size={18} /></span>}>
              <div className="aa-mini-stats mb-6">{[['Waiting', growth.waitlistWaiting], ['Admitted', growth.waitlistAdmitted], ['Joined', growth.waitlistJoined]].map(([label, value]) => <div key={label}><p className="ma-faint text-[12px]">{label}</p><p className="mt-1 text-[25px] ma-num font-semibold">{count(Number(value))}</p></div>)}</div>
              <AdmitForm waiting={growth.waitlistWaiting} onAdmitted={refresh} />
            </Panel>
          </div>
          <div className="aa-two-col"><Milestones data={data} /><Retention data={data} /></div>
        </div>}

        {section === 'shopping' && <div className="aa-section">
          <div className="aa-metrics">
            <Metric label="Product hunts · 7d" value={count(totals.runs7)} detail={`${count(looks.created30)} Look pages created in 30 days`} icon={ShoppingBag} points={series.shoppingRuns} accent />
            <Metric label="Store visits · 30d" value={count(looks.clickOuts30)} detail={`${count(looks.views30)} Look page views`} icon={ArrowUpRight} points={series.clickOuts} />
            <Metric label="Cost per hunt" value={money(totals.costPerRun30)} detail="Search, checks, and summaries · 30 days" icon={Wallet} />
            <Metric label="AI spend · 30d" value={money(totals.spend30)} detail={`Converted at ₹${fxRate} per US dollar`} icon={CreditCard} points={series.spendUsd} />
          </div>
          <ActivityChart series={series} fxRate={fxRate} initialMetric="shoppingRuns" />
          <div className="aa-shopping-grid">
            <Panel title="How people use their Looks" description="Look page engagement · last 30 days" aside={<Heart size={18} className="ma-faint" />}>
              <div className="aa-engagement">{[
                ['Views', looks.views30], ['Loves', looks.likes30], ['Saves', looks.saves30], ['Shares', looks.shares30], ['Friend votes', looks.votes30], ['Store visits', looks.clickOuts30],
              ].map(([label, value]) => <div key={label}><p className="ma-faint text-[12px]">{label}</p><p className="mt-1 text-[25px] font-semibold ma-num">{count(Number(value))}</p></div>)}</div>
              <div className="aa-quality"><div><span className="ma-muted">Store clicks per Look view</span><b>{pct(looks.clickThroughRate)}</b></div><div><span className="ma-muted">Checked products in stock</span><b>{pct(looks.verifiedRate)}</b></div><p className="ma-faint text-[11px] mt-3">Stock checks cover the last 60 days. Clicks are visits, not confirmed purchases.</p></div>
            </Panel>
            <Panel title="Where people shop" description="Store click-outs · last 30 days"><RankedBars rows={looks.topRetailers.map(row => ({ label: row.retailer, value: row.clicks }))} format={count} empty="The stores people visit from their Looks will appear here." /></Panel>
            <SpendBreakdown data={data} money={money} />
          </div>
        </div>}

        {section === 'people' && <div className="aa-section">
          <div className="aa-metrics">
            <Metric label="All people" value={count(totals.users)} detail={`${count(totals.newUsers7)} joined in the last 7 days`} icon={Users} accent />
            <Metric label="Free members" value={count(totals.freeUsers)} detail="Getting to know their personal stylist" icon={UserRound} />
            <Metric label="Blueprint members" value={count(totals.blueprintUsers)} detail="Styling with their full profile" icon={Sparkles} />
            <Metric label="Active in 7 days" value={count(totals.active7)} detail={`${count(totals.active1)} active in the last 24 hours`} icon={MessageCircle} />
          </div>
          <Panel title="People & activity" description="Search, filter, and open a person to see their usage." aside={<Pill>{data.recentUsers.length} recent people</Pill>}><UserList data={data} money={money} onSelect={setSelectedUser} /></Panel>
        </div>}

        <footer className="aa-footer"><span>ICONIK Agent</span><span>Times in IST · AI costs shown in INR</span></footer>
      </main>

      <Sheet open={Boolean(selectedUser)} onClose={() => setSelectedUser(null)} title={selectedUser?.name === '—' ? 'New client' : selectedUser?.name ?? 'Client'} eyebrow="Agent member" width={520}>
        {selectedUser && <div>
          <div className="flex items-center gap-3 mb-6"><Avatar name={selectedUser.name} size={52} /><div><p className="ma-muted text-[14px]">{selectedUser.phone}</p><div className="mt-2 flex gap-2"><Pill tone={selectedUser.tier === 'blueprint' ? 'accent' : 'neutral'}>{selectedUser.tier === 'free' ? 'Free member' : 'Blueprint member'}</Pill>{selectedUser.upgraded && <Pill tone="green">Started a Blueprint</Pill>}</div></div></div>
          <dl className="aa-person-details">{[
            ['Joined', shortDay(selectedUser.joined)], ['Last active', selectedUser.lastActive ? shortDay(selectedUser.lastActive) : 'No messages yet'],
            ['Shopping for', selectedUser.line === 'man' ? 'Menswear' : selectedUser.line === 'woman' ? 'Womenswear' : 'Not set yet'],
            ['Messages in 30 days', count(selectedUser.messages30)], ['Product hunts, all time', count(selectedUser.runs)],
            ['Shopping runs left', selectedUser.credits === null ? 'Unlimited' : count(selectedUser.credits)], ['AI spend in 60 days', money(selectedUser.spendUsd)],
          ].map(([label, value]) => <div key={label}><dt className="ma-faint">{label}</dt><dd className="ma-num font-semibold">{value}</dd></div>)}</dl>
        </div>}
      </Sheet>
    </div>
  );
}
