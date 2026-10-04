'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LookItemView, LookView } from '@/lib/agentLookView';

const SLOT_LABELS: Record<string, string> = {
  top: 'Top',
  bottom: 'Bottom',
  dress: 'Dress',
  ethnic_set: 'Ethnic set',
  layer: 'Layer',
  shoes: 'Shoes',
  bag: 'Bag',
  accessory: 'Finishing touch',
  other: 'Also',
};
const SLOT_ORDER = ['dress', 'ethnic_set', 'top', 'bottom', 'layer', 'shoes', 'bag', 'accessory', 'other'];
const POLL_MS = 8_000;

type Reaction = 'like' | 'dislike' | null;

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: reactions still post, they just won't persist locally.
  }
}

function visitorId() {
  let id = readStorage('iconik-visitor');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    writeStorage('iconik-visitor', id);
  }
  return id;
}

function formatInr(value: number | null) {
  return value && value > 0 ? `₹${Math.round(value).toLocaleString('en-IN')}` : null;
}

function VerificationBadge({ item }: { item: LookItemView }) {
  if (item.status === 'pending' || item.status === 'checking') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-[#7A6F63]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#B8862F]" />
        Checking {item.sizeChecked ? 'your size' : 'stock'} on the store…
      </span>
    );
  }
  if (item.status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#2F6B45]">
        <span aria-hidden>✓</span> {item.sizeChecked ? 'Your size is in stock' : 'In stock'} · checked on the store
      </span>
    );
  }
  if (item.status === 'unavailable') {
    return (
      <span className="text-[12px] font-medium text-[#A2442C]">
        Not available in your size right now{item.availableSizes.length ? ` · left: ${item.availableSizes.slice(0, 4).join(', ')}` : ''}
      </span>
    );
  }
  return <span className="text-[12px] text-[#7A6F63]">Couldn&apos;t confirm stock — check sizes on the store</span>;
}

function ItemCard({
  item,
  reaction,
  saved,
  onReact,
  onSave,
  visitor,
  friendMode,
  votedFor,
  onVote,
}: {
  item: LookItemView;
  reaction: Reaction;
  saved: boolean;
  onReact: (item: LookItemView, reaction: Reaction) => void;
  onSave: (item: LookItemView) => void;
  visitor: string;
  friendMode: boolean;
  votedFor: string | null;
  onVote: (item: LookItemView) => void;
}) {
  const price = formatInr(item.priceInr);
  const unavailable = item.status === 'unavailable';
  return (
    <article className={`overflow-hidden rounded-2xl bg-white shadow-[0_1px_0_rgba(30,26,22,0.06),0_8px_24px_-12px_rgba(30,26,22,0.18)] ${unavailable ? 'opacity-70' : ''}`}>
      <div className={`relative w-full bg-[#EFE8DD] ${item.imageUrl ? 'aspect-[4/5]' : 'h-32'}`}>
        {item.imageUrl ? (
          // Retailer images come from many CDNs, so they are not routed through next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#9A8E80]">{item.retailer ?? 'Store'}</span>
            <span className="text-[15px] leading-snug text-[#4A4037]" style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}>{item.title}</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => onSave(item)}
          aria-pressed={saved}
          aria-label={saved ? 'Remove from saved' : 'Save'}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[18px] shadow-sm backdrop-blur transition active:scale-95"
        >
          {saved ? '★' : '☆'}
        </button>
      </div>
      <div className="space-y-2.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#9A8E80]">{item.retailer}</p>
            <h3 className="mt-0.5 text-[15px] font-medium leading-snug text-[#1E1A16]">{item.title}</h3>
          </div>
          {price ? <p className="shrink-0 text-[15px] font-semibold text-[#1E1A16]">{price}</p> : null}
        </div>
        {item.reason ? <p className="text-[14px] leading-relaxed text-[#4A4037]">{item.reason}</p> : null}
        {item.votes > 0 ? (
          <p className="text-[12px] font-medium text-[#1E1A16]">
            {item.votes} {item.votes === 1 ? 'friend votes' : 'friends vote'} for this
          </p>
        ) : null}
        <VerificationBadge item={item} />
        {item.offer && item.status === 'verified' ? <p className="text-[12px] text-[#B8862F]">{item.offer}</p> : null}
        <div className="flex items-center gap-2 pt-1">
          {friendMode ? (
            <button
              type="button"
              onClick={() => onVote(item)}
              disabled={Boolean(votedFor)}
              aria-pressed={votedFor === item.id}
              className={`h-11 flex-1 rounded-full border text-[14px] transition active:scale-[0.98] disabled:cursor-default ${votedFor === item.id ? 'border-[#1E1A16] bg-[#1E1A16] text-white' : 'border-[#D9CFC2] text-[#1E1A16] disabled:opacity-50'}`}
            >
              {votedFor === item.id ? '✓ Your vote' : 'Vote for this'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onReact(item, reaction === 'like' ? null : 'like')}
                aria-pressed={reaction === 'like'}
                className={`h-11 flex-1 rounded-full border text-[14px] transition active:scale-[0.98] ${reaction === 'like' ? 'border-[#1E1A16] bg-[#1E1A16] text-white' : 'border-[#D9CFC2] text-[#1E1A16]'}`}
              >
                ♥ Love it
              </button>
              <button
                type="button"
                onClick={() => onReact(item, reaction === 'dislike' ? null : 'dislike')}
                aria-pressed={reaction === 'dislike'}
                aria-label="Not for me"
                className={`h-11 w-11 shrink-0 rounded-full border text-[15px] transition active:scale-95 ${reaction === 'dislike' ? 'border-[#1E1A16] bg-[#1E1A16] text-white' : 'border-[#D9CFC2] text-[#1E1A16]'}`}
              >
                ✕
              </button>
            </>
          )}
          <a
            href={`/go/${item.id}?v=${encodeURIComponent(visitor)}`}
            target="_blank"
            rel="noopener"
            className="flex h-11 flex-1 items-center justify-center rounded-full bg-[#B8862F] text-[14px] font-medium text-white transition active:scale-[0.98]"
          >
            Shop →
          </a>
        </div>
      </div>
    </article>
  );
}

export default function LookPageClient({ initial }: { initial: LookView }) {
  const [look, setLook] = useState(initial);
  const [reactions, setReactions] = useState<Record<string, Reaction>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [visitor, setVisitor] = useState('');
  const [shareLabel, setShareLabel] = useState('Ask friends to vote');
  // A shared link (?f=1) opens in friend mode: vote instead of like/dislike.
  const [friendMode, setFriendMode] = useState(false);
  const [votedFor, setVotedFor] = useState<string | null>(null);

  const post = useCallback((type: string, itemId?: string) => {
    void fetch(`/api/look/${look.slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, item_id: itemId ?? null, visitor_id: visitorId() }),
      keepalive: true,
    }).catch(() => undefined);
  }, [look.slug]);

  useEffect(() => {
    setVisitor(visitorId());
    setFriendMode(new URLSearchParams(window.location.search).get('f') === '1');
    setVotedFor(readStorage(`iconik-look-vote-${look.slug}`));
    const stored = readStorage(`iconik-look-${look.slug}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { reactions?: Record<string, Reaction>; saved?: Record<string, boolean> };
        setReactions(parsed.reactions ?? {});
        setSaved(parsed.saved ?? {});
      } catch {
        // Ignore a corrupt local copy.
      }
    }
    let viewedKey = '';
    try {
      viewedKey = `iconik-look-viewed-${look.slug}`;
      if (!window.sessionStorage.getItem(viewedKey)) {
        window.sessionStorage.setItem(viewedKey, '1');
        post('view');
      }
    } catch {
      post('view');
    }
  }, [look.slug, post]);

  useEffect(() => {
    writeStorage(`iconik-look-${look.slug}`, JSON.stringify({ reactions, saved }));
  }, [look.slug, reactions, saved]);

  const checking = look.items.some(item => item.status === 'pending' || item.status === 'checking');
  useEffect(() => {
    if (!checking) return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/look/${look.slug}`, { cache: 'no-store' }).catch(() => null);
      if (!response?.ok) return;
      const body = await response.json().catch(() => null) as { look?: LookView } | null;
      if (body?.look) setLook(body.look);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [checking, look.slug]);

  const groups = useMemo(() => {
    const bySlot = new Map<string, LookItemView[]>();
    for (const item of look.items) bySlot.set(item.slot, [...(bySlot.get(item.slot) ?? []), item]);
    return [...bySlot.entries()].sort((a, b) => SLOT_ORDER.indexOf(a[0]) - SLOT_ORDER.indexOf(b[0]));
  }, [look.items]);

  const verified = look.items.filter(item => item.status === 'verified').length;
  // One piece per slot: options in the same slot are alternatives, so count the cheapest available one.
  const total = groups.reduce((sum, [, items]) => {
    const prices = items
      .filter(item => item.status !== 'unavailable' && item.priceInr)
      .map(item => item.priceInr as number);
    return sum + (prices.length ? Math.min(...prices) : 0);
  }, 0);

  const react = (item: LookItemView, next: Reaction) => {
    setReactions(current => ({ ...current, [item.id]: next }));
    if (next) post(next, item.id);
  };
  const toggleSave = (item: LookItemView) => {
    const next = !saved[item.id];
    setSaved(current => ({ ...current, [item.id]: next }));
    post(next ? 'save' : 'unsave', item.id);
  };
  const vote = (item: LookItemView) => {
    if (votedFor) return;
    setVotedFor(item.id);
    writeStorage(`iconik-look-vote-${look.slug}`, item.id);
    setLook(current => ({
      ...current,
      items: current.items.map(entry => (entry.id === item.id ? { ...entry, votes: entry.votes + 1 } : entry)),
    }));
    post('vote', item.id);
  };
  const share = async () => {
    post('share');
    const url = new URL(window.location.href);
    url.searchParams.set('f', '1');
    try {
      if (navigator.share) {
        await navigator.share({ title: look.title, text: 'Help me pick — which one? 👀', url: url.toString() });
        return;
      }
      await navigator.clipboard.writeText(url.toString());
      setShareLabel('Link copied');
      window.setTimeout(() => setShareLabel('Ask friends to vote'), 2_000);
    } catch {
      // The share sheet was dismissed.
    }
  };

  return (
    <main className="min-h-screen bg-[#F6F1E9] pb-16 text-[#1E1A16]">
      <div className="mx-auto max-w-xl px-4">
        <header className="pb-6 pt-8">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#9A8E80]">
            ICONIK{look.firstName ? ` · for ${look.firstName}` : ''}
          </p>
          {friendMode ? (
            <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-[15px] leading-snug text-[#1E1A16] shadow-[0_1px_0_rgba(30,26,22,0.06)]">
              {look.firstName ?? 'Your friend'} can&apos;t decide — which one should they pick? Tap <b>Vote for this</b> on your favourite.
            </p>
          ) : null}
          <h1 className="mt-3 text-[32px] leading-[1.1] tracking-tight" style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}>
            {look.title}
          </h1>
          {look.occasion ? <p className="mt-2 text-[13px] uppercase tracking-[0.14em] text-[#B8862F]">{look.occasion}</p> : null}
          {look.intro ? <p className="mt-4 text-[16px] leading-relaxed text-[#4A4037]">{look.intro}</p> : null}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#7A6F63]">
            <span>{groups.length} {groups.length === 1 ? 'piece' : 'pieces'}</span>
            {formatInr(total) ? <span>from {formatInr(total)} for the full look</span> : null}
            <span>{checking ? 'checking stock in your size…' : `${verified} of ${look.items.length} checked in stock`}</span>
          </div>
        </header>

        <div className="space-y-8">
          {groups.map(([slot, items]) => (
            <section key={slot}>
              <h2 className="mb-3 text-[12px] uppercase tracking-[0.2em] text-[#9A8E80]">
                {SLOT_LABELS[slot] ?? slot}{items.length > 1 ? ` · ${items.length} options` : ''}
              </h2>
              <div className="space-y-4">
                {items.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    reaction={reactions[item.id] ?? null}
                    saved={Boolean(saved[item.id])}
                    onReact={react}
                    onSave={toggleSave}
                    visitor={visitor}
                    friendMode={friendMode}
                    votedFor={votedFor}
                    onVote={vote}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-10 space-y-3 text-center">
          {friendMode ? (
            <>
              <a
                href={look.inviteUrl ?? 'https://www.iconik.pro'}
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#1E1A16] text-[15px] font-medium text-white transition active:scale-[0.99]"
              >
                Get your own AI stylist on WhatsApp
              </a>
              <p className="text-[13px] leading-relaxed text-[#7A6F63]">
                ICONIK reads your best colours from a selfie and finds clothes that suit you, checked in your size.
                {look.inviteUrl ? ` ${look.firstName ?? 'Your friend'}'s invite gets you both extra product hunts.` : ''}
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={share}
                className="h-12 w-full rounded-full border border-[#1E1A16] text-[15px] font-medium transition active:scale-[0.99]"
              >
                {shareLabel}
              </button>
              <p className="text-[13px] leading-relaxed text-[#7A6F63]">
                Tap ♥ on what you love — your stylist sees it and gets sharper every time.
                Reply on WhatsApp to swap anything.
              </p>
            </>
          )}
        </footer>
      </div>
    </main>
  );
}
