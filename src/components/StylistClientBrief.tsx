'use client';

import { useEffect, useState } from 'react';

type Brief = Record<string, unknown>;

const ROWS: Array<[keyof Brief & string, string]> = [
  ['westernIndian', 'Western / Indian'],
  ['goToOutfits', 'Go-to outfits'],
  ['loved', 'Loves'],
  ['avoided', 'Avoids'],
  ['footwear', 'Footwear'],
  ['boundaries', 'Boundaries'],
  ['fit', 'Fit'],
  ['colour', 'Colour preference'],
  ['metal', 'Metal'],
  ['occasions', 'Occasions'],
  ['notes', 'Your notes'],
];

function text(value: unknown): string {
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(', ');
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

/** The client's own answers, kept in view while a stylist edits outfits. */
export function StylistClientBrief({ reportId }: { reportId: string }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/stylist-blueprint/${reportId}/client-brief`, { cache: 'no-store' })
      .then(response => (response.ok ? response.json() : null))
      .then(data => { if (live && data?.brief) setBrief(data.brief); })
      .catch(() => undefined);
    return () => { live = false; };
  }, [reportId]);
  const rows = ROWS.map(([key, label]) => [label, text(brief?.[key])] as const).filter(([, value]) => value);
  if (!rows.length) return null;
  return (
    <details open className="mb-4 rounded-2xl border p-4" style={{ borderColor: 'var(--ma-line-2, #e5e5e5)' }}>
      <summary className="cursor-pointer text-[13px]" style={{ fontWeight: 600 }}>Client brief</summary>
      <dl className="mt-3 grid gap-2 text-[13px]">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[120px_1fr] gap-3">
            <dt style={{ opacity: 0.6 }}>{label}</dt>
            <dd style={{ fontWeight: label === 'Western / Indian' ? 600 : 400 }}>{value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
