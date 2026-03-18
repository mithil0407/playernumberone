'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import type { OutfitSetWithItems, FashionItem } from '@/lib/supabase';

export default function OutfitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [outfit, setOutfit] = useState<OutfitSetWithItems | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/iconik-club/outfits/${params.id}`)
      .then(r => r.json())
      .then(d => { if (d.outfit) setOutfit(d.outfit); })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-white">
        <Loader2 size={18} className="animate-spin text-black/30" />
      </div>
    );
  }

  if (!outfit) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-black/30 text-sm mb-4">Outfit not found.</p>
          <button onClick={() => router.back()} className="text-xs tracking-[0.15em] uppercase text-black/50 hover:text-black transition-colors">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 sm:px-10 pt-10 pb-24">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-black/35 hover:text-black transition-colors mb-14"
        >
          <ArrowLeft size={12} />
          All outfits
        </button>

        {/* Editorial header */}
        <div className="mb-10">
          {outfit.occasion && (
            <p className="text-[10px] tracking-[0.3em] uppercase text-black/35 mb-4 font-medium">
              {outfit.occasion}
            </p>
          )}
          {outfit.ai_style_note && (
            <h1 className="luxury-heading text-4xl sm:text-5xl text-black leading-tight max-w-2xl">
              {outfit.ai_style_note}
            </h1>
          )}
        </div>

        {/* Outfit card image */}
        {outfit.outfit_card_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={outfit.outfit_card_url}
            alt={outfit.occasion ?? 'Outfit'}
            className="w-full object-cover mb-16"
          />
        ) : (
          <div className="w-full aspect-video bg-[#f5f4f3] flex items-center justify-center mb-16">
            <span className="luxury-heading text-7xl text-black/10">01</span>
          </div>
        )}

        {/* Items section */}
        <div>
          <div className="flex items-center gap-6 mb-10">
            <p className="text-[10px] tracking-[0.3em] uppercase text-black/30 whitespace-nowrap">Pieces in this look</p>
            <div className="flex-1 h-px bg-black/10" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-black/[0.06]">
            {outfit.items.map((item: FashionItem) => (
              <div key={item.id} className="bg-white overflow-hidden flex flex-col group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_url}
                  alt={item.item_name}
                  className="w-full aspect-[3/4] object-cover transition-all duration-500 group-hover:scale-[1.03] group-hover:brightness-[0.97]"
                />
                <div className="px-4 pt-3.5 pb-5 flex flex-col flex-1 border-t border-black/[0.06]">
                  {item.brand && (
                    <p className="text-[9px] tracking-[0.25em] uppercase text-black/35 mb-1.5 font-medium">
                      {item.brand}
                    </p>
                  )}
                  <p className="text-sm text-black line-clamp-2 mb-3 flex-1 leading-snug font-medium">
                    {item.item_name}
                  </p>
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

      </div>
    </div>
  );
}
