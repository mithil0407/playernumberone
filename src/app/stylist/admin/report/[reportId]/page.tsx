'use client';

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Copy,
  ImageIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  Save,
  Send,
} from 'lucide-react';
import { ActionButton, Pill, reviewTheme as S } from '@/components/AdminReviewWorkspace';
import StylistBlueprintReport from '@/components/StylistBlueprintReport';
import type { LegacyStylistBlueprintReportData, StylistBlueprintReportData } from '@/lib/stylistBlueprintGenerator';
import {
  STYLIST_BLUEPRINT_LEGACY_VERSION,
  getStylistBlueprintOutfitEndPage,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintPageCount,
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
  stylist_intake_responses: { customer_email: string; customer_phone: string | null; full_name: string | null } | null;
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
  const [replacingAllOutfits, setReplacingAllOutfits] = useState(false);
  const [regeneratingPalette, setRegeneratingPalette] = useState(false);
  const [imageGroup, setImageGroup] = useState<StylistBlueprintImageGroup>('all');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [imageCounts, setImageCounts] = useState<Record<string, { done: number; total: number }> | null>(null);
  const unsavedEditsRef = useRef(false);

  const load = useCallback(async (fresh = false) => {
    const res = await fetch(`/api/stylist-blueprint/${reportId}${fresh ? '?fresh=1' : ''}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.report) setReport(data.report);
    const statusRes = await fetch(`/api/stylist-blueprint/status/${reportId}`, { cache: 'no-store' });
    if (statusRes.ok) setImageCounts((await statusRes.json()).imageCounts ?? null);
    setLoading(false);
  }, [reportId]);

  const refreshGeneratedImages = useCallback(async () => {
    const res = await fetch(`/api/stylist-blueprint/${reportId}?fresh=1`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.report) return;
    setReport(prev => prev ? {
      ...prev,
      status: data.report.status,
      progress_stage: data.report.progress_stage,
      error_message: data.report.error_message,
      image_urls: data.report.image_urls,
      updated_at: data.report.updated_at,
    } : data.report);
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
  const pages = useMemo(() => reviewData?.pages ?? [], [reviewData]);
  const activePage = pages.find(page => page.page_number === activePageNumber) ?? pages[0] ?? null;
  const totalPageCount = reviewData?.pages.length || (versioned ? getStylistBlueprintPageCount(versioned) : 0);
  const approvedCount = versioned ? pages.filter(page => report?.section_approvals?.[`p${page.page_number}`]).length : 0;
  const allApproved = versioned ? totalPageCount > 0 && approvedCount === totalPageCount : false;
  const requiredImagesDone = imageCounts ? Object.values(imageCounts).every(group => group.done >= group.total) : true;
  const activePageIsOutfit = Boolean(
    versioned &&
    activePageNumber >= getStylistBlueprintOutfitStartPage() &&
    activePageNumber <= getStylistBlueprintOutfitEndPage(versioned),
  );
  const activePageIsPalette = Boolean(versioned && activePageNumber === 9);
  const hasUnsavedEdits = dirtyPages.size > 0 || reportDataDirty;

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
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save report edits');
      } else {
        for (const pageNumber of Array.from(dirtyPages)) {
          const page = draftData.pages.find(item => item.page_number === pageNumber);
          if (!page) continue;
          const res = await fetch(`/api/stylist-blueprint/${reportId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `Failed to save page ${pageNumber}`);
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
    const saved = await saveChangedPages();
    if (!saved) return;
    await setApproval(activePageNumber, !report?.section_approvals?.[`p${activePageNumber}`]);
  };

  const approveAndNext = async () => {
    if (!activePage) return;
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

  const rebuildReport = async () => {
    if (!report?.submission_id || rebuildingReport) return;
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
    if (regeneratingSlotKey || generatingImages || report?.progress_stage) return;
    setRegeneratingSlotKey(slotKey);
    setError('');
    try {
      // Persist any inline card edits first so the image is built from the latest text.
      if (hasUnsavedEdits) {
        const saved = await saveChangedPages();
        if (!saved) return;
      }
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
    if (!versioned || !activePageIsOutfit || replacingOutfitPage || replacingAllOutfits || generatingImages || report?.progress_stage || hasUnsavedEdits) return;
    const reason = outfitInstruction.trim();
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
    if (!versioned || !activePageIsOutfit || editingOutfitPage || replacingOutfitPage || replacingAllOutfits || generatingImages || report?.progress_stage) return;
    const instruction = outfitInstruction.trim();
    if (!instruction) {
      setError('Enter an instruction describing the change you want.');
      return;
    }
    // Persist any inline card edits first so the AI edits the latest text.
    if (hasUnsavedEdits) {
      const saved = await saveChangedPages();
      if (!saved) return;
    }
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
    if (!versioned || replacingAllOutfits || replacingOutfitPage || regeneratingPalette || generatingImages || report?.progress_stage || hasUnsavedEdits) return;
    const confirmed = window.confirm(
      'Replace all outfit text in one generation call, then regenerate all outfit images one by one? Existing outfit images will be replaced.',
    );
    if (!confirmed) return;
    const reason = window.prompt('Optional note for the full outfit replacement:', '');
    if (reason === null) return;
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
    if (!versioned || !activePageIsPalette || regeneratingPalette || replacingAllOutfits || generatingImages || report?.progress_stage || hasUnsavedEdits) return;
    const reason = window.prompt('Optional note for the new colour palette:', '');
    if (reason === null) return;
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
    if (!allApproved || !requiredImagesDone) return;
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

  const logout = async () => {
    await fetch('/api/iconik-club/admin/logout', { method: 'POST' });
    window.location.href = '/stylist/admin/login';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" style={{ color: S.muted }} /></div>;
  if (!report) return <p className="luxury-body p-8" style={{ color: S.muted }}>Report not found.</p>;

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
          <Link href="/stylist/admin/edit" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm luxury-body" style={{ color: S.muted }}>
            <Mail size={15} /> ICONIK Edit
          </Link>
        </div>
        <div className="px-5 py-4 border-b" style={{ borderColor: S.border }}>
          <Link href={`/stylist/admin/dashboard/${report.submission_id}`} className="inline-flex items-center gap-2 text-sm luxury-body mb-3" style={{ color: S.muted }}>
            <ArrowLeft size={14} /> Back to intake
          </Link>
          <h1 className="iconik-display truncate" style={{ fontSize: '22px', color: S.ink }}>
            {report.stylist_intake_responses?.full_name || report.stylist_intake_responses?.customer_email || 'Client'}
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
            <div className="flex flex-wrap items-center gap-2">
              <select value={imageGroup} onChange={event => setImageGroup(event.target.value as StylistBlueprintImageGroup)} className="rounded-xl px-3 py-2 text-sm luxury-body outline-none" style={{ background: S.card, color: S.ink, border: `1px solid ${S.border}` }}>
                {IMAGE_GROUPS.map(group => <option key={group.value} value={group.value}>{group.label}</option>)}
              </select>
              <ActionButton onClick={() => setViewMode(viewMode === 'full' ? 'page' : 'full')} tone={viewMode === 'full' ? 'primary' : 'neutral'}>
                {viewMode === 'full' ? 'Page View' : 'Full Report'}
              </ActionButton>
              <ActionButton onClick={rebuildReport} disabled={!report?.submission_id || rebuildingReport || replacingAllOutfits || regeneratingPalette || generatingImages || Boolean(report?.progress_stage)} tone="primary">
                {rebuildingReport ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Rebuild 36-page Report
              </ActionButton>
              {versioned && (
                <ActionButton
                  onClick={replaceAllOutfits}
                  disabled={replacingAllOutfits || replacingOutfitPage !== null || regeneratingPalette || generatingImages || rebuildingReport || Boolean(regeneratingSlotKey) || Boolean(report?.progress_stage) || hasUnsavedEdits}
                  tone="primary"
                >
                  {replacingAllOutfits ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Replace All Outfits
                </ActionButton>
              )}
              {activePageIsOutfit && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={outfitInstruction}
                    onChange={event => setOutfitInstruction(event.target.value)}
                    placeholder="Edit: 'swap the tote for a black clutch' · Replace: 'make it burgundy, no blazer'"
                    disabled={replacingOutfitPage !== null || editingOutfitPage !== null || Boolean(report?.progress_stage)}
                    className="rounded-xl px-3 py-2 text-sm luxury-body outline-none"
                    style={{ background: S.card, color: S.ink, border: `1px solid ${S.border}`, minWidth: '340px' }}
                  />
                  <ActionButton
                    onClick={editCurrentOutfit}
                    disabled={editingOutfitPage !== null || replacingOutfitPage !== null || replacingAllOutfits || regeneratingPalette || generatingImages || rebuildingReport || Boolean(regeneratingSlotKey) || Boolean(report?.progress_stage) || !outfitInstruction.trim()}
                    tone="primary"
                  >
                    {editingOutfitPage === activePageNumber ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Edit with AI
                  </ActionButton>
                  <ActionButton
                    onClick={replaceCurrentOutfit}
                    disabled={replacingOutfitPage !== null || editingOutfitPage !== null || replacingAllOutfits || regeneratingPalette || generatingImages || rebuildingReport || Boolean(regeneratingSlotKey) || Boolean(report?.progress_stage) || hasUnsavedEdits}
                    tone="neutral"
                  >
                    {replacingOutfitPage === activePageNumber ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Replace Outfit
                  </ActionButton>
                </div>
              )}
              {activePageIsPalette && (
                <ActionButton
                  onClick={regeneratePalette}
                  disabled={regeneratingPalette || replacingAllOutfits || replacingOutfitPage !== null || generatingImages || rebuildingReport || Boolean(regeneratingSlotKey) || Boolean(report?.progress_stage) || hasUnsavedEdits}
                  tone="primary"
                >
                  {regeneratingPalette ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Regenerate Palette
                </ActionButton>
              )}
              <ActionButton onClick={() => generateImages(false)} disabled={!versioned || generatingImages || replacingAllOutfits || regeneratingPalette || rebuildingReport || Boolean(regeneratingSlotKey)}>
                {generatingImages ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />} Missing Images
              </ActionButton>
              <ActionButton onClick={() => generateImages(true)} disabled={!versioned || generatingImages || replacingAllOutfits || regeneratingPalette || rebuildingReport || Boolean(regeneratingSlotKey)}>
                <RefreshCw size={14} /> Regenerate Images
              </ActionButton>
              <ActionButton onClick={copyLink}>
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Link'}
              </ActionButton>
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
            <StylistBlueprintReport data={report.report_data} imageUrls={report.image_urls} />
          </div>
        ) : !reviewData ? (
          <div className="p-10 luxury-body" style={{ color: S.muted }}>No report data yet.</div>
        ) : (
          <div className="px-8 py-8 pb-28">
            <div className="mx-auto max-w-[1120px] rounded-2xl overflow-hidden" style={{ background: S.ink }}>
              <StylistBlueprintReport
                data={reviewData}
                imageUrls={report.image_urls}
                focusPageNumber={viewMode === 'page' ? activePageNumber : undefined}
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
              <ActionButton onClick={saveChangedPages} disabled={saving || !hasUnsavedEdits}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Edits
              </ActionButton>
              <ActionButton onClick={toggleCurrentApproval} disabled={saving} tone="success">
                <Check size={14} /> {report.section_approvals?.[`p${activePageNumber}`] ? 'Unapprove' : 'Approve'}
              </ActionButton>
              <ActionButton onClick={approveAndNext} tone="success">
                <CheckCheck size={14} /> Approve and Next
              </ActionButton>
              <ActionButton onClick={approveAll} tone="success">
                <CheckCheck size={14} /> Approve All
              </ActionButton>
              <ActionButton onClick={sendToClient} disabled={!allApproved || !requiredImagesDone || sending} tone="primary">
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} {report.status === 'sent' || report.sent_at ? 'Resend' : 'Send'}
              </ActionButton>
            </div>
          </div>
        </footer>
      )}

      <style jsx global>{`
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
          }
        }
      `}</style>
    </div>
  );
}
