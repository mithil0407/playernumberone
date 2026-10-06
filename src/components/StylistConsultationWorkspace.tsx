'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Check, ChevronRight, Clock3, ImageIcon, Loader2, RefreshCw,
  Save, Sparkles, UploadCloud,
} from 'lucide-react';
import { Avatar, Button, Pill } from '@/components/manAdmin/ui';
type Json = Record<string, unknown>;
type PhotoKey = 'headshot' | 'full_body_front' | 'full_body_side' | 'one_outfit';
type MeasurementKey = 'shoulders' | 'bust' | 'chest' | 'waist' | 'hips';
type Detail = {
  source: {
    consultation: { id: string; stylist_id: string | null; client_name: string; client_phone: string; consultation_date: string | null; report_due_at: string | null; delivered_at: string | null; status: string; client_data: Json; notes: string | null };
    upload: { measurements: Json; photo_paths: Record<string, string>; submitted_at: string | null } | null;
  };
  readiness: { ready: boolean; missing: string[]; photos: Record<string, boolean>; measurements: Record<string, boolean> };
  photoUrls: Record<string, string | null>;
  intake: (Json & { id: string; raw_consultation_notes?: string | null }) | null;
  uploadLink: { url: string | null; expiresAt: string | null } | null;
  reports: Array<{ id: string; status: string; progress_stage: string | null; error_message: string | null; section_approvals: Record<string, boolean>; created_at: string }>;
};

function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.map(display).filter(item => item !== '—').join(', ') || '—';
  if (typeof value === 'object') return Object.entries(value as Json).filter(([, item]) => item !== null && item !== undefined && item !== '' && (!Array.isArray(item) || item.length)).map(([key, item]) => `${key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}: ${display(item)}`).join('\n') || '—';
  return String(value).replace(/_/g, ' ');
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return <section className="ma-card p-5 md:p-6">
    <div className="mb-4"><h2 className="ma-h2">{title}</h2>{hint && <p className="ma-faint mt-1 text-[13px]">{hint}</p>}</div>
    {children}
  </section>;
}

function Field({ label, value }: { label: string; value: unknown }) {
  return <div className="grid gap-1 py-3 sm:grid-cols-[150px_1fr] sm:gap-3" style={{ borderTop: '1px solid var(--ma-line-2)' }}><p className="ma-faint text-[13px]" style={{ fontWeight: 500 }}>{label}</p><p className="whitespace-pre-line text-[14px] leading-6">{display(value)}</p></div>;
}

export default function ConsultationWorkspacePage({ params, adminMode = false }: { params: Promise<{ stylistSlug?: string; consultationId: string }>; adminMode?: boolean }) {
  const { stylistSlug, consultationId } = use(params);
  const router = useRouter();
  const reportUrl = (id: string) => adminMode ? `/stylist/admin/report/${id}` : `/stylist/${stylistSlug}/reports/${id}`;
  const backUrl = adminMode ? '/stylist/admin/workspace' : `/stylist/${stylistSlug}/dashboard`;
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [measurementUnit, setMeasurementUnit] = useState<'cm' | 'in'>('cm');
  const [measurementValues, setMeasurementValues] = useState<Record<MeasurementKey, string>>({ shoulders: '', bust: '', chest: '', waist: '', hips: '' });
  const [selectedPhotos, setSelectedPhotos] = useState<Partial<Record<PhotoKey, File>>>({});

  const load = useCallback(async (preserveNotes = false) => {
    const response = await fetch(`/api/stylist-workspace/consultations/${consultationId}`, { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Could not load consultation');
    setDetail(body);
    if (!preserveNotes) setNotes(body.intake?.raw_consultation_notes || body.source.consultation.notes || '');
    const storedMeasurements = (body.source.upload?.measurements ?? {}) as Json;
    setMeasurementUnit(['in', 'inch', 'inches'].includes(String(storedMeasurements.unit ?? '').toLowerCase()) ? 'in' : 'cm');
    setMeasurementValues({
      shoulders: storedMeasurements.shoulders == null ? '' : String(storedMeasurements.shoulders),
      bust: storedMeasurements.bust == null ? '' : String(storedMeasurements.bust),
      chest: storedMeasurements.chest == null ? '' : String(storedMeasurements.chest),
      waist: storedMeasurements.waist == null ? '' : String(storedMeasurements.waist),
      hips: storedMeasurements.hips == null ? '' : String(storedMeasurements.hips),
    });
    setLoading(false);
  }, [consultationId]);
  useEffect(() => { void load().catch(caught => { setError(caught instanceof Error ? caught.message : 'Load failed'); setLoading(false); }); }, [load]);

  const generate = async (newVersion = false) => {
    if (newVersion && !window.confirm('Create a fresh report draft? The existing delivered report stays available, and nothing is sent to the client.')) return;
    setWorking('generate'); setError('');
    try {
      await persistNotes();
      const response = await fetch(`/api/stylist-workspace/consultations/${consultationId}/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newVersion }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not generate report');
      router.push(reportUrl(body.reportId));
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Generation failed'); }
    finally { setWorking(''); }
  };

  const persistNotes = async () => {
    const response = await fetch(`/api/stylist-workspace/consultations/${consultationId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_overrides', overrides: { raw_consultation_notes: notes } }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Could not save notes');
    setDetail(current => current ? { ...current, intake: body.intake } : current);
  };
  const saveNotes = async () => {
    setWorking('save'); setError('');
    try { await persistNotes(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Save failed'); }
    finally { setWorking(''); }
  };

  const saveClientInputs = async () => {
    setWorking('inputs'); setError('');
    try {
      const form = new FormData();
      form.set('measurements', JSON.stringify({ unit: measurementUnit, ...measurementValues }));
      for (const [key, file] of Object.entries(selectedPhotos)) {
        if (file) form.set(key, file);
      }
      const response = await fetch(`/api/stylist-workspace/consultations/${consultationId}/inputs`, { method: 'POST', body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not save client inputs');
      setSelectedPhotos({});
      await load(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not save client inputs'); }
    finally { setWorking(''); }
  };

  const refreshSnapshot = async () => {
    setWorking('refresh'); setError('');
    try {
      const previewResponse = await fetch(`/api/stylist-workspace/consultations/${consultationId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'preview_refresh' }),
      });
      const preview = await previewResponse.json();
      if (!previewResponse.ok) throw new Error(preview.error || 'Could not compare consultation source');
      const changes = (preview.changes ?? []) as Array<{ field: string }>;
      if (!changes.length) {
        window.alert('The consultation source already matches this report intake.');
        return;
      }
      const labels = changes.map(change => change.field.replace(/_/g, ' ')).join('\n• ');
      const confirmed = window.confirm(`Refresh these fields from the consultation?\n\n• ${labels}\n\nExisting generated reports will not change.`);
      if (!confirmed) return;
      const response = await fetch(`/api/stylist-workspace/consultations/${consultationId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'refresh', confirmed: true }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not refresh source');
      await load(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Refresh failed'); }
    finally { setWorking(''); }
  };

  const clientData = detail?.source.consultation.client_data ?? {};
  const latest = detail?.reports[0] ?? null;
  const photos = useMemo(() => [
    ['headshot', 'Headshot'], ['full_body_front', 'Full body · front'], ['full_body_side', 'Full body · side'], ['one_outfit', 'One outfit · optional'],
  ] as const, []);

  if (loading) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="ma-faint animate-spin" /></div>;
  if (!detail) return <div className="rounded-2xl px-4 py-3 text-[14px]" style={{ color: 'var(--ma-red)', background: 'var(--ma-red-soft)' }}>{error || 'Consultation not found'}</div>;
  const consultation = detail.source.consultation;
  const delivered = latest?.status === 'delivered' || latest?.status === 'sent';

  return (
    <div>
      <Link href={backUrl} className="ma-btn ma-btn--ghost ma-btn--sm mb-5" style={{ marginLeft: -12 }}><ArrowLeft size={14} /> Back to report desk</Link>
      <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={consultation.client_name || 'Client'} src={detail.photoUrls.headshot} size={56} />
          <div className="min-w-0">
            <div className="ma-eyebrow mb-1.5">{adminMode ? 'Admin · Client' : 'Client'}</div>
            <h1 className="ma-title truncate">{consultation.client_name}</h1>
            <div className="ma-muted mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px]"><span>{consultation.client_phone}</span>{consultation.consultation_date && <span>Meeting {new Date(consultation.consultation_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}{consultation.report_due_at && <span>Due {new Date(consultation.report_due_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {latest ? <Link href={reportUrl(latest.id)} className="ma-btn ma-btn--dark">Continue report <ChevronRight size={15} /></Link>
            : <Button variant="primary" disabled={!detail.source.consultation.stylist_id || !detail.readiness.ready || Boolean(working)} loading={working === 'generate'} icon={<Sparkles size={15} />} onClick={() => void generate()}>Create report</Button>}
        </div>
      </div>

      {!consultation.stylist_id && <p className="mb-5 rounded-2xl px-4 py-3 text-[14px]" style={{ background: 'var(--ma-amber-soft)', color: 'var(--ma-amber)' }}>This client is unassigned. You can review their form and photos here; assign a stylist in your consultation system before generating a report.</p>}
      {error && <div role="alert" className="mb-5 rounded-2xl px-4 py-3 text-[14px]" style={{ background: 'var(--ma-red-soft)', color: 'var(--ma-red)' }}>{error}</div>}
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {latest && <div className="ma-card flex flex-wrap items-center gap-4 p-5" style={{ background: 'var(--ma-ink)', color: '#fff', borderColor: 'transparent' }}>
            <div className="mr-auto">
              <p className="text-[17px]" style={{ fontWeight: 600, letterSpacing: '-0.015em' }}>{delivered ? 'Your report has been delivered' : 'Your report is in progress'}</p>
              <p className="mt-1 text-[13px]" style={{ opacity: 0.7 }}>Review the advice, edit outfits, and upload images in the report editor.</p>
            </div>
            <Link href={reportUrl(latest.id)} className="ma-btn ma-btn--secondary ma-btn--sm">Continue report <ChevronRight size={14} /></Link>
          </div>}
          <Section title="Client inputs" hint="Measurements and photos the report is built from.">
            <div className="grid gap-7 lg:grid-cols-[.85fr_1.15fr]">
              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[14px]" style={{ fontWeight: 600 }}>Measurements</p>
                    <p className="ma-faint mt-0.5 text-[13px]">Enter exactly what the client sent.</p>
                  </div>
                  <div className="ma-seg">
                    {(['cm', 'in'] as const).map(unit => <button key={unit} type="button" aria-pressed={measurementUnit === unit} onClick={() => setMeasurementUnit(unit)}>{unit}</button>)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ['shoulders', 'Shoulders *'], ['bust', 'Bust'], ['chest', 'Chest'], ['waist', 'Waist *'], ['hips', 'Hips *'],
                  ] as Array<[MeasurementKey, string]>).map(([key, label]) => <label key={key} className="block">
                    <span className="ma-label">{label}</span>
                    <span className="relative block">
                      <input type="number" inputMode="decimal" min="1" max={measurementUnit === 'in' ? 120 : 300} step="0.1" value={measurementValues[key]} onChange={event => setMeasurementValues(current => ({ ...current, [key]: event.target.value }))} className="ma-input ma-num" style={{ paddingRight: 40 }} />
                      <span className="ma-faint absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px]">{measurementUnit}</span>
                    </span>
                  </label>)}
                </div>
                <p className="ma-faint mt-3 text-[13px]">Bust or chest is required; you do not need both.</p>
              </div>

              <div>
                <p className="text-[14px]" style={{ fontWeight: 600 }}>Client photos</p>
                <p className="ma-faint mb-4 mt-0.5 text-[13px]">Upload WhatsApp images here. Re-uploading a slot safely replaces the previous image.</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
                  {photos.map(([key, label]) => {
                    const selected = selectedPhotos[key];
                    return <label key={key} htmlFor={`stylist-photo-${key}`} className="group cursor-pointer overflow-hidden rounded-2xl" style={{ background: 'var(--ma-surface-2)', border: `1px solid ${selected ? 'var(--ma-accent)' : 'var(--ma-line)'}`, boxShadow: selected ? '0 0 0 3px var(--ma-accent-soft)' : undefined }}>
                      <input id={`stylist-photo-${key}`} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" className="sr-only" onChange={event => {
                        const file = event.target.files?.[0];
                        if (file) setSelectedPhotos(current => ({ ...current, [key]: file }));
                        event.target.value = '';
                      }} />
                      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden">
                        {detail.photoUrls[key] ? <img loading="lazy" decoding="async" src={detail.photoUrls[key]!} alt={label} className="h-full w-full object-cover opacity-80 transition group-hover:opacity-60" /> : <ImageIcon size={21} className="ma-faint" />}
                        <div className="absolute inset-0 flex items-center justify-center"><span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'rgba(17,19,21,.78)', color: '#fff' }}><UploadCloud size={16} /></span></div>
                      </div>
                      <div className="px-3 py-2.5">
                        <p className="truncate text-[13px]" style={{ fontWeight: 500, color: selected ? 'var(--ma-accent)' : 'var(--ma-ink-2)' }}>{selected?.name || label}</p>
                        {selected && <p className="mt-0.5 text-[12px]" style={{ color: 'var(--ma-green)' }}>Ready to upload</p>}
                      </div>
                    </label>;
                  })}
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-col justify-between gap-3 pt-5 sm:flex-row sm:items-center" style={{ borderTop: '1px solid var(--ma-line-2)' }}>
              {detail.readiness.ready ? <Pill tone="green" dot>All required inputs are complete</Pill> : <Pill tone="amber" dot>{detail.readiness.missing.length} required input{detail.readiness.missing.length === 1 ? '' : 's'} still missing</Pill>}
              <Button variant="dark" onClick={() => void saveClientInputs()} disabled={!consultation.stylist_id || Boolean(working)} loading={working === 'inputs'} icon={<UploadCloud size={15} />}>{working === 'inputs' ? 'Saving inputs…' : 'Save measurements & photos'}</Button>
            </div>
          </Section>
          <Section title="Client direction">
            <div className="grid gap-x-8 md:grid-cols-2">
              <div><Field label="Occupation" value={clientData.occupation} /><Field label="Aesthetics" value={clientData.aesthetics} /><Field label="Desired feeling" value={clientData.desiredFeelings} /><Field label="Occasions" value={clientData.occasions} /></div>
              <div><Field label="Style goals" value={[clientData.styleGoal1, clientData.styleGoal2, clientData.styleGoal3].filter(Boolean)} /><Field label="Special goals" value={clientData.specialGoals} /><Field label="Upcoming events" value={clientData.upcomingEvents} /><Field label="Wardrobe challenge" value={clientData.wardrobeChallenge} /></div>
            </div>
          </Section>
          <Section title="Body, coverage & boundaries">
            <div className="grid gap-x-8 md:grid-cols-2">
              <div><Field label="Body shape" value={clientData.bodyShape} /><Field label="Body concerns" value={[clientData.bodyConcerns, clientData.bodyConcernsOther].filter(Boolean)} /><Field label="Fit restrictions" value={clientData.fitRestrictions} /><Field label="Modesty" value={[clientData.modestyPreference, clientData.modestyReason].filter(Boolean)} /></div>
              <div><Field label="Boundaries" value={clientData.boundaries} /><Field label="Fabric restrictions" value={clientData.fabricRestrictions} /><Field label="Cultural restrictions" value={clientData.culturalRestrictions} /><Field label="Height / weight" value={[clientData.height, clientData.weight].filter(Boolean)} /></div>
            </div>
          </Section>
          <Section title="Style preferences">
            <div className="grid gap-x-8 md:grid-cols-2">
              <div><Field label="Items loved" value={clientData.itemsLoved} /><Field label="Items avoided" value={[clientData.itemsHated, clientData.wardrobeLeastFavorites].filter(Boolean)} /><Field label="Footwear" value={clientData.footwear} /><Field label="Experimentation" value={clientData.styleExperimentation} /></div>
              <div><Field label="Skin context" value={[clientData.skinTone, clientData.skinType, clientData.skinTint, clientData.sunReaction].filter(Boolean)} /><Field label="Colour preference" value={clientData.colorFamilyPreference} /><Field label="Metal preference" value={clientData.metalPreference} /><Field label="Hair" value={[clientData.hairType, clientData.hairChangeOpenness].filter(Boolean)} /></div>
            </div>
          </Section>
          <Section title="Your styling notes" hint="The report reads these when it is generated.">
            <textarea disabled={Boolean(working)} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Anything the report should know? Add preferences, corrections or details from your conversation." className="ma-textarea min-h-44" />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="dark" onClick={() => void saveNotes()} disabled={!consultation.stylist_id || Boolean(working)} loading={working === 'save'} icon={<Save size={14} />}>Save report notes</Button>
              {detail.intake && <Button variant="ghost" onClick={() => void refreshSnapshot()} disabled={Boolean(working)} loading={working === 'refresh'} icon={<RefreshCw size={14} />}>Refresh source snapshot</Button>}
            </div>
          </Section>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-20">
          <Section title="Ready for the report?">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: detail.readiness.ready ? 'var(--ma-green-soft)' : 'var(--ma-amber-soft)', color: detail.readiness.ready ? 'var(--ma-green)' : 'var(--ma-amber)' }}>{detail.readiness.ready ? <Check size={18} /> : <Clock3 size={18} />}</span>
              <div><p className="text-[14px]" style={{ fontWeight: 600 }}>{detail.readiness.ready ? 'Ready to generate' : 'Waiting for inputs'}</p><p className="ma-faint mt-0.5 text-[13px]">{detail.readiness.ready ? 'Photos and measurements are complete.' : `${detail.readiness.missing.length} required items are missing.`}</p></div>
            </div>
            {!detail.readiness.ready && <div className="flex flex-wrap gap-1.5">{detail.readiness.missing.map(item => <Pill key={item} tone="red">{item}</Pill>)}</div>}
            {!detail.readiness.ready && detail.uploadLink?.url && <a href={detail.uploadLink.url} target="_blank" rel="noreferrer" className="ma-btn ma-btn--dark mt-4 w-full"><ImageIcon size={15} /> Open client upload link</a>}
          </Section>
          <Section title="Reference photos">
            <div className="grid grid-cols-2 gap-3">{photos.map(([key, label]) => <div key={key} className="overflow-hidden rounded-2xl" style={{ border: '1px solid var(--ma-line)', background: 'var(--ma-surface-2)' }}><div className="flex aspect-[3/4] items-center justify-center">{detail.photoUrls[key] ? <img loading="lazy" decoding="async" src={detail.photoUrls[key]!} alt={label} className="h-full w-full object-cover" /> : <ImageIcon size={22} className="ma-faint" />}</div><p className="flex items-center gap-1.5 px-3 py-2 text-[12px]" style={{ fontWeight: 500, color: detail.photoUrls[key] ? 'var(--ma-green)' : 'var(--ma-ink-3)' }}>{detail.photoUrls[key] && <Check size={12} />}{label}</p></div>)}</div>
          </Section>
          <Section title="Saved measurements">
            {Object.entries(detail.source.upload?.measurements ?? {}).map(([key, value]) => <div key={key} className="flex justify-between gap-4 py-2.5" style={{ borderTop: '1px solid var(--ma-line-2)' }}><span className="ma-faint text-[13px] capitalize">{key}</span><span className="ma-num text-[14px]" style={{ fontWeight: 500 }}>{display(value)}</span></div>)}
            {!Object.keys(detail.source.upload?.measurements ?? {}).length && <p className="ma-faint text-[13px]">None saved yet.</p>}
          </Section>
          {consultation.status === 'delivered' && <Button className="w-full" disabled={!detail.source.consultation.stylist_id || !detail.readiness.ready || Boolean(working)} onClick={() => void generate(true)} icon={<Sparkles size={15} />}>Create a new draft Blueprint</Button>}
        </aside>
      </div>
    </div>
  );
}
