"use client";

import { useEffect, useMemo, useState } from "react";

import { apiGet } from "@/lib/api";
import { formatMonth, formatNumber, formatPercent } from "@/lib/format";


type RegionKpis = {
  gross_quantity: number;
  mom_growth: number | null;
  yoy_growth: number | null;
  branch_count: number;
  active_sku_count: number;
  inactive_rate: number | null;
};

type MonthlyPoint = { region: string; month: string; gross_quantity: number };
type RegionRow = {
  region: string;
  gross_quantity: number;
  growth: number | null;
  contribution_pct: number | null;
  branch_count: number;
  active_sku_count: number;
  avg_adi: number | null;
  avg_cv: number | null;
  avg_cv2: number | null;
  dominant_demand: string;
  pattern_counts: Record<string, number>;
  pattern_shares: Record<string, number>;
  abc_counts: Record<string, number>;
  abc_shares: Record<string, number>;
  sku_branch_count: number;
  inactive_sku_branch_count: number;
  inactive_rate: number | null;
};
type Seasonality = {
  region: string;
  points: Array<{ month: string; actual: number; trend: number; seasonal: number }>;
  monthly_index: Array<{ month_number: number; value: number | null }>;
};
type BranchRow = {
  region: string;
  branch_code: string;
  branch_name: string;
  gross_quantity: number;
  active_sku_count: number;
};
type RegionSkuRow = {
  region: string;
  base_sku: string;
  sku_name: string;
  gross_quantity: number;
  selling_branch_count: number;
  history_months: number;
  positive_months: number;
  adi: number | null;
  cv: number | null;
  demand_pattern: string;
  abc_class: string;
};
type RegionData = {
  available_regions: string[];
  filters: { regions: string[]; date_from: string; date_to: string };
  kpis: RegionKpis;
  monthly: MonthlyPoint[];
  regions: RegionRow[];
  seasonality: Seasonality[];
  branches: BranchRow[];
  region_skus: RegionSkuRow[];
  data_as_of_month: string;
  methodology: string;
};

function isRegionData(value: unknown): value is RegionData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RegionData>;
  return Boolean(
    candidate.filters
      && Array.isArray(candidate.filters.regions)
      && candidate.kpis
      && Array.isArray(candidate.available_regions)
      && Array.isArray(candidate.monthly)
      && Array.isArray(candidate.regions)
      && Array.isArray(candidate.seasonality)
      && Array.isArray(candidate.branches)
      && Array.isArray(candidate.region_skus),
  );
}

const COLORS = ["#21d79b", "#23afff", "#ffc14d", "#b08cff", "#ff7185", "#58d6e8"];

function metric(value: number | null | undefined, digits = 2): string {
  return value === null || value === undefined ? "—" : formatNumber(value, digits);
}

function growthClass(value: number | null): string {
  if (value === null) return "neutral";
  return value >= 0 ? "positive" : "negative";
}

function downloadRegionCsv(rows: RegionRow[]) {
  if (!rows.length) return;
  const records = rows.map((row) => ({
    region: row.region,
    demand_m2: row.gross_quantity,
    growth: row.growth,
    contribution: row.contribution_pct,
    branches: row.branch_count,
    active_skus: row.active_sku_count,
    inactive_rate: row.inactive_rate,
    avg_adi: row.avg_adi,
    avg_cv2: row.avg_cv2,
    smooth_pct: row.pattern_shares.Smooth,
    erratic_pct: row.pattern_shares.Erratic,
    intermittent_pct: row.pattern_shares.Intermittent,
    lumpy_pct: row.pattern_shares.Lumpy,
    abc_a_pct: row.abc_shares.A,
    abc_b_pct: row.abc_shares.B,
    abc_c_pct: row.abc_shares.C,
  }));
  const headers = Object.keys(records[0]);
  const encode = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = `\uFEFF${headers.map(encode).join(",")}\r\n${records.map((row) => headers.map((key) => encode(row[key as keyof typeof row])).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "region-detail.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function MultiRegionChart({ rows, regions }: { rows: MonthlyPoint[]; regions: string[] }) {
  const width = 980;
  const height = 290;
  const padding = { left: 20, right: 16, top: 18, bottom: 28 };
  const months = [...new Set(rows.map((row) => row.month))].sort();
  const max = Math.max(...rows.map((row) => row.gross_quantity), 1);
  const x = (month: string) => padding.left + (months.indexOf(month) / Math.max(months.length - 1, 1)) * (width - padding.left - padding.right);
  const y = (value: number) => height - padding.bottom - (value / max) * (height - padding.top - padding.bottom);

  return (
    <div className="chart-shell">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Xu hướng demand theo vùng">
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line key={ratio} x1={padding.left} x2={width - padding.right} y1={height * ratio} y2={height * ratio} className="region-grid-line" />
        ))}
        {regions.map((region, index) => {
          const points = rows.filter((row) => row.region === region).sort((a, b) => a.month.localeCompare(b.month));
          const path = points.map((point) => `${x(point.month)},${y(point.gross_quantity)}`).join(" ");
          return <polyline key={region} points={path} fill="none" stroke={COLORS[index % COLORS.length]} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />;
        })}
      </svg>
      <div className="chart-axis"><span>{months[0] ? formatMonth(months[0]) : "—"}</span><strong>{formatNumber(max)} M2</strong><span>{months.at(-1) ? formatMonth(months.at(-1)!) : "—"}</span></div>
      <div className="legend">
        {regions.map((region, index) => <span key={region}><i style={{ background: COLORS[index % COLORS.length] }} />{region}</span>)}
      </div>
    </div>
  );
}

function ContributionChart({ rows, onSelect }: { rows: RegionRow[]; onSelect: (region: string) => void }) {
  return (
    <div className="contribution-list">
      {rows.slice().sort((a, b) => b.gross_quantity - a.gross_quantity).map((row, index) => (
        <button key={row.region} className="contribution-row" type="button" onClick={() => onSelect(row.region)}>
          <span><i style={{ background: COLORS[index % COLORS.length] }} />{row.region}</span>
          <div className="contribution-track"><b style={{ width: `${(row.contribution_pct ?? 0) * 100}%`, background: COLORS[index % COLORS.length] }} /></div>
          <strong>{formatPercent(row.contribution_pct)}</strong>
        </button>
      ))}
    </div>
  );
}

const PATTERN_COLORS: Record<string, string> = { Smooth: "#21d79b", Erratic: "#ffc14d", Intermittent: "#b08cff", Lumpy: "#ff7185" };
const ABC_COLORS: Record<string, string> = { A: "#21d79b", B: "#ffc14d", C: "#ff7185" };

function BreakdownChart({ rows, kind }: { rows: RegionRow[]; kind: "pattern" | "abc" }) {
  const keys = kind === "pattern" ? ["Smooth", "Erratic", "Intermittent", "Lumpy"] : ["A", "B", "C"];
  const colors = kind === "pattern" ? PATTERN_COLORS : ABC_COLORS;
  return (
    <div className="breakdown-list">
      {rows.map((row) => {
        const shares = kind === "pattern" ? row.pattern_shares : row.abc_shares;
        return <div key={row.region}><strong>{row.region}</strong><div className="stacked-bar">{keys.map((key) => <i key={key} title={`${key}: ${formatPercent(shares[key] ?? 0)}`} style={{ width: `${(shares[key] ?? 0) * 100}%`, background: colors[key] }} />)}</div><small>{keys.map((key) => `${key} ${formatPercent(shares[key] ?? 0)}`).join(" · ")}</small></div>;
      })}
      <div className="legend">{keys.map((key) => <span key={key}><i style={{ background: colors[key] }} />{key}</span>)}</div>
    </div>
  );
}

function GrowthRanking({ rows }: { rows: RegionRow[] }) {
  const ranked = rows.filter((row) => row.growth !== null).slice().sort((a, b) => (b.growth ?? 0) - (a.growth ?? 0));
  return <div className="growth-ranking">{ranked.map((row, index) => <div key={row.region}><span>#{index + 1} {row.region}</span><strong className={growthClass(row.growth)}>{formatPercent(row.growth)}</strong></div>)}</div>;
}

function SeasonalityChart({ items }: { items: Seasonality[] }) {
  if (!items.length) return <p className="region-empty">Không đủ dữ liệu seasonality.</p>;
  const width = 940;
  const height = 230;
  const values = items.flatMap((item) => item.monthly_index.map((point) => point.value ?? 0));
  const max = Math.max(...values, 1.2);
  const y = (value: number) => height - 28 - value / max * (height - 48);

  return (
    <div className="chart-shell">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="So sánh seasonality giữa các vùng">
        {[0.33, 0.66].map((ratio) => <line key={ratio} x1="16" x2={width - 16} y1={height * ratio} y2={height * ratio} className="region-grid-line" />)}
        <line x1="16" x2={width - 16} y1={y(1)} y2={y(1)} stroke="#7890a0" strokeDasharray="6 5" />
        {items.map((item, regionIndex) => {
          const points = item.monthly_index.map((point, index) => {
            const x = 16 + index / 11 * (width - 32);
            return `${x},${y(point.value ?? 0)}`;
          }).join(" ");
          return <polyline key={item.region} points={points} fill="none" stroke={COLORS[regionIndex % COLORS.length]} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />;
        })}
      </svg>
      <div className="chart-axis"><span>T1</span><strong>Đường chuẩn mùa vụ = 1.00</strong><span>T12</span></div>
      <div className="legend">{items.map((item, index) => <span key={item.region}><i style={{ background: COLORS[index % COLORS.length] }} />{item.region}</span>)}</div>
    </div>
  );
}

type EdaRegionProps = {
  initialDrillRegion?: string | null;
  onRegionDrillDown?: (region: string) => void;
  onDrillBack?: () => void;
};

export function EdaRegion({ initialDrillRegion = null, onRegionDrillDown, onDrillBack }: EdaRegionProps = {}) {
  const [data, setData] = useState<RegionData | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(initialDrillRegion ? [initialDrillRegion] : []);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [drillRegion, setDrillRegion] = useState<string | null>(initialDrillRegion);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<unknown>("/eda/region/overview", {
      regions: selectedRegions.length ? selectedRegions.join(",") : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    })
      .then((response) => {
        if (cancelled) return;
        if (!isRegionData(response)) {
          throw new Error("API Vùng đang chạy phiên bản cũ. Hãy restart backend để nạp endpoint /eda/region/overview mới.");
        }
        setData(response);
        setError(null);
        setLoading(false);
      })
      .catch((reason: Error) => {
        if (!cancelled) {
          setError(reason.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [dateFrom, dateTo, selectedRegions]);

  const activeRegions = data?.filters.regions ?? [];
  const drillBranches = useMemo(
    () => [...new Map(
      (data?.branches ?? [])
        .filter((branch) => branch.region === drillRegion)
        .map((branch) => [`${branch.region}\u0000${branch.branch_code}`, branch]),
    ).values()],
    [data?.branches, drillRegion],
  );
  const drillSkus = useMemo(
    () => data?.region_skus.filter((item) => item.region === drillRegion) ?? [],
    [data?.region_skus, drillRegion],
  );

  function toggleRegion(region: string) {
    setLoading(true);
    setDrillRegion(null);
    setSelectedRegions((current) => {
      if (!current.length) return [region];
      if (current.includes(region)) {
        const next = current.filter((item) => item !== region);
        return next.length ? next : [];
      }
      return [...current, region];
    });
  }

  function openRegionDrillDown(region: string) {
    if (onRegionDrillDown) {
      onRegionDrillDown(region);
      return;
    }
    setDrillRegion(region);
  }

  if (drillRegion) {
    return (
      <div className="region-page">
        <div className="region-heading">
          <div><p className="eyebrow">VÙNG / DRILL-DOWN</p><h3>Chi nhánh và SKU Lumpy thuộc {drillRegion}</h3><p>Drill-down đã giữ nguyên khoảng thời gian đang chọn.</p></div>
          <button className="region-button" type="button" onClick={() => { if (onDrillBack) onDrillBack(); else setDrillRegion(null); }}>← Quay lại Vùng</button>
        </div>
        <article className="region-panel">
          <div className="region-table-wrap">
            <table className="region-table">
              <thead><tr><th>Mã chi nhánh</th><th>Tên chi nhánh</th><th>Demand (M2)</th><th>SKU active</th></tr></thead>
              <tbody>{drillBranches.map((branch) => <tr key={`region-branch-${branch.region}-${branch.branch_code}-${branch.branch_name}`}><td><strong>{branch.branch_code}</strong></td><td>{branch.branch_name}</td><td>{formatNumber(branch.gross_quantity)}</td><td>{formatNumber(branch.active_sku_count)}</td></tr>)}</tbody>
            </table>
          </div>
        </article>
        <article className="region-panel">
          <header><div><p className="eyebrow">LUMPY SKU</p><h4>SKU làm tăng tỷ trọng Lumpy</h4></div><span>Top 50 theo demand</span></header>
          <div className="region-table-wrap"><table className="region-table sku-drill"><thead><tr><th>Base SKU</th><th>Tên SKU</th><th>Demand</th><th>ABC</th><th>ADI</th><th>CV²</th><th>Độ phủ</th><th>Lịch sử</th></tr></thead><tbody>{drillSkus.map((sku) => <tr key={sku.base_sku}><td><strong>{sku.base_sku}</strong></td><td>{sku.sku_name}</td><td>{formatNumber(sku.gross_quantity)}</td><td>{sku.abc_class}</td><td>{metric(sku.adi)}</td><td>{sku.cv === null ? "—" : metric(sku.cv ** 2)}</td><td>{sku.selling_branch_count} CN</td><td>{sku.history_months}T / {sku.positive_months}T dương</td></tr>)}</tbody></table>{!drillSkus.length ? <p className="region-empty">Không có SKU Lumpy trong phạm vi chọn.</p> : null}</div>
        </article>
        <style jsx>{regionStyles}</style>
      </div>
    );
  }

  return (
    <div className="region-page">
      <div className="region-heading">
        <div><p className="eyebrow">REGION DEMAND</p><h3>Phân tích Demand theo Vùng</h3><p>Sản lượng, tăng trưởng và đặc trưng nhu cầu theo vùng.</p></div>
        <span className="as-of">Dữ liệu đến {data?.data_as_of_month ? formatMonth(data.data_as_of_month) : "—"}</span>
      </div>
      <p className="as-of">{data?.methodology}</p>

      <section className="region-filter">
        <div className="region-filter-block"><label>Vùng (chọn nhiều)</label><div className="region-chips"><button className={!selectedRegions.length ? "active" : ""} type="button" onClick={() => { setLoading(true); setSelectedRegions([]); }}>Tất cả</button>{data?.available_regions.map((region) => <button key={region} className={!selectedRegions.length || selectedRegions.includes(region) ? "active" : ""} type="button" onClick={() => toggleRegion(region)}>{region}</button>)}</div></div>
        <label>Từ ngày<input type="date" value={dateFrom || data?.filters.date_from.slice(0, 10) || ""} onChange={(event) => { setLoading(true); setDateFrom(event.target.value); }} /></label>
        <label>Đến ngày<input type="date" value={dateTo || data?.filters.date_to.slice(0, 10) || ""} onChange={(event) => { setLoading(true); setDateTo(event.target.value); }} /></label>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}
      {loading && !data ? <p className="region-empty">Đang tổng hợp dữ liệu theo vùng…</p> : null}

      <section className={`region-kpis ${loading ? "loading" : ""}`}>
        <article><span>Tổng demand</span><strong>{formatNumber(data?.kpis.gross_quantity)}</strong><small>M2 gross dương</small></article>
        <article><span>Tăng trưởng MoM</span><strong className={growthClass(data?.kpis.mom_growth ?? null)}>{formatPercent(data?.kpis.mom_growth)}</strong><small>So với tháng liền trước</small></article>
        <article><span>Tăng trưởng YoY</span><strong className={growthClass(data?.kpis.yoy_growth ?? null)}>{formatPercent(data?.kpis.yoy_growth)}</strong><small>So cùng kỳ năm trước</small></article>
        <article><span>Chi nhánh trong vùng</span><strong>{formatNumber(data?.kpis.branch_count)}</strong><small>Chi nhánh hoạt động</small></article>
        <article><span>SKU active</span><strong>{formatNumber(data?.kpis.active_sku_count)}</strong><small>SKU gốc còn hoạt động</small></article>
        <article><span>Inactive rate</span><strong>{formatPercent(data?.kpis.inactive_rate)}</strong><small>SKU × chi nhánh inactive</small></article>
      </section>

      <section className="region-grid">
        <article className="region-panel wide"><header><div><p className="eyebrow">DEMAND TREND</p><h4>Xu hướng sản lượng giữa các vùng</h4></div><span>{data ? `${formatMonth(data.filters.date_from)} → ${formatMonth(data.filters.date_to)}` : "—"}</span></header><MultiRegionChart rows={data?.monthly ?? []} regions={activeRegions} /></article>
        <article className="region-panel wide"><header><div><p className="eyebrow">CONTRIBUTION</p><h4>Tỷ trọng demand toàn hệ thống</h4></div></header><ContributionChart rows={data?.regions ?? []} onSelect={openRegionDrillDown} /></article>
        <article className="region-panel"><header><div><p className="eyebrow">PATTERN MIX</p><h4>4 nhóm Demand Pattern theo vùng</h4></div></header><BreakdownChart rows={data?.regions ?? []} kind="pattern" /></article>
        <article className="region-panel"><header><div><p className="eyebrow">ABC MIX</p><h4>Phân bổ ABC theo vùng</h4></div></header><BreakdownChart rows={data?.regions ?? []} kind="abc" /></article>
        <article className="region-panel wide"><header><div><p className="eyebrow">SEASONALITY OVERLAY</p><h4>So sánh chu kỳ mùa vụ giữa các vùng</h4></div><span>Các vùng đang chọn được overlay cùng lúc</span></header><SeasonalityChart items={data?.seasonality ?? []} /></article>
        <article className="region-panel wide"><header><div><p className="eyebrow">GROWTH RANKING</p><h4>Xếp hạng tăng trưởng MoM giữa các vùng</h4></div></header><GrowthRanking rows={data?.regions ?? []} /></article>
      </section>

      <article className="region-panel detail-table-panel">
        <header><div><p className="eyebrow">REGION DETAIL</p><h4>Bảng chi tiết theo vùng</h4></div><div className="region-actions"><span>Nhấn vùng để xem chi nhánh và SKU Lumpy</span><button type="button" onClick={() => downloadRegionCsv(data?.regions ?? [])}>Xuất CSV</button></div></header>
        <div className="region-table-wrap"><table className="region-table"><thead><tr><th>Vùng</th><th>Demand (M2)</th><th>% tăng trưởng</th><th>% đóng góp</th><th>Inactive rate</th><th>Số chi nhánh</th><th>SKU active</th><th>ADI TB</th><th>CV² TB</th><th>Demand chủ đạo</th><th>Pattern mix</th><th>ABC mix</th></tr></thead><tbody>{data?.regions.map((row) => <tr key={row.region} onClick={() => openRegionDrillDown(row.region)}><td><button type="button">{row.region} →</button></td><td>{formatNumber(row.gross_quantity)}</td><td className={growthClass(row.growth)}>{formatPercent(row.growth)}</td><td>{formatPercent(row.contribution_pct)}</td><td>{formatPercent(row.inactive_rate)}</td><td>{formatNumber(row.branch_count)}</td><td>{formatNumber(row.active_sku_count)}</td><td>{metric(row.avg_adi)}</td><td>{metric(row.avg_cv2)}</td><td><span className={`demand ${row.dominant_demand.toLowerCase()}`}>{row.dominant_demand}</span></td><td><small>S {formatPercent(row.pattern_shares.Smooth)} · E {formatPercent(row.pattern_shares.Erratic)} · I {formatPercent(row.pattern_shares.Intermittent)} · L {formatPercent(row.pattern_shares.Lumpy)}</small></td><td><small>A {formatPercent(row.abc_shares.A)} · B {formatPercent(row.abc_shares.B)} · C {formatPercent(row.abc_shares.C)}</small></td></tr>)}</tbody></table></div>
      </article>

      <style jsx>{regionStyles}</style>
    </div>
  );
}

const regionStyles = `
  .region-page{display:flex;flex-direction:column;gap:16px;min-width:0}.region-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:18px}.region-heading h3{font-size:22px;margin:5px 0}.region-heading p:last-child{margin:0;color:var(--muted);font-size:12px}.as-of{color:var(--muted);font-size:11px}.region-filter{display:grid;grid-template-columns:minmax(360px,1fr) 170px 170px;gap:12px;align-items:end;background:#081725;border:1px solid var(--line);border-radius:10px;padding:13px}.region-filter label,.region-filter-block>label{display:grid;gap:6px;color:var(--muted);font-size:10px;font-weight:700}.region-filter input,.region-panel select{width:100%;background:#0d1d2c;color:var(--text);border:1px solid var(--line);border-radius:7px;padding:9px}.region-chips{display:flex;flex-wrap:wrap;gap:6px}.region-chips button,.region-button,.region-actions button{border:1px solid var(--line);border-radius:7px;background:#102536;color:#9db4c4;padding:7px 10px;font-size:11px}.region-chips button{border-radius:999px}.region-chips button.active{border-color:#168b72;background:#0c4035;color:#52e5ba}.region-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;transition:opacity .2s}.region-kpis.loading{opacity:.55}.region-kpis article{padding:14px;background:linear-gradient(145deg,#0d2030,#091722);border:1px solid var(--line);border-radius:9px}.region-kpis span{display:block;color:var(--muted);font-size:10px}.region-kpis strong{display:block;margin-top:7px;font-size:20px}.region-kpis small{display:block;margin-top:5px;color:#86a3b7;font-size:9px}.positive{color:var(--green)!important}.negative{color:var(--red)!important}.neutral{color:var(--muted)!important}.region-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}.region-panel{min-width:0;padding:15px;background:#081725;border:1px solid var(--line);border-radius:10px;overflow:hidden}.region-panel.wide{grid-column:1/-1}.region-panel header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.region-panel h4{margin:4px 0 0;font-size:14px}.region-panel header>span{color:var(--muted);font-size:10px}.region-actions{display:flex;align-items:center;gap:8px}.region-actions span{color:var(--muted);font-size:10px}.chart-shell{min-width:0;overflow:hidden}.chart-shell svg{display:block;width:100%;height:auto}.region-grid-line{stroke:#1d3547;stroke-width:1}.legend{display:flex;flex-wrap:wrap;justify-content:center;gap:13px;margin-top:9px;color:var(--muted);font-size:10px}.legend span{display:inline-flex;align-items:center;gap:5px}.legend i{width:8px;height:8px;border-radius:50%}.contribution-list{display:grid;gap:11px}.contribution-row{display:grid;grid-template-columns:110px 1fr 48px;align-items:center;gap:8px;padding:0;border:0;background:transparent;color:var(--text);text-align:left}.contribution-row>span{display:flex;align-items:center;gap:6px;overflow:hidden;text-overflow:ellipsis}.contribution-row i{width:7px;height:7px;border-radius:50%;flex:none}.contribution-track{height:8px;border-radius:999px;background:#142b3c;overflow:hidden}.contribution-track b{display:block;height:100%;border-radius:inherit}.contribution-row strong{font-size:10px;text-align:right}.breakdown-list{display:grid;gap:10px}.breakdown-list>div:not(.legend){display:grid;grid-template-columns:90px 1fr;gap:5px 9px;align-items:center}.breakdown-list strong{font-size:10px}.breakdown-list small{grid-column:2;color:var(--muted);font-size:8px}.stacked-bar{display:flex;height:12px;overflow:hidden;border-radius:999px;background:#142b3c}.stacked-bar i{display:block;height:100%;min-width:0}.growth-ranking{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:7px}.growth-ranking>div{display:flex;justify-content:space-between;padding:9px;background:#0b1b29;border-radius:6px;font-size:10px}.region-table-wrap{overflow:auto}.region-table{width:100%;min-width:1500px;border-collapse:collapse}.region-table.sku-drill{min-width:1150px}.region-table th,.region-table td{padding:11px 10px;border-bottom:1px solid var(--line);font-size:11px;white-space:nowrap;text-align:right}.region-table th{color:#9fb5c5;font-size:9px;text-transform:uppercase}.region-table th:first-child,.region-table td:first-child,.region-table th:nth-child(2),.region-table td:nth-child(2){text-align:left}.region-table tbody tr{cursor:pointer}.region-table tbody tr:hover{background:#10293b}.region-table td button{padding:0;border:0;background:transparent;color:var(--cyan);font-weight:800}.region-table td small{color:var(--muted);font-size:8px}.demand{display:inline-flex;padding:4px 7px;border-radius:4px;background:#163148;color:#a9d8f1;font-size:9px}.demand.smooth{background:#0c4035;color:#52e5ba}.demand.erratic{background:#4a3410;color:#ffd36d}.demand.intermittent,.demand.lumpy{background:#431721;color:#ff8798}.region-empty{padding:35px;color:var(--muted);text-align:center}.region-button{border-radius:7px}.chart-axis{display:flex;justify-content:space-between;color:var(--muted);font-size:9px}.chart-axis strong{color:#cce1ee}@media(max-width:1100px){.region-kpis{grid-template-columns:repeat(2,1fr)}.region-grid{grid-template-columns:1fr}.region-filter{grid-template-columns:1fr 1fr}.region-filter-block{grid-column:1/-1}}@media(max-width:700px){.region-heading{align-items:flex-start;flex-direction:column}.region-filter,.region-kpis{grid-template-columns:1fr}.region-filter-block{grid-column:auto}}
`;
