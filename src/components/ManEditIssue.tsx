'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ThumbsDown, ThumbsUp } from 'lucide-react';
import { ManOutfitSlides, ManReportPageStyles, type ManReportSlideMeta } from '@/components/ManReport';
import { parseManOutfitsFromSection, toOutfitTitleCase } from '@/lib/manOutfitSection';
import { buildTrustedBrandSearch, type ManShoppingState } from '@/lib/manShopping';
import type { ClassificationResult } from '@/lib/manReportGenerator';
import type { ManEditIssueContent } from '@/lib/manEditIssueTypes';

/* ────────────────────────────────────────────────────────────
   The Iconik Edit — one monthly issue, presented as a short
   Blueprint: the same slides, frames, running heads and outfit
   pages as the report, in fewer pages. Cover, a letter from the
   stylist, six looks shot on him, the piece of the month, and a
   close that asks him to answer back.
   ──────────────────────────────────────────────────────────── */

interface IssueSummary {
  issueNumber: number;
  shareToken: string;
  title: string;
  periodLabel: string;
}

interface Props {
  shareToken: string;
  status: string;
  edit: ManEditIssueContent;
  s4Outfits: string;
  classification: ClassificationResult;
  outfitImages: (string | null)[];
  shopping: ManShoppingState | null;
  initialVotes: Record<string, 'like' | 'dislike'>;
  otherIssues: IssueSummary[];
}

type Vote = 'like' | 'dislike';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function outfitKey(issueNumber: number, outfitNumber: number) {
  return `edit-${issueNumber}-outfit-${outfitNumber}`;
}

/** Splits a title into the report's roman-then-italic headline, e.g. "Four decisions / shape the wardrobe." */
function splitHeadline(title: string): [string, string] {
  const clean = title.trim().replace(/\.$/, '');
  const at = clean.search(/\s(?:and|for|with|in|of)\s|[:—–]\s?/i);
  if (at > 8) return [clean.slice(0, at).trim(), `${clean.slice(at).replace(/^[:—–]\s*/, '').trim()}.`];
  const words = clean.split(/\s+/);
  const half = Math.ceil(words.length / 2);
  return [words.slice(0, half).join(' '), `${words.slice(half).join(' ')}.`];
}

function Corners({ kicker, title, page, total }: { kicker: string; title: string; page: number; total: number }) {
  return (
    <>
      <div className="grain" />
      <div className="corner-tl">
        <div className="man-mono corner-kicker">{kicker}</div>
        <div className="man-small-caps corner-title">{title}</div>
      </div>
      <div className="corner-tr">
        <div className="man-mono corner-kicker">{pad(page)} / {total}</div>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="man-summary-metric">
      <div className="man-small-caps faded">{label}</div>
      <div className="display">{value}</div>
    </div>
  );
}

function slide(pageNumber: number, title: string, slideType: ManReportSlideMeta['slideType'], extra: Partial<ManReportSlideMeta> = {}): ManReportSlideMeta {
  return {
    pageNumber,
    approvalKey: `edit-${slideType}-${pageNumber}`,
    legacyPageNumber: pageNumber,
    title,
    group: slideType === 'outfit' ? 'Outfits' : 'Opening',
    sectionKey: slideType === 'outfit' ? 's4' : 's0',
    slideType,
    ...extra,
  };
}

export default function ManEditIssue({
  shareToken,
  status,
  edit,
  s4Outfits,
  classification,
  outfitImages,
  shopping,
  initialVotes,
  otherIssues,
}: Props) {
  const outfits = useMemo(() => parseManOutfitsFromSection(s4Outfits), [s4Outfits]);
  const metaByNumber = useMemo(() => new Map(edit.outfits.map(item => [item.number, item])), [edit.outfits]);
  const piece = edit.pieceOfTheMonth?.name ? edit.pieceOfTheMonth : null;
  const issueLabel = `Issue ${pad(edit.issueNumber)}`;
  const runningHead = `The Edit - ${issueLabel}`;

  // Page order: cover, letter, the looks, piece of the month, close. The outfit
  // slides find their page by identity key, as they do in the Blueprint.
  const slides = useMemo(() => {
    const list: ManReportSlideMeta[] = [slide(1, 'Cover', 'cover'), slide(2, 'From your stylist', 'overview')];
    for (const outfit of outfits) {
      list.push(slide(list.length + 1, `Look ${pad(outfit.number)}`, 'outfit', { outfitNumber: outfit.number, outfitIdentityKey: outfit.identityKey }));
    }
    if (piece) list.push(slide(list.length + 1, 'Piece of the month', 'overview'));
    list.push(slide(list.length + 1, 'Until next month', 'overview'));
    return list;
  }, [outfits, piece]);
  const totalPages = slides.length;
  const piecePage = piece ? totalPages - 1 : 0;
  const closePage = totalPages;

  const occasions = useMemo(
    () => Object.fromEntries(edit.outfits.filter(item => item.occasion).map(item => [item.number, item.occasion])),
    [edit.outfits],
  );

  const [votes, setVotes] = useState(initialVotes);
  const [voteError, setVoteError] = useState('');
  const castVote = async (outfitNumber: number, vote: Vote) => {
    const outfit = outfits.find(item => item.number === outfitNumber);
    if (!outfit) return;
    const key = outfitKey(edit.issueNumber, outfitNumber);
    const previous = votes[key];
    setVotes(current => ({ ...current, [key]: vote }));
    setVoteError('');
    try {
      const res = await fetch(`/api/man-edit/public/${shareToken}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outfit_key: key,
          outfit_number: outfitNumber,
          outfit_label: `Edit ${edit.issueNumber} · ${metaByNumber.get(outfitNumber)?.occasion || toOutfitTitleCase(outfit.context)} — ${outfit.top}`,
          vote,
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setVotes(current => {
        const next = { ...current };
        if (previous) next[key] = previous; else delete next[key];
        return next;
      });
      setVoteError('That didn’t save. Try again in a moment.');
    }
  };

  const [titleRoman, titleItalic] = splitHeadline(edit.title);
  const noteParagraphs = edit.stylistNote.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const [pieceName, ...pieceDetail] = (piece?.name ?? '').split(/\s+—\s+/);

  return (
    <div className="man-edit-issue">
      {status !== 'sent' && (
        <div className="man-edit-preview">Preview · this issue hasn’t been sent to the client yet</div>
      )}

      <div className="iconik-report man-report overflow-x-hidden">
        {/* ── Cover ─────────────────────────────────────────── */}
        <section className="iconik-page man-page slate man-cover cover-page" data-blueprint-page-number={1}>
          <div className="grain" />
          <div className="corner-tl">
            <div className="man-display man-wordmark">I C O N I K</div>
            <div className="man-micro muted">The Iconik Edit</div>
          </div>
          <div className="corner-tr" style={{ textAlign: 'right' }}>
            <div className="man-micro muted">{issueLabel}</div>
            <div className="man-micro muted" style={{ marginTop: 8 }}>{edit.periodLabel}</div>
          </div>
          <div className="man-cover-center">
            <div className="man-cover-rule">
              <span /><div className="man-micro">Your monthly Edit</div><span />
            </div>
            <h1 className="man-cover-heading">
              <span className="man-display">The</span>
              <span className="man-display-it">Edit</span>
            </h1>
            <div className="man-mono man-cover-number">{issueLabel} · {edit.periodLabel}</div>
          </div>
          <div className="corner-bl">
            <div className="man-display-it man-cover-tag">{outfits.length} looks.</div>
            <div className="man-display-it man-cover-tag">Shot on you.</div>
          </div>
          <div className="corner-br">
            <div className="man-mono corner-kicker">01 / {totalPages}</div>
          </div>
        </section>

        {/* ── The letter ───────────────────────────────────── */}
        <section className="iconik-page man-page ivory" data-blueprint-page-number={2}>
          <Corners kicker="The Edit" title="From your stylist" page={2} total={totalPages} />
          <div className="man-page-inner">
            <div className="man-summary-grid">
              <aside className="man-summary-rail">
                <div className="man-micro faded">Issue</div>
                <div className="display man-rail-number">{pad(edit.issueNumber)}</div>
                <Metric label="Month" value={edit.periodLabel.split(' ')[0] ?? edit.periodLabel} />
                <Metric label="Looks" value={String(outfits.length)} />
                <Metric label="Pages" value={String(totalPages)} />
              </aside>

              <div className="man-summary-main">
                <div className="man-micro faded">This month</div>
                <h2>
                  <span className="display">{titleRoman}</span>
                  <span className="display-it">{titleItalic}</span>
                </h2>
                {edit.dek && <p className="display-it man-edit-dek">{edit.dek}</p>}
                <div className="rule" />
                <div className="man-edit-letter">
                  {noteParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                  <p className="display-it man-edit-sign">ICONIK Styling</p>
                </div>
                {edit.monthMoments.length > 0 && (
                  <>
                    <div className="rule man-palette-rule" />
                    <div className="man-dossier-cards man-edit-moments">
                      {edit.monthMoments.map((moment, index) => (
                        <div key={moment} className="man-dossier-card">
                          <div className="man-mono dossier-label">{pad(index + 1)} - THIS MONTH</div>
                          <div className="display man-dossier-title">{moment}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── The looks: the Blueprint's own outfit slides ─── */}
        <ManOutfitSlides
          cls={classification}
          text={s4Outfits}
          outfitImageUrls={outfitImages}
          slideMeta={slides}
          shopping={shopping}
          runningHead={runningHead}
          outfitOccasions={occasions}
          renderOutfitExtras={outfit => {
            const meta = metaByNumber.get(outfit.number);
            const vote = votes[outfitKey(edit.issueNumber, outfit.number)];
            const usesPiece = piece?.outfitNumbers?.includes(outfit.number);
            return (
              <div className="man-edit-verdict">
                {(meta?.reuses || usesPiece) && (
                  <div className="man-edit-notes">
                    {meta?.reuses && <p><span className="mono faded">From your Blueprint</span>{meta.reuses}</p>}
                    {usesPiece && <p><span className="mono faded">Piece of the month</span>{pieceName}</p>}
                  </div>
                )}
                <div className="man-edit-vote" role="group" aria-label={`Your verdict on look ${pad(outfit.number)}`}>
                  <span className="mono faded">Your verdict</span>
                  <button type="button" className={vote === 'like' ? 'on' : ''} aria-pressed={vote === 'like'} onClick={() => castVote(outfit.number, 'like')}>
                    <ThumbsUp size={13} /> I’d wear this
                  </button>
                  <button type="button" className={vote === 'dislike' ? 'on' : ''} aria-pressed={vote === 'dislike'} onClick={() => castVote(outfit.number, 'dislike')}>
                    <ThumbsDown size={13} /> Not for me
                  </button>
                </div>
                {voteError && <p className="man-edit-vote-error" role="alert">{voteError}</p>}
              </div>
            );
          }}
        />

        {/* ── Piece of the month ───────────────────────────── */}
        {piece && (
          <section className="iconik-page man-page bone" data-blueprint-page-number={piecePage}>
            <Corners kicker={runningHead} title="Piece of the month" page={piecePage} total={totalPages} />
            <div className="man-page-inner">
              <div className="man-summary-grid">
                <aside className="man-summary-rail">
                  <div className="man-micro faded">Buy now</div>
                  <div className="display man-rail-number">01</div>
                  {piece.outfitNumbers.length > 0 && <Metric label="Unlocks" value={`${piece.outfitNumbers.length} looks`} />}
                </aside>
                <div className="man-summary-main">
                  <div className="man-micro faded">Piece of the month</div>
                  <h2>
                    <span className="display">{pieceName}</span>
                    {pieceDetail.length > 0 && <span className="display-it">{pieceDetail.join(' — ')}.</span>}
                  </h2>
                  <div className="rule" />
                  {piece.why && <p className="man-edit-piece-why">{piece.why}</p>}
                  {piece.outfitNumbers.length > 0 && (
                    <p className="mono faded man-edit-piece-in">Worn in {piece.outfitNumbers.map(n => `Look ${pad(n)}`).join(' · ')}</p>
                  )}
                  <a className="man-edit-cta" href={buildTrustedBrandSearch(piece.name).url} target="_blank" rel="noopener noreferrer nofollow">
                    Find it <ArrowUpRight size={13} />
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Close ────────────────────────────────────────── */}
        <section className="iconik-page man-page slate man-edit-close" data-blueprint-page-number={closePage}>
          <Corners kicker={runningHead} title="Until next month" page={closePage} total={totalPages} />
          <div className="man-page-inner">
            <div className="man-micro muted">Until next month</div>
            <h2>
              <span className="display">Tell us what</span>
              <span className="display-it">you’d wear.</span>
            </h2>
            <div className="rule" />
            {edit.closingNote && <p className="man-edit-close-note">{edit.closingNote}</p>}
            <p className="man-edit-close-reply">Questions about a look? Reply to the email this came in. It reaches your stylist.</p>
            {edit.blueprintShareToken && (
              <Link href={`/man/report/${edit.blueprintShareToken}`} className="man-edit-cta man-edit-cta-light">
                Your Blueprint <ArrowUpRight size={13} />
              </Link>
            )}
            {otherIssues.length > 0 && (
              <div className="man-edit-archive">
                <div className="man-micro muted">Earlier issues</div>
                <ul>
                  {otherIssues.map(issue => (
                    <li key={issue.shareToken}>
                      <Link href={`/man/edit/${issue.shareToken}`}>
                        <span className="man-mono">{pad(issue.issueNumber)} · {issue.periodLabel}</span>
                        <span className="display-it">{issue.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="corner-bl">
            <div className="man-display man-wordmark">I C O N I K</div>
          </div>
        </section>

        <ManReportPageStyles />
      </div>

      <style jsx global>{`
        html:has(.man-edit-issue), body:has(.man-edit-issue) { background: #1B1815; }
        .man-edit-preview {
          position: sticky; top: 0; z-index: 30; text-align: center; padding: 9px 16px;
          background: #9A4B37; color: #F4EFE5; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
        }
        .man-edit-dek { font-size: 20px; line-height: 1.4; margin: 14px 0 22px; opacity: 0.75; }
        .man-edit-letter { max-width: 640px; margin-top: 28px; }
        .man-edit-letter p { font-size: 15px; line-height: 1.75; margin: 0 0 16px; }
        .man-edit-letter .man-edit-sign { font-size: 17px; opacity: 0.7; margin-top: 8px; }
        .man-edit-moments { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
        .man-edit-moments .man-dossier-title { font-size: 22px; line-height: 1.15; }

        .man-edit-verdict { margin-top: 18px; padding-top: 16px; border-top: 1px solid rgba(44,38,34,0.12); display: grid; gap: 12px; }
        .man-edit-notes { display: grid; gap: 6px; }
        .man-edit-notes p { margin: 0; font-size: 13px; line-height: 1.55; }
        .man-edit-notes .mono { display: inline-block; min-width: 150px; margin-right: 10px; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; }
        .man-edit-vote { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
        .man-edit-vote .mono { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; margin-right: 6px; }
        .man-edit-vote button {
          display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 16px; border-radius: 999px;
          border: 1px solid rgba(44,38,34,0.22); background: transparent; color: #2C2622; font-size: 12px; cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }
        .man-edit-vote button:hover { border-color: #2C2622; }
        .man-edit-vote button.on { background: #2C2622; border-color: #2C2622; color: #F4EFE5; }
        .man-edit-vote-error { margin: 0; font-size: 12px; color: #9A4B37; }

        .man-edit-piece-why { font-size: 16px; line-height: 1.7; max-width: 620px; }
        .man-edit-piece-in { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; margin: 18px 0 22px; }
        .man-edit-cta {
          display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 20px; border-radius: 999px;
          background: #2C2622; color: #F4EFE5; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; text-decoration: none;
        }
        .man-edit-cta-light { background: #F4EFE5; color: #2C2622; }

        .man-edit-close { display: flex; align-items: center; }
        .man-edit-close .man-page-inner { max-width: 720px; }
        .man-edit-close .rule { background: #F4EFE5; }
        .man-edit-close-note { font-size: 18px; line-height: 1.6; margin: 0 0 14px; }
        .man-edit-close-reply { font-size: 14px; line-height: 1.6; opacity: 0.72; margin: 0 0 26px; }
        .man-edit-archive { margin-top: 34px; }
        .man-edit-archive ul { list-style: none; padding: 0; margin: 12px 0 0; display: grid; gap: 10px; }
        .man-edit-archive a { display: flex; gap: 16px; align-items: baseline; color: inherit; text-decoration: none; }
        .man-edit-archive .man-mono { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.6; min-width: 140px; }

        @media screen and (max-width: 640px) {
          .man-edit-notes .mono { display: block; margin: 0 0 2px; min-width: 0; }
          .man-edit-archive a { flex-direction: column; gap: 2px; }
        }
        @media print {
          .man-edit-preview, .man-edit-vote { display: none !important; }
        }
      `}</style>
    </div>
  );
}
