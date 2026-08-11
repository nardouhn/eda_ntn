"use client";

import { useEffect, useMemo, useState } from "react";
import {
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
import { formatMonth, formatPercent } from "@/lib/format";

type Level = "overview" | "region" | "branch" | "sku" | "branch-sku" | "pattern-set";
type Metric = "quantity" | "revenue";
type Confidence = "reliable" | "low";
type MonthlyPoint = {
  month: string;
  value: number;
  trend_index: number;
  gg_trends_index: number;
  gg_trends_lag1: number;
  gg_trends_lag2?: number | null;
  gg_trends_lag3?: number | null;
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
  thanh_minh_correlation?: number | null;
  gg_correlation?: number | null;
  gg_lag1_correlation?: number | null;
  operational_outlier_score?: number | null;
  signed_deviation?: number | null;
  coverage_pct?: number | null;
  tet_uplift_pct?: number | null;
  gieng_uplift_pct?: number | null;
  co_hon_uplift_pct?: number | null;
  thanh_minh_uplift_pct?: number | null;
  gg_confidence?: Confidence;
  tet_confidence?: Confidence;
  thanh_minh_confidence?: Confidence;
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
  page?: number;
  page_size?: number;
  total?: number;
};

const TITLES: Record<Level, string> = {
  overview: "Vĩ mô, lịch âm và decomposition",
  region: "Độ nhạy mùa vụ theo vùng",
  branch: "Chi nhánh lệch khỏi pattern vùng",
  sku: "SKU nhạy với tìm kiếm và mùa vụ",
  "branch-sku": "Mô tả feature ở cấp SKU × chi nhánh",
  "pattern-set": "Bộ mẫu nhạy với feature ngoại sinh",
};

function correlation(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : value.toFixed(3);
}

function trustedCorrelation(value: number | null | undefined, confidence?: Confidence) {
  return confidence === "low" ? "Chưa đủ dữ liệu" : correlation(value);
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
  const [page, setPage] = useState(1);
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiGet<InsightData>(`/eda/external-features/${level}`, { metric, page, page_size: 50 })
      .then((response) => { if (active) { setData(response); setError(null); } })
      .catch((reason: Error) => { if (active) { setData(null); setError(reason.message || "Chưa tải được feature mart."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [level, metric, page]);

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.page_size ?? 50)));
  function changeMetric(next: Metric) {
    setLoading(true);
    setError(null);
    setPage(1);
    setMetric(next);
  }

  return (
    <section className="external-panel">
      <header>
        <div><p className="eyebrow">EXTERNAL FEATURES</p><h3>{TITLES[level]}</h3><small>{data ? `${formatMonth(data.filters.date_from)} → ${formatMonth(data.filters.date_to)}` : "Feature tháng × vùng"}</small></div>
        <div className="external-toggle"><button disabled={metric === "quantity"} className={metric === "quantity" ? "active" : ""} onClick={() => changeMetric("quantity")}>Sản lượng</button><button disabled={metric === "revenue"} className={metric === "revenue" ? "active" : ""} onClick={() => changeMetric("revenue")}>Doanh thu</button></div>
      </header>
      {loading ? <p className="external-empty">Đang tính insight feature…</p> : null}
      {error ? <div className="error-banner">{error}</div> : null}
      {!loading && !error && data ? (
        <>
          {level === "overview" ? <OverviewInsight data={data} /> : null}
          {level === "region" ? <RegionInsight rows={data.items ?? []} /> : null}
          {level === "branch" ? <BranchInsight rows={data.items ?? []} /> : null}
          {level === "sku" || level === "branch-sku" || level === "pattern-set" ? <SensitivityInsight level={level} rows={data.items ?? []} /> : null}
          {(data.total ?? 0) > 50 ? <div className="external-pagination"><span>{compact(data.total)} dòng · Trang {page}/{totalPages}</span><button disabled={page <= 1} onClick={() => { setLoading(true); setPage((value) => value - 1); }}>← Trước</button><button disabled={page >= totalPages} onClick={() => { setLoading(true); setPage((value) => value + 1); }}>Sau →</button></div> : null}
          <p className="external-method">{data.methodology}</p>
        </>
      ) : null}
      <style>{styles}</style>
    </section>
  );
}

function indexedSeries(rows: MonthlyPoint[]) {
  const mean = (values: Array<number | null | undefined>) => {
    const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 1;
  };
  const demandMean = mean(rows.map((row) => row.value));
  const ggMean = mean(rows.map((row) => row.gg_trends_index));
  return rows.map((row) => ({
    ...row,
    demand_index: demandMean ? row.value / demandMean * 100 : 0,
    gg_index_100: ggMean ? row.gg_trends_index / ggMean * 100 : null,
    gg_lag1_100: ggMean ? row.gg_trends_lag1 / ggMean * 100 : null,
  }));
}

function OverviewInsight({ data }: { data: InsightData }) {
  const corr = data.correlations ?? {};
  const monthly = useMemo(() => data.monthly ?? [], [data.monthly]);
  const indexed = useMemo(() => indexedSeries(monthly), [monthly]);
  const lagRows = [0, 1, 2, 3].map((lag) => ({ lag, value: corr[lag === 0 ? "gg_trends_index" : `gg_trends_lag${lag}`] }));
  return <>
    <div className="external-kpis">
      <article><span>Corr GG hiện tại</span><strong>{correlation(corr.gg_trends_index)}</strong></article>
      <article><span>Corr GG lag tốt nhất</span><strong>{correlation(lagRows.reduce((best, item) => Math.abs(item.value ?? 0) > Math.abs(best.value ?? 0) ? item : best).value)}</strong></article>
      <article><span>Corr chạy Tết</span><strong>{correlation(corr.ty_trong_chay_tet)}</strong></article>
      <article><span>Corr tháng Giêng</span><strong>{correlation(corr.ty_trong_thang_gieng)}</strong></article>
      <article><span>Corr Thanh Minh</span><strong>{correlation(corr.ty_trong_thanh_minh)}</strong></article>
    </div>
    <div className="external-grid">
      <article className="external-card wide"><header><h4>Demand và Google Trends · index trung bình = 100</h4><span>So sánh hình dạng chuỗi, không so đơn vị gốc</span></header><div className="external-chart compact-chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={indexed}><CartesianGrid stroke="#1d3547" strokeDasharray="3 3"/><XAxis dataKey="month" tickFormatter={(value: string) => formatMonth(value)} stroke="#7f9aaf" tick={{fontSize:9}}/><YAxis stroke="#7f9aaf"/><Tooltip labelFormatter={(value: unknown) => formatMonth(String(value))}/><Legend/><Line dataKey="demand_index" name="Demand" stroke="#16d8c2" strokeWidth={2.4} dot={false}/><Line dataKey="gg_index_100" name="GG hiện tại" stroke="#ffc14d" dot={false}/><Line dataKey="gg_lag1_100" name="GG lag 1" stroke="#a78bfa" strokeDasharray="5 3" dot={false}/><ReferenceLine y={100} stroke="#587083" strokeDasharray="2 4"/></ComposedChart></ResponsiveContainer></div></article>
      <article className="external-card"><header><h4>Kiểm tra độ trễ Google Trends</h4><span>Pearson correlation lag 0–3</span></header><div className="lag-bars">{lagRows.map((row) => <div key={row.lag}><span>Lag {row.lag}</span><i><b style={{ width: `${Math.abs(row.value ?? 0) * 100}%` }} /></i><strong>{correlation(row.value)}</strong></div>)}</div></article>
      <article className="external-card"><header><h4>Lịch sự kiện theo tỷ trọng ngày</h4><span>Màu đậm = nhiều ngày chịu tác động</span></header><EventRibbon rows={monthly}/></article>
      <article className="external-card wide"><header><h4>Demand thực tế và decomposition</h4><span>Linear trend + seasonal tháng trong năm</span></header><div className="external-chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={monthly} margin={{top:12,right:16,bottom:4,left:4}}><CartesianGrid stroke="#1d3547" strokeDasharray="3 3"/><XAxis dataKey="month" tickFormatter={(value: string) => formatMonth(value)} stroke="#7f9aaf" tick={{fontSize:9}}/><YAxis tickFormatter={compact} stroke="#16d8c2"/><Tooltip labelFormatter={(value: unknown) => formatMonth(String(value))}/><Legend/><Line dataKey="value" name="Thực tế" stroke="#16d8c2" strokeWidth={2} dot={false}/><Line dataKey="linear_trend" name="Trend" stroke="#23afff" strokeDasharray="5 4" dot={false}/><Line dataKey="fitted" name="Trend + seasonal" stroke="#ff7373" strokeDasharray="2 3" dot={false}/></ComposedChart></ResponsiveContainer></div></article>
    </div>
  </>;
}

function EventRibbon({ rows }: { rows: MonthlyPoint[] }) {
  const events = [
    ["Chạy Tết", "ty_trong_chay_tet", "255,193,77"],
    ["Tháng Giêng", "ty_trong_thang_gieng", "35,175,255"],
    ["Cô hồn", "ty_trong_thang_co_hon", "168,85,247"],
    ["Thanh Minh", "ty_trong_thanh_minh", "33,215,155"],
  ] as const;
  return <div className="event-ribbon">{events.map(([label, field, color]) => <div key={field}><strong>{label}</strong><span>{rows.map((row) => <i key={`${field}-${row.month}`} title={`${formatMonth(row.month)}: ${formatPercent(row[field])}`} style={{background:`rgba(${color},${0.08 + row[field] * 0.92})`}} />)}</span></div>)}</div>;
}

function RegionInsight({ rows }: { rows: InsightRow[] }) {
  const scaleMax = Math.max(...rows.flatMap((row) => [row.rainy_avg ?? 0, row.dry_avg ?? 0]), 1);
  return <>
    <div className="external-grid">
      <article className="external-card"><header><h4>Mùa khô so với mùa mưa</h4><span>Vị trí theo demand trung bình</span></header><div className="dumbbell">{rows.map((row) => { const dry=(row.dry_avg ?? 0)/scaleMax*100; const rain=(row.rainy_avg ?? 0)/scaleMax*100; return <div key={row.region}><strong>{row.region}</strong><span><i className="dry" style={{left:`${dry}%`}}/><b style={{left:`${Math.min(dry,rain)}%`,width:`${Math.abs(dry-rain)}%`}}/><i className="rain" style={{left:`${rain}%`}}/></span><em>{formatPercent(row.rainy_change_pct)}</em></div>; })}</div><div className="dumbbell-legend"><span>● Mùa khô</span><span>● Mùa mưa</span></div></article>
      <article className="external-card"><header><h4>Event uplift so với baseline</h4><span>Baseline là tháng ngoài bốn sự kiện</span></header><div className="uplift-grid">{rows.map((row) => <div key={row.region}><strong>{row.region}</strong><span>Tết {formatPercent(row.tet_uplift_pct)}</span><span>Giêng {formatPercent(row.gieng_uplift_pct)}</span><span>Cô hồn {formatPercent(row.co_hon_uplift_pct)}</span><span>Thanh Minh {formatPercent(row.thanh_minh_uplift_pct)}</span></div>)}</div></article>
    </div>
    <div className="external-table-wrap"><table><thead><tr><th>Vùng</th><th>Tháng</th><th>TB mùa mưa</th><th>TB mùa khô</th><th>Chênh mưa/khô</th><th>Corr mưa</th><th>Corr Tết</th><th>Corr Thanh Minh</th></tr></thead><tbody>{rows.map((row) => <tr key={row.region}><td><strong>{row.region}</strong></td><td>{row.observed_months}</td><td>{compact(row.rainy_avg)}</td><td>{compact(row.dry_avg)}</td><td className={(row.rainy_change_pct ?? 0)<0?"negative":"positive"}>{formatPercent(row.rainy_change_pct)}</td><td>{correlation(row.rain_correlation)}</td><td>{correlation(row.tet_correlation)}</td><td>{correlation(row.thanh_minh_correlation)}</td></tr>)}</tbody></table></div>
  </>;
}

function BranchInsight({ rows }: { rows: InsightRow[] }) {
  return <div className="external-table-wrap"><table><thead><tr><th>Chi nhánh</th><th>Vùng</th><th>Tháng</th><th>Tổng</th><th>Outlier score</th><th>Lệch có dấu</th></tr></thead><tbody>{rows.map((row) => <tr key={row.branch_code}><td><strong>{row.branch_code}</strong><small>{row.branch_name}</small></td><td>{row.region}</td><td>{row.observed_months}</td><td>{compact(row.total_value)}</td><td>{formatPercent(row.operational_outlier_score)}</td><td className={(row.signed_deviation ?? 0)<0?"negative":"positive"}>{formatPercent(row.signed_deviation)}</td></tr>)}</tbody></table></div>;
}

function SensitivityInsight({ level, rows }: { level: Level; rows: InsightRow[] }) {
  const [event, setEvent] = useState<"tet" | "thanh_minh">("tet");
  const points = rows.filter((row) => row.gg_lag1_correlation !== null && row.gg_lag1_correlation !== undefined && row[`${event}_uplift_pct`] !== null && row[`${event}_uplift_pct`] !== undefined).map((row) => ({ x: row.gg_lag1_correlation, y: row[`${event}_uplift_pct`] as number, z: Math.max(row.total_value ?? 0, 1), label: entityLabel(level,row), confidence: row[`${event}_confidence`] as Confidence }));
  return <>
    <article className="external-card sensitivity-card"><header><div><h4>Bản đồ độ nhạy</h4><span>X = Corr GG lag1 · Y = event uplift · Bubble = tổng demand</span></div><div className="external-toggle"><button className={event==="tet"?"active":""} onClick={() => setEvent("tet")}>Tết</button><button className={event==="thanh_minh"?"active":""} onClick={() => setEvent("thanh_minh")}>Thanh Minh</button></div></header><div className="external-chart"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{top:15,right:20,bottom:20,left:10}}><CartesianGrid stroke="#1d3547"/><XAxis type="number" dataKey="x" name="Corr GG lag1" domain={[-1,1]}/><YAxis type="number" dataKey="y" name="Event uplift" tickFormatter={(value:number)=>formatPercent(value)}/><ZAxis type="number" dataKey="z" range={[45,500]}/><ReferenceLine x={0} stroke="#587083"/><ReferenceLine y={0} stroke="#587083"/><Tooltip cursor={{strokeDasharray:"3 3"}} formatter={(value: unknown,name: unknown) => [name==="Event uplift"?formatPercent(Number(value)):name==="Corr GG lag1"?correlation(Number(value)):compact(value),String(name)]}/><Scatter data={points} name={event==="tet"?"Tết":"Thanh Minh"}>{points.map((point,index)=><Cell key={`${point.label}-${index}`} fill={point.confidence==="reliable"?"#16d8c2":"#64748b"}/>)}</Scatter></ScatterChart></ResponsiveContainer></div><p className="chart-note">Xám = dưới 18 tháng hoặc chưa quan sát đủ 2 kỳ sự kiện; chỉ dùng tham khảo.</p></article>
    <div className="external-table-wrap"><table><thead><tr><th>{level==="sku"?"SKU":level==="pattern-set"?"Bộ mẫu":"SKU × chi nhánh"}</th><th>Số tháng quan sát</th><th>Độ phủ</th><th>Tổng</th><th>Corr GG lag1</th><th>Uplift Tết</th><th>Uplift Thanh Minh</th><th>Độ tin cậy</th></tr></thead><tbody>{rows.map((row,index)=><tr key={`${entityLabel(level,row)}-${index}`}><td><strong>{entityLabel(level,row)}</strong></td><td>{row.observed_months}</td><td>{formatPercent(row.coverage_pct)}</td><td>{compact(row.total_value)}</td><td>{trustedCorrelation(row.gg_lag1_correlation,row.gg_confidence)}</td><td>{row.tet_confidence==="low"?"—":formatPercent(row.tet_uplift_pct)}</td><td>{row.thanh_minh_confidence==="low"?"—":formatPercent(row.thanh_minh_uplift_pct)}</td><td><span className={`confidence ${row.gg_confidence}`}>{row.gg_confidence==="reliable"?"Đủ dữ liệu":"Tham khảo"}</span></td></tr>)}</tbody></table></div>
  </>;
}

const styles = `.external-panel{margin-top:16px;padding:15px;background:#081725;border:1px solid var(--line);border-radius:10px;min-width:0}.external-panel>header,.external-card>header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:13px}.external-panel h3{margin:4px 0;font-size:15px}.external-card h4{margin:0}.external-card header span,.external-panel header small,.external-method,.chart-note{color:var(--muted);font-size:9px}.external-toggle{display:flex;gap:4px}.external-toggle button,.external-pagination button{padding:7px 10px;background:#102536;color:var(--text);border:1px solid var(--line);border-radius:6px;font-size:9px}.external-toggle button.active{background:var(--cyan);border-color:var(--cyan);color:#04121c}.external-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:10px}.external-kpis article,.external-card{padding:11px;background:#0d2030;border:1px solid var(--line);border-radius:8px;min-width:0}.external-kpis span{display:block;color:var(--muted);font-size:8px}.external-kpis strong{display:block;margin-top:5px;font-size:16px}.external-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}.external-card.wide{grid-column:1/-1}.external-chart{height:330px}.compact-chart{height:270px}.event-ribbon{display:grid;gap:8px}.event-ribbon>div{display:grid;grid-template-columns:80px 1fr;gap:8px;align-items:center;font-size:8px}.event-ribbon>div>span{display:grid;grid-template-columns:repeat(30,1fr);gap:2px}.event-ribbon i{height:19px;border-radius:2px}.lag-bars{display:grid;gap:10px}.lag-bars>div{display:grid;grid-template-columns:42px 1fr 42px;gap:8px;align-items:center;font-size:9px}.lag-bars i{height:9px;background:#142b3c;border-radius:99px;overflow:hidden}.lag-bars b{display:block;height:100%;background:linear-gradient(90deg,#23afff,#a78bfa)}.dumbbell{display:grid;gap:12px}.dumbbell>div{display:grid;grid-template-columns:85px 1fr 52px;gap:8px;align-items:center;font-size:9px}.dumbbell>div>span{position:relative;height:18px}.dumbbell b{position:absolute;top:8px;height:2px;background:#688093}.dumbbell i{position:absolute;top:4px;width:10px;height:10px;border-radius:50%;transform:translateX(-5px)}.dumbbell .dry{background:#ffc14d}.dumbbell .rain{background:#23afff}.dumbbell em{text-align:right;font-style:normal}.dumbbell-legend{display:flex;gap:14px;margin-top:12px;color:var(--muted);font-size:8px}.uplift-grid{display:grid;gap:7px}.uplift-grid>div{display:grid;grid-template-columns:90px repeat(4,1fr);gap:5px;padding:7px;background:#091b29;border-radius:6px;font-size:8px}.sensitivity-card{margin-bottom:10px}.chart-note{margin:5px 0 0}.external-table-wrap{max-width:100%;overflow:auto}.external-table-wrap table{width:100%;min-width:900px;border-collapse:collapse}.external-table-wrap th,.external-table-wrap td{padding:9px 8px;border-bottom:1px solid var(--line);font-size:9px;text-align:right;white-space:nowrap}.external-table-wrap th{color:#91a9b9;font-size:8px;text-transform:uppercase}.external-table-wrap th:first-child,.external-table-wrap td:first-child{text-align:left}.external-table-wrap td strong{display:block;color:var(--cyan)}.external-table-wrap td small{display:block;color:var(--muted)}.confidence{display:inline-flex;padding:3px 6px;border-radius:5px}.confidence.reliable{background:#0c4035;color:#52e5ba}.confidence.low{background:#263442;color:#9eb0bd}.external-pagination{display:flex;justify-content:flex-end;align-items:center;gap:7px;margin-top:10px;color:var(--muted);font-size:9px}.external-pagination button:disabled{opacity:.4}.external-method{margin:10px 0 0}.external-empty{padding:30px;text-align:center;color:var(--muted)}.external-panel .positive{color:var(--green)}.external-panel .negative{color:var(--red)}@media(max-width:900px){.external-kpis{grid-template-columns:repeat(2,1fr)}.external-grid{grid-template-columns:1fr}.external-card.wide{grid-column:auto}.uplift-grid>div{grid-template-columns:80px 1fr 1fr}.event-ribbon>div{grid-template-columns:70px 1fr}}`;
