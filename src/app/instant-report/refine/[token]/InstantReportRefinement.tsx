'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Clock3 } from 'lucide-react';

const contexts = ['Work', 'Everyday', 'Social', 'Festive / wedding', 'Travel'];
const footwear = ['Flats first', 'Low heels are fine', 'Comfortable heels', 'Any height works'];

export default function InstantReportRefinement({ token }: { token: string }) {
  const [height, setHeight] = useState(''); const [sizeRange, setSizeRange] = useState(''); const [mix, setMix] = useState('mixed');
  const [selected, setSelected] = useState<string[]>([]); const [footwearPreference, setFootwear] = useState('');
  const [hardNos, setHardNos] = useState(''); const [finalNote, setFinalNote] = useState('');
  const [paid, setPaid] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { fetch(`/api/instant-report/${encodeURIComponent(token)}/status`, { cache: 'no-store' }).then(r => r.json()).then(data => {
    if (!data.order?.paid) throw new Error('We could not verify this paid order.');
    if (data.order.refinementComplete) { window.location.replace(`/instant-report/report/${encodeURIComponent(token)}`); return; }
    setPaid(true);
  }).catch(issue => setError(issue.message)); }, [token]);
  const valid = useMemo(() => height.trim().length > 1 && sizeRange && selected.length === 2 && footwearPreference, [footwearPreference, height, selected, sizeRange]);
  const toggle = (context: string) => setSelected(current => current.includes(context) ? current.filter(value => value !== context) : current.length < 2 ? [...current, context] : current);
  const submit = async () => {
    if (!valid) return; setBusy(true); setError('');
    try { const response = await fetch('/api/instant-report/refinement', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, height, sizeRange, wardrobeMix: mix, priorityContexts: selected, footwearPreference, hardNos, finalNote }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not save refinement.'); window.location.assign(data.reportUrl); }
    catch (issue) { setError(issue instanceof Error ? issue.message : 'Please try again.'); setBusy(false); }
  };
  return <div className="min-h-screen bg-[#F8F3E9] px-4 py-8 text-[#2C2622]"><div className="mx-auto max-w-2xl">
    <div className="mb-9 text-center"><span className="iconik-display tracking-[.3em]">I C O N I K</span><div className="iconik-micro mt-8 text-[#B68C52]">TWO-MINUTE REFINEMENT</div><h1 className="iconik-display mt-3 text-4xl sm:text-6xl">The details your ten outfits need.</h1><p className="mt-4 text-sm leading-6 text-[#2C2622]/60">We already have your photos and scan answers. These final choices make the report wearable in your real life.</p></div>
    <div className="space-y-5 rounded-[28px] border border-[#2C2622]/10 bg-white p-6 sm:p-9">
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium">Your height<input value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 5'4 or 163 cm" className="mt-2 w-full rounded-xl border border-[#2C2622]/15 px-4 py-3.5 outline-none" /></label><label className="text-xs font-medium">Current clothing-size range<select value={sizeRange} onChange={e => setSizeRange(e.target.value)} className="mt-2 w-full rounded-xl border border-[#2C2622]/15 bg-white px-4 py-3.5 outline-none"><option value="">Choose</option>{['XS–S', 'S–M', 'M–L', 'L–XL', 'XL–2XL', '2XL+'].map(value => <option key={value}>{value}</option>)}</select></label></div>
      <fieldset><legend className="mb-3 text-xs font-medium">Preferred wardrobe mix</legend><div className="grid grid-cols-3 gap-2">{[['western','Western'],['ethnic','Ethnic'],['mixed','Mixed']].map(([value,label]) => <button type="button" key={value} onClick={() => setMix(value)} className={`rounded-xl border px-3 py-3 text-xs ${mix === value ? 'border-[#2C2622] bg-[#2C2622] text-white' : 'border-[#2C2622]/15'}`}>{label}</button>)}</div></fieldset>
      <fieldset><legend className="mb-1 text-xs font-medium">Choose exactly two priority contexts</legend><p className="mb-3 text-[11px] text-[#2C2622]/45">We will still vary the outfits; these two receive the greatest weight.</p><div className="flex flex-wrap gap-2">{contexts.map(context => <button type="button" key={context} onClick={() => toggle(context)} className={`rounded-full border px-4 py-2.5 text-xs ${selected.includes(context) ? 'border-[#2C2622] bg-[#2C2622] text-white' : 'border-[#2C2622]/15'}`}>{selected.includes(context) && <Check className="mr-1 inline h-3 w-3" />}{context}</button>)}</div></fieldset>
      <fieldset><legend className="mb-3 text-xs font-medium">Footwear comfort</legend><div className="flex flex-wrap gap-2">{footwear.map(value => <button type="button" key={value} onClick={() => setFootwear(value)} className={`rounded-full border px-4 py-2.5 text-xs ${footwearPreference === value ? 'border-[#2C2622] bg-[#2C2622] text-white' : 'border-[#2C2622]/15'}`}>{value}</button>)}</div></fieldset>
      <label className="block text-xs font-medium">Hard no’s: garments, fabrics, colours or coverage<textarea value={hardNos} onChange={e => setHardNos(e.target.value)} rows={3} placeholder="Optional — tell us what you will never wear" className="mt-2 w-full resize-none rounded-xl border border-[#2C2622]/15 px-4 py-3.5 outline-none" /></label>
      <label className="block text-xs font-medium">Anything else your stylist should know?<textarea value={finalNote} onChange={e => setFinalNote(e.target.value)} rows={3} placeholder="Optional final note" className="mt-2 w-full resize-none rounded-xl border border-[#2C2622]/15 px-4 py-3.5 outline-none" /></label>
      {error && <p className="rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-800">{error}</p>}
      <button onClick={() => void submit()} disabled={!paid || !valid || busy} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#2C2622] text-sm font-medium text-white disabled:opacity-35">{busy ? 'Starting your report…' : 'Start My 24-Hour Report'} <ArrowRight className="h-4 w-4" /></button>
      <p className="flex items-center justify-center gap-2 text-[11px] text-[#2C2622]/45"><Clock3 className="h-3.5 w-3.5" /> Your 24-hour delivery clock starts when you submit this page.</p>
    </div>
  </div></div>;
}
