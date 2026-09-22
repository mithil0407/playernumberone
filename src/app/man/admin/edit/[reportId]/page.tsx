'use client';

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, CheckCircle2, ExternalLink, Loader2, RotateCcw, Save, Send, Trash2, Upload } from 'lucide-react';
import { extractOutfitBlock, parseManOutfitsFromSection, toOutfitTitleCase } from '@/lib/manOutfitSection';
import type { ReportData } from '@/lib/manReportGenerator';
import type { ManEditIssueContent } from '@/lib/manEditIssueTypes';
import type { ManShoppingState } from '@/lib/manShopping';

const S = {
  panel: '#0f0f0f',
  row: '#141414',
  border: '#1e1e1e',
  ink: '#f0ebe0',
  muted: '#6b5f4a',
  soft: '#a39880',
  gold: '#c9a96e',
  success: '#5A8B6A',
  error: '#C4645A',
};

interface IssueReport {
  id: string;
  status: string;
  progress_stage: string | null;
  error_message: string | null;
  share_token: string;
  sent_at: string | null;
  report_data: ReportData | null;
  image_urls: { outfitCards?: (string | null)[] } | null;
  section_approvals: Record<string, boolean> | null;
  shopping_data: ManShoppingState | null;
  man_intake_submissions: { customer_email: string } | null;
}

const inputStyle = { background: S.row, border: `1px solid ${S.border}`, color: S.ink };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.18em] mb-1.5" style={{ color: S.muted }}>{label}</span>
      {children}
    </label>
  );
}

export default function ManEditIssueReviewPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = use(params);
  const [report, setReport] = useState<IssueReport | null>(null);
  const [draft, setDraft] = useState<ManEditIssueContent | null>(null);
  const [outfitTexts, setOutfitTexts] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const uploadTarget = useRef<number | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/man-report/${reportId}?fresh=1`, { cache: 'no-store' });
    if (!res.ok) {
      setNotice({ tone: 'error', text: 'Could not load this issue.' });
      return;
    }
    const data = await res.json();
    const next = data.report as IssueReport;
    setReport(next);
    setDraft(current => current ?? next.report_data?.edit ?? null);
    const s4 = next.report_data?.sections?.s4_outfits ?? '';
    setOutfitTexts(Object.fromEntries(parseManOutfitsFromSection(s4).map(outfit => [outfit.number, extractOutfitBlock(s4, outfit.number) ?? outfit.block])));
  }, [reportId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!report?.progress_stage && report?.shopping_data?.status !== 'fetching' && report?.shopping_data?.status !== 'ranking') return;
    const timer = setInterval(() => { void load(); }, 6000);
    return () => clearInterval(timer);
  }, [report?.progress_stage, report?.shopping_data?.status, load]);

  // Once the writer finishes, adopt its text into the editable draft.
  useEffect(() => {
    if (!draft && report?.report_data?.edit) setDraft(report.report_data.edit);
  }, [draft, report?.report_data?.edit]);

  const s4 = report?.report_data?.sections?.s4_outfits ?? '';
  const outfits = useMemo(() => parseManOutfitsFromSection(s4), [s4]);
  const images = report?.image_urls?.outfitCards ?? [];
  const missingPhotos = outfits.filter(outfit => !images[outfit.number - 1]).map(outfit => outfit.number);
  const qaIssues = report?.report_data?.qa?.section4?.issues ?? [];
  const isSent = report?.status === 'sent';
  const working = Boolean(report?.progress_stage);
  const approved = Boolean(report?.section_approvals?.s4);
  const dirty = Boolean(draft && report?.report_data?.edit && JSON.stringify(draft) !== JSON.stringify(report.report_data.edit));

  const run = async (key: string, action: () => Promise<Response>, success: string) => {
    setBusy(key);
    setNotice(null);
    try {
      const res = await action();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setNotice({ tone: 'ok', text: success });
      await load();
      return data;
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : 'Something went wrong' });
      return null;
    } finally {
      setBusy('');
    }
  };

  const saveText = () => draft && report?.report_data && run('save', () => fetch(`/api/man-report/${reportId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ report_data: { ...report.report_data, edit: draft } }),
  }), 'Issue text saved.');

  const reshoot = (outfitNumber: number) => run(`outfit-${outfitNumber}`, () => fetch(`/api/man-report/${reportId}/regenerate-outfit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outfitNumber, outfitText: outfitTexts[outfitNumber] }),
  }), `Look ${outfitNumber} rewritten and reshot.`);

  const uploadPhoto = async (file: File) => {
    const outfitNumber = uploadTarget.current;
    if (!outfitNumber) return;
    const form = new FormData();
    form.set('imageType', 'outfit');
    form.set('outfitNumber', String(outfitNumber));
    form.set('replace', '1');
    form.set('image', file);
    await run(`outfit-${outfitNumber}`, () => fetch(`/api/man-report/${reportId}/manual-image`, { method: 'POST', body: form }), `Photo for look ${outfitNumber} replaced.`);
  };

  const renderMissing = () => run('render', () => fetch(`/api/man-edit/admin/issues/${reportId}`, { method: 'POST' }), 'Rendering the missing photos — this page updates as they land.');

  const approveLooks = () => report && run('approve', () => fetch(`/api/man-report/${reportId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ section_approvals: { ...(report.section_approvals ?? {}), s4: true } }),
  }), 'Looks approved — shopping links are being fetched.');

  const send = () => {
    if (!report) return;
    const email = report.man_intake_submissions?.customer_email ?? 'the client';
    if (!window.confirm(`Email Issue ${draft?.issueNumber} to ${email}? This can't be undone.`)) return;
    return run('send', () => fetch(`/api/man-report/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sent' }),
    }), `Sent to ${email}.`);
  };

  const discard = async () => {
    if (!window.confirm('Discard this draft? The issue will be written again from scratch next time.')) return;
    const data = await run('discard', () => fetch(`/api/man-edit/admin/issues/${reportId}`, { method: 'DELETE' }), 'Draft discarded.');
    if (data) window.location.href = '/man/admin/edit';
  };

  if (!report) {
    return <div className="flex items-center gap-2 text-sm" style={{ color: S.muted }}><Loader2 size={14} className="animate-spin" /> Loading issue…</div>;
  }

  const setOutfitMeta = (number: number, occasion: string) => draft && setDraft({
    ...draft,
    outfits: draft.outfits.map(item => item.number === number ? { ...item, occasion } : item),
  });

  return (
    <div className="max-w-6xl">
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={event => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void uploadPhoto(file);
        }}
      />

      <Link href="/man/admin/edit" className="inline-flex items-center gap-2 text-xs mb-5" style={{ color: S.muted }}>
        <ArrowLeft size={13} /> All subscribers
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: S.muted }}>
            The Iconik Edit · Issue {draft?.issueNumber ?? '—'}{draft?.periodLabel ? ` · ${draft.periodLabel}` : ''}
          </p>
          <h1 className="text-2xl font-semibold" style={{ color: S.ink }}>{draft?.title || 'Writing this issue…'}</h1>
          <p className="text-sm mt-1" style={{ color: S.muted }}>{report.man_intake_submissions?.customer_email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/man/edit/${report.share_token}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: S.panel, border: `1px solid ${S.border}`, color: S.soft }}>
            <ExternalLink size={13} /> Client view
          </a>
          {!isSent && (
            <>
              <button onClick={discard} disabled={Boolean(busy) || working} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs disabled:opacity-40" style={{ background: S.panel, border: `1px solid ${S.border}`, color: S.error }}>
                <Trash2 size={13} /> Discard
              </button>
              <button onClick={approveLooks} disabled={Boolean(busy) || working || approved || !outfits.length} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs disabled:opacity-40" style={{ background: '#142018', color: S.success }}>
                {busy === 'approve' ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                {approved ? 'Looks approved' : 'Approve looks'}
              </button>
              <button onClick={send} disabled={Boolean(busy) || working || dirty || missingPhotos.length > 0 || !outfits.length} title={dirty ? 'Save your text changes first' : missingPhotos.length ? 'Every look needs a photo before sending' : undefined} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-40" style={{ background: S.gold, color: '#090909' }}>
                {busy === 'send' ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Send to client
              </button>
            </>
          )}
        </div>
      </div>

      {isSent && (
        <p className="text-sm mb-5 rounded-lg px-4 py-3" style={{ background: '#142018', color: S.success }}>
          Sent {report.sent_at ? new Date(report.sent_at).toLocaleString('en-IN') : ''}. Changes now go live on the client’s link immediately.
        </p>
      )}
      {working && (
        <p className="text-sm mb-5 rounded-lg px-4 py-3 inline-flex items-center gap-2" style={{ background: '#1e1a14', color: S.gold }}>
          <Loader2 size={14} className="animate-spin" />
          {report.progress_stage === 'generating_images' ? `Shooting the looks on him — ${outfits.length - missingPhotos.length} of ${outfits.length} done.` : 'Writing the issue from his Blueprint…'}
        </p>
      )}
      {report.error_message && !working && (
        <p className="text-sm mb-5 rounded-lg px-4 py-3" style={{ background: '#241412', color: S.error }}>{report.error_message}</p>
      )}
      {notice && (
        <p className="text-sm mb-5" style={{ color: notice.tone === 'ok' ? S.success : S.error }}>{notice.text}</p>
      )}

      {!working && missingPhotos.length > 0 && outfits.length > 0 && !isSent && (
        <button onClick={renderMissing} disabled={Boolean(busy)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-6 disabled:opacity-40" style={{ background: '#1e1a14', color: S.gold }}>
          {busy === 'render' ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
          Render missing photos ({missingPhotos.join(', ')})
        </button>
      )}
      {!working && !outfits.length && report.status === 'error' && (
        <button onClick={renderMissing} disabled={Boolean(busy)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-6 disabled:opacity-40" style={{ background: '#1e1a14', color: S.gold }}>
          <RotateCcw size={13} /> Try writing it again
        </button>
      )}

      {draft && (
        <section className="rounded-xl border p-5 mb-6 space-y-4" style={{ background: S.panel, borderColor: S.border }}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: S.gold }}>Issue text</p>
            <button onClick={saveText} disabled={!dirty || Boolean(busy)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs disabled:opacity-40" style={{ background: '#1e1a14', color: S.gold }}>
              {busy === 'save' ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save text
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Client first name (blank = none)">
              <input value={draft.clientFirstName} onChange={e => setDraft({ ...draft, clientFirstName: e.target.value })} placeholder="We don't collect names — add it if you know it" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </Field>
            <Field label="Title">
              <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </Field>
            <Field label="Month moments (comma separated)">
              <input value={draft.monthMoments.join(', ')} onChange={e => setDraft({ ...draft, monthMoments: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </Field>
          </div>
          <Field label="Line under the title">
            <input value={draft.dek} onChange={e => setDraft({ ...draft, dek: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
          </Field>
          <Field label="Stylist's letter">
            <textarea value={draft.stylistNote} onChange={e => setDraft({ ...draft, stylistNote: e.target.value })} rows={7} className="w-full rounded-lg px-3 py-2 text-sm outline-none leading-6" style={inputStyle} />
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Piece of the month">
              <input value={draft.pieceOfTheMonth.name} onChange={e => setDraft({ ...draft, pieceOfTheMonth: { ...draft.pieceOfTheMonth, name: e.target.value } })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </Field>
            <Field label="Why this piece">
              <input value={draft.pieceOfTheMonth.why} onChange={e => setDraft({ ...draft, pieceOfTheMonth: { ...draft.pieceOfTheMonth, why: e.target.value } })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </Field>
          </div>
          <Field label="Closing note">
            <textarea value={draft.closingNote} onChange={e => setDraft({ ...draft, closingNote: e.target.value })} rows={2} className="w-full rounded-lg px-3 py-2 text-sm outline-none leading-6" style={inputStyle} />
          </Field>
        </section>
      )}

      {qaIssues.length > 0 && (
        <section className="rounded-xl border p-5 mb-6" style={{ background: S.panel, borderColor: S.border }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: S.gold }}>Outfit checks ({qaIssues.length})</p>
          <ul className="space-y-1.5">
            {qaIssues.map((issue, index) => (
              <li key={index} className="text-sm" style={{ color: issue.severity === 'error' ? S.error : S.soft }}>
                {issue.severity === 'error' ? '●' : '○'} {issue.message}
              </li>
            ))}
          </ul>
          <p className="text-xs mt-3" style={{ color: S.muted }}>Advisory — fix a look by editing its text and pressing “Save & reshoot”.</p>
        </section>
      )}

      <div className="space-y-5">
        {outfits.map(outfit => {
          const image = images[outfit.number - 1];
          const meta = draft?.outfits.find(item => item.number === outfit.number);
          const key = `outfit-${outfit.number}`;
          const textChanged = (outfitTexts[outfit.number] ?? '') !== (extractOutfitBlock(s4, outfit.number) ?? '');
          return (
            <article key={outfit.number} className="rounded-xl border grid md:grid-cols-[240px_1fr] gap-5 p-5" style={{ background: S.panel, borderColor: S.border }}>
              <div>
                <div className="rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '2 / 3', background: S.row }}>
                  {busy === key ? (
                    <Loader2 size={20} className="animate-spin" style={{ color: S.gold }} />
                  ) : image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={`Look ${outfit.number}`} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs" style={{ color: S.muted }}>No photo yet</span>
                  )}
                </div>
                {!isSent && (
                  <button
                    onClick={() => { uploadTarget.current = outfit.number; fileInput.current?.click(); }}
                    disabled={Boolean(busy) || working}
                    className="mt-2 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs disabled:opacity-40"
                    style={{ background: S.row, border: `1px solid ${S.border}`, color: S.soft }}
                  >
                    <Upload size={13} /> Upload a photo instead
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: S.gold }}>
                  Look {String(outfit.number).padStart(2, '0')} · {toOutfitTitleCase(outfit.context)}
                </p>
                {draft && meta && (
                  <Field label="Occasion (shown as the look's title)">
                    <input value={meta.occasion} onChange={e => setOutfitMeta(outfit.number, e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
                  </Field>
                )}
                {meta?.reuses && <p className="text-xs" style={{ color: S.soft }}>Re-wears from Blueprint: {meta.reuses}</p>}
                <Field label="Outfit (same format as the Blueprint)">
                  <textarea
                    value={outfitTexts[outfit.number] ?? ''}
                    onChange={e => setOutfitTexts(current => ({ ...current, [outfit.number]: e.target.value }))}
                    rows={8}
                    readOnly={isSent}
                    className="w-full rounded-lg px-3 py-2 text-xs outline-none leading-5 font-mono"
                    style={inputStyle}
                  />
                </Field>
                {!isSent && (
                  <button
                    onClick={() => reshoot(outfit.number)}
                    disabled={Boolean(busy) || working}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs disabled:opacity-40"
                    style={{ background: '#1e1a14', color: S.gold }}
                  >
                    {busy === key ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                    {textChanged ? 'Save & reshoot' : 'Reshoot photo'}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {approved && report.shopping_data && (
        <p className="text-xs mt-6" style={{ color: report.shopping_data.status === 'error' ? S.error : S.muted }}>
          Shopping links: {report.shopping_data.status}{report.shopping_data.error ? ` — ${report.shopping_data.error}. The page falls back to brand-filtered searches.` : ''}
        </p>
      )}
    </div>
  );
}
