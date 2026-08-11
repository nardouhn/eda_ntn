"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { apiGet } from "@/lib/api";
import { formatMonth, formatNumber, formatPercent } from "@/lib/format";
import { ExternalFeatureInsights } from "./external-feature-insights";


type Metric = "quantity" | "revenue" | "growth";
type TrendPoint = { month: string; value: number; net_negative?: boolean };
type BranchOption = { region: string; branch_code: string; branch_name: string };
type BranchSkuRow = {
  region: string;
  branch_code: string;
  branch_name: string;
  base_sku: string;
  sku_name: string;
  gross_quantity: number;
  revenue: number;
  growth: number | null;
  yoy_growth: number | null;
  adi: number | null;
  cv: number | null;
  demand_pattern: string;
  abc_class: string;
  status: string;
  history_months: number | null;
  positive_months: number;
  episode_id?: number | null;
  episode_start_month?: string | null;
  episode_end_month?: string | null;
  previous_demand_pattern?: string | null;
  pattern_changed?: boolean;
  trend: TrendPoint[];
  warnings: string[];
};
type HeatmapCell = {
  base_sku: string;
  sku_name: string;
  branch_code: string;
  branch_name: string;
  value: number | null;
};
type OverviewData = {
  data_as_of_month: string;
  pattern_source_available?: boolean;
  methodology?: string;
  filters: {
    region: string;
    branch: string;
    brand: string;
    sku: string;
    date_from: string;
    date_to: string;
    demand_pattern: string;
    abc_class: string;
    status: string;
  };
  options: {
    regions: string[];
    branches: BranchOption[];
    brands: string[];
    brand_supported: boolean;
    demand_patterns: string[];
    abc_classes: string[];
  };
  thresholds: {
    adi: number;
    cv2: number;
    min_history_months: number;
    min_positive_months: number;
    inactive_recent_months: number;
    relaunch_gap_months: number;
    updated_at: string;
  };
  kpis: {
    pair_count: number;
    gross_quantity: number;
    revenue: number;
    lumpy_count: number;
    insufficient_new_count: number;
    excluded_inactive_count: number;
  };
  heatmap: {
    metric: Metric;
    branches: Array<{ branch_code: string; branch_name: string }>;
    skus: Array<{ base_sku: string; sku_name: string }>;
    cells: HeatmapCell[];
  };
  page: number;
  page_size: number;
  total: number;
  items: BranchSkuRow[];
  exceptions: BranchSkuRow[];
  warning_definitions: Record<string, string>;
};
type Variant = {
  bravo_sku: string;
  sku_name: string;
  status: string;
  first_observed_month: string;
  last_observed_month: string;
  last_positive_sale_month: string | null;
  gross_quantity: number;
};
type DetailData = {
  base_sku: string;
  branch_code: string;
  data_as_of_month: string;
  history: Array<{ month: string; quantity: number; net_quantity: number; revenue: number; status: string; episode_id: number | null; net_negative: boolean }>;
  status_history: Array<{ month: string; status: string }>;
  episodes: Array<{
    episode_id: number;
    start_month: string;
    end_month: string;
    last_positive_month: string;
    history_months: number;
    positive_months: number;
    adi: number | null;
    cv2: number | null;
    demand_pattern: string;
    is_current: boolean;
    used_for_current_pattern: boolean;
  }>;
  current_episode_id: number | null;
  previous_demand_pattern: string | null;
  pattern_changed: boolean;
  warnings: string[];
  thresholds: { adi: number; cv2: number; updated_at: string; relaunch_gap_months: number };
  variants: Variant[];
};


function normalizeDetailData(value: DetailData): DetailData {
  return {
    ...value,
    history: Array.isArray(value.history) ? value.history : [],
    status_history: Array.isArray(value.status_history) ? value.status_history : [],
    episodes: Array.isArray(value.episodes) ? value.episodes : [],
    warnings: Array.isArray(value.warnings) ? value.warnings : [],
    variants: Array.isArray(value.variants) ? value.variants : [],
  };
}


function isOverviewData(value: unknown): value is OverviewData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<OverviewData>;
  return Boolean(
    candidate.filters
      && candidate.options
      && candidate.kpis
      && candidate.heatmap
      && Array.isArray(candidate.items)
      && Array.isArray(candidate.exceptions),
  );
}

function money(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function metric(value: number | null | undefined, digits = 2): string {
  return value === null || value === undefined ? "—" : formatNumber(value, digits);
}

function metricValue(value: number | null, selectedMetric: Metric): string {
  if (value === null) return "—";
  if (selectedMetric === "revenue") return money(value);
  if (selectedMetric === "growth") return formatPercent(value);
  return formatNumber(value);
}

function growthClass(value: number | null): string {
  if (value === null) return "neutral";
  return value >= 0 ? "positive" : "negative";
}

function statusClass(status: string): string {
  return status === "Hoạt động" ? "active" : "inactive";
}

function patternLabel(pattern: string): string {
  if (pattern === "Insufficient-New") return "Chưa đủ lịch sử";
  if (pattern === "Excluded-Inactive") return "Inactive quá lâu";
  return pattern;
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const encode = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = `\uFEFF${headers.map(encode).join(",")}\r\n${rows.map((row) => headers.map((key) => encode(row[key])).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Sparkline({ points }: { points: TrendPoint[] }) {
  const width = 130;
  const height = 36;
  const max = Math.max(...points.map((point) => point.value), 1);
  const coordinates = points.map((point, index) => {
    const x = 2 + (index / Math.max(points.length - 1, 1)) * (width - 4);
    const y = height - 3 - (point.value / max) * (height - 6);
    return { x, y, point };
  });
  const polyline = coordinates.map(({ x, y }) => `${x},${y}`).join(" ");
  return (
    <svg className="pair-sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Xu hướng demand 12 tháng">
      <polyline points={polyline} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      {coordinates.filter(({ point }) => point.net_negative).map(({ x, point }, index) => <circle key={`spark-negative-${point.month}-${index}`} cx={x} cy={height - 3} r="2.8" fill="#ff7185"><title>{formatMonth(point.month)}: net quantity âm</title></circle>)}
    </svg>
  );
}

function HistoryChart({ history }: { history: DetailData["history"] }) {
  if (!history.length) return <p className="pair-empty">Không có lịch sử demand.</p>;
  const width = 940;
  const height = 230;
  const max = Math.max(...history.map((point) => point.quantity), 1);
  const coordinates = history.map((point, index) => {
    const x = 18 + (index / Math.max(history.length - 1, 1)) * (width - 36);
    const y = height - 24 - (point.quantity / max) * (height - 46);
    return { x, y, point };
  });
  const points = coordinates.map(({ x, y }) => `${x},${y}`).join(" ");
  return (
    <div className="pair-history-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Lịch sử demand thực tế">
        {[0.25, 0.5, 0.75].map((ratio) => <line key={`history-grid-${ratio}`} x1="18" x2={width - 18} y1={height * ratio} y2={height * ratio} />)}
        <polyline points={points} fill="none" stroke="#23afff" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {coordinates.filter(({ point }) => point.net_negative).map(({ x, point }, index) => <circle key={`history-negative-${point.month}-${index}`} cx={x} cy={height - 24} r="5" fill="#ff7185"><title>{formatMonth(point.month)}: net {formatNumber(point.net_quantity)} M2</title></circle>)}
      </svg>
      <div><span>{formatMonth(history[0].month)}</span><strong>Đỉnh {formatNumber(max)} M2</strong><span>{formatMonth(history.at(-1)!.month)}</span></div>
    </div>
  );
}

function Heatmap({ data, metricName, onSelect }: {
  data: OverviewData["heatmap"];
  metricName: Metric;
  onSelect: (baseSku: string, branchCode: string, skuName: string, branchName: string) => void;
}) {
  const branches = useMemo(
    () => [...new Map(data.branches.map((branch) => [branch.branch_code, branch])).values()],
    [data.branches],
  );
  const skus = useMemo(
    () => [...new Map(data.skus.map((sku) => [sku.base_sku, sku])).values()],
    [data.skus],
  );
  const cellMap = useMemo(
    () => new Map(data.cells.map((cell) => [`${cell.base_sku}\u0000${cell.branch_code}`, cell])),
    [data.cells],
  );
  const values = data.cells.map((cell) => cell.value).filter((value): value is number => value !== null);
  const positiveMax = Math.max(...values.filter((value) => value >= 0), 1);
  const negativeMax = Math.max(...values.filter((value) => value < 0).map(Math.abs), 1);

  function cellColor(value: number | null): string {
    if (value === null) return "rgba(84,105,120,.10)";
    if (metricName === "growth") {
      const alpha = Math.min(0.88, 0.14 + Math.abs(value) / (value >= 0 ? positiveMax : negativeMax) * 0.7);
      return value >= 0 ? `rgba(33,215,155,${alpha})` : `rgba(255,113,133,${alpha})`;
    }
    const alpha = Math.min(0.9, 0.12 + Math.max(value, 0) / positiveMax * 0.76);
    return `rgba(35,175,255,${alpha})`;
  }

  if (!skus.length || !branches.length) {
    return <p className="pair-empty">Không có dữ liệu phù hợp để tạo heatmap.</p>;
  }

  return (
    <div className="pair-heatmap-scroll">
      <table className="pair-heatmap">
        <thead><tr><th>Base SKU</th>{branches.map((branch) => <th key={`heatmap-branch-${branch.branch_code}-${branch.branch_name}`} title={branch.branch_name}>{branch.branch_code}</th>)}</tr></thead>
        <tbody>
          {skus.map((sku) => (
            <tr key={`heatmap-sku-${sku.base_sku}-${sku.sku_name}`}>
              <th title={sku.sku_name}>{sku.base_sku}<small>{sku.sku_name}</small></th>
              {branches.map((branch) => {
                const cell = cellMap.get(`${sku.base_sku}\u0000${branch.branch_code}`);
                const value = cell?.value ?? null;
                return (
                  <td key={`heatmap-cell-${sku.base_sku}-${branch.branch_code}`}>
                    <button
                      type="button"
                      style={{ background: cellColor(value) }}
                      title={`${sku.base_sku} × ${branch.branch_code}: ${metricValue(value, metricName)}`}
                      onClick={() => onSelect(sku.base_sku, branch.branch_code, sku.sku_name, branch.branch_name)}
                    >
                      {metricValue(value, metricName)}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EdaBranchSku({ branchCode }: { branchCode: string }) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [region, setRegion] = useState("");
  const [branch, setBranch] = useState(branchCode === "__ALL__" ? "" : branchCode);
  const [skuDraft, setSkuDraft] = useState("");
  const [sku, setSku] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [demandPattern, setDemandPattern] = useState("");
  const [abcClass, setAbcClass] = useState("");
  const [status, setStatus] = useState("all");
  const [heatmapMetric, setHeatmapMetric] = useState<Metric>("quantity");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [detailLabel, setDetailLabel] = useState<{ skuName: string; branchName: string } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGet<unknown>("/eda/branch-sku/overview", {
      region: region || undefined,
      branch: branch || undefined,
      sku: sku || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      demand_pattern: demandPattern || undefined,
      abc_class: abcClass || undefined,
      status,
      metric: heatmapMetric,
      page,
      page_size: 50,
    })
      .then((response) => {
        if (cancelled) return;
        if (!isOverviewData(response)) {
          throw new Error("API SKU × Chi nhánh chưa được nạp. Hãy restart backend.");
        }
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
  }, [abcClass, branch, dateFrom, dateTo, demandPattern, heatmapMetric, page, region, sku, status]);

  const visibleBranches = useMemo(
    () => [...new Map(
      (data?.options.branches ?? [])
        .filter((item) => !region || item.region === region)
        .map((item) => [`${item.region}\u0000${item.branch_code}`, item]),
    ).values()],
    [data?.options.branches, region],
  );
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 50));

  function resetPageAnd(action: () => void) {
    setLoading(true);
    setPage(1);
    setDetail(null);
    action();
  }

  function submitSku(event: FormEvent) {
    event.preventDefault();
    resetPageAnd(() => setSku(skuDraft.trim()));
  }

  function openDetail(baseSku: string, branchCodeValue: string, skuName: string, branchName: string) {
    setDetailLoading(true);
    setDetail(null);
    setDetailLabel({ skuName, branchName });
    apiGet<DetailData>("/eda/branch-sku/detail", { base_sku: baseSku, branch: branchCodeValue })
      .then((response) => {
        setDetail(normalizeDetailData(response));
        setError(null);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setDetailLoading(false));
  }

  function exportRows(rows: BranchSkuRow[], name: string) {
    downloadCsv(name, rows.map((row) => ({
      base_sku: row.base_sku,
      sku_name: row.sku_name,
      branch_code: row.branch_code,
      branch_name: row.branch_name,
      quantity: row.gross_quantity,
      revenue: row.revenue,
      adi: row.adi,
      cv2: row.cv === null ? null : row.cv ** 2,
      demand_pattern: patternLabel(row.demand_pattern),
      abc_class: row.abc_class,
      mom: row.growth,
      yoy: row.yoy_growth,
      episode_id: row.episode_id,
      episode_start: row.episode_start_month,
      episode_end: row.episode_end_month,
      pattern_changed: row.pattern_changed ? "Có" : "Không",
      previous_pattern: row.previous_demand_pattern,
      status: row.status,
      warnings: row.warnings.join(" | "),
    })));
  }

  return (
    <div className="pair-page">
      <div className="pair-heading">
        <div><p className="eyebrow">SKU × CHI NHÁNH</p><h3>Demand chi tiết theo SKU và Chi nhánh</h3><p>Mỗi dòng là một chuỗi demand `base_sku + branch`, đã cộng toàn bộ Bravo SKU theo tháng.</p></div>
        <span>Dữ liệu đến {data?.data_as_of_month ? formatMonth(data.data_as_of_month) : "—"}</span>
      </div>

      <section className="pair-filters">
        <label>Region<select value={region} onChange={(event) => resetPageAnd(() => { setRegion(event.target.value); setBranch(""); })}><option value="">Tất cả vùng</option>{data?.options.regions.map((item) => <option key={`region-option-${item}`}>{item}</option>)}</select></label>
        <label>Branch<select value={branch} onChange={(event) => resetPageAnd(() => setBranch(event.target.value))}><option value="">Tất cả chi nhánh</option>{visibleBranches.map((item) => <option key={`${item.region}-${item.branch_code}`} value={item.branch_code}>{item.branch_code} — {item.branch_name}</option>)}</select></label>
        <label title="Bảng nguồn không có cột Brand">Brand<select disabled><option>Không có trong nguồn</option></select></label>
        <form onSubmit={submitSku}><label>SKU<input value={skuDraft} onChange={(event) => setSkuDraft(event.target.value)} placeholder="Mã hoặc tên SKU" /></label><button type="submit">Lọc</button></form>
        <label>Từ tháng<input type="date" value={dateFrom || data?.filters.date_from.slice(0, 10) || ""} onChange={(event) => resetPageAnd(() => setDateFrom(event.target.value))} /></label>
        <label>Đến tháng<input type="date" value={dateTo || data?.filters.date_to.slice(0, 10) || ""} onChange={(event) => resetPageAnd(() => setDateTo(event.target.value))} /></label>
        <label>Nhóm demand<select value={demandPattern} onChange={(event) => resetPageAnd(() => setDemandPattern(event.target.value))}><option value="">Tất cả nhóm</option>{data?.options.demand_patterns.map((item) => <option key={`demand-option-${item}`} value={item}>{patternLabel(item)}</option>)}</select></label>
        <label>ABC<select value={abcClass} onChange={(event) => resetPageAnd(() => setAbcClass(event.target.value))}><option value="">Tất cả nhóm</option>{data?.options.abc_classes.map((item) => <option key={`abc-option-${item}`}>{item}</option>)}</select></label>
        <label>Trạng thái<select value={status} onChange={(event) => resetPageAnd(() => setStatus(event.target.value))}><option value="all">Tất cả</option><option value="active">Hoạt động</option><option value="inactive">Vô hiệu hóa</option></select></label>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}
      {data?.pattern_source_available === false ? <div className="error-banner">{data.methodology}</div> : null}

      <section className={`pair-kpis ${loading ? "loading" : ""}`}>
        <article><span>Cặp SKU × Branch</span><strong>{formatNumber(data?.kpis.pair_count)}</strong><small>Trong phạm vi lọc</small></article>
        <article><span>Demand quantity</span><strong>{formatNumber(data?.kpis.gross_quantity)}</strong><small>M2 dương</small></article>
        <article><span>Doanh thu</span><strong>{money(data?.kpis.revenue)}</strong><small>Trong kỳ đã chọn</small></article>
        <article><span>Demand Lumpy</span><strong>{formatNumber(data?.kpis.lumpy_count)}</strong><small>Cần review thủ công</small></article>
        <article><span>Chưa đủ lịch sử</span><strong>{formatNumber(data?.kpis.insufficient_new_count)}</strong><small>SKU/episode mới</small></article>
        <article><span>Inactive quá lâu</span><strong>{formatNumber(data?.kpis.excluded_inactive_count)}</strong><small>Đã loại khỏi phân loại</small></article>
      </section>

      <article className="pair-panel">
        <header><div><p className="eyebrow">HEATMAP</p><h4>SKU × Branch</h4></div><div className="pair-toggle">{([['quantity', 'Sản lượng'], ['revenue', 'Doanh thu'], ['growth', '% tăng trưởng']] as Array<[Metric, string]>).map(([value, label]) => <button key={`heatmap-metric-${value}`} type="button" className={heatmapMetric === value ? "active" : ""} onClick={() => { setLoading(true); setPage(1); setHeatmapMetric(value); }}>{label}</button>)}</div></header>
        <Heatmap data={data?.heatmap ?? { metric: heatmapMetric, branches: [], skus: [], cells: [] }} metricName={heatmapMetric} onSelect={openDetail} />
        <p className="pair-note">Hiển thị tối đa 20 SKU và 10 chi nhánh có demand lớn nhất trong phạm vi lọc.</p>
      </article>

      <article className="pair-panel">
        <header><div><p className="eyebrow">PAIR DETAIL</p><h4>Bảng chi tiết SKU × Chi nhánh</h4></div><div className="pair-actions"><span>{formatNumber(data?.total)} kết quả</span><button type="button" onClick={() => exportRows(data?.items ?? [], "sku-branch-detail.csv")}>Xuất CSV trang này</button></div></header>
        <div className="pair-table-scroll">
          <table className="pair-table">
            <thead><tr><th>SKU</th><th>Branch</th><th>Doanh thu</th><th>Quantity</th><th>Xu hướng 12T</th><th>Episode</th><th>ADI</th><th>CV</th><th>Demand</th><th>ABC</th><th>MoM</th><th>YoY</th><th>Pattern change</th><th>Trạng thái</th><th>Cảnh báo</th></tr></thead>
            <tbody>
              {data?.items.map((row) => (
                <tr key={`pair-${row.base_sku}-${row.branch_code}-${row.episode_id ?? "latest"}`} onClick={() => openDetail(row.base_sku, row.branch_code, row.sku_name, row.branch_name)}>
                  <td><strong>{row.base_sku}</strong><small>{row.sku_name}</small></td>
                  <td><strong>{row.branch_code}</strong><small>{row.branch_name}</small></td>
                  <td className="number">{money(row.revenue)}</td><td className="number">{formatNumber(row.gross_quantity)}</td>
                  <td><Sparkline points={row.trend} /></td><td>{row.episode_id ? `E${row.episode_id}` : "—"}<small>{row.episode_start_month && row.episode_end_month ? `${formatMonth(row.episode_start_month)} → ${formatMonth(row.episode_end_month)}` : ""}</small></td><td className="number">{metric(row.adi)}</td><td className="number">{metric(row.cv)}</td>
                  <td><span className={`pattern ${row.demand_pattern.toLowerCase()}`}>{patternLabel(row.demand_pattern)}</span></td><td><span className={`abc abc-${row.abc_class.toLowerCase()}`}>{row.abc_class}</span></td>
                  <td className={growthClass(row.growth)}>{formatPercent(row.growth)}</td><td className={growthClass(row.yoy_growth)}>{formatPercent(row.yoy_growth)}</td><td>{row.pattern_changed ? <span className="pattern-change">Changed<small>{row.previous_demand_pattern} → {patternLabel(row.demand_pattern)}</small></span> : "—"}</td><td><span className={`pair-status ${statusClass(row.status)}`}>{row.status}</span></td>
                  <td>{row.warnings.length ? row.warnings.map((warning, index) => <small className="warning" key={`pair-warning-${row.base_sku}-${row.branch_code}-${warning}-${index}`}>{warning}</small>) : <span className="muted">—</span>}</td>
                </tr>
              ))}
              {!loading && !data?.items.length ? <tr><td colSpan={15} className="pair-empty">Không có dữ liệu phù hợp.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <footer className="pair-pagination"><button type="button" disabled={page <= 1 || loading} onClick={() => { setLoading(true); setPage((current) => Math.max(1, current - 1)); }}>← Trước</button><span>Trang {page}/{totalPages}</span><button type="button" disabled={page >= totalPages || loading} onClick={() => { setLoading(true); setPage((current) => current + 1); }}>Sau →</button></footer>
      </article>

      {detailLoading ? <article className="pair-panel"><p className="pair-empty">Đang tải chi tiết chuỗi…</p></article> : null}
      {detail ? (
        <article className="pair-panel pair-drill">
          <header><div><p className="eyebrow">DRILL-IN</p><h4>{detail.base_sku} × {detail.branch_code}</h4><span>{detailLabel?.skuName} — {detailLabel?.branchName}</span></div><button type="button" onClick={() => setDetail(null)}>Đóng ×</button></header>
          <div className="episode-grid">{detail.episodes.map((episode) => <div key={`episode-${detail.base_sku}-${detail.branch_code}-${episode.episode_id}`} className={episode.is_current ? "current" : ""}><div><strong>Episode {episode.episode_id}</strong>{episode.used_for_current_pattern ? <span>Đang dùng</span> : null}</div><p>{formatMonth(episode.start_month)} → {formatMonth(episode.end_month)}</p><small>{episode.history_months} tháng · {episode.positive_months} tháng dương</small><dl><div><dt>ADI</dt><dd>{metric(episode.adi)}</dd></div><div><dt>CV²</dt><dd>{metric(episode.cv2)}</dd></div><div><dt>Pattern</dt><dd>{patternLabel(episode.demand_pattern)}</dd></div></dl></div>)}</div>
          {detail.pattern_changed ? <p className="pattern-change-note">Pattern changed: {detail.previous_demand_pattern} → {patternLabel(detail.episodes.at(-1)?.demand_pattern ?? "")}. So sánh này dựa trên episode trước, chưa phải snapshot lần chạy.</p> : null}
          {detail.warnings.length ? <div className="detail-warnings">{detail.warnings.map((warning, index) => <span key={`detail-warning-${detail.base_sku}-${detail.branch_code}-${warning}-${index}`}>{warning}</span>)}</div> : null}
          <section className="pair-drill-grid">
            <div><h5>Lịch sử demand quantity</h5><HistoryChart history={detail.history} /><p className="chart-legend"><i /> Chấm đỏ: net quantity âm (return lớn hơn bán); đường xanh ở 0: không bán hoặc net bằng 0.</p></div>
            <div><h5>Lịch sử thay đổi trạng thái</h5><div className="status-timeline">{detail.status_history.map((item, index) => <div key={`status-${detail.base_sku}-${detail.branch_code}-${item.month}-${item.status}-${index}`}><i className={statusClass(item.status)} /><span>{formatMonth(item.month)}</span><strong>{item.status}</strong></div>)}</div></div>
          </section>
          <h5>Bravo SKU thuộc cặp này</h5>
          <div className="pair-table-scroll"><table className="pair-table variants"><thead><tr><th>Bravo SKU</th><th>Tên SKU</th><th>Quantity</th><th>Quan sát đầu</th><th>Quan sát cuối</th><th>Bán gần nhất</th><th>Trạng thái</th></tr></thead><tbody>{detail.variants.map((variant) => <tr key={`variant-${detail.base_sku}-${detail.branch_code}-${variant.bravo_sku}`}><td><strong>{variant.bravo_sku}</strong></td><td>{variant.sku_name}</td><td className="number">{formatNumber(variant.gross_quantity)}</td><td>{formatMonth(variant.first_observed_month)}</td><td>{formatMonth(variant.last_observed_month)}</td><td>{variant.last_positive_sale_month ? formatMonth(variant.last_positive_sale_month) : "—"}</td><td><span className={`pair-status ${statusClass(variant.status)}`}>{variant.status}</span></td></tr>)}</tbody></table></div>
        </article>
      ) : null}

      <article className="pair-panel">
        <header><div><p className="eyebrow">EXCEPTIONS</p><h4>Các cặp cần review</h4></div><div className="pair-actions"><span>Lumpy, thiếu lịch sử, inactive hoặc net âm</span><button type="button" onClick={() => exportRows(data?.exceptions ?? [], "sku-branch-exceptions.csv")}>Xuất CSV</button></div></header>
        <div className="pair-table-scroll"><table className="pair-table exceptions"><thead><tr><th>SKU</th><th>Branch</th><th>Demand</th><th>ABC</th><th>Quantity</th><th>ADI</th><th>CV</th><th>Cảnh báo</th></tr></thead><tbody>{data?.exceptions.map((row) => <tr key={`exception-${row.base_sku}-${row.branch_code}-${row.episode_id ?? "latest"}`} onClick={() => openDetail(row.base_sku, row.branch_code, row.sku_name, row.branch_name)}><td><strong>{row.base_sku}</strong><small>{row.sku_name}</small></td><td>{row.branch_code}<small>{row.branch_name}</small></td><td><span className={`pattern ${row.demand_pattern.toLowerCase()}`}>{patternLabel(row.demand_pattern)}</span></td><td><span className={`abc abc-${row.abc_class.toLowerCase()}`}>{row.abc_class}</span></td><td className="number">{formatNumber(row.gross_quantity)}</td><td>{metric(row.adi)}</td><td>{metric(row.cv)}</td><td>{row.warnings.map((warning, index) => <small className="warning" key={`exception-warning-${row.base_sku}-${row.branch_code}-${warning}-${index}`}>{warning}</small>)}</td></tr>)}</tbody></table></div>
      </article>

      <article className="pair-panel warning-guide"><header><div><p className="eyebrow">WARNING GUIDE</p><h4>Định nghĩa cảnh báo</h4></div></header><div>{Object.entries(data?.warning_definitions ?? {}).map(([name, definition]) => <p key={`warning-definition-${name}`}><strong>{name}</strong><span>{definition}</span></p>)}</div></article>

      <ExternalFeatureInsights level="branch-sku" />
      <p className="pair-method">Pattern hiện dùng ADI {data?.thresholds.adi ?? "—"} và CV² {data?.thresholds.cv2 ?? "—"}, cập nhật ngày {data?.thresholds.updated_at ? new Date(data.thresholds.updated_at).toLocaleDateString("vi-VN") : "—"}. Episode mới được tách sau gap ít nhất {data?.thresholds.relaunch_gap_months ?? "—"} tháng. ABC được tính theo tỷ trọng quantity dương trong từng chi nhánh. CSV xuất theo trang dữ liệu đang hiển thị và mở trực tiếp bằng Excel.</p>
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .pair-page{display:flex;flex-direction:column;gap:14px;min-width:0}.pair-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:16px}.pair-heading h3{margin:4px 0;font-size:22px}.pair-heading p:last-child,.pair-heading>span,.pair-note,.pair-method{color:var(--muted);font-size:11px}.pair-filters{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:9px;padding:13px;background:#081725;border:1px solid var(--line);border-radius:10px}.pair-filters label{display:grid;gap:5px;color:var(--muted);font-size:9px;font-weight:800}.pair-filters select,.pair-filters input{width:100%;min-width:0;padding:9px;background:#0d1d2c;color:var(--text);border:1px solid var(--line);border-radius:7px}.pair-filters select:disabled{opacity:.55}.pair-filters form{display:grid;grid-template-columns:1fr auto;gap:5px;align-items:end}.pair-filters form button,.pair-pagination button,.pair-drill header button,.pair-actions button{padding:9px 12px;border:1px solid var(--line);border-radius:7px;background:#102536;color:var(--text)}.pair-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;transition:opacity .2s}.pair-kpis.loading{opacity:.5}.pair-kpis article{padding:13px;background:linear-gradient(145deg,#0d2030,#091722);border:1px solid var(--line);border-radius:9px;min-width:0}.pair-kpis span{display:block;color:var(--muted);font-size:9px}.pair-kpis strong{display:block;margin-top:6px;font-size:18px;overflow:hidden;text-overflow:ellipsis}.pair-kpis small{color:#78a2b9;font-size:9px}.pair-panel{padding:14px;background:#081725;border:1px solid var(--line);border-radius:10px;overflow:hidden}.pair-panel>header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:11px}.pair-panel h4{margin:4px 0;font-size:14px}.pair-panel header>span,.pair-panel header div>span{color:var(--muted);font-size:10px}.pair-actions{display:flex;align-items:center;gap:8px}.pair-actions span{color:var(--muted);font-size:10px}.pair-toggle{display:flex;gap:5px}.pair-toggle button{padding:7px 10px;border:1px solid var(--line);border-radius:6px;background:#102536;color:#91a9b9;font-size:10px}.pair-toggle button.active{border-color:#168b72;background:#0c4035;color:#52e5ba}.pair-heatmap-scroll,.pair-table-scroll{overflow:auto}.pair-heatmap{border-spacing:4px;min-width:100%;border-collapse:separate}.pair-heatmap th{padding:5px;color:#9fb5c5;font-size:9px;white-space:nowrap}.pair-heatmap thead th{text-align:center}.pair-heatmap thead th:first-child,.pair-heatmap tbody th{text-align:left;position:sticky;left:0;background:#081725;z-index:2}.pair-heatmap tbody th{max-width:170px;color:var(--cyan)}.pair-heatmap th small{display:block;max-width:160px;overflow:hidden;text-overflow:ellipsis;color:var(--muted);font-weight:400}.pair-heatmap td{padding:0;min-width:92px}.pair-heatmap td button{width:100%;min-height:38px;padding:6px;border:1px solid rgba(100,150,180,.15);border-radius:5px;color:#e9f5fb;font-size:9px;font-variant-numeric:tabular-nums}.pair-table{width:100%;min-width:1850px;border-collapse:collapse}.pair-table th,.pair-table td{padding:10px 9px;border-bottom:1px solid var(--line);font-size:10px;white-space:nowrap;text-align:left}.pair-table th{color:#91a9b9;font-size:8px;text-transform:uppercase}.pair-table tbody tr{cursor:pointer}.pair-table tbody tr:hover{background:#10293b}.pair-table td strong{color:var(--cyan)}.pair-table td small{display:block;max-width:210px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;color:var(--muted)}.pair-table .number{text-align:right;font-weight:800;font-variant-numeric:tabular-nums}.pair-sparkline{display:block;width:130px;height:36px;color:#23afff}.pattern,.abc,.pair-status,.pattern-change{display:inline-flex;padding:4px 7px;border-radius:5px;font-size:9px;font-weight:800;background:#163148;color:#a9d8f1}.pattern.smooth{background:#0c4035;color:#52e5ba}.pattern.erratic{background:#4a3410;color:#ffd36d}.pattern.intermittent{background:#2d2854;color:#b8abff}.pattern.lumpy,.pattern.insufficient-new,.pattern.excluded-inactive{background:#431721;color:#ff8798}.pattern-change{display:block;background:#4a3410;color:#ffd36d}.abc-a{background:#0c4035;color:#52e5ba}.abc-b{background:#4a3410;color:#ffd36d}.abc-c{background:#431721;color:#ff8798}.pair-status.active{background:#0c4035;color:#52e5ba}.pair-status.inactive{background:#431721;color:#ff8798}.warning{color:#ff9aa8!important}.positive{color:var(--green)!important}.negative{color:var(--red)!important}.neutral{color:var(--muted)!important}.pair-pagination{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding-top:11px;color:var(--muted);font-size:10px}.pair-pagination button:disabled{opacity:.4}.pair-empty{padding:28px!important;text-align:center!important;color:var(--muted)}.episode-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px;margin-bottom:12px}.episode-grid>div{padding:10px;border:1px solid var(--line);border-radius:8px;background:#0b1b29}.episode-grid>div.current{border-color:#168b72}.episode-grid>div>div{display:flex;justify-content:space-between}.episode-grid span{color:var(--green);font-size:9px}.episode-grid p,.episode-grid small{margin:5px 0;color:var(--muted);font-size:9px}.episode-grid dl{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin:7px 0 0}.episode-grid dl div{padding:5px;background:#102536;border-radius:5px}.episode-grid dt{color:var(--muted);font-size:8px}.episode-grid dd{margin:2px 0 0;font-size:10px}.pattern-change-note{padding:9px;border-left:3px solid #ffc14d;background:#30250f;color:#ffd36d;font-size:10px}.detail-warnings{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}.detail-warnings span{padding:5px 7px;border-radius:5px;background:#431721;color:#ff9aa8;font-size:9px}.pair-drill-grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(240px,1fr);gap:12px;margin-bottom:16px}.pair-drill-grid>div{padding:12px;border:1px solid var(--line);border-radius:8px}.pair-drill h5{margin:0 0 10px}.pair-history-chart svg{width:100%;height:auto}.pair-history-chart line{stroke:#1d3547;stroke-width:1}.pair-history-chart>div{display:flex;justify-content:space-between;color:var(--muted);font-size:9px}.pair-history-chart strong{color:var(--text)}.chart-legend{color:var(--muted);font-size:9px}.chart-legend i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#ff7185}.status-timeline{display:grid;gap:8px}.status-timeline>div{display:grid;grid-template-columns:10px 70px 1fr;align-items:center;gap:7px;font-size:10px}.status-timeline i{width:8px;height:8px;border-radius:50%}.status-timeline i.active{background:var(--green)}.status-timeline i.inactive{background:var(--red)}.status-timeline span{color:var(--muted)}.variants{min-width:1100px}.exceptions{min-width:1050px}.warning-guide>div{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.warning-guide p{display:grid;gap:3px;margin:0;padding:8px;background:#0b1b29;border-radius:6px}.warning-guide strong{font-size:9px;color:#ff9aa8}.warning-guide span{font-size:9px;color:var(--muted)}.pair-method{margin:0;line-height:1.6}@media(max-width:1200px){.pair-filters{grid-template-columns:repeat(3,1fr)}.pair-kpis{grid-template-columns:repeat(3,1fr)}}@media(max-width:800px){.pair-heading{align-items:flex-start;flex-direction:column}.pair-filters{grid-template-columns:1fr 1fr}.pair-kpis{grid-template-columns:1fr 1fr}.pair-panel>header{flex-direction:column}.pair-drill-grid,.warning-guide>div{grid-template-columns:1fr}}@media(max-width:520px){.pair-filters,.pair-kpis{grid-template-columns:1fr}}
`;
