'use client';

import { useState } from 'react';
import { ArrowLeft, EyeOff } from 'lucide-react';

/**
 * Shown only on a staff preview of the client link, so a stylist always knows
 * whether the client can open it yet. Hide it to see the page exactly as the
 * client does.
 */
export default function StylistBlueprintPreviewBanner({ live }: { live: boolean }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  const back = () => {
    if (window.opener) window.close();
    else window.history.back();
  };
  return (
    <div
      role="status"
      className="fixed left-1/2 top-3 z-[90] -translate-x-1/2 w-[min(640px,calc(100%-24px))] flex items-center gap-3 rounded-2xl px-4 py-2.5"
      style={{ background: 'rgba(28,24,21,0.92)', color: '#F4EFE5', border: '1px solid rgba(244,239,229,0.18)', boxShadow: '0 12px 36px rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)', fontFamily: 'var(--font-manrope), Manrope, ui-sans-serif, system-ui, sans-serif' }}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: live ? '#7FB08C' : '#C9A96E' }} aria-hidden="true" />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-[13px] font-semibold">Client preview · {live ? 'Link is live' : 'Not live yet'}</p>
        <p className="text-[11px] truncate" style={{ opacity: 0.72 }}>{live ? 'This is exactly what your client sees.' : 'Your client can open this link after Publish & deliver.'}</p>
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
