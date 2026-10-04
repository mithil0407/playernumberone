'use client';

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, CheckCircle2, ExternalLink, Loader2, RotateCcw, Save, Send, Trash2, Upload } from 'lucide-react';
import ManEditIssue from '@/components/ManEditIssue';
import OutfitEditor from '@/components/manAdmin/OutfitEditor';
import { Button, Segmented } from '@/components/manAdmin/ui';
import { extractOutfitBlock, parseManOutfitsFromSection, toOutfitTitleCase } from '@/lib/manOutfitSection';
import type { ReportData } from '@/lib/manReportGenerator';
import type { ManEditIssueContent } from '@/lib/manEditIssueTypes';
import type { ManShoppingState } from '@/lib/manShopping';

const S = {
  muted: 'var(--ma-ink-3)',
  soft: 'var(--ma-ink-2)',
  success: 'var(--ma-green)',
  error: 'var(--ma-red)',
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="ma-label">{label}</span>
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
  // Reviewing opens on exactly what the client will receive; editing is one click away.
  const [view, setView] = useState<'preview' | 'edit'>('preview');
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

      <Link href="/man/admin/edit" className="ma-btn ma-btn--ghost ma-btn--sm -ml-3 mb-6">
        <ArrowLeft size={14} /> Subscribers
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
        <div>
          <div className="ma-eyebrow mb-2">
            The ICONIK Edit · Issue {draft?.issueNumber ?? '—'}{draft?.periodLabel ? ` · ${draft.periodLabel}` : ''}
          </div>
          <h1 className="ma-title" style={{ fontSize: 28 }}>{draft?.title || 'Writing this issue…'}</h1>
          <p className="ma-faint mt-1.5 text-[14px]">{report.man_intake_submissions?.customer_email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/man/edit/${report.share_token}`} target="_blank" rel="noreferrer" className="ma-btn ma-btn--secondary ma-btn--sm">
            <ExternalLink size={13} /> Client view
          </a>
          {!isSent && (
            <>
              <Button size="sm" variant="ghost" icon={<Trash2 size={13} />} onClick={discard} disabled={Boolean(busy) || working}>Discard</Button>
              <Button size="sm" variant={approved ? 'ghost' : 'secondary'} icon={<CheckCircle2 size={13} />} loading={busy === 'approve'} onClick={approveLooks} disabled={Boolean(busy) || working || approved || !outfits.length}>
                {approved ? 'Looks approved' : 'Approve looks'}
              </Button>
              <Button size="sm" variant="primary" icon={<Send size={13} />} loading={busy === 'send'} onClick={send} disabled={Boolean(busy) || working || dirty || missingPhotos.length > 0 || !outfits.length} title={dirty ? 'Save your text changes first' : missingPhotos.length ? 'Every look needs a photo before sending' : undefined}>
                Send to client
              </Button>
            </>
          )}
        </div>
      </div>

      {isSent && (
        <p className="text-sm mb-5 rounded-2xl px-5 py-3" style={{ background: 'var(--ma-green-soft)', color: S.success }}>
          Sent {report.sent_at ? new Date(report.sent_at).toLocaleString('en-IN') : ''}. Changes now go live on the client’s link immediately.
        </p>
      )}
      {working && (
        <p className="text-sm mb-5 rounded-2xl px-5 py-3 flex items-center gap-2" style={{ background: 'var(--ma-blue-soft)', color: 'var(--ma-blue)' }}>
          <Loader2 size={14} className="animate-spin" />
          {report.progress_stage === 'generating_images' ? `Shooting the looks on him — ${outfits.length - missingPhotos.length} of ${outfits.length} done.` : 'Writing the issue from his Blueprint…'}
        </p>
      )}
      {report.error_message && !working && (
        <p className="text-sm mb-5 rounded-2xl px-5 py-3" style={{ background: 'var(--ma-red-soft)', color: S.error }}>{report.error_message}</p>
      )}
      {notice && (
        <p className="text-sm mb-5" style={{ color: notice.tone === 'ok' ? S.success : S.error }}>{notice.text}</p>
      )}

      {!working && missingPhotos.length > 0 && outfits.length > 0 && !isSent && (
        <Button className="mb-6" size="sm" variant="dark" icon={<Camera size={13} />} loading={busy === 'render'} onClick={renderMissing} disabled={Boolean(busy)}>
          Make missing photos ({missingPhotos.join(', ')})
        </Button>
      )}
      {!working && !outfits.length && report.status === 'error' && (
        <Button className="mb-6" size="sm" variant="dark" icon={<RotateCcw size={13} />} onClick={renderMissing} disabled={Boolean(busy)}>
          Try writing it again
        </Button>
      )}

      {outfits.length > 0 && draft && (
        <div className="mb-6">
          <Segmented
            value={view}
            onChange={setView}
            options={[{ value: 'preview', label: 'What he receives' }, { value: 'edit', label: 'Edit text and looks' }]}
          />
        </div>
      )}

      {view === 'preview' && outfits.length > 0 && draft && report.report_data && (
        <section className="mb-6">
          <p className="text-xs mb-3" style={{ color: dirty ? S.error : S.muted }}>
            {dirty
              ? 'Showing your unsaved text changes. Save them in “Edit text & looks” before sending.'
              : isSent
                ? 'This is the issue on his link now.'
                : 'This is exactly what he will receive. His like / dislike buttons are inactive here.'}
          </p>
          <div className="overflow-hidden rounded-[28px]" style={{ background: '#1B1815', boxShadow: 'var(--ma-shadow-sm)' }}>
            <ManEditIssue
              embedded
              shareToken={report.share_token}
              status={report.status}
              edit={draft}
              s4Outfits={s4}
              classification={report.report_data.classification}
              outfitImages={images}
              shopping={report.shopping_data}
              initialVotes={{}}
              otherIssues={[]}
            />
          </div>
        </section>
      )}

      {view === 'edit' && draft && (
        <section className="ma-card mb-6 space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div className="ma-h2">Issue text</div>
            <Button size="sm" variant="dark" icon={<Save size={13} />} loading={busy === 'save'} onClick={saveText} disabled={!dirty || Boolean(busy)}>Save text</Button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Client first name (blank = none)">
              <input value={draft.clientFirstName} onChange={e => setDraft({ ...draft, clientFirstName: e.target.value })} placeholder="We don't collect names — add it if you know it" className="ma-input" />
            </Field>
            <Field label="Title">
              <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} className="ma-input" />
            </Field>
            <Field label="Month moments (comma separated)">
              <input value={draft.monthMoments.join(', ')} onChange={e => setDraft({ ...draft, monthMoments: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })} className="ma-input" />
            </Field>
          </div>
          <Field label="Line under the title">
            <input value={draft.dek} onChange={e => setDraft({ ...draft, dek: e.target.value })} className="ma-input" />
          </Field>
          <Field label="Stylist's letter">
            <textarea value={draft.stylistNote} onChange={e => setDraft({ ...draft, stylistNote: e.target.value })} rows={7} className="ma-textarea" />
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Piece of the month">
              <input value={draft.pieceOfTheMonth.name} onChange={e => setDraft({ ...draft, pieceOfTheMonth: { ...draft.pieceOfTheMonth, name: e.target.value } })} className="ma-input" />
            </Field>
            <Field label="Why this piece">
              <input value={draft.pieceOfTheMonth.why} onChange={e => setDraft({ ...draft, pieceOfTheMonth: { ...draft.pieceOfTheMonth, why: e.target.value } })} className="ma-input" />
            </Field>
          </div>
          <Field label="Closing note">
            <textarea value={draft.closingNote} onChange={e => setDraft({ ...draft, closingNote: e.target.value })} rows={2} className="ma-textarea" />
          </Field>
        </section>
      )}

      {view === 'edit' && qaIssues.length > 0 && (
        <section className="ma-card ma-card--flat mb-6 p-6">
          <div className="ma-h2 mb-3">Outfit checks · {qaIssues.length}</div>
          <ul className="space-y-1.5">
            {qaIssues.map((issue, index) => (
              <li key={index} className="text-sm" style={{ color: issue.severity === 'error' ? S.error : S.soft }}>
                {issue.severity === 'error' ? '●' : '○'} {issue.message}
              </li>
            ))}
          </ul>
          <p className="ma-faint mt-3 text-[13px]">Advisory. Fix a look by editing its pieces and pressing “Save and reshoot”.</p>
        </section>
      )}

      {view === 'edit' && <div className="space-y-5">
        {outfits.map(outfit => {
          const image = images[outfit.number - 1];
          const meta = draft?.outfits.find(item => item.number === outfit.number);
          const key = `outfit-${outfit.number}`;
          const textChanged = (outfitTexts[outfit.number] ?? '') !== (extractOutfitBlock(s4, outfit.number) ?? '');
          return (
            <article key={outfit.number} className="ma-card grid gap-6 p-6 md:grid-cols-[220px_1fr]">
              <div>
                <div className="flex items-center justify-center overflow-hidden rounded-[20px]" style={{ aspectRatio: '2 / 3', background: '#94a6ad' }}>
                  {busy === key ? (
                    <Loader2 size={20} className="animate-spin text-white" />
                  ) : image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={`Look ${outfit.number}`} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-white/80">No photo yet</span>
                  )}
                </div>
                {!isSent && (
                  <Button className="mt-3 w-full" size="sm" variant="ghost" icon={<Upload size={13} />} onClick={() => { uploadTarget.current = outfit.number; fileInput.current?.click(); }} disabled={Boolean(busy) || working}>
                    Upload a photo instead
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                <div className="ma-eyebrow" style={{ color: 'var(--ma-accent)' }}>
                  Look {String(outfit.number).padStart(2, '0')} · {toOutfitTitleCase(outfit.context)}
                </div>
                {draft && meta && (
                  <Field label="Occasion (shown as the look's title)">
                    <input value={meta.occasion} onChange={e => setOutfitMeta(outfit.number, e.target.value)} className="ma-input" />
                  </Field>
                )}
                {meta?.reuses && <p className="text-xs" style={{ color: S.soft }}>Re-wears from Blueprint: {meta.reuses}</p>}
                <div>
                  <span className="ma-label">Pieces</span>
                  <OutfitEditor
                    value={outfitTexts[outfit.number] ?? ''}
                    disabled={isSent}
                    onChange={next => setOutfitTexts(current => ({ ...current, [outfit.number]: next }))}
                    hideImage
                  />
                </div>
                {!isSent && (
                  <Button size="sm" variant={textChanged ? 'primary' : 'secondary'} icon={<Camera size={13} />} loading={busy === key} onClick={() => reshoot(outfit.number)} disabled={Boolean(busy) || working}>
                    {textChanged ? 'Save and reshoot' : 'Reshoot photo'}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>}

      {approved && report.shopping_data && (
        <p className="text-xs mt-6" style={{ color: report.shopping_data.status === 'error' ? S.error : S.muted }}>
          Shopping links: {report.shopping_data.status}{report.shopping_data.error ? ` — ${report.shopping_data.error}. The page falls back to brand-filtered searches.` : ''}
        </p>
      )}
    </div>
  );
}
