"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { formatNumber } from "@/lib/format";
import type { Branch } from "@/lib/types";

type ForecastPair = [baseSku: string, jul: number, aug: number, sep: number];
type FrozenBranch = { branch_code: string; pairs: ForecastPair[] };
type FrozenForecast = {
  version: string;
  forecast_origin: string;
  months: [string, string, string];
  value_field: "forecast_m2";
  branches: FrozenBranch[];
};

type BranchRow = FrozenBranch & {
  branch_name: string;
  region: string;
  brand: string;
  total: number;
  jul: number;
  aug: number;
  sep: number;
};

const FORECAST_ASSET = "/data/work9_forecast.json";

function monthLabel(month: string): string {
  const date = new Date(`${month}-01T00:00:00`);
  return `${new Intl.DateTimeFormat("en-US", { month: "short" }).format(date)}-${date.getFullYear()}`;
}

function sumPair(pair: ForecastPair): number {
  return pair[1] + pair[2] + pair[3];
}

export function ForecastModule(props: { branches: Branch[]; branchCode: string; onBranchChange: (value: string) => void }) {
  const { branches } = props;
  const [asset, setAsset] = useState<FrozenForecast | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [branchSearch, setBranchSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [skuSearch, setSkuSearch] = useState("");
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetch(FORECAST_ASSET, { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`Không tải được Work9 frozen forecast (${response.status})`);
        return response.json() as Promise<FrozenForecast>;
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

  const branchMeta = useMemo(
    () => new Map(branches.map((branch) => [branch.branch_code, branch])),
    [branches],
  );

  const branchRows = useMemo<BranchRow[]>(() => {
    if (!asset) return [];
    return asset.branches
      .map((source) => {
        const meta = branchMeta.get(source.branch_code);
        const jul = source.pairs.reduce((total, pair) => total + pair[1], 0);
        const aug = source.pairs.reduce((total, pair) => total + pair[2], 0);
        const sep = source.pairs.reduce((total, pair) => total + pair[3], 0);
        return {
          ...source,
          branch_name: meta?.branch_name || `Chi nhánh ${source.branch_code}`,
          region: meta?.region || "—",
          brand: meta?.brand || "—",
          jul,
          aug,
          sep,
          total: jul + aug + sep,
        };
      })
      .sort((left, right) => right.total - left.total);
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

  const regions = useMemo(() => [...new Set(branchRows.map((branch) => branch.region).filter((value) => value !== "—"))].sort(), [branchRows]);
  const brands = useMemo(() => [...new Set(branchRows.map((branch) => branch.brand).filter((value) => value !== "—"))].sort(), [branchRows]);
  const totals = useMemo(
    () => branchRows.reduce((result, branch) => ({ jul: result.jul + branch.jul, aug: result.aug + branch.aug, sep: result.sep + branch.sep }), { jul: 0, aug: 0, sep: 0 }),
    [branchRows],
  );

  function toggleBranch(branchCode: string) {
    setExpandedBranches((current) => {
      const next = new Set(current);
      if (next.has(branchCode)) next.delete(branchCode);
      else next.add(branchCode);
      return next;
    });
  }

  return (
    <section className="module forecast-module">
      <div className="module-heading">
        <div>
          <p className="eyebrow">MODULE 03 · WORK9 FROZEN</p>
          <h2>Forecast theo chi nhánh</h2>
          <p className="subtitle">Prospective forecast cố định từ Work9 · origin {asset?.forecast_origin || "2026-06"} · giá trị hiển thị là forecast_m2.</p>
        </div>
        <span className="forecast-vintage">H1 · H2 · H3</span>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {!asset && !error ? <div className="forecast-loading">Đang tải Work9 frozen forecast…</div> : null}

      <div className="forecast-summary forecast-summary-work9">
        <div><span>Số chi nhánh</span><strong>{formatNumber(branchRows.length)}</strong><small>frozen universe</small></div>
        <div><span>Số Pair forecast</span><strong>{formatNumber(branchRows.reduce((total, branch) => total + branch.pairs.length, 0))}</strong><small>Base SKU × Branch</small></div>
        <div><span>{asset ? monthLabel(asset.months[0]) : "Jul-2026"}</span><strong>{formatNumber(totals.jul)}</strong><small>forecast_m2</small></div>
        <div><span>{asset ? monthLabel(asset.months[1]) : "Aug-2026"}</span><strong>{formatNumber(totals.aug)}</strong><small>forecast_m2</small></div>
        <div><span>{asset ? monthLabel(asset.months[2]) : "Sep-2026"}</span><strong>{formatNumber(totals.sep)}</strong><small>forecast_m2</small></div>
        <div><span>Tổng forecast 3M</span><strong>{formatNumber(totals.jul + totals.aug + totals.sep)}</strong><small>Soft Two-Part LightGBM</small></div>
      </div>

      <div className="filters forecast-filters">
        <input value={branchSearch} onChange={(event) => setBranchSearch(event.target.value)} placeholder="Tìm chi nhánh hoặc mã branch…" aria-label="Tìm chi nhánh" />
        <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} aria-label="Lọc vùng">
          <option value="all">Tất cả vùng</option>
          {regions.map((region) => <option key={region} value={region}>{region}</option>)}
        </select>
        <select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)} aria-label="Lọc brand">
          <option value="all">Tất cả brand</option>
          {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
        </select>
        <input value={skuSearch} onChange={(event) => setSkuSearch(event.target.value)} placeholder="Tìm Base SKU khi expand…" aria-label="Tìm Base SKU" />
      </div>

      <div className="table-card forecast-card">
        <div className="table-scroll forecast-scroll">
          <table className="data-table forecast-table">
            <thead>
              <tr>
                <th>Chi nhánh / Base SKU</th>
                <th>Vùng</th>
                <th>SKU forecast</th>
                {asset?.months.map((month) => <th key={month} className="future"><span>{monthLabel(month)}</span><small>FROZEN FC</small></th>)}
                <th className="future">Tổng 3M</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.map((branch) => {
                const expanded = expandedBranches.has(branch.branch_code);
                const detailQuery = skuSearch.trim().toLocaleLowerCase("vi-VN");
                const pairs = detailQuery ? branch.pairs.filter((pair) => pair[0].toLocaleLowerCase("vi-VN").includes(detailQuery)) : branch.pairs;
                return (
                  <Fragment key={`branch-group-${branch.branch_code}`}>
                    <tr className="forecast-branch-row">
                      <td className="forecast-name-cell">
                        <button className="forecast-expand" type="button" aria-expanded={expanded} aria-label={`${expanded ? "Thu gọn" : "Mở rộng"} ${branch.branch_name}`} onClick={() => toggleBranch(branch.branch_code)}>{expanded ? "⌄" : "›"}</button>
                        <span><strong>{branch.branch_name}</strong><small>{branch.branch_code} · {branch.pairs.length} pair</small></span>
                      </td>
                      <td className="forecast-region-cell">{branch.region}</td>
                      <td className="number-cell">{formatNumber(branch.pairs.length)}</td>
                      <td className="number-cell future-value">{formatNumber(branch.jul)}</td>
                      <td className="number-cell future-value">{formatNumber(branch.aug)}</td>
                      <td className="number-cell future-value">{formatNumber(branch.sep)}</td>
                      <td className="number-cell total-cell">{formatNumber(branch.total)}</td>
                    </tr>
                    {expanded ? pairs.map((pair) => <tr className="forecast-sku-row" key={`${branch.branch_code}-${pair[0]}`}>
                      <td className="forecast-name-cell forecast-sku-cell"><span className="sku-indent">↳</span><strong>{pair[0]}</strong></td>
                      <td className="forecast-region-cell">{branch.region}</td>
                      <td className="muted">—</td>
                      <td className="number-cell future-value">{formatNumber(pair[1])}</td>
                      <td className="number-cell future-value">{formatNumber(pair[2])}</td>
                      <td className="number-cell future-value">{formatNumber(pair[3])}</td>
                      <td className="number-cell total-cell">{formatNumber(sumPair(pair))}</td>
                    </tr>) : null}
                  </Fragment>
                );
              })}
              {asset && filteredBranches.length === 0 ? <tr><td className="empty" colSpan={7}>Không có branch phù hợp bộ lọc.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
      <p className="footnote">Forecast chỉ lấy cặp Base SKU × Branch trong frozen production universe. SKU chỉ được render khi mở branch; không rerun model, không dùng pred_positive_quantity và không sinh pair unseen.</p>
    </section>
  );
}
