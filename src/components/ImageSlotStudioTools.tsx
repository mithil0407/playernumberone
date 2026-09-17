'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Crop, ImagePlus, Loader2, MoreHorizontal, Pencil, RefreshCw, Sparkles, Upload, X } from 'lucide-react';

/**
 * Editing controls laid over one report image. They are rendered only by the
 * report studio (the client report never mounts this file), so everything here
 * can favour clarity over a clean page.
 *
 * The toolbar adapts to the space the image has in the report:
 *   wide   – every action as a labelled button
 *   medium – Replace and Crop labelled, prompt actions under "More"
 *   small  – one "Edit" button that opens a labelled menu
 */

type Tier = 'wide' | 'medium' | 'small';
type Action = { key: string; label: string; hint: string; icon: ReactNode; onSelect: () => void; disabled?: boolean; disabledReason?: string; primary?: boolean };

const INK = '#1C1815';
const IVORY = '#F4EFE5';

function tierFor(width: number): Tier {
  if (width >= 400) return 'wide';
  if (width >= 210) return 'medium';
  return 'small';
}

export default function ImageSlotStudioTools({
  frameRef,
  label,
  hasImage,
  prompt,
  canUpload,
  canRegenerate,
  isUploading,
  isRegenerating,
  uploadDisabledReason,
  regenerateDisabledReason,
  onUpload,
  onCrop,
  onRegenerate,
}: {
  frameRef: RefObject<HTMLDivElement | null>;
  label: string;
  hasImage: boolean;
  prompt?: string;
  canUpload: boolean;
  canRegenerate: boolean;
  isUploading: boolean;
  isRegenerating: boolean;
  /** Empty when uploading is allowed; otherwise why it is not. */
  uploadDisabledReason: string;
  regenerateDisabledReason: string;
  onUpload: () => void;
  onCrop: () => void;
  onRegenerate: () => void;
}) {
  const [tier, setTier] = useState<Tier>('wide');
  const [menu, setMenu] = useState<{ trigger: HTMLElement; actions: Action[] } | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const wasUploading = useRef(isUploading);

  // A passive effect, not a layout effect: the parent attaches frameRef only after its children's layout effects run.
  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setTier(tierFor(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, [frameRef]);

  // Confirm a finished upload in place, where the stylist is looking.
  useEffect(() => {
    if (wasUploading.current && !isUploading && hasImage) {
      setSaved(true);
      const timer = window.setTimeout(() => setSaved(false), 2200);
      wasUploading.current = isUploading;
      return () => window.clearTimeout(timer);
    }
    wasUploading.current = isUploading;
  }, [hasImage, isUploading]);

  const copyPrompt = useCallback(async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setPromptOpen(true);
    }
  }, [prompt]);

  const busy = isUploading || isRegenerating;
  const place = label.charAt(0).toUpperCase() + label.slice(1);
  const actions: Action[] = [
    ...(canUpload ? [{
      key: 'upload', primary: true,
      label: hasImage ? 'Replace' : 'Add photo',
      hint: hasImage ? 'Upload a different photo for this spot' : 'Upload a photo for this spot',
      icon: hasImage ? <Upload size={14} /> : <ImagePlus size={14} />,
      onSelect: onUpload, disabled: Boolean(uploadDisabledReason), disabledReason: uploadDisabledReason,
    }] : []),
    ...(canUpload && hasImage ? [{
      key: 'crop', label: 'Crop', hint: 'Reframe, zoom or rotate the current photo',
      icon: <Crop size={14} />, onSelect: onCrop, disabled: Boolean(uploadDisabledReason), disabledReason: uploadDisabledReason,
    }] : []),
    ...(prompt ? [{
      key: 'copy', label: copied ? 'Copied' : 'Copy prompt', hint: 'Copy the AI prompt to create this image elsewhere',
      icon: copied ? <Check size={14} /> : <Copy size={14} />, onSelect: () => { void copyPrompt(); },
    }, {
      key: 'view', label: 'View prompt', hint: 'Read the prompt before copying it',
      icon: <Sparkles size={14} />, onSelect: () => setPromptOpen(true),
    }] : []),
    ...(canRegenerate ? [{
      key: 'regenerate', label: 'Regenerate', hint: 'Create a new AI image for this spot',
      icon: <RefreshCw size={14} />, onSelect: onRegenerate, disabled: Boolean(regenerateDisabledReason), disabledReason: regenerateDisabledReason,
    }] : []),
  ];
  // An empty spot already shows a large "Add photo" button in its centre.
  const toolbarActions = hasImage ? actions : actions.filter(action => action.key !== 'upload');

  const inline = tier === 'wide' ? toolbarActions : tier === 'medium' ? toolbarActions.filter(action => action.key === 'upload' || action.key === 'crop') : [];
  const overflow = toolbarActions.filter(action => !inline.includes(action));
  const openMenu = (event: React.MouseEvent<HTMLButtonElement>, list: Action[]) => {
    const trigger = event.currentTarget;
    setMenu(current => current ? null : { trigger, actions: list });
  };
  // Copy feedback changes labels, so a menu that stays open must read the latest actions.
  const liveMenuActions = menu ? menu.actions.map(item => actions.find(action => action.key === item.key) ?? item) : [];

  return (
    <>
      <style href="iconik-image-slot-studio" precedence="default">{STUDIO_CSS}</style>
      {busy && (
        <div className="slot-studio-busy" role="status" aria-live="polite">
          <Loader2 size={tier === 'small' ? 16 : 20} className="spin-icon" />
          {tier !== 'small' && <span>{isUploading ? 'Saving photo…' : 'Creating image…'}</span>}
        </div>
      )}

      {!hasImage && canUpload && !busy && (
        <div className="slot-studio-empty">
          <button type="button" className="slot-studio-empty-button" onClick={onUpload} disabled={Boolean(uploadDisabledReason)} title={uploadDisabledReason || `Upload a photo for the ${label}`}>
            <ImagePlus size={tier === 'small' ? 16 : 18} />
            {tier !== 'small' && <span>Add photo</span>}
          </button>
          {tier === 'wide' && <p>or drop an image here</p>}
        </div>
      )}

      {saved && !busy && <div className="slot-studio-saved" role="status"><Check size={13} /> {tier === 'small' ? 'Saved' : 'Photo saved'}</div>}

      {!busy && toolbarActions.length > 0 && (
        <div className={`slot-studio-toolbar slot-studio-${tier}`} role="toolbar" aria-label={`${place} tools`}>
          {inline.map(action => (
            <button
              key={action.key}
              type="button"
              className={`slot-studio-button ${action.primary ? 'is-primary' : ''}`}
              onClick={action.onSelect}
              disabled={action.disabled}
              title={action.disabledReason || action.hint}
              aria-label={`${action.label} – ${place}`}
            >
              {action.icon}<span>{action.label}</span>
            </button>
          ))}
          {overflow.length > 0 && (
            <button
              type="button"
              className="slot-studio-button"
              aria-haspopup="menu"
              aria-expanded={Boolean(menu)}
              aria-label={tier === 'small' ? `Edit ${label}` : `More tools for ${label}`}
              title={tier === 'small' ? 'Replace, crop or copy the prompt' : 'More image tools'}
              onClick={event => openMenu(event, overflow)}
            >
              {tier === 'small' ? <><Pencil size={13} /><span>Edit</span></> : <><MoreHorizontal size={15} /><span>More</span></>}
            </button>
          )}
        </div>
      )}

      {menu && <SlotMenu trigger={menu.trigger} title={place} actions={liveMenuActions} onClose={() => setMenu(null)} />}
      {promptOpen && prompt && <PromptDialog title={place} prompt={prompt} copied={copied} onCopy={() => { void copyPrompt(); }} onClose={() => setPromptOpen(false)} />}
    </>
  );
}

/** Keeps React events from portals out of the report behind them (lightbox, drag-and-drop, inline editing). */
const containEvents = {
  onClick: (event: React.SyntheticEvent) => event.stopPropagation(),
  onMouseDown: (event: React.SyntheticEvent) => event.stopPropagation(),
  onKeyDown: (event: React.SyntheticEvent) => event.stopPropagation(),
  onDragOver: (event: React.SyntheticEvent) => event.stopPropagation(),
};

function SlotMenu({ trigger, title, actions, onClose }: { trigger: HTMLElement; title: string; actions: Action[]; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const element = menuRef.current;
    if (!element) return;
    const anchor = trigger.getBoundingClientRect();
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const gap = 8;
    const below = anchor.bottom + gap + height <= window.innerHeight - 12;
    setPosition({
      left: Math.min(Math.max(12, anchor.left + anchor.width / 2 - width / 2), window.innerWidth - width - 12),
      top: below ? anchor.bottom + gap : Math.max(12, anchor.top - gap - height),
    });
    element.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true });
  }, [trigger]);

  useEffect(() => {
    const close = () => onClose();
    // The trigger toggles the menu itself, so a press on it must not also count as an outside press.
    const onPointer = (event: PointerEvent) => { const target = event.target as Node; if (!menuRef.current?.contains(target) && !trigger.contains(target)) onClose(); };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); } };
    window.addEventListener('pointerdown', onPointer, true);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('pointerdown', onPointer, true);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [onClose, trigger]);

  const move = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  };

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={`${title} tools`}
      onKeyDownCapture={move}
      {...containEvents}
      className="luxury-body fixed z-[110] w-64 rounded-2xl border p-1.5"
      style={{ left: position?.left ?? -9999, top: position?.top ?? -9999, background: '#FBF8F0', borderColor: 'rgba(44,38,34,0.12)', boxShadow: '0 18px 50px rgba(28,24,21,0.22)', color: '#2C2622' }}
    >
      <p className="px-3 pt-2 pb-1.5 text-[11px] uppercase tracking-[0.12em]" style={{ color: '#655E57' }}>{title}</p>
      {actions.map(action => (
        <button
          key={action.key}
          type="button"
          role="menuitem"
          disabled={action.disabled}
          title={action.disabledReason || undefined}
          onClick={() => { action.onSelect(); if (action.key !== 'copy') onClose(); }}
          className="w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[rgba(44,38,34,0.06)] focus-visible:bg-[rgba(44,38,34,0.06)] outline-none disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="mt-0.5 shrink-0">{action.icon}</span>
          <span className="min-w-0">
            <span className="block text-sm">{action.label}</span>
            <span className="block text-xs mt-0.5" style={{ color: '#655E57' }}>{action.disabled && action.disabledReason ? action.disabledReason : action.hint}</span>
          </span>
        </button>
      ))}
    </div>,
    document.body,
  );
}

function PromptDialog({ title, prompt, copied, onCopy, onClose }: { title: string; prompt: string; copied: boolean; onCopy: () => void; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, true);
    return () => { window.removeEventListener('keydown', onKey, true); previous?.focus?.(); };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[115] flex items-end sm:items-center justify-center sm:p-6" style={{ background: 'rgba(28,24,21,0.55)' }} {...containEvents} onMouseDown={event => { event.stopPropagation(); if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="slot-prompt-title" className="luxury-body w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[85dvh]" style={{ background: IVORY, color: '#2C2622', boxShadow: '0 30px 90px rgba(28,24,21,0.3)' }}>
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
          <div>
            <h2 id="slot-prompt-title" className="iconik-display text-2xl">Image prompt</h2>
            <p className="text-xs mt-1" style={{ color: '#655E57' }}>{title} · paste this into your image tool, then upload the result here</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close prompt" className="shrink-0 rounded-full p-2" style={{ background: '#EDE5D2', color: '#655E57' }}><X size={18} /></button>
        </div>
        <div className="px-6 overflow-y-auto">
          <p className="whitespace-pre-wrap text-sm leading-6 rounded-2xl p-4 select-text" style={{ background: '#FBF8F0', border: '1px solid rgba(44,38,34,0.1)' }}>{prompt}</p>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm" style={{ background: '#FBF8F0', border: '1px solid rgba(44,38,34,0.12)' }}>Close</button>
          <button type="button" onClick={onCopy} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium" style={{ background: '#2C2622', color: IVORY }}>
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy prompt'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** React hoists and de-duplicates this by href, so twenty slots still add one stylesheet. */
const STUDIO_CSS = `
  .image-slot-frame.is-studio-slot { outline: 1px solid transparent; outline-offset: -1px; transition: outline-color 140ms ease; }
  .image-slot-frame.is-studio-slot:hover { outline-color: rgba(201, 169, 110, 0.75); }
  .slot-studio-toolbar {
    position: absolute; left: 50%; bottom: 10px; z-index: 5; transform: translateX(-50%);
    display: flex; align-items: center; gap: 2px; padding: 3px; max-width: calc(100% - 16px);
    border-radius: 999px; background: rgba(28, 24, 21, 0.78); border: 1px solid rgba(244, 239, 229, 0.16);
    box-shadow: 0 8px 26px rgba(28, 24, 21, 0.28);
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    font-family: var(--font-manrope), Manrope, ui-sans-serif, system-ui, sans-serif;
  }
  .slot-studio-button {
    display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 11px;
    border-radius: 999px; border: 0; background: transparent; color: ${IVORY};
    font-size: 12px; line-height: 1; letter-spacing: 0; white-space: nowrap; cursor: pointer;
    transition: background 120ms ease;
  }
  .slot-studio-button:hover:not(:disabled) { background: rgba(244, 239, 229, 0.14); }
  .slot-studio-button.is-primary { background: ${IVORY}; color: ${INK}; font-weight: 600; }
  .slot-studio-button.is-primary:hover:not(:disabled) { background: #FFFFFF; }
  .slot-studio-button:disabled { opacity: 0.45; cursor: not-allowed; }
  .slot-studio-button:focus-visible { outline: 2px solid #C9A96E; outline-offset: 1px; }
  .slot-studio-small { bottom: 6px; }
  .slot-studio-small .slot-studio-button { height: 28px; padding: 0 10px; }
  .slot-studio-empty {
    position: absolute; inset: 0; z-index: 4; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
    pointer-events: none; font-family: var(--font-manrope), Manrope, ui-sans-serif, system-ui, sans-serif;
  }
  .slot-studio-empty p { margin: 0; font-size: 11px; color: ${IVORY}; text-shadow: 0 1px 8px rgba(28, 24, 21, 0.6); }
  .slot-studio-empty-button {
    pointer-events: auto; display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px; border-radius: 999px;
    border: 1px dashed rgba(244, 239, 229, 0.7); background: rgba(28, 24, 21, 0.62); color: ${IVORY};
    font-size: 13px; cursor: pointer; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  }
  .slot-studio-empty-button:hover:not(:disabled) { background: rgba(28, 24, 21, 0.8); }
  .slot-studio-empty-button:disabled { opacity: 0.5; cursor: not-allowed; }
  .slot-studio-busy {
    position: absolute; inset: 0; z-index: 6; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
    background: rgba(28, 24, 21, 0.55); color: ${IVORY}; font-size: 12px; letter-spacing: 0.04em;
    backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);
    font-family: var(--font-manrope), Manrope, ui-sans-serif, system-ui, sans-serif;
  }
  .slot-studio-saved {
    position: absolute; top: 10px; left: 50%; z-index: 6; transform: translateX(-50%);
    display: inline-flex; align-items: center; gap: 5px; padding: 6px 11px; border-radius: 999px;
    background: #E3EDE3; color: #3F6A4C; font-size: 12px; font-weight: 600; white-space: nowrap;
    box-shadow: 0 6px 18px rgba(28, 24, 21, 0.2); animation: slot-studio-pop 180ms ease-out;
    font-family: var(--font-manrope), Manrope, ui-sans-serif, system-ui, sans-serif;
  }
  @keyframes slot-studio-pop { from { opacity: 0; transform: translate(-50%, -4px); } to { opacity: 1; transform: translate(-50%, 0); } }
  @media print { .slot-studio-toolbar, .slot-studio-empty, .slot-studio-busy, .slot-studio-saved { display: none !important; } }
`;
