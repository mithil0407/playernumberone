'use client';
/* eslint-disable @next/next/no-img-element -- signed storage URLs, sized by CSS */

import { Heart, RotateCcw, X, Loader2, LayoutGrid, Layers } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Segmented, useToast } from '../manAdmin/ui';
import './outfit-review.css';

type Verdict = 'like' | 'dislike';

interface Card {
  id: string;
  imageUrl: string;
  caption: string;
  shoes: string;
  accessories: string;
  styling: string;
  capsule: string;
  ethnic: boolean;
  verdict: Verdict | null;
}

interface Deck {
  cards: Card[];
  totalLooks: number;
  withPictures: number;
  isCurator: boolean;
  adminPreview: boolean;
  mode: 'off' | 'drop_passes' | 'likes_only';
}

type View = 'swipe' | 'liked' | 'passed';

const SWIPE_DISTANCE = 110;

export default function OutfitReviewDeck({ stylistSlug, adminPreview }: { stylistSlug: string; adminPreview: boolean }) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('swipe');
  const [history, setHistory] = useState<Array<{ id: string; previous: Verdict | null }>>([]);
  const [toast, showToast] = useToast();
  const query = adminPreview ? `?stylistSlug=${encodeURIComponent(stylistSlug)}` : '';

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch(`/api/stylist-workspace/outfit-review${query}`, { cache: 'no-store', signal: AbortSignal.timeout(30000) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Could not load the outfits.');
      setDeck(body as Deck);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the outfits.');
    }
  }, [query]);

  useEffect(() => { void load(); }, [load]);

  const setVerdict = useCallback((id: string, verdict: Verdict | null) => {
    setDeck(current => current && { ...current, cards: current.cards.map(card => card.id === id ? { ...card, verdict } : card) });
  }, []);

  const save = useCallback(async (id: string, verdict: Verdict | null, previous: Verdict | null) => {
    setVerdict(id, verdict);
    if (adminPreview) return;
    try {
      const response = await fetch(`/api/stylist-workspace/outfit-review${query}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookId: id, verdict }),
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Could not save that swipe.');
    } catch (saveError) {
      setVerdict(id, previous);
      showToast(saveError instanceof Error ? saveError.message : 'Could not save that swipe.');
    }
  }, [adminPreview, query, setVerdict, showToast]);

  const pending = useMemo(() => deck?.cards.filter(card => !card.verdict) ?? [], [deck]);
  const liked = useMemo(() => deck?.cards.filter(card => card.verdict === 'like') ?? [], [deck]);
  const passed = useMemo(() => deck?.cards.filter(card => card.verdict === 'dislike') ?? [], [deck]);
  const reviewed = liked.length + passed.length;

  const decide = useCallback((verdict: Verdict) => {
    const card = pending[0];
    if (!card) return;
    if (adminPreview) {
      showToast('Admin preview: swipes are not saved. Sign in as the stylist in a private window.');
      return;
    }
    setHistory(items => [...items, { id: card.id, previous: card.verdict }].slice(-200));
    void save(card.id, verdict, card.verdict);
  }, [adminPreview, pending, save, showToast]);

  const rewind = useCallback(() => {
    const last = history.at(-1);
    if (!last) return;
    setHistory(items => items.slice(0, -1));
    const card = deck?.cards.find(item => item.id === last.id);
    // Put the card back on top of the pile.
    setDeck(current => {
      if (!current) return current;
      const target = current.cards.find(item => item.id === last.id);
      if (!target) return current;
      return { ...current, cards: [target, ...current.cards.filter(item => item.id !== last.id)] };
    });
    void save(last.id, last.previous, card?.verdict ?? null);
    setView('swipe');
  }, [deck, history, save]);

  useEffect(() => {
    if (view !== 'swipe') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && /input|textarea|select/i.test(event.target.tagName)) return;
      if (event.key === 'ArrowRight') decide('like');
      else if (event.key === 'ArrowLeft') decide('dislike');
      else if (event.key === 'Backspace' || event.key.toLowerCase() === 'z') rewind();
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [decide, rewind, view]);

  if (error) {
    return <div className="or-empty">
      <p>{error}</p>
      <button type="button" className="ma-btn ma-btn--secondary" onClick={() => void load()}>Try again</button>
    </div>;
  }
  if (!deck) return <div className="or-empty"><Loader2 className="animate-spin" size={20} aria-label="Loading" /></div>;

  const stillDrawing = deck.totalLooks - deck.withPictures;

  return (
    <div className="or-root">
      <header className="or-head">
        <div>
          <p className="ma-eyebrow">Outfit library</p>
          <h1 className="or-title">Keep the looks you&rsquo;d send a client</h1>
          <p className="ma-muted or-sub">
            Swipe right to keep, left to pass. Only kept looks go into client recommendations.
          </p>
        </div>
        <div className="or-progress" aria-live="polite">
          <div className="or-bar"><span style={{ width: `${deck.totalLooks ? (reviewed / deck.totalLooks) * 100 : 0}%` }} /></div>
          <p><strong>{reviewed}</strong> of {deck.totalLooks} reviewed · <span className="or-like-ink">{liked.length} kept</span> · {passed.length} passed</p>
        </div>
      </header>

      {adminPreview && <p className="or-note or-note--strong" role="alert">
        Admin preview: swipes are <strong>not saved</strong> on this browser. To swipe as {stylistSlug}, sign in on her own phone or in a private window.
      </p>}
      {!adminPreview && !deck.isCurator && <p className="or-note">Your swipes are saved for reference. Client recommendations follow the head stylist&rsquo;s picks.</p>}

      <Segmented<View>
        value={view}
        onChange={setView}
        options={[
          { value: 'swipe', label: 'To review', count: pending.length },
          { value: 'liked', label: 'Kept', count: liked.length },
          { value: 'passed', label: 'Passed', count: passed.length },
        ]}
      />

      {view === 'swipe'
        ? <SwipeStack
          cards={pending}
          onDecide={decide}
          onRewind={rewind}
          canRewind={history.length > 0}
          stillDrawing={stillDrawing}
          onRefresh={() => void load()}
        />
        : <ReviewedGrid
          cards={view === 'liked' ? liked : passed}
          kind={view}
          onFlip={card => {
            const next: Verdict = card.verdict === 'like' ? 'dislike' : 'like';
            setHistory(items => [...items, { id: card.id, previous: card.verdict }]);
            void save(card.id, next, card.verdict);
          }}
        />}
      {toast}
    </div>
  );
}

function SwipeStack({ cards, onDecide, onRewind, canRewind, stillDrawing, onRefresh }: {
  cards: Card[];
  onDecide: (verdict: Verdict) => void;
  onRewind: () => void;
  canRewind: boolean;
  stillDrawing: number;
  onRefresh: () => void;
}) {
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [leaving, setLeaving] = useState<Verdict | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const top = cards[0];
  const next = cards[1];

  // Warm the next few pictures so swiping never waits on a download.
  useEffect(() => {
    for (const card of cards.slice(1, 5)) {
      const image = new Image();
      image.src = card.imageUrl;
    }
  }, [cards]);

  useEffect(() => { setShowDetails(false); }, [top?.id]);

  const fling = useCallback((verdict: Verdict) => {
    if (leaving || !top) return;
    setLeaving(verdict);
    window.setTimeout(() => {
      onDecide(verdict);
      setLeaving(null);
      setDrag({ x: 0, y: 0, active: false });
    }, 220);
  }, [leaving, onDecide, top]);

  if (!top) {
    return <div className="or-done">
      <p className="or-done-title">{stillDrawing > 0 ? 'You’re all caught up' : 'Every look reviewed'}</p>
      <p className="ma-muted">
        {stillDrawing > 0
          ? `${stillDrawing} more pictures are still being made. Check back later; new ones join the pile.`
          : 'Thank you. Recommendations now use only the looks you kept.'}
      </p>
      <div className="or-done-actions">
        {canRewind && <button type="button" className="ma-btn ma-btn--secondary" onClick={onRewind}><RotateCcw size={15} /> Rewind last</button>}
        {stillDrawing > 0 && <button type="button" className="ma-btn ma-btn--dark" onClick={onRefresh}>Check for new looks</button>}
      </div>
    </div>;
  }

  const offset = leaving ? (leaving === 'like' ? 1 : -1) * 700 : drag.x;
  const lean = Math.max(-1, Math.min(1, offset / SWIPE_DISTANCE));

  return (
    <div className="or-stage">
      <div className="or-stack">
        {next && <div className="or-card or-card--under" aria-hidden="true">
          <img src={next.imageUrl} alt="" draggable={false} />
        </div>}
        <div
          key={top.id}
          className={`or-card${drag.active ? ' is-dragging' : ''}`}
          style={{ transform: `translate(${offset}px, ${leaving ? drag.y : drag.y * 0.3}px) rotate(${offset / 18}deg)` }}
          onPointerDown={event => {
            if (leaving) return;
            (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
            start.current = { x: event.clientX, y: event.clientY, t: Date.now() };
            setDrag({ x: 0, y: 0, active: true });
          }}
          onPointerMove={event => {
            if (!start.current) return;
            setDrag({ x: event.clientX - start.current.x, y: event.clientY - start.current.y, active: true });
          }}
          onPointerUp={event => {
            if (!start.current) return;
            const dx = event.clientX - start.current.x;
            const speed = Math.abs(dx) / Math.max(1, Date.now() - start.current.t);
            start.current = null;
            if (Math.abs(dx) > SWIPE_DISTANCE || (Math.abs(dx) > 40 && speed > 0.6)) fling(dx > 0 ? 'like' : 'dislike');
            else setDrag({ x: 0, y: 0, active: false });
          }}
          onPointerCancel={() => { start.current = null; setDrag({ x: 0, y: 0, active: false }); }}
        >
          <img src={top.imageUrl} alt={top.caption} draggable={false} />
          <span className="or-stamp or-stamp--like" style={{ opacity: Math.max(0, lean) }}>Keep</span>
          <span className="or-stamp or-stamp--pass" style={{ opacity: Math.max(0, -lean) }}>Pass</span>
          <span className="or-tag">{top.ethnic ? 'Ethnic · ' : ''}{top.capsule}</span>
        </div>
      </div>

      <div className="or-actions">
        <button type="button" className="or-round or-round--small" onClick={onRewind} disabled={!canRewind} aria-label="Rewind the last swipe" title="Rewind (Backspace)">
          <RotateCcw size={20} />
        </button>
        <button type="button" className="or-round or-round--pass" onClick={() => fling('dislike')} aria-label="Pass" title="Pass (←)">
          <X size={30} />
        </button>
        <button type="button" className="or-round or-round--like" onClick={() => fling('like')} aria-label="Keep" title="Keep (→)">
          <Heart size={28} />
        </button>
        <button type="button" className="or-round or-round--small" onClick={() => setShowDetails(open => !open)} aria-expanded={showDetails} aria-label="Outfit details" title="Outfit details">
          {showDetails ? <Layers size={20} /> : <LayoutGrid size={20} />}
        </button>
      </div>

      <p className="or-caption">{top.caption}</p>
      {showDetails && <dl className="or-details">
        {top.shoes && <><dt>Shoes</dt><dd>{top.shoes}</dd></>}
        {top.accessories && <><dt>Extras</dt><dd>{top.accessories}</dd></>}
        {top.styling && <><dt>Worn</dt><dd>{top.styling}</dd></>}
      </dl>}
      <p className="or-hint ma-faint">On a laptop: → keep, ← pass, Backspace rewinds.</p>
    </div>
  );
}

function ReviewedGrid({ cards, kind, onFlip }: { cards: Card[]; kind: 'liked' | 'passed'; onFlip: (card: Card) => void }) {
  if (!cards.length) {
    return <div className="or-done"><p className="ma-muted">{kind === 'liked' ? 'Looks you keep will show here.' : 'Looks you pass on will show here.'}</p></div>;
  }
  return (
    <div>
      <p className="ma-muted or-grid-note">Changed your mind? Tap a look to move it to {kind === 'liked' ? 'Passed' : 'Kept'}.</p>
      <ul className="or-grid">
        {cards.map(card => (
          <li key={card.id}>
            <button type="button" onClick={() => onFlip(card)} aria-label={`${kind === 'liked' ? 'Pass on' : 'Keep'}: ${card.caption}`}>
              <img src={card.imageUrl} alt="" loading="lazy" />
              <span className={`or-grid-flip ${kind === 'liked' ? 'or-grid-flip--pass' : 'or-grid-flip--like'}`}>
                {kind === 'liked' ? <><X size={13} /> Pass</> : <><Heart size={13} /> Keep</>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
