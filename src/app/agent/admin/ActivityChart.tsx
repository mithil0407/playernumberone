'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart3, ChevronRight } from 'lucide-react';
import type { AgentAnalytics, DailyPoint } from '@/lib/agentAnalytics';

type Metric = keyof AgentAnalytics['series'];
const METRICS: Array<{ id: Metric; label: string; average?: boolean; money?: boolean }> = [
  { id: 'activeUsers', label: 'Active people', average: true },
  { id: 'messages', label: 'Messages' },
  { id: 'newUsers', label: 'New people' },
  { id: 'colourCards', label: 'Colour cards' },
  { id: 'shoppingRuns', label: 'Product hunts' },
  { id: 'clickOuts', label: 'Store visits' },
  { id: 'spendUsd', label: 'AI spend', money: true },
];
const dayLabel = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function coordinates(points: DailyPoint[], width: number, height: number, max: number) {
  return points.map((point, index) => ({
    x: points.length < 2 ? width / 2 : index / (points.length - 1) * width,
    y: height - Math.max(0, point.value) / max * height,
  }));
}

export function Sparkline({ points }: { points: DailyPoint[] }) {
  const coords = coordinates(points, 88, 30, Math.max(...points.map(point => point.value), 1));
  return <svg viewBox="-2 -3 92 36" className="aa-sparkline" aria-hidden="true"><polyline points={coords.map(point => `${point.x},${point.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" /></svg>;
}

export default function ActivityChart({ series, fxRate, initialMetric = 'activeUsers' }: {
  series: AgentAnalytics['series']; fxRate: number; initialMetric?: Metric;
}) {
  const [metric, setMetric] = useState<Metric>(initialMetric);
  const [period, setPeriod] = useState<7 | 30>(30);
  const [hover, setHover] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(760);
  const plotRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!plotRef.current) return;
    const observer = new ResizeObserver(entries => setChartWidth(Math.max(260, Math.round(entries[0].contentRect.width))));
    observer.observe(plotRef.current);
    return () => observer.disconnect();
  }, []);
  const gradientId = useId().replace(/:/g, '');
  const selected = METRICS.find(item => item.id === metric)!;
  const fullSeries = series[metric].map(point => ({ ...point, value: point.value * (selected.money ? fxRate : 1) }));
  const points = fullSeries.slice(-period);
  const number = (value: number) => `${selected.money ? '₹' : ''}${Math.round(value).toLocaleString('en-IN')}`;
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const current7 = fullSeries.slice(-7).reduce((sum, point) => sum + point.value, 0);
  const previous7 = fullSeries.slice(-14, -7).reduce((sum, point) => sum + point.value, 0);
  const change = previous7 > 0 ? (current7 - previous7) / previous7 : null;
  const summary = selected.average ? total / Math.max(points.length, 1) : total;
  const latest = hover === null ? null : points[hover];
  const rawMax = Math.max(...points.map(point => point.value), 1);
  const magnitude = 10 ** Math.floor(Math.log10(rawMax));
  const max = ([1, 2, 2.5, 5, 10].find(step => step * magnitude >= rawMax) ?? 10) * magnitude;
  const width = chartWidth, height = width < 500 ? 195 : 242, left = selected.money ? 62 : 40, right = 15, top = 16, bottom = 28;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const coords = coordinates(points, plotWidth, plotHeight, max);
  const line = coords.map((point, index) => `${index === 0 ? 'M' : 'L'} ${left + point.x} ${top + point.y}`).join(' ');
  const area = coords.length ? `${line} L ${left + coords[coords.length - 1].x} ${top + plotHeight} L ${left + coords[0].x} ${top + plotHeight} Z` : '';
  const activeCoord = hover === null ? null : coords[hover];
  const dateIndices = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])].filter(index => index >= 0);

  return (
    <section className="ma-card aa-chart">
      <div className="aa-chart__heading">
        <div><h2 className="ma-h2">Activity over time</h2><p className="ma-faint mt-1 text-[12px]">Daily activity · India time</p></div>
        <div className="ma-seg" aria-label="Chart date range">{([7, 30] as const).map(value => <button type="button" key={value} aria-pressed={period === value} onClick={() => { setPeriod(value); setHover(null); }}>{value} days</button>)}</div>
      </div>
      <div className="aa-chart__metrics" aria-label="Chart metric">{METRICS.map(item => <button key={item.id} type="button" aria-pressed={metric === item.id} onClick={() => { setMetric(item.id); setHover(null); }}>{item.label}</button>)}</div>
      <div className="aa-chart__summary">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><span className="aa-chart__number ma-num">{number(summary)}</span><span className="ma-faint text-[12px]">{selected.average ? 'daily average' : `in ${period} days`}</span></div>
        {change !== null ? <span className={`aa-change ${change >= 0 ? 'aa-change--up' : 'aa-change--down'}`}>
          {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.round(Math.abs(change) * 100)}%<span>last 7d vs previous 7d</span>
        </span> : <span className="ma-faint text-[11px]">No prior week activity to compare</span>}
      </div>
      <div className="aa-chart__plot" ref={plotRef}>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${selected.label}: ${number(summary)} ${selected.average ? 'daily average' : 'total'} over ${period} days`} className="w-full h-auto">
          <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6a1f2b" stopOpacity="0.16" /><stop offset="100%" stopColor="#6a1f2b" stopOpacity="0.01" /></linearGradient></defs>
          {[0, max / 2, max].map(tick => <g key={tick}><line x1={left} x2={width - right} y1={top + plotHeight - tick / max * plotHeight} y2={top + plotHeight - tick / max * plotHeight} stroke="var(--ma-line-2)" strokeDasharray="3 5" /><text x={left - 10} y={top + plotHeight - tick / max * plotHeight + 4} textAnchor="end" fontSize={11} fill="var(--ma-ink-3)">{number(tick)}</text></g>)}
          {area && <path d={area} fill={`url(#${gradientId})`} />}
          {line && <path d={line} fill="none" stroke="var(--ma-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          {activeCoord && <g><line x1={left + activeCoord.x} x2={left + activeCoord.x} y1={top} y2={top + plotHeight} stroke="var(--ma-accent)" strokeOpacity="0.2" /><circle cx={left + activeCoord.x} cy={top + activeCoord.y} r={5} fill="var(--ma-accent)" stroke="white" strokeWidth={3} /></g>}
          {points.map((point, index) => {
            const coord = coords[index];
            const cellWidth = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth;
            return <rect key={point.day} x={Math.max(left, left + coord.x - cellWidth / 2)} y={top} width={Math.min(cellWidth, width - right - Math.max(left, left + coord.x - cellWidth / 2))} height={plotHeight}
              fill="transparent" tabIndex={0} role="button" aria-label={`${dayLabel(point.day)}: ${number(point.value)}`} onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(index)} onBlur={() => setHover(null)} />;
          })}
          {dateIndices.map(index => <text key={index} x={left + coords[index].x} y={height - 6} textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'} fontSize={11} fill="var(--ma-ink-3)">{dayLabel(points[index].day)}</text>)}
        </svg>
        {latest && activeCoord && <div role="status" className="aa-chart__tooltip" style={{ left: `${Math.max(12, Math.min(88, (left + activeCoord.x) / width * 100))}%` }}><span>{dayLabel(latest.day)}</span><b>{number(latest.value)}</b></div>}
        {total === 0 && <div className="aa-chart__empty"><BarChart3 size={20} strokeWidth={1.5} /><span>No {selected.label.toLowerCase()} in this period</span></div>}
      </div>
      <details className="aa-details aa-chart__table"><summary>View daily numbers <ChevronRight size={13} /></summary><div className="aa-chart__table-scroll"><table className="aa-table"><caption className="sr-only">Daily {selected.label.toLowerCase()}</caption><thead><tr><th>Date</th><th>{selected.label}</th></tr></thead><tbody>{[...points].reverse().map(point => <tr key={point.day}><td>{dayLabel(point.day)}</td><td>{number(point.value)}</td></tr>)}</tbody></table></div></details>
    </section>
  );
}
