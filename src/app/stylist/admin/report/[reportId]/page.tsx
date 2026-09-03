'use client';

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Copy,
  Eye,
  EyeOff,
  FilePlus2,
  ImageIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  MoveDown,
  MoveUp,
  PanelRight,
  Printer,
  RefreshCw,
  Save,
  Send,
  ThumbsDown,
  ThumbsUp,
  Undo2,
  Upload,
  WandSparkles,
  X,
} from 'lucide-react';
import { ActionButton, Pill, reviewTheme as S } from '@/components/AdminReviewWorkspace';
import StylistBlueprintReport from '@/components/StylistBlueprintReport';
import type { LegacyStylistBlueprintReportData, StylistBlueprintReportData } from '@/lib/stylistBlueprintGenerator';
import {
  STYLIST_BLUEPRINT_LEGACY_VERSION,
  STYLIST_BLUEPRINT_VERSION,
  getStylistBlueprintContinuationPage,
  getStylistBlueprintOutfitEndPage,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintPageCount,
  getStylistBlueprintPalettePage,
  getStylistBlueprintRulesStartPage,
  isVersionedStylistBlueprintReportData,
} from '@/lib/stylistBlueprintSchema';
import type { ResolvedStylistBlueprintImageUrls, StylistBlueprintImageGroup, StylistBlueprintImageSlotKey } from '@/lib/stylistBlueprintImageGenerator';
import { checkStudioReportQuality, formatOutfitDraft, moveStudioPage, outfitPageToDraft } from '@/lib/stylistReportStudio';

interface Report {
  id: string;
  status: string;
  progress_stage: string | null;
  report_data: StylistBlueprintReportData | LegacyStylistBlueprintReportData | null;
  image_urls: ResolvedStylistBlueprintImageUrls | null;
  share_token: string;
  section_approvals: Record<string, boolean>;
  submission_id: string;
  updated_at: string;
  error_message: string | null;
  sent_at: string | null;
  published_at?: string | null;
  delivered_at?: string | null;
  revision?: number;
  stylist_intake_responses: { customer_email: string | null; customer_phone: string | null; full_name: string | null; intake_source?: string | null; consultation_id?: string | null } | null;
}

type OutfitFeedbackVote = 'like' | 'dislike';
type OutfitScienceQaVerdict = 'PASS' | 'PASS_SURPRISE' | 'KILL_EYE' | 'KILL_WOW' | 'KILL_REAL';

interface OutfitFeedbackState {
  id: string;
  vote?: OutfitFeedbackVote;
  verdict?: OutfitScienceQaVerdict;
  reason?: string | null;
  library_entry_id?: string | null;
  candidate_id?: string | null;
  updated_at?: string;
}

const IMAGE_GROUPS: Array<{ value: StylistBlueprintImageGroup; label: string }> = [
  { value: 'all', label: 'All missing' },
  { value: 'diagnosis', label: 'Diagnosis' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'capsule_1', label: 'Capsule 1' },
  { value: 'capsule_2', label: 'Capsule 2' },
  { value: 'capsule_3', label: 'Capsule 3' },
  { value: 'capsule_4', label: 'Capsule 4' },
  { value: 'closing', label: 'Closing' },
];

function isManualReportIntake(intake: Report['stylist_intake_responses']) {
  return intake?.intake_source === 'manual_admin' || intake?.intake_source === 'india_consultation';
}

async function readJsonBody<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function responseErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === 'object' && 'error' in data) {
    const error = (data as { error?: unknown }).error;
    if (typeof error === 'string' && error.trim()) return error;
  }
  return fallback;
}

function pageGroup(pageNumber: number, data?: StylistBlueprintReportData | null) {
  if (!data) return 'Opening';
  if (pageNumber <= 4) return 'Opening';
  if (pageNumber <= 9) return 'Diagnosis';
  if (pageNumber < getStylistBlueprintOutfitStartPage(data)) return 'Style Guide';
  if (pageNumber <= getStylistBlueprintOutfitEndPage(data)) return 'Outfits';
  return 'Closing';
}

type StudioPanel = 'analysis' | 'outfit' | 'visuals' | 'quality' | 'pages';
type ManualImagePrompt = { slotKey: StylistBlueprintImageSlotKey; label: string; prompt: string; size: string; currentUrl: string | null };

function stageLabel(stage: string | null) {
  return stage ? stage.replace(/_/g, ' ') : 'Ready';
}

export default function StylistBlueprintAdminReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const workspaceMatch = pathname.match(/^\/stylist\/([^/]+)\/reports\//);
  const workspaceSlug = workspaceMatch?.[1] ?? null;
  const isWorkspace = Boolean(workspaceSlug);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePageNumber, setActivePageNumber] = useState(1);
  const [viewMode, setViewMode] = useState<'page' | 'full'>('page');
  const [draftData, setDraftData] = useState<StylistBlueprintReportData | null>(null);
  const [dirtyPages, setDirtyPages] = useState<Set<number>>(() => new Set());
  const [reportDataDirty, setReportDataDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveConflict, setSaveConflict] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [refreshingSilhouetteProofs, setRefreshingSilhouetteProofs] = useState(false);
  const [rebuildingReport, setRebuildingReport] = useState(false);
  const [regeneratingSlotKey, setRegeneratingSlotKey] = useState<StylistBlueprintImageSlotKey | null>(null);
  const [replacingOutfitPage, setReplacingOutfitPage] = useState<number | null>(null);
  const [editingOutfitPage, setEditingOutfitPage] = useState<number | null>(null);
  const [outfitInstruction, setOutfitInstruction] = useState('');
  const [outfitFeedbackByPage, setOutfitFeedbackByPage] = useState<Record<number, OutfitFeedbackState | null>>({});
  const [savingOutfitFeedback, setSavingOutfitFeedback] = useState<OutfitFeedbackVote | OutfitScienceQaVerdict | null>(null);
  const [replacingAllOutfits, setReplacingAllOutfits] = useState(false);
  const [regeneratingPalette, setRegeneratingPalette] = useState(false);
  const [imageGroup, setImageGroup] = useState<StylistBlueprintImageGroup>('all');
  const [sending, setSending] = useState(false);
  const [unlockingProgress, setUnlockingProgress] = useState(false);
  const [resumingText, setResumingText] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deliveryPrepared, setDeliveryPrepared] = useState<{ reportUrl: string; whatsappUrl: string; clientName?: string | null } | null>(null);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  const [error, setError] = useState('');
  const [imageCounts, setImageCounts] = useState<Record<string, { done: number; total: number }> | null>(null);
  const [studioPanel, setStudioPanel] = useState<StudioPanel | null>(null);
  const [outfitDraft, setOutfitDraft] = useState('');
  const [manualPrompts, setManualPrompts] = useState<ManualImagePrompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<StylistBlueprintImageSlotKey | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<StylistBlueprintImageSlotKey | null>(null);
  const [undoStack, setUndoStack] = useState<StylistBlueprintReportData[]>([]);
  const [printing, setPrinting] = useState(false);
  const unsavedEditsRef = useRef(false);
  const progressRequestRef = useRef(false);
  const lastReportUpdateRef = useRef<string | null>(null);
  const saveChangedPagesRef = useRef<() => Promise<boolean>>(async () => true);
  const reportCanvasRef = useRef<HTMLDivElement | null>(null);
  const visiblePageNumberRef = useRef(1);
  const pendingFullReportPageRef = useRef<number | null>(null);

  const load = useCallback(async (fresh = false) => {
    const statusPromise = fetch(`/api/stylist-blueprint/status/${reportId}`, { cache: 'no-store' }).catch(() => null);
    const res = await fetch(`/api/stylist-blueprint/${reportId}${fresh ? '?fresh=1' : ''}`, { cache: 'no-store' });
    const data = await readJsonBody<{ report?: Report; error?: string }>(res);
    if (!res.ok) throw new Error(responseErrorMessage(data, 'Failed to load report'));
    if (data?.report) { setReport(data.report); lastReportUpdateRef.current = data.report.updated_at; }
    setLoading(false);
    const statusRes = await statusPromise;
    if (statusRes?.ok) {
      const statusData = await readJsonBody<{ imageCounts?: Record<string, { done: number; total: number }> }>(statusRes);
      setImageCounts(statusData?.imageCounts ?? null);
    }
    setLoading(false);
  }, [reportId]);

  const refreshGeneratedImages = useCallback(async () => {
    const res = await fetch(`/api/stylist-blueprint/${reportId}?fresh=1`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await readJsonBody<{ report?: Report }>(res);
    if (!data?.report) return;
    const loadedReport = data.report;
    lastReportUpdateRef.current = loadedReport.updated_at;
    setReport(prev => prev ? {
      ...prev,
      status: loadedReport.status,
      progress_stage: loadedReport.progress_stage,
      error_message: loadedReport.error_message,
      image_urls: loadedReport.image_urls,
      updated_at: loadedReport.updated_at,
    } : loadedReport);
  }, [reportId]);

  useEffect(() => { void load().catch(caught => { setError(caught instanceof Error ? caught.message : 'Could not load report'); setLoading(false); }); }, [load]);

  useEffect(() => {
    unsavedEditsRef.current = dirtyPages.size > 0 || reportDataDirty;
  }, [dirtyPages.size, reportDataDirty]);

  useEffect(() => {
    if (!generatingImages && report?.status !== 'generating' && !report?.progress_stage) return;
    const interval = setInterval(async () => {
      if (document.visibilityState !== 'visible' || progressRequestRef.current) return;
      progressRequestRef.current = true;
      try {
        const res = await fetch(`/api/stylist-blueprint/status/${reportId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const status = await res.json();
        setImageCounts(status.imageCounts ?? null);
        setReport(prev => prev ? { ...prev, status: status.status, progress_stage: status.progressStage, error_message: status.errorMessage } : prev);
        const finished = status.status !== 'generating' && !status.progressStage;
        if (finished && !unsavedEditsRef.current) await load(true);
        else if (status.updatedAt !== lastReportUpdateRef.current) await refreshGeneratedImages();
      } catch {
        // A transient polling failure must not interrupt editing. The next poll retries.
      } finally {
        progressRequestRef.current = false;
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [generatingImages, report?.status, report?.progress_stage, reportId, load, refreshGeneratedImages]);

  useEffect(() => {
    if (report?.status === 'draft_ready') {
      fetch(`/api/stylist-blueprint/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_review' }),
      }).then(() => load(true)).catch(() => {});
    }
  }, [report?.status, reportId, load]);

  const versioned = report?.report_data && isVersionedStylistBlueprintReportData(report.report_data) ? report.report_data : null;
  const isLegacyReport = versioned?.version === STYLIST_BLUEPRINT_LEGACY_VERSION;
  useEffect(() => {
    if (!versioned) {
      setDraftData(null);
      setDirtyPages(new Set());
      setReportDataDirty(false);
      return;
    }
    setDraftData(JSON.parse(JSON.stringify(versioned)) as StylistBlueprintReportData);
    setDirtyPages(new Set());
    setReportDataDirty(false);
  }, [versioned]);

  const reviewData = draftData ?? versioned;
  const hideContinuationPage = isManualReportIntake(report?.stylist_intake_responses ?? null);
  const visiblePages = useMemo(() => {
    const rawPages = reviewData?.pages ?? [];
    if (!reviewData) return rawPages;
    const continuationPage = getStylistBlueprintContinuationPage(reviewData);
    const orderIndex = new Map((reviewData.studio?.page_order ?? []).map((pageNumber, index) => [pageNumber, index]));
    return rawPages
      .filter(page => !hideContinuationPage || page.page_number !== continuationPage)
      .sort((a, b) => (orderIndex.get(a.page_number) ?? a.page_number) - (orderIndex.get(b.page_number) ?? b.page_number));
  }, [hideContinuationPage, reviewData]);
  const pages = visiblePages;
  const activePage = pages.find(page => page.page_number === activePageNumber) ?? pages[0] ?? null;
  const totalPageCount = pages.length || (versioned ? getStylistBlueprintPageCount(versioned) - (hideContinuationPage ? 1 : 0) : 0);
  const approvedCount = versioned ? pages.filter(page => report?.section_approvals?.[`p${page.page_number}`]).length : 0;
  const allApproved = versioned ? totalPageCount > 0 && approvedCount === totalPageCount : false;
  const requiredImagesDone = imageCounts ? Object.values(imageCounts).every(group => group.done >= group.total) : true;
  const activePageIsOutfit = Boolean(
    versioned &&
    activePageNumber >= getStylistBlueprintOutfitStartPage(versioned) &&
    activePageNumber <= getStylistBlueprintOutfitEndPage(versioned),
  );
  const activePageIsPalette = Boolean(versioned && activePageNumber === getStylistBlueprintPalettePage(versioned));
  const activeReportUsesScienceHarness = Boolean(versioned?.outfit_engine);
  const isStudioReport = versioned?.version === STYLIST_BLUEPRINT_VERSION;
  const qualityIssues = useMemo(() => {
    const issues = reviewData ? checkStudioReportQuality(reviewData) : [];
    for (const [group, count] of Object.entries(imageCounts ?? {})) {
      if (count.done < count.total) issues.push({ level: 'error', message: `Upload ${count.total - count.done} missing ${group.replace(/_/g, ' ')} image${count.total - count.done === 1 ? '' : 's'}.` });
    }
    return issues;
  }, [imageCounts, reviewData]);
  const hasUnsavedEdits = dirtyPages.size > 0 || reportDataDirty;
  const currentOutfitFeedback = outfitFeedbackByPage[activePageNumber] ?? null;
  const imageGroups = hideContinuationPage
    ? IMAGE_GROUPS.filter(group => group.value !== 'closing')
    : IMAGE_GROUPS;

  useEffect(() => {
    if (activePageIsOutfit && activePage) setOutfitDraft(outfitPageToDraft(activePage));
  }, [activePage, activePageIsOutfit]);

  useEffect(() => {
    if (!hideContinuationPage || !reviewData || pages.some(page => page.page_number === activePageNumber)) return;
    const fallbackPage = pages.at(-1) ?? pages[0];
    if (fallbackPage) setActivePageNumber(fallbackPage.page_number);
  }, [activePageNumber, hideContinuationPage, pages, reviewData]);

  useEffect(() => {
    if (hideContinuationPage && imageGroup === 'closing') setImageGroup('all');
  }, [hideContinuationPage, imageGroup]);

  const getVisibleReportPageNumber = useCallback(() => {
    const container = reportCanvasRef.current;
    if (!container || typeof window === 'undefined') return visiblePageNumberRef.current || activePageNumber;
    const pageElements = Array.from(container.querySelectorAll<HTMLElement>('[data-blueprint-page-number]'));
    let bestPageNumber = visiblePageNumberRef.current || activePageNumber;
    let bestVisiblePixels = 0;
    const topLimit = 104;
    const bottomLimit = Math.max(topLimit + 120, window.innerHeight - 86);

    for (const element of pageElements) {
      const pageNumber = Number(element.dataset.blueprintPageNumber);
      if (!Number.isFinite(pageNumber)) continue;
      const rect = element.getBoundingClientRect();
      const visiblePixels = Math.max(0, Math.min(rect.bottom, bottomLimit) - Math.max(rect.top, topLimit));
      if (visiblePixels > bestVisiblePixels) {
        bestVisiblePixels = visiblePixels;
        bestPageNumber = pageNumber;
      }
    }

    return bestPageNumber;
  }, [activePageNumber]);

  useEffect(() => {
    if (viewMode !== 'full' || !reviewData) return;
    const container = reportCanvasRef.current;
    if (!container || typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const pageElements = Array.from(container.querySelectorAll<HTMLElement>('[data-blueprint-page-number]'));
    if (!pageElements.length) return;

    const syncVisiblePage = () => {
      const pageNumber = getVisibleReportPageNumber();
      visiblePageNumberRef.current = pageNumber;
      setActivePageNumber(prev => (prev === pageNumber ? prev : pageNumber));
    };

    const observer = new IntersectionObserver(syncVisiblePage, {
      threshold: [0, 0.15, 0.35, 0.55, 0.75, 1],
      rootMargin: '-96px 0px -84px 0px',
    });
    pageElements.forEach(element => observer.observe(element));
    syncVisiblePage();
    window.addEventListener('resize', syncVisiblePage);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncVisiblePage);
    };
  }, [getVisibleReportPageNumber, reviewData, viewMode]);

  useEffect(() => {
    if (viewMode !== 'full' || !reviewData) return;
    const pageNumber = pendingFullReportPageRef.current;
    if (!pageNumber) return;
    pendingFullReportPageRef.current = null;
    window.setTimeout(() => {
      const target = reportCanvasRef.current?.querySelector<HTMLElement>(`[data-blueprint-page-number="${pageNumber}"]`);
      target?.scrollIntoView({ block: 'start' });
      visiblePageNumberRef.current = pageNumber;
      setActivePageNumber(pageNumber);
    }, 0);
  }, [reviewData, viewMode]);

  useEffect(() => {
    if (!activePageIsOutfit) return;
    let cancelled = false;
    fetch(`/api/stylist-blueprint/${reportId}/outfit-feedback?pageNumber=${activePageNumber}`, { cache: 'no-store' })
      .then(async res => {
        if (!res.ok) return null;
        const data = await res.json();
        return data.feedback as OutfitFeedbackState | null;
      })
      .then(feedback => {
        if (cancelled) return;
        setOutfitFeedbackByPage(prev => ({ ...prev, [activePageNumber]: feedback }));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [activePageIsOutfit, activePageNumber, reportId]);

  const rememberForUndo = () => {
    if (!draftData) return;
    setUndoStack(previous => [...previous.slice(-19), JSON.parse(JSON.stringify(draftData)) as StylistBlueprintReportData]);
  };

  const handlePageChange = (page: StylistBlueprintReportData['pages'][number]) => {
    rememberForUndo();
    setSaveConflict(false);
    setDraftData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map(item => item.page_number === page.page_number ? page : item),
      };
    });
    setDirtyPages(prev => new Set(prev).add(page.page_number));
  };

  const handleReportDataChange = (data: StylistBlueprintReportData) => {
    rememberForUndo();
    setSaveConflict(false);
    setDraftData(data);
    setReportDataDirty(true);
    setDirtyPages(prev => new Set(prev).add(activePageNumber));
  };

  const undoLastChange = () => {
    const previous = undoStack.at(-1);
    if (!previous) return;
    setDraftData(previous);
    setUndoStack(stack => stack.slice(0, -1));
    setReportDataDirty(true);
    setDirtyPages(new Set(previous.pages.map(page => page.page_number)));
    setSaveConflict(false);
  };

  const updateStudioData = (updater: (data: StylistBlueprintReportData) => StylistBlueprintReportData) => {
    if (!draftData) return;
    handleReportDataChange(updater(draftData));
  };

  const confirmAnalysis = () => updateStudioData(data => ({
    ...data,
    studio: {
      hidden_page_numbers: [],
      page_order: Array.from({ length: getStylistBlueprintPageCount(data) }, (_, index) => index + 1),
      ...data.studio,
      analysis_confirmed: true,
      confirmed_at: new Date().toISOString(),
    },
  }));

  const updateAnalysisField = (field: keyof StylistBlueprintReportData['analysis'], value: string) => updateStudioData(data => {
    const classification = { ...data.classification };
    if (field === 'silhouette_profile') classification.body = { ...classification.body, geometry: value };
    if (field === 'chromatic_family') classification.colour = { ...classification.colour, palette_name: value };
    if (field === 'style_direction') classification.taste = { ...classification.taste, style_archetype: value };
    if (field === 'facial_architecture') {
      const [shape, ...direction] = value.split(/\s[-–—]\s/);
      classification.face_hair_accessories = {
        ...classification.face_hair_accessories,
        face_shape: shape.trim() || value,
        face_direction: direction.join(' - ').trim() || classification.face_hair_accessories.face_direction,
      };
    }
    return {
      ...data,
      classification,
      analysis: { ...data.analysis, [field]: value },
      studio: {
        hidden_page_numbers: [],
        page_order: Array.from({ length: getStylistBlueprintPageCount(data) }, (_, index) => index + 1),
        ...data.studio,
        analysis_confirmed: false,
        confirmed_at: undefined,
      },
    };
  });

  const toggleActivePageVisibility = () => updateStudioData(data => {
    const hidden = new Set(data.studio?.hidden_page_numbers ?? []);
    if (hidden.has(activePageNumber)) hidden.delete(activePageNumber);
    else hidden.add(activePageNumber);
    return {
      ...data,
      studio: {
        analysis_confirmed: false,
        page_order: Array.from({ length: getStylistBlueprintPageCount(data) }, (_, index) => index + 1),
        ...data.studio,
        hidden_page_numbers: [...hidden].sort((a, b) => a - b),
      },
    };
  });

  const applyFormattedOutfit = () => {
    if (!activePage || !activePageIsOutfit) return;
    handlePageChange(formatOutfitDraft(outfitDraft, activePage));
  };

  const loadManualPrompts = async () => {
    setLoadingPrompts(true);
    setError('');
    try {
      const response = await fetch(`/api/stylist-blueprint/${reportId}/assets`, { cache: 'no-store' });
      const data = await readJsonBody<{ prompts?: ManualImagePrompt[]; error?: string }>(response);
      if (!response.ok) throw new Error(responseErrorMessage(data, 'Could not load image prompts'));
      setManualPrompts(data?.prompts ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load image prompts');
    } finally {
      setLoadingPrompts(false);
    }
  };

  const openStudioPanel = (panel: StudioPanel) => {
    setStudioPanel(panel);
    if (panel === 'visuals' && !manualPrompts.length) void loadManualPrompts();
  };

  const uploadManualImage = async (slotKey: StylistBlueprintImageSlotKey, file: File | null) => {
    if (!file) return;
    setUploadingSlot(slotKey);
    setError('');
    try {
      const form = new FormData();
      form.set('slotKey', slotKey);
      form.set('file', file);
      const response = await fetch(`/api/stylist-blueprint/${reportId}/assets`, { method: 'POST', body: form });
      const data = await readJsonBody<{ error?: string }>(response);
      if (!response.ok) throw new Error(responseErrorMessage(data, 'Image upload failed'));
      await Promise.all([refreshGeneratedImages(), loadManualPrompts()]);
      const statusResponse = await fetch(`/api/stylist-blueprint/status/${reportId}`, { cache: 'no-store' });
      if (statusResponse.ok) setImageCounts((await statusResponse.json()).imageCounts ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Image upload failed');
    } finally {
      setUploadingSlot(null);
    }
  };

  const saveChangedPages = async () => {
    if (!draftData || !hasUnsavedEdits) return true;
    setSaving(true);
    setError('');
    try {
      const nextApprovals = { ...(report?.section_approvals ?? {}) };
      for (const pageNumber of dirtyPages) nextApprovals[`p${pageNumber}`] = false;
      const res = await fetch(`/api/stylist-blueprint/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_data: draftData,
          page_approvals: nextApprovals,
          expectedRevision: report?.revision ?? 0,
        }),
      });
      const data = await readJsonBody<{ error?: string }>(res);
      if (!res.ok) {
        if (res.status === 409) setSaveConflict(true);
        throw new Error(responseErrorMessage(data, 'Failed to save report edits'));
      }
      await load(true);
      setDirtyPages(new Set());
      setReportDataDirty(false);
      setSaveConflict(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save report edits.');
      return false;
    } finally {
      setSaving(false);
    }
  };
  saveChangedPagesRef.current = saveChangedPages;

  useEffect(() => {
    if (!isWorkspace || !hasUnsavedEdits || saving || saveConflict) return;
    const timer = window.setTimeout(() => { void saveChangedPagesRef.current(); }, 800);
    return () => window.clearTimeout(timer);
  }, [draftData, dirtyPages, hasUnsavedEdits, isWorkspace, reportDataDirty, saveConflict, saving]);

  const saveBeforeAction = async (actionLabel: string) => {
    if (!hasUnsavedEdits) return true;
    setError(`Saving edits before ${actionLabel.toLowerCase()}...`);
    const saved = await saveChangedPages();
    if (!saved) return false;
    setError('');
    return true;
  };

  const busyReason = () => {
    if (saving) return 'Saving edits first.';
    if (unlockingProgress) return 'Unlocking stuck job.';
    if (resumingText) return 'Resuming text generation.';
    if (report?.progress_stage) return `Report generation in progress: ${stageLabel(report.progress_stage)}.`;
    if (generatingImages) return 'Image generation is running.';
    if (refreshingSilhouetteProofs) return 'Refreshing silhouette proof images.';
    if (rebuildingReport) return 'Report rebuild is running.';
    if (replacingAllOutfits) return 'Replacing all outfits.';
    if (replacingOutfitPage !== null) return `Replacing outfit on page ${replacingOutfitPage}.`;
    if (editingOutfitPage !== null) return `Editing outfit on page ${editingOutfitPage}.`;
    if (regeneratingPalette) return 'Regenerating palette.';
    if (regeneratingSlotKey) return 'Regenerating an image.';
    if (savingOutfitFeedback) return 'Saving outfit feedback.';
    return '';
  };

  const setBlockedError = (actionLabel: string, reason?: string) => {
    setError(reason ? `${actionLabel} is unavailable: ${reason}` : `${actionLabel} is unavailable right now.`);
  };

  const submitOutfitFeedback = async (feedback: OutfitFeedbackVote | OutfitScienceQaVerdict) => {
    if (!activePageIsOutfit || !activePage) return;
    const blockReason = busyReason();
    if (blockReason) {
      setBlockedError('Outfit feedback', blockReason);
      return;
    }
    const isScienceVerdict = ['PASS', 'PASS_SURPRISE', 'KILL_EYE', 'KILL_WOW', 'KILL_REAL'].includes(feedback);
    let reason = '';
    if (feedback === 'dislike' || (isScienceVerdict && String(feedback).startsWith('KILL'))) {
      reason = window.prompt(
        activeReportUsesScienceHarness
          ? 'What failed in the render or recommendation? This will be stored as science QA, not added to the outfit library.'
          : 'Why is this outfit not good enough? This reason will block similar formulas and guide future recommendations.',
      )?.trim() ?? '';
      if (reason.length < 6) {
        setError('Please add a short reason before saving this outfit feedback.');
        return;
      }
    }

    const saved = await saveChangedPages();
    if (!saved) return;

    setSavingOutfitFeedback(feedback);
    setError('');
    try {
      const res = await fetch(`/api/stylist-blueprint/${reportId}/outfit-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isScienceVerdict
          ? { pageNumber: activePage.page_number, verdict: feedback, reason }
          : { pageNumber: activePage.page_number, vote: feedback, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save outfit feedback');
      setOutfitFeedbackByPage(prev => ({ ...prev, [activePage.page_number]: data.feedback as OutfitFeedbackState }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save outfit feedback.');
    } finally {
      setSavingOutfitFeedback(null);
    }
  };

  const persistApprovals = async (next: Record<string, boolean>) => {
    if (!report) return;
    setReport({ ...report, section_approvals: next });
    const response = await fetch(`/api/stylist-blueprint/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_approvals: next }),
    });
    const data = await readJsonBody<{ report?: Pick<Report, 'revision' | 'section_approvals'>; error?: string }>(response);
    if (!response.ok) {
      setError(responseErrorMessage(data, 'Could not update page approval.'));
      await load(true);
      return;
    }
    setReport(prev => prev ? {
      ...prev,
      section_approvals: data?.report?.section_approvals ?? next,
      revision: data?.report?.revision ?? prev.revision,
    } : prev);
  };

  const setApproval = async (pageNumber: number, approved: boolean) => {
    if (!report) return;
    await persistApprovals({ ...(report.section_approvals ?? {}), [`p${pageNumber}`]: approved });
  };

  const invalidatePages = async (pageNumbers: number[]) => {
    if (!report || !pageNumbers.length) return;
    const next = { ...(report.section_approvals ?? {}) };
    for (const pageNumber of pageNumbers) next[`p${pageNumber}`] = false;
    await persistApprovals(next);
  };

  const toggleCurrentApproval = async () => {
    const blockReason = busyReason();
    if (blockReason) {
      setBlockedError('Approve page', blockReason);
      return;
    }
    const saved = await saveChangedPages();
    if (!saved) return;
    await setApproval(activePageNumber, !report?.section_approvals?.[`p${activePageNumber}`]);
  };

  const approveAndNext = async () => {
    if (!activePage) return;
    const blockReason = busyReason();
    if (blockReason) {
      setBlockedError('Approve and next', blockReason);
      return;
    }
    const saved = await saveChangedPages();
    if (!saved) return;
    await setApproval(activePage.page_number, true);
    const activeIndex = pages.findIndex(page => page.page_number === activePage.page_number);
    const followingPages = pages.slice(activeIndex + 1);
    const next = followingPages.find(page => !report?.section_approvals?.[`p${page.page_number}`]) ?? followingPages[0];
    if (next) {
      setActivePageNumber(next.page_number);
      setViewMode('page');
    }
  };

  const approveAll = async () => {
    if (!versioned || !report) return;
    const blockReason = busyReason();
    if (blockReason) {
      setBlockedError('Approve all', blockReason);
      return;
    }
    const saved = await saveChangedPages();
    if (!saved) return;
    const next = { ...(report.section_approvals ?? {}) };
    for (const page of pages) next[`p${page.page_number}`] = true;
    await persistApprovals(next);
  };

  const generateImages = async (force = false) => {
    if (!versioned) {
      setBlockedError(force ? 'Regenerate images' : 'Missing images', 'A v1 Blueprint report is required.');
      return;
    }
    const blockReason = busyReason();
    if (blockReason) {
      setBlockedError(force ? 'Regenerate images' : 'Missing images', blockReason);
      return;
    }
    setGeneratingImages(true);
    setError('');
    setReport(prev => prev ? {
      ...prev,
      progress_stage: `generating_images_${imageGroup}`,
      error_message: null,
    } : prev);
    try {
      const res = await fetch(`/api/stylist-blueprint/${reportId}/generate-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: imageGroup, force }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Image generation failed');
      if (force) {
        const outfitPages = pages.filter(page => page.page_number >= getStylistBlueprintOutfitStartPage(versioned) && page.page_number <= getStylistBlueprintOutfitEndPage(versioned));
        const capsuleNumber = Number(imageGroup.replace('capsule_', ''));
        const affected = imageGroup === 'all'
          ? pages.map(page => page.page_number)
          : imageGroup === 'diagnosis' || imageGroup === 'prescription' || imageGroup === 'closing'
            ? pages.filter(page => pageGroup(page.page_number, versioned).toLowerCase() === imageGroup).map(page => page.page_number)
            : Number.isInteger(capsuleNumber)
              ? outfitPages.slice((capsuleNumber - 1) * 5, capsuleNumber * 5).map(page => page.page_number)
              : [activePageNumber];
        await invalidatePages(affected);
      }
      await refreshGeneratedImages();
      const statusRes = await fetch(`/api/stylist-blueprint/status/${reportId}`, { cache: 'no-store' });
      if (statusRes.ok) setImageCounts((await statusRes.json()).imageCounts ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image generation failed');
    } finally {
      setGeneratingImages(false);
    }
  };

  const refreshSilhouetteProofs = async () => {
    if (!versioned) {
      setBlockedError('Silhouette proofs', 'A v1 Blueprint report is required.');
      return;
    }
    const blockReason = busyReason();
    if (blockReason) {
      setBlockedError('Silhouette proofs', blockReason);
      return;
    }
    const confirmed = window.confirm(
      'Remove the old silhouette proof images and generate four new client-worn proof images for the Silhouette Rules slide?',
    );
    if (!confirmed) return;
    setRefreshingSilhouetteProofs(true);
    setError('');
    setReport(prev => prev ? {
      ...prev,
      progress_stage: 'generating_images_silhouette_proofs',
      error_message: null,
      image_urls: prev.image_urls ? {
        ...prev.image_urls,
        application: {
          ...(prev.image_urls.application ?? {}),
          silhouetteProofs: [null, null, null, null],
        },
      } : prev.image_urls,
    } : prev);
    try {
      const res = await fetch(`/api/stylist-blueprint/${reportId}/attach-silhouette-examples`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generate_images: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Silhouette proof refresh failed');
      await invalidatePages([getStylistBlueprintRulesStartPage(versioned)]);
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silhouette proof refresh failed');
    } finally {
      setRefreshingSilhouetteProofs(false);
    }
  };

  const unlockProgressStage = async () => {
    if (!report?.progress_stage || unlockingProgress) return;
    const confirmed = window.confirm(
      `Clear the stuck job "${stageLabel(report.progress_stage)}" and unlock this report? Only use this if the job is no longer running.`,
    );
    if (!confirmed) return;
    setUnlockingProgress(true);
    setError('');
    try {
      const res = await fetch(`/api/stylist-blueprint/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clear_progress_stage: true,
          error_message: 'Admin cleared a stuck generation job. Retry the action if needed.',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to unlock report');
      setReport(prev => prev ? {
        ...prev,
        progress_stage: null,
        error_message: 'Admin cleared a stuck generation job. Retry the action if needed.',
        updated_at: new Date().toISOString(),
      } : prev);
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock report.');
    } finally {
      setUnlockingProgress(false);
    }
  };

  const resumeTextGeneration = async () => {
    if (!report || resumingText) return;
    setResumingText(true);
    setError('');
    try {
      const res = await fetch(
        isWorkspace && report.status === 'error'
          ? `/api/stylist-workspace/reports/${reportId}/retry`
          : `/api/stylist-blueprint/${reportId}/resume-text`,
        { method: 'POST' },
      );
      const data = await readJsonBody<{ error?: string; progressStage?: string; status?: string }>(res);
      if (!res.ok) throw new Error(responseErrorMessage(data, 'Failed to resume text generation'));
      setReport(prev => prev ? {
        ...prev,
        status: data?.status === 'already_running' ? prev.status : 'generating',
        progress_stage: data?.progressStage ?? prev.progress_stage ?? 'classifying',
        error_message: null,
        updated_at: new Date().toISOString(),
      } : prev);
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume text generation.');
      await load(true).catch(() => {});
    } finally {
      setResumingText(false);
    }
  };

  const rebuildReport = async () => {
    if (!report?.submission_id) {
      setBlockedError('Rebuild report', 'No intake is attached to this report.');
      return;
    }
    const blockReason = busyReason();
    if (blockReason) {
      setBlockedError('Rebuild report', blockReason);
      return;
    }
    const confirmed = window.confirm(
      'Create a new 55-page Studio report from this intake? The current report will remain available.',
    );
    if (!confirmed) return;
    setRebuildingReport(true);
    setError('');
    try {
      const res = await fetch(`/api/stylist-blueprint/generate/${report.submission_id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Report rebuild failed');
      if (data.reportId) router.push(isWorkspace && workspaceSlug ? `/stylist/${workspaceSlug}/reports/${data.reportId}` : `/stylist/admin/report/${data.reportId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report rebuild failed');
    } finally {
      setRebuildingReport(false);
    }
  };

  const regenerateImageSlot = async (slotKey: StylistBlueprintImageSlotKey) => {
    if (hideContinuationPage && slotKey === 'closing.editTeaser') {
      setBlockedError('Image regeneration', 'Manual reports do not include the ICONIK Edit teaser image.');
      return;
    }
    const blockReason = busyReason();
    if (regeneratingSlotKey || generatingImages || report?.progress_stage || saving) {
      setBlockedError('Image regeneration', blockReason);
      return;
    }
    setRegeneratingSlotKey(slotKey);
    setError('');
    try {
      // Persist any inline card edits first so the image is built from the latest text.
      const saved = await saveBeforeAction('regenerating image');
      if (!saved) return;
      const res = await fetch(`/api/stylist-blueprint/${reportId}/regenerate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Image regeneration failed');
      await invalidatePages([activePageNumber]);
      if (data.imageUrls) {
        setReport(prev => prev ? {
          ...prev,
          image_urls: data.imageUrls,
          error_message: null,
          progress_stage: null,
          updated_at: new Date().toISOString(),
        } : prev);
      }
      const statusRes = await fetch(`/api/stylist-blueprint/status/${reportId}`, { cache: 'no-store' });
      if (statusRes.ok) {
        const status = await statusRes.json();
        setImageCounts(status.imageCounts ?? null);
        setReport(prev => prev ? {
          ...prev,
          status: status.status,
          progress_stage: status.progressStage,
          error_message: status.errorMessage,
          updated_at: status.updatedAt ?? prev.updated_at,
        } : prev);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image regeneration failed');
    } finally {
      setRegeneratingSlotKey(null);
    }
  };

  const replaceCurrentOutfit = async () => {
    if (!versioned || !activePageIsOutfit) {
      setBlockedError('Replace outfit', 'Open an outfit page first.');
      return;
    }
    const blockReason = busyReason();
    if (blockReason) {
      setBlockedError('Replace outfit', blockReason);
      return;
    }
    const reason = outfitInstruction.trim();
    const saved = await saveBeforeAction('replacing outfit');
    if (!saved) return;
    setReplacingOutfitPage(activePageNumber);
    setError('');
    setReport(prev => prev ? {
      ...prev,
      progress_stage: `regenerating_outfit_p${activePageNumber}`,
      error_message: null,
    } : prev);
    try {
      const res = await fetch(`/api/stylist-blueprint/${reportId}/regenerate-outfit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageNumber: activePageNumber, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Outfit replacement failed');
      if (data.report) {
        setReport(prev => prev ? {
          ...prev,
          ...data.report,
          image_urls: data.imageUrls ?? data.report.image_urls ?? prev.image_urls,
          progress_stage: data.report.progress_stage ?? null,
          error_message: data.report.error_message ?? null,
        } : data.report);
      }
      if (data.report?.report_data && isVersionedStylistBlueprintReportData(data.report.report_data)) {
        setDraftData(JSON.parse(JSON.stringify(data.report.report_data)) as StylistBlueprintReportData);
        setDirtyPages(new Set());
      }
      const statusRes = await fetch(`/api/stylist-blueprint/status/${reportId}`, { cache: 'no-store' });
      if (statusRes.ok) setImageCounts((await statusRes.json()).imageCounts ?? null);
      setOutfitInstruction('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Outfit replacement failed');
      await load(true);
    } finally {
      setReplacingOutfitPage(null);
    }
  };

  const editCurrentOutfit = async () => {
    if (!versioned || !activePageIsOutfit) {
      setBlockedError('Edit outfit', 'Open an outfit page first.');
      return;
    }
    const blockReason = busyReason();
    if (blockReason) {
      setBlockedError('Edit outfit', blockReason);
      return;
    }
    const instruction = outfitInstruction.trim();
    if (!instruction) {
      setError('Enter an instruction describing the change you want.');
      return;
    }
    // Persist any inline card edits first so the AI edits the latest text.
    const saved = await saveBeforeAction('editing outfit');
    if (!saved) return;
    setEditingOutfitPage(activePageNumber);
    setError('');
    setReport(prev => prev ? {
      ...prev,
      progress_stage: `editing_outfit_p${activePageNumber}`,
      error_message: null,
    } : prev);
    try {
      const res = await fetch(`/api/stylist-blueprint/${reportId}/edit-outfit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageNumber: activePageNumber, instruction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Outfit edit failed');
      if (data.report) {
        setReport(prev => prev ? {
          ...prev,
          ...data.report,
          image_urls: data.imageUrls ?? data.report.image_urls ?? prev.image_urls,
          progress_stage: data.report.progress_stage ?? null,
          error_message: data.report.error_message ?? null,
        } : data.report);
      }
      if (data.report?.report_data && isVersionedStylistBlueprintReportData(data.report.report_data)) {
        setDraftData(JSON.parse(JSON.stringify(data.report.report_data)) as StylistBlueprintReportData);
        setDirtyPages(new Set());
        setReportDataDirty(false);
      }
      const statusRes = await fetch(`/api/stylist-blueprint/status/${reportId}`, { cache: 'no-store' });
      if (statusRes.ok) setImageCounts((await statusRes.json()).imageCounts ?? null);
      setOutfitInstruction('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Outfit edit failed');
      await load(true);
    } finally {
      setEditingOutfitPage(null);
    }
  };

  const replaceAllOutfits = async () => {
    if (!versioned) {
      setBlockedError('Replace all outfits', 'A v1 Blueprint report is required.');
      return;
    }
    const blockReason = busyReason();
    if (blockReason) {
      setBlockedError('Replace all outfits', blockReason);
      return;
    }
    const confirmed = window.confirm(
      'Replace all outfit text in one generation call, then regenerate all outfit images one by one? Existing outfit images will be replaced.',
    );
    if (!confirmed) return;
    const reason = window.prompt('Optional note for the full outfit replacement:', '');
    if (reason === null) return;
    const saved = await saveBeforeAction('replacing all outfits');
    if (!saved) return;
    setReplacingAllOutfits(true);
    setError('');
    setReport(prev => prev ? {
      ...prev,
      progress_stage: 'regenerating_all_outfit_text',
      error_message: null,
    } : prev);
    try {
      const res = await fetch(`/api/stylist-blueprint/${reportId}/regenerate-all-outfits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'All outfit replacement failed');
      if (data.report) {
        setReport(prev => prev ? {
          ...prev,
          ...data.report,
          image_urls: data.imageUrls ?? data.report.image_urls ?? prev.image_urls,
          progress_stage: data.report.progress_stage ?? null,
          error_message: data.report.error_message ?? null,
        } : data.report);
      }
      if (data.report?.report_data && isVersionedStylistBlueprintReportData(data.report.report_data)) {
        setDraftData(JSON.parse(JSON.stringify(data.report.report_data)) as StylistBlueprintReportData);
        setDirtyPages(new Set());
      }
      // The route replaced all outfit text and cleared every outfit image slot, but
      // intentionally does NOT generate the 20 images itself (that overruns the
      // serverless time limit and leaves half of them missing). Generate them here
      // one capsule group at a time: each request is small, resumable, and finishes
      // well within maxDuration, so nothing times out mid-way.
      for (let group = 1; group <= 4; group++) {
        setReport(prev => prev ? { ...prev, progress_stage: `generating_images_capsule_${group}` } : prev);
        const imgRes = await fetch(`/api/stylist-blueprint/${reportId}/generate-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ group: `capsule_${group}`, force: true }),
        });
        if (!imgRes.ok) {
          const imgErr = await imgRes.json().catch(() => ({}));
          throw new Error(imgErr.error || `Outfit image generation failed for capsule ${group}`);
        }
        await refreshGeneratedImages();
      }
      setReport(prev => prev ? { ...prev, progress_stage: null } : prev);
      const statusRes = await fetch(`/api/stylist-blueprint/status/${reportId}`, { cache: 'no-store' });
      if (statusRes.ok) setImageCounts((await statusRes.json()).imageCounts ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'All outfit replacement failed');
      await load(true);
    } finally {
      setReplacingAllOutfits(false);
    }
  };

  const regeneratePalette = async () => {
    if (!versioned || !activePageIsPalette) {
      setBlockedError('Regenerate palette', 'Open page 9 first.');
      return;
    }
    const blockReason = busyReason();
    if (blockReason) {
      setBlockedError('Regenerate palette', blockReason);
      return;
    }
    const reason = window.prompt('Optional note for the new colour palette:', '');
    if (reason === null) return;
    const saved = await saveBeforeAction('regenerating palette');
    if (!saved) return;
    setRegeneratingPalette(true);
    setError('');
    setReport(prev => prev ? {
      ...prev,
      progress_stage: 'regenerating_colour_palette',
      error_message: null,
    } : prev);
    try {
      const res = await fetch(`/api/stylist-blueprint/${reportId}/regenerate-palette`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Palette regeneration failed');
      if (data.report) {
        setReport(prev => prev ? {
          ...prev,
          ...data.report,
          progress_stage: data.report.progress_stage ?? null,
          error_message: data.report.error_message ?? null,
        } : data.report);
      }
      if (data.report?.report_data && isVersionedStylistBlueprintReportData(data.report.report_data)) {
        setDraftData(JSON.parse(JSON.stringify(data.report.report_data)) as StylistBlueprintReportData);
        setDirtyPages(new Set());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Palette regeneration failed');
      await load(true);
    } finally {
      setRegeneratingPalette(false);
    }
  };

  const sendToClient = async () => {
    const blockingQualityIssue = qualityIssues.find(issue => issue.level === 'error');
    if (isStudioReport && blockingQualityIssue) {
      setBlockedError('Send report', blockingQualityIssue.message);
      setStudioPanel('quality');
      return;
    }
    if (!allApproved) {
      setBlockedError('Send report', 'Approve every page before sending.');
      return;
    }
    if (!requiredImagesDone) {
      setBlockedError('Send report', 'Generate missing images before sending.');
      return;
    }
    const blockReason = busyReason();
    if (blockReason) {
      setBlockedError('Send report', blockReason);
      return;
    }
    const saved = await saveChangedPages();
    if (!saved) return;
    setSending(true);
    setError('');
    try {
      if (isWorkspace) {
        const deliveryRes = await fetch(`/api/stylist-workspace/reports/${reportId}/delivery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'prepare' }),
        });
        const deliveryData = await deliveryRes.json();
        if (!deliveryRes.ok) throw new Error(deliveryData.error || 'Could not prepare WhatsApp delivery');
        setDeliveryPrepared(deliveryData);
        setReport(prev => prev ? { ...prev, status: 'approved', published_at: new Date().toISOString() } : prev);
        return;
      }
      const res = await fetch(`/api/stylist-blueprint/${reportId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send report email');
      if (data.report) {
        setReport(prev => prev ? {
          ...prev,
          status: data.report.status,
          sent_at: data.report.sent_at,
          error_message: data.report.error_message ?? null,
        } : prev);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send report email');
    } finally {
      setSending(false);
    }
  };

  const copyLink = () => {
    if (!report) return;
    navigator.clipboard.writeText(`${window.location.origin}/stylist/report/${report.share_token}`);
    if (isWorkspace) {
      void fetch(`/api/stylist-workspace/reports/${reportId}/delivery`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'copied' }),
      });
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const toggleReportView = () => {
    if (viewMode === 'full') {
      const pageNumber = getVisibleReportPageNumber();
      visiblePageNumberRef.current = pageNumber;
      setActivePageNumber(pageNumber);
      setViewMode('page');
      return;
    }
    pendingFullReportPageRef.current = activePageNumber;
    setViewMode('full');
  };

  const printReport = () => {
    setPrinting(true);
    setViewMode('full');
    window.setTimeout(() => window.print(), 250);
  };

  useEffect(() => {
    const finishPrinting = () => setPrinting(false);
    window.addEventListener('afterprint', finishPrinting);
    return () => window.removeEventListener('afterprint', finishPrinting);
  }, []);

  const logout = async () => {
    await fetch(isWorkspace ? '/api/stylist-workspace/auth/logout' : '/api/iconik-club/admin/logout', { method: 'POST' });
    window.location.href = isWorkspace ? '/stylist/login' : '/stylist/admin/login';
  };

  const openWhatsApp = async () => {
    if (!deliveryPrepared) return;
    await fetch(`/api/stylist-workspace/reports/${reportId}/delivery`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'opened' }),
    });
    window.open(deliveryPrepared.whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const confirmWhatsAppDelivery = async () => {
    setConfirmingDelivery(true);
    setError('');
    try {
      const response = await fetch(`/api/stylist-workspace/reports/${reportId}/delivery`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'confirm' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not confirm delivery');
      setReport(prev => prev ? { ...prev, status: 'delivered', delivered_at: data.deliveredAt } : prev);
      setDeliveryPrepared(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not confirm delivery');
    } finally {
      setConfirmingDelivery(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" style={{ color: S.muted }} /></div>;
  if (!report) return <p className="luxury-body p-8" style={{ color: S.muted }}>Report not found.</p>;

  const currentBusyReason = busyReason();
  const autoSaveHint = hasUnsavedEdits ? 'Unsaved edits will be saved first.' : '';
  const viewTitle = viewMode === 'full'
    ? `Open page ${activePageNumber} in Page View.`
    : `Return to Full Report at page ${activePageNumber}.`;
  const rebuildDisabledReason = !report.submission_id ? 'No intake is attached to this report.' : currentBusyReason;
  const replaceAllDisabledReason = !versioned ? 'A v1 Blueprint report is required.' : currentBusyReason;
  const outfitActionDisabledReason = !activePageIsOutfit ? 'Open an outfit page first.' : currentBusyReason;
  const editOutfitDisabledReason = outfitActionDisabledReason || (!outfitInstruction.trim() ? 'Enter an edit instruction first.' : '');
  const paletteDisabledReason = !activePageIsPalette ? 'Open page 9 first.' : currentBusyReason;
  const imageDisabledReason = !versioned ? 'A v1 Blueprint report is required.' : currentBusyReason;
  const silhouetteProofDisabledReason = imageDisabledReason;
  const recipientEmail = report.stylist_intake_responses?.customer_email?.trim() ?? '';
  const clientDisplayName = report.stylist_intake_responses?.full_name
    || recipientEmail
    || report.stylist_intake_responses?.customer_phone
    || 'Client';
  const sendDisabledReason = !isWorkspace && !recipientEmail
    ? 'No client email is attached to this intake. Use Copy Link instead.'
    : isStudioReport && qualityIssues.some(issue => issue.level === 'error')
      ? qualityIssues.find(issue => issue.level === 'error')?.message ?? 'Resolve report quality checks before delivery.'
    : !allApproved
    ? 'Approve every page before sending.'
    : !requiredImagesDone
      ? 'Generate missing images before sending.'
      : currentBusyReason
        ? currentBusyReason
        : sending
          ? (isWorkspace ? 'Preparing WhatsApp delivery.' : 'Sending report email.')
          : '';
  const saveDisabledReason = saving
    ? 'Saving edits.'
    : !hasUnsavedEdits
      ? 'No unsaved edits.'
      : '';

  return (
    <div className="min-h-screen" style={{ background: S.bg, color: S.ink }}>
      <aside className="fixed left-0 top-0 bottom-0 z-30 w-[310px] border-r flex flex-col" style={{ background: S.card, borderColor: S.border }}>
        <div className="px-6 py-5 border-b" style={{ borderColor: S.border }}>
          <div className="iconik-display" style={{ fontSize: '13px', letterSpacing: '0.32em', color: S.ink }}>I C O N I K</div>
          <div className="iconik-micro mt-1.5" style={{ color: S.muted }}>{isWorkspace ? 'Stylist · Report Review' : 'Admin · Report Review'}</div>
        </div>
        <div className="px-4 py-3 border-b space-y-1" style={{ borderColor: S.border }}>
          <Link href={isWorkspace && workspaceSlug ? `/stylist/${workspaceSlug}/dashboard` : '/stylist/admin/workspace'} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm luxury-body" style={{ color: S.muted }}>
            <LayoutDashboard size={15} /> Blueprints
          </Link>
          {!isWorkspace && <Link href="/stylist/admin/manual" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm luxury-body" style={{ color: S.muted }}>
            <FilePlus2 size={15} /> Manual Reports
          </Link>}
          {!isWorkspace && <Link href="/stylist/admin/edit" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm luxury-body" style={{ color: S.muted }}>
            <Mail size={15} /> ICONIK Edit
          </Link>}
        </div>
        <div className="px-5 py-4 border-b" style={{ borderColor: S.border }}>
          <Link href={isWorkspace && workspaceSlug && report.stylist_intake_responses?.consultation_id
            ? `/stylist/${workspaceSlug}/consultations/${report.stylist_intake_responses.consultation_id}`
            : report.stylist_intake_responses?.consultation_id ? `/stylist/admin/workspace/consultations/${report.stylist_intake_responses.consultation_id}` : `/stylist/admin/dashboard/${report.submission_id}`} className="inline-flex items-center gap-2 text-sm luxury-body mb-3" style={{ color: S.muted }}>
            <ArrowLeft size={14} /> Back to intake
          </Link>
          <h1 className="iconik-display truncate" style={{ fontSize: '22px', color: S.ink }}>
            {clientDisplayName}
          </h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <Pill tone={report.status === 'error' ? 'error' : report.status === 'sent' || report.status === 'delivered' ? 'success' : report.status === 'generating' ? 'gold' : 'slate'}>
              {report.progress_stage ? stageLabel(report.progress_stage) : report.status.replace(/_/g, ' ')}
            </Pill>
            {versioned && <Pill tone={allApproved ? 'success' : 'muted'}>Approved {approvedCount}/{totalPageCount}</Pill>}
            {isLegacyReport && <Pill tone="gold">28-page legacy</Pill>}
          </div>
        </div>
        {versioned && (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="iconik-micro mb-3" style={{ color: S.muted }}>Review Queue</div>
            <div className="space-y-4">
              {['Opening', 'Diagnosis', 'Style Guide', 'Outfits', 'Closing'].map(group => (
                <div key={group}>
                  <p className="iconik-mono mb-1.5" style={{ fontSize: '10px', color: S.muted }}>{group}</p>
                  <div className="space-y-1">
                    {pages.filter(page => pageGroup(page.page_number, reviewData) === group).map(page => {
                      const approved = Boolean(report.section_approvals?.[`p${page.page_number}`]);
                      const active = activePageNumber === page.page_number;
                      const hidden = Boolean(reviewData?.studio?.hidden_page_numbers?.includes(page.page_number));
                      return (
                        <button
                          key={page.page_number}
                          onClick={() => {
                            setActivePageNumber(page.page_number);
                            setViewMode('page');
                          }}
                          className="w-full grid grid-cols-[1fr_auto] items-center gap-2 rounded-xl px-3 py-2.5 text-left transition"
                          style={{
                            background: active ? S.ink : 'transparent',
                            color: active ? S.bg : S.muted,
                            border: `1px solid ${active ? S.ink : S.border}`,
                          }}
                        >
                          <span className="iconik-mono truncate" style={{ fontSize: '11px' }}>{String(page.page_number).padStart(2, '0')} - {page.title}</span>
                          <span className="rounded-full px-2 py-0.5 iconik-micro" style={{ background: approved ? `${S.success}18` : S.bg, color: approved ? S.success : S.muted }}>
                            {hidden ? 'Hidden' : approved ? 'OK' : 'Open'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {imageCounts && (
              <div className="mt-5 rounded-2xl border p-4 space-y-2" style={{ background: S.bg, borderColor: S.border }}>
                <div className="iconik-micro" style={{ color: S.muted }}>Images</div>
                {Object.entries(imageCounts).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <span className="iconik-mono capitalize" style={{ fontSize: '10px', color: S.muted }}>{key.replace(/_/g, ' ')}</span>
                    <Pill tone={value.done >= value.total ? 'success' : 'gold'}>{value.done}/{value.total}</Pill>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
              <div className="iconik-micro mb-1" style={{ color: S.muted }}>Women Blueprint Report</div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="luxury-body text-lg" style={{ color: S.ink, fontWeight: 500 }}>
                  {viewMode === 'full' ? 'Full report' : activePage ? `Page ${activePage.page_number}: ${activePage.title || 'Untitled'}` : 'Report'}
                </h2>
                {imageCounts && <Pill tone={requiredImagesDone ? 'success' : 'gold'}>Images {Object.values(imageCounts).reduce((sum, group) => sum + group.done, 0)}/{Object.values(imageCounts).reduce((sum, group) => sum + group.total, 0)}</Pill>}
              </div>
              {report.error_message && <p className="luxury-body text-sm mt-2" style={{ color: S.error }}>{report.error_message}</p>}
              {error && <p className="luxury-body text-sm mt-2" style={{ color: S.error }}>{error}</p>}
              {isLegacyReport && (
                <p className="luxury-body text-sm mt-2" style={{ color: S.muted }}>
                  This is an older 28-page report. Use Rebuild 36-page Report to regenerate text with 20 outfits and the current outfit library.
                </p>
              )}
            </div>
            <div className="admin-toolbar">
              <div className="admin-toolbar-group">
                <span className="admin-toolbar-label">View</span>
                <ActionButton onClick={toggleReportView} tone={viewMode === 'full' ? 'primary' : 'neutral'} title={viewTitle}>
                  {viewMode === 'full' ? `Page View · ${activePageNumber}` : 'Full Report'}
                </ActionButton>
                <ActionButton onClick={copyLink} title="Copy the public report link.">
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Link'}
                </ActionButton>
                <ActionButton onClick={printReport} title="Open the browser print dialog to save the full report as a PDF.">
                  <Printer size={14} /> Print / PDF
                </ActionButton>
              </div>

              {isStudioReport && (
                <div className="admin-toolbar-group">
                  <span className="admin-toolbar-label">Studio</span>
                  <ActionButton onClick={() => openStudioPanel('analysis')} tone={reviewData?.studio?.analysis_confirmed ? 'success' : 'neutral'} title="Review and confirm the automated analysis.">
                    <CheckCheck size={14} /> Analysis
                  </ActionButton>
                  <ActionButton onClick={() => openStudioPanel(activePageIsOutfit ? 'outfit' : 'pages')} title="Edit the current module or outfit in a structured workspace.">
                    <PanelRight size={14} /> {activePageIsOutfit ? 'Outfit Editor' : 'Page Tools'}
                  </ActionButton>
                  <ActionButton onClick={() => openStudioPanel('visuals')} title="Copy image prompts and upload images created in any external tool.">
                    <ImageIcon size={14} /> Image Prompts
                  </ActionButton>
                  <ActionButton onClick={() => openStudioPanel('quality')} tone={qualityIssues.some(issue => issue.level === 'error') ? 'danger' : 'success'} title="Run the report quality checks.">
                    <WandSparkles size={14} /> Quality {qualityIssues.length}
                  </ActionButton>
                  <ActionButton onClick={undoLastChange} disabled={!undoStack.length} title={undoStack.length ? 'Undo the last Studio edit.' : 'No Studio edit to undo.'}>
                    <Undo2 size={14} /> Undo
                  </ActionButton>
                </div>
              )}

              <div className="admin-toolbar-group">
                <span className="admin-toolbar-label">Report</span>
                {report.progress_stage && (
                  <ActionButton
                    onClick={resumeTextGeneration}
                    disabled={resumingText}
                    title={isWorkspace && report.status === 'error' ? 'Retry the failed durable report job from its completed checkpoints.' : 'Resume text generation in this report and skip pages that already exist.'}
                    tone="primary"
                  >
                    {resumingText ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {resumingText ? 'Resuming...' : isWorkspace && report.status === 'error' ? 'Retry Generation' : 'Resume Text'}
                  </ActionButton>
                )}
                {report.progress_stage && (
                  <ActionButton
                    onClick={unlockProgressStage}
                    disabled={unlockingProgress || resumingText}
                    title={`Clear stuck stage: ${stageLabel(report.progress_stage)}.`}
                    tone="danger"
                  >
                    {unlockingProgress ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {unlockingProgress ? 'Unlocking...' : 'Unlock Stuck Job'}
                  </ActionButton>
                )}
                <ActionButton
                  onClick={rebuildReport}
                  disabled={Boolean(rebuildDisabledReason)}
                  title={rebuildDisabledReason || 'Create a fresh report from this intake.'}
                  tone="primary"
                >
                  {rebuildingReport ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  {rebuildingReport ? 'Rebuilding...' : 'Rebuild Studio Report'}
                </ActionButton>
                {versioned && (
                  <ActionButton
                    onClick={replaceAllOutfits}
                    disabled={Boolean(replaceAllDisabledReason)}
                    title={replaceAllDisabledReason || autoSaveHint || 'Replace all outfit text and regenerate outfit images.'}
                    tone="primary"
                  >
                    {replacingAllOutfits ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {replacingAllOutfits ? 'Replacing all...' : 'Replace All Outfits'}
                  </ActionButton>
                )}
                {activePageIsPalette && (
                  <ActionButton
                    onClick={regeneratePalette}
                    disabled={Boolean(paletteDisabledReason)}
                    title={paletteDisabledReason || autoSaveHint || 'Regenerate the colour palette.'}
                    tone="primary"
                  >
                    {regeneratingPalette ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {regeneratingPalette ? 'Regenerating...' : 'Regenerate Palette'}
                  </ActionButton>
                )}
              </div>

              {!isWorkspace && !isStudioReport && <div className="admin-toolbar-group">
                <span className="admin-toolbar-label">Images</span>
                <select
                  value={imageGroup}
                  onChange={event => setImageGroup(event.target.value as StylistBlueprintImageGroup)}
                  disabled={Boolean(imageDisabledReason)}
                  title={imageDisabledReason || 'Choose which image group to generate.'}
                  className="admin-toolbar-select luxury-body"
                  style={{ background: S.card, color: S.ink, border: `1px solid ${S.border}` }}
                >
                  {imageGroups.map(group => <option key={group.value} value={group.value}>{group.label}</option>)}
                </select>
                <ActionButton
                  onClick={() => generateImages(false)}
                  disabled={Boolean(imageDisabledReason)}
                  title={imageDisabledReason || 'Generate missing images for the selected group.'}
                >
                  {generatingImages ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                  {generatingImages ? 'Generating...' : 'Missing Images'}
                </ActionButton>
                <ActionButton
                  onClick={() => generateImages(true)}
                  disabled={Boolean(imageDisabledReason)}
                  title={imageDisabledReason || 'Regenerate images for the selected group.'}
                >
                  <RefreshCw size={14} /> Regenerate Images
                </ActionButton>
                <ActionButton
                  onClick={refreshSilhouetteProofs}
                  disabled={Boolean(silhouetteProofDisabledReason)}
                  title={silhouetteProofDisabledReason || 'Remove old silhouette proof flatlays and generate new client-worn proof images.'}
                >
                  {refreshingSilhouetteProofs ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  {refreshingSilhouetteProofs ? 'Refreshing...' : 'Refresh Silhouette Proofs'}
                </ActionButton>
              </div>}

              {activePageIsOutfit && (
                <div className="admin-toolbar-group admin-toolbar-group-wide">
                  <span className="admin-toolbar-label">Outfit</span>
                  <input
                    type="text"
                    value={outfitInstruction}
                    onChange={event => setOutfitInstruction(event.target.value)}
                    placeholder="Edit: 'swap the tote for a black clutch' · Replace: 'make it burgundy, no blazer'"
                    disabled={Boolean(currentBusyReason)}
                    title={currentBusyReason || 'Optional note for outfit edit or replacement.'}
                    className="admin-outfit-input luxury-body"
                    style={{ background: S.card, color: S.ink, border: `1px solid ${S.border}` }}
                  />
                  <ActionButton
                    onClick={editCurrentOutfit}
                    disabled={Boolean(editOutfitDisabledReason)}
                    title={editOutfitDisabledReason || autoSaveHint || 'Edit this outfit using your instruction.'}
                    tone="primary"
                  >
                    {editingOutfitPage === activePageNumber ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {editingOutfitPage === activePageNumber ? 'Editing...' : 'Edit with AI'}
                  </ActionButton>
                  <ActionButton
                    onClick={replaceCurrentOutfit}
                    disabled={Boolean(outfitActionDisabledReason)}
                    title={outfitActionDisabledReason || autoSaveHint || 'Replace this outfit.'}
                    tone="neutral"
                  >
                    {replacingOutfitPage === activePageNumber ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {replacingOutfitPage === activePageNumber ? 'Replacing...' : 'Replace Outfit'}
                  </ActionButton>
                  {activeReportUsesScienceHarness ? (
                    <>
                      <ActionButton
                        onClick={() => submitOutfitFeedback('PASS')}
                        disabled={Boolean(currentBusyReason)}
                        title={currentBusyReason || 'Mark this science outfit as passing QA.'}
                        tone={currentOutfitFeedback?.verdict === 'PASS' ? 'success' : 'neutral'}
                      >
                        {savingOutfitFeedback === 'PASS' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Pass
                      </ActionButton>
                      <ActionButton
                        onClick={() => submitOutfitFeedback('PASS_SURPRISE')}
                        disabled={Boolean(currentBusyReason)}
                        title={currentBusyReason || 'Mark this as a surprising pass worth reviewing as a new enabler.'}
                        tone={currentOutfitFeedback?.verdict === 'PASS_SURPRISE' ? 'success' : 'neutral'}
                      >
                        {savingOutfitFeedback === 'PASS_SURPRISE' ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                        Surprise
                      </ActionButton>
                      <ActionButton
                        onClick={() => submitOutfitFeedback('KILL_EYE')}
                        disabled={Boolean(currentBusyReason)}
                        title={currentBusyReason || 'Render fails the visual eye test.'}
                        tone={currentOutfitFeedback?.verdict === 'KILL_EYE' ? 'danger' : 'neutral'}
                      >
                        {savingOutfitFeedback === 'KILL_EYE' ? <Loader2 size={14} className="animate-spin" /> : <ThumbsDown size={14} />}
                        Eye
                      </ActionButton>
                      <ActionButton
                        onClick={() => submitOutfitFeedback('KILL_WOW')}
                        disabled={Boolean(currentBusyReason)}
                        title={currentBusyReason || 'Correct but not strong enough for ICONIK.'}
                        tone={currentOutfitFeedback?.verdict === 'KILL_WOW' ? 'danger' : 'neutral'}
                      >
                        {savingOutfitFeedback === 'KILL_WOW' ? <Loader2 size={14} className="animate-spin" /> : <ThumbsDown size={14} />}
                        Wow
                      </ActionButton>
                      <ActionButton
                        onClick={() => submitOutfitFeedback('KILL_REAL')}
                        disabled={Boolean(currentBusyReason)}
                        title={currentBusyReason || 'Too hard to source or execute.'}
                        tone={currentOutfitFeedback?.verdict === 'KILL_REAL' ? 'danger' : 'neutral'}
                      >
                        {savingOutfitFeedback === 'KILL_REAL' ? <Loader2 size={14} className="animate-spin" /> : <ThumbsDown size={14} />}
                        Real
                      </ActionButton>
                      {currentOutfitFeedback?.verdict === 'PASS' && <Pill tone="success">QA Pass</Pill>}
                      {currentOutfitFeedback?.verdict === 'PASS_SURPRISE' && <Pill tone="success">Surprise Pass</Pill>}
                      {currentOutfitFeedback?.verdict?.startsWith('KILL') && <Pill tone="error">{currentOutfitFeedback.verdict.replace('_', ' ')}</Pill>}
                    </>
                  ) : (
                    <>
                      <ActionButton
                        onClick={() => submitOutfitFeedback('like')}
                        disabled={Boolean(currentBusyReason)}
                        title={currentBusyReason || 'Save this outfit as a good recommendation.'}
                        tone={currentOutfitFeedback?.vote === 'like' ? 'success' : 'neutral'}
                      >
                        {savingOutfitFeedback === 'like' ? <Loader2 size={14} className="animate-spin" /> : <ThumbsUp size={14} />}
                        {savingOutfitFeedback === 'like' ? 'Saving...' : 'Like'}
                      </ActionButton>
                      <ActionButton
                        onClick={() => submitOutfitFeedback('dislike')}
                        disabled={Boolean(currentBusyReason)}
                        title={currentBusyReason || 'Block this outfit logic from future recommendations.'}
                        tone={currentOutfitFeedback?.vote === 'dislike' ? 'danger' : 'neutral'}
                      >
                        {savingOutfitFeedback === 'dislike' ? <Loader2 size={14} className="animate-spin" /> : <ThumbsDown size={14} />}
                        {savingOutfitFeedback === 'dislike' ? 'Saving...' : 'Dislike'}
                      </ActionButton>
                      {currentOutfitFeedback?.vote === 'like' && <Pill tone="success">Learned</Pill>}
                      {currentOutfitFeedback?.vote === 'dislike' && <Pill tone="error">Blocked</Pill>}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {!report.report_data ? (
          <div className="p-10 luxury-body" style={{ color: S.muted }}>
            {report.status === 'generating' ? stageLabel(report.progress_stage) : 'No report data yet.'}
          </div>
        ) : !versioned ? (
          <div className="p-8">
            <p className="luxury-body text-sm mb-4" style={{ color: S.muted }}>Legacy Blueprint report. Viewable, but page-level editing requires v1.</p>
            <StylistBlueprintReport
              data={report.report_data}
              imageUrls={report.image_urls}
              hideContinuationPage={hideContinuationPage}
            />
          </div>
        ) : !reviewData ? (
          <div className="p-10 luxury-body" style={{ color: S.muted }}>No report data yet.</div>
        ) : (
          <div className="px-8 py-8 pb-40">
            <div ref={reportCanvasRef} className="mx-auto max-w-[1120px] rounded-2xl overflow-hidden" style={{ background: S.ink }}>
              <StylistBlueprintReport
                data={reviewData}
                imageUrls={report.image_urls}
                focusPageNumber={viewMode === 'page' ? activePageNumber : undefined}
                hideContinuationPage={hideContinuationPage}
                editable={!printing}
                onPageChange={handlePageChange}
                onReportDataChange={handleReportDataChange}
                onImageRegenerate={isStudioReport ? undefined : regenerateImageSlot}
                regeneratingImageSlot={regeneratingSlotKey}
                imageRegenerationDisabled={generatingImages || replacingOutfitPage !== null || replacingAllOutfits || regeneratingPalette || Boolean(report.progress_stage)}
              />
            </div>
          </div>
        )}
      </main>

      {versioned && (
        <footer className="fixed bottom-0 left-[310px] right-0 z-30 border-t px-8 py-3 backdrop-blur" style={{ background: 'rgba(244,239,229,0.96)', borderColor: S.border }}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={report.section_approvals?.[`p${activePageNumber}`] ? 'success' : 'gold'}>
                Page {activePageNumber} {report.section_approvals?.[`p${activePageNumber}`] ? 'approved' : 'open'}
              </Pill>
              <span className="luxury-body text-xs" style={{ color: S.muted }}>
                {hasUnsavedEdits
                  ? saveConflict
                    ? 'A newer revision exists. Reload the report before editing again.'
                    : isWorkspace && saving
                      ? 'Saving changes...'
                      : `${dirtyPages.size} page${dirtyPages.size === 1 ? '' : 's'} waiting to save.`
                  : isWorkspace
                    ? 'All changes saved.'
                    : 'Click report text to edit in the original design.'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={saveChangedPages} disabled={Boolean(saveDisabledReason)} title={saveDisabledReason || 'Save inline report edits.'}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {saving ? 'Saving...' : 'Save Edits'}
              </ActionButton>
              <ActionButton
                onClick={toggleCurrentApproval}
                disabled={Boolean(currentBusyReason)}
                title={currentBusyReason || autoSaveHint || 'Toggle approval for the current page.'}
                tone="success"
              >
                <Check size={14} /> {report.section_approvals?.[`p${activePageNumber}`] ? 'Unapprove' : 'Approve'}
              </ActionButton>
              <ActionButton
                onClick={approveAndNext}
                disabled={Boolean(currentBusyReason)}
                title={currentBusyReason || autoSaveHint || 'Approve this page and move to the next page.'}
                tone="success"
              >
                <CheckCheck size={14} /> Approve and Next
              </ActionButton>
              <ActionButton
                onClick={approveAll}
                disabled={Boolean(currentBusyReason)}
                title={currentBusyReason || autoSaveHint || 'Approve every page.'}
                tone="success"
              >
                <CheckCheck size={14} /> Approve All
              </ActionButton>
              <ActionButton onClick={sendToClient} disabled={Boolean(sendDisabledReason)} title={sendDisabledReason || (isWorkspace ? 'Publish and prepare WhatsApp delivery.' : 'Send the report email to the client.')} tone="primary">
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} {sending ? (isWorkspace ? 'Preparing...' : 'Sending...') : isWorkspace ? (report.status === 'delivered' ? 'Resend on WhatsApp' : 'Publish & Deliver') : report.status === 'sent' || report.sent_at ? 'Resend' : 'Send'}
              </ActionButton>
            </div>
          </div>
        </footer>
      )}

      {studioPanel && reviewData && (
        <div className="studio-drawer fixed right-0 top-0 bottom-0 z-[70] w-full max-w-[470px] overflow-y-auto border-l" style={{ background: S.bg, borderColor: S.border, boxShadow: '-24px 0 70px rgba(44,38,34,.18)' }}>
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b px-6 py-5" style={{ background: 'rgba(244,239,229,.97)', borderColor: S.border }}>
            <div>
              <div className="iconik-micro" style={{ color: S.gold }}>REPORT STUDIO</div>
              <h3 className="iconik-display text-2xl mt-1" style={{ color: S.ink }}>
                {studioPanel === 'analysis' ? 'Analysis Review' : studioPanel === 'outfit' ? 'Outfit Editor' : studioPanel === 'visuals' ? 'Images & Prompts' : studioPanel === 'quality' ? 'Quality Check' : 'Page Tools'}
              </h3>
            </div>
            <button onClick={() => setStudioPanel(null)} className="rounded-full p-2" aria-label="Close Studio panel" style={{ background: S.card, color: S.muted }}><X size={18} /></button>
          </div>

          <div className="p-6 space-y-5">
            {studioPanel === 'analysis' && (
              <>
                <p className="luxury-body text-sm leading-6" style={{ color: S.muted }}>Check the automated findings against the client images and intake. These values drive the report language.</p>
                {([
                  ['silhouette_profile', 'Body shape / silhouette'],
                  ['chromatic_family', 'Colour family'],
                  ['facial_architecture', 'Face shape / architecture'],
                  ['style_direction', 'Style direction'],
                ] as const).map(([field, label]) => (
                  <label key={field} className="block">
                    <span className="iconik-micro block mb-2" style={{ color: S.muted }}>{label}</span>
                    <textarea value={String(reviewData.analysis[field] ?? '')} onChange={event => updateAnalysisField(field, event.target.value)} rows={field === 'facial_architecture' ? 3 : 2} className="studio-field w-full rounded-xl border p-3 luxury-body text-sm" style={{ background: S.card, color: S.ink, borderColor: S.border }} />
                  </label>
                ))}
                <div className="rounded-2xl border p-4" style={{ background: S.card, borderColor: S.border }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="luxury-body text-sm" style={{ color: S.ink }}>Stylist confirmation</div>
                      <div className="luxury-body text-xs mt-1" style={{ color: S.muted }}>{reviewData.studio?.analysis_confirmed ? 'Confirmed. Any later analysis edit should be reviewed again.' : 'Required before this report can be delivered.'}</div>
                    </div>
                    <Pill tone={reviewData.studio?.analysis_confirmed ? 'success' : 'gold'}>{reviewData.studio?.analysis_confirmed ? 'Confirmed' : 'Pending'}</Pill>
                  </div>
                </div>
                <ActionButton onClick={confirmAnalysis} tone="success" title="Confirm the automated analysis after checking it."><CheckCheck size={14} /> Confirm Analysis</ActionButton>
              </>
            )}

            {studioPanel === 'outfit' && activePage && (
              <>
                <p className="luxury-body text-sm leading-6" style={{ color: S.muted }}>Write freely inside the labelled structure. Each formula line uses: slot | piece | colour | hex | role | fit or styling note.</p>
                <textarea value={outfitDraft} onChange={event => setOutfitDraft(event.target.value)} rows={22} spellCheck className="studio-field studio-code w-full rounded-2xl border p-4 text-xs leading-6" style={{ background: S.card, color: S.ink, borderColor: S.border }} />
                <div className="flex flex-wrap gap-2">
                  <ActionButton onClick={applyFormattedOutfit} tone="primary" title="Turn this draft into the report's designed outfit layout."><WandSparkles size={14} /> Auto Format</ActionButton>
                  <ActionButton onClick={() => { setOutfitInstruction('Polish the wording while preserving every garment, colour, coverage requirement and styling decision.'); setStudioPanel(null); }} title="Prepare a precise instruction for the existing AI outfit editor."><RefreshCw size={14} /> Prepare AI Polish</ActionButton>
                </div>
                <p className="luxury-body text-xs leading-5" style={{ color: S.muted }}>Auto Format is deterministic and adds no AI cost. “Prepare AI Polish” places a safe instruction in the outfit toolbar for an optional rewrite.</p>
              </>
            )}

            {studioPanel === 'pages' && activePage && (
              <>
                <div className="rounded-2xl border p-5" style={{ background: S.card, borderColor: S.border }}>
                  <div className="iconik-micro" style={{ color: S.muted }}>CURRENT MODULE</div>
                  <div className="luxury-body mt-2" style={{ color: S.ink }}>Page {activePage.page_number}: {activePage.title}</div>
                  <div className="luxury-body text-xs mt-2" style={{ color: S.muted }}>Hidden pages stay editable here but are removed from the client link and PDF.</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <ActionButton onClick={toggleActivePageVisibility} disabled={activePage.page_number === 1} title={activePage.page_number === 1 ? 'The cover must remain visible.' : 'Show or hide this page in the delivered report.'}>
                    {reviewData.studio?.hidden_page_numbers?.includes(activePage.page_number) ? <Eye size={14} /> : <EyeOff size={14} />}
                    {reviewData.studio?.hidden_page_numbers?.includes(activePage.page_number) ? 'Show' : 'Hide'}
                  </ActionButton>
                  <ActionButton onClick={() => updateStudioData(data => moveStudioPage(data, activePage.page_number, -1))} title="Move this page earlier in the report."><MoveUp size={14} /> Earlier</ActionButton>
                  <ActionButton onClick={() => updateStudioData(data => moveStudioPage(data, activePage.page_number, 1))} title="Move this page later in the report."><MoveDown size={14} /> Later</ActionButton>
                </div>
              </>
            )}

            {studioPanel === 'visuals' && (
              <>
                <p className="luxury-body text-sm leading-6" style={{ color: S.muted }}>Copy a production-ready prompt into your preferred image tool, then upload the finished image into the same slot. ICONIK does not call an image API in this workflow.</p>
                {loadingPrompts && <div className="flex items-center gap-2 luxury-body text-sm" style={{ color: S.muted }}><Loader2 size={15} className="animate-spin" /> Loading prompts…</div>}
                <div className="space-y-4">
                  {manualPrompts.map(item => (
                    <div key={item.slotKey} className="rounded-2xl border p-4" style={{ background: S.card, borderColor: S.border }}>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <div className="luxury-body text-sm" style={{ color: S.ink }}>{item.label}</div>
                          <div className="iconik-mono text-[10px] mt-1" style={{ color: S.muted }}>{item.size}{item.currentUrl ? ' · image uploaded' : ' · image needed'}</div>
                        </div>
                        <Pill tone={item.currentUrl ? 'success' : 'gold'}>{item.currentUrl ? 'Ready' : 'Empty'}</Pill>
                      </div>
                      {item.currentUrl && <img src={item.currentUrl} alt="" className="h-32 w-full rounded-xl object-cover mb-3" />}
                      <textarea readOnly value={item.prompt} rows={6} className="studio-field w-full rounded-xl border p-3 luxury-body text-xs leading-5" style={{ background: S.bg, color: S.muted, borderColor: S.border }} />
                      <div className="flex flex-wrap gap-2 mt-3">
                        <ActionButton onClick={() => { void navigator.clipboard.writeText(item.prompt); setCopiedPrompt(item.slotKey); window.setTimeout(() => setCopiedPrompt(null), 1400); }} title="Copy this image prompt.">
                          {copiedPrompt === item.slotKey ? <Check size={14} /> : <Copy size={14} />} {copiedPrompt === item.slotKey ? 'Copied' : 'Copy Prompt'}
                        </ActionButton>
                        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 luxury-body text-sm" style={{ borderColor: S.border, color: S.ink }}>
                          {uploadingSlot === item.slotKey ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} {uploadingSlot === item.slotKey ? 'Uploading…' : item.currentUrl ? 'Replace Image' : 'Upload Image'}
                          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={Boolean(uploadingSlot)} onChange={event => { void uploadManualImage(item.slotKey, event.target.files?.[0] ?? null); event.currentTarget.value = ''; }} />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {studioPanel === 'quality' && (
              <>
                <div className="rounded-2xl border p-5" style={{ background: qualityIssues.some(issue => issue.level === 'error') ? `${S.error}0D` : `${S.success}0D`, borderColor: qualityIssues.some(issue => issue.level === 'error') ? `${S.error}55` : `${S.success}55` }}>
                  <div className="iconik-display text-xl" style={{ color: S.ink }}>{qualityIssues.length ? `${qualityIssues.length} item${qualityIssues.length === 1 ? '' : 's'} to review` : 'Report checks passed'}</div>
                  <p className="luxury-body text-xs mt-2" style={{ color: S.muted }}>Checks cover analysis confirmation, missing pages, empty content, placeholders, outfit structure and duplicate formulas.</p>
                </div>
                <div className="space-y-2">
                  {qualityIssues.map((issue, index) => (
                    <button key={`${issue.page ?? 'report'}-${index}`} onClick={() => { if (issue.page) { setActivePageNumber(issue.page); setViewMode('page'); } }} className="w-full rounded-xl border p-4 text-left" style={{ background: S.card, borderColor: S.border }}>
                      <div className="flex gap-3">
                        <Pill tone={issue.level === 'error' ? 'error' : 'gold'}>{issue.level}</Pill>
                        <div className="luxury-body text-sm" style={{ color: S.ink }}>{issue.page ? `Page ${issue.page}: ` : ''}{issue.message}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {deliveryPrepared && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-5" style={{ background: 'rgba(44,38,34,.56)' }}>
          <div className="w-full max-w-lg rounded-3xl p-7 md:p-8" style={{ background: S.bg, border: `1px solid ${S.border}`, boxShadow: '0 24px 80px rgba(44,38,34,.24)' }}>
            <div className="iconik-micro mb-2" style={{ color: S.gold }}>REPORT PUBLISHED</div>
            <h3 className="iconik-display text-3xl" style={{ color: S.ink }}>Deliver on WhatsApp</h3>
            <p className="luxury-body text-sm leading-6 mt-3" style={{ color: S.muted }}>
              The private report link is ready{deliveryPrepared.clientName ? ` for ${deliveryPrepared.clientName}` : ''}. Open WhatsApp, send the prepared message, then return here to confirm delivery.
            </p>
            <div className="rounded-2xl p-4 mt-5 break-all luxury-body text-xs" style={{ background: S.card, color: S.muted, border: `1px solid ${S.border}` }}>
              {deliveryPrepared.reportUrl}
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-6">
              <button onClick={() => void openWhatsApp()} className="rounded-xl px-5 py-3.5 luxury-body text-sm flex items-center justify-center gap-2" style={{ background: '#2F7D4A', color: '#fff' }}>
                <Send size={15} /> Open WhatsApp
              </button>
              <button onClick={() => void confirmWhatsAppDelivery()} disabled={confirmingDelivery} className="rounded-xl px-5 py-3.5 luxury-body text-sm flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: S.ink, color: S.bg }}>
                {confirmingDelivery ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />} Mark Delivered
              </button>
            </div>
            <button onClick={() => setDeliveryPrepared(null)} className="w-full mt-3 rounded-xl px-5 py-3 luxury-body text-sm" style={{ color: S.muted }}>Close and confirm later</button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .admin-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }
        .admin-toolbar-group {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          min-height: 44px;
          padding: 6px;
          border: 1px solid ${S.border};
          border-radius: 16px;
          background: rgba(237, 229, 210, 0.46);
        }
        .admin-toolbar-group-wide {
          flex: 1 1 620px;
          justify-content: flex-end;
        }
        .admin-toolbar-label {
          padding: 0 4px;
          color: ${S.muted};
          font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .admin-toolbar-select,
        .admin-outfit-input {
          min-height: 40px;
          border-radius: 12px;
          padding: 8px 12px;
          font-size: 14px;
          outline: none;
        }
        .admin-toolbar-select:disabled,
        .admin-outfit-input:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .admin-outfit-input {
          flex: 1 1 340px;
          min-width: min(340px, 100%);
        }
        .admin-toolbar button {
          min-height: 40px;
          white-space: nowrap;
        }
        .iconik-report .iconik-page {
          scroll-margin-top: 122px;
        }
        @media (max-width: 1280px) {
          .admin-toolbar {
            justify-content: flex-start;
          }
          .admin-toolbar-group,
          .admin-toolbar-group-wide {
            flex: 1 1 100%;
            justify-content: flex-start;
          }
        }
        @media (max-width: 1000px) {
          aside.fixed {
            position: relative;
            width: 100%;
            height: auto;
          }
          main.min-h-screen {
            padding-left: 0;
          }
          footer.fixed {
            left: 0;
            position: sticky;
            bottom: 0;
          }
          .admin-toolbar {
            align-items: stretch;
          }
          .admin-toolbar-group {
            align-items: stretch;
          }
          .admin-toolbar button,
          .admin-toolbar-select,
          .admin-outfit-input {
            width: 100%;
            justify-content: center;
          }
        }
        @media print {
          aside.fixed, header.sticky, footer.fixed, .studio-drawer { display: none !important; }
          main.min-h-screen { padding-left: 0 !important; }
          main .px-8.py-8 { padding: 0 !important; }
          main .max-w-\[1120px\] { max-width: none !important; border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
}
