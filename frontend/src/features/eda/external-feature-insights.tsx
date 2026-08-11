"use client";

import { useEffect, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { apiGet } from "@/lib/api";
import { formatMonth, formatPercent } from "@/lib/format";


type Level = "overview" | "region" | "branch" | "sku" | "branch-sku" | "pattern-set";
type Metric = "quantity" | "revenue";
type MonthlyPoint = {
  month: string;
  value: number;
  trend_index: number;
  gg_trends_index: number;
  gg_trends_lag1: number;
  ty_trong_chay_tet: number;
  ty_trong_thang_gieng: number;
  ty_trong_thang_co_hon: number;
  ty_trong_thanh_minh: number;
  linear_trend: number;
  seasonal: number;
  fitted: number;
};
type InsightRow = {
  region?: string;
  branch_code?: string;
  branch_name?: string;
  base_sku?: string;
  sku_name?: string;
  entity_key?: string;
  entity_name?: string;
  pattern_set?: string;
  observed_months: number;
  total_value?: number;
  rainy_avg?: number | null;
  dry_avg?: number | null;
  rainy_change_pct?: number | null;
  rain_correlation?: number | null;
  tet_correlation?: number | null;
  co_hon_correlation?: number | null;
  gg_correlation?: number | null;
  gg_lag1_correlation?: number | null;
  operational_outlier_score?: number | null;
  signed_deviation?: number | null;
  coverage_pct?: number | null;
};
type InsightData = {
  level: Level;
  metric: Metric;
  filters: { date_from: string; date_to: string };
  methodology: string;
  correlations?: Record<string, number | null>;
  decomposition?: { slope: number | null; intercept: number | null; method: string };
  monthly?: MonthlyPoint[];
  items?: InsightRow[];
};

const TITLES: Record<Level, string> = {
  overview: "Vĩ mô, lịch âm và decomposition",
  region: "Độ nhạy mùa vụ theo vùng",
  branch: "Chi nhánh lệch khỏi pattern vùng",
  sku: "SKU nhạy với tìm kiếm và mùa Tết",
  "branch-sku": "Mô tả feature ở cấp SKU × chi nhánh",
  "pattern-set": "Bộ mẫu nhạy với feature ngoại sinh",
};

function correlation(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : value.toFixed(3);
}

function compact(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(number);
}

function entityLabel(level: Level, row: InsightRow) {
  if (level === "sku") return `${row.base_sku ?? "—"} · ${row.sku_name ?? ""}`;
  if (level === "pattern-set") return row.pattern_set ?? "—";
  return row.entity_name ?? row.entity_key ?? "—";
}

export function ExternalFeatureInsights({ level }: { level: Level }) {
  const [metric, setMetric] = useState<Metric>("quantity");
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiGet<InsightData>(`/eda/external-features/${level}`, { metric })
      .then((response) => { if (active) { setData(response); setError(null); } })
      .catch(() => { if (active) { setData(null); setError("Chưa tải được feature mart. Hãy chạy script refresh Supabase trước."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [level, metric]);

  return (
    <section className="external-panel">
      <header>
        <div><p className="eyebrow">EXTERNAL FEATURES</p><h3>{TITLES[level]}</h3><small>{data ? `${formatMonth(data.filters.date_from)} → ${formatMonth(data.filters.date_to)}` : "Feature tháng × vùng"}</small></div>
        <div className="external-toggle"><button disabled={metric === "quantity"} className={metric === "quantity" ? "active" : ""} onClick={() => { setLoading(true); setError(null); setMetric("quantity"); }}>Sản lượng</button><button disabled={metric === "revenue"} className={metric === "revenue" ? "active" : ""} onClick={() => { setLoading(true); setError(null); setMetric("revenue"); }}>Doanh thu</button></div>
      </header>
      {loading ? <p className="external-empty">Đang tính insight feature…</p> : null}
      {error ? <div className="error-banner">{error}</div> : null}
      {!loading && !error && data ? (
        <>
          {level === "overview" ? <OverviewInsight data={data} /> : null}
          {level === "region" ? <RegionInsight rows={data.items ?? []} /> : null}
          {level === "branch" ? <BranchInsight rows={data.items ?? []} /> : null}
          {level === "sku" || level === "branch-sku" || level === "pattern-set" ? <SensitivityInsight level={level} rows={data.items ?? []} /> : null}
          <p className="external-method">{data.methodology}</p>
        </>
      ) : null}
      <style>{styles}</style>
    </section>
  );
}

function OverviewInsight({ data }: { data: InsightData }) {
  const corr = data.correlations ?? {};
  return <>
    <div className="external-kpis">
      <article><span>Corr Google tháng hiện tại</span><strong>{correlation(corr.gg_trends_index)}</strong></article>
      <article><span>Corr Google lag 1</span><strong>{correlation(corr.gg_trends_lag1)}</strong></article>
      <article><span>Corr chạy Tết</span><strong>{correlation(corr.ty_trong_chay_tet)}</strong></article>
      <article><span>Corr tháng cô hồn</span><strong>{correlation(corr.ty_trong_thang_co_hon)}</strong></article>
      <article><span>Linear trend / tháng</span><strong>{compact(data.decomposition?.slope)}</strong></article>
    </div>
    <div className="external-chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data.monthly ?? []} margin={{ top: 12, right: 16, bottom: 4, left: 4 }}><CartesianGrid stroke="#1d3547" strokeDasharray="3 3"/><XAxis dataKey="month" tickFormatter={(value: string) => formatMonth(value)} stroke="#7f9aaf" tick={{fontSize:9}}/><YAxis yAxisId="sales" tickFormatter={compact} stroke="#16d8c2"/><YAxis yAxisId="event" orientation="right" domain={[0,1]} tickFormatter={(value: number) => `${Math.round(value*100)}%`} stroke="#ffc14d"/><Tooltip labelFormatter={(value: unknown) => formatMonth(String(value))} formatter={(value: unknown, name: unknown) => [name === "Chạy Tết" || name === "Tháng cô hồn" ? formatPercent(Number(value)) : compact(value), String(name)]} contentStyle={{backgroundColor:"#0b1927",border:"1px solid #233a4c"}}/><Legend/><Area yAxisId="event" dataKey="ty_trong_chay_tet" name="Chạy Tết" fill="#ffc14d33" stroke="#ffc14d"/><Area yAxisId="event" dataKey="ty_trong_thang_co_hon" name="Tháng cô hồn" fill="#a855f733" stroke="#a855f7"/><Line yAxisId="sales" dataKey="value" name="Thực tế" stroke="#16d8c2" strokeWidth={2} dot={false}/><Line yAxisId="sales" dataKey="linear_trend" name="Trend" stroke="#23afff" strokeDasharray="5 4" dot={false}/><Line yAxisId="sales" dataKey="fitted" name="Trend + seasonal" stroke="#ff7373" strokeDasharray="2 3" dot={false}/></ComposedChart></ResponsiveContainer></div>
  </>;
}

function RegionInsight({ rows }: { rows: InsightRow[] }) {
  return <div className="external-table-wrap"><table><thead><tr><th>Vùng</th><th>Tháng</th><th>TB mùa mưa</th><th>TB mùa khô</th><th>Chênh mưa/khô</th><th>Corr mưa</th><th>Corr chạy Tết</th><th>Corr cô hồn</th></tr></thead><tbody>{rows.map((row) => <tr key={row.region}><td><strong>{row.region}</strong></td><td>{row.observed_months}</td><td>{compact(row.rainy_avg)}</td><td>{compact(row.dry_avg)}</td><td className={(row.rainy_change_pct ?? 0) < 0 ? "negative" : "positive"}>{formatPercent(row.rainy_change_pct)}</td><td>{correlation(row.rain_correlation)}</td><td>{correlation(row.tet_correlation)}</td><td>{correlation(row.co_hon_correlation)}</td></tr>)}</tbody></table></div>;
}

function BranchInsight({ rows }: { rows: InsightRow[] }) {
  return <div className="external-table-wrap"><table><thead><tr><th>Chi nhánh</th><th>Vùng</th><th>Tháng</th><th>Tổng</th><th>Outlier score</th><th>Lệch có dấu</th></tr></thead><tbody>{rows.map((row) => <tr key={row.branch_code}><td><strong>{row.branch_code}</strong><small>{row.branch_name}</small></td><td>{row.region}</td><td>{row.observed_months}</td><td>{compact(row.total_value)}</td><td>{formatPercent(row.operational_outlier_score)}</td><td className={(row.signed_deviation ?? 0) < 0 ? "negative" : "positive"}>{formatPercent(row.signed_deviation)}</td></tr>)}</tbody></table></div>;
}

function SensitivityInsight({ level, rows }: { level: Level; rows: InsightRow[] }) {
  return <div className="external-table-wrap"><table><thead><tr><th>{level === "sku" ? "SKU" : level === "pattern-set" ? "Bộ mẫu" : "SKU × chi nhánh"}</th><th>Tháng</th><th>Độ phủ</th><th>Tổng</th><th>Corr GG</th><th>Corr GG lag1</th><th>Corr chạy Tết</th><th>Corr cô hồn</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${entityLabel(level,row)}-${index}`}><td><strong>{entityLabel(level,row)}</strong></td><td>{row.observed_months}</td><td>{formatPercent(row.coverage_pct)}</td><td>{compact(row.total_value)}</td><td>{correlation(row.gg_correlation)}</td><td>{correlation(row.gg_lag1_correlation)}</td><td>{correlation(row.tet_correlation)}</td><td>{correlation(row.co_hon_correlation)}</td></tr>)}</tbody></table></div>;
}

const styles = `.external-panel{margin-top:16px;padding:15px;background:#081725;border:1px solid var(--line);border-radius:10px;min-width:0}.external-panel>header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:13px}.external-panel h3{margin:4px 0;font-size:15px}.external-panel header small,.external-method{color:var(--muted);font-size:9px}.external-toggle{display:flex;gap:4px}.external-toggle button{padding:7px 10px;background:#102536;color:var(--text);border:1px solid var(--line);border-radius:6px;font-size:9px}.external-toggle button.active{background:var(--cyan);border-color:var(--cyan);color:#04121c}.external-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:10px}.external-kpis article{padding:10px;background:#0d2030;border:1px solid var(--line);border-radius:7px}.external-kpis span{display:block;color:var(--muted);font-size:8px}.external-kpis strong{display:block;margin-top:5px;font-size:16px}.external-chart{height:330px}.external-table-wrap{overflow:auto}.external-table-wrap table{width:100%;min-width:900px;border-collapse:collapse}.external-table-wrap th,.external-table-wrap td{padding:9px 8px;border-bottom:1px solid var(--line);font-size:9px;text-align:right;white-space:nowrap}.external-table-wrap th{color:#91a9b9;font-size:8px;text-transform:uppercase}.external-table-wrap th:first-child,.external-table-wrap td:first-child{text-align:left}.external-table-wrap td strong{display:block;color:var(--cyan)}.external-table-wrap td small{display:block;color:var(--muted)}.external-method{margin:10px 0 0}.external-empty{padding:30px;text-align:center;color:var(--muted)}.external-panel .positive{color:var(--green)}.external-panel .negative{color:var(--red)}@media(max-width:900px){.external-kpis{grid-template-columns:repeat(2,1fr)}}`;
