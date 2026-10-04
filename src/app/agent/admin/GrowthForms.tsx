'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight, Check, Copy, Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/manAdmin/ui';

type Invite = { code: string; link: string | null };

async function post<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) throw new Error(body?.error || 'The request could not be completed. Please try again.');
  return body as T;
}

function Feedback({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null;
  return <p className={`aa-form-feedback ${error ? 'aa-form-feedback--error' : ''}`} role={error ? 'alert' : 'status'}>{error || message}</p>;
}

export function CampaignForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Invite | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true); setError('');
    try {
      const body = await post<{ campaign: Invite }>('/api/agent/admin/invites', { campaign: name.trim() });
      setCreated(body.campaign); setCopied(false); onCreated();
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not create the campaign.'); }
    finally { setBusy(false); }
  };
  const copy = async () => {
    if (!created) return;
    try { await navigator.clipboard.writeText(created.link ?? created.code); setCopied(true); setError(''); }
    catch { setError('Could not copy automatically. Select and copy the link below.'); }
  };
  return (
    <form onSubmit={submit} className="aa-form">
      <label className="ma-label" htmlFor="agent-campaign-name">Campaign name</label>
      <input id="agent-campaign-name" className="ma-input" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Power colours · October reel" maxLength={80} required />
      <p className="ma-faint mt-3 text-[12px] leading-relaxed">One link opens WhatsApp with a request for free colour analysis. Everyone using it can join directly.</p>
      <Button type="submit" variant="primary" loading={busy} disabled={!name.trim()} icon={<Plus size={15} />} className="mt-5">Create campaign link</Button>
      {created && <div className="aa-created mt-5"><div className="flex items-center gap-2 mb-2"><span className="aa-success-dot"><Check size={11} /></span><span className="text-[12px] font-semibold">Your campaign link is ready</span></div><p className="aa-created__link">{created.link ?? created.code}</p><Button size="sm" icon={copied ? <Check size={13} /> : <Copy size={13} />} onClick={() => void copy()} className="mt-3">{copied ? 'Copied' : created.link ? 'Copy link' : 'Copy code'}</Button></div>}
      <Feedback error={error} />
    </form>
  );
}

export function InviteForm({ onCreated }: { onCreated: () => void }) {
  const [count, setCount] = useState(10);
  const [maxUses, setMaxUses] = useState(1);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Invite[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const body = await post<{ invites: Invite[] }>('/api/agent/admin/invites', { count, maxUses, note });
      setCreated(body.invites); setCopied(false); onCreated();
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not create invitations.'); }
    finally { setBusy(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(created.map(invite => invite.link ?? invite.code).join('\n')); setCopied(true); setError(''); }
    catch { setError('Could not copy automatically. Select and copy the links below.'); }
  };
  return (
    <form onSubmit={submit} className="aa-form">
      <div className="grid grid-cols-2 gap-3">
        <label><span className="ma-label">Number of codes</span><input className="ma-input" type="number" min={1} max={200} step={1} required value={count} onChange={event => setCount(Number(event.target.value))} /></label>
        <label><span className="ma-label">People per code</span><input className="ma-input" type="number" min={1} max={10000} step={1} required value={maxUses} onChange={event => setMaxUses(Number(event.target.value))} /></label>
      </div>
      <label className="block mt-4"><span className="ma-label">Label <span className="ma-faint font-normal">· optional</span></span><input className="ma-input" value={note} onChange={event => setNote(event.target.value)} placeholder="e.g. First wave · friends & family" maxLength={200} /></label>
      <Button type="submit" variant="dark" loading={busy} icon={<UserPlus size={15} />} className="mt-5">Create invitations</Button>
      {created.length > 0 && <div className="aa-created mt-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[12px] font-semibold">{created.length} invitations ready</span><Button size="sm" icon={copied ? <Check size={13} /> : <Copy size={13} />} onClick={() => void copy()}>{copied ? 'Copied' : 'Copy all'}</Button></div><ul className="aa-created__codes">{created.map(invite => <li key={invite.code}><span className="aa-code">{invite.code}</span><span className="aa-created__link">{invite.link ?? 'Share this code in a WhatsApp message.'}</span></li>)}</ul></div>}
      <Feedback error={error} />
    </form>
  );
}

export function AdmitForm({ waiting, onAdmitted }: { waiting: number; onAdmitted: () => void }) {
  const [count, setCount] = useState(Math.min(10, Math.max(1, waiting)));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setResult('');
    try {
      const body = await post<{ admitted: number; notified: number }>('/api/agent/admin/waitlist', { count: Math.min(count, waiting, 500) });
      setResult(`${body.admitted} admitted · ${body.notified} notified on WhatsApp. Everyone else can join when they next message.`);
      onAdmitted();
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not admit people.'); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="aa-form">
      <div className="flex flex-wrap items-end gap-3"><label className="w-28"><span className="ma-label">People to admit</span><input type="number" className="ma-input" min={1} max={Math.min(500, Math.max(waiting, 1))} step={1} required value={Math.min(count, Math.max(waiting, 1))} onChange={event => setCount(Number(event.target.value))} disabled={!waiting} /></label><Button type="submit" variant="primary" disabled={!waiting} loading={busy} icon={<ArrowRight size={15} />}>Admit people</Button></div>
      <p className="ma-faint mt-3 text-[12px] leading-relaxed">{waiting ? 'People still inside their WhatsApp conversation window are notified immediately.' : 'Everyone on the waitlist has been admitted. New requests will appear here.'}</p>
      <Feedback error={error} message={result} />
    </form>
  );
}
