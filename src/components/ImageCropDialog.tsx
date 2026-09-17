'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Crop, Loader2, Minus, Plus, RotateCcw, RotateCw, X } from 'lucide-react';

/**
 * A pan-and-zoom cropper: the crop window stays fixed and the image moves
 * underneath it, which works the same with a mouse, a trackpad or a finger.
 * The crop is rendered in the browser, so the upload endpoint receives an
 * ordinary JPEG and needs no knowledge of cropping.
 */

export type ImageCropSource = { kind: 'file'; file: File } | { kind: 'url'; url: string };

type Ratio = { key: string; label: string; value: number | 'original' };

const C = { ink: '#2C2622', bg: '#F4EFE5', card: '#EDE5D2', panel: '#FBF8F0', muted: '#655E57', border: 'rgba(44,38,34,0.12)', gold: '#9A7538', danger: '#9A4039' };
const MAX_OUTPUT_EDGE = 2400;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const LOW_RES_EDGE = 700;
const STAGE_PADDING = 28;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function describeRatio(value: number) {
  const known: Array<[number, string]> = [[1, '1:1'], [4 / 5, '4:5'], [3 / 4, '3:4'], [2 / 3, '2:3'], [16 / 9, '16:9'], [3 / 2, '3:2'], [4 / 3, '4:3'], [9 / 16, '9:16']];
  return known.find(([ratio]) => Math.abs(ratio - value) < 0.02)?.[1] ?? null;
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('This image could not be opened.'));
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not create the cropped image.')), 'image/jpeg', quality);
  });
}

export default function ImageCropDialog({
  source,
  frameAspect,
  title = 'Crop image',
  subtitle,
  confirmLabel = 'Crop & upload',
  onCancel,
  onConfirm,
  onUseOriginal,
}: {
  source: ImageCropSource;
  /** Width ÷ height of the placeholder the image will fill. */
  frameAspect?: number | null;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
  onCancel: () => void;
  /** Resolve false to keep the dialog open, for example when the upload failed. */
  onConfirm: (file: File) => Promise<boolean | void> | boolean | void;
  /** Offered only for newly chosen files: upload them exactly as they are. */
  onUseOriginal?: (file: File) => Promise<boolean | void> | boolean | void;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState<'' | 'crop' | 'original'>('');
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [interacting, setInteracting] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ zoom: number; distance: number } | null>(null);

  const hasFrame = Boolean(frameAspect && Number.isFinite(frameAspect) && frameAspect > 0);
  const ratios = useMemo<Ratio[]>(() => [
    ...(hasFrame ? [{ key: 'frame', label: describeRatio(frameAspect!) ? `Report frame · ${describeRatio(frameAspect!)}` : 'Report frame', value: frameAspect! }] : []),
    { key: 'original', label: 'Original', value: 'original' },
    { key: '1:1', label: 'Square', value: 1 },
    { key: '4:5', label: '4:5', value: 4 / 5 },
    { key: '3:4', label: '3:4', value: 3 / 4 },
    { key: '16:9', label: '16:9', value: 16 / 9 },
  ], [frameAspect, hasFrame]);
  const [ratioKey, setRatioKey] = useState(hasFrame ? 'frame' : 'original');

  // Load the source. Remote images are fetched as blobs so the canvas is never tainted by a cached non-CORS response.
  useEffect(() => {
    let objectUrl = '';
    let cancelled = false;
    void (async () => {
      try {
        if (source.kind === 'file') {
          objectUrl = URL.createObjectURL(source.file);
        } else {
          const response = await fetch(source.url, { mode: 'cors', cache: 'no-store' });
          if (!response.ok) throw new Error('This image could not be downloaded for cropping.');
          objectUrl = URL.createObjectURL(await response.blob());
        }
        const loaded = await loadImage(objectUrl);
        if (!cancelled) setImage(loaded);
      } catch (caught) {
        if (!cancelled) setLoadError(caught instanceof Error && source.kind === 'file' ? caught.message : 'This image could not be opened for cropping. Download it and upload it again to crop.');
      }
    })();
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [source]);

  useLayoutEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setStage({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Lock page scroll and restore focus to wherever it was when the dialog closes.
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; previousFocus?.focus?.(); };
  }, []);
  // Focus the crop area once it is ready, so arrow keys and +/- work straight away.
  const ready = Boolean(image) && stage.width > 0;
  useEffect(() => { if (ready) stageRef.current?.focus({ preventScroll: true }); }, [ready]);
  const cancelRef = useRef(onCancel);
  cancelRef.current = onCancel;
  const busyRef = useRef(busy);
  busyRef.current = busy;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busyRef.current) { event.stopPropagation(); cancelRef.current(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  // A failed save message is stale as soon as the crop changes.
  useEffect(() => { setActionError(''); }, [zoom, offset, rotation, ratioKey]);

  const turned = rotation % 180 !== 0;
  const imageWidth = image ? (turned ? image.naturalHeight : image.naturalWidth) : 0;
  const imageHeight = image ? (turned ? image.naturalWidth : image.naturalHeight) : 0;
  const selected = ratios.find(ratio => ratio.key === ratioKey) ?? ratios[0];
  const aspect = selected.value === 'original' ? (imageWidth && imageHeight ? imageWidth / imageHeight : 1) : selected.value;

  const availableWidth = Math.max(0, stage.width - STAGE_PADDING * 2);
  const availableHeight = Math.max(0, stage.height - STAGE_PADDING * 2);
  const frameWidth = availableWidth / availableHeight > aspect ? availableHeight * aspect : availableWidth;
  const frameHeight = frameWidth / aspect;
  const baseScale = imageWidth && imageHeight && frameWidth ? Math.max(frameWidth / imageWidth, frameHeight / imageHeight) : 0;
  const scale = baseScale * zoom;

  const clampOffset = useCallback((next: { x: number; y: number }, nextZoom = zoom) => {
    const nextScale = baseScale * nextZoom;
    const limitX = Math.max(0, (imageWidth * nextScale - frameWidth) / 2);
    const limitY = Math.max(0, (imageHeight * nextScale - frameHeight) / 2);
    return { x: clamp(next.x, -limitX, limitX), y: clamp(next.y, -limitY, limitY) };
  }, [baseScale, frameHeight, frameWidth, imageHeight, imageWidth, zoom]);

  // Keep the image covering the window whenever the window or rotation changes.
  useEffect(() => {
    setOffset(current => {
      const next = clampOffset(current);
      return next.x === current.x && next.y === current.y ? current : next;
    });
  }, [clampOffset]);

  const applyZoom = useCallback((nextZoom: number) => {
    const bounded = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    setZoom(bounded);
    setOffset(current => clampOffset({ x: current.x * (bounded / zoom), y: current.y * (bounded / zoom) }, bounded));
  }, [clampOffset, zoom]);

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      applyZoom(zoom * Math.exp(-event.deltaY * 0.0015));
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [applyZoom, zoom]);

  const crop = useMemo(() => {
    if (!scale) return null;
    const width = frameWidth / scale;
    const height = frameHeight / scale;
    const left = clamp((imageWidth * scale / 2 - frameWidth / 2 - offset.x) / scale, 0, imageWidth - width);
    const top = clamp((imageHeight * scale / 2 - frameHeight / 2 - offset.y) / scale, 0, imageHeight - height);
    const outputScale = Math.min(1, MAX_OUTPUT_EDGE / Math.max(width, height));
    return { left, top, width, height, outputWidth: Math.max(1, Math.round(width * outputScale)), outputHeight: Math.max(1, Math.round(height * outputScale)) };
  }, [frameHeight, frameWidth, imageHeight, imageWidth, offset, scale]);
  const lowResolution = Boolean(crop && Math.min(crop.width, crop.height) < LOW_RES_EDGE);

  const reset = () => { setZoom(1); setOffset({ x: 0, y: 0 }); setRotation(0); };
  const rotate = (direction: 1 | -1) => { setRotation(current => (current + direction * 90 + 360) % 360); setOffset({ x: 0, y: 0 }); };
  const blocked = Boolean(busy) || !image;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (blocked) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { zoom, distance: Math.hypot(a.x - b.x, a.y - b.y) || 1 };
    }
    setInteracting(true);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size >= 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()];
      applyZoom(gesture.current.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / gesture.current.distance));
      return;
    }
    setOffset(current => clampOffset({ x: current.x + event.clientX - previous.x, y: current.y + event.clientY - previous.y }));
  };
  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) gesture.current = null;
    if (!pointers.current.size) setInteracting(false);
  };
  const onStageKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 40 : 10;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[event.key]) {
      event.preventDefault();
      setOffset(current => clampOffset({ x: current.x + moves[event.key][0], y: current.y + moves[event.key][1] }));
    } else if (event.key === '+' || event.key === '=') { event.preventDefault(); applyZoom(zoom * 1.1); }
    else if (event.key === '-') { event.preventDefault(); applyZoom(zoom / 1.1); }
  };

  const confirm = async () => {
    if (!image || !crop || busy) return;
    setBusy('crop'); setActionError('');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = crop.outputWidth;
      canvas.height = crop.outputHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Your browser could not crop this image.');
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingQuality = 'high';
      context.scale(canvas.width / crop.width, canvas.height / crop.height);
      context.translate(-crop.left, -crop.top);
      context.translate(imageWidth / 2, imageHeight / 2);
      context.rotate((rotation * Math.PI) / 180);
      context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
      let blob = await canvasToBlob(canvas, 0.92);
      if (blob.size > MAX_UPLOAD_BYTES) blob = await canvasToBlob(canvas, 0.8);
      const baseName = source.kind === 'file' ? source.file.name.replace(/\.[^.]+$/, '') : 'report-image';
      const result = await onConfirm(new File([blob], `${baseName}-cropped.jpg`, { type: 'image/jpeg' }));
      if (result === false) setActionError('The image was not saved. Check the message on the report and try again.');
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Could not crop this image.');
    } finally {
      setBusy('');
    }
  };

  const uploadOriginal = async () => {
    if (source.kind !== 'file' || !onUseOriginal || busy) return;
    setBusy('original'); setActionError('');
    try {
      const result = await onUseOriginal(source.file);
      if (result === false) setActionError('The image was not saved. Check the message on the report and try again.');
    } finally {
      setBusy('');
    }
  };

  const originalTooLarge = source.kind === 'file' && source.file.size > MAX_UPLOAD_BYTES;

  return createPortal(
    // React events bubble through portals to the report behind, so they stop here.
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:p-6"
      style={{ background: 'rgba(28,24,21,0.62)' }}
      onMouseDown={event => { event.stopPropagation(); if (event.target === event.currentTarget && !busy) onCancel(); }}
      onClick={event => event.stopPropagation()}
      onKeyDown={event => event.stopPropagation()}
      onDragOver={event => event.stopPropagation()}
      onDrop={event => { event.preventDefault(); event.stopPropagation(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-crop-title"
        className="luxury-body w-full sm:max-w-[760px] max-h-[100dvh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl"
        style={{ background: C.bg, color: C.ink, boxShadow: '0 30px 90px rgba(28,24,21,0.35)' }}
      >
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4">
          <div className="min-w-0">
            <h2 id="image-crop-title" className="iconik-display text-2xl leading-tight">{title}</h2>
            <p className="text-xs mt-1 truncate" style={{ color: C.muted }}>{subtitle || 'Drag to position · scroll or pinch to zoom'}</p>
          </div>
          <button type="button" onClick={onCancel} disabled={Boolean(busy)} aria-label="Close cropper" className="shrink-0 rounded-full p-2 disabled:opacity-40" style={{ background: C.card, color: C.muted }}><X size={18} /></button>
        </div>

        <div
          ref={stageRef}
          tabIndex={0}
          role="application"
          aria-label="Crop area. Drag or use arrow keys to move the image, plus and minus to zoom."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onStageKey}
          className="relative mx-5 sm:mx-6 h-[min(52dvh,460px)] rounded-2xl overflow-hidden select-none touch-none outline-none focus-visible:ring-2 focus-visible:ring-[#9A7538]"
          style={{ background: '#1C1815', cursor: blocked ? 'default' : interacting ? 'grabbing' : 'grab' }}
        >
          {!image && !loadError && <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm" style={{ color: 'rgba(244,239,229,0.7)' }}><Loader2 size={16} className="animate-spin" /> Opening image…</div>}
          {loadError && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center text-sm" style={{ color: 'rgba(244,239,229,0.85)' }}><AlertTriangle size={20} /> {loadError}</div>}
          {image && scale > 0 && <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt=""
              draggable={false}
              className="absolute max-w-none pointer-events-none"
              style={{
                left: stage.width / 2 + offset.x,
                top: stage.height / 2 + offset.y,
                width: image.naturalWidth * scale,
                height: image.naturalHeight * scale,
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                transition: interacting ? 'none' : 'width 120ms ease, height 120ms ease',
              }}
            />
            <div
              aria-hidden="true"
              className="absolute pointer-events-none rounded-[3px]"
              style={{
                left: (stage.width - frameWidth) / 2,
                top: (stage.height - frameHeight) / 2,
                width: frameWidth,
                height: frameHeight,
                boxShadow: '0 0 0 9999px rgba(28,24,21,0.62)',
                outline: '1.5px solid rgba(244,239,229,0.92)',
                transition: interacting ? 'none' : 'all 160ms ease',
              }}
            >
              <div className="absolute inset-0 transition-opacity duration-150" style={{
                opacity: interacting ? 1 : 0,
                backgroundImage: 'linear-gradient(to right, rgba(244,239,229,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(244,239,229,0.35) 1px, transparent 1px)',
                backgroundSize: `${frameWidth / 3}px ${frameHeight / 3}px`,
                backgroundPosition: '-1px -1px',
              }} />
            </div>
          </>}
        </div>

        <div className="px-5 sm:px-6 pt-4 space-y-4 overflow-y-auto">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Zoom out" disabled={blocked || zoom <= MIN_ZOOM} onClick={() => applyZoom(zoom / 1.2)} className="rounded-full p-2 disabled:opacity-35" style={{ background: C.card }}><Minus size={14} /></button>
            <input type="range" aria-label="Zoom" min={MIN_ZOOM} max={MAX_ZOOM} step={0.01} value={zoom} disabled={blocked} onChange={event => applyZoom(Number(event.target.value))} className="flex-1 accent-[#2C2622]" />
            <button type="button" aria-label="Zoom in" disabled={blocked || zoom >= MAX_ZOOM} onClick={() => applyZoom(zoom * 1.2)} className="rounded-full p-2 disabled:opacity-35" style={{ background: C.card }}><Plus size={14} /></button>
            <span className="w-11 text-right text-xs tabular-nums" style={{ color: C.muted }}>{zoom.toFixed(1)}×</span>
            <span className="w-px h-6 mx-1" style={{ background: C.border }} aria-hidden="true" />
            <button type="button" aria-label="Rotate left" title="Rotate left" disabled={blocked} onClick={() => rotate(-1)} className="rounded-full p-2 disabled:opacity-35" style={{ background: C.card }}><RotateCcw size={14} /></button>
            <button type="button" aria-label="Rotate right" title="Rotate right" disabled={blocked} onClick={() => rotate(1)} className="rounded-full p-2 disabled:opacity-35" style={{ background: C.card }}><RotateCw size={14} /></button>
          </div>

          <div role="radiogroup" aria-label="Crop shape" className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {ratios.map(ratio => {
              const active = ratio.key === selected.key;
              return <button key={ratio.key} type="button" role="radio" aria-checked={active} disabled={blocked} onClick={() => setRatioKey(ratio.key)} className="shrink-0 rounded-full px-3.5 py-1.5 text-xs transition-colors disabled:opacity-40" style={{ background: active ? C.ink : C.card, color: active ? C.bg : C.ink }}>{ratio.label}</button>;
            })}
            <button type="button" disabled={blocked} onClick={reset} className="shrink-0 ml-auto rounded-full px-3 py-1.5 text-xs underline underline-offset-4 disabled:opacity-40" style={{ color: C.muted }}>Reset</button>
          </div>

          <div className="min-h-[20px] text-xs" aria-live="polite">
            {actionError
              ? <p role="alert" style={{ color: C.danger }}>{actionError}</p>
              : lowResolution
                ? <p className="flex items-center gap-1.5" style={{ color: C.gold }}><AlertTriangle size={13} /> This crop is small ({Math.round(crop!.width)} × {Math.round(crop!.height)} px) and may look soft in the report.</p>
                : crop && <p style={{ color: C.muted }}>{hasFrame && selected.key !== 'frame' ? 'This shape differs from the report frame, so the report may trim the edges. ' : ''}Saves as {crop.outputWidth} × {crop.outputHeight} px</p>}
          </div>
        </div>

        <div className="flex flex-wrap-reverse sm:flex-nowrap items-center gap-2 px-5 sm:px-6 py-4 mt-2 border-t" style={{ borderColor: C.border, paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {source.kind === 'file' && onUseOriginal && (
            <button type="button" disabled={Boolean(busy) || originalTooLarge} title={originalTooLarge ? 'The original is larger than 8 MB. Crop it to upload.' : 'Upload the image exactly as it is.'} onClick={() => void uploadOriginal()} className="w-full sm:w-auto sm:mr-auto inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm underline underline-offset-4 disabled:opacity-40 disabled:no-underline" style={{ color: C.muted }}>
              {busy === 'original' && <Loader2 size={14} className="animate-spin" />} Upload without cropping
            </button>
          )}
          <button type="button" onClick={onCancel} disabled={Boolean(busy)} className={`flex-1 sm:flex-none rounded-xl px-4 py-3 text-sm disabled:opacity-40 ${source.kind === 'file' && onUseOriginal ? '' : 'sm:ml-auto'}`} style={{ background: C.panel, border: `1px solid ${C.border}` }}>Cancel</button>
          <button type="button" onClick={() => void confirm()} disabled={blocked || !crop} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A7538]" style={{ background: C.ink, color: C.bg }}>
            {busy === 'crop' ? <Loader2 size={15} className="animate-spin" /> : <Crop size={15} />} {busy === 'crop' ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Width ÷ height of the report placeholder for a slot, read from the rendered report. */
export function measureImageSlotAspect(slotKey: string) {
  const element = typeof document === 'undefined' ? null : document.querySelector<HTMLElement>(`[data-image-slot="${CSS.escape(slotKey)}"]`);
  const rect = element?.getBoundingClientRect();
  return rect && rect.width > 8 && rect.height > 8 ? rect.width / rect.height : null;
}
