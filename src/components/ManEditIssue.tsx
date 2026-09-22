'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, ThumbsDown, ThumbsUp } from 'lucide-react';
import { parseManOutfitsFromSection, toOutfitTitleCase, type ParsedManOutfit } from '@/lib/manOutfitSection';
import { hasPlaceholderOutfitValue } from '@/lib/manOutfitPlaceholders';
import {
  buildFallbackSearchUrl,
  buildTrustedBrandSearch,
  collectGarmentSlots,
  isShoppingSlotCurrent,
  type ManProductLink,
  type ManShoppingSlotName,
  type ManShoppingState,
} from '@/lib/manShopping';
import type { ManEditIssueContent } from '@/lib/manEditIssueTypes';

/* ────────────────────────────────────────────────────────────
   The Iconik Edit — one monthly issue.

   Built from the Blueprint's two materials: the cover is the
   screening room (warm dark, brass, woven twill), the pages are
   the printed manual (paper, ink, brass rules). It reads like an
   issue of a magazine written for one man: a letter, six looks
   shot on him, one piece worth buying, and a way to answer back.
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
  outfitImages: (string | null)[];
  shopping: ManShoppingState | null;
  initialVotes: Record<string, 'like' | 'dislike'>;
  otherIssues: IssueSummary[];
}

type Vote = 'like' | 'dislike';

const GARMENT_ROWS: Array<{ key: keyof ParsedManOutfit; label: string; slot?: ManShoppingSlotName }> = [
  { key: 'top', label: 'Top', slot: 'top' },
  { key: 'layer', label: 'Layer', slot: 'layer' },
  { key: 'bottom', label: 'Bottom', slot: 'bottom' },
  { key: 'footwear', label: 'Footwear', slot: 'footwear' },
  { key: 'accessories', label: 'Finish' },
];

function isRealValue(value: string) {
  return Boolean(value) && value !== '—' && !hasPlaceholderOutfitValue(value)
    && !/^(?:none|no layer|n\/a)\.?$/i.test(value.trim());
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function outfitKey(issueNumber: number, outfitNumber: number) {
  return `edit-${issueNumber}-outfit-${outfitNumber}`;
}

function formatPrice(product: ManProductLink) {
  if (!product.price) return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: product.currency || 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);
}

export default function ManEditIssue({
  shareToken,
  status,
  edit,
  s4Outfits,
  outfitImages,
  shopping,
  initialVotes,
  otherIssues,
}: Props) {
  const outfits = useMemo(() => parseManOutfitsFromSection(s4Outfits), [s4Outfits]);
  const metaByNumber = useMemo(() => new Map(edit.outfits.map(item => [item.number, item])), [edit.outfits]);

  // Curated links only while the stored slot still matches this garment's
  // current wording; otherwise fall back to a brand-filtered search.
  const productsBySlot = useMemo(() => {
    const map = new Map<string, ManProductLink[]>();
    for (const garment of collectGarmentSlots(s4Outfits)) {
      const slot = shopping?.slots?.[garment.key];
      if (isShoppingSlotCurrent(slot, garment.hash) && slot!.selected.length) map.set(garment.key, slot!.selected);
    }
    return map;
  }, [s4Outfits, shopping]);

  const [votes, setVotes] = useState(initialVotes);
  const [voteError, setVoteError] = useState('');

  const castVote = async (outfit: ParsedManOutfit, vote: Vote) => {
    const key = outfitKey(edit.issueNumber, outfit.number);
    const previous = votes[key];
    setVotes(current => ({ ...current, [key]: vote }));
    setVoteError('');
    try {
      const res = await fetch(`/api/man-edit/public/${shareToken}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outfit_key: key,
          outfit_number: outfit.number,
          outfit_label: `Edit ${edit.issueNumber} · ${metaByNumber.get(outfit.number)?.occasion || toOutfitTitleCase(outfit.context)} — ${outfit.top}`,
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
      setVoteError('That didn’t save — try again in a moment.');
    }
  };

  const piece = edit.pieceOfTheMonth;
  const coverImage = outfitImages[0] ?? null;
  const noteParagraphs = edit.stylistNote.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

  return (
    <div className="ie">
      {status !== 'sent' && (
        <div className="ie-preview">Preview — this issue hasn’t been sent to the client yet</div>
      )}

      {/* ── cover ───────────────────────────────────────── */}
      <header className="ie-cover">
        <div className="ie-cover-copy">
          <span className="ie-mono ie-brass">The Iconik Edit</span>
          <span className="ie-mono ie-issue">Issue {pad(edit.issueNumber)} · {edit.periodLabel}</span>
          <h1 className="ie-title">{edit.title}</h1>
          {edit.dek && <p className="ie-dek">{edit.dek}</p>}
          <p className="ie-for ie-mono">Styled for {edit.clientFirstName || 'you'}</p>
          {edit.monthMoments.length > 0 && (
            <ul className="ie-moments">
              {edit.monthMoments.map(moment => <li key={moment}>{moment}</li>)}
            </ul>
          )}
          <a href="#letter" className="ie-down ie-mono">Read this month <ArrowDown size={13} /></a>
        </div>
        {coverImage && (
          <div className="ie-cover-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImage} alt="Look 01, styled on you" />
          </div>
        )}
      </header>

      <main className="ie-paper">
        {/* ── letter ──────────────────────────────────────── */}
        <section id="letter" className="ie-section ie-letter">
          <span className="ie-mono ie-brass">From your stylist</span>
          <div className="ie-letter-body">
            {noteParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
          <p className="ie-sign">— ICONIK Styling</p>
        </section>

        {/* ── contents ────────────────────────────────────── */}
        <nav className="ie-section ie-contents" aria-label="This issue">
          <span className="ie-mono ie-brass">In this issue</span>
          <ol>
            {outfits.map(outfit => (
              <li key={outfit.number}>
                <a href={`#look-${outfit.number}`}>
                  <span className="ie-mono">{pad(outfit.number)}</span>
                  <span>{metaByNumber.get(outfit.number)?.occasion || toOutfitTitleCase(outfit.context)}</span>
                </a>
              </li>
            ))}
            {piece?.name && (
              <li>
                <a href="#piece">
                  <span className="ie-mono">★</span>
                  <span>Piece of the month</span>
                </a>
              </li>
            )}
          </ol>
        </nav>

        {/* ── the looks ───────────────────────────────────── */}
        {outfits.map(outfit => {
          const meta = metaByNumber.get(outfit.number);
          const image = outfitImages[outfit.number - 1] ?? null;
          const key = outfitKey(edit.issueNumber, outfit.number);
          const vote = votes[key];
          const usesPiece = piece?.outfitNumbers?.includes(outfit.number);
          return (
            <article key={outfit.number} id={`look-${outfit.number}`} className="ie-look">
              <div className="ie-look-photo">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={`Look ${pad(outfit.number)}: ${meta?.occasion ?? outfit.context}`} loading={outfit.number > 1 ? 'lazy' : 'eager'} />
                ) : (
                  <div className="ie-look-photo-empty ie-mono">Photo on its way</div>
                )}
              </div>

              <div className="ie-look-copy">
                <span className="ie-mono ie-brass">Look {pad(outfit.number)} · {toOutfitTitleCase(outfit.context)}</span>
                <h2 className="ie-look-title">{meta?.occasion || toOutfitTitleCase(outfit.context)}</h2>
                {isRealValue(outfit.whyItWorks) && <p className="ie-look-why">{outfit.whyItWorks}</p>}

                <dl className="ie-spec">
                  {GARMENT_ROWS.map(row => {
                    const value = String(outfit[row.key] ?? '');
                    if (!isRealValue(value)) return null;
                    const products = row.slot ? productsBySlot.get(`${outfit.number}:${row.slot}`) : undefined;
                    const trusted = row.slot && !products ? buildTrustedBrandSearch(value) : null;
                    return (
                      <div key={row.key}>
                        <dt className="ie-mono">{row.label}</dt>
                        <dd>
                          {value}
                          {products && (
                            <span className="ie-products">
                              {products.map(product => (
                                <a key={product.url} href={product.url} target="_blank" rel="noopener noreferrer nofollow">
                                  <span>{product.merchant || 'Shop'}</span>
                                  {formatPrice(product) && <b>{formatPrice(product)}</b>}
                                  <ArrowUpRight size={12} />
                                </a>
                              ))}
                            </span>
                          )}
                          {trusted && (
                            <span className="ie-shop">
                              <a href={trusted.url} target="_blank" rel="noopener noreferrer nofollow">
                                Shop this piece <ArrowUpRight size={12} />
                              </a>
                              <a className="ie-shop-wide" href={buildFallbackSearchUrl(value)} target="_blank" rel="noopener noreferrer nofollow">
                                Broaden
                              </a>
                            </span>
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>

                {(meta?.reuses || usesPiece) && (
                  <div className="ie-tags">
                    {meta?.reuses && <p><span className="ie-mono">From your Blueprint</span>{meta.reuses}</p>}
                    {usesPiece && <p><span className="ie-mono">Piece of the month</span>{piece.name}</p>}
                  </div>
                )}

                <div className="ie-vote" role="group" aria-label={`Your verdict on look ${pad(outfit.number)}`}>
                  <span className="ie-mono">Your verdict</span>
                  <button type="button" className={vote === 'like' ? 'on' : ''} aria-pressed={vote === 'like'} onClick={() => castVote(outfit, 'like')}>
                    <ThumbsUp size={14} /> I’d wear this
                  </button>
                  <button type="button" className={vote === 'dislike' ? 'on' : ''} aria-pressed={vote === 'dislike'} onClick={() => castVote(outfit, 'dislike')}>
                    <ThumbsDown size={14} /> Not for me
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {voteError && <p className="ie-vote-error" role="alert">{voteError}</p>}

        {/* ── piece of the month ─────────────────────────── */}
        {piece?.name && (
          <section id="piece" className="ie-piece">
            <span className="ie-mono ie-brass">Piece of the month</span>
            <h2>{piece.name}</h2>
            {piece.why && <p>{piece.why}</p>}
            {piece.outfitNumbers.length > 0 && (
              <p className="ie-piece-in ie-mono">
                Worn in {piece.outfitNumbers.map(n => (
                  <a key={n} href={`#look-${n}`}>Look {pad(n)}</a>
                ))}
              </p>
            )}
            <a className="ie-piece-shop ie-mono" href={buildTrustedBrandSearch(piece.name).url} target="_blank" rel="noopener noreferrer nofollow">
              Find it <ArrowUpRight size={13} />
            </a>
          </section>
        )}

        {/* ── close ──────────────────────────────────────── */}
        <footer className="ie-section ie-close">
          {edit.closingNote && <p className="ie-close-note">{edit.closingNote}</p>}
          <p className="ie-close-reply">Questions about a look? Reply to the email this came in — it reaches your stylist.</p>
          <div className="ie-close-links">
            {edit.blueprintShareToken && (
              <Link href={`/man/report/${edit.blueprintShareToken}`} className="ie-mono">Your Blueprint <ArrowUpRight size={12} /></Link>
            )}
          </div>
          {otherIssues.length > 0 && (
            <div className="ie-archive">
              <span className="ie-mono ie-brass">Earlier issues</span>
              <ul>
                {otherIssues.map(issue => (
                  <li key={issue.shareToken}>
                    <Link href={`/man/edit/${issue.shareToken}`}>
                      <span className="ie-mono">{pad(issue.issueNumber)} · {issue.periodLabel}</span>
                      <span>{issue.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="ie-mark ie-mono">I C O N I K</p>
        </footer>
      </main>

      <style jsx global>{`
        html:has(.ie), body:has(.ie) { background: #16120F; }

        .ie {
          --ink:#16120F; --ink-2:#1D1712;
          --paper:#F1EADC; --paper-2:#E7DDC8;
          --t-dark:#F2EADC; --t-dark-2:rgba(242,234,220,.72); --t-dark-3:rgba(242,234,220,.48);
          --t-paper:#241D16; --t-paper-2:rgba(36,29,22,.74); --t-paper-3:rgba(36,29,22,.5);
          --line:rgba(36,29,22,.16); --line-dark:rgba(242,234,220,.16);
          --brass:#C9A06A; --brass-paper:#94713C;
          --weave:rgba(242,234,220,.018);
          min-height:100dvh; background:var(--ink); color:var(--t-dark);
          font-family:var(--font-newsreader), Newsreader, Georgia, serif;
          font-size:17px; line-height:1.62; font-weight:360;
          -webkit-font-smoothing:antialiased; overflow-x:hidden;
        }
        .ie *, .ie *::before, .ie *::after { box-sizing:border-box; }
        .ie a { color:inherit; }
        .ie img { display:block; width:100%; height:100%; object-fit:cover; }
        .ie a:focus-visible, .ie button:focus-visible { outline:2px solid var(--brass); outline-offset:3px; }

        .ie-mono { font-family:var(--font-jetbrains-mono), ui-monospace, monospace; font-size:10px;
          font-weight:700; letter-spacing:.22em; text-transform:uppercase; }
        .ie-brass { color:var(--brass); display:block; margin-bottom:14px; }
        .ie-paper .ie-brass { color:var(--brass-paper); }

        .ie-preview { position:sticky; top:0; z-index:5; padding:10px 16px; text-align:center;
          background:#9E4A38; color:#fff; font-family:var(--font-jetbrains-mono), monospace;
          font-size:11px; letter-spacing:.1em; text-transform:uppercase; }

        /* cover — the screening room */
        .ie-cover { position:relative; display:grid; grid-template-columns:1fr; min-height:100dvh;
          max-width:1180px; margin:0 auto; }
        .ie-cover::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
          background-image:
            repeating-linear-gradient(52deg, var(--weave) 0 1px, transparent 1px 4px),
            repeating-linear-gradient(-52deg, var(--weave) 0 1px, transparent 1px 4px); }
        .ie-cover > * { position:relative; z-index:1; }
        .ie-cover-copy { display:flex; flex-direction:column; justify-content:flex-end;
          padding:64px 20px 40px; }
        .ie-issue { color:var(--t-dark-3); margin-bottom:28px; }
        .ie-title { font-family:var(--font-fraunces), Georgia, serif; font-weight:350;
          font-size:clamp(40px, 9vw, 76px); line-height:1.02; letter-spacing:-.02em; margin:0 0 20px; }
        .ie-dek { font-size:19px; line-height:1.5; color:var(--t-dark-2); margin:0 0 24px; max-width:34ch; }
        .ie-for { color:var(--t-dark-2); margin:0 0 22px; }
        .ie-moments { display:flex; flex-wrap:wrap; gap:8px; list-style:none; padding:0; margin:0 0 36px; }
        .ie-moments li { border:1px solid var(--line-dark); border-radius:999px; padding:6px 13px;
          font-size:13px; color:var(--t-dark-2); }
        .ie .ie-down { display:inline-flex; align-items:center; gap:8px; color:var(--brass); text-decoration:none; }
        .ie-cover-photo { order:-1; height:58vh; min-height:360px; overflow:hidden; }
        .ie-cover-photo::after { content:''; position:absolute; inset:0;
          background:linear-gradient(180deg, rgba(22,18,15,0) 55%, var(--ink) 100%); }

        /* the printed pages */
        .ie-paper { background:var(--paper); color:var(--t-paper); }
        .ie-section { max-width:720px; margin:0 auto; padding:64px 20px; }
        .ie-letter-body p { font-size:19px; line-height:1.7; margin:0 0 18px; }
        /* contain the drop cap: a one-line opening paragraph must not push it into the next */
        .ie-letter-body p:first-child { display:flow-root; }
        .ie-letter-body p:first-child::first-letter { font-family:var(--font-fraunces), Georgia, serif;
          float:left; font-size:64px; line-height:.9; padding:6px 10px 0 0; color:var(--brass-paper); }
        .ie-sign { font-style:italic; color:var(--t-paper-2); margin:8px 0 0; }

        .ie-contents { border-top:1px solid var(--line); padding-top:40px; }
        .ie-contents ol { list-style:none; padding:0; margin:0; }
        .ie-contents li a { display:flex; gap:18px; align-items:baseline; padding:14px 0;
          border-bottom:1px solid var(--line); text-decoration:none; font-size:18px; }
        .ie-contents li a .ie-mono { color:var(--brass-paper); min-width:24px; }
        .ie-contents li a:hover span:last-child { text-decoration:underline; text-underline-offset:4px; }

        .ie-look { max-width:1080px; margin:0 auto; padding:48px 20px; display:grid; gap:28px;
          border-top:1px solid var(--line); scroll-margin-top:24px; }
        .ie-look-photo { aspect-ratio:2 / 3; background:var(--paper-2); overflow:hidden; }
        .ie-look-photo-empty { display:flex; height:100%; align-items:center; justify-content:center;
          color:var(--t-paper-3); }
        .ie-look-title { font-family:var(--font-fraunces), Georgia, serif; font-weight:380;
          font-size:clamp(30px, 6vw, 44px); line-height:1.08; letter-spacing:-.015em; margin:0 0 14px; }
        .ie-look-why { font-size:18px; color:var(--t-paper-2); margin:0 0 26px; }

        .ie-spec { margin:0 0 22px; border-top:1px solid var(--line); }
        .ie-spec > div { display:grid; grid-template-columns:88px 1fr; gap:14px; padding:13px 0;
          border-bottom:1px solid var(--line); }
        .ie-spec dt { color:var(--t-paper-3); padding-top:4px; }
        .ie-spec dd { margin:0; font-size:16px; line-height:1.5; }
        .ie-shop, .ie-products { display:flex; flex-wrap:wrap; gap:6px 14px; margin-top:8px; }
        .ie-shop a, .ie-products a { display:inline-flex; align-items:center; gap:5px;
          font-family:var(--font-jetbrains-mono), monospace; font-size:11px; letter-spacing:.06em;
          color:var(--brass-paper); text-decoration:none; border-bottom:1px solid currentColor; padding-bottom:1px; }
        .ie-products a b { font-weight:700; color:var(--t-paper); }
        .ie-shop .ie-shop-wide { color:var(--t-paper-3); }

        .ie-tags { display:grid; gap:10px; margin:0 0 24px; }
        .ie-tags p { margin:0; font-size:15px; color:var(--t-paper-2); display:grid; gap:4px; }
        .ie-tags .ie-mono { color:var(--brass-paper); font-size:9.5px; }

        .ie-vote { display:flex; flex-wrap:wrap; align-items:center; gap:10px; }
        .ie-vote > .ie-mono { width:100%; color:var(--t-paper-3); }
        .ie-vote button { display:inline-flex; align-items:center; gap:8px; min-height:44px; padding:0 16px;
          border:1px solid var(--line); border-radius:2px; background:transparent; color:var(--t-paper);
          font-family:inherit; font-size:15px; cursor:pointer; transition:background .15s, border-color .15s; }
        .ie-vote button:hover { border-color:var(--t-paper-3); }
        .ie-vote button.on { background:var(--t-paper); border-color:var(--t-paper); color:var(--paper); }
        .ie-vote-error { max-width:1080px; margin:0 auto; padding:0 20px 24px; color:#9E4A38; }

        .ie-piece { background:var(--ink); color:var(--t-dark); padding:72px 20px; text-align:center; }
        .ie-piece h2 { font-family:var(--font-fraunces), Georgia, serif; font-weight:350;
          font-size:clamp(28px, 6vw, 44px); line-height:1.12; max-width:20ch; margin:0 auto 18px; }
        .ie-piece p { max-width:52ch; margin:0 auto 18px; color:var(--t-dark-2); font-size:18px; }
        .ie-piece .ie-brass { color:var(--brass); }
        .ie-piece .ie-piece-in { display:flex; justify-content:center; flex-wrap:wrap; gap:12px;
          color:var(--t-dark-3); font-size:10px; }
        .ie-piece-in a { color:var(--brass); }
        .ie-piece-shop { display:inline-flex; align-items:center; gap:8px; margin-top:10px; padding:15px 24px;
          background:var(--t-dark); color:var(--ink) !important; text-decoration:none; border-radius:2px; }

        .ie-close { text-align:center; }
        .ie-close-note { font-family:var(--font-fraunces), Georgia, serif; font-size:22px; line-height:1.45;
          margin:0 auto 18px; max-width:30ch; }
        .ie-close-reply { color:var(--t-paper-2); margin:0 0 28px; }
        .ie-close-links { display:flex; justify-content:center; gap:20px; margin-bottom:40px; }
        .ie-close-links a { display:inline-flex; align-items:center; gap:6px; color:var(--brass-paper); text-decoration:none; }
        .ie-archive { text-align:left; border-top:1px solid var(--line); padding-top:28px; }
        .ie-archive ul { list-style:none; padding:0; margin:0; }
        .ie-archive a { display:grid; gap:4px; padding:14px 0; border-bottom:1px solid var(--line); text-decoration:none; }
        .ie-archive a .ie-mono { color:var(--t-paper-3); }
        .ie-mark { margin:48px 0 0; color:var(--t-paper-3); letter-spacing:.4em; }

        @media (min-width: 900px) {
          .ie-cover { grid-template-columns:1.05fr 1fr; align-items:stretch; }
          .ie-cover-copy { padding:96px 56px 72px; }
          .ie-cover-photo { order:0; height:auto; min-height:100dvh; }
          .ie-cover-photo::after { background:linear-gradient(90deg, var(--ink) 0%, rgba(22,18,15,0) 30%); }
          .ie-section { padding:96px 20px; }
          .ie-look { grid-template-columns:minmax(0, 440px) minmax(0, 1fr); gap:56px; padding:80px 32px; align-items:start; }
          .ie-look:nth-of-type(even) .ie-look-photo { order:2; }
          .ie-look-photo { position:sticky; top:32px; }
        }
        @media (prefers-reduced-motion: reduce) {
          html:has(.ie) { scroll-behavior:auto; }
        }
      `}</style>
    </div>
  );
}
