'use client';

import { useState } from 'react';
import { ArrowLeft, EyeOff } from 'lucide-react';

/**
 * Shown only on a staff preview of the client link, so a stylist always knows
 * whether the client can open it yet. Hide it to see the page exactly as the
 * client does.
 */
export default function StylistBlueprintPreviewBanner({
  live,
  publishedVersion = 0,
  hasUnpublishedChanges = false,
}: {
  live: boolean;
  /** 1 once delivered, 2 after a revision has been published. */
  publishedVersion?: number;
  /** True when this preview shows edits the client has not been given yet. */
  hasUnpublishedChanges?: boolean;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  // A preview mid-revision is the stylist's draft, not the copy her client can
  // open, and saying so is the whole point of this bar.
  const state = !live ? 'Not live yet' : hasUnpublishedChanges ? 'Your unpublished draft' : 'Link is live';
  const detail = !live
    ? 'Your client can open this link after Publish & deliver.'
    : hasUnpublishedChanges
      ? `Your client still sees the version you published${publishedVersion > 1 ? ` (version ${publishedVersion})` : ''}. Publish the update to send these changes.`
      : 'This is exactly what your client sees.';
  const back = () => {
    if (window.opener) window.close();
    else window.history.back();
  };
  return (
    <div
      role="status"
      className="print:hidden fixed left-1/2 top-3 z-[90] -translate-x-1/2 w-[min(640px,calc(100%-24px))] flex items-center gap-3 rounded-2xl px-4 py-2.5"
      style={{ background: 'rgba(28,24,21,0.92)', color: '#F4EFE5', border: '1px solid rgba(244,239,229,0.18)', boxShadow: '0 12px 36px rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)', fontFamily: 'var(--font-manrope), Manrope, ui-sans-serif, system-ui, sans-serif' }}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: live && !hasUnpublishedChanges ? '#7FB08C' : '#C9A96E' }} aria-hidden="true" />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-[13px] font-semibold">Client preview · {state}</p>
        <p className="text-[11px] truncate" style={{ opacity: 0.72 }}>{detail}</p>
      </div>
      <button type="button" onClick={() => setHidden(true)} className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px]" style={{ background: 'rgba(244,239,229,0.1)' }} title="Hide this bar to see the page exactly as your client does">
        <EyeOff size={13} /> <span className="hidden sm:inline">Hide</span>
      </button>
      <button type="button" onClick={back} className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium" style={{ background: '#F4EFE5', color: '#1C1815' }}>
        <ArrowLeft size={13} /> <span className="hidden sm:inline">Back to editor</span><span className="sm:hidden">Back</span>
      </button>
    </div>
  );
}
