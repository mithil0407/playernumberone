'use client';

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Copy,
  FilePlus2,
  ImageIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  Save,
  Send,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { ActionButton, Pill, reviewTheme as S } from '@/components/AdminReviewWorkspace';
import StylistBlueprintReport from '@/components/StylistBlueprintReport';
import type { LegacyStylistBlueprintReportData, StylistBlueprintReportData } from '@/lib/stylistBlueprintGenerator';
import {
  STYLIST_BLUEPRINT_LEGACY_VERSION,
  getStylistBlueprintContinuationPage,
  getStylistBlueprintOutfitEndPage,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintPageCount,
  getStylistBlueprintPalettePage,
  isVersionedStylistBlueprintReportData,
} from '@/lib/stylistBlueprintSchema';
import type { ResolvedStylistBlueprintImageUrls, StylistBlueprintImageGroup, StylistBlueprintImageSlotKey } from '@/lib/stylistBlueprintImageGenerator';

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
  stylist_intake_responses: { customer_email: string | null; customer_phone: string | null; full_name: string | null; intake_source?: string | null } | null;
}

type OutfitFeedbackVote = 'like' | 'dislike';

interface OutfitFeedbackState {
  id: string;
  vote: OutfitFeedbackVote;
  reason?: string | null;
  library_entry_id?: string | null;
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
  return intake?.intake_source === 'manual_admin';
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
  if (pageNumber <= 3) return 'Opening';
  if (pageNumber <= 8) return 'Diagnosis';
  if (pageNumber <= 12) return 'Prescription';
  if (pageNumber <= getStylistBlueprintOutfitEndPage(data)) return 'Outfits';
  return 'Closing';
}

function stageLabel(stage: string | null) {
  return stage ? stage.replace(/_/g, ' ') : 'Ready';
}

export default function StylistBlueprintAdminReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = use(params);
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePageNumber, setActivePageNumber] = useState(1);
  const [viewMode, setViewMode] = useState<'page' | 'full'>('full');
  const [draftData, setDraftData] = useState<StylistBlueprintReportData | null>(null);
  const [dirtyPages, setDirtyPages] = useState<Set<number>>(() => new Set());
  const [reportDataDirty, setReportDataDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [rebuildingReport, setRebuildingReport] = useState(false);
  const [regeneratingSlotKey, setRegeneratingSlotKey] = useState<StylistBlueprintImageSlotKey | null>(null);
  const [replacingOutfitPage, setReplacingOutfitPage] = useState<number | null>(null);
  const [editingOutfitPage, setEditingOutfitPage] = useState<number | null>(null);
  const [outfitInstruction, setOutfitInstruction] = useState('');
  const [outfitFeedbackByPage, setOutfitFeedbackByPage] = useState<Record<number, OutfitFeedbackState | null>>({});
  const [savingOutfitFeedback, setSavingOutfitFeedback] = useState<OutfitFeedbackVote | null>(null);
  const [replacingAllOutfits, setReplacingAllOutfits] = useState(false);
  const [regeneratingPalette, setRegeneratingPalette] = useState(false);
  const [imageGroup, setImageGroup] = useState<StylistBlueprintImageGroup>('all');
  const [sending, setSending] = useState(false);
  const [unlockingProgress, setUnlockingProgress] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [imageCounts, setImageCounts] = useState<Record<string, { done: number; total: number }> | null>(null);
  const unsavedEditsRef = useRef(false);
  const reportCanvasRef = useRef<HTMLDivElement | null>(null);
  const visiblePageNumberRef = useRef(1);
  const pendingFullReportPageRef = useRef<number | null>(null);

  const load = useCallback(async (fresh = false) => {
    const res = await fetch(`/api/stylist-blueprint/${reportId}${fresh ? '?fresh=1' : ''}`, { cache: 'no-store' });
    const data = await readJsonBody<{ report?: Report; error?: string }>(res);
    if (!res.ok) throw new Error(responseErrorMessage(data, 'Failed to load report'));
    if (data?.report) setReport(data.report);
    const statusRes = await fetch(`/api/stylist-blueprint/status/${reportId}`, { cache: 'no-store' });
    if (statusRes.ok) {
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
    setReport(prev => prev ? {
      ...prev,
      status: loadedReport.status,
      progress_stage: loadedReport.progress_stage,
      error_message: loadedReport.error_message,
      image_urls: loadedReport.image_urls,
      updated_at: loadedReport.updated_at,
    } : loadedReport);
  }, [reportId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    unsavedEditsRef.current = dirtyPages.size > 0 || reportDataDirty;
  }, [dirtyPages.size, reportDataDirty]);

  useEffect(() => {
    if (!generatingImages && report?.status !== 'generating' && !report?.progress_stage) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/stylist-blueprint/status/${reportId}`, { cache: 'no-store' });
      if (!res.ok) return;
      const status = await res.json();
      setImageCounts(status.imageCounts ?? null);
      setReport(prev => prev ? {
        ...prev,
        status: status.status,
        progress_stage: status.progressStage,
        error_message: status.errorMessage,
      } : prev);
      await refreshGeneratedImages();
      if (!unsavedEditsRef.current && status.status !== 'generating' && !status.progressStage) void load(true);
    }, 3000);
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
    if (!hideContinuationPage || !reviewData) return rawPages;
    const continuationPage = getStylistBlueprintContinuationPage(reviewData);
    return rawPages.filter(page => page.page_number !== continuationPage);
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
  const hasUnsavedEdits = dirtyPages.size > 0 || reportDataDirty;
  const currentOutfitFeedback = outfitFeedbackByPage[activePageNumber] ?? null;
  const imageGroups = hideContinuationPage
    ? IMAGE_GROUPS.filter(group => group.value !== 'closing')
    : IMAGE_GROUPS;

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

  const handlePageChange = (page: StylistBlueprintReportData['pages'][number]) => {
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
    setDraftData(data);
    setReportDataDirty(true);
  };

  const saveChangedPages = async () => {
    if (!draftData || !hasUnsavedEdits) return true;
    setSaving(true);
    setError('');
    try {
      if (reportDataDirty) {
        const res = await fetch(`/api/stylist-blueprint/${reportId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report_data: draftData }),
        });
        const data = await readJsonBody<{ error?: string }>(res);
        if (!res.ok) throw new Error(responseErrorMessage(data, 'Failed to save report edits'));
      } else {
        for (const pageNumber of Array.from(dirtyPages)) {
          const page = draftData.pages.find(item => item.page_number === pageNumber);
          if (!page) continue;
          const res = await fetch(`/api/stylist-blueprint/${reportId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page }),
          });
          const data = await readJsonBody<{ error?: string }>(res);
          if (!res.ok) throw new Error(responseErrorMessage(data, `Failed to save page ${pageNumber}`));
        }
      }
      await load(true);
      setDirtyPages(new Set());
      setReportDataDirty(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save report edits.');
      return false;
    } finally {
      setSaving(false);
    }
  };

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
    if (report?.progress_stage) return `Report generation in progress: ${stageLabel(report.progress_stage)}.`;
    if (generatingImages) return 'Image generation is running.';
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

  const submitOutfitFeedback = async (vote: OutfitFeedbackVote) => {
    if (!activePageIsOutfit || !activePage) return;
    const blockReason = busyReason();
    if (blockReason) {
      setBlockedError('Outfit feedback', blockReason);
      return;
    }
    let reason = '';
    if (vote === 'dislike') {
      reason = window.prompt('Why is this outfit not good enough? This reason will block similar formulas and guide future recommendations.')?.trim() ?? '';
      if (reason.length < 6) {
        setError('Please add a short reason before disliking an outfit.');
        return;
      }
    }

    const saved = await saveChangedPages();
    if (!saved) return;

    setSavingOutfitFeedback(vote);
    setError('');
    try {
      const res = await fetch(`/api/stylist-blueprint/${reportId}/outfit-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageNumber: activePage.page_number, vote, reason }),
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

  const setApproval = async (pageNumber: number, approved: boolean) => {
    if (!report) return;
    const next = { ...(report.section_approvals ?? {}), [`p${pageNumber}`]: approved };
    setReport({ ...report, section_approvals: next });
    await fetch(`/api/stylist-blueprint/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_approvals: next }),
    });
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
    const next = pages.find(page => page.page_number > activePage.page_number && !report?.section_approvals?.[`p${page.page_number}`])
      ?? pages.find(page => page.page_number > activePage.page_number);
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
    const next = Object.fromEntries(Array.from({ length: totalPageCount }, (_, index) => [`p${index + 1}`, true]));
    setReport({ ...report, section_approvals: next });
    await fetch(`/api/stylist-blueprint/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_approvals: next }),
    });
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
      await refreshGeneratedImages();
      const statusRes = await fetch(`/api/stylist-blueprint/status/${reportId}`, { cache: 'no-store' });
      if (statusRes.ok) setImageCounts((await statusRes.json()).imageCounts ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image generation failed');
    } finally {
      setGeneratingImages(false);
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
      'Create a new 36-page report from this intake using the latest outfit library? The current report will remain available.',
    );
    if (!confirmed) return;
    setRebuildingReport(true);
    setError('');
    try {
      const res = await fetch(`/api/stylist-blueprint/generate/${report.submission_id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Report rebuild failed');
      if (data.reportId) router.push(`/stylist/admin/report/${data.reportId}`);
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

  const logout = async () => {
    await fetch('/api/iconik-club/admin/logout', { method: 'POST' });
    window.location.href = '/stylist/admin/login';
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
  const recipientEmail = report.stylist_intake_responses?.customer_email?.trim() ?? '';
  const clientDisplayName = report.stylist_intake_responses?.full_name
    || recipientEmail
    || report.stylist_intake_responses?.customer_phone
    || 'Client';
  const sendDisabledReason = !recipientEmail
    ? 'No client email is attached to this intake. Use Copy Link instead.'
    : !allApproved
    ? 'Approve every page before sending.'
    : !requiredImagesDone
      ? 'Generate missing images before sending.'
      : currentBusyReason
        ? currentBusyReason
        : sending
          ? 'Sending report email.'
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
          <div className="iconik-micro mt-1.5" style={{ color: S.muted }}>Stylist - Review</div>
        </div>
        <div className="px-4 py-3 border-b space-y-1" style={{ borderColor: S.border }}>
          <Link href="/stylist/admin/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm luxury-body" style={{ color: S.muted }}>
            <LayoutDashboard size={15} /> Blueprints
          </Link>
          <Link href="/stylist/admin/manual" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm luxury-body" style={{ color: S.muted }}>
            <FilePlus2 size={15} /> Manual Reports
          </Link>
          <Link href="/stylist/admin/edit" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm luxury-body" style={{ color: S.muted }}>
            <Mail size={15} /> ICONIK Edit
          </Link>
        </div>
        <div className="px-5 py-4 border-b" style={{ borderColor: S.border }}>
          <Link href={`/stylist/admin/dashboard/${report.submission_id}`} className="inline-flex items-center gap-2 text-sm luxury-body mb-3" style={{ color: S.muted }}>
            <ArrowLeft size={14} /> Back to intake
          </Link>
          <h1 className="iconik-display truncate" style={{ fontSize: '22px', color: S.ink }}>
            {clientDisplayName}
          </h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <Pill tone={report.status === 'error' ? 'error' : report.status === 'sent' ? 'success' : report.status === 'generating' ? 'gold' : 'slate'}>
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
              {['Opening', 'Diagnosis', 'Prescription', 'Outfits', 'Closing'].map(group => (
                <div key={group}>
                  <p className="iconik-mono mb-1.5" style={{ fontSize: '10px', color: S.muted }}>{group}</p>
                  <div className="space-y-1">
                    {pages.filter(page => pageGroup(page.page_number, reviewData) === group).map(page => {
                      const approved = Boolean(report.section_approvals?.[`p${page.page_number}`]);
                      const active = activePageNumber === page.page_number;
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
                            {approved ? 'OK' : 'Open'}
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
              </div>

              <div className="admin-toolbar-group">
                <span className="admin-toolbar-label">Report</span>
                {report.progress_stage && (
                  <ActionButton
                    onClick={unlockProgressStage}
                    disabled={unlockingProgress}
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
                  {rebuildingReport ? 'Rebuilding...' : 'Rebuild 36-page'}
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

              <div className="admin-toolbar-group">
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
              </div>

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
                editable
                onPageChange={handlePageChange}
                onReportDataChange={handleReportDataChange}
                onImageRegenerate={regenerateImageSlot}
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
                  ? `${dirtyPages.size + (reportDataDirty ? 1 : 0)} report area${dirtyPages.size + (reportDataDirty ? 1 : 0) === 1 ? '' : 's'} with unsaved edits.`
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
              <ActionButton onClick={sendToClient} disabled={Boolean(sendDisabledReason)} title={sendDisabledReason || 'Send the report email to the client.'} tone="primary">
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} {sending ? 'Sending...' : report.status === 'sent' || report.sent_at ? 'Resend' : 'Send'}
              </ActionButton>
            </div>
          </div>
        </footer>
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
      `}</style>
    </div>
  );
}
