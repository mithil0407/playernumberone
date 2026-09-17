'use client';

import { useRef, useState } from 'react';
import { ArrowRight, Check, Copy, Crop, ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react';
import ImageCropDialog, { type ImageCropSource } from '@/components/ImageCropDialog';
import type { BlueprintPage } from '@/lib/stylistBlueprintGenerator';
import { outfitPieces, setOutfitPieces, outfitCopy, setOutfitCopy, OUTFIT_COPY_FIELDS, type OutfitPiece } from '@/lib/stylistOutfitEditor';

const fieldClass = 'block w-full mt-1.5 rounded-xl border border-[#2C2622]/15 bg-[#FAF7F0] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#9A7538] disabled:opacity-60';
export default function StylistOutfitEditor({ page, onChange, onSave, onUpload, getPrompt, getAlternatives, chooseAlternative, onApprove, imageUrl, busy, saving, hasUnsavedEdits, saveError, getCropAspect }: {
  saveError?: string;
  /** Width ÷ height of the outfit image frame in the report, used as the default crop shape. */
  getCropAspect?: () => number | null;
  page: BlueprintPage; onChange: (page: BlueprintPage) => void; onSave: () => Promise<boolean>;
  onUpload: (file: File) => Promise<boolean>; getPrompt: () => Promise<string>; onApprove: () => Promise<void>;
  imageUrl: string | null; busy: boolean; saving: boolean; hasUnsavedEdits: boolean;
  getAlternatives: () => Promise<Array<{ id: string; pieces: string[] }>>;
  chooseAlternative: (id: string) => Promise<void>;
}) {
  const [step, setStep] = useState<'outfit' | 'image'>('outfit');
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [cropSource, setCropSource] = useState<ImageCropSource | null>(null);
  const [cropAspect, setCropAspect] = useState<number | null>(null);
  const [alternatives, setAlternatives] = useState<Array<{ id: string; pieces: string[] }> | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const pieces = outfitPieces(page);
  const disabled = busy || working;
  const changePiece = (index: number, patch: Partial<OutfitPiece>) => onChange(setOutfitPieces(page, pieces.map((piece, i) => i === index ? { ...piece, ...patch } : piece)));
  const continueToImage = async () => {
    setWorking(true); setError('');
    try { if (await onSave()) setStep('image'); else setError('Finish saving the outfit before continuing.'); }
    finally { setWorking(false); }
  };
  const openCropper = (source: ImageCropSource) => {
    if (disabled || saving) return;
    setError(''); setMessage('');
    setCropAspect(getCropAspect?.() ?? null);
    setCropSource(source);
  };
  const choose = (file?: File) => {
    if (input.current) input.current.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setError('Choose a JPG, PNG or WebP image.'); return; }
    openCropper({ kind: 'file', file });
  };
  const upload = async (file: File) => {
    if (disabled || saving) return false;
    setWorking(true); setError(''); setMessage('');
    try {
      const saved = await onUpload(file);
      if (saved) { setMessage('Image saved. Review the report, then approve this page.'); setCropSource(null); }
      return saved;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Image upload failed');
      return false;
    } finally { setWorking(false); }
  };
  const copyPrompt = async () => {
    setWorking(true); setError('');
    try { await navigator.clipboard.writeText(await getPrompt()); setMessage('Image prompt copied from your saved outfit.'); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not copy the image prompt.'); }
    finally { setWorking(false); }
  };
  return <div className="luxury-body space-y-5">
    <div className="grid grid-cols-2 rounded-xl p-1 bg-[#EDE5D2]" aria-label="Outfit workflow">
      <button onClick={() => setStep('outfit')} className={`rounded-lg px-3 py-3 text-sm ${step === 'outfit' ? 'bg-[#2C2622] text-[#F4EFE5]' : ''}`}>01 · Edit outfit</button>
      <button onClick={() => void continueToImage()} disabled={disabled || saving} className={`rounded-lg px-3 py-3 text-sm disabled:opacity-50 ${step === 'image' ? 'bg-[#2C2622] text-[#F4EFE5]' : ''}`}>02 · Upload image</button>
    </div>
    <p className="text-xs leading-5 text-[#746D65]">{step === 'outfit' ? 'Change any piece or write a completely new outfit. Your report preview updates as you type.' : 'Upload an image that matches the saved outfit. You can also copy its image prompt.'}</p>
    {(error || saveError) && <p role="alert" className="rounded-xl bg-[#F8E8E3] p-3 text-sm text-[#9A4039]">{error || saveError}</p>}
    {message && <p role="status" className="rounded-xl bg-[#E4EBDE] p-3 text-sm text-[#426B4E]">{message}</p>}
    {step === 'outfit' ? <>
      <div className="rounded-2xl border border-[#2C2622]/10 bg-[#EDE5D2]/60 p-4">
        <p className="text-sm font-medium">Want a different look?</p>
        <p className="text-xs leading-5 text-[#746D65] mt-1">Choose another suitable outfit, or edit the pieces below yourself.</p>
        <button disabled={disabled || saving} onClick={async () => { setWorking(true); setError(''); try { setAlternatives(await getAlternatives()); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not load choices'); } finally { setWorking(false); } }} className="text-sm underline mt-3 disabled:opacity-50">Browse alternative looks</button>
        {alternatives && <div className="space-y-2 mt-4">
          {!alternatives.length && <p className="text-xs leading-5 text-[#746D65]">No unused alternatives are available for this occasion. You can change every piece below.</p>}
          {alternatives.map((option, index) => <button key={option.id} disabled={disabled} onClick={async () => {
            setWorking(true); setError('');
            try { await chooseAlternative(option.id); setAlternatives(null); setMessage('New outfit saved. Review the pieces, then upload its image.'); }
            catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not change the outfit'); }
            finally { setWorking(false); }
          }} className="block w-full text-left rounded-xl bg-[#FAF7F0] border border-[#2C2622]/10 p-3 disabled:opacity-50">
            <span className="text-xs font-medium">Look {index + 1} · Use this outfit →</span><span className="block text-xs leading-5 text-[#746D65] mt-2">{option.pieces.slice(0, 4).join(' · ')}</span>
          </button>)}
        </div>}
      </div>
      <fieldset disabled={disabled} className="space-y-5">
        <label className="block text-xs font-medium">Outfit title<input className={fieldClass} value={page.title} onChange={e => onChange({ ...page, title: e.target.value })} /></label>
        <label className="block text-xs font-medium">Occasion<input className={fieldClass} value={page.subtitle ?? ''} onChange={e => onChange({ ...page, subtitle: e.target.value })} /></label>
        {pieces.map((piece, index) => <section key={index} className="rounded-2xl border border-[#2C2622]/10 p-4 bg-[#EDE5D2]/60">
          <div className="flex items-center justify-between mb-3"><p className="text-xs font-medium">Piece {index + 1} · {piece.slot || 'New piece'}</p><button type="button" aria-label={`Remove piece ${index + 1}`} disabled={pieces.length <= 4} title={pieces.length <= 4 ? 'Keep at least four pieces for a complete outfit.' : 'Remove this piece'} onClick={() => onChange(setOutfitPieces(page, pieces.filter((_, i) => i !== index)))} className="p-2 rounded-lg hover:bg-[#F4EFE5] disabled:opacity-25"><Trash2 size={14} /></button></div>
          <label className="block text-xs">Category<input className={fieldClass} value={piece.slot} placeholder="Top, bottom, dress, shoes…" onChange={e => changePiece(index, { slot: e.target.value })} /></label>
          <label className="block mt-3 text-xs">Garment or accessory<textarea rows={2} className={fieldClass} value={piece.piece} placeholder="Navy linen wrap blouse with elbow-length sleeves" onChange={e => changePiece(index, { piece: e.target.value })} /></label>
          <div className="flex gap-3 items-end mt-3"><label className="block text-xs flex-1">Colour<input className={fieldClass} value={piece.colour_name} placeholder="Navy" onChange={e => changePiece(index, { colour_name: e.target.value })} /></label><label className="block text-xs">Swatch<input aria-label={`Colour swatch for piece ${index + 1}`} type="color" className="block mt-1.5 w-12 h-10 rounded-lg bg-transparent" value={/^#[0-9a-f]{6}$/i.test(piece.colour_hex) ? piece.colour_hex : '#2C2622'} onChange={e => changePiece(index, { colour_hex: e.target.value })} /></label></div>
          <details className="mt-3"><summary className="text-xs cursor-pointer text-[#746D65]">Fit and styling notes</summary><textarea aria-label={`Fit and styling notes for piece ${index + 1}`} rows={2} className={fieldClass} value={piece.structural_notes} onChange={e => changePiece(index, { structural_notes: e.target.value })} /></details>
        </section>)}
        <button type="button" disabled={pieces.length >= 8} onClick={() => onChange(setOutfitPieces(page, [...pieces, { slot: 'Accessory', piece: '', colour_name: '', colour_hex: '#2C2622', palette_role: 'accent', structural_notes: '' }]))} className="inline-flex items-center gap-2 text-sm underline disabled:opacity-40"><Plus size={15} /> Add a piece</button>
        {OUTFIT_COPY_FIELDS.map(field => <label key={field.key} className="block text-xs font-medium">{field.label}<textarea rows={3} className={fieldClass} value={outfitCopy(page, field.key)} onChange={e => onChange(setOutfitCopy(page, field.key, e.target.value))} /></label>)}
      </fieldset>
      <div className="sticky bottom-0 py-4 bg-[#F4EFE5] border-t border-[#2C2622]/10">
        <button onClick={() => void continueToImage()} disabled={disabled || saving} className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 bg-[#2C2622] text-[#F4EFE5] text-sm disabled:opacity-50">{saving || working ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}{saving ? 'Saving…' : 'Save outfit & continue'}</button>
        <p role="status" className="text-center text-xs text-[#746D65] mt-2">{saving ? 'Saving your changes' : hasUnsavedEdits ? 'Changes waiting to save' : 'All changes saved'}</p>
      </div>
    </> : <>
      <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); choose(e.dataTransfer.files[0]); }} className={`rounded-2xl border-2 border-dashed p-5 text-center ${dragging ? 'border-[#9A7538] bg-[#EDE5D2]' : 'border-[#2C2622]/20'}`}>
        {imageUrl ? <img src={imageUrl} alt="Saved outfit image" className="max-h-72 mx-auto rounded-xl mb-4 object-contain" /> : <ImagePlus size={30} className="mx-auto mb-4 text-[#9A7538]" />}
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload outfit image" className="sr-only" onChange={e => choose(e.target.files?.[0])} />
        <div className="flex flex-wrap justify-center gap-2">
          <button disabled={disabled || saving} onClick={() => input.current?.click()} className="rounded-xl px-5 py-3 text-sm bg-[#2C2622] text-[#F4EFE5] disabled:opacity-50">{working ? 'Working…' : imageUrl ? 'Replace image' : 'Choose image'}</button>
          {imageUrl && <button disabled={disabled || saving} onClick={() => openCropper({ kind: 'url', url: imageUrl })} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm border border-[#2C2622]/15 bg-[#FAF7F0] disabled:opacity-50"><Crop size={15} /> Crop image</button>}
        </div>
        <p className="text-xs text-[#655E57] mt-3">Or drop it here · JPG, PNG or WebP · you can crop before it saves</p>
      </div>
      <button disabled={disabled || saving} onClick={() => void copyPrompt()} className="w-full flex justify-center gap-2 border border-[#2C2622]/15 rounded-xl px-4 py-3 text-sm disabled:opacity-50"><Copy size={15} /> Copy image prompt</button>
      <button disabled={disabled || saving || !imageUrl || hasUnsavedEdits} onClick={() => void onApprove()} className="w-full flex justify-center gap-2 rounded-xl px-4 py-3 text-sm bg-[#426B4E] text-white disabled:opacity-40"><Check size={15} /> Approve & next page</button>
      {!imageUrl && <p className="text-xs text-[#746D65]">Upload the matching image before approving this outfit.</p>}
    </>}
    {cropSource && <ImageCropDialog
      source={cropSource}
      frameAspect={cropAspect}
      title={cropSource.kind === 'url' ? 'Crop outfit image' : 'Crop before uploading'}
      subtitle={`${page.title || 'Outfit image'} · drag to position, scroll or pinch to zoom`}
      confirmLabel={cropSource.kind === 'url' ? 'Save crop' : 'Crop & upload'}
      onCancel={() => setCropSource(null)}
      onConfirm={upload}
      onUseOriginal={upload}
    />}
  </div>;
}
