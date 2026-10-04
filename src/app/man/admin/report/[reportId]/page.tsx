'use client';

import { useEffect, useState, use, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Ban, Check, CheckCheck, ChevronDown, ChevronUp, Copy, ExternalLink, ImageIcon, Loader2, Pencil, Printer, RotateCcw, Send, ShoppingBag, Trash2, Undo2, Zap } from 'lucide-react';
import ManReport, { getManReportSlideMeta, type ManReportSlideMeta, type ShoppingSelectPayload } from '@/components/ManReport';
import { Avatar, Button, OverflowMenu, Pill, Segmented, Sheet, clientDisplayName, reportStatusMeta } from '@/components/manAdmin/ui';
import type { ReportData, ReportSections } from '@/lib/manReportGenerator';
import type { ResolvedImageUrls, FaceImageKind, ManV2ImageTarget } from '@/lib/manImageGenerator';
import type { ComboGridKind } from '@/lib/manComboGridSection';
import {
  collectGarmentSlots,
  diffStaleSlotKeys,
  isShoppingFetchInFlight,
  isShoppingSlotCurrent,
  type ManShoppingSlotName,
  type ManShoppingState,
} from '@/lib/manShopping';

// ── Types ──────────────────────────────────────────────────────────────────

interface SectionApprovals {
  [key: string]: boolean | undefined;
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
  shopping_data: ManShoppingState | null;
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
    diagnosticDone?: number;
    deliverableDone?: number;
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

interface RedoAllOutfitsResult {
  updatedS4Outfits: string;
  updatedComboGridText: string;
  qa?: ReportData['qa'];
  status?: string;
  updatedAt?: string;
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

function buildSafeReportData(reportData: ReportData): ReportData {
  return {
    report_version: reportData.report_version,
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
    diagnostics: reportData.diagnostics,
    deliverables: reportData.deliverables,
    generated_at: reportData.generated_at,
    qa: reportData.qa,
  };
}

function approvalKeyForPage(pageNumber: number) {
  return `p${pageNumber}`;
}

function approvalKeyForSlide(slide: ManReportSlideMeta) {
  return slide.approvalKey;
}

function pageApproved(approvals: SectionApprovals, slide: ManReportSlideMeta | null | undefined): boolean {
  if (!slide) return false;
  const stableKey = approvalKeyForSlide(slide);
  if (approvals[stableKey] !== undefined) return Boolean(approvals[stableKey]);
  const legacyPageKey = approvalKeyForPage(slide.legacyPageNumber);
  if (approvals[legacyPageKey] !== undefined) return Boolean(approvals[legacyPageKey]);
  return Boolean(approvals[slide.sectionKey]);
}

function allPagesApproved(approvals: SectionApprovals, slides: ManReportSlideMeta[]): boolean {
  return slides.length > 0 && slides.every(slide => pageApproved(approvals, slide));
}

function countApprovedPages(approvals: SectionApprovals, slides: ManReportSlideMeta[]): number {
  return slides.filter(slide => pageApproved(approvals, slide)).length;
}

// Approvals are stored per page (p{n} keys), but the server fires the shopping
// links pipeline off the aggregate s4 flag — keep it derived: s4 is true only
// while every outfit slide is approved.
function withOutfitSectionFlag(next: SectionApprovals, slides: ManReportSlideMeta[]): SectionApprovals {
  const outfitSlides = slides.filter(slide => slide.slideType === 'outfit' || slide.slideType === 'outfit_system');
  if (outfitSlides.length === 0) return next;
  return { ...next, s4: outfitSlides.every(slide => pageApproved(next, slide)) };
}

/** "Outfit 02: OFFICE / FORMAL" → "Outfit 2 · Office / Formal" */
function sidebarTitle(title: string): string {
  const outfit = title.match(/^Outfit (\d+):\s*(.+)$/);
  if (!outfit) return title;
  const context = outfit[2].toLowerCase().replace(/(^|[\s/])(\w)/g, (_, lead: string, char: string) => lead + char.toUpperCase());
  return `Outfit ${Number(outfit[1])} · ${context}`;
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
  const [redoingOutfits, setRedoingOutfits] = useState(false);
  const [rejecting, setRejecting]           = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [imageGenerationPending, setImageGenerationPending] = useState(false);
  // Only used when Gemini is the fallback; Man generation runs on ChatGPT via Codex locally.
  const imageModel = 'gemini-3.1-flash-image-preview';
  const [issuesOpen, setIssuesOpen]         = useState(false);
  const [confirmAction, setConfirmAction]   = useState<'redo' | 'reject' | null>(null);
  const [aiEngine, setAiEngine]             = useState<{ engine: 'codex' | 'gemini'; note: string | null } | null>(null);
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
        diagnosticDone: Object.values(data.report.image_urls?.diagnostic ?? {}).filter(Boolean).length,
        deliverableDone: [
          data.report.image_urls?.deliverables?.beforeImage,
          data.report.image_urls?.deliverables?.afterImage,
          data.report.image_urls?.deliverables?.linkedinHeadshot,
          ...(data.report.image_urls?.deliverables?.datingProfileShots ?? []),
        ].filter(Boolean).length,
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

  useEffect(() => {
    fetch('/api/man-report/ai-engine', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (data?.engine) setAiEngine(data); })
      .catch(() => {});
  }, []);

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

  // ── Shopping links (Apify product links per garment) ─────────────────

  const shoppingSummary = useMemo(() => {
    const s4Text = report?.report_data?.sections?.s4_outfits ?? '';
    if (!s4Text.trim()) return null;
    const state = report?.shopping_data ?? null;
    const garments = collectGarmentSlots(s4Text);
    let doneCount = 0;
    let flaggedCount = 0;
    for (const garment of garments) {
      const slot = state?.slots?.[garment.key];
      if (!isShoppingSlotCurrent(slot, garment.hash)) continue;
      if (slot!.status === 'low_confidence') flaggedCount += 1;
      else doneCount += 1;
    }
    return {
      total: garments.length,
      doneCount,
      flaggedCount,
      staleCount: diffStaleSlotKeys(state, s4Text).length,
      inFlight: isShoppingFetchInFlight(state),
      hasState: !!state,
      error: state?.status === 'error' ? (state.error ?? 'Link fetch failed') : null,
    };
  }, [report?.report_data, report?.shopping_data]);

  const selectShoppingLink = useCallback(async (
    outfitNumber: number,
    slot: ManShoppingSlotName,
    payload: ShoppingSelectPayload,
  ): Promise<boolean> => {
    const res = await fetch(`/api/man-report/${reportId}/shopping/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outfitNumber, slot, ...payload }),
    });
    if (!res.ok) return false;
    await load({ fresh: true, force: true });
    return true;
  }, [reportId, load]);

  const fetchShoppingLinks = useCallback(async () => {
    setError('');
    const res = await fetch(`/api/man-report/${reportId}/shopping/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? 'Could not start the shopping link fetch.');
      return;
    }
    await load({ fresh: true, force: true });
  }, [reportId, load]);

  // ── Page approval ─────────────────────────────────────────────────────

  const togglePageApproval = async (slide: ManReportSlideMeta | null) => {
    if (!report || !slide) return;
    const pageKey = approvalKeyForSlide(slide);
    const next = withOutfitSectionFlag({
      ...report.section_approvals,
      [pageKey]: !pageApproved(report.section_approvals, slide),
    }, slideMeta);
    setReport(r => r ? { ...r, section_approvals: next } : r);
    await fetch(`/api/man-report/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section_approvals: next }),
    });
  };

  const approveAndNext = async () => {
    if (!report || !activeSlide) return;
    const pageKey = approvalKeyForSlide(activeSlide);
    const next = withOutfitSectionFlag({
      ...report.section_approvals,
      [pageKey]: true,
    }, slideMeta);
    setReport(r => r ? { ...r, section_approvals: next } : r);
    await fetch(`/api/man-report/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section_approvals: next }),
    });

    const nextSlide = slideMeta.find(slide => slide.pageNumber > activeSlide.pageNumber && !pageApproved(next, slide))
      ?? slideMeta.find(slide => slide.pageNumber > activeSlide.pageNumber)
      ?? slideMeta[0];
    if (nextSlide) {
      setActivePageNumber(nextSlide.pageNumber);
      setActiveSection(nextSlide.sectionKey as SectionKey);
      setViewMode('page');
    }
  };

  const approveAll = async () => {
    if (!report) return;
    let next: SectionApprovals = { ...report.section_approvals };
    slideMeta.forEach(slide => {
      next[approvalKeyForSlide(slide)] = true;
    });
    next = withOutfitSectionFlag(next, slideMeta);
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
    if (!report || !allPagesApproved(report.section_approvals, slideMeta)) return;
    if (!qualityGatePassed) {
      const issueSummary = outfitQaErrors
        .filter(item => item.code !== 'quality_floor')
        .slice(0, 6)
        .map(item => `• ${item.message}`)
        .join('\n');
      const confirmed = window.confirm(
        `Automated outfit QA scored this report ${outfitQuality?.overallScore?.toFixed(1) ?? 'below 9.0'}/10.\n\n${issueSummary || outfitQuality?.failedCriteria?.join('\n') || 'Quality checks need review.'}\n\nYou have approved every report page. Send it anyway?`,
      );
      if (!confirmed) return;
    }
    // Soft gate only: missing/flagged shopping links warn but never block send.
    if (shoppingSummary) {
      const linkIssues = [
        shoppingSummary.inFlight ? 'links are still being fetched' : null,
        shoppingSummary.staleCount > 0 ? `${shoppingSummary.staleCount} garments have no up-to-date links` : null,
        shoppingSummary.flaggedCount > 0 ? `${shoppingSummary.flaggedCount} garments have unreviewed low-confidence links` : null,
        shoppingSummary.error ? 'the last link fetch failed' : null,
      ].filter(Boolean);
      if (linkIssues.length > 0 && !window.confirm(`Shopping links: ${linkIssues.join(', ')}. Send anyway?`)) {
        return;
      }
    }
    setSending(true);
    setError('');
    try {
      const res  = await fetch(`/api/man-report/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'sent',
          quality_override: !qualityGatePassed,
        }),
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

  // The admin view carries edit controls, so the PDF comes from the client's view.
  const printClientReport = () => {
    if (!report) return;
    window.open(`/man/report/${report.share_token}?opening=skip&print=1`, '_blank', 'noopener');
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
    setError('');

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
    setError('');

    // Reflect invalidated photos immediately so edited text never retains a stale preview.
    setReport(prev => {
      if (!prev?.report_data) return prev;
      return {
        ...prev,
        error_message: null,
        section_approvals: { ...prev.section_approvals, s4: false },
        image_urls: prev.image_urls ? {
          ...prev.image_urls,
          outfitCards: prev.image_urls.outfitCards.map((path, index) =>
            data.clearedOutfitNumbers?.includes(index + 1) ? null : path),
        } : null,
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
        image_urls: prev.image_urls ? { ...prev.image_urls,
          comboGridCards: { ...prev.image_urls.comboGridCards,
            ...Object.fromEntries((data.clearedKinds ?? []).map((key: string) => [key, null])) },
        } : null,
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
    setError('');

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

  const regenerateV2Image = useCallback(async (target: ManV2ImageTarget): Promise<ResolvedImageUrls | null> => {
    const res = await fetch(`/api/man-report/${reportId}/regenerate-v2-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, imageModel }),
    });
    const data = await res.json();
    if (!res.ok || !data.imageUrls) {
      setError(data.error ?? 'Could not regenerate image.');
      return null;
    }
    const imageUrls = data.imageUrls as ResolvedImageUrls;
    setError('');
    setReport(previous => previous ? { ...previous, image_urls: imageUrls, error_message: null } : previous);
    return imageUrls;
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
  const outfitQuality = report?.report_data?.qa?.section4?.quality;
  const outfitQaErrors = (report?.report_data?.qa?.section4?.issues ?? []).filter(item => item.severity === 'error');
  // v2-9plus and v3-board-first reports were picked from the library; inline because this page cannot load the library module.
  const qualityGateRequired = ['v2-9plus', 'v3-board-first'].includes(report?.report_data?.outfit_library?.version ?? '');
  const qualityGatePassed = !qualityGateRequired || Boolean(outfitQuality?.passed);
  const ready        = allPagesApproved(approvals, slideMeta);
  const isGenerating = report?.status === 'generating';
  const isError      = report?.status === 'error';
  const isStuck      = isGenerating && elapsedSecs > 600;

  // Image pipeline stale detection: progress_stage set but updated_at hasn't changed in >10 min.
  const imageProgressAgeMs = report?.progress_stage && !isGenerating && report.updated_at
    ? imageProgressNow - new Date(report.updated_at).getTime()
    : 0;
  const isImageStuck = imageProgressAgeMs > 10 * 60 * 1000;

  const expectedOutfitCount = report?.report_data?.classification?.outfit_split?.total ?? 20;
  const requiresV2Images = report?.report_data?.report_version === 'man_blueprint_v2';
  const imageCounts = {
    hairstyleDone: report?.image_urls?.hairstyleCards?.[0] ? 1 : 0,
    beardDone:     report?.image_urls?.beardCards?.[0] ? 1 : 0,
    eyewearDone:   report?.image_urls?.eyewearCards?.[0] ? 1 : 0,
    outfitDone:    (report?.image_urls?.outfitCards    ?? []).filter(Boolean).length,
    comboGridDone: Object.values(report?.image_urls?.comboGridCards ?? {}).filter(Boolean).length,
    diagnosticDone: [
      report?.image_urls?.diagnostic?.faceGeometry,
      report?.image_urls?.diagnostic?.frameFront,
      report?.image_urls?.diagnostic?.colourDrape,
    ].filter(Boolean).length,
    deliverableDone: [
      report?.image_urls?.deliverables?.beforeImage,
      report?.image_urls?.deliverables?.afterImage,
      report?.image_urls?.deliverables?.linkedinHeadshot,
      ...(report?.image_urls?.deliverables?.datingProfileShots ?? []),
    ].filter(Boolean).length,
  };
  const activeGroomingDone = imageCounts.hairstyleDone;
  const v2ImageDone = imageCounts.diagnosticDone + imageCounts.deliverableDone;
  const imageDoneTotal = imageCounts.hairstyleDone + imageCounts.beardDone + imageCounts.eyewearDone + imageCounts.outfitDone + imageCounts.comboGridDone + (requiresV2Images ? v2ImageDone : 0);
  const imageExpectedTotal = expectedOutfitCount + (requiresV2Images ? 15 : 6);
  const hasImageAttempt = imageDoneTotal > 0 ||
    Boolean(report?.error_message?.startsWith('Image generation'));
  const imageButtonLabel = hasImageAttempt ? 'Retry Missing Images' : 'Generate Images';
  const hasPartialText = !!report?.report_data?.classification ||
    Object.values(report?.report_data?.sections ?? {}).some(value => typeof value === 'string' && value.trim().length > 0);

  // True only when hairstyle, eyewear AND every expected outfit image are present.
  const hasAllImages = (
    activeGroomingDone >= 1 &&
    imageCounts.beardDone >= 1 &&
    imageCounts.eyewearDone >= 1 &&
    imageCounts.outfitDone >= expectedOutfitCount &&
    imageCounts.comboGridDone >= 3 &&
    (!requiresV2Images || (
      imageCounts.diagnosticDone >= 3 &&
      imageCounts.deliverableDone >= 6
    ))
  );

  // ── Reject & retry (discard current report, start fresh) ─────────────
  const handleRejectAndRetry = async () => {
    if (!report || rejecting) return;
    const submissionId = report.submission_id;
    if (!submissionId) { setError('Missing submission ID — cannot retry.'); return; }
    setRejecting(true);
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

  // ── Redo only Section 4 outfits and dependent outfit imagery ─────────
  const handleRedoAllOutfits = useCallback(async () => {
    if (!report || redoingOutfits || isGenerating || report.progress_stage || !report.report_data) return;

    setRedoingOutfits(true);
    setError('');
    try {
      const res = await fetch(`/api/man-report/${reportId}/redo-outfits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json() as Partial<RedoAllOutfitsResult> & { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Could not redo all outfits.');
        return;
      }

      if (!data.updatedS4Outfits || !data.updatedComboGridText) {
        setError('Redo all outfits returned an incomplete response.');
        return;
      }

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
        const datingShotCount = Math.max(existingImageUrls.deliverables?.datingProfileShots?.length ?? 0, 3);
        const nextImageUrls: ResolvedImageUrls = {
          ...existingImageUrls,
          outfitCards: Array.from({ length: expectedOutfitCount }, () => null),
          comboGridCards: {
            office: null,
            evening: null,
            relaxed: null,
          },
          deliverables: {
            ...(existingImageUrls.deliverables ?? {}),
            beforeImage: null,
            afterImage: null,
            beforeAfter: null,
            datingProfileShots: Array.from({ length: datingShotCount }, () => null),
          },
        };

        return {
          ...prev,
          status: data.status ?? (prev.status === 'sent' ? 'in_review' : prev.status),
          progress_stage: null,
          error_message: null,
          updated_at: data.updatedAt ?? prev.updated_at,
          image_urls: nextImageUrls,
          report_data: {
            ...prev.report_data,
            qa: data.qa ?? prev.report_data.qa,
            sections: {
              ...prev.report_data.sections,
              s4_outfits: data.updatedS4Outfits,
              s4_combo_grids: data.updatedComboGridText,
            } as ReportSections,
          },
        };
      });

      await load({ fresh: true, force: true });
    } catch {
      setError('Could not redo all outfits. Please try again.');
    } finally {
      setRedoingOutfits(false);
    }
  }, [report, redoingOutfits, isGenerating, reportId, expectedOutfitCount, load]);

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

  // ── Keyboard: J/K move between pages, A approves and moves on, E edits ──
  const shortcutRef = useRef<{ next: () => void; prev: () => void; approve: () => void; edit: () => void } | null>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;
      if (document.querySelector('.ma-sheet-backdrop, [role="dialog"]')) return;
      const actions = shortcutRef.current;
      if (!actions) return;
      if (event.key === 'j' || event.key === 'ArrowDown') { event.preventDefault(); actions.next(); }
      else if (event.key === 'k' || event.key === 'ArrowUp') { event.preventDefault(); actions.prev(); }
      else if (event.key === 'a') { event.preventDefault(); actions.approve(); }
      else if (event.key === 'e') { event.preventDefault(); actions.edit(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Loading / error states ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 size={22} className="animate-spin ma-faint" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-24 text-center">
        <p className="ma-muted">Report not found.</p>
        <Link href="/man/admin/dashboard" className="ma-btn ma-btn--secondary mt-5">Back to clients</Link>
      </div>
    );
  }

  const elapsedLabel = (() => {
    if (elapsedSecs < 60) return `${elapsedSecs}s`;
    const m = Math.floor(elapsedSecs / 60);
    const s = elapsedSecs % 60;
    return `${m}m ${s}s`;
  })();

  const approvedCount = countApprovedPages(approvals, slideMeta);
  const totalApprovalPages = slideMeta.length;
  const activeApproved = pageApproved(approvals, activeSlide);
  const canEditActiveSection = Boolean(activeSlideSection && report.report_data?.sections?.[SECTION_FIELD_MAP[activeSlideSection as SectionKey]] !== undefined);
  const intakeHref = report.submission_id ? `/man/admin/dashboard/${report.submission_id}` : '/man/admin/dashboard';
  const clientEmail = report.man_intake_submissions?.customer_email ?? null;
  const clientName = clientDisplayName(clientEmail, report.man_intake_submissions?.customer_phone);
  const statusMeta = reportStatusMeta(report);
  const isSent = report.status === 'sent' || Boolean(report.sent_at);
  const canReworkReport = ['draft_ready', 'in_review', 'approved', 'sent'].includes(report.status) && Boolean(report.report_data);
  const busyWithJob = isGenerating || Boolean(report.progress_stage);
  const showGenerateImages = !isGenerating && Boolean(report.report_data) && !hasAllImages && !report.progress_stage;
  const qaFindings = qualityGateRequired && !qualityGatePassed
    ? [
      ...(outfitQuality?.failedCriteria ?? []).filter(item => item !== 'Deterministic outfit QA has blocking errors.'),
      ...outfitQaErrors.filter(item => item.code !== 'quality_floor').map(item => item.message),
    ]
    : [];
  const linksNeedAttention = Boolean(shoppingSummary && !shoppingSummary.inFlight && (shoppingSummary.error || shoppingSummary.staleCount > 0));
  const approvalPct = totalApprovalPages ? Math.round((approvedCount / totalApprovalPages) * 100) : 0;
  const pageTitle = viewMode === 'full'
    ? 'Full report'
    : activeSlide ? sidebarTitle(activeSlide.title) : 'Report';

  const goToPage = (pageNumber: number) => {
    const slide = slideMeta.find(item => item.pageNumber === pageNumber);
    if (!slide) return;
    setActivePageNumber(slide.pageNumber);
    setActiveSection(slide.sectionKey as SectionKey);
    setViewMode('page');
    document.getElementById(`ma-page-${slide.pageNumber}`)?.scrollIntoView({ block: 'nearest' });
  };
  const activeIndex = slideMeta.findIndex(slide => slide.pageNumber === activePageNumber);
  shortcutRef.current = safeData ? {
    next: () => goToPage(slideMeta[Math.min(slideMeta.length - 1, activeIndex + 1)]?.pageNumber ?? activePageNumber),
    prev: () => goToPage(slideMeta[Math.max(0, activeIndex - 1)]?.pageNumber ?? activePageNumber),
    approve: () => { if (activeSlide && !isGenerating) void approveAndNext(); },
    edit: () => { if (canEditActiveSection && !isGenerating && activeSlideSection) startEdit(activeSlideSection as SectionKey); },
  } : null;

  const missingImageParts = [
    imageCounts.outfitDone < expectedOutfitCount ? `${expectedOutfitCount - imageCounts.outfitDone} outfit` : null,
    imageCounts.comboGridDone < 3 ? `${3 - imageCounts.comboGridDone} grid` : null,
    imageCounts.hairstyleDone + imageCounts.beardDone + imageCounts.eyewearDone < 3 ? `${3 - imageCounts.hairstyleDone - imageCounts.beardDone - imageCounts.eyewearDone} face` : null,
    requiresV2Images && imageCounts.diagnosticDone < 3 ? `${3 - imageCounts.diagnosticDone} diagnostic` : null,
    requiresV2Images && imageCounts.deliverableDone < 6 ? `${6 - imageCounts.deliverableDone} deliverable` : null,
  ].filter(Boolean);

  return (
    <div className="ma-report min-h-screen">
      {/* ── Sidebar: who, how far, which page ─────────────────────────────── */}
      <aside className="ma-report__aside">
        <div className="px-5 pt-5 pb-4">
          <Link href="/man/admin/dashboard" className="ma-btn ma-btn--ghost ma-btn--sm -ml-2.5">
            <ArrowLeft size={14} /> Clients
          </Link>
          <Link href={intakeHref} className="mt-4 flex items-center gap-3" title="Open intake answers">
            <Avatar name={clientName} size={44} />
            <div className="min-w-0">
              <div className="truncate text-[16px]" style={{ fontWeight: 600 }}>{clientName}</div>
              <div className="ma-faint truncate text-[12px]">{clientEmail ?? 'Intake answers'}</div>
            </div>
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <Pill tone={statusMeta.tone} live={statusMeta.live} dot={!statusMeta.live}>{statusMeta.label}</Pill>
            {aiEngine && (
              <Pill tone={aiEngine.engine === 'codex' ? 'accent' : 'neutral'} title={aiEngine.note ?? (aiEngine.engine === 'codex' ? 'Text and images use your ChatGPT login via Codex. Gemini is the fallback.' : 'Codex is not available on this server, so Gemini is used.')}>
                {aiEngine.engine === 'codex' ? 'ChatGPT' : 'Gemini'}
              </Pill>
            )}
          </div>
          {safeData && (
            <div className="mt-4">
              <div className="flex items-baseline justify-between text-[12px]">
                <span className="ma-faint">Reviewed</span>
                <span className="ma-num" style={{ fontWeight: 600 }}>{approvedCount} / {totalApprovalPages}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(17,19,21,0.07)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${approvalPct}%`, background: ready ? 'var(--ma-green)' : 'var(--ma-accent)' }} />
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Report pages">
          {(['Opening', 'Diagnosis', 'Prescription', 'Outfits', 'Closing'] as const).map(group => {
            const groupSlides = slideMeta.filter(slide => slide.group === group);
            if (groupSlides.length === 0) return null;
            return (
              <div key={group} className="mt-3">
                <div className="ma-eyebrow px-2.5 pb-1.5">{group}</div>
                {groupSlides.map((slide: ManReportSlideMeta) => {
                  const active = viewMode === 'page' && activePageNumber === slide.pageNumber;
                  const approved = pageApproved(approvals, slide);
                  return (
                    <button
                      key={slide.pageNumber + '-' + slide.title}
                      id={`ma-page-${slide.pageNumber}`}
                      type="button"
                      onClick={() => goToPage(slide.pageNumber)}
                      className="ma-report__page"
                      data-active={active}
                    >
                      <span className="ma-num ma-faint w-5 shrink-0 text-right text-[11px]">{slide.pageNumber}</span>
                      <span className="min-w-0 flex-1 truncate">{sidebarTitle(slide.title)}</span>
                      {approved
                        ? <Check size={14} style={{ color: 'var(--ma-green)' }} aria-label="Approved" />
                        : <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'rgba(17,19,21,0.18)' }} aria-label="Not reviewed" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ── Top bar: what you're looking at + the few actions that matter ─── */}
      <header className="ma-report__top ma-glass">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-[17px]" style={{ fontWeight: 600, letterSpacing: '-0.015em' }}>{pageTitle}</h1>
          {viewMode === 'page' && activeSlide && (
            <span className="ma-faint shrink-0 text-[13px] ma-num">Page {activeSlide.pageNumber} of {slideMeta.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {safeData && (
            <Segmented<'page' | 'full'>
              value={viewMode}
              onChange={setViewMode}
              options={[{ value: 'page', label: 'Page' }, { value: 'full', label: 'Full report' }]}
            />
          )}
          {qaFindings.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setIssuesOpen(true)} title="Automated outfit checks">
              <span className="ma-pill ma-pill--amber">{qaFindings.length} outfit {qaFindings.length === 1 ? 'note' : 'notes'}</span>
            </Button>
          )}
          {showGenerateImages && (
            <Button
              size="sm"
              variant={isSent ? 'secondary' : 'dark'}
              icon={<ImageIcon size={14} />}
              loading={generatingImages}
              disabled={!qualityGatePassed}
              title={qualityGatePassed ? `Missing: ${missingImageParts.join(', ')}` : 'Outfit quality must pass before images.'}
              onClick={() => { void handleGenerateImages(); }}
            >
              {imageButtonLabel === 'Generate Images' ? 'Generate images' : `Fill ${imageExpectedTotal - imageDoneTotal} images`}
            </Button>
          )}
          {isImageStuck && !isGenerating && (
            <Button size="sm" variant="dark" icon={<RotateCcw size={14} />} loading={generatingImages} onClick={() => { void handleGenerateImages(); }}>
              Restart images
            </Button>
          )}
          <OverflowMenu
            items={[
              { label: copied ? 'Copied' : 'Copy client link', icon: copied ? <Check size={15} /> : <Copy size={15} />, onSelect: copyLink },
              { label: 'Open client view', hint: 'What the client sees', icon: <ExternalLink size={15} />, onSelect: () => window.open(`/man/report/${report.share_token}?opening=skip`, '_blank', 'noopener') },
              { label: 'Download PDF', icon: <Printer size={15} />, onSelect: printClientReport },
              ...(linksNeedAttention ? [{ label: shoppingSummary?.error ? 'Retry shopping links' : 'Fetch shopping links', icon: <ShoppingBag size={15} />, onSelect: () => { void fetchShoppingLinks(); } }] : []),
              ...(canReworkReport ? [{ label: 'Rewrite all 20 outfits', hint: 'Clears outfit images', icon: <RotateCcw size={15} />, disabled: redoingOutfits || busyWithJob, onSelect: () => setConfirmAction('redo') }] : []),
              ...(['draft_ready', 'in_review', 'approved'].includes(report.status) ? [{ label: 'Discard and regenerate', hint: 'Starts a fresh report', icon: <Trash2 size={15} />, danger: true, onSelect: () => setConfirmAction('reject') }] : []),
              ...(isStuck ? [{ label: 'Cancel stuck generation', icon: <Ban size={15} />, danger: true, disabled: terminating, onSelect: () => { void handleTerminate(); } }] : []),
            ]}
          />
        </div>
      </header>

      <main className="ma-report__main">
        {(report.error_message || error) && (
          <div className="mx-auto mb-5 flex max-w-[1120px] items-start justify-between gap-4 rounded-2xl px-5 py-3.5 text-[14px]" style={{ background: 'var(--ma-red-soft)', color: 'var(--ma-red)' }}>
            <span>{error || report.error_message}</span>
            {isError && (
              <Button size="sm" variant="danger" icon={<Zap size={13} />} loading={retrying} onClick={handleRetry}>{hasPartialText ? 'Resume' : 'Retry'}</Button>
            )}
          </div>
        )}

        {!isGenerating && report.progress_stage && (
          <div className="mx-auto mb-5 flex max-w-[1120px] items-center gap-3 rounded-2xl px-5 py-3 text-[14px]" style={{ background: isImageStuck ? 'var(--ma-amber-soft)' : 'var(--ma-blue-soft)', color: isImageStuck ? 'var(--ma-amber)' : 'var(--ma-blue)' }}>
            {!isImageStuck && <Loader2 size={15} className="animate-spin" />}
            <span>{STAGE_LABELS[report.progress_stage] ?? report.progress_stage.replace(/_/g, ' ')}</span>
            <span className="ma-num opacity-80">· {imageDoneTotal} of {imageExpectedTotal} images</span>
          </div>
        )}

        {!safeData ? (
          <div className="mx-auto mt-16 max-w-md text-center">
            {isGenerating ? (
              <div className="ma-card px-8 py-10">
                <Loader2 size={26} className="mx-auto animate-spin" style={{ color: 'var(--ma-accent)' }} />
                <div className="ma-h2 mt-5">{STAGE_LABELS[report.progress_stage ?? ''] ?? 'Generating…'}</div>
                <p className="ma-faint mt-1 text-[14px] ma-num">{isStuck ? `No progress for ${elapsedLabel}` : `Running for ${elapsedLabel}`}</p>
                {isStuck && <Button className="mt-5" variant="danger" size="sm" icon={<Ban size={13} />} loading={terminating} onClick={() => { void handleTerminate(); }}>Cancel</Button>}
              </div>
            ) : (
              <p className="ma-muted">No report text yet.</p>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-[1120px] overflow-hidden rounded-[28px]" style={{ background: '#111315', boxShadow: 'var(--ma-shadow-sm)' }}>
            <ManReport
              data={safeData}
              imageUrls={report.image_urls}
              viewerMode="admin"
              motionMode="reduced"
              deferSections={viewMode === 'full'}
              focusPageNumber={viewMode === 'page' ? activePageNumber : undefined}
              onRegenerateFaceImage={regenerateFaceImage}
              onRegenerateV2Image={regenerateV2Image}
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
              shopping={report.shopping_data}
              onSelectShoppingLink={selectShoppingLink}
            />
          </div>
        )}
      </main>

      {/* ── Review dock ─────────────────────────────────────────────────────── */}
      {safeData && (
        <div className="ma-report__dock">
          <div className="ma-report__dock-inner">
            {viewMode === 'page' && activeSlide ? (
              <>
                <Button size="sm" variant="ghost" iconOnly icon={<ChevronUp size={16} />} aria-label="Previous page (K)" title="Previous page  K" disabled={activeIndex <= 0} onClick={() => shortcutRef.current?.prev()} />
                <Button size="sm" variant="ghost" iconOnly icon={<ChevronDown size={16} />} aria-label="Next page (J)" title="Next page  J" disabled={activeIndex >= slideMeta.length - 1} onClick={() => shortcutRef.current?.next()} />
                <span className="mx-1 h-5 w-px" style={{ background: 'var(--ma-line)' }} />
                <Button size="sm" variant="ghost" icon={<Pencil size={14} />} disabled={!canEditActiveSection || isGenerating} onClick={() => activeSlideSection && startEdit(activeSlideSection as SectionKey)} title="Edit this page's text  E">
                  Edit text
                </Button>
                {activeApproved ? (
                  <Button size="sm" variant="ghost" icon={<Undo2 size={14} />} disabled={isGenerating} onClick={() => togglePageApproval(activeSlide)}>Unapprove</Button>
                ) : (
                  <Button size="sm" variant="success" icon={<Check size={14} />} disabled={isGenerating} onClick={approveAndNext} title="Approve and go to the next page  A">
                    Approve <span className="ma-kbd" style={{ background: 'rgba(255,255,255,0.16)', borderColor: 'transparent', color: '#fff' }}>A</span>
                  </Button>
                )}
              </>
            ) : (
              <span className="ma-faint px-2 text-[13px]">Pick a page on the left, or press <span className="ma-kbd">J</span> to start reviewing</span>
            )}
            <span className="mx-1 h-5 w-px" style={{ background: 'var(--ma-line)' }} />
            {!ready && (
              <Button size="sm" variant="ghost" icon={<CheckCheck size={14} />} disabled={isGenerating} onClick={approveAll} title="Mark every page reviewed">
                Approve all
              </Button>
            )}
            <Button
              size="sm"
              variant="primary"
              icon={<Send size={14} />}
              loading={sending}
              disabled={!ready || isGenerating}
              onClick={sendToClient}
              title={!ready ? `Review all ${totalApprovalPages} pages first (${approvedCount} done).` : 'Email the report to the client.'}
            >
              {isSent ? 'Resend' : 'Send to client'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Outfit QA notes ─────────────────────────────────────────────────── */}
      <Sheet
        open={issuesOpen}
        onClose={() => setIssuesOpen(false)}
        eyebrow="Automated outfit check"
        title={`Scored ${outfitQuality?.overallScore?.toFixed(1) ?? '—'} / 10`}
        footer={<Button variant="dark" onClick={() => setIssuesOpen(false)}>Done</Button>}
      >
        <p className="ma-muted mb-4 text-[14px]">These are suggestions, not blockers. Fix the outfits you agree with; you can still send once every page is reviewed.</p>
        <ul className="space-y-2">
          {qaFindings.map(item => (
            <li key={item} className="rounded-2xl px-4 py-3 text-[14px]" style={{ background: 'var(--ma-surface-2)', border: '1px solid var(--ma-line-2)' }}>{item}</li>
          ))}
        </ul>
      </Sheet>

      {/* ── Confirmations ───────────────────────────────────────────────────── */}
      <Sheet
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        width={480}
        title={confirmAction === 'redo' ? 'Rewrite all 20 outfits?' : 'Discard this report?'}
        footer={(
          <>
            <Button variant="ghost" onClick={() => setConfirmAction(null)}>Cancel</Button>
            {confirmAction === 'redo' ? (
              <Button variant="dark" loading={redoingOutfits} onClick={async () => { await handleRedoAllOutfits(); setConfirmAction(null); }}>Rewrite outfits</Button>
            ) : (
              <Button variant="danger" loading={rejecting} onClick={async () => { await handleRejectAndRetry(); setConfirmAction(null); }}>Discard and regenerate</Button>
            )}
          </>
        )}
      >
        <p className="ma-muted text-[15px] leading-relaxed">
          {confirmAction === 'redo'
            ? 'All outfit text is written again from the current outfit system. Outfit images, grids and before/after shots will need to be regenerated. Your other pages stay as they are.'
            : 'This report is thrown away and a new one is generated from the intake. Any edits on this report are lost.'}
        </p>
      </Sheet>

      {/* ── Page text editor ───────────────────────────────────────────────── */}
      <Sheet
        open={editingSection !== null}
        onClose={() => setEditingSection(null)}
        width={820}
        eyebrow="Edit page text"
        title={SECTIONS.find(s => s.key === editingSection)?.label ?? ''}
        footer={(
          <>
            <span className="ma-faint mr-auto text-[12px]">Saved text replaces this section for the client.</span>
            <Button variant="ghost" onClick={() => setEditingSection(null)}>Cancel</Button>
            <Button variant="dark" loading={saving} onClick={saveEdit}>Save</Button>
          </>
        )}
      >
        <textarea
          value={editText}
          onChange={e => setEditText(e.target.value)}
          className="ma-textarea"
          style={{ minHeight: '56vh', fontSize: 15, lineHeight: 1.7 }}
          autoFocus
        />
      </Sheet>
    </div>
  );
}
