"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { formatNumber, formatPercent } from "@/lib/format";
import type { Branch } from "@/lib/types";

type ForecastValues = [number, number, number];
type ForecastPair = { sku: string; values: ForecastValues; route: string; method: string; forecasted: boolean };
type ForecastBranch = { branch_code: string; values: ForecastValues; pairs: ForecastPair[] };
type ForecastSku = { sku: string; values: ForecastValues; branch_count: number; forecasted_pairs: number };
type ForecastAsset = {
  version: string;
  source: "workfinals";
  status: "FROZEN_FOR_PROSPECTIVE_VINTAGE";
  forecast_origin: string;
  months: [string, string, string];
  value_field: "forecast_m2";
  pair_count: number;
  base_sku_count: number;
  branch_count: number;
  totals: ForecastValues;
  branches: ForecastBranch[];
  sku_totals: ForecastSku[];
};

type ForecastView = "branches" | "skus";
const FORECAST_ASSET = "/data/workfinal_forecast.json";

function monthLabel(month: string): string {
  const date = new Date(`${month.slice(0, 7)}-01T00:00:00`);
  return new Intl.DateTimeFormat("vi-VN", { month: "2-digit", year: "numeric" }).format(date);
}

function total(values: ForecastValues): number {
  return values[0] + values[1] + values[2];
}

function trend(values: ForecastValues): number | null {
  if (values[0] === 0) return values[2] === 0 ? 0 : null;
  return values[2] / values[0] - 1;
}

function trendLabel(values: ForecastValues): string {
  const value = trend(values);
  if (value === null) return "Mới / không có H1";
  return value === 0 ? "Ổn định" : `${value > 0 ? "↑" : "↓"} ${formatPercent(Math.abs(value))}`;
}

function trendClass(values: ForecastValues): string {
  const value = trend(values);
  if (value === null || value === 0) return "forecast-trend neutral";
  return value > 0 ? "forecast-trend up" : "forecast-trend down";
}

export function ForecastModule(props: { branches: Branch[]; branchCode: string; onBranchChange: (value: string) => void }) {
  const { branches } = props;
  const [asset, setAsset] = useState<ForecastAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ForecastView>("branches");
  const [branchSearch, setBranchSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [skuSearch, setSkuSearch] = useState("");
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetch(FORECAST_ASSET, { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`Không tải được WorkFinals forecast (${response.status})`);
        return response.json() as Promise<ForecastAsset>;
      })
      .then((response) => {
        if (!cancelled) setAsset(response);
      })
      .catch((reason: Error) => {
        if (!cancelled) setError(reason.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const branchMeta = useMemo(() => new Map(branches.map((branch) => [branch.branch_code, branch])), [branches]);
  const branchRows = useMemo(() => {
    if (!asset) return [];
    return asset.branches.map((source) => {
      const meta = branchMeta.get(source.branch_code);
      return { ...source, branch_name: meta?.branch_name || `Chi nhánh ${source.branch_code}`, region: meta?.region || "—", brand: meta?.brand || "—" };
    });
  }, [asset, branchMeta]);
  const filteredBranches = useMemo(() => {
    const query = branchSearch.trim().toLocaleLowerCase("vi-VN");
    return branchRows.filter((branch) => {
      const matchesSearch = !query || `${branch.branch_name} ${branch.branch_code}`.toLocaleLowerCase("vi-VN").includes(query);
      const matchesRegion = regionFilter === "all" || branch.region === regionFilter;
      const matchesBrand = brandFilter === "all" || branch.brand === brandFilter;
      return matchesSearch && matchesRegion && matchesBrand;
    });
  }, [branchRows, branchSearch, regionFilter, brandFilter]);
  const filteredSkus = useMemo(() => {
    if (!asset) return [];
    const query = skuSearch.trim().toLocaleLowerCase("vi-VN");
    return asset.sku_totals.filter((sku) => !query || sku.sku.toLocaleLowerCase("vi-VN").includes(query));
  }, [asset, skuSearch]);
  const regions = useMemo(() => [...new Set(branchRows.map((branch) => branch.region).filter((value) => value !== "—"))].sort(), [branchRows]);
  const brands = useMemo(() => [...new Set(branchRows.map((branch) => branch.brand).filter((value) => value !== "—"))].sort(), [branchRows]);
  const routeSummary = useMemo(() => {
    const counts = new Map<string, number>();
    branchRows.forEach((branch) => branch.pairs.forEach((pair) => {
      const route = pair.route || "—";
      counts.set(route, (counts.get(route) || 0) + 1);
    }));
    return [...counts.entries()].sort((left, right) => right[1] - left[1]).slice(0, 5);
  }, [branchRows]);
  const topMovers = useMemo(() => [...filteredSkus].sort((left, right) => Math.abs(trend(right.values) || 0) - Math.abs(trend(left.values) || 0)).slice(0, 6), [filteredSkus]);

  function toggleBranch(branchCode: string) {
    setExpandedBranches((current) => {
      const next = new Set(current);
      if (next.has(branchCode)) next.delete(branchCode);
      else next.add(branchCode);
      return next;
    });
  }

  const totals = asset?.totals || [0, 0, 0];
  const months = asset?.months || ["2026-07-01", "2026-08-01", "2026-09-01"];

  return (
    <section className="module forecast-module forecast-v2">
      <div className="module-heading forecast-hero">
        <div>
          <p className="eyebrow">MODULE 03 · WORKFINALS FROZEN VINTAGE</p>
          <h2>Forecast điều hành</h2>
          <p className="subtitle">Một nguồn forecast từ Pair, tổng hợp chính xác lên Base SKU, chi nhánh và toàn hệ thống.</p>
        </div>
        <div className="forecast-vintage-stack"><span className="forecast-vintage">FROZEN · {asset?.version || "Đang tải"}</span><small>Origin {asset ? monthLabel(asset.forecast_origin) : "—"} · chờ actual để chấm WAPE</small></div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {!asset && !error ? <div className="forecast-loading">Đang tải WorkFinals forecast…</div> : null}

      <div className="forecast-summary forecast-summary-workfinal">
        <div><span>Forecast 3 tháng</span><strong>{formatNumber(total(totals))}</strong><small>M² gross-positive</small></div>
        <div><span>Active Base SKU</span><strong>{formatNumber(asset?.base_sku_count)}</strong><small>SKU hệ thống</small></div>
        <div><span>Branch</span><strong>{formatNumber(asset?.branch_count)}</strong><small>publication universe</small></div>
        <div><span>Known Pair</span><strong>{formatNumber(asset?.pair_count)}</strong><small>Base SKU × Branch</small></div>
        <div><span>H1 → H3</span><strong className={trendClass(totals)}>{trendLabel(totals)}</strong><small>biến động forecast</small></div>
      </div>

      <div className="forecast-toolbar">
        <div className="forecast-view-tabs" role="tablist" aria-label="Forecast views">
          <button className={view === "branches" ? "active" : ""} onClick={() => setView("branches")} role="tab" aria-selected={view === "branches"}>Theo chi nhánh</button>
          <button className={view === "skus" ? "active" : ""} onClick={() => setView("skus")} role="tab" aria-selected={view === "skus"}>Toàn bộ SKU active</button>
        </div>
        <div className="forecast-legend"><span className="legend-dot future-dot" /> Forecast tương lai <span className="legend-dot route-dot" /> Route/model</div>
      </div>

      {view === "branches" ? <>
        <div className="filters forecast-filters forecast-filters-v2">
          <input value={branchSearch} onChange={(event) => setBranchSearch(event.target.value)} placeholder="Tìm chi nhánh hoặc mã branch…" aria-label="Tìm chi nhánh" />
          <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} aria-label="Lọc vùng"><option value="all">Tất cả vùng</option>{regions.map((region) => <option key={region} value={region}>{region}</option>)}</select>
          <select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)} aria-label="Lọc brand"><option value="all">Tất cả brand</option>{brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select>
          <input value={skuSearch} onChange={(event) => setSkuSearch(event.target.value)} placeholder="Lọc SKU sau khi mở rộng…" aria-label="Lọc Base SKU" />
        </div>

        <div className="table-card forecast-card forecast-matrix-card"><div className="table-scroll forecast-scroll"><table className="data-table forecast-table forecast-matrix">
          <thead><tr><th rowSpan={2}>Chi nhánh / Base SKU</th><th rowSpan={2}>Vùng</th><th rowSpan={2}>Pair</th>{months.map((month) => <th key={month} className="future"><span>{monthLabel(month)}</span><small>DỰ BÁO</small></th>)}<th rowSpan={2} className="future">Tổng 3M</th><th rowSpan={2}>H1 → H3</th><th rowSpan={2}>Route</th></tr><tr>{months.map((month) => <th key={`${month}-fc`} className="future subhead">FC · M²</th>)}</tr></thead>
          <tbody>{filteredBranches.map((branch) => {
            const expanded = expandedBranches.has(branch.branch_code);
            const detailQuery = skuSearch.trim().toLocaleLowerCase("vi-VN");
            const pairs = detailQuery ? branch.pairs.filter((pair) => pair.sku.toLocaleLowerCase("vi-VN").includes(detailQuery)) : branch.pairs;
            return <Fragment key={`branch-group-${branch.branch_code}`}>
              <tr className="forecast-branch-row"><td className="forecast-name-cell"><button className="forecast-expand" type="button" aria-expanded={expanded} aria-label={`${expanded ? "Thu gọn" : "Mở rộng"} ${branch.branch_name}`} onClick={() => toggleBranch(branch.branch_code)}>{expanded ? "⌄" : "›"}</button><span><strong>{branch.branch_name}</strong><small>{branch.branch_code} · {branch.pairs.length} pair</small></span></td><td className="forecast-region-cell">{branch.region}</td><td className="number-cell">{formatNumber(branch.pairs.length)}</td>{branch.values.map((value, index) => <td className="number-cell future-value" key={`${branch.branch_code}-${index}`}>{formatNumber(value)}</td>)}<td className="number-cell total-cell">{formatNumber(total(branch.values))}</td><td className={trendClass(branch.values)}>{trendLabel(branch.values)}</td><td><span className="route-mix">Mixed</span></td></tr>
              {expanded ? pairs.map((pair) => <tr className="forecast-sku-row" key={`${branch.branch_code}-${pair.sku}`}><td className="forecast-name-cell forecast-sku-cell"><span className="sku-indent">↳</span><strong>{pair.sku}</strong><small>{pair.method}</small></td><td className="forecast-region-cell">{branch.region}</td><td className="muted">—</td>{pair.values.map((value, index) => <td className="number-cell future-value" key={`${pair.sku}-${index}`}>{formatNumber(value, 1)}</td>)}<td className="number-cell total-cell">{formatNumber(total(pair.values), 1)}</td><td className={trendClass(pair.values)}>{trendLabel(pair.values)}</td><td><span className="route-pill">{pair.route}</span></td></tr>) : null}
            </Fragment>;
          })}{asset && filteredBranches.length === 0 ? <tr><td className="empty" colSpan={10}>Không có chi nhánh phù hợp bộ lọc.</td></tr> : null}</tbody>
        </table></div></div>
        <p className="footnote">FC là forecast tương lai từ WorkFinals. Actual và WAPE chỉ mở sau khi các tháng mục tiêu được đóng dữ liệu. Tổng ở cấp chi nhánh được cộng từ Pair, không forecast độc lập.</p>
      </> : <>
        <div className="forecast-insight-grid">
          <div className="panel forecast-movers-panel"><div className="panel-title"><div><p className="eyebrow">SKU MOVERS</p><h3>Biến động forecast theo SKU</h3></div><span>H1 → H3</span></div><div className="forecast-movers">{topMovers.map((sku) => <div className="forecast-mover" key={sku.sku}><div className="forecast-mover-label"><strong>{sku.sku}</strong><span className={trendClass(sku.values)}>{trendLabel(sku.values)}</span></div><div className="forecast-mover-track"><span style={{ width: `${Math.max(8, Math.min(100, (total(sku.values) / Math.max(1, total(filteredSkus[0]?.values || [1, 1, 1]))) * 100))}%` }} /></div><small>{formatNumber(total(sku.values), 1)} M² · {sku.branch_count} branch</small></div>)}{topMovers.length === 0 ? <p className="panel-note">Không tìm thấy SKU phù hợp.</p> : null}</div></div>
          <div className="panel forecast-route-panel"><div className="panel-title"><div><p className="eyebrow">ROUTE MIX</p><h3>Phân bổ phương pháp</h3></div><span>Pair count</span></div><div className="route-list">{routeSummary.map(([route, count]) => <div className="route-list-row" key={route}><span>{route}</span><strong>{formatNumber(count)}</strong><div className="route-bar"><i style={{ width: `${Math.max(5, (count / Math.max(1, routeSummary[0]?.[1] || 1)) * 100)}%` }} /></div></div>)}</div></div>
        </div>
        <div className="filters forecast-filters forecast-filters-sku"><input value={skuSearch} onChange={(event) => setSkuSearch(event.target.value)} placeholder="Tìm Base SKU…" aria-label="Tìm Base SKU" /><span className="filter-summary">{formatNumber(filteredSkus.length)} / {formatNumber(asset?.base_sku_count)} SKU</span></div>
        <div className="table-card forecast-card"><div className="table-scroll forecast-scroll"><table className="data-table forecast-table forecast-sku-matrix"><thead><tr><th>Base SKU</th><th>Branch</th><th>Forecasted pair</th>{months.map((month) => <th className="future" key={month}><span>{monthLabel(month)}</span><small>FC · M²</small></th>)}<th className="future">Tổng 3M</th><th>H1 → H3</th></tr></thead><tbody>{filteredSkus.map((sku) => <tr key={sku.sku}><td className="forecast-name-cell"><strong>{sku.sku}</strong></td><td className="number-cell">{formatNumber(sku.branch_count)}</td><td className="number-cell">{formatNumber(sku.forecasted_pairs)}</td>{sku.values.map((value, index) => <td className="number-cell future-value" key={`${sku.sku}-${index}`}>{formatNumber(value, 1)}</td>)}<td className="number-cell total-cell">{formatNumber(total(sku.values), 1)}</td><td className={trendClass(sku.values)}>{trendLabel(sku.values)}</td></tr>)}{asset && filteredSkus.length === 0 ? <tr><td className="empty" colSpan={8}>Không có SKU phù hợp bộ lọc.</td></tr> : null}</tbody></table></div></div>
        <p className="footnote">Danh sách này là toàn bộ Base SKU trong publication universe của WorkFinals. Muốn xem phân bổ SKU theo chi nhánh, chuyển sang “Theo chi nhánh” và mở dòng chi nhánh.</p>
      </>}
    </section>
  );
}
