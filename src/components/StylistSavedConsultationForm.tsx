'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { consultationFormSections } from '@/lib/stylistConsultationForm';

export default function StylistSavedConsultationForm({ data, clientName, clientPhone, consultationDate, notes }: {
  data: Record<string, unknown>; clientName: string; clientPhone: string;
  consultationDate: string | null; notes: string | null;
}) {
  const sections = consultationFormSections(data);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  async function copy() {
    const text = [clientName, `Phone: ${clientPhone}`,
      consultationDate ? `Consultation: ${new Date(consultationDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}` : '',
      ...sections.flatMap(section => ['', section.title, ...section.fields.map(field => `${field.label}: ${field.value}`)]),
      notes ? `\nOriginal consultation notes: ${notes}` : '',
    ].filter(Boolean).join('\n');
    try { await navigator.clipboard.writeText(text); setCopied(true); setCopyError(''); }
    catch { setCopyError('Could not copy. You can select and copy the answers below.'); }
  }
  return <section id="consultation-form" aria-labelledby="consultation-form-title" className="ma-card scroll-mt-24 p-5 md:p-6">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div><h2 id="consultation-form-title" className="ma-h2">Saved consultation form</h2><p className="ma-faint mt-1 text-[13px]">Answers recorded during the consultation. Blank answers are omitted.</p></div>
      <button type="button" className="ma-btn ma-btn--secondary ma-btn--sm" onClick={() => void copy()}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Form copied' : 'Copy form'}</button>
    </div>
    {copyError && <p role="alert" className="ma-muted mb-3 text-[13px]">{copyError}</p>}
    {!sections.length && <p className="ma-muted text-[14px]">No consultation form answers have been saved for this client yet.</p>}
    <div className="space-y-6">{sections.map(section => <div key={section.title}>
      <h3 className="mb-2 text-[15px] font-semibold">{section.title}</h3>
      <dl className="grid gap-x-8 md:grid-cols-2">{section.fields.map(field => <div key={field.key} className="min-w-0 py-3" style={{ borderTop: '1px solid var(--ma-line-2)' }}>
        <dt className="ma-faint mb-1 text-[13px]">{field.label}</dt><dd className="whitespace-pre-line break-words text-[14px] leading-6">{field.value}</dd>
      </div>)}</dl>
    </div>)}</div>
    {notes && <div className="mt-6"><h3 className="mb-2 text-[15px] font-semibold">Original consultation notes</h3><p className="whitespace-pre-line break-words text-[14px] leading-6">{notes}</p></div>}
  </section>;
}
