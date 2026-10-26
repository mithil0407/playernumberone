'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import StylistUploadLinkActions from '@/components/StylistUploadLinkActions';
import { intakeChoices } from '@/lib/stylistNewClientIntake';

type Values = Record<string, string | string[]>;

const defaults: Values = {
  consultationDate: new Date().toLocaleDateString('en-CA'),
  occupation: 'Corporate', age: '30', height: '165', weight: '55',
  footwear: 'Anything', bodyShape: 'Not Sure', skinTone: 'Unsure',
  skinType: 'Combination', hairType: 'Straight',
  occasionsNeedHelp: [], aesthetics: [], boundaries: [], fitRestrictions: [],
  fabricsPreferred: [], fabricsAvoided: [], bodyConcerns: [],
};

const choiceGroups = [
  { title: 'Consultation goals', fields: [
    ['occasionsNeedHelp', 'Occasions to help with · up to 3'], ['aesthetics', 'Aesthetics · choose at least one'],
    ['boundaries', 'Clothing boundaries · choose at least one'], ['fitRestrictions', 'Fit restrictions'],
  ] },
  { title: 'Wardrobe preferences', fields: [
    ['fabricsPreferred', 'Preferred fabrics'], ['fabricsAvoided', 'Fabrics to avoid'],
  ] },
  { title: 'Body concerns', fields: [['bodyConcerns', 'Body concerns']] },
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="ma-card p-5 sm:p-7"><h2 className="ma-h2 mb-5">{title}</h2><div className="grid gap-5 sm:grid-cols-2">{children}</div></section>;
}

export default function StylistNewClientForm({ stylistSlug }: { stylistSlug: string }) {
  const [values, setValues] = useState<Values>(defaults);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ id: string; uploadUrl: string | null; clientName: string; clientPhone: string } | null>(null);
  const dashboard = `/stylist/${stylistSlug}/dashboard`;
  const set = (key: string, value: string | string[]) => setValues(current => ({ ...current, [key]: value }));
  const text = (key: string) => typeof values[key] === 'string' ? values[key] as string : '';
  const selected = (key: string) => Array.isArray(values[key]) ? values[key] as string[] : [];

  function field(key: string, label: string, options?: readonly string[], required = false) {
    return <label key={key} className="block"><span className="ma-label">{label}{required ? ' *' : ''}</span>
      {options ? <select className="ma-input" value={text(key)} required={required} onChange={event => set(key, event.target.value)}>
        {!required && <option value="">Not specified</option>}{options.map(option => <option key={option} value={option}>{option}</option>)}
      </select> : <input className="ma-input" value={text(key)} required={required} onChange={event => set(key, event.target.value)} />}
    </label>;
  }
  function notes(key: string, label: string, rows = 3) {
    return <label key={key} className="block sm:col-span-2"><span className="ma-label">{label}</span>
      <textarea className="ma-textarea" rows={rows} value={text(key)} onChange={event => set(key, event.target.value)} />
    </label>;
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const consultationDate = new Date(`${text('consultationDate')}T12:00:00+05:30`);
      const response = await fetch('/api/stylist-workspace/consultations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stylistSlug,
          clientName: text('clientName'), clientPhone: text('clientPhone'),
          consultationDate: consultationDate.toISOString(),
          clientData: {
            ...values,
            age: Number(text('age')), height: Number(text('height')),
            weight: Number(text('weight')),
            styleExperimentation: text('styleExperimentation') ? Number(text('styleExperimentation')) : undefined,
            goToOutfits: [text('goToOutfit1'), text('goToOutfit2'), text('goToOutfit3')],
          },
        }),
      });
      const result = await response.json();
      if (response.status === 401) {
        window.location.href = `/stylist/login?redirectTo=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!response.ok) throw new Error(result.error || 'Could not save the client.');
      setCreated({ id: result.id, uploadUrl: result.uploadUrl, clientName: text('clientName'), clientPhone: text('clientPhone') });
      setValues(defaults);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the client.');
    } finally { setBusy(false); }
  }

  if (created) return <div className="mx-auto max-w-xl">
    <div className="ma-card p-7 text-center sm:p-10">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--ma-green-soft)', color: 'var(--ma-green)' }}><Check size={24} /></div>
      <h1 className="ma-title">Client added</h1>
      <p className="ma-muted mt-3 text-[14px]">{created.uploadUrl
        ? `Now send ${created.clientName.split(/\s+/)[0] || 'the client'} the private upload link. Photos and measurements sent there appear in this client automatically.`
        : 'The consultation is saved, but the upload link could not be created. Open the client to add photos and measurements yourself.'}</p>
      {created.uploadUrl && <StylistUploadLinkActions className="mt-7" uploadUrl={created.uploadUrl} clientName={created.clientName} clientPhone={created.clientPhone} />}
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        <Link href={`/stylist/${stylistSlug}/consultations/${created.id}`} className="ma-btn ma-btn--ghost">Open client <ArrowRight size={15} /></Link>
      </div>
      <button type="button" className="ma-btn ma-btn--ghost mt-5" onClick={() => setCreated(null)}>Add another client</button>
    </div>
  </div>;

  return <div className="mx-auto max-w-4xl">
    <Link href={dashboard} className="ma-btn ma-btn--ghost ma-btn--sm mb-5" style={{ marginLeft: -12 }}><ArrowLeft size={14} /> Back to clients</Link>
    <div className="mb-8"><p className="ma-eyebrow mb-2">Consultation notes</p><h1 className="ma-title">New client <em>intake</em></h1><p className="ma-muted mt-2 text-[14px]">Fill this after the consultation call. The client is assigned to your workspace automatically.</p></div>
    {error && <p role="alert" className="mb-5 rounded-xl p-4 text-[14px]" style={{ color: 'var(--ma-red)', background: 'var(--ma-red-soft)' }}>{error}</p>}
    <form onSubmit={submit} className="space-y-5">
      <Section title="Client and consultation">
        {field('clientName', 'Client name', undefined, true)}
        <label className="block"><span className="ma-label">Phone number *</span><input className="ma-input" type="tel" inputMode="tel" required maxLength={20} value={text('clientPhone')} onChange={event => set('clientPhone', event.target.value)} /></label>
        <label className="block"><span className="ma-label">Consultation date *</span><input className="ma-input" type="date" required value={text('consultationDate')} onChange={event => set('consultationDate', event.target.value)} /></label>
        {field('occupation', 'Occupation', intakeChoices.occupation, true)}
        {text('occupation') === 'Other' && field('occupationOther', 'Occupation details', undefined, true)}
        {field('city', 'City')}
        {field('winterwearNeed', 'Winterwear need', intakeChoices.winterwearNeed)}
        {[['age', 'Age', 1, 120], ['height', 'Height in cm', 100, 250], ['weight', 'Weight in kg', 20, 300]].map(([key, label, min, max]) => <label key={key} className="block"><span className="ma-label">{label} *</span><input className="ma-input" type="number" required min={min} max={max} step="any" value={text(String(key))} onChange={event => set(String(key), event.target.value)} /></label>)}
      </Section>
      <Section title="Why they came to ICONIK">
        {field('upcomingEvent', 'Upcoming event')}
        {notes('consultationReason', 'Reason for this consultation')}
        {notes('wardrobeChallenge', 'Wardrobe challenge')}
      </Section>
      {choiceGroups.map(group => <Section key={group.title} title={group.title}>{group.fields.map(([key, label]) => <fieldset key={key} className="sm:col-span-2"><legend className="ma-label">{label}</legend><div className="flex flex-wrap gap-2">{intakeChoices[key].map(option => {
        const checked = selected(key).includes(option);
        return <label key={option} className="cursor-pointer rounded-full px-3 py-2 text-[13px]" style={{ background: checked ? 'var(--ma-ink)' : 'var(--ma-surface-2)', color: checked ? '#fff' : 'var(--ma-ink)', border: '1px solid var(--ma-line)' }}><input type="checkbox" className="sr-only" checked={checked} onChange={() => set(key, checked ? selected(key).filter(item => item !== option) : [...selected(key), option])} />{option}</label>;
      })}</div></fieldset>)}</Section>)}
      <Section title="Personal style">
        {field('footwear', 'Footwear preference', intakeChoices.footwear, true)}
        {field('bodyShape', 'Body shape', intakeChoices.bodyShape, true)}
        {field('outfitRatioPreference', 'Western / ethnic outfits', intakeChoices.outfitRatioPreference)}
        <label className="block"><span className="ma-label">Style experimentation · 1–10</span><input className="ma-input" type="number" min={1} max={10} value={text('styleExperimentation')} onChange={event => set('styleExperimentation', event.target.value)} /></label>
        {field('fitRestrictionsOther', 'Other fit restrictions')}
        {field('bodyConcernsOther', 'Other body concerns')}
        {notes('itemsLoved', 'Items they love')}
        {notes('itemsHated', 'Items they avoid')}
        {['goToOutfit1', 'goToOutfit2', 'goToOutfit3'].map((key, index) => field(key, `Go-to outfit ${index + 1}`))}
      </Section>
      <Section title="Colour, skin and hair">
        {field('skinTone', 'Undertone', intakeChoices.skinTone, true)}
        {field('veinColor', 'Vein colour', intakeChoices.veinColor)}
        {field('sunReaction', 'Reaction to sun', intakeChoices.sunReaction)}
        {field('skinTint', 'Natural skin tint', intakeChoices.skinTint)}
        {field('metalPreference', 'Metal preference', intakeChoices.metalPreference)}
        {field('whiteClothingEffect', 'Pure white clothing', intakeChoices.whiteClothingEffect)}
        {field('colorFamilyPreference', 'Colour family', intakeChoices.colorFamilyPreference)}
        {field('skinType', 'Skin type', intakeChoices.skinType, true)}
        {field('hairType', 'Hair type', intakeChoices.hairType, true)}
        {field('hairChangeOpenness', 'Open to hair changes', intakeChoices.hairChangeOpenness)}
      </Section>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-8"><p className="ma-muted text-[12px]">* Required fields</p><button type="submit" disabled={busy} className="ma-btn ma-btn--primary">{busy ? 'Saving client…' : 'Save new client'} <ArrowRight size={15} /></button></div>
    </form>
  </div>;
}
