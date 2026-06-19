'use client';

import { useEffect, useState, use, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Send, Loader2, Copy, CheckCheck, X, Zap, Ban, RotateCcw, ImageIcon, LayoutDashboard, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ManReport, { getManReportSlideMeta, type ManReportSlideMeta } from '@/components/ManReport';
import { ActionButton, Pill, reviewTheme as S } from '@/components/AdminReviewWorkspace';
import type { ReportData, ReportSections } from '@/lib/manReportGenerator';
import type { ResolvedImageUrls, FaceImageKind } from '@/lib/manImageGenerator';
import type { ComboGridKind } from '@/lib/manComboGridSection';

// ── Types ──────────────────────────────────────────────────────────────────

interface SectionApprovals {
  s0?: boolean;
  s1: boolean; s2: boolean; s3: boolean;
  s4: boolean; s4g?: boolean; s5s?: boolean; s5g?: boolean;
  s5?: boolean; s6: boolean;
}

interface Report {
  id: string;
  status: string;
  progress_stage: string | null;
  report_data: ReportData | null;
  image_urls: ResolvedImageUrls | null;
  share_token: string;
  section_approvals: SectionApprovals;
  submission_id: string;
  created_at: string;
  updated_at: string;
  error_message: string | null;
  sent_at: string | null;
  man_intake_submissions: { id: string; customer_email: string; customer_phone: string | null } | null;
}

interface ReportStatusSnapshot {
  reportId: string;
  status: string;
  progressStage: string | null;
  errorMessage: string | null;
  generatedAt: string | null;
  shareToken: string;
  updatedAt: string | null;
  imageCounts: {
    hairstyleDone: number;
    beardDone: number;
    eyewearDone: number;
    outfitDone: number;
    comboGridDone?: number;
  };
}

interface OutfitRegenerationResult {
  imageUrl: string | null;
  updatedS4Outfits: string;
  enrichedOutfitText?: string;
  imageStatus: 'generated' | 'failed';
  error?: string;
}

interface OutfitSaveTextResult {
  updatedS4Outfits: string;
  enrichedOutfitText?: string;
}

interface ComboGridSaveTextResult {
  updatedComboGridText: string;
}

interface ComboGridRegenerationResult {
  updatedComboGridText: string;
  comboGridCards?: ResolvedImageUrls['comboGridCards'];
  imageStatus: 'generated' | 'partial' | 'failed';
  gridErrors?: Partial<Record<'office' | 'evening' | 'relaxed', string>>;
  error?: string | null;
  kind?: ComboGridKind | null;
}

interface OutfitSwapDraftResult {
  candidateBlock: string;
  parsedPreview: {
    number: number;
    label: string;
    context: string;
    top: string;
    bottom: string;
    layer: string;
    footwear: string;
    accessories: string;
    fitNote: string;
    colourLogic: string;
    whyItWorks: string;
    shoppingTranslation: string;
    acceptableSubstitutes: string;
    doNotBuy: string;
  } | null;
  qaIssues: NonNullable<NonNullable<ReportData['qa']>['section4']>['issues'];
  blockingIssues: NonNullable<NonNullable<ReportData['qa']>['section4']>['issues'];
  baseUpdatedAt: string;
  currentOutfitHash: string;
}

interface OutfitSwapApplyResult {
  imageUrl: string | null;
  updatedS4Outfits: string;
  qa?: ReportData['qa'];
}

interface FaceImageRegenerationResult {
  kind: FaceImageKind;
  optionIndex: number;
  imageUrl: string;
}

interface FaceStyleSwapDraftResult {
  candidateStyle: string;
  currentStyle: string;
  baseUpdatedAt: string;
  currentStyleHash: string;
}

interface FaceStyleSwapApplyResult {
  kind: FaceImageKind;
  optionIndex: number;
  imageUrl: string | null;
  candidateStyle: string;
  updatedFace: ReportData['classification']['face'];
}

type ManualImageTarget =
  | { imageType: 'face'; faceKind: FaceImageKind }
  | { imageType: 'outfit'; outfitNumber: number }
  | { imageType: 'comboGrid'; comboGridKind: ComboGridKind };

interface ManualImageUploadOptions {
  replace?: boolean;
}

const SECTIONS = [
  { key: 's0',  label: 'Style Snapshot',       field: 's0_snapshot'       },
  { key: 's1', label: 'Face Architecture',  field: 's1_face'     },
  { key: 's2', label: 'Body Geometry',       field: 's2_body'     },
  { key: 's3', label: 'Chromatic Harmony',   field: 's3_colour'   },
  { key: 's4', label: '20 Outfits',          field: 's4_outfits'  },
  { key: 's4g', label: 'Combination Grids', field: 's4_combo_grids' },
  { key: 's5s', label: 'Shopping & Fit',    field: 's5_shopping' },
  { key: 's5g', label: 'Grooming & Skin',   field: 's5_grooming_skin' },
  { key: 's5', label: 'Style Rules',         field: 's5_rules'    },
  { key: 's6', label: 'Identity Statement',  field: 's6_identity' },
] as const;

type SectionKey = typeof SECTIONS[number]['key'];
type SectionField = typeof SECTIONS[number]['field'];

const STAGE_LABELS: Record<string, string> = {
  classifying:       'Classifying profile…',
  generating_s0:     'Writing Style Snapshot…',
  generating_s1:     'Writing Face Architecture…',
  generating_s2:     'Writing Body Geometry…',
  generating_s3:     'Writing Chromatic Harmony…',
  generating_s4:     'Writing 20 Outfits…',
  generating_s4_combo_grids: 'Writing Combination Grids…',
  generating_s5:     'Writing Combination Grids…',
  generating_s5_shopping: 'Writing Shopping & Fit System…',
  generating_s5_grooming_skin: 'Writing Grooming & Skincare…',
  generating_s6:     'Writing Identity Statement…',
  generating_images:       'Generating images…',
  repairing_section4:      'Repairing outfit text…',
  generating_base_model:   'Generating base model…',
  generating_outfit_images:'Generating outfit images…',
  finalising:              'Finalising…',
};

const SECTION_FIELD_MAP: Record<SectionKey, SectionField> = {
  s0: 's0_snapshot',
  s1: 's1_face', s2: 's2_body', s3: 's3_colour',
  s4: 's4_outfits', s4g: 's4_combo_grids', s5s: 's5_shopping',
  s5g: 's5_grooming_skin', s5: 's5_rules', s6: 's6_identity',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function allApproved(approvals: SectionApprovals): boolean {
  const keys = approvals.s0 === undefined
    ? (['s1', 's2', 's3', 's4', 's5', 's6'] as const)
    : (['s0', 's1', 's2', 's3', 's4', 's4g', 's5s', 's5g', 's6'] as const);
  return keys.every(key => approvals[key] === true);
}

function buildSafeReportData(reportData: ReportData): ReportData {
  return {
    classification: reportData.classification,
    sections: {
      s0_snapshot:  reportData.sections?.s0_snapshot  ?? '',
      s1_face:     reportData.sections?.s1_face     ?? '',
      s2_body:     reportData.sections?.s2_body     ?? '',
      s3_colour:   reportData.sections?.s3_colour   ?? '',
      s4_outfits:  reportData.sections?.s4_outfits  ?? '',
      s4_combo_grids: reportData.sections?.s4_combo_grids ?? '',
      s5_rules:    reportData.sections?.s5_rules    ?? '',
      s5_shopping: reportData.sections?.s5_shopping ?? reportData.sections?.s5_rules ?? '',
      s5_grooming_skin: reportData.sections?.s5_grooming_skin ?? '',
      s6_identity: reportData.sections?.s6_identity ?? '',
    } as ReportSections,
    generated_at: reportData.generated_at,
    qa: reportData.qa,
  };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AdminReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = use(params);
  const router = useRouter();

  const [report, setReport]               = useState<Report | null>(null);
  const [loading, setLoading]             = useState(true);
  const [activeSection, setActiveSection] = useState<SectionKey>('s1');
  const [activePageNumber, setActivePageNumber] = useState(1);
  const [viewMode, setViewMode] = useState<'page' | 'full'>('full');
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [editText, setEditText]           = useState('');
  const [saving, setSaving]               = useState(false);
  const [sending, setSending]             = useState(false);
  const [copied, setCopied]               = useState(false);
  const [error, setError]                 = useState('');
  const [terminating, setTerminating]       = useState(false);
  const [retrying, setRetrying]             = useState(false);
  const [rejecting, setRejecting]           = useState(false);
  const [confirmingReject, setConfirmingReject] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [imageGenerationPending, setImageGenerationPending] = useState(false);
  const [imageModel, setImageModel]         = useState<'gemini-3.1-flash-image-preview' | 'gemini-2.5-flash-image'>('gemini-3.1-flash-image-preview');
  const [elapsedSecs, setElapsedSecs]       = useState(0);
  const [imageProgressNow, setImageProgressNow] = useState(() => Date.now());
  const latestStatusUpdatedAtRef = useRef<string | null>(null);
  const latestImageCountSigRef = useRef<string>('');
  const autoImageRetryUpdatedAtRef = useRef<string | null>(null);

  const load = useCallback(async (options?: { fresh?: boolean; force?: boolean }) => {
    const suffix = options?.fresh ? '?fresh=1' : '';
    const res  = await fetch(`/api/man-report/${reportId}${suffix}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.report) {
      latestStatusUpdatedAtRef.current = data.report.updated_at ?? null;
      latestImageCountSigRef.current = JSON.stringify({
        hairstyleDone: data.report.image_urls?.hairstyleCards?.[0] ? 1 : 0,
        beardDone:     data.report.image_urls?.beardCards?.[0] ? 1 : 0,
        eyewearDone:   data.report.image_urls?.eyewearCards?.[0] ? 1 : 0,
        outfitDone:    (data.report.image_urls?.outfitCards    ?? []).filter(Boolean).length,
        comboGridDone: Object.values(data.report.image_urls?.comboGridCards ?? {}).filter(Boolean).length,
      });
      // Only re-render when DB actually changed — suppress polling jank
      setReport(prev => {
        if (!options?.force && prev?.updated_at === data.report.updated_at) return prev;
        return data.report;
      });
      // Auto-transition draft_ready → in_review on first open (skip if still generating)
      if (data.report.status === 'draft_ready') {
        await fetch(`/api/man-report/${reportId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_review' }),
        });
      }
    }
    setLoading(false);
  }, [reportId]);

  useEffect(() => { load(); }, [load]);

  // Poll lightweight status only while text or image generation is in flight.
  useEffect(() => {
    if (report?.status !== 'generating' && !report?.progress_stage && !imageGenerationPending) return;

    let active = true;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/man-report/status/${reportId}`, { cache: 'no-store' });
        if (!res.ok) return;

        const next = await res.json() as ReportStatusSnapshot;
        if (!active) return;

        const nextImageCountSig = JSON.stringify(next.imageCounts ?? {});
        const updatedAtChanged = next.updatedAt !== latestStatusUpdatedAtRef.current;
        const imageCountsChanged = nextImageCountSig !== latestImageCountSigRef.current;
        const changed =
          next.status !== report?.status ||
          next.progressStage !== report?.progress_stage ||
          next.errorMessage !== report?.error_message ||
          next.shareToken !== report?.share_token ||
          updatedAtChanged ||
          imageCountsChanged;

        if (!changed) return;

        const hadImageRunInFlight = imageGenerationPending || !!report?.progress_stage;
        latestStatusUpdatedAtRef.current = next.updatedAt;
        latestImageCountSigRef.current = nextImageCountSig;

        setReport(prev => prev ? {
          ...prev,
          status: next.status,
          progress_stage: next.progressStage,
          error_message: next.errorMessage,
          share_token: next.shareToken ?? prev.share_token,
        } : prev);

        const shouldUseFreshLoad = imageGenerationPending || !!next.progressStage || updatedAtChanged || imageCountsChanged;

        if (hadImageRunInFlight && !next.progressStage && next.status !== 'generating') {
          await load({ fresh: true, force: true });
          setImageGenerationPending(false);
          return;
        }

        await load({ fresh: shouldUseFreshLoad, force: updatedAtChanged || imageCountsChanged });
      } catch {
        // Ignore transient polling failures; full load remains the source of truth.
      }
    };

    void pollStatus();
    const interval = setInterval(() => { void pollStatus(); }, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [reportId, report?.status, report?.progress_stage, report?.error_message, report?.share_token, imageGenerationPending, load]);

  // Elapsed-time ticker while generating
  useEffect(() => {
    if (report?.status !== 'generating' || !report.created_at) {
      setElapsedSecs(0);
      return;
    }
    const tick = () => {
      setElapsedSecs(Math.floor((Date.now() - new Date(report.created_at).getTime()) / 1000));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [report?.status, report?.created_at]);

  // Image stale-state ticker. Polling only re-renders when the DB changes, so
  // this local clock lets stale progress surface and auto-retry without refresh.
  useEffect(() => {
    if (!report?.progress_stage || report.status === 'generating') {
      setImageProgressNow(Date.now());
      return;
    }
    const tick = () => setImageProgressNow(Date.now());
    tick();
    const t = setInterval(tick, 10_000);
    return () => clearInterval(t);
  }, [report?.progress_stage, report?.status, report?.updated_at]);

  // ── Section approval ──────────────────────────────────────────────────

  const toggleApproval = async (key: SectionKey) => {
    if (!report) return;
    const next = {
      ...report.section_approvals,
      [key]: !report.section_approvals[key],
    };
    setReport(r => r ? { ...r, section_approvals: next } : r);
    await fetch(`/api/man-report/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section_approvals: next }),
    });
  };

  const approveAll = async () => {
    if (!report) return;
    const next: SectionApprovals = {
      s0: true, s1: true, s2: true, s3: true, s4: true,
      s4g: true, s5s: true, s5g: true, s5: true, s6: true,
    };
    setReport(r => r ? { ...r, section_approvals: next } : r);
    await fetch(`/api/man-report/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section_approvals: next }),
    });
  };

  // ── Inline section edit ────────────────────────────────────────────────

  const startEdit = (key: SectionKey) => {
    if (!report?.report_data) return;
    const field = SECTION_FIELD_MAP[key];
    setEditText(report.report_data.sections?.[field] ?? '');
    setEditingSection(key);
  };

  const saveEdit = async () => {
    if (!report?.report_data || !editingSection) return;
    setSaving(true);
    if (editingSection === 's4g') {
      const result = await saveComboGridText(editText);
      setSaving(false);
      if (result) setEditingSection(null);
      return;
    }

    const field   = SECTION_FIELD_MAP[editingSection];
    const newData = {
      ...report.report_data,
      sections: { ...report.report_data.sections, [field]: editText },
    };
    const res  = await fetch(`/api/man-report/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_data: newData }),
    });
    const data = await res.json();
    if (data.report) setReport({ ...report, report_data: data.report.report_data });
    setSaving(false);
    setEditingSection(null);
  };

  // ── Send to client ─────────────────────────────────────────────────────

  const sendToClient = async () => {
    if (!report || !allApproved(report.section_approvals)) return;
    setSending(true);
    setError('');
    try {
      const res  = await fetch(`/api/man-report/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to send. Please try again.');
        return;
      }
      if (data.report) setReport(prev => prev ? { ...prev, status: 'sent', sent_at: data.report.sent_at } : prev);
    } catch {
      setError('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const copyLink = () => {
    if (!report) return;
    const url = `${window.location.origin}/man/report/${report.share_token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const logout = async () => {
    await fetch('/api/iconik-club/admin/logout', { method: 'POST' });
    window.location.href = '/man/admin/login';
  };

  const copyImagePrompt = useCallback(async (target: ManualImageTarget): Promise<string | null> => {
    const res = await fetch(`/api/man-report/${reportId}/image-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(target),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Could not build the image prompt.');
      return null;
    }
    return typeof data.prompt === 'string' ? data.prompt : null;
  }, [reportId]);

  const uploadManualImage = useCallback(async (
    target: ManualImageTarget,
    file: File,
    options?: ManualImageUploadOptions,
  ): Promise<string | null> => {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('imageType', target.imageType);
    if (options?.replace) fd.append('replace', '1');
    if (target.imageType === 'face') fd.append('faceKind', target.faceKind);
    if (target.imageType === 'outfit') fd.append('outfitNumber', String(target.outfitNumber));
    if (target.imageType === 'comboGrid') fd.append('comboGridKind', target.comboGridKind);

    const res = await fetch(`/api/man-report/${reportId}/manual-image`, {
      method: 'POST',
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Could not upload manual image.');
      return null;
    }

    const imageUrls = data.imageUrls as ResolvedImageUrls | null | undefined;
    const imageUrl = data.imageUrl as string | null | undefined;
    if (imageUrls) {
      setReport(prev => prev ? { ...prev, image_urls: imageUrls, error_message: null } : prev);
    }
    setError('');
    void load({ fresh: true, force: true });
    return imageUrl ?? null;
  }, [reportId, load]);

  // ── Outfit image regeneration ─────────────────────────────────────────
  const regenerateOutfit = useCallback(async (
    outfitNumber: number,
    newText: string,
  ): Promise<OutfitRegenerationResult | null> => {
    const res = await fetch(`/api/man-report/${reportId}/regenerate-outfit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outfitNumber, outfitText: newText, imageModel }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Could not save outfit edit.');
      return null;
    }
    const imageUrl = data.imageUrl as string | null;
    const updatedS4Outfits = data.updatedS4Outfits as string | null;
    const qa = data.qa as ReportData['qa'] | undefined;
    const imageStatus = data.imageStatus as OutfitRegenerationResult['imageStatus'] | undefined;
    const error = data.error as string | undefined;

    if (!updatedS4Outfits || !imageStatus) return null;

    setReport(prev => {
      if (!prev?.report_data) return prev;
      const existingImageUrls = prev.image_urls ?? {
        hairstyleCards: [],
        beardCards: [],
        eyewearCards: [],
        outfitCards: [],
        comboGridCards: {},
        baseModel: null,
      };
      const nextOutfitCards = [...(existingImageUrls.outfitCards ?? [])];
      while (nextOutfitCards.length < outfitNumber) nextOutfitCards.push(null);
      nextOutfitCards[outfitNumber - 1] = imageStatus === 'generated' ? imageUrl : null;

      return {
        ...prev,
        error_message: imageStatus === 'failed'
          ? `Outfit ${outfitNumber} image regeneration failed${error ? `: ${error}` : ''}`
          : null,
        image_urls: {
          ...existingImageUrls,
          outfitCards: nextOutfitCards,
        },
        report_data: {
          ...prev.report_data,
          qa: qa ?? prev.report_data.qa,
          sections: {
            ...prev.report_data.sections,
            s4_outfits: updatedS4Outfits,
          } as ReportSections,
        },
      };
    });

    return { imageUrl, updatedS4Outfits, imageStatus, error };
  }, [reportId, imageModel]);

  const saveOutfitText = useCallback(async (
    outfitNumber: number,
    newText: string,
  ): Promise<OutfitSaveTextResult | null> => {
    const res = await fetch(`/api/man-report/${reportId}/save-outfit-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outfitNumber, outfitText: newText }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Could not save outfit text.');
      return null;
    }
    const updatedS4Outfits = data.updatedS4Outfits as string;
    const qa = data.qa as ReportData['qa'] | undefined;

    if (!updatedS4Outfits) return null;

    // Update local state — text and QA only, image_urls intentionally untouched
    setReport(prev => {
      if (!prev?.report_data) return prev;
      return {
        ...prev,
        error_message: null,
        report_data: {
          ...prev.report_data,
          qa: qa ?? prev.report_data.qa,
          sections: {
            ...prev.report_data.sections,
            s4_outfits: updatedS4Outfits,
          } as ReportSections,
        },
      };
    });

    return { updatedS4Outfits };
  }, [reportId]);

  const saveComboGridText = useCallback(async (
    kindOrText: ComboGridKind | string,
    maybeText?: string,
  ): Promise<ComboGridSaveTextResult | null> => {
    const scoped = maybeText !== undefined;
    const kind = scoped ? kindOrText as ComboGridKind : null;
    const newText = scoped ? maybeText! : kindOrText;
    const res = await fetch(`/api/man-report/${reportId}/save-combo-grid-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kind ? { kind, comboGridText: newText } : { comboGridText: newText }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Could not save combination grid text.');
      return null;
    }

    const updatedComboGridText = data.updatedComboGridText as string | undefined;
    if (!updatedComboGridText) return null;

    setReport(prev => {
      if (!prev?.report_data) return prev;
      return {
        ...prev,
        report_data: {
          ...prev.report_data,
          sections: {
            ...prev.report_data.sections,
            s4_combo_grids: updatedComboGridText,
          } as ReportSections,
        },
      };
    });
    setError('');

    return { updatedComboGridText };
  }, [reportId]);

  const regenerateComboGrid = useCallback(async (
    kind: ComboGridKind,
    newText: string,
  ): Promise<ComboGridRegenerationResult | null> => {
    const res = await fetch(`/api/man-report/${reportId}/regenerate-combo-grids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, comboGridText: newText, imageModel }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Could not regenerate combination grid images.');
      return null;
    }

    const updatedComboGridText = data.updatedComboGridText as string | undefined;
    const comboGridCards = data.comboGridCards as ResolvedImageUrls['comboGridCards'] | undefined;
    const imageStatus = data.imageStatus as ComboGridRegenerationResult['imageStatus'] | undefined;
    const gridErrors = data.gridErrors as ComboGridRegenerationResult['gridErrors'] | undefined;
    const error = data.error as string | null | undefined;

    if (!updatedComboGridText || !imageStatus) return null;

    setReport(prev => {
      if (!prev?.report_data) return prev;
      const existingImageUrls = prev.image_urls ?? {
        hairstyleCards: [],
        beardCards: [],
        eyewearCards: [],
        outfitCards: [],
        comboGridCards: {},
        baseModel: null,
      };

      return {
        ...prev,
        error_message: imageStatus === 'generated' ? null : error ?? 'Combination grid image regeneration failed.',
        image_urls: {
          ...existingImageUrls,
          comboGridCards: comboGridCards ?? { office: null, evening: null, relaxed: null },
        },
        report_data: {
          ...prev.report_data,
          sections: {
            ...prev.report_data.sections,
            s4_combo_grids: updatedComboGridText,
          } as ReportSections,
        },
      };
    });

    if (imageStatus === 'generated') setError('');

    return {
      updatedComboGridText,
      comboGridCards,
      imageStatus,
      gridErrors,
      error,
    };
  }, [reportId, imageModel]);

  const draftOutfitSwap = useCallback(async (input: {
    outfitNumber: number;
    reason: string;
    notes: string;
    inspirationText: string;
    inspirationImage: File | null;
  }): Promise<OutfitSwapDraftResult | null> => {
    const fd = new FormData();
    fd.append('outfitNumber', String(input.outfitNumber));
    fd.append('reason', input.reason);
    fd.append('notes', input.notes);
    fd.append('inspirationText', input.inspirationText);
    if (input.inspirationImage) fd.append('inspirationImage', input.inspirationImage);

    const res = await fetch(`/api/man-report/${reportId}/outfit-swap/draft`, {
      method: 'POST',
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Could not draft replacement outfit.');
      return null;
    }
    return data as OutfitSwapDraftResult;
  }, [reportId]);

  const applyOutfitSwap = useCallback(async (input: {
    outfitNumber: number;
    candidateBlock: string;
    baseUpdatedAt: string;
    currentOutfitHash: string;
    reason: string;
    notes: string;
  }): Promise<OutfitSwapApplyResult | null> => {
    const res = await fetch(`/api/man-report/${reportId}/outfit-swap/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, imageModel }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Could not apply replacement outfit.');
      return null;
    }

    const imageUrl = data.imageUrl as string | null;
    const updatedS4Outfits = data.updatedS4Outfits as string | null;
    const qa = data.qa as ReportData['qa'] | undefined;
    if (!updatedS4Outfits) return null;

    setReport(prev => {
      if (!prev?.report_data) return prev;
      const existingImageUrls = prev.image_urls ?? {
        hairstyleCards: [],
        beardCards: [],
        eyewearCards: [],
        outfitCards: [],
        comboGridCards: {},
        baseModel: null,
      };
      const nextOutfitCards = [...(existingImageUrls.outfitCards ?? [])];
      while (nextOutfitCards.length < input.outfitNumber) nextOutfitCards.push(null);
      nextOutfitCards[input.outfitNumber - 1] = imageUrl;

      return {
        ...prev,
        error_message: null,
        image_urls: {
          ...existingImageUrls,
          outfitCards: nextOutfitCards,
        },
        report_data: {
          ...prev.report_data,
          qa: qa ?? prev.report_data.qa,
          sections: {
            ...prev.report_data.sections,
            s4_outfits: updatedS4Outfits,
          } as ReportSections,
        },
      };
    });

    return { imageUrl, updatedS4Outfits, qa };
  }, [reportId, imageModel]);

  const regenerateFaceImage = useCallback(async (
    kind: FaceImageKind,
    optionIndex: number,
  ): Promise<FaceImageRegenerationResult | null> => {
    const res = await fetch(`/api/man-report/${reportId}/regenerate-face-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, optionIndex, imageModel }),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const imageUrl = data.imageUrl as string | null;
    const responseKind = data.kind as FaceImageKind | null;
    const responseOptionIndex = data.optionIndex as number | null;

    if (!imageUrl || !responseKind || !responseOptionIndex) return null;

    setReport(prev => {
      if (!prev) return prev;

      const existingImageUrls = prev.image_urls ?? {
        hairstyleCards: [],
        beardCards: [],
        eyewearCards: [],
        outfitCards: [],
        comboGridCards: {},
        baseModel: null,
      };
      const nextImageUrls: ResolvedImageUrls = {
        ...existingImageUrls,
        hairstyleCards: [...(existingImageUrls.hairstyleCards ?? [])],
        beardCards: [...(existingImageUrls.beardCards ?? [])],
        eyewearCards: [...(existingImageUrls.eyewearCards ?? [])],
        outfitCards: [...(existingImageUrls.outfitCards ?? [])],
        baseModel: existingImageUrls.baseModel ?? null,
      };

      if (responseKind === 'hairstyle') {
        nextImageUrls.hairstyleCards[0] = imageUrl;
      } else if (responseKind === 'beard') {
        nextImageUrls.beardCards[0] = imageUrl;
      } else {
        nextImageUrls.eyewearCards[0] = imageUrl;
      }

      return {
        ...prev,
        image_urls: nextImageUrls,
      };
    });

    return {
      kind: responseKind,
      optionIndex: responseOptionIndex,
      imageUrl,
    };
  }, [reportId, imageModel]);

  const draftFaceStyleSwap = useCallback(async (input: {
    kind: FaceImageKind;
    optionIndex: number;
    reason: string;
    notes: string;
    replacementText: string;
    inspirationImage: File | null;
  }): Promise<FaceStyleSwapDraftResult | null> => {
    const fd = new FormData();
    fd.append('kind', input.kind);
    fd.append('optionIndex', String(input.optionIndex));
    fd.append('reason', input.reason);
    fd.append('notes', input.notes);
    fd.append('replacementText', input.replacementText);
    if (input.inspirationImage) fd.append('inspirationImage', input.inspirationImage);

    const res = await fetch(`/api/man-report/${reportId}/face-style-swap/draft`, {
      method: 'POST',
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Could not draft replacement style.');
      return null;
    }
    return data as FaceStyleSwapDraftResult;
  }, [reportId]);

  const applyFaceStyleSwap = useCallback(async (input: {
    kind: FaceImageKind;
    optionIndex: number;
    candidateStyle: string;
    baseUpdatedAt: string;
    currentStyleHash: string;
    reason: string;
    notes: string;
  }): Promise<FaceStyleSwapApplyResult | null> => {
    const res = await fetch(`/api/man-report/${reportId}/face-style-swap/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, imageModel }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Could not apply replacement style.');
      return null;
    }

    const kind = data.kind as FaceImageKind;
    const optionIndex = data.optionIndex as number;
    const imageUrl = data.imageUrl as string | null;
    const candidateStyle = data.candidateStyle as string;
    const updatedFace = data.updatedFace as ReportData['classification']['face'];

    setReport(prev => {
      if (!prev?.report_data) return prev;
      const existingImageUrls = prev.image_urls ?? {
        hairstyleCards: [],
        beardCards: [],
        eyewearCards: [],
        outfitCards: [],
        comboGridCards: {},
        baseModel: null,
      };
      const nextImageUrls: ResolvedImageUrls = {
        ...existingImageUrls,
        hairstyleCards: [...(existingImageUrls.hairstyleCards ?? [])],
        beardCards: [...(existingImageUrls.beardCards ?? [])],
        eyewearCards: [...(existingImageUrls.eyewearCards ?? [])],
        outfitCards: [...(existingImageUrls.outfitCards ?? [])],
        baseModel: existingImageUrls.baseModel ?? null,
      };

      if (kind === 'hairstyle') {
        nextImageUrls.hairstyleCards[0] = imageUrl;
      } else if (kind === 'beard') {
        nextImageUrls.beardCards[0] = imageUrl;
      } else {
        nextImageUrls.eyewearCards[0] = imageUrl;
      }

      return {
        ...prev,
        error_message: null,
        image_urls: nextImageUrls,
        report_data: {
          ...prev.report_data,
          classification: {
            ...prev.report_data.classification,
            face: updatedFace,
          },
        },
      };
    });

    return { kind, optionIndex, imageUrl, candidateStyle, updatedFace };
  }, [reportId, imageModel]);

  // Stable reference — only recomputes when report_data changes (not on approval toggles)
  const reportData = report?.report_data ?? null;
  const safeData   = useMemo(
    () => (reportData ? buildSafeReportData(reportData) : null),
    [reportData],
  );
  const slideMeta = useMemo(() => safeData ? getManReportSlideMeta(safeData) : [], [safeData]);
  const activeSlide = slideMeta.find(slide => slide.pageNumber === activePageNumber) ?? slideMeta[0] ?? null;
  const activeSlideSection = activeSlide?.sectionKey ?? activeSection;

  useEffect(() => {
    if (slideMeta.length > 0 && !slideMeta.some(slide => slide.pageNumber === activePageNumber)) {
      setActivePageNumber(slideMeta[0].pageNumber);
    }
  }, [activePageNumber, slideMeta]);

  const approvals    = report?.section_approvals ?? { s0: false, s1: false, s2: false, s3: false, s4: false, s4g: false, s5s: false, s5g: false, s5: false, s6: false };
  const ready        = allApproved(approvals);
  const isGenerating = report?.status === 'generating';
  const isError      = report?.status === 'error';
  const isStuck      = isGenerating && elapsedSecs > 600;

  // Image pipeline stale detection: progress_stage set but updated_at hasn't changed in >10 min.
  const imageProgressAgeMs = report?.progress_stage && !isGenerating && report.updated_at
    ? imageProgressNow - new Date(report.updated_at).getTime()
    : 0;
  const isImageStuck = imageProgressAgeMs > 10 * 60 * 1000;

  const expectedOutfitCount = report?.report_data?.classification?.outfit_split?.total ?? 20;
  const imageCounts = {
    hairstyleDone: report?.image_urls?.hairstyleCards?.[0] ? 1 : 0,
    beardDone:     report?.image_urls?.beardCards?.[0] ? 1 : 0,
    eyewearDone:   report?.image_urls?.eyewearCards?.[0] ? 1 : 0,
    outfitDone:    (report?.image_urls?.outfitCards    ?? []).filter(Boolean).length,
    comboGridDone: Object.values(report?.image_urls?.comboGridCards ?? {}).filter(Boolean).length,
  };
  const activeGroomingDone = imageCounts.hairstyleDone;
  const activeGroomingLabel = 'hairstyle grid';
  const hasImageAttempt = imageCounts.hairstyleDone + imageCounts.beardDone + imageCounts.eyewearDone + imageCounts.outfitDone + imageCounts.comboGridDone > 0 ||
    Boolean(report?.error_message?.startsWith('Image generation'));
  const imageButtonLabel = hasImageAttempt ? 'Retry Missing Images' : 'Generate Images';
  const imageProgressText = `${activeGroomingDone}/1 ${activeGroomingLabel} · ${imageCounts.beardDone}/1 beard grid · ${imageCounts.eyewearDone}/1 eyewear grid · ${imageCounts.outfitDone}/${expectedOutfitCount} outfits · ${imageCounts.comboGridDone}/3 grids`;
  const hasPartialText = !!report?.report_data?.classification ||
    Object.values(report?.report_data?.sections ?? {}).some(value => typeof value === 'string' && value.trim().length > 0);

  // True only when hairstyle, eyewear AND every expected outfit image are present.
  const hasAllImages = (
    activeGroomingDone >= 1 &&
    imageCounts.beardDone >= 1 &&
    imageCounts.eyewearDone >= 1 &&
    imageCounts.outfitDone >= expectedOutfitCount &&
    imageCounts.comboGridDone >= 3
  );

  // ── Reject & retry (discard current report, start fresh) ─────────────
  const handleRejectAndRetry = async () => {
    if (!report || rejecting) return;
    const submissionId = report.submission_id;
    if (!submissionId) { setError('Missing submission ID — cannot retry.'); return; }
    setRejecting(true);
    setConfirmingReject(false);
    setError('');
    try {
      await fetch(`/api/man-report/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'error', error_message: 'Rejected by admin — new report requested' }),
      });
      const res  = await fetch(`/api/man-report/generate/${report.submission_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageModel }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Retry failed'); return; }
      if (data.reportId) router.push(`/man/admin/report/${data.reportId}`);
    } catch {
      setError('Reject & retry failed. Please try again.');
    } finally {
      setRejecting(false);
    }
  };

  // ── Terminate (kill generating pipeline) ──────────────────────────────
  const handleTerminate = useCallback(async (reason = 'Manually cancelled by admin') => {
    if (!report || terminating) return;
    setTerminating(true);
    setError('');
    try {
      await fetch(`/api/man-report/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'error',
          progress_stage: null,
          error_message: reason,
        }),
      });
      await load();
    } catch {
      setError('Failed to cancel. Try again.');
    } finally {
      setTerminating(false);
    }
  }, [report, reportId, terminating, load]);

  // Auto-terminate if the pipeline has been running longer than Vercel's max (300s).
  // When the server's after() callback is killed the DB status stays 'generating'
  // forever — this effect clears it automatically without requiring user action.
  const autoTerminatedRef = useRef(false);
  useEffect(() => {
    if (autoTerminatedRef.current) return;
    if (!report || report.status !== 'generating') return;
    const ageMs = report.created_at
      ? Date.now() - new Date(report.created_at).getTime()
      : 0;
    if (ageMs < 360_000) return; // < 6 min: pipeline may still be alive
    autoTerminatedRef.current = true;
    setTerminating(true);
    fetch(`/api/man-report/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'error',
        progress_stage: null,
        error_message: 'Generation timed out — pipeline was killed by the server',
      }),
    }).then(() => load()).catch(() => {}).finally(() => setTerminating(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.status, report?.created_at]);

  // ── Retry failed text generation in-place ─────────────────────────────
  const handleRetry = async () => {
    if (!report || retrying) return;
    setRetrying(true);
    setError('');
    try {
      const res  = await fetch(`/api/man-report/${reportId}/resume-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Retry failed'); return; }
      setReport(prev => prev ? {
        ...prev,
        status: data.status === 'completed' ? 'draft_ready' : 'generating',
        progress_stage: data.progressStage ?? null,
        error_message: null,
      } : prev);
      await load({ fresh: true, force: true });
    } catch {
      setError('Retry failed. Please try again.');
    } finally {
      setRetrying(false);
    }
  };

  // ── Generate images (decoupled from text pipeline) ───────────────────
  const handleGenerateImages = useCallback(async (options?: { automatic?: boolean }) => {
    if (!report || generatingImages || isGenerating || hasAllImages || !report.report_data) return;

    setGeneratingImages(true);
    setError('');
    try {
      const res = await fetch(`/api/man-report/${reportId}/generate-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageModel }),
      });
      const data = await res.json();
      if (!res.ok) {
        const issueMessages = Array.isArray(data.issues)
          ? data.issues
              .map((issue: { message?: string }) => issue.message)
              .filter(Boolean)
              .slice(0, 4)
          : [];
        if (issueMessages.length > 0) {
          setError(`Fix Section 4 before images: ${issueMessages.join(' · ')}`);
          await load({ fresh: true, force: true });
          return;
        }
        const runningProgressStage = data.progressStage ?? data.progress_stage;
        if (runningProgressStage) {
          setImageGenerationPending(true);
          setReport(prev => prev ? {
            ...prev,
            progress_stage: runningProgressStage,
            error_message: null,
          } : prev);
          await load({ fresh: true, force: true });
          return;
        }
        setError(data.error ?? 'Failed to start image generation');
        return;
      }
      const nextProgressStage = data.progressStage ?? data.progress_stage ?? 'generating_images';
      setImageGenerationPending(true);
      setReport(prev => prev ? {
        ...prev,
        progress_stage: nextProgressStage,
        error_message: null,
      } : prev);
      await load({ fresh: true, force: true });
    } catch {
      setError(options?.automatic
        ? 'Auto-retry failed to start image generation. Use Force Restart Images to try again.'
        : 'Failed to start image generation. Please try again.');
    } finally {
      setGeneratingImages(false);
    }
  }, [report, generatingImages, isGenerating, hasAllImages, reportId, imageModel, load]);

  useEffect(() => {
    if (!report?.progress_stage || !report.report_data || isGenerating || hasAllImages || !isImageStuck || generatingImages) return;

    const retryKey = report.updated_at ?? `${report.id}:missing-updated-at`;
    if (autoImageRetryUpdatedAtRef.current === retryKey) return;

    autoImageRetryUpdatedAtRef.current = retryKey;
    void handleGenerateImages({ automatic: true });
  }, [
    report?.id,
    report?.progress_stage,
    report?.report_data,
    report?.updated_at,
    isGenerating,
    hasAllImages,
    isImageStuck,
    generatingImages,
    handleGenerateImages,
  ]);

  // ── Loading / error states ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={22} className="animate-spin" style={{ color: '#c9a96e' }} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20">
        <p style={{ color: '#6b5f4a' }}>Report not found.</p>
        <Link href="/man/admin/dashboard" className="text-sm mt-4 inline-block" style={{ color: '#c9a96e' }}>
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const elapsedLabel = (() => {
    if (elapsedSecs < 60) return `${elapsedSecs}s`;
    const m = Math.floor(elapsedSecs / 60);
    const s = elapsedSecs % 60;
    return `${m}m ${s}s`;
  })();

  const approvedCount = Object.values(approvals).filter(Boolean).length;
  const activeApproved = activeSlideSection ? Boolean(approvals[activeSlideSection as SectionKey]) : false;
  const canEditActiveSection = Boolean(activeSlideSection && report.report_data?.sections?.[SECTION_FIELD_MAP[activeSlideSection as SectionKey]] !== undefined);
  const selectedSlideTitle = viewMode === 'full'
    ? 'Full report'
    : activeSlide
      ? 'Page ' + activeSlide.pageNumber + ': ' + activeSlide.title
      : 'Report';

  return (
    <div className="min-h-screen man-admin-review" style={{ background: S.bg, color: S.ink }}>
      <aside className="fixed left-0 top-0 bottom-0 z-30 w-[310px] border-r flex flex-col" style={{ background: S.card, borderColor: S.border }}>
        <div className="px-6 py-5 border-b" style={{ borderColor: S.border }}>
          <div className="iconik-display" style={{ fontSize: '13px', letterSpacing: '0.32em', color: S.ink }}>I C O N I K</div>
          <div className="iconik-micro mt-1.5" style={{ color: S.muted }}>Men - Review</div>
        </div>
        <div className="px-4 py-3 border-b" style={{ borderColor: S.border }}>
          <Link href="/man/admin/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm luxury-body" style={{ color: S.muted }}>
            <LayoutDashboard size={15} /> Blueprints
          </Link>
        </div>
        <div className="px-5 py-4 border-b" style={{ borderColor: S.border }}>
          <Link href="/man/admin/dashboard" className="inline-flex items-center gap-2 text-sm luxury-body mb-3" style={{ color: S.muted }}>
            <ArrowLeft size={14} /> Back to dashboard
          </Link>
          <h1 className="iconik-display truncate" style={{ fontSize: '22px', color: S.ink }}>
            {report.man_intake_submissions?.customer_email || 'Client'}
          </h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <Pill tone={isError ? 'error' : report.status === 'sent' ? 'success' : isGenerating ? 'gold' : 'slate'}>
              {report.progress_stage ? (STAGE_LABELS[report.progress_stage] ?? report.progress_stage.replace(/_/g, ' ')) : report.status.replace(/_/g, ' ')}
            </Pill>
            <Pill tone={ready ? 'success' : 'muted'}>{approvedCount}/{Object.keys(approvals).length}</Pill>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="iconik-micro mb-3" style={{ color: S.muted }}>Review Queue</div>
          <div className="space-y-4">
            {(['Opening', 'Diagnosis', 'Prescription', 'Outfits', 'Closing'] as const).map(group => {
              const groupSlides = slideMeta.filter(slide => slide.group === group);
              if (groupSlides.length === 0) return null;
              return (
                <div key={group}>
                  <p className="iconik-mono mb-1.5" style={{ fontSize: '10px', color: S.muted }}>{group}</p>
                  <div className="space-y-1">
                    {groupSlides.map((slide: ManReportSlideMeta) => {
                      const active = activePageNumber === slide.pageNumber;
                      const approved = Boolean(approvals[slide.sectionKey as SectionKey]);
                      return (
                        <button
                          key={slide.pageNumber + '-' + slide.title}
                          onClick={() => {
                            setActivePageNumber(slide.pageNumber);
                            setActiveSection(slide.sectionKey as SectionKey);
                            setViewMode('page');
                          }}
                          className="w-full grid grid-cols-[1fr_auto] items-center gap-2 rounded-xl px-3 py-2.5 text-left transition"
                          style={{
                            background: active ? S.ink : 'transparent',
                            color: active ? S.bg : S.muted,
                            border: '1px solid ' + (active ? S.ink : S.border),
                          }}
                        >
                          <span className="iconik-mono truncate" style={{ fontSize: '11px' }}>{String(slide.pageNumber).padStart(2, '0')} - {slide.title}</span>
                          <span className="rounded-full px-2 py-0.5 iconik-micro" style={{ background: approved ? S.success + '18' : S.bg, color: approved ? S.success : S.muted }}>
                            {approved ? 'OK' : 'Open'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border p-4 space-y-2" style={{ background: S.bg, borderColor: S.border }}>
            <div className="iconik-micro" style={{ color: S.muted }}>Images</div>
            <div className="flex items-center justify-between gap-3"><span className="iconik-mono" style={{ fontSize: '10px', color: S.muted }}>Hairstyle</span><Pill tone={imageCounts.hairstyleDone >= 1 ? 'success' : 'gold'}>{imageCounts.hairstyleDone}/1</Pill></div>
            <div className="flex items-center justify-between gap-3"><span className="iconik-mono" style={{ fontSize: '10px', color: S.muted }}>Beard</span><Pill tone={imageCounts.beardDone >= 1 ? 'success' : 'gold'}>{imageCounts.beardDone}/1</Pill></div>
            <div className="flex items-center justify-between gap-3"><span className="iconik-mono" style={{ fontSize: '10px', color: S.muted }}>Eyewear</span><Pill tone={imageCounts.eyewearDone >= 1 ? 'success' : 'gold'}>{imageCounts.eyewearDone}/1</Pill></div>
            <div className="flex items-center justify-between gap-3"><span className="iconik-mono" style={{ fontSize: '10px', color: S.muted }}>Outfits</span><Pill tone={imageCounts.outfitDone >= expectedOutfitCount ? 'success' : 'gold'}>{imageCounts.outfitDone}/{expectedOutfitCount}</Pill></div>
            <div className="flex items-center justify-between gap-3"><span className="iconik-mono" style={{ fontSize: '10px', color: S.muted }}>Grids</span><Pill tone={imageCounts.comboGridDone >= 3 ? 'success' : 'gold'}>{imageCounts.comboGridDone}/3</Pill></div>
          </div>
        </div>
        <div className="px-4 py-4 border-t" style={{ borderColor: S.border }}>
          <button onClick={logout} className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm luxury-body" style={{ color: S.muted }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <main className="min-h-screen pl-[310px]">
        <header className="sticky top-0 z-20 border-b px-8 py-4 backdrop-blur" style={{ background: 'rgba(244,239,229,0.92)', borderColor: S.border }}>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <div className="iconik-micro mb-1" style={{ color: S.muted }}>Men Blueprint Report</div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="luxury-body text-lg" style={{ color: S.ink, fontWeight: 500 }}>{selectedSlideTitle}</h2>
                <Pill tone={hasAllImages ? 'success' : 'gold'}>Images {imageCounts.hairstyleDone + imageCounts.beardDone + imageCounts.eyewearDone + imageCounts.outfitDone + imageCounts.comboGridDone}/{expectedOutfitCount + 6}</Pill>
                {isGenerating && <Pill tone={isStuck ? 'error' : 'gold'}>{isStuck ? 'Stuck ' + elapsedLabel : 'Live ' + elapsedLabel}</Pill>}
              </div>
              {report.error_message && <p className="luxury-body text-sm mt-2" style={{ color: S.error }}>{report.error_message}</p>}
              {error && <p className="luxury-body text-sm mt-2" style={{ color: S.error }}>{error}</p>}
              {!isGenerating && report.progress_stage && <p className="luxury-body text-xs mt-2" style={{ color: isImageStuck ? S.gold : S.muted }}>{STAGE_LABELS[report.progress_stage] ?? report.progress_stage.replace(/_/g, ' ')} · {imageProgressText}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(isError || ['draft_ready', 'in_review', 'approved'].includes(report.status)) && (
                <select value={imageModel} onChange={event => setImageModel(event.target.value as typeof imageModel)} className="rounded-xl px-3 py-2 text-sm luxury-body outline-none" style={{ background: S.card, color: S.ink, border: '1px solid ' + S.border }}>
                  <option value="gemini-3.1-flash-image-preview">3.1 Preview</option>
                  <option value="gemini-2.5-flash-image">2.5 Flash</option>
                </select>
              )}
              <ActionButton onClick={() => setViewMode(viewMode === 'full' ? 'page' : 'full')} tone={viewMode === 'full' ? 'primary' : 'neutral'}>{viewMode === 'full' ? 'Page View' : 'Full Report'}</ActionButton>
              {!isGenerating && report.report_data && !hasAllImages && !report.progress_stage && <ActionButton onClick={() => { void handleGenerateImages(); }} disabled={generatingImages}>{generatingImages ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />} {imageButtonLabel}</ActionButton>}
              {isError && <ActionButton onClick={handleRetry} disabled={retrying} tone="primary">{retrying ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} {hasPartialText ? 'Resume' : 'Retry'}</ActionButton>}
              {isStuck && <ActionButton onClick={() => handleTerminate()} disabled={terminating} tone="danger">{terminating ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />} Cancel</ActionButton>}
              {isImageStuck && !isGenerating && <ActionButton onClick={() => { void handleGenerateImages(); }} disabled={generatingImages} tone="primary">{generatingImages ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Restart Images</ActionButton>}
              <ActionButton onClick={copyLink}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Link'}</ActionButton>
            </div>
          </div>
        </header>

        <div className="px-8 py-8 pb-28">
          {!safeData ? (
            <div className="p-10 luxury-body" style={{ color: S.muted }}>{report.status === 'generating' ? (STAGE_LABELS[report.progress_stage ?? ''] ?? 'Generating...') : 'No report data yet.'}</div>
          ) : (
            <div className="mx-auto max-w-[1120px] rounded-2xl overflow-hidden" style={{ background: S.ink }}>
              <ManReport
                data={safeData}
                imageUrls={report.image_urls}
                viewerMode="admin"
                motionMode="reduced"
                deferSections={viewMode === 'full'}
                focusPageNumber={viewMode === 'page' ? activePageNumber : undefined}
                onRegenerateFaceImage={regenerateFaceImage}
                onDraftFaceStyleSwap={draftFaceStyleSwap}
                onApplyFaceStyleSwap={applyFaceStyleSwap}
                onRegenerateOutfit={regenerateOutfit}
                onSaveOutfitText={saveOutfitText}
                onSaveComboGridText={saveComboGridText}
                onRegenerateComboGrid={regenerateComboGrid}
                onDraftOutfitSwap={draftOutfitSwap}
                onApplyOutfitSwap={applyOutfitSwap}
                onRetryMissingImages={handleGenerateImages}
                onCopyImagePrompt={copyImagePrompt}
                onUploadManualImage={uploadManualImage}
              />
            </div>
          )}
        </div>
      </main>

      {safeData && (
        <footer className="fixed bottom-0 left-[310px] right-0 z-30 border-t px-8 py-3 backdrop-blur" style={{ background: 'rgba(244,239,229,0.96)', borderColor: S.border, paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={activeApproved ? 'success' : 'gold'}>{activeSlide ? 'Page ' + activeSlide.pageNumber : 'Page'} {activeApproved ? 'approved' : 'open'}</Pill>
              <span className="luxury-body text-xs" style={{ color: S.muted }}>{activeSlide ? activeSlide.title + ' maps to ' + activeSlide.sectionKey.toUpperCase() + ' approval.' : 'Select a report page to review.'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={() => activeSlideSection && startEdit(activeSlideSection as SectionKey)} disabled={!canEditActiveSection || isGenerating}>Edit Section Text</ActionButton>
              <ActionButton onClick={() => activeSlideSection && toggleApproval(activeSlideSection as SectionKey)} disabled={!activeSlideSection || isGenerating} tone="success"><Check size={14} /> {activeApproved ? 'Unapprove' : 'Approve'}</ActionButton>
              <ActionButton onClick={approveAll} disabled={isGenerating} tone="success"><CheckCheck size={14} /> Approve All</ActionButton>
              {['draft_ready', 'in_review', 'approved'].includes(report.status) && (confirmingReject ? (<><ActionButton onClick={() => setConfirmingReject(false)}>Cancel Reject</ActionButton><ActionButton onClick={handleRejectAndRetry} disabled={rejecting} tone="danger">{rejecting ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Confirm Retry</ActionButton></>) : (<ActionButton onClick={() => setConfirmingReject(true)} tone="danger"><RotateCcw size={14} /> Reject & Retry</ActionButton>))}
              <ActionButton onClick={sendToClient} disabled={!ready || sending || isGenerating} tone="primary">{sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send</ActionButton>
            </div>
          </div>
        </footer>
      )}

      <style jsx global>{`
        @media (max-width: 1000px) {
          .man-admin-review aside.fixed { position: relative; width: 100%; height: auto; }
          .man-admin-review main.min-h-screen { padding-left: 0; }
          .man-admin-review footer.fixed { left: 0; }
        }
        @media (max-width: 640px) {
          .man-admin-review header.sticky,
          .man-admin-review main > div,
          .man-admin-review footer.fixed { padding-left: 1rem; padding-right: 1rem; }
        }
      `}</style>

      {/* ── Inline section editor modal ───────────────────────────────────── */}
      <AnimatePresence>
      {editingSection && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="rounded-2xl border w-full max-w-2xl mx-4 flex flex-col"
            style={{ background: '#111111', borderColor: '#2a2a2a', maxHeight: '80vh' }}
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1e1e1e' }}>
              <p className="text-sm font-medium" style={{ color: '#f0ebe0' }}>
                Edit — {SECTIONS.find(s => s.key === editingSection)?.label}
              </p>
              <button onClick={() => setEditingSection(null)} style={{ color: '#6b5f4a' }}>
                <X size={16} />
              </button>
            </div>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="flex-1 p-5 text-sm font-light outline-none resize-none min-h-[400px]"
              style={{ background: '#111111', color: '#c8bfae', lineHeight: 1.7 }}
            />
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t" style={{ borderColor: '#1e1e1e' }}>
              <button
                onClick={() => setEditingSection(null)}
                className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-70"
                style={{ color: '#6b5f4a' }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-opacity disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #8a6820 100%)', color: '#fff' }}
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
