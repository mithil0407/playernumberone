'use client';

import { useEffect, useState, use, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Send, Loader2, Copy, CheckCheck, AlertCircle, Pencil, X, Zap, Ban, RotateCcw, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPRING } from '@/lib/reportAnimations';
import ManReport from '@/components/ManReport';
import type { ReportData, ReportSections } from '@/lib/manReportGenerator';
import type { ResolvedImageUrls, FaceImageKind } from '@/lib/manImageGenerator';

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
  imageStatus: 'generated' | 'failed';
  error?: string;
}

interface OutfitSaveTextResult {
  updatedS4Outfits: string;
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
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [editText, setEditText]           = useState('');
  const [saving, setSaving]               = useState(false);
  const [sending, setSending]             = useState(false);
  const [copied, setCopied]               = useState(false);
  const [showLinkPreview, setShowLinkPreview] = useState(false);
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
    newText: string,
  ): Promise<ComboGridSaveTextResult | null> => {
    const res = await fetch(`/api/man-report/${reportId}/save-combo-grid-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comboGridText: newText }),
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

  const regenerateComboGrids = useCallback(async (
    newText: string,
  ): Promise<ComboGridRegenerationResult | null> => {
    const res = await fetch(`/api/man-report/${reportId}/regenerate-combo-grids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comboGridText: newText, imageModel }),
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
  const section4Qa = report?.report_data?.qa?.section4 ?? null;
  const section4Issues = section4Qa?.issues ?? [];
  const section4ErrorCount = section4Issues.filter(issue => issue.severity === 'error').length;
  const section4WarningCount = section4Issues.length - section4ErrorCount;
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

  return (
    <div className="flex gap-0 h-[calc(100vh-4rem)] -m-5 lg:-m-8 overflow-hidden">
      {/* ── Left: Report Preview ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto flex flex-col report-scroll" style={{ background: '#f5f5f5' }}>
        {/* Stuck banner */}
        {isStuck && (
          <div className="flex items-center justify-between gap-4 px-5 py-3 flex-shrink-0"
            style={{ background: '#1a0f00', borderBottom: '1px solid #3a2000' }}>
            <div className="flex items-center gap-2">
              <AlertCircle size={14} style={{ color: '#fb923c' }} />
              <span className="text-xs font-medium" style={{ color: '#fb923c' }}>
                Generation has been running for {elapsedLabel} — it may be stuck.
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleTerminate()}
                disabled={terminating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: '#2a0e0e', color: '#f87171', border: '1px solid #3a1010' }}
              >
                {terminating ? <Loader2 size={11} className="animate-spin" /> : <Ban size={11} />}
                Cancel
              </button>
              <button
                onClick={async () => { await handleTerminate(); await handleRetry(); }}
                disabled={terminating || retrying}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #8a6820 100%)', color: '#fff' }}
              >
                {(terminating || retrying) ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                Force Restart
              </button>
            </div>
          </div>
        )}

        {safeData ? (
          <ManReport
            data={safeData}
            imageUrls={report.image_urls}
            viewerMode="admin"
            motionMode="reduced"
            deferSections
            onRegenerateFaceImage={regenerateFaceImage}
            onDraftFaceStyleSwap={draftFaceStyleSwap}
            onApplyFaceStyleSwap={applyFaceStyleSwap}
            onRegenerateOutfit={regenerateOutfit}
            onSaveOutfitText={saveOutfitText}
            onSaveComboGridText={saveComboGridText}
            onRegenerateComboGrids={regenerateComboGrids}
            onDraftOutfitSwap={draftOutfitSwap}
            onApplyOutfitSwap={applyOutfitSwap}
            onRetryMissingImages={handleGenerateImages}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 size={22} className="animate-spin" style={{ color: '#c9a96e' }} />
            <p className="text-xs" style={{ color: '#6b5f4a' }}>
              {STAGE_LABELS[report.progress_stage ?? ''] ?? 'Generating…'}
            </p>
          </div>
        )}
      </div>

      {/* ── Right: Edit Panel ────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 flex flex-col border-l overflow-hidden" style={{ background: '#0f0f0f', borderColor: '#1e1e1e' }}>

        {/* Panel header */}
        <div className="px-4 py-4 border-b" style={{ borderColor: '#1e1e1e' }}>
          <Link
            href="/man/admin/dashboard"
            className="flex items-center gap-1.5 text-xs mb-3 transition-opacity hover:opacity-70"
            style={{ color: '#6b5f4a' }}
          >
            <ArrowLeft size={12} /> Dashboard
          </Link>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#c9a96e' }}>Review Panel</p>
          <p className="text-xs mt-0.5 truncate" style={{ color: '#6b5f4a' }}>
            {report.man_intake_submissions?.customer_email ?? reportId}
          </p>
          {isGenerating && (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: isStuck ? '#fb923c' : '#c9a96e' }} />
                <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: isStuck ? '#fb923c' : '#c9a96e' }}>
                  {isStuck ? `STUCK · ${elapsedLabel}` : `LIVE · ${elapsedLabel}`}
                </span>
              </div>
              <p className="text-[9px]" style={{ color: '#6b5f4a' }}>
                {STAGE_LABELS[report.progress_stage ?? ''] ?? 'Generating…'}
              </p>
              <button
                onClick={() => handleTerminate()}
                disabled={terminating}
                className="flex items-center gap-1 text-[9px] font-medium px-2 py-1 rounded-md transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: '#2a0e0e', color: '#f87171', border: '1px solid #3a1010' }}
              >
                {terminating ? <Loader2 size={9} className="animate-spin" /> : <Ban size={9} />}
                {terminating ? 'Cancelling…' : 'Cancel Generation'}
              </button>
            </div>
          )}
        </div>

        {/* Section tabs + approvals */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {SECTIONS.map(({ key, label, field }) => {
            const approved   = approvals[key];
            const active     = activeSection === key;
            const hasContent = !!report.report_data?.sections?.[field];
            const sectionIssues = key === 's4' ? section4Issues.length : 0;

            return (
              <div
                key={key}
                className="group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer"
                onClick={() => setActiveSection(key)}
              >
                {/* Sliding active highlight */}
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: '#1e1a14', border: '1px solid #2a2010' }}
                    transition={SPRING}
                  />
                )}

                {/* Approve toggle / skeleton circle */}
                <div className="relative z-10 flex-shrink-0">
                  {hasContent ? (
                    <motion.button
                      onClick={e => { e.stopPropagation(); toggleApproval(key); }}
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{
                        background: approved ? '#16a34a' : '#1e1e1e',
                        border: `1px solid ${approved ? '#16a34a' : '#2a2a2a'}`,
                      }}
                      title={approved ? 'Approved — click to un-approve' : 'Click to approve'}
                      whileHover={{ scale: 1.18 }}
                      whileTap={{ scale: 0.88 }}
                      transition={SPRING}
                    >
                      <AnimatePresence>
                        {approved && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          >
                            <Check size={10} className="text-white" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full animate-pulse"
                      style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
                    />
                  )}
                </div>

                <span className="relative z-10 flex-1 text-xs font-medium" style={{ color: hasContent ? (active ? '#c9a96e' : '#6b5f4a') : '#3a3028' }}>
                  {label}
                </span>
                {sectionIssues > 0 && (
                  <span
                    className="relative z-10 text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color: section4ErrorCount ? '#f87171' : '#fb923c',
                      background: section4ErrorCount ? '#2a0e0e' : '#2a1900',
                      border: `1px solid ${section4ErrorCount ? '#3a1010' : '#3a2000'}`,
                    }}
                  >
                    {sectionIssues}
                  </span>
                )}

                {/* Edit button — only when content exists */}
                {hasContent && (
                  <motion.button
                    onClick={e => { e.stopPropagation(); startEdit(key); }}
                    className="relative z-10 p-1 rounded opacity-0 group-hover:opacity-100"
                    style={{ color: '#6b5f4a' }}
                    title="Edit section text"
                    whileHover={{ scale: 1.15, opacity: 1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={SPRING}
                  >
                    <Pencil size={11} />
                  </motion.button>
                )}
              </div>
            );
          })}

          {/* Approve all — disabled while generating */}
          {activeSection === 's4' && section4Issues.length > 0 && (
            <div className="mt-3 rounded-lg p-2.5 space-y-2" style={{ background: '#130f08', border: '1px solid #2a2010' }}>
              <div className="flex items-center gap-1.5">
                <AlertCircle size={12} style={{ color: section4ErrorCount ? '#f87171' : '#fb923c' }} />
                <p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: section4ErrorCount ? '#f87171' : '#fb923c' }}>
                  Section 4 QA · {section4ErrorCount} errors · {section4WarningCount} warnings
                </p>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {section4Issues.slice(0, 8).map((qaIssue, index) => (
                  <p key={`${qaIssue.code}-${index}`} className="text-[10px] leading-snug" style={{ color: qaIssue.severity === 'error' ? '#fca5a5' : '#c8a56a' }}>
                    {qaIssue.message}
                  </p>
                ))}
                {section4Issues.length > 8 && (
                  <p className="text-[10px]" style={{ color: '#6b5f4a' }}>
                    +{section4Issues.length - 8} more issues
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Approve all — disabled while generating */}
          {!isGenerating && (
            <motion.button
              onClick={approveAll}
              className="w-full mt-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: '#1e1a14', color: '#c9a96e', border: '1px solid #2a2010' }}
              whileHover={{ scale: 1.02, opacity: 0.9 }}
              whileTap={{ scale: 0.98 }}
              transition={SPRING}
            >
              Approve All Sections
            </motion.button>
          )}
        </div>

        {/* Send controls */}
        <div className="px-3 py-4 border-t space-y-2" style={{ borderColor: '#1e1e1e' }}>
          {/* Image model toggle — shown whenever retry/reject actions are available */}
          {(isError || ['draft_ready', 'in_review', 'approved'].includes(report.status)) && (
            <div className="rounded-lg p-2 space-y-1.5" style={{ background: '#0d0d0d', border: '1px solid #1e1e1e' }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: '#4a4030' }}>Image Model</p>
              <div className="flex gap-1">
                {(['gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setImageModel(m)}
                    className="flex-1 py-1 rounded text-[9px] font-medium transition-all"
                    style={{
                      background: imageModel === m ? '#2a2010' : 'transparent',
                      color: imageModel === m ? '#c9a96e' : '#4a4030',
                      border: `1px solid ${imageModel === m ? '#3a3010' : '#1e1e1e'}`,
                    }}
                  >
                    {m === 'gemini-3.1-flash-image-preview' ? '3.1 Preview' : '2.5 Flash'}
                  </button>
                ))}
              </div>
            </div>
          )}
          {report.status === 'sent' ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCheck size={14} className="text-green-400" />
                <span className="text-xs text-green-400 font-medium">Sent to client</span>
              </div>
              {report.share_token && (
                <div className="rounded-lg p-2.5 space-y-2" style={{ background: '#0d0d0d', border: '1px solid #2a2a2a' }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: '#4a4030' }}>Client Link</p>
                  <p className="text-[10px] break-all leading-relaxed" style={{ color: '#c8bfae' }}>
                    {`${window.location.origin}/man/report/${report.share_token}`}
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={copyLink}
                      className="flex-1 py-1.5 rounded-md text-[10px] font-medium flex items-center justify-center gap-1.5 transition-opacity hover:opacity-80"
                      style={{ background: '#1e1e1e', color: '#c8bfae', border: '1px solid #2a2a2a' }}
                    >
                      {copied ? <CheckCheck size={11} /> : <Copy size={11} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <a
                      href={`/man/report/${report.share_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 rounded-md text-[10px] font-medium flex items-center justify-center gap-1.5 transition-opacity hover:opacity-80"
                      style={{ background: '#1e1a14', color: '#c9a96e', border: '1px solid #2a2010' }}
                    >
                      Open
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : isError ? (
            <>
              <div className="flex items-center gap-2 px-2 py-2 rounded-lg mb-1" style={{ background: '#1a0a0a', border: '1px solid #3a1010' }}>
                <AlertCircle size={12} style={{ color: '#f87171', flexShrink: 0 }} />
                <p className="text-[10px] leading-tight" style={{ color: '#f87171' }}>
                  {report.error_message ?? 'Generation failed'}
                </p>
              </div>
              <motion.button
                onClick={handleRetry}
                disabled={retrying}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #8a6820 100%)', color: '#fff' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={SPRING}
              >
                {retrying ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                {retrying ? 'Starting…' : (hasPartialText ? 'Resume Generation' : 'Retry Generation')}
              </motion.button>
            </>
          ) : (
            <>
              {!ready && !isGenerating && (
                <p className="text-[10px] text-center" style={{ color: '#4a4030' }}>
                  Approve all {Object.values(approvals).filter(Boolean).length}/6 sections to send
                </p>
              )}
              {isGenerating && (
                <p className="text-[10px] text-center" style={{ color: '#4a4030' }}>
                  Generation in progress — approve sections as they appear
                </p>
              )}
              <motion.button
                onClick={sendToClient}
                disabled={!ready || sending || isGenerating}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: ready && !isGenerating ? 'linear-gradient(135deg, #c9a96e 0%, #8a6820 100%)' : '#1e1e1e', color: '#fff' }}
                whileHover={ready && !isGenerating ? { scale: 1.02 } : undefined}
                whileTap={ready && !isGenerating ? { scale: 0.98 } : undefined}
                transition={SPRING}
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? 'Sending…' : 'Send to Client'}
              </motion.button>
              {/* Image error — shown when image generation failed */}
              {!isGenerating && !report.progress_stage && !hasAllImages && report.error_message?.startsWith('Image generation failed') && (
                <div className="flex items-center gap-2 px-2 py-2 rounded-lg" style={{ background: '#1a0a0a', border: '1px solid #3a1010' }}>
                  <AlertCircle size={12} style={{ color: '#f87171', flexShrink: 0 }} />
                  <p className="text-[10px] leading-tight" style={{ color: '#f87171' }}>
                    {report.error_message}
                  </p>
                </div>
              )}
              {/* Generate images — shown when text is ready but images are missing or partial */}
              {!isGenerating && report.report_data && !hasAllImages && !report.progress_stage && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-center" style={{ color: '#6b5f4a' }}>
                    {imageProgressText}
                  </p>
                  <motion.button
                    onClick={() => { void handleGenerateImages(); }}
                    disabled={generatingImages}
                    className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-40"
                    style={{ background: '#1e1a14', color: '#c9a96e', border: '1px solid #2a2010' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={SPRING}
                  >
                    {generatingImages ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                    {generatingImages ? 'Starting…' : imageButtonLabel}
                  </motion.button>
                </div>
              )}
              {/* Images in progress */}
              {report.progress_stage && !isGenerating && (
                <div className="rounded-lg p-2.5 space-y-2" style={{ background: '#0d0d0d', border: `1px solid ${isImageStuck ? '#3a2000' : '#1e1e1e'}` }}>
                  <div className="flex items-center gap-2">
                    {isImageStuck
                      ? <AlertCircle size={11} className="flex-shrink-0" style={{ color: '#fb923c' }} />
                      : <Loader2 size={11} className="animate-spin flex-shrink-0" style={{ color: '#c9a96e' }} />
                    }
                    <span className="text-[10px]" style={{ color: isImageStuck ? '#fb923c' : '#6b5f4a' }}>
                      {isImageStuck
                        ? generatingImages
                          ? 'Stuck — auto-retrying missing images…'
                          : `Stuck — auto-retry will restart missing images (${Math.round(imageProgressAgeMs / 60000)}m stale)`
                        : (STAGE_LABELS[report.progress_stage] ?? 'Generating images…')
                      }
                    </span>
                  </div>
                  <p className="text-[10px]" style={{ color: '#6b5f4a' }}>
                    {imageProgressText}
                  </p>
                  {isImageStuck && (
                    <button
                      onClick={() => { void handleGenerateImages(); }}
                      disabled={generatingImages}
                      className="w-full py-1.5 rounded-md text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-opacity hover:opacity-80 disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #8a6820 100%)', color: '#fff' }}
                    >
                      {generatingImages ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />}
                      {generatingImages ? 'Restarting…' : 'Force Restart Images'}
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={() => setShowLinkPreview(v => !v)}
                className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
                style={{ background: '#1e1e1e', color: '#6b5f4a', border: '1px solid #2a2a2a' }}
              >
                <Copy size={12} /> Preview Link
              </button>
              {showLinkPreview && report.share_token && (
                <div className="rounded-lg p-2.5 space-y-2" style={{ background: '#0d0d0d', border: '1px solid #2a2a2a' }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: '#4a4030' }}>Client Link</p>
                  <p className="text-[10px] break-all leading-relaxed" style={{ color: '#c8bfae' }}>
                    {`${window.location.origin}/man/report/${report.share_token}`}
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={copyLink}
                      className="flex-1 py-1.5 rounded-md text-[10px] font-medium flex items-center justify-center gap-1.5 transition-opacity hover:opacity-80"
                      style={{ background: '#1e1e1e', color: '#c8bfae', border: '1px solid #2a2a2a' }}
                    >
                      {copied ? <CheckCheck size={11} /> : <Copy size={11} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <a
                      href={`/man/report/${report.share_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 rounded-md text-[10px] font-medium flex items-center justify-center gap-1.5 transition-opacity hover:opacity-80"
                      style={{ background: '#1e1a14', color: '#c9a96e', border: '1px solid #2a2010' }}
                    >
                      Open
                    </a>
                  </div>
                </div>
              )}
              {['draft_ready', 'in_review', 'approved'].includes(report.status) && (
                confirmingReject ? (
                  <div className="rounded-lg p-2.5 space-y-2" style={{ background: '#1a0a0a', border: '1px solid #3a1010' }}>
                    <p className="text-[10px] text-center" style={{ color: '#f87171' }}>Reject this report and generate a new one?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmingReject(false)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                        style={{ background: '#1e1e1e', color: '#6b5f4a', border: '1px solid #2a2a2a' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRejectAndRetry}
                        disabled={rejecting}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-opacity hover:opacity-80 disabled:opacity-40"
                        style={{ background: '#7f1d1d', color: '#fca5a5' }}
                      >
                        {rejecting ? <Loader2 size={11} className="animate-spin" /> : null}
                        {rejecting ? 'Rejecting…' : 'Confirm'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingReject(true)}
                    className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
                    style={{ background: '#1a0a0a', color: '#f87171', border: '1px solid #3a1010' }}
                  >
                    <RotateCcw size={12} /> Reject & Retry
                  </button>
                )
              )}
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs rounded-lg p-2" style={{ color: '#f87171', background: '#1a0a0a' }}>
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>
      </div>

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
