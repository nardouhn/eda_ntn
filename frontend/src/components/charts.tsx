"use client";

import { formatNumber } from "@/lib/format";

export function Sparkline({ values, width = 132, height = 38 }: { values: Array<number | null>; width?: number; height?: number }) {
  const present = values.filter((value): value is number => value !== null);
  if (!present.length) return <span className="muted">Không có dữ liệu</span>;
  const max = Math.max(...present, 1);
  const min = Math.min(...present, 0);
  const span = Math.max(max - min, 1);
  const points = values
    .map((value, index) => {
      if (value === null) return null;
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - 4 - ((value - min) / span) * (height - 8);
      return `${x},${y}`;
    })
    .filter(Boolean)
    .join(" ");
  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Xu hướng 12 tháng">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LineChart({
  series,
  height = 220,
}: {
  series: Array<{ label: string; value: number }>;
  height?: number;
}) {
  const width = 900;
  const max = Math.max(...series.map((item) => item.value), 1);
  const points = series
    .map((item, index) => `${(index / Math.max(series.length - 1, 1)) * width},${height - 24 - (item.value / max) * (height - 48)}`)
    .join(" ");
  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Biểu đồ xu hướng">
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line key={ratio} x1="0" x2={width} y1={height * ratio} y2={height * ratio} className="grid-line" />
        ))}
        <polyline points={points} fill="none" className="chart-line" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <div className="chart-axis"><span>{series[0]?.label}</span><strong>{formatNumber(max)} M2</strong><span>{series.at(-1)?.label}</span></div>
    </div>
  );
}

export function HorizontalBars({ data }: { data: Array<{ label: string; value: number }> }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="bars">
      {data.map((item, index) => (
        <div className="bar-row" key={`horizontal-bar-${item.label}-${index}`}>
          <span title={item.label}>{item.label}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(item.value / max) * 100}%` }} /></div>
          <strong>{formatNumber(item.value)}</strong>
        </div>
      ))}
    </div>
  );
}
