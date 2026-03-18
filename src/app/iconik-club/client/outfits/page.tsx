'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { OutfitSetWithItems } from '@/lib/supabase';

// Warm-cream 1×1 JPEG — shown while the real image loads
const BLUR_PLACEHOLDER = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=';

function OutfitSkeleton() {
  return (
    <div className="bg-white border border-black/[0.07] overflow-hidden animate-pulse">
      <div className="bg-[#f0efee] aspect-[2/3] w-full" />
      <div className="px-4 py-4 space-y-2.5">
        <div className="h-2 bg-black/8 rounded-full w-1/4" />
        <div className="h-3 bg-black/5 rounded-full w-3/4" />
      </div>
    </div>
  );
}

export default function OutfitsPage() {
  const router = useRouter();
  const [outfits, setOutfits] = useState<OutfitSetWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const generateFiredRef = useRef(false);

  useEffect(() => {
    fetch('/api/iconik-club/clients/profile')
      .then(r => r.json())
      .then(d => {
        if (!d.profile?.onboarding_complete) {
          router.replace('/iconik-club/client/onboarding');
        }
      });
  }, [router]);

  useEffect(() => {
    async function fetchOutfits(): Promise<boolean> {
      const res = await fetch('/api/iconik-club/outfits/list');
      const data = await res.json();
      if (data.outfits?.length) {
        setOutfits(data.outfits);
        setGenerating(false);
        return true;
      }
      return false;
    }

    async function init() {
      const hasOutfits = await fetchOutfits();
      setLoading(false);

      if (!hasOutfits) {
        setGenerating(true);
        if (!generateFiredRef.current) {
          generateFiredRef.current = true;
          fetch('/api/iconik-club/outfits/generate', { method: 'POST' }).catch(console.error);
        }
        pollRef.current = setInterval(async () => {
          const done = await fetchOutfits();
          if (done && pollRef.current) clearInterval(pollRef.current);
        }, 4000);
      }
    }

    init();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 pt-16 pb-20">
          {/* Heading skeleton */}
          <div className="mb-14">
            <div className="h-2.5 w-24 bg-black/8 rounded-full mb-5 animate-pulse" />
            <div className="space-y-3 mb-6">
              <div className="h-14 w-48 bg-black/[0.07] rounded animate-pulse" />
              <div className="h-14 w-64 bg-black/[0.05] rounded animate-pulse" />
            </div>
            <div className="w-10 h-px bg-black/10" />
          </div>

          {/* Grid skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-black/[0.06]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white overflow-hidden">
                <div
                  className="w-full aspect-[2/3] animate-pulse"
                  style={{ backgroundColor: `hsl(0, 0%, ${94 - i * 1.5}%)` }}
                />
                <div className="px-4 pt-3.5 pb-4 border-t border-black/[0.06] space-y-2 animate-pulse">
                  <div className="h-2 w-16 bg-black/8 rounded-full" />
                  <div className="h-3.5 w-4/5 bg-black/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 pt-16 pb-10">
          {/* Header */}
          <div className="mb-14">
            <p className="text-[10px] tracking-[0.3em] uppercase text-black/30 mb-5">Your style edit</p>
            <h2 className="luxury-heading text-6xl sm:text-7xl text-black leading-none mb-6">
              Your<br /><em>Outfits</em>
            </h2>
            <div className="w-10 h-px bg-black/20" />
          </div>

          <p className="text-xs tracking-[0.15em] uppercase text-black/35 mb-10">
            Curating your edit — this takes a moment
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-black/[0.06]">
            {Array.from({ length: 6 }).map((_, i) => <OutfitSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 pt-16 pb-20">

        {/* ── Page heading ────────────────────────────────── */}
        <div className="mb-14">
          <p className="text-[10px] tracking-[0.3em] uppercase text-black/30 mb-5">Your style edit</p>
          <h2 className="luxury-heading text-6xl sm:text-7xl text-black leading-none mb-6">
            Your<br /><em>Outfits</em>
          </h2>
          <div className="w-10 h-px bg-black/20" />
        </div>

        {/* ── Grid ────────────────────────────────────────── */}
        {/*
          Thin 1px black/6 lines between cards create a clean editorial grid.
          gap-px on a dark bg achieves this with zero extra markup.
        */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-black/[0.06]">
          {outfits.map((outfit, idx) => (
            <div
              key={outfit.id}
              onClick={() => router.push(`/iconik-club/client/outfits/${outfit.id}`)}
              className="bg-white overflow-hidden cursor-pointer group relative"
            >
              {/* Image */}
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

              {/* Hover overlay — subtle dark veil at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />

              {/* Caption strip */}
              <div className="px-4 pt-3.5 pb-4 bg-white border-t border-black/[0.06]">
                {outfit.occasion && (
                  <p className="text-[9px] tracking-[0.25em] uppercase text-black/35 mb-1.5 font-medium">
                    {outfit.occasion}
                  </p>
                )}
                {outfit.ai_style_note ? (
                  <p className="luxury-heading text-[15px] text-black leading-snug line-clamp-1">
                    {outfit.ai_style_note}
                  </p>
                ) : (
                  <p className="text-xs text-black/25 italic">Edit {String(idx + 1).padStart(2, '0')}</p>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
