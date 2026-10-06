'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { MAX_REVISION_REQUEST_CHARS, parseRevisionRequest } from '@/lib/stylistReportRevisions';

// Colours come from the staff kit (man-admin.css); the dialog carries .ma-scope so they resolve anywhere.
const C = { ink: 'var(--ma-ink)', muted: 'var(--ma-ink-3)', card: 'rgba(17,19,21,.05)', bg: 'var(--ma-surface)', surface: 'var(--ma-surface-2)', border: 'var(--ma-line)', gold: 'var(--ma-accent)', danger: 'var(--ma-red)' };

type Look = { number: number; title: string; occasion: string; revisedInRound: number | null };
/** Generated titles open with "Outfit 4 - "; the number is already shown beside it. */
function lookTitle(look: Look) {
  return look.title.replace(/^(?:outfit|look)\s*\d+\s*[-–:·]\s*/i, '').trim() || `Look ${look.number}`;
}

export type RevisionCreated = { firstPage: number | null; addedLooks: Array<{ replaces: number; page_number: number }>; open: boolean };

/**
 * Revising a delivered report. The stylist chooses the looks the client wants
 * changed — pasting her message ticks the ones it names — and each becomes a
 * blank revised page in the same design as the outfits, ready to fill in. The
 * client keeps reading the version she has until the update is published.
 */
export default function StylistRevisionRequestDialog({
  reportId,
  clientName,
  onClose,
  onDone,
}: {
  reportId: string;
  clientName: string;
  onClose: () => void;
  onDone: (result: RevisionCreated) => void;
}) {
  const [looks, setLooks] = useState<Look[] | null>(null);
  const [text, setText] = useState('');
  const [chosen, setChosen] = useState<number[]>([]);
  // Looks the stylist un-ticked by hand stay un-ticked as the paste changes.
  const [cleared, setCleared] = useState<number[]>([]);
  const [dropped, setDropped] = useState<string[]>([]);
  const [busy, setBusy] = useState<'save' | 'open' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/stylist-workspace/reports/${reportId}/revisions`, { cache: 'no-store' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not load the looks in this report');
        if (!cancelled) setLooks(data.looks ?? []);
      } catch (caught) {
        if (!cancelled) { setLooks([]); setError(caught instanceof Error ? caught.message : 'Could not load the looks in this report'); }
      }
    })();
    return () => { cancelled = true; };
  }, [reportId]);

  const parsed = useMemo(() => parseRevisionRequest(text), [text]);
  const scope = parsed.filter(item => !dropped.includes(item.id));
  const named = useMemo(() => [...new Set(parsed.map(item => item.outfit_number).filter((look): look is number => Boolean(look)))], [parsed]);
  const selected = useMemo(() => {
    const valid = new Set((looks ?? []).map(look => look.number));
    return [...new Set([...chosen, ...named.filter(look => !cleared.includes(look))])].filter(look => valid.has(look)).sort((a, b) => a - b);
  }, [chosen, named, cleared, looks]);

  const toggle = (look: number) => {
    if (selected.includes(look)) {
      setChosen(current => current.filter(item => item !== look));
      setCleared(current => [...current, look]);
    } else {
      setChosen(current => [...current, look]);
      setCleared(current => current.filter(item => item !== look));
    }
  };

  const canSubmit = (selected.length > 0 || scope.length > 0) && !busy;
  const submit = async (open: boolean) => {
    if (!canSubmit) return;
    setBusy(open ? 'open' : 'save');
    setError('');
    try {
      const response = await fetch(`/api/stylist-workspace/reports/${reportId}/revisions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestText: text.trim() || undefined, scope: text.trim() ? scope : undefined, looks: selected }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not start this revision');
      onDone({ firstPage: data.firstPage ?? null, addedLooks: data.addedLooks ?? [], open });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not start this revision');
      setBusy(null);
    }
  };

  const count = selected.length;
  const primaryLabel = count ? `Create ${count} revised look${count > 1 ? 's' : ''} and open` : 'Save and open the report';

  return <div role="dialog" aria-modal="true" aria-label={`Revise ${clientName}'s report`} onKeyDown={event => { if (event.key === 'Escape') onClose(); }} className="ma-scope ma-sheet-backdrop" style={{ zIndex: 80 }}>
    <div className="ma-sheet max-w-2xl p-6 md:p-7 overflow-y-auto" style={{ display: 'block' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="ma-eyebrow">Revise report</p>
          <h2 className="ma-h2 mt-1.5" style={{ fontSize: 20 }}>Which looks is {clientName} changing?</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="ma-btn ma-btn--ghost ma-btn--sm ma-btn--icon"><X size={16} /></button>
      </div>
      <p className="luxury-body text-sm leading-6 mt-3" style={{ color: C.muted }}>
        Each look you choose gets a new page in the same design as the outfits. Write the outfit and add its image there. {clientName} keeps her current version until you publish the update, and the original looks stay in the report, marked as revised.
      </p>

      <details className="mt-4 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}` }} open={Boolean(text)}>
        <summary className="cursor-pointer px-4 py-3 luxury-body text-sm" style={{ color: C.ink }}>Paste her message <span style={{ color: C.muted }}>(optional, ticks the looks she names)</span></summary>
        <div className="px-4 pb-4">
          <textarea
            value={text}
            maxLength={MAX_REVISION_REQUEST_CHARS}
            onChange={event => setText(event.target.value)}
            rows={4}
            placeholder="Paste the WhatsApp message…"
            className="ma-textarea"
          />
          {parsed.length > 0 && <ul className="flex flex-col gap-1.5 mt-3">
            {parsed.map(item => {
              const removed = dropped.includes(item.id);
              return <li key={item.id} className="flex items-start gap-2 rounded-lg px-3 py-2" style={{ background: removed ? 'transparent' : C.bg, border: `1px solid ${C.border}`, opacity: removed ? 0.45 : 1 }}>
                <span className="flex-1 luxury-body text-xs leading-5" style={{ color: C.ink, textDecoration: removed ? 'line-through' : undefined }}>
                  {item.label}
                  {item.outfit_number && <span className="ml-2 whitespace-nowrap" style={{ color: C.gold }}>Look {item.outfit_number}</span>}
                </span>
                <button type="button" onClick={() => setDropped(current => removed ? current.filter(id => id !== item.id) : [...current, item.id])} className="luxury-body text-[11px] underline underline-offset-4 shrink-0" style={{ color: C.muted }}>
                  {removed ? 'Keep' : 'Not a change'}
                </button>
              </li>;
            })}
          </ul>}
        </div>
      </details>

      <div className="flex items-baseline justify-between mt-5 mb-2">
        <p className="luxury-body text-sm font-medium" style={{ color: C.ink }}>Looks to revise</p>
        <p className="luxury-body text-xs tabular-nums" style={{ color: count ? C.ink : C.muted }}>{count ? `${count} selected` : 'None selected'}</p>
      </div>
      {!looks
        ? <div className="flex items-center gap-2 py-6 justify-center luxury-body text-sm" style={{ color: C.muted }}><Loader2 size={15} className="animate-spin" /> Loading the looks…</div>
        : looks.length === 0
          ? <p className="luxury-body text-sm py-3" style={{ color: C.muted }}>This report has no looks to revise.</p>
          : <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {looks.map(look => {
              const on = selected.includes(look.number);
              return <button
                key={look.number}
                type="button"
                onClick={() => toggle(look.number)}
                aria-pressed={on}
                className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6a1f2b]"
                style={{ background: on ? C.ink : C.surface, color: on ? C.bg : C.ink, border: `1px solid ${on ? C.ink : C.border}`, borderRadius: 14 }}
              >
                <span className="shrink-0 mt-0.5 w-4 h-4 rounded flex items-center justify-center" style={{ border: `1px solid ${on ? C.bg : 'rgba(17,19,21,.3)'}` }}>{on && <Check size={12} />}</span>
                <span className="min-w-0">
                  <span className="block luxury-body text-sm leading-5 truncate">
                    <span className="tabular-nums" style={{ opacity: 0.65 }}>{String(look.number).padStart(2, '0')}</span> {lookTitle(look)}
                  </span>
                  <span className="block luxury-body text-[11px] leading-4 truncate" style={{ opacity: 0.7 }}>
                    {[look.occasion, look.revisedInRound ? 'Already revised' : ''].filter(Boolean).join(' · ') || ' '}
                  </span>
                </span>
              </button>;
            })}
          </div>}

      {error && <p role="alert" className="rounded-xl p-3 mt-4 luxury-body text-sm" style={{ color: C.danger, background: '#F6E3DF' }}>{error}</p>}

      <div className="grid sm:grid-cols-2 gap-3 mt-6">
        <button type="button" onClick={() => void submit(true)} disabled={!canSubmit} className="ma-btn ma-btn--dark ma-btn--lg w-full">
          {busy === 'open' ? <Loader2 size={15} className="animate-spin" /> : null} {primaryLabel}
        </button>
        <button type="button" onClick={() => void submit(false)} disabled={!canSubmit} className="ma-btn ma-btn--secondary ma-btn--lg w-full">
          {busy === 'save' ? <Loader2 size={15} className="animate-spin" /> : null} Save for later
        </button>
      </div>
    </div>
  </div>;
}
