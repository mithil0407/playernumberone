'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  FileJson,
  ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Send,
  SkipForward,
  Trash2,
} from 'lucide-react';
import { ActionButton, FieldLabel, Pill, ReviewCard, TextArea, TextInput, reviewTheme as S } from '@/components/AdminReviewWorkspace';
import StyleEditIssuePage from '@/components/StyleEditIssuePage';
import type { StyleEditOutfitFormula, StyleEditPageData } from '@/lib/styleEditTypes';

interface Issue {
  id: string;
  profile_id: string;
  subscription_id: string;
  week_start: string;
  issue_number: number;
  status: string;
  progress_stage: string | null;
  topic_plan: { title?: string; theme?: string; rationale?: string; focusAreas?: string[] };
  page_data: StyleEditPageData | null;
  image_urls: { heroCard?: string | null; outfitCards?: (string | null)[]; paletteCard?: string | null } | null;
  share_token: string;
  approval_state: Record<string, boolean>;
  sent_at: string | null;
  error_message: string | null;
  style_edit_client_profiles: { customer_email: string; customer_name: string | null; profile_summary: string | null } | null;
}

type ReviewSection = 'direction' | 'outfits' | 'rules' | 'reply' | 'json';

const SECTIONS: Array<{ id: ReviewSection; label: string }> = [
  { id: 'direction', label: 'Direction' },
  { id: 'outfits', label: 'Outfits' },
  { id: 'rules', label: 'Palette + Rules' },
  { id: 'reply', label: 'Reply Prompt' },
];

function cloneData(data: StyleEditPageData): StyleEditPageData {
  return JSON.parse(JSON.stringify(data)) as StyleEditPageData;
}

function linesToArray(value: string) {
  return value.split('\n').map(item => item.trim()).filter(Boolean);
}

function arrayToLines(value: string[] | undefined) {
  return (value ?? []).join('\n');
}

function validateIssueData(data: StyleEditPageData) {
  if (!data.issueTitle?.trim()) throw new Error('Issue title is required.');
  if (!data.clientName?.trim()) throw new Error('Client name is required.');
  if (!Array.isArray(data.outfits)) throw new Error('Outfits must be an array.');
  if (!Array.isArray(data.paletteNotes)) throw new Error('Palette notes must be an array.');
  if (!Array.isArray(data.shoppingRules)) throw new Error('Shopping rules must be an array.');
  if (!Array.isArray(data.avoidThisWeek)) throw new Error('Avoid list must be an array.');
}

function imageStatus(issue: Issue, data: StyleEditPageData | null) {
  const outfitTarget = Math.max(3, data?.outfits?.length ?? 0);
  const outfitDone = (issue.image_urls?.outfitCards ?? []).filter(Boolean).length;
  return [
    { label: 'Hero', done: issue.image_urls?.heroCard ? 1 : 0, total: 1 },
    { label: 'Outfits', done: outfitDone, total: outfitTarget },
    { label: 'Palette', done: issue.image_urls?.paletteCard ? 1 : 0, total: 1 },
  ];
}

function SectionPreview({
  section,
  data,
}: {
  section: ReviewSection;
  data: StyleEditPageData;
}) {
  if (section === 'outfits') {
    return (
      <div className="space-y-3">
        {data.outfits.map((outfit, index) => (
          <div key={`${outfit.title}-${index}`} className="rounded-xl border p-4" style={{ background: '#fff', borderColor: S.border }}>
            <p className="iconik-mono mb-2" style={{ fontSize: '10px', color: S.gold }}>{outfit.occasion || `Look ${index + 1}`}</p>
            <h3 className="luxury-body text-lg mb-2" style={{ color: S.ink, fontWeight: 500 }}>{outfit.title}</h3>
            <p className="luxury-body text-sm leading-6 mb-2" style={{ color: S.muted }}>{outfit.formula}</p>
            <p className="luxury-body text-sm leading-6" style={{ color: S.muted }}><strong style={{ color: S.ink }}>Colour:</strong> {outfit.colourLogic}</p>
            <p className="luxury-body text-sm leading-6 mt-2" style={{ color: S.muted }}>{outfit.stylingNotes}</p>
          </div>
        ))}
      </div>
    );
  }
  if (section === 'rules') {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4" style={{ background: '#fff', borderColor: S.border }}>
          <p className="iconik-micro mb-3" style={{ color: S.muted }}>Palette + Shopping</p>
          <ul className="space-y-2 luxury-body text-sm leading-6" style={{ color: S.ink }}>
            {[...data.paletteNotes, ...data.shoppingRules].map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>
        <div className="rounded-xl border p-4" style={{ background: S.panel, borderColor: S.border }}>
          <p className="iconik-micro mb-3" style={{ color: S.muted }}>Avoid This Week</p>
          <ul className="space-y-2 luxury-body text-sm leading-6" style={{ color: S.ink }}>
            {data.avoidThisWeek.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>
      </div>
    );
  }
  if (section === 'reply') {
    return (
      <div className="rounded-xl border p-6 text-center" style={{ background: '#fff', borderColor: S.border }}>
        <p className="luxury-body text-2xl" style={{ color: S.ink, fontWeight: 500 }}>{data.replyPrompt}</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border p-5" style={{ background: '#fff', borderColor: S.border }}>
      <p className="iconik-micro mb-3" style={{ color: S.gold }}>THE ICONIK EDIT - {data.weekLabel}</p>
      <h2 className="luxury-body text-3xl mb-3" style={{ color: S.ink, fontWeight: 500 }}>{data.clientName}&apos;s {data.issueTitle}</h2>
      <p className="luxury-body text-base leading-7 mb-5" style={{ color: S.muted }}>{data.subtitle}</p>
      <p className="luxury-body text-sm leading-7" style={{ color: S.ink }}>{data.diagnosis}</p>
    </div>
  );
}

export default function StyleEditIssueReviewPage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = use(params);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [draft, setDraft] = useState<StyleEditPageData | null>(null);
  const [advancedJson, setAdvancedJson] = useState('');
  const [activeSection, setActiveSection] = useState<ReviewSection>('direction');
  const [fullPreview, setFullPreview] = useState(false);
  const [paletteText, setPaletteText] = useState('');
  const [shoppingText, setShoppingText] = useState('');
  const [avoidText, setAvoidText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/stylist-edit/admin/issues/${issueId}`, { cache: 'no-store' });
    const data = await res.json();
    const nextIssue = data.issue ?? null;
    setIssue(nextIssue);
    if (nextIssue?.page_data) {
      const nextDraft = cloneData(nextIssue.page_data);
      setDraft(nextDraft);
      setAdvancedJson(JSON.stringify(nextDraft, null, 2));
      setPaletteText(arrayToLines(nextDraft.paletteNotes));
      setShoppingText(arrayToLines(nextDraft.shoppingRules));
      setAvoidText(arrayToLines(nextDraft.avoidThisWeek));
    }
    setLoading(false);
  }, [issueId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!issue || !['generating', 'sending'].includes(issue.status)) return;
    const interval = setInterval(() => { void load(); }, 3000);
    return () => clearInterval(interval);
  }, [issue, load]);

  const images = useMemo(() => issue ? imageStatus(issue, draft) : [], [issue, draft]);
  const imagesComplete = images.every(item => item.done >= item.total);

  const action = async (name: string, fn: () => Promise<Response>) => {
    setWorking(name);
    setError('');
    try {
      const res = await fn();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || `${name} failed`);
      await load();
    } finally {
      setWorking('');
    }
  };

  const updateDraft = (patch: Partial<StyleEditPageData>) => {
    setDraft(prev => prev ? { ...prev, ...patch } : prev);
  };

  const updateOutfit = (index: number, patch: Partial<StyleEditOutfitFormula>) => {
    setDraft(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        outfits: prev.outfits.map((outfit, outfitIndex) => outfitIndex === index ? { ...outfit, ...patch } : outfit),
      };
    });
  };

  const addOutfit = () => {
    setDraft(prev => prev ? {
      ...prev,
      outfits: [...prev.outfits, { title: '', occasion: '', formula: '', colourLogic: '', stylingNotes: '' }],
    } : prev);
  };

  const removeOutfit = (index: number) => {
    setDraft(prev => prev ? { ...prev, outfits: prev.outfits.filter((_, outfitIndex) => outfitIndex !== index) } : prev);
  };

  const currentData = () => {
    if (activeSection === 'json') {
      const parsed = JSON.parse(advancedJson) as StyleEditPageData;
      validateIssueData(parsed);
      return parsed;
    }
    if (!draft) throw new Error('No issue data to save.');
    const next = {
      ...draft,
      paletteNotes: linesToArray(paletteText),
      shoppingRules: linesToArray(shoppingText),
      avoidThisWeek: linesToArray(avoidText),
    };
    validateIssueData(next);
    return next;
  };

  const openJsonEditor = () => {
    try {
      const pageData = currentData();
      setAdvancedJson(JSON.stringify(pageData, null, 2));
      setActiveSection('json');
      setFullPreview(false);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Issue data is invalid.');
    }
  };

  const leaveJsonEditor = (section: ReviewSection) => {
    if (activeSection !== 'json') {
      setActiveSection(section);
      setFullPreview(false);
      return;
    }
    try {
      const parsed = JSON.parse(advancedJson) as StyleEditPageData;
      validateIssueData(parsed);
      setDraft(parsed);
      setPaletteText(arrayToLines(parsed.paletteNotes));
      setShoppingText(arrayToLines(parsed.shoppingRules));
      setAvoidText(arrayToLines(parsed.avoidThisWeek));
      setActiveSection(section);
      setFullPreview(false);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Advanced JSON is invalid.');
    }
  };

  const saveIssue = async () => {
    setWorking('save');
    setError('');
    try {
      const pageData = currentData();
      const res = await fetch(`/api/stylist-edit/admin/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_data: pageData }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Save failed');
      await load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Issue data is invalid.');
      return false;
    } finally {
      setWorking('');
    }
  };

  const approve = async () => {
    const saved = await saveIssue();
    if (!saved) return;
    await action('approve', () => fetch(`/api/stylist-edit/admin/issues/${issueId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved', approval_state: { issue: true, images: imagesComplete } }),
    }));
  };

  const copyLink = () => {
    if (!issue) return;
    navigator.clipboard.writeText(`${window.location.origin}/stylist/edit/${issue.share_token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin" style={{ color: S.muted }} /></div>;
  if (!issue) return <p className="luxury-body" style={{ color: S.muted }}>Issue not found.</p>;

  return (
    <div className="pb-24">
      <Link href="/stylist/admin/edit" className="inline-flex items-center gap-2 text-sm mb-6 luxury-body" style={{ color: S.muted }}>
        <ArrowLeft size={14} /> Back to ICONIK Edit
      </Link>

      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 mb-5">
        <div>
          <div className="iconik-micro mb-2" style={{ color: S.muted }}>Edit Issue Review</div>
          <h1 className="iconik-display" style={{ fontSize: '24px', color: S.ink }}>
            {draft?.issueTitle || issue.topic_plan?.title || `Issue ${issue.issue_number}`}
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Pill tone={issue.status === 'error' ? 'error' : issue.status === 'sent' ? 'success' : issue.status === 'generating' ? 'gold' : 'slate'}>
              {issue.status}{issue.progress_stage ? ` - ${issue.progress_stage}` : ''}
            </Pill>
            <Pill tone={issue.approval_state?.issue ? 'success' : 'gold'}>{issue.approval_state?.issue ? 'Issue approved' : 'Needs review'}</Pill>
            <Pill tone={imagesComplete ? 'success' : 'gold'}>Images {images.reduce((sum, item) => sum + item.done, 0)}/{images.reduce((sum, item) => sum + item.total, 0)}</Pill>
          </div>
          <p className="luxury-body text-sm mt-2" style={{ color: S.muted, fontWeight: 300 }}>
            {issue.style_edit_client_profiles?.customer_email}
          </p>
          {issue.error_message && <p className="luxury-body text-xs mt-2" style={{ color: S.error }}>{issue.error_message}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={() => action('generate', () => fetch(`/api/stylist-edit/admin/issues/${issueId}/generate`, { method: 'POST' }))} disabled={Boolean(working)}>
            {working === 'generate' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Generate
          </ActionButton>
          <ActionButton onClick={() => action('images', () => fetch(`/api/stylist-edit/admin/issues/${issueId}/generate-images`, { method: 'POST' }))} disabled={!draft || Boolean(working)}>
            {working === 'images' ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />} Images
          </ActionButton>
          <ActionButton onClick={copyLink}>
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Link'}
          </ActionButton>
        </div>
      </div>

      {error && <p className="luxury-body text-sm mb-4 rounded-xl px-4 py-3" style={{ color: S.error, background: `${S.error}10`, border: `1px solid ${S.error}25` }}>{error}</p>}

      {!draft ? (
        <ReviewCard className="p-12 text-center">
          <p className="luxury-body mb-4" style={{ color: S.muted }}>No page data yet. Generate the issue first.</p>
          <ActionButton onClick={() => action('generate', () => fetch(`/api/stylist-edit/admin/issues/${issueId}/generate`, { method: 'POST' }))} disabled={Boolean(working)} tone="primary">
            {working === 'generate' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Generate Issue
          </ActionButton>
        </ReviewCard>
      ) : (
        <div className="grid xl:grid-cols-[260px_minmax(0,1fr)_410px] gap-5 items-start">
          <aside className="space-y-4 xl:sticky xl:top-5">
            <ReviewCard className="p-4">
              <div className="iconik-micro mb-3" style={{ color: S.muted }}>Review Sections</div>
              <div className="space-y-1">
                {SECTIONS.map(section => (
                  <button
                    key={section.id}
                    onClick={() => leaveJsonEditor(section.id)}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-left luxury-body transition"
                    style={{ background: activeSection === section.id && !fullPreview ? S.ink : 'transparent', color: activeSection === section.id && !fullPreview ? S.bg : S.muted, border: `1px solid ${activeSection === section.id && !fullPreview ? S.ink : S.border}` }}
                  >
                    {section.label}
                    {section.id === 'outfits' && <span className="iconik-mono" style={{ fontSize: '10px' }}>{draft.outfits.length}</span>}
                  </button>
                ))}
                <button
                  onClick={openJsonEditor}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-left luxury-body transition"
                  style={{ background: activeSection === 'json' ? S.ink : 'transparent', color: activeSection === 'json' ? S.bg : S.muted, border: `1px solid ${activeSection === 'json' ? S.ink : S.border}` }}
                >
                  Advanced JSON
                  <FileJson size={14} />
                </button>
              </div>
            </ReviewCard>
            <ReviewCard className="p-4 space-y-2">
              <div className="iconik-micro" style={{ color: S.muted }}>Image Readiness</div>
              {images.map(item => (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <span className="iconik-mono" style={{ fontSize: '10px', color: S.muted }}>{item.label}</span>
                  <Pill tone={item.done >= item.total ? 'success' : 'gold'}>{item.done}/{item.total}</Pill>
                </div>
              ))}
            </ReviewCard>
            <ReviewCard className="p-4">
              <div className="iconik-micro mb-2" style={{ color: S.muted }}>Topic Plan</div>
              <p className="luxury-body text-sm leading-6" style={{ color: S.ink }}>{issue.topic_plan?.title || 'Untitled issue'}</p>
              {issue.topic_plan?.rationale && <p className="luxury-body text-xs leading-5 mt-2" style={{ color: S.muted }}>{issue.topic_plan.rationale}</p>}
            </ReviewCard>
          </aside>

          <main className="space-y-3 min-w-0">
            <ReviewCard className="p-3 flex items-center justify-between gap-3">
              <div>
                <p className="iconik-micro" style={{ color: S.muted }}>Live Preview</p>
                <p className="luxury-body text-sm capitalize" style={{ color: S.ink }}>{fullPreview ? 'Full issue' : activeSection.replace(/_/g, ' ')}</p>
              </div>
              <ActionButton onClick={() => setFullPreview(value => !value)} tone={fullPreview ? 'primary' : 'neutral'}>
                <Eye size={14} /> {fullPreview ? 'Focused' : 'Full'}
              </ActionButton>
            </ReviewCard>
            <div className="rounded-2xl overflow-auto border max-h-[calc(100vh-230px)]" style={{ borderColor: S.border, background: fullPreview ? '#FBF8F4' : S.panel }}>
              {fullPreview
                ? <StyleEditIssuePage data={draft} imageUrls={issue.image_urls} />
                : <div className="p-5"><SectionPreview section={activeSection} data={draft} /></div>
              }
            </div>
          </main>

          <aside className="space-y-4 xl:sticky xl:top-5">
            <ReviewCard className="p-5">
              <div className="iconik-micro mb-4" style={{ color: S.muted }}>Guided Editor</div>
              {activeSection === 'json' ? (
                <TextArea value={advancedJson} onChange={setAdvancedJson} rows={30} mono />
              ) : activeSection === 'direction' ? (
                <div className="space-y-4">
                  <div><FieldLabel>Issue title</FieldLabel><TextInput value={draft.issueTitle} onChange={value => updateDraft({ issueTitle: value })} /></div>
                  <div><FieldLabel>Subtitle</FieldLabel><TextArea value={draft.subtitle} onChange={value => updateDraft({ subtitle: value })} rows={3} /></div>
                  <div><FieldLabel>Week label</FieldLabel><TextInput value={draft.weekLabel} onChange={value => updateDraft({ weekLabel: value })} /></div>
                  <div><FieldLabel>Client name</FieldLabel><TextInput value={draft.clientName} onChange={value => updateDraft({ clientName: value })} /></div>
                  <div><FieldLabel>Theme</FieldLabel><TextInput value={draft.theme} onChange={value => updateDraft({ theme: value })} /></div>
                  <div><FieldLabel>Diagnosis</FieldLabel><TextArea value={draft.diagnosis} onChange={value => updateDraft({ diagnosis: value })} rows={8} /></div>
                </div>
              ) : activeSection === 'outfits' ? (
                <div className="space-y-4">
                  <button onClick={addOutfit} className="inline-flex items-center gap-2 text-sm luxury-body" style={{ color: S.slateDeep }}>
                    <Plus size={14} /> Add outfit
                  </button>
                  {draft.outfits.map((outfit, index) => (
                    <div key={index} className="rounded-xl border p-3 space-y-3" style={{ borderColor: S.border, background: S.panel }}>
                      <div className="flex items-center justify-between">
                        <span className="iconik-mono" style={{ fontSize: '10px', color: S.muted }}>Outfit {index + 1}</span>
                        <button onClick={() => removeOutfit(index)} className="inline-flex items-center gap-1 text-xs luxury-body" style={{ color: S.error }}>
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                      <div><FieldLabel>Title</FieldLabel><TextInput value={outfit.title} onChange={value => updateOutfit(index, { title: value })} /></div>
                      <div><FieldLabel>Occasion</FieldLabel><TextInput value={outfit.occasion} onChange={value => updateOutfit(index, { occasion: value })} /></div>
                      <div><FieldLabel>Formula</FieldLabel><TextArea value={outfit.formula} onChange={value => updateOutfit(index, { formula: value })} rows={4} /></div>
                      <div><FieldLabel>Colour logic</FieldLabel><TextArea value={outfit.colourLogic} onChange={value => updateOutfit(index, { colourLogic: value })} rows={3} /></div>
                      <div><FieldLabel>Styling notes</FieldLabel><TextArea value={outfit.stylingNotes} onChange={value => updateOutfit(index, { stylingNotes: value })} rows={4} /></div>
                    </div>
                  ))}
                </div>
              ) : activeSection === 'rules' ? (
                <div className="space-y-4">
                  <div><FieldLabel>Palette notes - one per line</FieldLabel><TextArea value={paletteText} onChange={setPaletteText} rows={7} /></div>
                  <div><FieldLabel>Shopping rules - one per line</FieldLabel><TextArea value={shoppingText} onChange={setShoppingText} rows={7} /></div>
                  <div><FieldLabel>Avoid this week - one per line</FieldLabel><TextArea value={avoidText} onChange={setAvoidText} rows={7} /></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div><FieldLabel>Reply prompt</FieldLabel><TextArea value={draft.replyPrompt} onChange={value => updateDraft({ replyPrompt: value })} rows={5} /></div>
                  <div><FieldLabel>Generated at</FieldLabel><TextInput value={draft.generatedAt} onChange={value => updateDraft({ generatedAt: value })} /></div>
                </div>
              )}
            </ReviewCard>
          </aside>
        </div>
      )}

      {draft && (
        <div className="fixed bottom-0 left-0 lg:left-56 right-0 z-20 border-t px-4 py-3" style={{ background: 'rgba(244,239,229,0.96)', borderColor: S.border }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={issue.status === 'approved' || issue.status === 'sent' ? 'success' : 'gold'}>
                {issue.status.replace(/_/g, ' ')}
              </Pill>
              <span className="luxury-body text-xs" style={{ color: S.muted }}>
                Save guided edits before approving or sending.
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={saveIssue} disabled={Boolean(working)}>
                {working === 'save' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
              </ActionButton>
              <ActionButton onClick={approve} disabled={Boolean(working)} tone="success">
                <Check size={14} /> Approve
              </ActionButton>
              <ActionButton onClick={() => action('send', () => fetch(`/api/stylist-edit/admin/issues/${issueId}/send`, { method: 'POST' }))} disabled={!['approved', 'scheduled', 'sent'].includes(issue.status) || Boolean(working)} tone="primary">
                {working === 'send' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send
              </ActionButton>
              <ActionButton onClick={() => action('skip', () => fetch(`/api/stylist-edit/admin/issues/${issueId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'skipped' }) }))} tone="danger">
                <SkipForward size={14} /> Skip
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
