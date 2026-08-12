"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { apiGet } from "@/lib/api";
import { formatMonth, formatNumber, formatPercent } from "@/lib/format";


type BranchRow = {
  branch: string;
  branch_name: string;
  region: string;
  status: string;
  history_months: number;
  coverage: number;
  mean_monthly_quantity: number;
  cv: number | null;
  lag1_correlation: number | null;
  lag12_correlation: number | null;
  naive_wape: number | null;
  seasonal_naive_wape: number | null;
  seasonal_gain: number | null;
  seasonal_origins: number;
  recent_3m_quantity: number;
  previous_3m_quantity: number;
  recent_growth: number | null;
  trend_rate_6m: number | null;
  latest_active_skus: number;
  top1_sku_share: number;
  top5_sku_share: number;
  portfolio_hhi_top20: number;
  forecastability_segment: string;
  recommended_strategy: string;
};
type HistoryPoint = {
  month: string;
  quantity: number;
  active_skus: number;
  line_count: number;
  moving_average_3: number | null;
  moving_average_6: number | null;
  same_month_last_year: number | null;
};
type ProfilePoint = { month_number: number; mean_quantity: number | null; seasonal_index: number | null; observations: number };
type TopSku = { base_sku: string; sku_name: string | null; quantity: number; share: number; rank: number };
type Data = {
  data_from: string;
  data_as_of_month: string;
  options: {
    regions: string[];
    branches: Array<{ branch: string; branch_name: string; region: string }>;
  };
  kpis: {
    branch_count: number;
    active_branch_count: number;
    median_naive_wape: number | null;
    seasonal_candidate_count: number;
    volatile_count: number;
    low_coverage_count: number;
  };
  segment_distribution: Array<{ segment: string; count: number }>;
  branches: BranchRow[];
  selected: BranchRow & { history: HistoryPoint[]; monthly_profile: ProfilePoint[]; top_skus: TopSku[] };
  methodology: Record<string, string>;
};

const SEGMENT_COLORS: Record<string, string> = {
  STABLE: "#16d8c2",
  SEASONAL: "#a78bfa",
  TRENDING: "#23afff",
  VOLATILE: "#ff7373",
  LOW_COVERAGE: "#ffc14d",
  INACTIVE: "#64748b",
};
const MONTHS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

function compact(value: unknown): string {
  return Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value));
}

function optionalPercent(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : formatPercent(value);
}

export function EdaBranchForecast() {
  const [data, setData] = useState<Data | null>(null);
  const [region, setRegion] = useState("");
  const [branch, setBranch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<Data>("/eda/branch-forecast/overview", { region: region || undefined, branch: branch || undefined })
      .then((response) => {
        if (cancelled) return;
        setData(response);
        setBranch(response.selected.branch);
        setError(null);
      })
      .catch((reason: Error) => { if (!cancelled) setError(reason.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [branch, region]);

  const scatter = useMemo(
    () => (data?.branches ?? []).filter((row) => row.cv !== null && row.naive_wape !== null).map((row) => ({
      ...row,
      x: row.cv,
      y: row.naive_wape,
      z: Math.max(row.mean_monthly_quantity, 1),
    })),
    [data?.branches],
  );
  const growthRows = useMemo(
    () => (data?.branches ?? []).filter((row) => row.recent_growth !== null).toSorted((a, b) => Math.abs(b.recent_growth ?? 0) - Math.abs(a.recent_growth ?? 0)).slice(0, 12),
    [data?.branches],
  );

  function changeRegion(value: string) {
    setLoading(true);
    setRegion(value);
    setBranch("");
  }
  function changeBranch(value: string) {
    setLoading(true);
    setBranch(value);
  }

  return (
    <div className="bf-page">
      <header className="bf-heading">
        <div><p className="eyebrow">BRANCH QUANTITY FORECAST</p><h3>EDA Forecast sản lượng Chi nhánh</h3><p>Đánh giá forecastability ở đúng grain chi nhánh × tháng trước khi chọn model.</p></div>
        <span>{loading ? "Đang phân tích…" : `${formatMonth(data?.data_from ?? "")} → ${formatMonth(data?.data_as_of_month ?? "")}`}</span>
      </header>

      <section className="bf-filters">
        <label>Vùng<select value={region} onChange={(event) => changeRegion(event.target.value)}><option value="">Tất cả vùng</option>{data?.options.regions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Chi nhánh<select value={branch} onChange={(event) => changeBranch(event.target.value)}>{data?.options.branches.map((item) => <option key={item.branch} value={item.branch}>{item.branch} — {item.branch_name}</option>)}</select></label>
      </section>
      {error ? <div className="error-banner">Không tải được EDA forecast chi nhánh: {error}</div> : null}

      <section className="bf-kpis">
        <article><span>Chi nhánh hoạt động</span><strong>{formatNumber(data?.kpis.active_branch_count)}</strong><small>trên {formatNumber(data?.kpis.branch_count)} chi nhánh</small></article>
        <article><span>Median Naive WAPE</span><strong>{optionalPercent(data?.kpis.median_naive_wape)}</strong><small>baseline tháng trước</small></article>
        <article><span>Seasonal candidate</span><strong>{formatNumber(data?.kpis.seasonal_candidate_count)}</strong><small>lag-12 thắng Naive ≥10%</small></article>
        <article><span>Chuỗi biến động</span><strong>{formatNumber(data?.kpis.volatile_count)}</strong><small>CV tổng tháng ≥40%</small></article>
        <article><span>Coverage thấp</span><strong>{formatNumber(data?.kpis.low_coverage_count)}</strong><small>cần global model/shrinkage</small></article>
      </section>

      <section className="bf-grid">
        <article className="bf-card">
          <header><h4>Bản đồ Forecastability</h4><p>X = CV · Y = Naive WAPE · Bubble = quantity TB/tháng</p></header>
          <div className="bf-chart"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 15, right: 20, bottom: 12, left: 8 }}><CartesianGrid stroke="#1d3547"/><XAxis type="number" dataKey="x" name="CV" tickFormatter={(value: number) => formatPercent(value)}/><YAxis type="number" dataKey="y" name="Naive WAPE" tickFormatter={(value: number) => formatPercent(value)}/><ZAxis type="number" dataKey="z" range={[40, 420]}/><ReferenceLine x={.4} stroke="#ffc14d" strokeDasharray="4 3"/><Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value: unknown, name: unknown) => [name === "CV" || name === "Naive WAPE" ? formatPercent(Number(value)) : compact(value), String(name)]}/><Scatter data={scatter}>{scatter.map((row) => <Cell key={row.branch} fill={SEGMENT_COLORS[row.forecastability_segment] ?? "#64748b"}/>)}</Scatter></ScatterChart></ResponsiveContainer></div>
        </article>

        <article className="bf-card">
          <header><h4>Biến động 3 tháng gần nhất</h4><p>So với 3 tháng liền trước; ưu tiên trị tuyệt đối lớn.</p></header>
          <div className="bf-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={growthRows} layout="vertical" margin={{ left: 22, right: 18 }}><CartesianGrid stroke="#1d3547" horizontal={false}/><XAxis type="number" tickFormatter={(value: number) => formatPercent(value)}/><YAxis type="category" dataKey="branch" width={48}/><Tooltip formatter={(value: unknown) => [formatPercent(Number(value)), "Growth 3T"]}/><ReferenceLine x={0} stroke="#7f9aaf"/><Bar dataKey="recent_growth" radius={[0,4,4,0]}>{growthRows.map((row) => <Cell key={row.branch} fill={(row.recent_growth ?? 0) >= 0 ? "#16d8c2" : "#ff7373"}/>)}</Bar></BarChart></ResponsiveContainer></div>
        </article>

        <article className="bf-card wide">
          <header><h4>{data?.selected.branch} — {data?.selected.branch_name}</h4><p>{data?.selected.recommended_strategy} · Segment {data?.selected.forecastability_segment}</p></header>
          <div className="bf-detail-kpis"><span>Mean/tháng <b>{formatNumber(data?.selected.mean_monthly_quantity)}</b></span><span>CV <b>{optionalPercent(data?.selected.cv)}</b></span><span>Naive WAPE <b>{optionalPercent(data?.selected.naive_wape)}</b></span><span>Seasonal gain <b>{optionalPercent(data?.selected.seasonal_gain)}</b></span><span>Top-5 SKU share <b>{optionalPercent(data?.selected.top5_sku_share)}</b></span></div>
          <div className="bf-chart large"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data?.selected.history ?? []} margin={{ top: 12, right: 18, bottom: 4, left: 5 }}><CartesianGrid stroke="#1d3547" strokeDasharray="3 3"/><XAxis dataKey="month" tickFormatter={(value: string) => formatMonth(value)} tick={{ fontSize: 10 }}/><YAxis tickFormatter={compact}/><Tooltip labelFormatter={(value: unknown) => formatMonth(String(value))} formatter={(value: unknown, name: unknown) => [formatNumber(Number(value)), String(name)]}/><Legend/><Bar dataKey="quantity" name="Quantity" fill="#16d8c255"/><Line dataKey="moving_average_3" name="MA3" stroke="#16d8c2" strokeWidth={2.4} dot={false}/><Line dataKey="moving_average_6" name="MA6" stroke="#23afff" dot={false}/><Line dataKey="same_month_last_year" name="Cùng tháng năm trước" stroke="#a78bfa" strokeDasharray="5 3" dot={false}/></ComposedChart></ResponsiveContainer></div>
        </article>

        <article className="bf-card">
          <header><h4>Monthly profile</h4><p>Index 1,0 = mean tháng toàn lịch sử; mỗi tháng chỉ có tối đa 2–3 quan sát.</p></header>
          <div className="bf-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data?.selected.monthly_profile ?? []}><CartesianGrid stroke="#1d3547" strokeDasharray="3 3"/><XAxis dataKey="month_number" tickFormatter={(value: number) => MONTHS[value - 1]}/><YAxis/><ReferenceLine y={1} stroke="#ffc14d" strokeDasharray="4 3"/><Tooltip formatter={(value: unknown, name: unknown) => [name === "seasonal_index" ? Number(value).toFixed(2) : formatNumber(Number(value)), String(name)]}/><Bar dataKey="seasonal_index" name="Seasonal index" fill="#a78bfa"/></BarChart></ResponsiveContainer></div>
        </article>

        <article className="bf-card">
          <header><h4>SKU kéo tổng lượng 12 tháng</h4><p>Share cao làm forecast tổng chi nhánh phụ thuộc vào vài SKU.</p></header>
          <div className="bf-top-skus">{data?.selected.top_skus.slice(0, 10).map((row) => <div key={row.base_sku}><span>{row.base_sku}<small>{row.sku_name || "—"}</small></span><i><em style={{ width: `${Math.min(row.share * 100, 100)}%` }}/></i><b>{formatPercent(row.share)}</b></div>)}</div>
        </article>
      </section>

      <section className="bf-card">
        <header><h4>Bảng chẩn đoán toàn bộ chi nhánh</h4><p>Click một dòng để mở lịch sử chi tiết phía trên.</p></header>
        <div className="bf-table-wrap"><table><thead><tr><th>Chi nhánh</th><th>Segment</th><th>Quantity TB/T</th><th>Growth 3T</th><th>CV</th><th>Naive WAPE</th><th>Seasonal WAPE</th><th>Seasonal gain</th><th>Coverage</th><th>Top-5 share</th><th>Hướng model</th></tr></thead><tbody>{data?.branches.map((row) => <tr key={row.branch} className={row.branch === data.selected.branch ? "selected" : ""} onClick={() => changeBranch(row.branch)}><td><strong>{row.branch}</strong><small>{row.branch_name} · {row.region}</small></td><td><span className="bf-segment" style={{ borderColor: SEGMENT_COLORS[row.forecastability_segment], color: SEGMENT_COLORS[row.forecastability_segment] }}>{row.forecastability_segment}</span></td><td>{formatNumber(row.mean_monthly_quantity)}</td><td>{optionalPercent(row.recent_growth)}</td><td>{optionalPercent(row.cv)}</td><td>{optionalPercent(row.naive_wape)}</td><td>{optionalPercent(row.seasonal_naive_wape)}</td><td>{optionalPercent(row.seasonal_gain)}</td><td>{formatPercent(row.coverage)}</td><td>{formatPercent(row.top5_sku_share)}</td><td>{row.recommended_strategy}</td></tr>)}</tbody></table></div>
      </section>

      <details className="bf-method"><summary>Cách tính và giới hạn</summary>{Object.entries(data?.methodology ?? {}).map(([key, value]) => <p key={key}><strong>{key}:</strong> {value}</p>)}</details>

      <style jsx>{`
        .bf-page{display:grid;gap:13px;color:#ecf7ff}.bf-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:20px}.bf-heading h3{font-size:22px;margin:4px 0}.bf-heading p{margin:0;color:#8ea9ba}.bf-heading>span{font-size:12px;color:#9ab5c7}.bf-filters{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#081725;border:1px solid #193448;border-radius:10px;padding:12px}.bf-filters label{display:grid;gap:5px;color:#91adbf;font-size:11px}.bf-filters select{background:#0d1d2c;color:#ecf7ff;border:1px solid #233a4c;border-radius:7px;padding:9px}.bf-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:9px}.bf-kpis article,.bf-card{background:linear-gradient(145deg,#0d2030,#091722);border:1px solid #193448;border-radius:10px}.bf-kpis article{padding:14px}.bf-kpis span,.bf-kpis small{display:block;color:#8ea9ba;font-size:11px}.bf-kpis strong{display:block;font-size:21px;margin:6px 0}.bf-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}.bf-card{padding:15px;overflow:hidden}.bf-card.wide{grid-column:1/-1}.bf-card header{margin-bottom:10px}.bf-card h4{margin:0 0 4px}.bf-card header p{margin:0;color:#809bad;font-size:11px}.bf-chart{height:300px}.bf-chart.large{height:360px}.bf-detail-kpis{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}.bf-detail-kpis span{border:1px solid #244358;background:#0a1a28;border-radius:6px;padding:7px;color:#8ea9ba;font-size:10px}.bf-detail-kpis b{color:#ecf7ff;margin-left:4px}.bf-top-skus{display:grid;gap:8px}.bf-top-skus>div{display:grid;grid-template-columns:minmax(130px,1fr) 1.3fr 55px;align-items:center;gap:9px;font-size:11px}.bf-top-skus span{overflow:hidden;text-overflow:ellipsis}.bf-top-skus small{display:block;color:#6f8b9d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bf-top-skus i{height:7px;background:#142b3c;border-radius:99px;overflow:hidden}.bf-top-skus em{display:block;height:100%;background:linear-gradient(90deg,#16d8c2,#23afff)}.bf-top-skus b{text-align:right}.bf-table-wrap{overflow:auto}.bf-table-wrap table{border-collapse:collapse;width:100%;min-width:1450px}.bf-table-wrap th,.bf-table-wrap td{border:1px solid #193448;padding:9px;font-size:11px;white-space:nowrap;text-align:right}.bf-table-wrap th{background:#101e31;color:#d9e9f4}.bf-table-wrap th:first-child,.bf-table-wrap td:first-child,.bf-table-wrap th:last-child,.bf-table-wrap td:last-child{text-align:left}.bf-table-wrap tbody tr{cursor:pointer}.bf-table-wrap tbody tr:hover,.bf-table-wrap tbody tr.selected{background:#10293b}.bf-table-wrap td strong,.bf-table-wrap td small{display:block}.bf-table-wrap td strong{color:#16d8c2}.bf-table-wrap td small{color:#7894a6}.bf-segment{display:inline-flex;border:1px solid;border-radius:99px;padding:3px 7px;font-size:9px;font-weight:700}.bf-method{background:#081725;border:1px solid #193448;border-radius:10px;padding:13px;color:#91adbf;font-size:12px}.bf-method summary{cursor:pointer;color:#d9e9f4;font-weight:700}.bf-method strong{color:#16d8c2;text-transform:capitalize}@media(max-width:1100px){.bf-kpis{grid-template-columns:repeat(2,1fr)}.bf-grid{grid-template-columns:1fr}.bf-card.wide{grid-column:auto}}@media(max-width:700px){.bf-heading{align-items:flex-start;flex-direction:column}.bf-filters,.bf-kpis{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
