"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { apiGet } from "@/lib/api";
import { formatMonth, formatNumber, formatPercent } from "@/lib/format";


type Distribution = { key: string; label: string; count: number; share: number };
type BranchOption = { region: string; branch_code: string; branch_name: string };
type Sample = {
  base_sku: string;
  sku_name: string | null;
  branch: string;
  branch_name: string | null;
  region: string;
  lifecycle: string;
  lifecycle_label: string;
  evidence_level: string;
  evidence_label: string;
  demand_pattern: string;
  recommended_strategy: string;
  strategy_label: string;
  history_months: number;
  positive_months: number;
  months_since_positive: number | null;
  demand_12m: number;
  has_seasonal_signal: boolean;
  season_ahead: boolean;
  is_relaunched: boolean;
};
type SegmentationData = {
  data_as_of_month: string;
  forecast_horizon: number;
  filters: { region: string; branch: string };
  options: { regions: string[]; branches: BranchOption[] };
  kpis: {
    series_count: number;
    seasonal_signal_count: number;
    seasonal_signal_share: number;
    relaunch_count: number;
    relaunch_share: number;
    standard_or_high_count: number;
  };
  lifecycle_distribution: Distribution[];
  evidence_distribution: Distribution[];
  pattern_distribution: Distribution[];
  strategy_distribution: Distribution[];
  lifecycle_pattern_matrix: Array<{
    lifecycle: string;
    lifecycle_label: string;
    demand_pattern: string;
    count: number;
  }>;
  region_distribution: Array<{
    region: string;
    series_count: number;
    seasonal_return_count: number;
    off_season_count: number;
    dormant_suspected_count: number;
    new_at_branch_count: number;
  }>;
  samples: Sample[];
  methodology: Record<string, string>;
};

const COLORS = ["#16d8c2", "#23afff", "#ffc14d", "#a78bfa", "#ff7373", "#62c370", "#f97316", "#64748b"];
const MATRIX_PATTERNS = ["Smooth", "Erratic", "Intermittent", "Lumpy", "Insufficient-New", "Excluded-Inactive", "Unknown"];

function compact(value: unknown): string {
  return Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value));
}

function DistributionChart({ rows }: { rows: Distribution[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 22, bottom: 4, left: 18 }}>
        <CartesianGrid stroke="#1d3547" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={compact} stroke="#7f9aaf" />
        <YAxis type="category" dataKey="label" width={148} tick={{ fill: "#b9d0df", fontSize: 11 }} />
        <Tooltip formatter={(value: unknown, _name: unknown, item) => [
          `${formatNumber(Number(value))} · ${formatPercent(item.payload.share)}`,
          "Chuỗi",
        ]} />
        <Bar dataKey="count" radius={[0, 5, 5, 0]}>
          {rows.map((row, index) => <Cell key={row.key} fill={COLORS[index % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EdaForecastSegments() {
  const [data, setData] = useState<SegmentationData | null>(null);
  const [region, setRegion] = useState("");
  const [branch, setBranch] = useState("");
  const [horizon, setHorizon] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<SegmentationData>("/eda/forecast-segments/overview", {
      region: region || undefined,
      branch: branch || undefined,
      horizon,
      sample_size: 50,
    })
      .then((response) => {
        if (cancelled) return;
        setData(response);
        setError(null);
      })
      .catch((reason: Error) => {
        if (!cancelled) setError(reason.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [branch, horizon, region]);

  const branches = useMemo(
    () => (data?.options.branches ?? []).filter((item) => !region || item.region === region),
    [data?.options.branches, region],
  );
  const matrix = useMemo(() => {
    const rows = data?.lifecycle_distribution ?? [];
    const counts = new Map(
      (data?.lifecycle_pattern_matrix ?? []).map((item) => [`${item.lifecycle}\u0000${item.demand_pattern}`, item.count]),
    );
    return rows.map((row) => ({
      key: row.key,
      label: row.label,
      total: row.count,
      values: MATRIX_PATTERNS.map((pattern) => counts.get(`${row.key}\u0000${pattern}`) ?? 0),
    }));
  }, [data?.lifecycle_distribution, data?.lifecycle_pattern_matrix]);

  return (
    <div className="fs-page">
      <header className="fs-heading">
        <div>
          <p className="eyebrow">FORECAST READINESS</p>
          <h3>Phân khúc chuỗi phục vụ Forecast</h3>
          <p>Không coi “gần đây không bán” là dormant ngay; hệ thống kiểm tra mùa bán sắp tới trước.</p>
        </div>
        <span>{loading ? "Đang tính phân khúc…" : `Dữ liệu đến ${data ? formatMonth(data.data_as_of_month) : "—"}`}</span>
      </header>

      <section className="fs-filters" aria-label="Bộ lọc phân khúc forecast">
        <label>Vùng
          <select value={region} onChange={(event) => { setLoading(true); setRegion(event.target.value); setBranch(""); }}>
            <option value="">Tất cả vùng</option>
            {data?.options.regions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>Chi nhánh
          <select value={branch} onChange={(event) => { setLoading(true); setBranch(event.target.value); }}>
            <option value="">Tất cả chi nhánh</option>
            {branches.map((item) => <option key={`${item.region}-${item.branch_code}`} value={item.branch_code}>{item.branch_code} — {item.branch_name}</option>)}
          </select>
        </label>
        <label>Horizon kiểm tra mùa
          <select value={horizon} onChange={(event) => { setLoading(true); setHorizon(Number(event.target.value)); }}>
            {[1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>{value} tháng tới</option>)}
          </select>
        </label>
      </section>

      {error ? <div className="error-banner">Không tải được phân khúc: {error}</div> : null}

      <section className="fs-kpis">
        <article><span>Tổng chuỗi</span><strong>{formatNumber(data?.kpis.series_count)}</strong><small>Base SKU × chi nhánh</small></article>
        <article><span>Có tín hiệu mùa vụ</span><strong>{formatPercent(data?.kpis.seasonal_signal_share)}</strong><small>{formatNumber(data?.kpis.seasonal_signal_count)} chuỗi</small></article>
        <article><span>Đã từng relaunch</span><strong>{formatPercent(data?.kpis.relaunch_share)}</strong><small>{formatNumber(data?.kpis.relaunch_count)} chuỗi</small></article>
        <article><span>Evidence standard/high</span><strong>{formatNumber(data?.kpis.standard_or_high_count)}</strong><small>Không reset bởi episode</small></article>
      </section>

      <section className="fs-grid">
        <article className="fs-card wide">
          <header><div><h4>Vòng đời tại thời điểm forecast</h4><p>Kiểm tra hàng mới, recency và mùa bán trước khi nghi ngờ dormant.</p></div></header>
          <div className="fs-chart tall"><DistributionChart rows={data?.lifecycle_distribution ?? []} /></div>
        </article>

        <article className="fs-card">
          <header><div><h4>Mức bằng chứng</h4><p>6+2 là provisional; 12+3 là standard; 18+6 là high.</p></div></header>
          <div className="fs-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.evidence_distribution ?? []} dataKey="count" nameKey="label" innerRadius={58} outerRadius={92} paddingAngle={2}>
                  {(data?.evidence_distribution ?? []).map((row, index) => <Cell key={row.key} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: unknown, _name: unknown, item) => [`${formatNumber(Number(value))} · ${formatPercent(item.payload.share)}`, item.payload.label]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="fs-card">
          <header><div><h4>Demand pattern</h4><p>Pattern là một trục riêng, không thay thế vòng đời.</p></div></header>
          <div className="fs-chart"><DistributionChart rows={data?.pattern_distribution ?? []} /></div>
        </article>

        <article className="fs-card wide">
          <header><div><h4>Chiến lược forecast được gợi ý</h4><p>Mỗi segment được ánh xạ sang hướng model phù hợp, chưa phải model đã chọn.</p></div></header>
          <div className="fs-chart tall"><DistributionChart rows={data?.strategy_distribution ?? []} /></div>
        </article>

        <article className="fs-card wide">
          <header><div><h4>Vòng đời × Demand pattern</h4><p>Giúp phát hiện nhóm chồng lấn như “sắp vào mùa + intermittent”.</p></div></header>
          <div className="fs-table-wrap"><table className="fs-matrix"><thead><tr><th>Vòng đời</th>{MATRIX_PATTERNS.map((item) => <th key={item}>{item}</th>)}<th>Tổng</th></tr></thead><tbody>{matrix.map((row) => <tr key={row.key}><th>{row.label}</th>{row.values.map((value, index) => <td key={`${row.key}-${MATRIX_PATTERNS[index]}`} className={value ? "has-value" : ""}>{formatNumber(value)}</td>)}<td><strong>{formatNumber(row.total)}</strong></td></tr>)}</tbody></table></div>
        </article>

        <article className="fs-card wide">
          <header><div><h4>So sánh tín hiệu theo vùng</h4><p>Nhìn nhanh seasonal return, off-season, hàng mới và dormant suspected.</p></div></header>
          <div className="fs-chart tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={data?.region_distribution ?? []} margin={{ top: 8, right: 18, bottom: 8, left: 8 }}><CartesianGrid stroke="#1d3547" strokeDasharray="3 3"/><XAxis dataKey="region" stroke="#7f9aaf"/><YAxis tickFormatter={compact} stroke="#7f9aaf"/><Tooltip/><Legend/><Bar dataKey="seasonal_return_count" name="Sắp vào mùa" stackId="a" fill="#16d8c2"/><Bar dataKey="off_season_count" name="Ngoài mùa" stackId="a" fill="#23afff"/><Bar dataKey="new_at_branch_count" name="Mới tại CN" stackId="a" fill="#a78bfa"/><Bar dataKey="dormant_suspected_count" name="Nghi dormant" stackId="a" fill="#ff7373"/></BarChart></ResponsiveContainer></div>
        </article>
      </section>

      <section className="fs-card fs-samples">
        <header><div><h4>Chuỗi cần chú ý</h4><p>Ưu tiên seasonal return, mới tại chi nhánh và dormant suspected; sắp xếp tiếp theo sản lượng 12 tháng.</p></div></header>
        <div className="fs-table-wrap"><table><thead><tr><th>Base SKU / Chi nhánh</th><th>Vòng đời</th><th>Evidence</th><th>Pattern</th><th>Lịch sử</th><th>Tháng dương</th><th>Từ lần bán cuối</th><th>Demand 12T</th><th>Cờ</th><th>Hướng Forecast</th></tr></thead><tbody>{data?.samples.map((row) => <tr key={`${row.base_sku}-${row.branch}`}><td><strong>{row.base_sku}</strong><small>{row.sku_name || "—"} · {row.branch} — {row.branch_name || row.branch}</small></td><td><span className={`fs-badge ${row.lifecycle.toLowerCase()}`}>{row.lifecycle_label}</span></td><td>{row.evidence_label}</td><td>{row.demand_pattern}</td><td>{row.history_months} tháng</td><td>{row.positive_months}</td><td>{row.months_since_positive === null ? "—" : `${row.months_since_positive} tháng`}</td><td>{formatNumber(row.demand_12m)}</td><td><div className="fs-flags">{row.has_seasonal_signal ? <span>Mùa vụ</span> : null}{row.season_ahead ? <span>Sắp vào mùa</span> : null}{row.is_relaunched ? <span>Relaunch</span> : null}</div></td><td>{row.strategy_label}</td></tr>)}</tbody></table></div>
      </section>

      <details className="fs-method"><summary>Cách hệ thống đang phân chia</summary>{Object.entries(data?.methodology ?? {}).map(([key, value]) => <p key={key}><strong>{key.replaceAll("_", " ")}:</strong> {value}</p>)}</details>

      <style jsx>{`
        .fs-page{display:grid;gap:14px;color:#ecf7ff}.fs-heading{display:flex;justify-content:space-between;gap:20px;align-items:flex-end}.fs-heading h3{font-size:22px;margin:4px 0}.fs-heading p{margin:0;color:#8ea9ba}.fs-heading>span{color:#9ab5c7;font-size:12px;white-space:nowrap}.fs-filters{display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));gap:10px;padding:12px;background:#081725;border:1px solid #193448;border-radius:10px}.fs-filters label{display:grid;gap:6px;color:#91adbf;font-size:11px}.fs-filters select{background:#0d1d2c;color:#ecf7ff;border:1px solid #233a4c;border-radius:7px;padding:9px}.fs-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.fs-kpis article,.fs-card{background:linear-gradient(145deg,#0d2030,#091722);border:1px solid #193448;border-radius:10px}.fs-kpis article{padding:15px}.fs-kpis span,.fs-kpis small{display:block;color:#8ea9ba;font-size:11px}.fs-kpis strong{display:block;font-size:22px;margin:6px 0}.fs-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.fs-card{padding:15px;overflow:hidden}.fs-card.wide{grid-column:1/-1}.fs-card header{display:flex;justify-content:space-between;margin-bottom:10px}.fs-card h4{margin:0 0 4px;font-size:15px}.fs-card header p{margin:0;color:#809bad;font-size:11px}.fs-chart{height:275px}.fs-chart.tall{height:340px}.fs-table-wrap{overflow:auto}.fs-matrix,.fs-samples table{border-collapse:collapse;width:100%;min-width:940px}.fs-matrix th,.fs-matrix td,.fs-samples th,.fs-samples td{border:1px solid #193448;padding:9px;font-size:11px;text-align:right}.fs-matrix th:first-child,.fs-samples th:first-child,.fs-samples td:first-child{text-align:left}.fs-matrix thead th,.fs-samples thead th{background:#101e31;color:#d9e9f4;white-space:nowrap}.fs-matrix tbody th{color:#b9d0df;text-align:left;white-space:nowrap}.fs-matrix td{color:#708a9c}.fs-matrix td.has-value{background:rgba(35,175,255,.13);color:#e8f7ff}.fs-samples{margin-top:0}.fs-samples table{min-width:1400px}.fs-samples tbody tr:hover{background:#10293b}.fs-samples td{white-space:nowrap}.fs-samples td:first-child strong,.fs-samples td:first-child small{display:block}.fs-samples td:first-child strong{color:#16d8c2}.fs-samples td:first-child small{color:#7894a6;margin-top:3px}.fs-badge,.fs-flags span{display:inline-flex;border:1px solid #2a526c;background:#102c3e;color:#bfe8ff;border-radius:999px;padding:4px 7px;font-size:10px}.fs-badge.dormant_confirmed,.fs-badge.dormant_suspected{border-color:#7a2937;background:#431721;color:#ff9cab}.fs-badge.seasonal_return_expected{border-color:#16725c;background:#0b4a3d;color:#42e4b3}.fs-flags{display:flex;gap:4px}.fs-method{background:#081725;border:1px solid #193448;border-radius:10px;padding:13px;color:#91adbf;font-size:12px}.fs-method summary{cursor:pointer;color:#d9e9f4;font-weight:700}.fs-method strong{color:#16d8c2;text-transform:capitalize}@media(max-width:1050px){.fs-kpis{grid-template-columns:1fr 1fr}.fs-grid{grid-template-columns:1fr}.fs-card.wide{grid-column:auto}}@media(max-width:700px){.fs-heading{align-items:flex-start;flex-direction:column}.fs-filters,.fs-kpis{grid-template-columns:1fr}.fs-chart{height:320px}}
      `}</style>
    </div>
  );
}
