'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Check, ChevronRight, Clock3, ImageIcon, Loader2, RefreshCw,
  Ruler, Save, Sparkles, UploadCloud,
} from 'lucide-react';

const C = { ink: '#2C2622', muted: 'rgba(44,38,34,.48)', card: '#EDE5D2', bg: '#F4EFE5', border: 'rgba(44,38,34,.10)', gold: '#C9A96E', slate: '#7E9098', success: '#5A8B6A', error: '#C4645A' };
type Json = Record<string, unknown>;
type PhotoKey = 'headshot' | 'full_body_front' | 'full_body_side' | 'one_outfit';
type MeasurementKey = 'shoulders' | 'bust' | 'chest' | 'waist' | 'hips';
type Detail = {
  source: {
    consultation: { id: string; client_name: string; client_phone: string; consultation_date: string | null; report_due_at: string | null; delivered_at: string | null; status: string; client_data: Json; notes: string | null };
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl p-5 md:p-6" style={{ background: C.card, border: `1px solid ${C.border}` }}><p className="iconik-micro mb-5" style={{ color: C.muted }}>{title}</p>{children}</section>;
}

function Field({ label, value }: { label: string; value: unknown }) {
  return <div className="py-3 grid sm:grid-cols-[150px_1fr] gap-2" style={{ borderTop: `1px solid ${C.border}` }}><p className="iconik-micro" style={{ color: C.muted }}>{label}</p><p className="luxury-body text-sm whitespace-pre-line leading-6">{display(value)}</p></div>;
}

export default function ConsultationWorkspacePage({ params }: { params: Promise<{ stylistSlug: string; consultationId: string }> }) {
  const { stylistSlug, consultationId } = use(params);
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [measurementUnit, setMeasurementUnit] = useState<'cm' | 'in'>('cm');
  const [measurementValues, setMeasurementValues] = useState<Record<MeasurementKey, string>>({ shoulders: '', bust: '', chest: '', waist: '', hips: '' });
  const [selectedPhotos, setSelectedPhotos] = useState<Partial<Record<PhotoKey, File>>>({});

  const load = useCallback(async () => {
    const response = await fetch(`/api/stylist-workspace/consultations/${consultationId}`, { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Could not load consultation');
    setDetail(body);
    setNotes(body.intake?.raw_consultation_notes || body.source.consultation.notes || '');
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
    setWorking('generate'); setError('');
    try {
      const response = await fetch(`/api/stylist-workspace/consultations/${consultationId}/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newVersion }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not generate report');
      router.push(`/stylist/${stylistSlug}/reports/${body.reportId}`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Generation failed'); }
    finally { setWorking(''); }
  };

  const saveNotes = async () => {
    setWorking('save'); setError('');
    try {
      const response = await fetch(`/api/stylist-workspace/consultations/${consultationId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_overrides', overrides: { raw_consultation_notes: notes } }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not save notes');
      setDetail(current => current ? { ...current, intake: body.intake } : current);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Save failed'); }
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
      await load();
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
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Refresh failed'); }
    finally { setWorking(''); }
  };

  const clientData = detail?.source.consultation.client_data ?? {};
  const latest = detail?.reports[0] ?? null;
  const photos = useMemo(() => [
    ['headshot', 'Headshot'], ['full_body_front', 'Full body · front'], ['full_body_side', 'Full body · side'], ['one_outfit', 'One outfit · optional'],
  ] as const, []);

  if (loading) return <div className="h-[70vh] flex items-center justify-center"><Loader2 className="animate-spin" style={{ color: C.slate }} /></div>;
  if (!detail) return <div className="rounded-2xl p-5" style={{ color: C.error }}>{error || 'Consultation not found'}</div>;
  const consultation = detail.source.consultation;

  return (
    <div className="max-w-[1450px] mx-auto">
      <Link href={`/stylist/${stylistSlug}/dashboard`} className="inline-flex items-center gap-2 text-sm luxury-body mb-6" style={{ color: C.muted }}><ArrowLeft size={14} /> Back to queue</Link>
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5 mb-7">
        <div>
          <p className="iconik-micro mb-2" style={{ color: C.gold }}>CONSULTATION WORKSPACE</p>
          <h1 className="iconik-display text-3xl md:text-4xl">{consultation.client_name}</h1>
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 luxury-body text-sm" style={{ color: C.muted }}><span>{consultation.client_phone}</span>{consultation.consultation_date && <span>Meeting {new Date(consultation.consultation_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}{consultation.report_due_at && <span>Due {new Date(consultation.report_due_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {latest ? <Link href={`/stylist/${stylistSlug}/reports/${latest.id}`} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm luxury-body" style={{ background: C.ink, color: C.bg }}>Open latest report <ChevronRight size={15} /></Link>
            : <button disabled={!detail.readiness.ready || working === 'generate'} onClick={() => void generate()} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm luxury-body disabled:opacity-40" style={{ background: C.ink, color: C.bg }}>{working === 'generate' ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Generate Blueprint</button>}
        </div>
      </div>

      {error && <div className="rounded-2xl p-4 mb-5 luxury-body text-sm" style={{ background: 'rgba(196,100,90,.10)', color: C.error }}>{error}</div>}
      <div className="grid xl:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="space-y-5">
          <Section title="Inputs Received on WhatsApp">
            <div className="grid lg:grid-cols-[.85fr_1.15fr] gap-7">
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="luxury-body text-sm font-medium">Measurements</p>
                    <p className="luxury-body text-xs mt-1" style={{ color: C.muted }}>Enter exactly what the client sent.</p>
                  </div>
                  <div className="flex rounded-xl p-1" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                    {(['cm', 'in'] as const).map(unit => <button key={unit} type="button" onClick={() => setMeasurementUnit(unit)} className="rounded-lg px-3 py-1.5 iconik-micro" style={{ background: measurementUnit === unit ? C.ink : 'transparent', color: measurementUnit === unit ? C.bg : C.muted }}>{unit}</button>)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ['shoulders', 'Shoulders *'], ['bust', 'Bust'], ['chest', 'Chest'], ['waist', 'Waist *'], ['hips', 'Hips *'],
                  ] as Array<[MeasurementKey, string]>).map(([key, label]) => <label key={key} className="block">
                    <span className="iconik-micro" style={{ color: C.muted }}>{label}</span>
                    <div className="relative mt-2">
                      <input type="number" inputMode="decimal" min="1" max={measurementUnit === 'in' ? 120 : 300} step="0.1" value={measurementValues[key]} onChange={event => setMeasurementValues(current => ({ ...current, [key]: event.target.value }))} className="w-full rounded-xl px-3 py-3 pr-10 outline-none luxury-body text-sm" style={{ background: C.bg, border: `1px solid ${C.border}` }} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 iconik-micro" style={{ color: C.muted }}>{measurementUnit}</span>
                    </div>
                  </label>)}
                </div>
                <p className="luxury-body text-xs mt-3" style={{ color: C.muted }}>Bust or chest is required; you do not need both.</p>
              </div>

              <div>
                <p className="luxury-body text-sm font-medium mb-1">Client photos</p>
                <p className="luxury-body text-xs mb-4" style={{ color: C.muted }}>Upload WhatsApp images here. Re-uploading a slot safely replaces the previous image.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3">
                  {photos.map(([key, label]) => {
                    const selected = selectedPhotos[key];
                    return <label key={key} htmlFor={`stylist-photo-${key}`} className="group rounded-2xl overflow-hidden cursor-pointer" style={{ background: C.bg, border: `1px solid ${selected ? C.gold : C.border}` }}>
                      <input id={`stylist-photo-${key}`} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" className="sr-only" onChange={event => {
                        const file = event.target.files?.[0];
                        if (file) setSelectedPhotos(current => ({ ...current, [key]: file }));
                        event.target.value = '';
                      }} />
                      <div className="aspect-[4/3] relative flex items-center justify-center overflow-hidden">
                        {detail.photoUrls[key] ? <img src={detail.photoUrls[key]!} alt={label} className="w-full h-full object-cover opacity-75 group-hover:opacity-55 transition" /> : <ImageIcon size={21} style={{ color: C.muted }} />}
                        <div className="absolute inset-0 flex items-center justify-center"><span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(44,38,34,.82)', color: C.bg }}><UploadCloud size={16} /></span></div>
                      </div>
                      <div className="px-3 py-2.5">
                        <p className="iconik-micro truncate" style={{ color: selected ? C.gold : C.muted }}>{selected?.name || label}</p>
                        {selected && <p className="luxury-body text-[11px] mt-1" style={{ color: C.success }}>Ready to upload</p>}
                      </div>
                    </label>;
                  })}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 pt-5" style={{ borderTop: `1px solid ${C.border}` }}>
              <p className="luxury-body text-xs" style={{ color: detail.readiness.ready ? C.success : C.muted }}>{detail.readiness.ready ? 'All required inputs are complete.' : `${detail.readiness.missing.length} required input${detail.readiness.missing.length === 1 ? '' : 's'} still missing.`}</p>
              <button onClick={() => void saveClientInputs()} disabled={working === 'inputs'} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 luxury-body text-sm disabled:opacity-50" style={{ background: C.ink, color: C.bg }}>{working === 'inputs' ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />} {working === 'inputs' ? 'Saving inputs…' : 'Save measurements & photos'}</button>
            </div>
          </Section>
          <Section title="Client Direction">
            <div className="grid md:grid-cols-2 gap-x-8">
              <div><Field label="Occupation" value={clientData.occupation} /><Field label="Aesthetics" value={clientData.aesthetics} /><Field label="Desired feeling" value={clientData.desiredFeelings} /><Field label="Occasions" value={clientData.occasions} /></div>
              <div><Field label="Style goals" value={[clientData.styleGoal1, clientData.styleGoal2, clientData.styleGoal3].filter(Boolean)} /><Field label="Special goals" value={clientData.specialGoals} /><Field label="Upcoming events" value={clientData.upcomingEvents} /><Field label="Wardrobe challenge" value={clientData.wardrobeChallenge} /></div>
            </div>
          </Section>
          <Section title="Body, Coverage & Boundaries">
            <div className="grid md:grid-cols-2 gap-x-8">
              <div><Field label="Body shape" value={clientData.bodyShape} /><Field label="Body concerns" value={[clientData.bodyConcerns, clientData.bodyConcernsOther].filter(Boolean)} /><Field label="Fit restrictions" value={clientData.fitRestrictions} /><Field label="Modesty" value={[clientData.modestyPreference, clientData.modestyReason].filter(Boolean)} /></div>
              <div><Field label="Boundaries" value={clientData.boundaries} /><Field label="Fabric restrictions" value={clientData.fabricRestrictions} /><Field label="Cultural restrictions" value={clientData.culturalRestrictions} /><Field label="Height / weight" value={[clientData.height, clientData.weight].filter(Boolean)} /></div>
            </div>
          </Section>
          <Section title="Wardrobe, Colour & Beauty">
            <div className="grid md:grid-cols-2 gap-x-8">
              <div><Field label="Items loved" value={clientData.itemsLoved} /><Field label="Items avoided" value={[clientData.itemsHated, clientData.wardrobeLeastFavorites].filter(Boolean)} /><Field label="Footwear" value={clientData.footwear} /><Field label="Experimentation" value={clientData.styleExperimentation} /></div>
              <div><Field label="Skin context" value={[clientData.skinTone, clientData.skinType, clientData.skinTint, clientData.sunReaction].filter(Boolean)} /><Field label="Colour preference" value={clientData.colorFamilyPreference} /><Field label="Metal preference" value={clientData.metalPreference} /><Field label="Hair" value={[clientData.hairType, clientData.hairChangeOpenness].filter(Boolean)} /></div>
            </div>
          </Section>
          <Section title="Jazz’s Report Notes">
            <textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Add report-specific context or corrections here. The original consultation stays unchanged." className="w-full min-h-44 rounded-2xl p-4 outline-none resize-y luxury-body text-sm leading-6" style={{ background: C.bg, border: `1px solid ${C.border}` }} />
            <div className="flex flex-wrap gap-2 mt-4"><button onClick={() => void saveNotes()} disabled={working === 'save'} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm luxury-body" style={{ background: C.ink, color: C.bg }}>{working === 'save' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save report notes</button>{detail.intake && <button onClick={() => void refreshSnapshot()} disabled={working === 'refresh'} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm luxury-body" style={{ border: `1px solid ${C.border}`, color: C.muted }}>{working === 'refresh' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh source snapshot</button>}</div>
          </Section>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-6">
          <Section title="Generation Readiness">
            <div className="flex items-center gap-3 mb-5"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: detail.readiness.ready ? 'rgba(90,139,106,.12)' : 'rgba(201,169,110,.16)', color: detail.readiness.ready ? C.success : C.gold }}>{detail.readiness.ready ? <Check size={18} /> : <Clock3 size={18} />}</div><div><p className="luxury-body text-sm font-medium">{detail.readiness.ready ? 'Ready to generate' : 'Waiting for inputs'}</p><p className="luxury-body text-xs mt-1" style={{ color: C.muted }}>{detail.readiness.ready ? 'All required source data is present.' : `${detail.readiness.missing.length} required items are missing.`}</p></div></div>
            {!detail.readiness.ready && <div className="space-y-2">{detail.readiness.missing.map(item => <div key={item} className="rounded-xl px-3 py-2.5 luxury-body text-sm" style={{ background: C.bg, color: C.error }}>{item}</div>)}</div>}
            {!detail.readiness.ready && detail.uploadLink?.url && <a href={detail.uploadLink.url} target="_blank" rel="noreferrer" className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 luxury-body text-sm" style={{ background: C.ink, color: C.bg }}><ImageIcon size={15} /> Open client upload link</a>}
          </Section>
          <Section title="Client Photos">
            <div className="grid grid-cols-2 gap-3">{photos.map(([key, label]) => <div key={key} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}`, background: C.bg }}><div className="aspect-[3/4] flex items-center justify-center">{detail.photoUrls[key] ? <img src={detail.photoUrls[key]!} alt={label} className="w-full h-full object-cover" /> : <ImageIcon size={22} style={{ color: C.muted }} />}</div><p className="iconik-micro px-3 py-2.5" style={{ color: detail.photoUrls[key] ? C.success : C.muted }}>{label}</p></div>)}</div>
          </Section>
          <Section title="Measurements">
            <div className="flex items-center gap-2 mb-3" style={{ color: C.slate }}><Ruler size={16} /><span className="luxury-body text-sm">Current saved measurements</span></div>
            {Object.entries(detail.source.upload?.measurements ?? {}).map(([key, value]) => <div key={key} className="flex justify-between gap-4 py-2.5" style={{ borderTop: `1px solid ${C.border}` }}><span className="iconik-micro capitalize" style={{ color: C.muted }}>{key}</span><span className="luxury-body text-sm">{display(value)}</span></div>)}
          </Section>
          {consultation.status === 'delivered' && <button disabled={!detail.readiness.ready || working === 'generate'} onClick={() => void generate(true)} className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm luxury-body disabled:opacity-40" style={{ border: `1px solid ${C.border}`, color: C.ink }}><Sparkles size={15} /> Create current Blueprint</button>}
        </aside>
      </div>
    </div>
  );
}
