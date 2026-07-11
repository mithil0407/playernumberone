"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Camera, CheckCircle, LockKeyhole, Ruler, Sparkles, Upload } from "lucide-react";
import { getAttributionPayload } from "@/lib/attribution";
import { readGrowthContextFromUrl, trackGrowthEvent } from "@/lib/growthAnalytics";
import {
  computeLeadMagnetResult,
  LeadMagnetAnswers,
  LeadMagnetDefinition,
  LeadMagnetResult,
} from "@/lib/leadMagnets";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ToolProps = {
  tool: LeadMagnetDefinition;
};

function PreviewUpload({
  label,
  grayscale = false,
  onChange,
}: {
  label: string;
  grayscale?: boolean;
  onChange?: (hasImage: boolean) => void;
}) {
  const [url, setUrl] = useState("");

  return (
    <label className="block rounded-2xl border border-gray-200 bg-white p-4">
      <span className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Upload className="h-4 w-4" /> {label}
      </span>
      <input
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const nextUrl = URL.createObjectURL(file);
          setUrl(nextUrl);
          onChange?.(true);
        }}
      />
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className={`aspect-[4/5] w-full rounded-xl object-cover ${grayscale ? "grayscale" : ""}`}
        />
      ) : (
        <div className="flex aspect-[4/5] items-center justify-center rounded-xl bg-gray-50 text-center text-sm text-gray-500">
          Tap to use camera or upload a photo. The image stays on this device.
        </div>
      )}
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix = "cm",
}: {
  label: string;
  value: number | "";
  onChange: (value: number | "") => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-gray-700">{label}</span>
      <div className="flex rounded-xl border border-gray-200 bg-white">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value ? Number(event.target.value) : "")}
          className="min-w-0 flex-1 rounded-l-xl px-4 py-3 text-gray-900 outline-none"
        />
        <span className="rounded-r-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">{suffix}</span>
      </div>
    </label>
  );
}

function ChoiceButton({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left transition ${
        selected ? "border-gray-900 bg-gray-950 text-white" : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-semibold">{title}</span>
        {selected && <CheckCircle className="h-5 w-5" />}
      </div>
      <p className={`text-sm leading-relaxed ${selected ? "text-white/75" : "text-gray-600"}`}>{description}</p>
    </button>
  );
}

function ResultCard({ tool, result }: { tool: LeadMagnetDefinition; result: LeadMagnetResult }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">ICONIK Result Card</p>
      <h2 className="mb-2 text-3xl font-bold text-gray-900">{result.label}</h2>
      <p className="mb-5 text-gray-600">{result.summary}</p>
      <div className="rounded-2xl bg-gray-950 p-5 text-white">
        <p className="mb-2 text-sm uppercase tracking-[0.18em] text-white/45">{tool.title}</p>
        <p className="text-xl font-semibold">{result.shareTitle}</p>
        <p className="mt-2 text-sm text-white/65">{result.shareSubtitle}</p>
      </div>
    </div>
  );
}

function ContrastInputs({ answers, setAnswers }: {
  answers: LeadMagnetAnswers;
  setAnswers: (next: LeadMagnetAnswers) => void;
}) {
  return (
    <div className="space-y-6">
      <PreviewUpload label="Take or upload a front-facing selfie" grayscale onChange={(hasImage) => setAnswers({ ...answers, hasImage })} />
      <div>
        <h3 className="mb-3 text-lg font-semibold text-gray-900">In black and white, what do you see?</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <ChoiceButton selected={answers.contrastLevel === "high"} title="High contrast" description="Hair, eyes, and skin separate sharply." onClick={() => setAnswers({ ...answers, contrastLevel: "high" })} />
          <ChoiceButton selected={answers.contrastLevel === "medium"} title="Medium contrast" description="There is separation, but it is not extreme." onClick={() => setAnswers({ ...answers, contrastLevel: "medium" })} />
          <ChoiceButton selected={answers.contrastLevel === "low"} title="Low contrast" description="Features look soft, blended, or tonal." onClick={() => setAnswers({ ...answers, contrastLevel: "low" })} />
        </div>
      </div>
    </div>
  );
}

function GlowInputs({ answers, setAnswers }: {
  answers: LeadMagnetAnswers;
  setAnswers: (next: LeadMagnetAnswers) => void;
}) {
  const swatches = (Array.isArray(answers.swatches) ? answers.swatches : [
    { name: "", clarity: 3, lift: 3, shadows: 2, dullness: 2 },
    { name: "", clarity: 3, lift: 3, shadows: 2, dullness: 2 },
    { name: "", clarity: 3, lift: 3, shadows: 2, dullness: 2 },
    { name: "", clarity: 3, lift: 3, shadows: 2, dullness: 2 },
  ]) as Array<Record<string, string | number>>;

  function update(index: number, patch: Record<string, string | number>) {
    const next = swatches.map((swatch, i) => i === index ? { ...swatch, ...patch } : swatch);
    setAnswers({ ...answers, swatches: next });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gray-50 p-5 text-sm leading-relaxed text-gray-600">
        Hold each top, dupatta, scarf, or saree fabric under your chin in the same daylight. Score what happens to your face. Photo previews are optional and stay local.
      </div>
      {swatches.map((swatch, index) => (
        <div key={index} className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
            <PreviewUpload label={`Optional photo for colour ${index + 1}`} />
            <div className="space-y-3">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-700">Colour name</span>
                <input
                  value={String(swatch.name || "")}
                  onChange={(event) => update(index, { name: event.target.value })}
                  placeholder="e.g. cobalt kurta, ivory shirt"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none"
                />
              </label>
              {[
                ["clarity", "Skin clarity"],
                ["lift", "Face looks lifted"],
                ["shadows", "Creates shadows"],
                ["dullness", "Looks dull/yellow/red"],
              ].map(([key, label]) => (
                <label key={key} className="block">
                  <span className="mb-1 block text-xs font-semibold text-gray-500">{label}: {String(swatch[key] ?? 3)}</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={Number(swatch[key] ?? 3)}
                    onChange={(event) => update(index, { [key]: Number(event.target.value) })}
                    className="w-full"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SilhouetteInputs({ answers, setAnswers }: {
  answers: LeadMagnetAnswers;
  setAnswers: (next: LeadMagnetAnswers) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gray-50 p-5 text-sm leading-relaxed text-gray-600">
        Use a soft tape measure. Keep it parallel to the floor and snug, not tight.
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <NumberField label="Shoulders" value={(answers.shoulders as number) || ""} onChange={(value) => setAnswers({ ...answers, shoulders: value })} />
        <NumberField label="Bust" value={(answers.bust as number) || ""} onChange={(value) => setAnswers({ ...answers, bust: value })} />
        <NumberField label="Waist" value={(answers.waist as number) || ""} onChange={(value) => setAnswers({ ...answers, waist: value })} />
        <NumberField label="Hips" value={(answers.hips as number) || ""} onChange={(value) => setAnswers({ ...answers, hips: value })} />
      </div>
    </div>
  );
}

function ProportionInputs({ answers, setAnswers }: {
  answers: LeadMagnetAnswers;
  setAnswers: (next: LeadMagnetAnswers) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gray-50 p-5 text-sm leading-relaxed text-gray-600">
        Stand straight. Measure full height, natural waist to floor, and inseam to floor. These three numbers show where your vertical length actually sits.
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <NumberField label="Full height" value={(answers.height as number) || ""} onChange={(value) => setAnswers({ ...answers, height: value })} />
        <NumberField label="Natural waist to floor" value={(answers.waistToFloor as number) || ""} onChange={(value) => setAnswers({ ...answers, waistToFloor: value })} />
        <NumberField label="Inseam to floor" value={(answers.inseam as number) || ""} onChange={(value) => setAnswers({ ...answers, inseam: value })} />
      </div>
    </div>
  );
}

function FaceInputs({ answers, setAnswers }: {
  answers: LeadMagnetAnswers;
  setAnswers: (next: LeadMagnetAnswers) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="relative">
        <PreviewUpload label="Optional face grid photo" onChange={(hasImage) => setAnswers({ ...answers, hasImage })} />
        <div className="pointer-events-none absolute inset-4 rounded-xl border border-white/80">
          <div className="absolute left-1/2 top-0 h-full w-px bg-white/70" />
          <div className="absolute left-0 top-1/3 h-px w-full bg-white/70" />
          <div className="absolute left-0 top-2/3 h-px w-full bg-white/70" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <NumberField label="Face length" value={(answers.faceLength as number) || ""} onChange={(value) => setAnswers({ ...answers, faceLength: value })} />
        <NumberField label="Forehead width" value={(answers.foreheadWidth as number) || ""} onChange={(value) => setAnswers({ ...answers, foreheadWidth: value })} />
        <NumberField label="Cheekbone width" value={(answers.cheekboneWidth as number) || ""} onChange={(value) => setAnswers({ ...answers, cheekboneWidth: value })} />
        <NumberField label="Jaw width" value={(answers.jawWidth as number) || ""} onChange={(value) => setAnswers({ ...answers, jawWidth: value })} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <ChoiceButton selected={answers.lineQuality === "soft"} title="Soft lines" description="Jaw, cheeks, and features feel rounded or curved." onClick={() => setAnswers({ ...answers, lineQuality: "soft" })} />
        <ChoiceButton selected={answers.lineQuality === "angular"} title="Angular lines" description="Jaw, cheekbones, and features feel sharper or straighter." onClick={() => setAnswers({ ...answers, lineQuality: "angular" })} />
      </div>
    </div>
  );
}

function ToolInputs({ tool, answers, setAnswers }: {
  tool: LeadMagnetDefinition;
  answers: LeadMagnetAnswers;
  setAnswers: (next: LeadMagnetAnswers) => void;
}) {
  if (tool.id === "contrast_scan") return <ContrastInputs answers={answers} setAnswers={setAnswers} />;
  if (tool.id === "glow_test") return <GlowInputs answers={answers} setAnswers={setAnswers} />;
  if (tool.id === "silhouette_scan") return <SilhouetteInputs answers={answers} setAnswers={setAnswers} />;
  if (tool.id === "proportion_code") return <ProportionInputs answers={answers} setAnswers={setAnswers} />;
  return <FaceInputs answers={answers} setAnswers={setAnswers} />;
}

function isReady(tool: LeadMagnetDefinition, answers: LeadMagnetAnswers) {
  if (tool.id === "contrast_scan") return Boolean(answers.contrastLevel);
  if (tool.id === "glow_test") {
    const swatches = Array.isArray(answers.swatches) ? answers.swatches as Array<Record<string, unknown>> : [];
    return swatches.filter((swatch) => String(swatch.name || "").trim()).length >= 3;
  }
  if (tool.id === "silhouette_scan") return ["shoulders", "bust", "waist", "hips"].every((key) => Number(answers[key]) > 0);
  if (tool.id === "proportion_code") return ["height", "waistToFloor", "inseam"].every((key) => Number(answers[key]) > 0);
  return ["faceLength", "foreheadWidth", "cheekboneWidth", "jawWidth"].every((key) => Number(answers[key]) > 0) && Boolean(answers.lineQuality);
}

export default function LeadMagnetTool({ tool }: ToolProps) {
  const [contentSource, setContentSource] = useState("lead_magnet");
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<LeadMagnetAnswers>({});
  const [result, setResult] = useState<LeadMagnetResult | null>(null);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const source = new URLSearchParams(window.location.search).get("source")?.trim();
    if (source) setContentSource(source);
  }, []);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(`iconik_tool_${tool.id}`) : null;
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { answers?: LeadMagnetAnswers; result?: LeadMagnetResult; unlocked?: boolean };
      if (parsed.answers) setAnswers(parsed.answers);
      if (parsed.result) setResult(parsed.result);
      if (parsed.unlocked) setUnlocked(true);
    } catch {
      // Ignore stale localStorage.
    }
  }, [tool.id]);

  const icon = useMemo(() => {
    if (tool.id.includes("contrast") || tool.id.includes("glow")) return Camera;
    if (tool.id.includes("silhouette") || tool.id.includes("proportion")) return Ruler;
    return Sparkles;
  }, [tool.id]);
  const Icon = icon;

  function start() {
    setStarted(true);
    trackGrowthEvent("quiz_start", {
      ...readGrowthContextFromUrl(),
      tool_id: tool.id,
      content_source: contentSource,
    });
  }

  function reveal() {
    const nextResult = computeLeadMagnetResult(tool.id, answers);
    setResult(nextResult);
    setStarted(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(`iconik_tool_${tool.id}`, JSON.stringify({ answers, result: nextResult, unlocked }));
    }
    trackGrowthEvent("quiz_result_view", {
      ...readGrowthContextFromUrl(),
      tool_id: tool.id,
      result_key: nextResult.key,
      content_source: contentSource,
    });
  }

  async function submitLead() {
    if (!result) return;
    if (firstName.trim().length < 2) {
      setError("Please enter your first name.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email.");
      return;
    }
    setSaving(true);
    setError("");
    trackGrowthEvent("quiz_lead_submit", {
      ...readGrowthContextFromUrl(),
      tool_id: tool.id,
      result_key: result.key,
      content_source: contentSource,
    });
    try {
      const response = await fetch("/api/lead-magnets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId: tool.id,
          toolVersion: tool.version,
          firstName,
          email,
          answers,
          result,
          source: contentSource,
          attribution: getAttributionPayload(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Lead save failed");
      setUnlocked(true);
      if (typeof window !== "undefined") {
        localStorage.setItem(`iconik_tool_${tool.id}`, JSON.stringify({ answers, result, unlocked: true, leadId: data.lead?.id }));
        localStorage.setItem("stylist_customerEmail", email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your result.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-gray-950">
      <section className="border-b border-gray-200 bg-gray-50 px-4 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-gray-400">{tool.eyebrow}</p>
            <h1 className="mb-5 text-4xl font-bold leading-tight md:text-6xl">{tool.h1}</h1>
            <p className="mb-6 max-w-2xl text-lg leading-relaxed text-gray-600">{tool.intro}</p>
            <div className="mb-8 flex flex-wrap gap-2 text-sm text-gray-600">
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1">{tool.pillar}</span>
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1">{tool.physicalAction}</span>
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1">No AI/CV in v1</span>
            </div>
            {!started && !result && (
              <button type="button" onClick={start} className="inline-flex items-center gap-3 rounded-full bg-black px-8 py-4 font-semibold text-white">
                Start Free Tool <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-950 text-white">
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="mb-3 text-2xl font-bold">{tool.title}</h2>
            <p className="leading-relaxed text-gray-600">{tool.aha}</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-4xl">
          {(started || result) && !result && (
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5 md:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-400">Free diagnostic</p>
                  <h2 className="mt-2 text-2xl font-bold">Do the physical test</h2>
                </div>
                <span className="rounded-full bg-white px-4 py-2 text-sm text-gray-500">Step 1 / 2</span>
              </div>
              <ToolInputs tool={tool} answers={answers} setAnswers={setAnswers} />
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  disabled={!isReady(tool, answers)}
                  onClick={reveal}
                  className="inline-flex items-center gap-3 rounded-full bg-black px-8 py-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Reveal My Result <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-8">
              <ResultCard tool={tool} result={result} />
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 md:p-8">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-gray-400">Free reveal</p>
                <h2 className="mb-3 text-3xl font-bold">{result.reveal}</h2>
                <p className="mb-5 text-lg leading-relaxed text-gray-600">{result.summary}</p>
                <div className="rounded-2xl bg-white p-5">
                  <h3 className="mb-3 font-semibold text-gray-900">The gap this reveals</h3>
                  <p className="leading-relaxed text-gray-600">{result.gap}</p>
                </div>
              </div>

              {!unlocked ? (
                <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-gray-950 px-4 py-2 text-sm font-semibold text-white">
                    <LockKeyhole className="h-4 w-4" /> Unlock the deeper rule list
                  </div>
                  <h2 className="mb-3 text-2xl font-bold">Send yourself the expanded result</h2>
                  <p className="mb-6 leading-relaxed text-gray-600">
                    The core result is free. Email unlocks the specific rule list, wardrobe meaning, result card, and the right next step.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" className="rounded-xl border border-gray-200 px-4 py-3 outline-none" />
                    <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" type="email" className="rounded-xl border border-gray-200 px-4 py-3 outline-none" />
                  </div>
                  {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                  <button type="button" onClick={submitLead} disabled={saving} className="mt-6 inline-flex items-center gap-3 rounded-full bg-black px-8 py-4 font-semibold text-white disabled:opacity-50">
                    {saving ? "Saving..." : "Unlock My Rules"} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-gray-400">Unlocked</p>
                  <h2 className="mb-4 text-2xl font-bold">Your rule list</h2>
                  <ul className="mb-7 space-y-3 text-gray-700">
                    {result.rules.map((rule) => (
                      <li key={rule} className="flex gap-3">
                        <span className="font-bold text-green-600">✓</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-3">
                    <Link href={result.nextStepHref} className="rounded-full border border-gray-300 px-6 py-3 font-semibold text-gray-900">
                      {result.nextStepLabel}
                    </Link>
                    <Link
                      href="/stylist/checkout"
                      onClick={() => trackGrowthEvent("consultation_cta_click", {
                        ...readGrowthContextFromUrl(),
                        tool_id: tool.id,
                        result_key: result.key,
                        content_source: contentSource,
                      })}
                      className="rounded-full bg-black px-6 py-3 font-semibold text-white"
                    >
                      {result.paidCta}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-gray-200 bg-gray-50 px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-2xl font-bold">Read next</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {tool.relatedLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-2xl border border-gray-200 bg-white p-5 font-semibold text-gray-900 hover:bg-gray-50">
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
