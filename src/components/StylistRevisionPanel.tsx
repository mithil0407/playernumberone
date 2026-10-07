'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowRight, Check, Loader2, MessageSquareQuote } from 'lucide-react';
import { isRevisionOverdue, revisionProgress, type StylistReportRevision } from '@/lib/stylistReportRevisions';
import { isRevisedOutfitPageNumber } from '@/lib/stylistRevisedOutfits';

// Colours come from the staff kit (man-admin.css) so the panel matches the studio around it.
const S = { ink: 'var(--ma-ink)', muted: 'var(--ma-ink-3)', card: 'var(--ma-surface-2)', bg: 'var(--ma-surface)', border: 'var(--ma-line)', gold: 'var(--ma-amber)', danger: 'var(--ma-red)', done: 'var(--ma-green)' };

function dueLabel(revision: StylistReportRevision) {
  if (!revision.due_at) return null;
  const due = new Date(revision.due_at);
  const label = due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
  return isRevisionOverdue(revision)
    ? <span className="inline-flex items-center gap-1 luxury-body text-xs font-medium" style={{ color: S.danger }}><AlertTriangle size={13} /> Was due {label}</span>
    : <span className="luxury-body text-xs" style={{ color: S.muted }}>Due back {label}</span>;
}

/**
 * The client's brief, in the studio, next to the report it is about.
 *
 * Her message stays verbatim — it is the instruction, and the record of it —
 * with the checklist under it. Each change jumps to the page it concerns, so
 * the stylist works the list instead of hunting through 36 pages.
 */
export default function StylistRevisionPanel({
  revision,
  outfitStartPage,
  onGoToPage,
  onToggle,
}: {
  revision: StylistReportRevision;
  outfitStartPage: number;
  onGoToPage: (pageNumber: number) => void;
  onToggle: (itemId: string, done: boolean) => Promise<void>;
}) {
  const [saving, setSaving] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const { done, total } = revisionProgress(revision);

  const pageFor = (item: StylistReportRevision['scope'][number]) => {
    if (item.page_number) return item.page_number;
    // She counts looks from one; the report's outfit pages start further in.
    return item.outfit_number ? outfitStartPage + item.outfit_number - 1 : null;
  };

  const toggle = async (itemId: string, next: boolean) => {
    if (saving) return;
    setSaving(itemId);
    try { await onToggle(itemId, next); }
    finally { setSaving(''); }
  };

  return <section aria-label="Revision requested" className="ma-scope mx-4 md:mx-8 mt-5 rounded-3xl border px-5 py-4" style={{ background: S.bg, borderColor: 'rgba(138,90,11,0.28)', boxShadow: 'var(--ma-shadow-sm)' }}>
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="ma-pill ma-pill--amber"><span className="ma-pill__dot" />Revision requested</span>
      {dueLabel(revision)}
      <p className="luxury-body text-xs ml-auto tabular-nums" style={{ color: done === total ? S.done : S.muted }}>{done} of {total} done</p>
    </div>

    <button type="button" onClick={() => setShowMessage(open => !open)} className="flex items-start gap-2 mt-3 text-left w-full" aria-expanded={showMessage}>
      <MessageSquareQuote size={15} className="mt-0.5 shrink-0" style={{ color: S.muted }} aria-hidden="true" />
      <span className={`luxury-body text-sm leading-6 ${showMessage ? '' : 'line-clamp-2'}`} style={{ color: S.ink }}>“{revision.request_text}”</span>
    </button>

    <ul className="flex flex-col gap-2 mt-4">
      {revision.scope.map(item => {
        const page = pageFor(item);
        return <li key={item.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: item.done ? 'transparent' : S.card, border: `1px solid ${item.done ? S.border : 'transparent'}` }}>
          <button
            type="button"
            onClick={() => void toggle(item.id, !item.done)}
            aria-pressed={item.done}
            aria-label={item.done ? `Mark "${item.label}" as still to do` : `Mark "${item.label}" as done`}
            className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: item.done ? S.done : 'transparent', border: `1px solid ${item.done ? S.done : 'rgba(17,19,21,0.3)'}`, color: '#fff' }}
          >
            {saving === item.id ? <Loader2 size={12} className="animate-spin" style={{ color: item.done ? '#fff' : S.muted }} /> : item.done ? <Check size={13} /> : null}
          </button>
          <span className="flex-1 luxury-body text-sm leading-5" style={{ color: item.done ? S.muted : S.ink, textDecoration: item.done ? 'line-through' : undefined }}>
            {item.label}
          </span>
          {page && <button type="button" onClick={() => onGoToPage(page)} className="ma-btn ma-btn--secondary ma-btn--sm shrink-0">
            {isRevisedOutfitPageNumber(page) ? `New Look ${item.outfit_number ?? ''}`.trim() : item.outfit_number ? `Look ${item.outfit_number}` : `Page ${page}`} <ArrowRight size={13} />
          </button>}
        </li>;
      })}
    </ul>

    <p className="luxury-body text-xs mt-3" style={{ color: S.muted }}>
      {done === total
        ? 'All done. Publish the update — her link stays the same, and the message will tell her to open it again.'
        : 'Your client keeps reading the version you sent until you publish the update.'}
    </p>
  </section>;
}
