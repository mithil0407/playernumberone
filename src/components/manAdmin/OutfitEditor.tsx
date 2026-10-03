'use client';

import { useMemo, useState } from 'react';
import { Segmented } from './ui';
import { parseOutfitLines, serialiseOutfitLines, type FieldLine } from './outfitLines';

// Edits one outfit block field by field. Each garment line keeps its original
// prefix and label formatting ("TOP:", "**Top:**", "- Layer:"…) and only the
// value after the colon changes, so the saved text always parses exactly like
// the AI-written blocks the report, QA and image pipeline already understand.

const FIELD_ORDER = ['TOP', 'LAYER', 'BOTTOM', 'FOOTWEAR', 'ACCESSORIES', 'OCCASION ANCHOR'] as const;

const FIELD_HINTS: Record<string, string> = {
  TOP: 'Colour + fabric + garment — collar — fit — tucked/untucked',
  LAYER: 'Colour + fabric + garment — structure — worn open/buttoned, or "No layer"',
  BOTTOM: 'Colour + fabric + trousers — rise — fit — break',
  FOOTWEAR: 'Colour + material + shoe type — socks if visible',
  ACCESSORIES: 'Belt, watch, eyewear, tie — separate with "—" or "+"',
  'OCCASION ANCHOR': 'One sentence the client reads: when to wear it and why it works on him',
};

function titleCaseLabel(key: string) {
  return key.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function AutoGrowTextarea({ value, onChange, disabled, placeholder, large }: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  large?: boolean;
}) {
  const rows = Math.max(large ? 2 : 1, Math.ceil(value.length / (large ? 90 : 96)));
  return (
    <textarea
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      rows={Math.min(rows, 6)}
      onChange={event => onChange(event.target.value.replace(/\n/g, ' '))}
      className="ma-textarea"
      style={{ resize: 'none', fontSize: large ? 15 : 14, lineHeight: 1.5 }}
    />
  );
}

export default function OutfitEditor({ value, onChange, disabled, imageUrl, palette, hideImage = false }: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  imageUrl?: string | null;
  palette?: Array<{ name: string; hex: string }>;
  /** For inline use beside an existing photo: just the fields. */
  hideImage?: boolean;
}) {
  const [mode, setMode] = useState<'fields' | 'text'>('fields');
  const lines = useMemo(() => parseOutfitLines(value), [value]);
  const fieldIndexes = useMemo(() => {
    const map = new Map<string, number>();
    lines.forEach((line, index) => {
      if (line.kind === 'field' && !map.has(line.key)) map.set(line.key, index);
    });
    return map;
  }, [lines]);
  const header = lines.find(line => line.kind === 'raw' && line.text.trim()) as { kind: 'raw'; text: string } | undefined;
  const extraFields = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.kind === 'field' && !(FIELD_ORDER as readonly string[]).includes(line.key)) as Array<{ line: FieldLine; index: number }>;
  const parsedEnough = fieldIndexes.has('TOP') && fieldIndexes.has('BOTTOM');

  const updateLine = (index: number, nextValue: string) => {
    const next = lines.map((line, lineIndex) => (lineIndex === index && line.kind === 'field' ? { ...line, value: nextValue } : line));
    onChange(serialiseOutfitLines(next));
  };

  const effectiveMode = parsedEnough ? mode : 'text';

  return (
    <div className={hideImage ? '' : 'grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]'}>
      {!hideImage && <div className="hidden md:block">
        <div className="overflow-hidden rounded-[20px]" style={{ aspectRatio: '2 / 3', background: '#94a6ad' }}>
          {imageUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={imageUrl} alt="Current outfit image" className="h-full w-full object-cover" />
            : <div className="flex h-full items-center justify-center p-4 text-center text-[12px] text-white/80">No image yet</div>}
        </div>
        {palette && palette.length > 0 && (
          <div className="mt-4">
            <div className="ma-eyebrow mb-2">His palette</div>
            <div className="flex flex-wrap gap-1.5">
              {palette.map(colour => (
                <span key={colour.name + colour.hex} title={colour.name} className="h-6 w-6 rounded-full" style={{ background: colour.hex, boxShadow: 'inset 0 0 0 1px rgba(17,19,21,0.12)' }} />
              ))}
            </div>
          </div>
        )}
      </div>}

      <div className="min-w-0">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="ma-faint truncate text-[13px]">{header?.text.replace(/[*#]/g, '').trim()}</div>
          {parsedEnough && (
            <Segmented<'fields' | 'text'>
              value={mode}
              onChange={setMode}
              options={[{ value: 'fields', label: 'Pieces' }, { value: 'text', label: 'Raw text' }]}
            />
          )}
        </div>

        {effectiveMode === 'text' ? (
          <textarea
            value={value}
            disabled={disabled}
            onChange={event => onChange(event.target.value)}
            spellCheck={false}
            className="ma-textarea"
            style={{ minHeight: 380, fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace', fontSize: 13 }}
          />
        ) : (
          <div className="space-y-4">
            {FIELD_ORDER.map(key => {
              const index = fieldIndexes.get(key);
              if (index === undefined) return null;
              const line = lines[index] as FieldLine;
              return (
                <label key={key} className="block">
                  <span className="ma-label">{titleCaseLabel(key)}</span>
                  <AutoGrowTextarea
                    value={line.value}
                    disabled={disabled}
                    large={key === 'OCCASION ANCHOR'}
                    placeholder={FIELD_HINTS[key]}
                    onChange={next => updateLine(index, next)}
                  />
                </label>
              );
            })}
            {extraFields.map(({ line, index }) => (
              <label key={`${line.key}-${index}`} className="block">
                <span className="ma-label">{titleCaseLabel(line.key)}</span>
                <AutoGrowTextarea value={line.value} disabled={disabled} onChange={next => updateLine(index, next)} />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
