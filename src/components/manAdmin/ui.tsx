'use client';

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2, MoreHorizontal, X } from 'lucide-react';

// Small building blocks for the Man admin. Styling lives in man-admin.css.

type ButtonVariant = 'primary' | 'dark' | 'secondary' | 'ghost' | 'danger' | 'success';

export function Button({
  variant = 'secondary',
  size,
  loading = false,
  icon,
  iconOnly = false,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'sm' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  iconOnly?: boolean;
}) {
  const classes = [
    'ma-btn',
    `ma-btn--${variant}`,
    size ? `ma-btn--${size}` : '',
    iconOnly ? 'ma-btn--icon' : '',
    className,
  ].filter(Boolean).join(' ');
  return (
    <button type="button" className={classes} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin" /> : icon}
      {!iconOnly && children}
    </button>
  );
}

export type PillTone = 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'accent';

export function Pill({ tone = 'neutral', live = false, dot = false, children, title }: {
  tone?: PillTone;
  live?: boolean;
  dot?: boolean;
  children: ReactNode;
  title?: string;
}) {
  const classes = ['ma-pill', tone !== 'neutral' ? `ma-pill--${tone}` : '', live ? 'ma-pill--live' : ''].filter(Boolean).join(' ');
  return (
    <span className={classes} title={title}>
      {(dot || live) && <span className="ma-pill__dot" />}
      {children}
    </span>
  );
}

// ── Report status, shared by the dashboard, intake and report screens ──────

export interface ReportStatusInput {
  status: string;
  progress_stage?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

const STAGE_SHORT: Record<string, string> = {
  classifying: 'Reading profile',
  generating_s0: 'Writing snapshot',
  analysing_face: 'Reading face',
  generating_s1: 'Writing face',
  analysing_body: 'Reading body',
  generating_s2: 'Writing body',
  mapping_colour: 'Mapping colour',
  generating_s3: 'Writing colour',
  generating_outfits: 'Writing outfits',
  generating_s4: 'Writing outfits',
  generating_s4_combo_grids: 'Writing grids',
  repairing_section4: 'Checking outfits',
  generating_s5: 'Writing rules',
  generating_s5_shopping: 'Finding products',
  generating_s5_grooming_skin: 'Writing grooming',
  generating_s6: 'Writing identity',
  generating_images: 'Making images',
  generating_base_model: 'Making face images',
  generating_outfit_images: 'Making outfit images',
  finalising: 'Finishing',
};

export function isReportStuck(report: ReportStatusInput): boolean {
  const since = report.updated_at ?? report.created_at;
  return report.status === 'generating' && !!since && Date.now() - new Date(since).getTime() > 10 * 60_000;
}

export function reportStatusMeta(report: ReportStatusInput | null): { label: string; tone: PillTone; live: boolean } {
  if (!report) return { label: 'Not started', tone: 'neutral', live: false };
  if (report.status === 'generating') {
    if (isReportStuck(report)) return { label: 'Stalled', tone: 'amber', live: false };
    return { label: STAGE_SHORT[report.progress_stage ?? ''] ?? 'Generating', tone: 'blue', live: true };
  }
  switch (report.status) {
    case 'pending': return { label: 'Queued', tone: 'blue', live: false };
    case 'draft_ready': return { label: 'Ready to review', tone: 'accent', live: false };
    case 'in_review': return { label: 'In review', tone: 'accent', live: false };
    case 'approved': return { label: 'Approved', tone: 'green', live: false };
    case 'sent': return { label: 'Sent', tone: 'green', live: false };
    case 'error': return { label: 'Failed', tone: 'red', live: false };
    default: return { label: report.status.replace(/_/g, ' '), tone: 'neutral', live: false };
  }
}

export function ReportStatusPill({ report }: { report: ReportStatusInput | null }) {
  const meta = reportStatusMeta(report);
  return <Pill tone={meta.tone} live={meta.live} dot={!meta.live}>{meta.label}</Pill>;
}

// ── Sheet ────────────────────────────────────────────────────────────────

export function Sheet({ open, onClose, title, eyebrow, width = 640, footer, children }: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  width?: number;
  footer?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="ma-scope ma-sheet-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="ma-sheet" style={{ maxWidth: width }} role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-4 px-7 pt-6 pb-4">
          <div className="min-w-0">
            {eyebrow && <div className="ma-eyebrow mb-1.5">{eyebrow}</div>}
            <div className="ma-h2" style={{ fontSize: 20 }}>{title}</div>
          </div>
          <Button variant="ghost" size="sm" iconOnly icon={<X size={16} />} onClick={onClose} aria-label="Close" />
        </div>
        <div className="flex-1 overflow-y-auto px-7 pb-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 px-7 py-4" style={{ borderTop: '1px solid var(--ma-line-2)', background: 'var(--ma-surface-2)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Overflow menu ────────────────────────────────────────────────────────

export interface MenuItem {
  label: string;
  hint?: string;
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export function OverflowMenu({ items, label = 'More actions', align = 'right', trigger }: {
  items: MenuItem[];
  label?: string;
  align?: 'left' | 'right';
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger ? (
        <span onClick={() => setOpen(value => !value)}>{trigger}</span>
      ) : (
        <Button variant="secondary" iconOnly icon={<MoreHorizontal size={17} />} aria-label={label} title={label} onClick={() => setOpen(value => !value)} />
      )}
      {open && (
        <div className="ma-menu" style={{ top: 'calc(100% + 8px)', [align]: 0 }}>
          {items.map(item => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              className={item.danger ? 'is-danger' : undefined}
              onClick={() => { setOpen(false); item.onSelect(); }}
            >
              {item.icon && <span className="shrink-0 opacity-70">{item.icon}</span>}
              <span>
                {item.label}
                {item.hint && <span className="ma-menu__hint">{item.hint}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Segmented control ────────────────────────────────────────────────────

export function Segmented<T extends string>({ value, onChange, options }: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; count?: number | null }>;
}) {
  return (
    <div className="ma-seg" role="tablist">
      {options.map(option => (
        <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
          {option.label}
          {option.count != null && <span className="ma-seg__count">{option.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────

export function Avatar({ name, src, size = 38 }: { name: string; src?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initials = name.replace(/@.*/, '').replace(/[^a-zA-Z ]/g, ' ').trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() || '·';
  return (
    <span className="ma-avatar" style={{ width: size, height: size }}>
      {src && !failed
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={src} alt="" onError={() => setFailed(true)} />
        : initials}
    </span>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────

export function useToast(): [ReactNode, (message: string) => void] {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = (next: string) => {
    setMessage(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2600);
  };
  return [message ? <div className="ma-toast" role="status">{message}</div> : null, show];
}

export function clientDisplayName(email: string | null | undefined, phone?: string | null): string {
  if (email) {
    const local = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\d+/g, '').trim();
    if (local.length >= 2) return local.replace(/\b\w/g, char => char.toUpperCase());
    return email;
  }
  return phone || 'Client';
}
