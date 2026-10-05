'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Button, Pill, Sheet } from '@/components/manAdmin/ui';
import { parseManOutfitsFromSection } from '@/lib/manOutfitSection';
import { MAN_OUTFIT_FEEDBACK_REASONS } from '@/lib/manOutfitFeedbackReasons';
import {
  MAN_COLOUR_STOPS,
  MAN_DRESS_CODES,
  MAN_EXPERIMENTATION_STOPS,
  MAN_STYLE_PIECES,
  manScaleStop,
  type ManRecommendationProfile,
} from '@/lib/manRecommendationProfile';
import type { ManOutfitLibraryAssignment } from '@/lib/manOutfitLibrary';

type Verdict = 'up' | 'down';

interface FeedbackRow {
  outfit_number: number;
  verdict: Verdict;
  reasons: string[];
}

interface FeedbackResponse {
  available: boolean;
  feedback: FeedbackRow[];
  libraryVersion: string | null;
  assignments: ManOutfitLibraryAssignment[];
  profile: ManRecommendationProfile | null;
  error?: string;
}

const LADDER_LABEL: Record<string, string> = {
  comfort: 'Comfort',
  'step-up': 'Step up',
  stretch: 'Stretch',
};

const TRIBE_LABEL: Record<string, string> = {
  old_money: 'Old Money',
  off_duty: 'Off Duty',
  urban_wear: 'Urban Wear',
  indian_casual: 'Indian Casual',
  power_classic: 'Power Classic',
  new_boardroom: 'New Boardroom',
  dark_romantic: 'Dark Romantic',
  indo_authority: 'Indo Authority',
  quiet_luxury: 'Quiet Luxury',
  sharp_evening: 'Sharp Evening',
  royal_edit: 'Royal Edit',
  classic_evening: 'Classic Evening',
};

function summarise(outfit: { top: string; layer: string; bottom: string; footwear: string }): string {
  return [outfit.top, /^(none|no layer)\b/i.test(outfit.layer.trim()) ? '' : outfit.layer, outfit.bottom, outfit.footwear]
    .map(part => part.split(' — ')[0].trim())
    .filter(part => part && part !== '—')
    .join(' · ');
}

/**
 * The stylist's rating pass over the 20 outfits. 👍/👎 totals teach the picker
 * which board looks work; "Replace 👎 outfits" re-picks only the rejected slots.
 */
export default function OutfitRatingsSheet({ open, onClose, reportId, section4, outfitImageUrls, busy, onReplaced }: {
  open: boolean;
  onClose: () => void;
  reportId: string;
  section4: string;
  outfitImageUrls: Array<string | null> | undefined;
  busy: boolean;
  onReplaced: () => Promise<void> | void;
}) {
  const [data, setData] = useState<FeedbackResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/man-report/${reportId}/outfit-feedback`, { cache: 'no-store' });
      const json = await res.json() as FeedbackResponse;
      if (!res.ok) throw new Error(json.error ?? 'Could not load ratings.');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load ratings.');
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => { if (open) void load(); }, [open, load]);

  const outfits = useMemo(() => parseManOutfitsFromSection(section4), [section4]);
  const ratings = useMemo(() => new Map((data?.feedback ?? []).map(row => [row.outfit_number, row])), [data]);
  const downCount = [...ratings.values()].filter(row => row.verdict === 'down').length;
  const upCount = [...ratings.values()].filter(row => row.verdict === 'up').length;
  const tasteLed = data?.libraryVersion === 'v4-taste-led';

  const rate = async (outfitNumber: number, verdict: Verdict | null, reasons: string[] = []) => {
    setSaving(outfitNumber);
    setError('');
    try {
      const res = await fetch(`/api/man-report/${reportId}/outfit-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outfitNumber, verdict, reasons }),
      });
      const json = await res.json() as { feedback?: FeedbackRow[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Could not save the rating.');
      setData(prev => prev ? { ...prev, feedback: json.feedback ?? prev.feedback } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the rating.');
    } finally {
      setSaving(null);
    }
  };

  const replaceDownvoted = async () => {
    setReplacing(true);
    setError('');
    try {
      const res = await fetch(`/api/man-report/${reportId}/redo-outfits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'downvoted' }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Could not replace the outfits.');
      await onReplaced();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not replace the outfits.');
    } finally {
      setReplacing(false);
    }
  };

  const profile = data?.profile;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      width={760}
      eyebrow="Outfit ratings"
      title={`${upCount} liked · ${downCount} to replace`}
      footer={(
        <>
          <span className="ma-faint mr-auto text-[12px]">
            {tasteLed
              ? 'Ratings teach the picker for every client. 👎 looks are never picked for him again.'
              : 'This report uses the old picker. "Rewrite all outfits" moves it to the new one; then you can replace only the 👎 looks.'}
          </span>
          <Button variant="ghost" onClick={onClose}>Done</Button>
          <Button
            variant="dark"
            icon={<RefreshCw size={14} />}
            loading={replacing}
            disabled={!tasteLed || downCount === 0 || busy}
            title={downCount ? 'Re-pick the 👎 outfits; everything else stays as it is' : 'Mark at least one outfit 👎 first'}
            onClick={() => { void replaceDownvoted(); }}
          >
            Replace {downCount || ''} 👎 {downCount === 1 ? 'outfit' : 'outfits'}
          </Button>
        </>
      )}
    >
      {error && (
        <div className="mb-4 rounded-2xl px-4 py-3 text-[14px]" style={{ background: 'var(--ma-red-soft)', color: 'var(--ma-red)' }}>{error}</div>
      )}
      {data && !data.available && (
        <div className="mb-4 rounded-2xl px-4 py-3 text-[14px]" style={{ background: 'var(--ma-amber-soft)', color: 'var(--ma-amber)' }}>
          Ratings can&apos;t be saved until the database migration <code>add_man_style_profile_and_outfit_feedback.sql</code> has been run.
        </div>
      )}

      {profile && (
        <div className="mb-5 rounded-2xl px-4 py-3 text-[13px]" style={{ background: 'var(--ma-surface-2)', border: '1px solid var(--ma-line-2)' }}>
          <div className="ma-eyebrow mb-1.5">What the picker used{profile.source === 'derived' ? ' (estimated from older intake answers)' : ''}</div>
          <div className="flex flex-wrap gap-1.5">
            <Pill>Experimentation {profile.experimentation}/10 · {manScaleStop(MAN_EXPERIMENTATION_STOPS, profile.experimentation).label}</Pill>
            <Pill>Colour {profile.colour_boldness}/10 · {manScaleStop(MAN_COLOUR_STOPS, profile.colour_boldness).label}</Pill>
            <Pill>{MAN_DRESS_CODES.find(code => code.value === profile.dress_code)?.label ?? profile.dress_code}</Pill>
            {profile.tribes.map(tribe => <Pill key={tribe} tone="accent">{TRIBE_LABEL[tribe] ?? tribe}</Pill>)}
            {profile.try_pieces.map(piece => <Pill key={`try-${piece}`} tone="green">Try: {MAN_STYLE_PIECES.find(item => item.id === piece)?.label ?? piece}</Pill>)}
            {profile.never_pieces.map(piece => <Pill key={`never-${piece}`} tone="red">Never: {MAN_STYLE_PIECES.find(item => item.id === piece)?.label ?? piece}</Pill>)}
          </div>
        </div>
      )}

      {loading && !data ? (
        <p className="ma-faint text-[14px]">Loading…</p>
      ) : (
        <ul className="space-y-2.5">
          {outfits.map(outfit => {
            const rating = ratings.get(outfit.number);
            const assignment = data?.assignments.find(item => item.outfitNumber === outfit.number);
            const imageUrl = outfitImageUrls?.[outfit.number - 1] ?? null;
            const disabled = saving === outfit.number || replacing || (data ? !data.available : true);
            return (
              <li
                key={outfit.number}
                className="rounded-2xl px-3.5 py-3"
                style={{
                  background: 'var(--ma-surface)',
                  border: `1px solid ${rating?.verdict === 'down' ? 'rgba(180,35,24,0.28)' : rating?.verdict === 'up' ? 'rgba(47,107,79,0.28)' : 'var(--ma-line-2)'}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="h-[72px] w-[54px] shrink-0 overflow-hidden rounded-xl" style={{ background: 'var(--ma-surface-2)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {imageUrl && <img src={imageUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[14px]" style={{ fontWeight: 600 }}>Outfit {outfit.number}</span>
                      <span className="ma-faint text-[13px]">{outfit.context}</span>
                      {assignment?.ladder && (
                        <Pill tone={assignment.ladder === 'stretch' ? 'accent' : assignment.ladder === 'step-up' ? 'blue' : 'neutral'}>
                          {LADDER_LABEL[assignment.ladder]} · boldness {assignment.boldness}/5
                        </Pill>
                      )}
                      {assignment && <span className="ma-faint ma-num text-[11px]">Board look {assignment.libraryLookId}</span>}
                    </div>
                    <p className="ma-muted mt-1 text-[13px] leading-snug">{summarise(outfit)}</p>
                    {assignment?.tribes?.length ? (
                      <p className="ma-faint mt-1 text-[12px]">
                        {assignment.tribes.slice(0, 3).map(tribe => TRIBE_LABEL[tribe] ?? tribe).join(' · ')}
                        {assignment.paletteFit !== undefined ? ` · colour fit ${Math.round(assignment.paletteFit * 100)}%` : ''}
                      </p>
                    ) : null}
                    {rating?.verdict === 'down' && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {MAN_OUTFIT_FEEDBACK_REASONS.map(reason => {
                          const active = rating.reasons.includes(reason.id);
                          return (
                            <button
                              key={reason.id}
                              type="button"
                              disabled={disabled}
                              onClick={() => {
                                const next = active ? rating.reasons.filter(item => item !== reason.id) : [...rating.reasons, reason.id];
                                void rate(outfit.number, 'down', next);
                              }}
                              className={`ma-pill ${active ? 'ma-pill--red' : ''}`}
                              style={{ cursor: 'pointer' }}
                            >
                              {reason.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="sm"
                      variant={rating?.verdict === 'up' ? 'success' : 'ghost'}
                      iconOnly
                      icon={<ThumbsUp size={15} />}
                      aria-label={`Like outfit ${outfit.number}`}
                      aria-pressed={rating?.verdict === 'up'}
                      disabled={disabled}
                      onClick={() => { void rate(outfit.number, rating?.verdict === 'up' ? null : 'up'); }}
                    />
                    <Button
                      size="sm"
                      variant={rating?.verdict === 'down' ? 'danger' : 'ghost'}
                      iconOnly
                      icon={<ThumbsDown size={15} />}
                      aria-label={`Replace outfit ${outfit.number}`}
                      aria-pressed={rating?.verdict === 'down'}
                      disabled={disabled}
                      onClick={() => { void rate(outfit.number, rating?.verdict === 'down' ? null : 'down'); }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
