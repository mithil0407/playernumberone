'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Send, Sparkles, ThumbsDown, ThumbsUp, Upload } from 'lucide-react';
import type { ReportData } from '@/lib/manReportGenerator';

const INK = '#1B1815';
const SOFT = '#5A524A';
const IVORY = '#FBF8F4';
const SHELL = '#F5EFE5';
const BORDER = '#E8DDC9';
const ACCENT = '#B97A3A';

interface FeedbackRow {
  outfit_key: string;
  vote: 'like' | 'dislike';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image_url?: string | null;
}

interface Recommendation {
  id: string;
  month_start: string;
  issue_number: number;
  page_data?: {
    title?: string;
    subtitle?: string;
    diagnosis?: string;
    outfits?: Array<{
      title?: string;
      occasion?: string;
      formula?: string;
      colourLogic?: string;
      fitLogic?: string;
      shoppingNotes?: string;
    }>;
    paletteNotes?: string[];
    avoidThisMonth?: string[];
    stylistNote?: string;
  };
}

interface StatusResponse {
  active: boolean;
  feedback: FeedbackRow[];
  recommendations: Recommendation[];
}

interface ParsedOutfit {
  key: string;
  number: number;
  label: string;
}

function parseOutfits(data: ReportData): ParsedOutfit[] {
  const text = data.sections?.s4_outfits ?? '';
  const matches = [...text.matchAll(/(?:\*\*)?OUTFIT\s+(\d+)\s*[—–-]\s*([^*\n]+)(?:\*\*)?/gi)];
  return matches.slice(0, 24).map(match => {
    const number = Number(match[1]);
    const label = match[2].replace(/\*+/g, '').trim();
    return {
      key: `outfit-${number}`,
      number,
      label: label || `Outfit ${number}`,
    };
  });
}

export default function ManEditPanel({
  shareToken,
  reportData,
}: {
  shareToken: string;
  reportData: ReportData;
}) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [feedbackBusy, setFeedbackBusy] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const outfits = useMemo(() => parseOutfits(reportData), [reportData]);
  const feedbackMap = useMemo(() => {
    return Object.fromEntries((status?.feedback ?? []).map(item => [item.outfit_key, item.vote]));
  }, [status?.feedback]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/man-edit/public/${shareToken}/status`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setStatus(data);
        if (data.active) {
          const chatRes = await fetch(`/api/man-edit/public/${shareToken}/chat`, { cache: 'no-store' });
          if (chatRes.ok) {
            const chatData = await chatRes.json();
            if (!cancelled) setMessages(chatData.messages ?? []);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [shareToken]);

  const saveFeedback = async (outfit: ParsedOutfit, vote: 'like' | 'dislike') => {
    setFeedbackBusy(outfit.key);
    try {
      const res = await fetch(`/api/man-edit/public/${shareToken}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outfit_key: outfit.key,
          outfit_number: outfit.number,
          outfit_label: outfit.label,
          vote,
        }),
      });
      if (!res.ok) throw new Error('Feedback failed');
      setStatus(prev => {
        if (!prev) return prev;
        const rest = prev.feedback.filter(item => item.outfit_key !== outfit.key);
        return { ...prev, feedback: [...rest, { outfit_key: outfit.key, vote }] };
      });
    } finally {
      setFeedbackBusy('');
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      const optimistic: ChatMessage = {
        id: `local-${Date.now()}`,
        role: 'user',
        content: message.trim(),
        image_url: image ? URL.createObjectURL(image) : null,
      };
      setMessages(prev => [...prev, optimistic]);

      const form = new FormData();
      form.set('message', message.trim());
      if (image) form.set('image', image);
      setMessage('');
      setImage(null);

      const res = await fetch(`/api/man-edit/public/${shareToken}/chat`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chat failed');
      setMessages(prev => [
        ...prev.filter(item => item.id !== optimistic.id),
        data.userMessage,
        data.assistantMessage,
      ]);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <section className="px-5 md:px-12 py-10" style={{ background: IVORY }}>
        <div className="max-w-5xl mx-auto flex items-center gap-3" style={{ color: SOFT }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs uppercase tracking-[0.2em]">Loading Iconik Edit</span>
        </div>
      </section>
    );
  }

  if (!status?.active) return null;

  return (
    <section className="px-5 md:px-12 py-12 border-t" style={{ background: IVORY, borderColor: BORDER, color: INK }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-[10px] uppercase font-bold mb-3" style={{ color: ACCENT, letterSpacing: '0.26em' }}>Iconik Edit</p>
          <h2 className="font-serif text-3xl md:text-5xl leading-tight">Your stylist, now calibrated to your taste.</h2>
          <p className="mt-3 max-w-2xl text-sm md:text-base leading-7" style={{ color: SOFT }}>
            Like or dislike the outfit formulas, then ask your stylist for decisions on outfits, shopping, grooming, and monthly updates.
          </p>
        </div>

        {outfits.length > 0 && (
          <div className="mb-8 border" style={{ borderColor: BORDER, background: SHELL, borderRadius: 8 }}>
            <div className="p-5 border-b" style={{ borderColor: BORDER }}>
              <p className="text-[10px] uppercase font-bold" style={{ color: ACCENT, letterSpacing: '0.22em' }}>Outfit Feedback</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: BORDER }}>
              {outfits.map(outfit => {
                const vote = feedbackMap[outfit.key];
                const busy = feedbackBusy === outfit.key;
                return (
                  <div key={outfit.key} className="p-4" style={{ background: '#FFFFFF' }}>
                    <p className="text-[10px] uppercase font-bold mb-1" style={{ color: ACCENT, letterSpacing: '0.18em' }}>
                      Outfit {String(outfit.number).padStart(2, '0')}
                    </p>
                    <p className="font-serif text-lg leading-snug mb-4">{outfit.label}</p>
                    <div className="flex gap-2">
                      <button
                        disabled={busy}
                        onClick={() => saveFeedback(outfit, 'like')}
                        className="h-9 w-9 flex items-center justify-center border transition disabled:opacity-50"
                        style={{ borderColor: vote === 'like' ? ACCENT : BORDER, background: vote === 'like' ? '#F4E4D4' : '#FFFFFF', borderRadius: 8 }}
                        aria-label={`Like ${outfit.label}`}
                      >
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => saveFeedback(outfit, 'dislike')}
                        className="h-9 w-9 flex items-center justify-center border transition disabled:opacity-50"
                        style={{ borderColor: vote === 'dislike' ? ACCENT : BORDER, background: vote === 'dislike' ? '#F4E4D4' : '#FFFFFF', borderRadius: 8 }}
                        aria-label={`Dislike ${outfit.label}`}
                      >
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6">
          <div className="border bg-white" style={{ borderColor: BORDER, borderRadius: 8 }}>
            <div className="p-5 border-b flex items-center gap-2" style={{ borderColor: BORDER }}>
              <Sparkles className="w-4 h-4" style={{ color: ACCENT }} />
              <p className="text-[10px] uppercase font-bold" style={{ color: ACCENT, letterSpacing: '0.22em' }}>Ask Your Stylist</p>
            </div>
            <div className="h-[420px] overflow-y-auto p-5 space-y-4" style={{ background: SHELL }}>
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center px-8">
                  <p className="text-sm leading-6" style={{ color: SOFT }}>
                    Ask whether an outfit works, what to buy next, how to style a piece, or upload a look for feedback.
                  </p>
                </div>
              ) : messages.map(item => (
                <div key={item.id} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[82%] border p-3 text-sm leading-6" style={{
                    background: item.role === 'user' ? '#1B1815' : '#FFFFFF',
                    color: item.role === 'user' ? IVORY : INK,
                    borderColor: item.role === 'user' ? '#1B1815' : BORDER,
                    borderRadius: 8,
                  }}>
                    {item.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt="Uploaded outfit" className="mb-3 max-h-52 rounded object-cover" />
                    )}
                    <p className="whitespace-pre-wrap">{item.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t" style={{ borderColor: BORDER }}>
              {image && (
                <div className="mb-3 flex items-center justify-between gap-3 text-xs" style={{ color: SOFT }}>
                  <span className="truncate">{image.name}</span>
                  <button onClick={() => setImage(null)} className="underline">Remove</button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={event => setImage(event.target.files?.[0] ?? null)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-11 w-11 flex items-center justify-center border"
                  style={{ borderColor: BORDER, borderRadius: 8 }}
                  aria-label="Upload outfit image"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <input
                  value={message}
                  onChange={event => setMessage(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Ask about an outfit, purchase, fit, colour, or occasion..."
                  className="flex-1 h-11 px-3 border outline-none text-sm"
                  style={{ borderColor: BORDER, borderRadius: 8 }}
                />
                <button
                  disabled={sending || !message.trim()}
                  onClick={sendMessage}
                  className="h-11 w-11 flex items-center justify-center disabled:opacity-40"
                  style={{ background: INK, color: IVORY, borderRadius: 8 }}
                  aria-label="Send message"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="border bg-white p-5" style={{ borderColor: BORDER, borderRadius: 8 }}>
            <p className="text-[10px] uppercase font-bold mb-5" style={{ color: ACCENT, letterSpacing: '0.22em' }}>Monthly Recommendations</p>
            {(status.recommendations ?? []).length === 0 ? (
              <div className="border p-5" style={{ borderColor: BORDER, background: SHELL, borderRadius: 8 }}>
                <p className="font-serif text-2xl mb-2">Your first monthly edit is being prepared.</p>
                <p className="text-sm leading-6" style={{ color: SOFT }}>Your likes, dislikes, and stylist chat will shape the next recommendation set.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {status.recommendations.map(rec => (
                  <div key={rec.id} className="border p-4" style={{ borderColor: BORDER, background: SHELL, borderRadius: 8 }}>
                    <p className="text-[10px] uppercase font-bold mb-2" style={{ color: ACCENT, letterSpacing: '0.18em' }}>
                      {new Date(rec.month_start).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </p>
                    <h3 className="font-serif text-2xl mb-2">{rec.page_data?.title ?? `Monthly Edit ${rec.issue_number}`}</h3>
                    {rec.page_data?.diagnosis && <p className="text-sm leading-6 mb-4" style={{ color: SOFT }}>{rec.page_data.diagnosis}</p>}
                    <div className="space-y-3">
                      {(rec.page_data?.outfits ?? []).map((outfit, index) => (
                        <div key={`${outfit.title}-${index}`} className="bg-white border p-3" style={{ borderColor: BORDER, borderRadius: 8 }}>
                          <p className="text-[10px] uppercase font-bold mb-1" style={{ color: ACCENT, letterSpacing: '0.16em' }}>{outfit.occasion ?? `Look ${index + 1}`}</p>
                          <p className="font-serif text-lg mb-1">{outfit.title}</p>
                          <p className="text-sm leading-6" style={{ color: SOFT }}>{outfit.formula}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
