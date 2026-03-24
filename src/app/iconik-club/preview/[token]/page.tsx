'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ExternalLink, Loader2, X } from 'lucide-react';
import type { OutfitSetWithItems, FashionItem } from '@/lib/supabase';

const BLUR_PLACEHOLDER = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=';

interface PreviewData {
  client: { name: string; email: string };
  outfits: OutfitSetWithItems[];
}

export default function PreviewPage() {
  const params = useParams();
  const token  = params.token as string;

  const [data, setData]           = useState<PreviewData | null>(null);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<OutfitSetWithItems | null>(null);

  useEffect(() => {
    fetch(`/api/iconik-club/preview/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setData(d);
      })
      .catch(() => setError('Something went wrong'))
      .finally(() => setLoading(false));
  }, [token]);

  const joinUrl = `/iconik-club/join?email=${encodeURIComponent(data?.client.email ?? '')}`;

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-black/25" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="luxury-heading text-3xl text-black mb-4">Link expired</p>
          <p className="text-sm text-black/40 mb-8 leading-relaxed">{error}</p>
          <a
            href="/iconik-club/join"
            className="inline-block text-[10px] tracking-[0.2em] uppercase font-semibold bg-black text-white px-8 py-3.5 hover:bg-black/80 transition-colors"
          >
            Subscribe to Iconik Club
          </a>
        </div>
      </div>
    );
  }

  // ── Outfit detail panel ──────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="bg-white min-h-screen">
        {/* Upgrade banner */}
        <div className="sticky top-0 z-40 bg-[#2a1a24] text-white px-6 py-3 flex items-center justify-between">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#c9a882]">
            This is your personal style preview
          </p>
          <a
            href={joinUrl}
            className="text-[10px] tracking-[0.15em] uppercase font-semibold bg-[#c9a882] text-[#2a1a24] px-4 py-1.5 hover:bg-[#dbb89a] transition-colors whitespace-nowrap"
          >
            Subscribe →
          </a>
        </div>

        <div className="max-w-4xl mx-auto px-6 sm:px-10 pt-10 pb-24">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-black/35 hover:text-black transition-colors mb-14"
          >
            <ArrowLeft size={12} />
            All outfits
          </button>

          <div className="mb-10">
            {selected.occasion && (
              <p className="text-[10px] tracking-[0.3em] uppercase text-black/35 mb-4 font-medium">
                {selected.occasion}
              </p>
            )}
            {selected.ai_style_note && (
              <h1 className="luxury-heading text-4xl sm:text-5xl text-black leading-tight max-w-2xl">
                {selected.ai_style_note}
              </h1>
            )}
          </div>

          {selected.outfit_card_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.outfit_card_url} alt={selected.occasion ?? 'Outfit'} className="w-full object-cover mb-16" />
          ) : (
            <div className="w-full aspect-video bg-[#f5f4f3] flex items-center justify-center mb-16">
              <span className="luxury-heading text-7xl text-black/10">01</span>
            </div>
          )}

          <div>
            <div className="flex items-center gap-6 mb-10">
              <p className="text-[10px] tracking-[0.3em] uppercase text-black/30 whitespace-nowrap">Pieces in this look</p>
              <div className="flex-1 h-px bg-black/10" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-black/[0.06]">
              {selected.items.map((item: FashionItem) => (
                <div key={item.id} className="bg-white overflow-hidden flex flex-col group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url}
                    alt={item.item_name}
                    className="w-full aspect-[3/4] object-cover transition-all duration-500 group-hover:scale-[1.03] group-hover:brightness-[0.97]"
                  />
                  <div className="px-4 pt-3.5 pb-5 flex flex-col flex-1 border-t border-black/[0.06]">
                    {item.brand && (
                      <p className="text-[9px] tracking-[0.25em] uppercase text-black/35 mb-1.5 font-medium">{item.brand}</p>
                    )}
                    <p className="text-sm text-black line-clamp-2 mb-3 flex-1 leading-snug font-medium">{item.item_name}</p>
                    {item.price != null && (
                      <p className="text-xs text-black/50 mb-4 font-medium tracking-wide">
                        {item.currency ?? '₹'}&nbsp;{item.price.toLocaleString()}
                      </p>
                    )}
                    {item.purchase_link && (
                      <a
                        href={item.purchase_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 text-[10px] tracking-[0.15em] uppercase font-semibold text-white bg-black hover:bg-black/80 px-3 py-2.5 transition-colors w-full"
                      >
                        Shop now <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade CTA at bottom of detail */}
          <div className="mt-20 border border-black/10 p-10 text-center">
            <p className="text-[10px] tracking-[0.25em] uppercase text-black/30 mb-4">Want more like this?</p>
            <p className="luxury-heading text-3xl text-black mb-2">New drops, every month.</p>
            <p className="text-sm text-black/40 mb-8 max-w-sm mx-auto leading-relaxed">
              Subscribe to Iconik Club and receive 6 new outfits curated for your body and lifestyle every month. From ₹699.
            </p>
            <a
              href={joinUrl}
              className="inline-block text-[11px] tracking-[0.2em] uppercase font-semibold bg-black text-white px-10 py-4 hover:bg-black/80 transition-colors"
            >
              Subscribe to Iconik Club
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Outfit gallery ───────────────────────────────────────────────────────
  return (
    <div className="bg-white min-h-screen">

      {/* Sticky upgrade banner */}
      <div className="sticky top-0 z-40 bg-[#2a1a24] text-white px-6 py-3 flex items-center justify-between gap-4">
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#c9a882] hidden sm:block">
          Your personal style preview — 30 days access
        </p>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#c9a882] sm:hidden">
          Style preview
        </p>
        <a
          href={joinUrl}
          className="text-[10px] tracking-[0.15em] uppercase font-semibold bg-[#c9a882] text-[#2a1a24] px-4 py-1.5 hover:bg-[#dbb89a] transition-colors whitespace-nowrap flex-shrink-0"
        >
          Subscribe for monthly drops →
        </a>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-10 pt-16 pb-20">

        {/* Heading */}
        <div className="mb-14">
          <p className="text-[10px] tracking-[0.3em] uppercase text-black/30 mb-5">Your style edit</p>
          <h2 className="luxury-heading text-6xl sm:text-7xl text-black leading-none mb-2">
            {data?.client.name?.split(' ')[0]}&apos;s<br /><em>Outfits</em>
          </h2>
          <div className="w-10 h-px bg-black/20 mt-6" />
        </div>

        {data?.outfits.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-black/30 text-sm">Your outfits are being curated — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-black/[0.06]">
            {data?.outfits.map((outfit, idx) => (
              <div
                key={outfit.id}
                onClick={() => setSelected(outfit)}
                className="bg-white overflow-hidden cursor-pointer group relative"
              >
                {outfit.outfit_card_url ? (
                  <div className="relative w-full aspect-[2/3] overflow-hidden">
                    <Image
                      src={outfit.outfit_card_url}
                      alt={outfit.occasion ?? 'Outfit'}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      quality={80}
                      priority={idx < 2}
                      placeholder="blur"
                      blurDataURL={BLUR_PLACEHOLDER}
                      className="object-cover transition-all duration-500 group-hover:scale-[1.03] group-hover:brightness-[0.97]"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[2/3] bg-[#f5f4f3] flex items-center justify-center">
                    <span className="luxury-heading text-5xl text-black/10 select-none">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />
                <div className="px-4 pt-3.5 pb-4 bg-white border-t border-black/[0.06]">
                  {outfit.occasion && (
                    <p className="text-[9px] tracking-[0.25em] uppercase text-black/35 mb-1.5 font-medium">{outfit.occasion}</p>
                  )}
                  {outfit.ai_style_note ? (
                    <p className="luxury-heading text-[15px] text-black leading-snug line-clamp-1">{outfit.ai_style_note}</p>
                  ) : (
                    <p className="text-xs text-black/25 italic">Edit {String(idx + 1).padStart(2, '0')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom upgrade CTA */}
        <div className="mt-20 border border-black/10 p-10 sm:p-14 text-center">
          <p className="text-[10px] tracking-[0.25em] uppercase text-black/30 mb-4">Like what you see?</p>
          <h3 className="luxury-heading text-4xl sm:text-5xl text-black mb-3 leading-tight">
            New outfits,<br /><em>every month.</em>
          </h3>
          <p className="text-sm text-black/40 max-w-sm mx-auto mb-8 leading-relaxed">
            Subscribe to Iconik Club and receive 6 fresh outfits curated for your exact body,
            colour palette, and lifestyle. Every piece is shoppable.
          </p>
          <a
            href={joinUrl}
            className="inline-block text-[11px] tracking-[0.2em] uppercase font-semibold bg-black text-white px-10 py-4 hover:bg-black/80 transition-colors"
          >
            Subscribe from ₹699 / month
          </a>
          <p className="text-[10px] text-black/25 mt-4 tracking-wide">Cancel anytime · 30-day guarantee</p>
        </div>

      </div>
    </div>
  );
}
