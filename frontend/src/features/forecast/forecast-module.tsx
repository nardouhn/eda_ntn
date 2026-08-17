"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiGet } from "@/lib/api";
import { formatNumber, formatPercent } from "@/lib/format";
import type { Branch } from "@/lib/types";

type Values = number[];
type View = "branches" | "skus" | "diagnostics";
type BranchSummary = { branch_code: string; values: Values; original_values: Values; direct_values: Values; base_sku_count: number; pair_count: number; forecasted_pairs: number; cap_bound_pair_months: number };
type SkuSummary = { sku: string; values: Values; branch_count: number; pair_count: number };
type PairDetail = { sku: string; values: Values; forecasted: boolean; route: string; method: string; lifecycle_state: string; cap_binding: string[] };
type BranchDetail = { branch_code: string; values: Values; pairs: PairDetail[] };
type Manifest = {
  source: "WorkFinals" | "Forecast API"; vintage_id: string; vintage_status?: "promoted" | "superseded"; source_run: string; source_file: string; forecast_origin: string; months: string[]; unit: string;
  primary_signal: string; pair_count: number; base_sku_count: number; branch_count: number;
  portfolio: { values: Values; original_values: Values; direct_values: Values }; branches: BranchSummary[]; skus: SkuSummary[];
  diagnostics: { reconciliation_method: string; scale_range: [number, number]; cap_binding_pair_months: number; conservation_status: "PASS"; actual_status: "PENDING_TARGET_CLOSE" };
};
type VintageOption = { vintage_key: string; status: "promoted" | "superseded"; primary_signal: string; forecast_origin: string };
type VintageList = { vintages: VintageOption[] };

const MANIFEST_URL = "/data/forecast/manifest.json";
const EMPTY_VALUES: Values = [0, 0, 0];

function total(values: Values) { return values.reduce((sum, value) => sum + value, 0); }
function monthLabel(month: string) { return new Intl.DateTimeFormat("vi-VN", { month: "short", year: "numeric" }).format(new Date(`${month.slice(0, 7)}-01T00:00:00`)); }
function h3Change(values: Values) { return values.length < 3 || values[0] === 0 ? null : values.at(-1)! / values[0] - 1; }
function changeLabel(values: Values) { const change = h3Change(values); return change === null ? "Chưa có nền H1" : change === 0 ? "Không đổi" : `${change > 0 ? "↑" : "↓"} ${formatPercent(Math.abs(change))}`; }
function changeClass(values: Values) { const change = h3Change(values); return change === null || change === 0 ? "forecast-trend neutral" : change > 0 ? "forecast-trend up" : "forecast-trend down"; }
function sameValues(left: Values, right: Values) { return left.every((value, index) => Math.abs(value - right[index]) < 0.001); }
function ValuesCells({ values }: { values: Values }) { return <>{values.map((value, index) => <td className="number-cell forecast-value" key={index}>{formatNumber(value)}</td>)}</>; }

export function ForecastModule(props: { branches: Branch[]; branchCode: string; onBranchChange: (value: string) => void }) {
  const { branches } = props;
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVintageKey, setSelectedVintageKey] = useState<string | null>(null);
  const [vintages, setVintages] = useState<VintageOption[]>([]);
  const [view, setView] = useState<View>("branches");
  const [branchSearch, setBranchSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [skuSearch, setSkuSearch] = useState("");
  const [selectedBranchCode, setSelectedBranchCode] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<BranchDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailSearch, setDetailSearch] = useState("");
  const detailCache = useRef(new Map<string, BranchDetail>());

  useEffect(() => {
    let cancelled = false;
    setManifest(null); setError(null); setSelectedBranchCode(null);
    const load = async () => {
      try {
        const response = await apiGet<Manifest>("/forecast/vintages/manifest", selectedVintageKey ? { vintage_key: selectedVintageKey } : {});
        if (!cancelled) setManifest(response);
      } catch {
        if (selectedVintageKey) {
          if (!cancelled) setError("Vintage đã chọn chưa có trên Forecast API.");
          return;
        }
        try {
          const response = await fetch(MANIFEST_URL, { cache: "force-cache" });
          if (!response.ok) throw new Error(`Không tải được Forecast B06 (${response.status})`);
          const fallback = await response.json() as Manifest;
          if (!cancelled) setManifest(fallback);
        } catch (reason) {
          if (!cancelled) setError(reason instanceof Error ? reason.message : "Không tải được Forecast");
        }
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [selectedVintageKey]);

  useEffect(() => {
    let cancelled = false;
    apiGet<VintageList>("/forecast/vintages")
      .then((response) => { if (!cancelled) setVintages(response.vintages); })
      .catch(() => { if (!cancelled) setVintages([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedBranchCode) return;
    const cacheKey = `${manifest?.vintage_id ?? "loading"}:${selectedBranchCode}`;
    const cached = detailCache.current.get(cacheKey);
    if (cached) { setSelectedDetail(cached); return; }
    let cancelled = false;
    setSelectedDetail(null); setDetailError(null);
    const load = async () => {
      try {
        const response = manifest?.source === "Forecast API"
          ? await apiGet<BranchDetail>(`/forecast/vintages/${encodeURIComponent(manifest.vintage_id)}/branches/${encodeURIComponent(selectedBranchCode)}`)
          : await fetch(`/data/forecast/branches/${selectedBranchCode}.json`, { cache: "force-cache" }).then((response) => {
            if (!response.ok) throw new Error(`Không tải được phân bổ SKU (${response.status})`);
            return response.json() as Promise<BranchDetail>;
          });
        detailCache.current.set(cacheKey, response);
        if (!cancelled) setSelectedDetail(response);
      } catch (reason) {
        if (!cancelled) setDetailError(reason instanceof Error ? reason.message : "Không tải được phân bổ SKU");
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [selectedBranchCode, manifest]);

  const branchMeta = useMemo(() => new Map(branches.map((branch) => [branch.branch_code, branch])), [branches]);
  const branchRows = useMemo(() => (manifest?.branches || []).map((row) => { const meta = branchMeta.get(row.branch_code); return { ...row, branch_name: meta?.branch_name || `Chi nhánh ${row.branch_code}`, region: meta?.region || "—", brand: meta?.brand || "—" }; }), [manifest, branchMeta]);
  const regions = useMemo(() => [...new Set(branchRows.map((row) => row.region).filter((value) => value !== "—"))].sort(), [branchRows]);
  const brands = useMemo(() => [...new Set(branchRows.map((row) => row.brand).filter((value) => value !== "—"))].sort(), [branchRows]);
  const filteredBranches = useMemo(() => { const query = branchSearch.trim().toLocaleLowerCase("vi-VN"); return branchRows.filter((row) => { const matchesSearch = !query || `${row.branch_name} ${row.branch_code}`.toLocaleLowerCase("vi-VN").includes(query); return matchesSearch && (regionFilter === "all" || row.region === regionFilter) && (brandFilter === "all" || row.brand === brandFilter); }).toSorted((left, right) => total(right.values) - total(left.values)); }, [branchRows, branchSearch, regionFilter, brandFilter]);
  const filteredSkus = useMemo(() => { const query = skuSearch.trim().toLocaleLowerCase("vi-VN"); return (manifest?.skus || []).filter((row) => !query || row.sku.toLocaleLowerCase("vi-VN").includes(query)); }, [manifest, skuSearch]);
  const movers = useMemo(() => [...filteredSkus].filter((row) => h3Change(row.values) !== null).toSorted((left, right) => Math.abs(h3Change(right.values) || 0) - Math.abs(h3Change(left.values) || 0)).slice(0, 6), [filteredSkus]);
  const selectedBranch = selectedBranchCode ? branchRows.find((row) => row.branch_code === selectedBranchCode) || null : null;
  const visiblePairs = useMemo(() => { const query = detailSearch.trim().toLocaleLowerCase("vi-VN"); return (selectedDetail?.pairs || []).filter((pair) => pair.forecasted).filter((pair) => !query || pair.sku.toLocaleLowerCase("vi-VN").includes(query)); }, [selectedDetail, detailSearch]);
  const totals = manifest?.portfolio.values || EMPTY_VALUES;
  const maxMonth = Math.max(1, ...totals);
  const branchTotal = branchRows.reduce<Values>((sum, row) => sum.map((value, index) => value + (row.values[index] || 0)), [...EMPTY_VALUES]);
  const skuTotal = (manifest?.skus || []).reduce<Values>((sum, row) => sum.map((value, index) => value + (row.values[index] || 0)), [...EMPTY_VALUES]);
  const conserved = Boolean(manifest && sameValues(totals, branchTotal) && sameValues(totals, skuTotal));
  const openBranch = (branchCode: string) => { setDetailSearch(""); setSelectedBranchCode(branchCode); };

  return <section className="module forecast-module forecast-b06">
    <div className="module-heading forecast-b06-hero"><div><p className="eyebrow">MODULE 03 · KẾ HOẠCH NHU CẦU</p><h2>Forecast điều hành</h2><p className="subtitle">Kế hoạch nhu cầu 3 tháng theo WorkFinals B06. Xem từ chi nhánh xuống Base SKU, không trộn số forecast cũ.</p></div><div className="forecast-b06-vintage"><span>FORECAST TƯƠNG LAI</span><small>{manifest ? `Origin ${monthLabel(manifest.forecast_origin)}` : "Đang tải vintage…"}</small></div></div>
    {error ? <div className="error-banner">{error}</div> : null}{!manifest && !error ? <div className="forecast-loading">Đang tải kế hoạch WorkFinals B06…</div> : null}
    <div className="forecast-b06-context"><span><i aria-hidden="true" /> Kế hoạch chính: <strong>{manifest?.primary_signal || "—"}</strong></span><span>Horizon: <strong>{(manifest?.months || []).map(monthLabel).join(" · ") || "—"}</strong></span><span>Đơn vị: <strong>{manifest?.unit || "m²"}, hiển thị số nguyên</strong></span><span>Actual / WAPE: <strong>chờ đóng dữ liệu mục tiêu</strong></span>{manifest?.source === "WorkFinals" ? <span>Nguồn: <strong>B06 static fallback</strong></span> : <span>Nguồn: <strong>Forecast API versioned</strong></span>}</div>
    <div className="forecast-b06-kpis"><article><span>Kế hoạch {manifest?.months.length || 3} tháng</span><strong>{formatNumber(total(totals))}</strong><small>{manifest?.unit || "m²"} · {manifest?.primary_signal || "Forecast"}</small></article><article><span>{manifest?.months[0] ? monthLabel(manifest.months[0]) : "H1"}</span><strong>{formatNumber(totals[0] || 0)}</strong><small>forecast kỳ đầu</small></article><article><span>{manifest?.months.at(-1) ? monthLabel(manifest.months.at(-1)!) : "H3"}</span><strong>{formatNumber(totals.at(-1) || 0)}</strong><small>forecast kỳ cuối</small></article><article><span>Kỳ cuối so với kỳ đầu</span><strong className={changeClass(totals)}>{changeLabel(totals)}</strong><small>biến động kế hoạch</small></article><article><span>Chi nhánh trong kế hoạch</span><strong>{formatNumber(manifest?.branch_count)}</strong><small>publication universe</small></article></div>
    <div className="forecast-b06-overview"><div className="panel forecast-b06-chart"><div className="panel-title"><div><p className="eyebrow">PORTFOLIO</p><h3>Nhu cầu kế hoạch theo tháng</h3></div><span>m²</span></div><div className="forecast-b06-bars" role="img" aria-label="Forecast tổng toàn hệ thống theo ba tháng">{(manifest?.months || []).map((month, index) => <div key={month}><div className="forecast-b06-bar-track"><i style={{ height: `${Math.max(10, (totals[index] / maxMonth) * 100)}%` }} /></div><strong>{formatNumber(totals[index])}</strong><small>{monthLabel(month)}</small></div>)}</div><p className="panel-note">Đây là forecast prospective. Mức giảm hoặc tăng H3/H1 là tín hiệu theo dõi kế hoạch, chưa phải kết luận về accuracy.</p></div><div className="panel forecast-b06-read"><p className="eyebrow">CÁCH ĐỌC</p><h3>Dùng đúng cho quyết định</h3><ul><li>Xem chi nhánh để biết nhu cầu kế hoạch và Base SKU đóng góp.</li><li>Chuyển sang SKU để nhận diện biến động trên toàn hệ thống.</li><li>WAPE chỉ xuất hiện sau khi actual Jul–Sep được đóng và chấm đúng frozen vintage.</li></ul></div></div>
    <div className="forecast-b06-tabs" role="tablist" aria-label="Các góc nhìn Forecast"><button type="button" className={view === "branches" ? "active" : ""} onClick={() => setView("branches")} role="tab" aria-selected={view === "branches"}>Theo chi nhánh</button><button type="button" className={view === "skus" ? "active" : ""} onClick={() => setView("skus")} role="tab" aria-selected={view === "skus"}>Base SKU active</button><button type="button" className={view === "diagnostics" ? "active" : ""} onClick={() => setView("diagnostics")} role="tab" aria-selected={view === "diagnostics"}>Diagnostics</button></div>

    {view === "branches" ? <><div className="filters forecast-b06-filters"><input value={branchSearch} onChange={(event) => setBranchSearch(event.target.value)} placeholder="Tìm chi nhánh hoặc mã branch…" aria-label="Tìm chi nhánh" /><select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} aria-label="Lọc vùng"><option value="all">Tất cả vùng</option>{regions.map((region) => <option key={region} value={region}>{region}</option>)}</select><select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)} aria-label="Lọc brand"><option value="all">Tất cả brand</option>{brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select></div><div className="table-card forecast-b06-table-card"><div className="table-scroll forecast-b06-scroll"><table className="data-table forecast-b06-table"><thead><tr><th>Chi nhánh</th><th>Vùng</th><th>Base SKU</th>{(manifest?.months || []).map((month) => <th className="future" key={month}>{monthLabel(month)}<small>FORECAST</small></th>)}<th className="future">Tổng 3M</th><th>H3 / H1</th><th aria-label="Xem phân bổ" /></tr></thead><tbody>{filteredBranches.map((row) => <tr key={row.branch_code}><td className="forecast-b06-name"><strong>{row.branch_name}</strong><small>{row.branch_code} · {formatNumber(row.forecasted_pairs)} SKU có forecast</small></td><td>{row.region}</td><td className="number-cell">{formatNumber(row.base_sku_count)}</td><ValuesCells values={row.values} /><td className="number-cell forecast-b06-total">{formatNumber(total(row.values))}</td><td className={changeClass(row.values)}>{changeLabel(row.values)}</td><td><button className="forecast-b06-open" type="button" onClick={() => openBranch(row.branch_code)}>Xem SKU <span>→</span></button></td></tr>)}{manifest && filteredBranches.length === 0 ? <tr><td className="empty" colSpan={9}>Không có chi nhánh phù hợp bộ lọc.</td></tr> : null}</tbody></table></div></div><p className="footnote">Tổng chi nhánh là tổng phân bổ Reconciled Pair. Tín hiệu Direct Branch được giữ riêng để đối chiếu, không phải tổng SKU.</p></> : null}

    {view === "skus" ? <><div className="forecast-b06-sku-insights"><div className="panel"><div className="panel-title"><div><p className="eyebrow">SKU MOVERS</p><h3>Base SKU biến động mạnh</h3></div><span>H1 → H3</span></div><div className="forecast-b06-movers">{movers.map((sku) => <div key={sku.sku}><div><strong translate="no">{sku.sku}</strong><span className={changeClass(sku.values)}>{changeLabel(sku.values)}</span></div><i><b style={{ width: `${Math.max(6, Math.min(100, (total(sku.values) / Math.max(1, total(movers[0]?.values || EMPTY_VALUES))) * 100))}%` }} /></i><small>{formatNumber(total(sku.values))} m² · {formatNumber(sku.branch_count)} chi nhánh có forecast</small></div>)}{movers.length === 0 ? <p className="panel-note">Không có SKU phù hợp.</p> : null}</div></div><div className="panel forecast-b06-sku-note"><p className="eyebrow">PHẠM VI</p><h3>Danh mục active trong vintage</h3><strong>{formatNumber(manifest?.base_sku_count)} Base SKU</strong><p>Danh sách là tổng forecast Reconciled trên toàn hệ thống. Mở chi nhánh để xem phân bổ SKU chi tiết.</p></div></div><div className="filters forecast-b06-sku-filter"><input value={skuSearch} onChange={(event) => setSkuSearch(event.target.value)} placeholder="Tìm Base SKU…" aria-label="Tìm Base SKU" /><span>{formatNumber(filteredSkus.length)} / {formatNumber(manifest?.base_sku_count)} SKU</span></div><div className="table-card forecast-b06-table-card"><div className="table-scroll forecast-b06-scroll"><table className="data-table forecast-b06-table forecast-b06-sku-table"><thead><tr><th>Base SKU</th><th>Chi nhánh có FC</th>{(manifest?.months || []).map((month) => <th className="future" key={month}>{monthLabel(month)}<small>FORECAST</small></th>)}<th className="future">Tổng 3M</th><th>H3 / H1</th></tr></thead><tbody>{filteredSkus.map((sku) => <tr key={sku.sku}><td className="forecast-b06-name"><strong translate="no">{sku.sku}</strong><small>{formatNumber(sku.pair_count)} cặp SKU × branch trong vintage</small></td><td className="number-cell">{formatNumber(sku.branch_count)}</td><ValuesCells values={sku.values} /><td className="number-cell forecast-b06-total">{formatNumber(total(sku.values))}</td><td className={changeClass(sku.values)}>{changeLabel(sku.values)}</td></tr>)}{manifest && filteredSkus.length === 0 ? <tr><td className="empty" colSpan={7}>Không có Base SKU phù hợp.</td></tr> : null}</tbody></table></div></div></> : null}

    {view === "diagnostics" && manifest ? <div className="forecast-b06-diagnostics"><div className="forecast-b06-vintage-picker"><label htmlFor="forecast-vintage">Forecast vintage</label><select id="forecast-vintage" value={selectedVintageKey || manifest.vintage_id} onChange={(event) => setSelectedVintageKey(event.target.value === manifest.vintage_id && manifest.source === "WorkFinals" ? null : event.target.value)}><option value={manifest.vintage_id}>{manifest.source === "WorkFinals" ? `${manifest.vintage_id} · static fallback` : "Vintage hiện hành"}</option>{vintages.filter((item) => item.vintage_key !== manifest.vintage_id).map((item) => <option value={item.vintage_key} key={item.vintage_key}>{item.vintage_key} · {item.status}</option>)}</select><small>Chỉ vintage promoted hoặc superseded mới được xem.</small></div><div className="forecast-b06-diagnostic-cards"><article><span>Operational signal</span><strong>{manifest.primary_signal}</strong><small>primary forecast shown in this module</small></article><article><span>Conservation</span><strong className={conserved ? "quality-pass" : "quality-pending"}>{conserved ? "PASS" : "CẦN RÀ SOÁT"}</strong><small>Portfolio = Branch = Base SKU</small></article><article><span>Actual / WAPE</span><strong className="quality-pending">CHỜ ACTUAL</strong><small>không hiển thị accuracy sớm</small></article><article><span>Frozen vintage</span><strong>{manifest.vintage_id.replace("wf_reconciled_vintage_", "")}</strong><small>{manifest.source_run}</small></article></div><div className="forecast-b06-diagnostic-grid"><div className="panel"><p className="eyebrow">THREE FROZEN SIGNALS</p><h3>Đối chiếu planning</h3><div className="forecast-b06-compare"><div><span>Signal</span>{manifest.months.map((month) => <span key={month}>{monthLabel(month)}</span>)}<span>Tổng 3M</span></div><div><strong>{manifest.primary_signal}</strong>{manifest.portfolio.values.map((value, index) => <b key={index}>{formatNumber(value)}</b>)}<b>{formatNumber(total(manifest.portfolio.values))}</b></div><div><strong>Direct Branch <small>reference</small></strong>{manifest.portfolio.direct_values.map((value, index) => <b key={index}>{formatNumber(value)}</b>)}<b>{formatNumber(total(manifest.portfolio.direct_values))}</b></div><div><strong>Original Pair <small>baseline</small></strong>{manifest.portfolio.original_values.map((value, index) => <b key={index}>{formatNumber(value)}</b>)}<b>{formatNumber(total(manifest.portfolio.original_values))}</b></div></div><p className="panel-note">Direct Branch là tín hiệu độc lập; không được hiểu là tổng Base SKU.</p></div><div className="panel"><p className="eyebrow">RECONCILIATION</p><h3>Kiểm soát vintage</h3><dl className="forecast-b06-definition"><div><dt>Method</dt><dd>{manifest.diagnostics.reconciliation_method}</dd></div><div><dt>Scale range</dt><dd>{manifest.diagnostics.scale_range.map((value) => formatNumber(value, 2)).join(" – ")}</dd></div><div><dt>Cap-bound Pair × Month</dt><dd>{formatNumber(manifest.diagnostics.cap_binding_pair_months)}</dd></div><div><dt>Source</dt><dd>{manifest.source_file}</dd></div></dl></div></div></div> : null}

    {selectedBranchCode ? <div className="forecast-b06-drawer-root"><button className="forecast-b06-backdrop" type="button" aria-label="Đóng chi tiết chi nhánh" onClick={() => setSelectedBranchCode(null)} /><aside className="forecast-b06-drawer" role="dialog" aria-modal="true" aria-labelledby="forecast-branch-detail-title"><div className="forecast-b06-drawer-head"><div><p className="eyebrow">BRANCH PLAN</p><h3 id="forecast-branch-detail-title">{selectedBranch?.branch_name || `Chi nhánh ${selectedBranchCode}`}</h3><p>{selectedBranchCode} · {selectedBranch?.region || "—"}</p></div><button type="button" onClick={() => setSelectedBranchCode(null)} aria-label="Đóng chi tiết chi nhánh">×</button></div>{selectedBranch ? <div className="forecast-b06-drawer-kpis"><div><span>Kế hoạch 3M</span><strong>{formatNumber(total(selectedBranch.values))} m²</strong></div><div><span>H3 so với H1</span><strong className={changeClass(selectedBranch.values)}>{changeLabel(selectedBranch.values)}</strong></div><div><span>Base SKU có forecast</span><strong>{formatNumber(selectedBranch.forecasted_pairs)}</strong></div></div> : null}<div className="forecast-b06-no-history"><strong>Lịch sử actual chưa được gắn vào vintage này.</strong><span>Không vẽ biểu đồ lịch sử giả; actual và WAPE chỉ mở khi Jul–Sep được đóng dữ liệu.</span></div><div className="forecast-b06-drawer-section"><div className="panel-title"><div><h4>Phân bổ theo Base SKU</h4><span>Chỉ hiện SKU có forecast để phục vụ kế hoạch</span></div><span>{selectedDetail ? `${formatNumber(visiblePairs.length)} SKU` : "Đang tải…"}</span></div><input value={detailSearch} onChange={(event) => setDetailSearch(event.target.value)} placeholder="Lọc Base SKU trong chi nhánh…" aria-label="Lọc Base SKU trong chi nhánh" />{detailError ? <div className="error-banner">{detailError}</div> : null}{!selectedDetail && !detailError ? <p className="panel-note">Đang tải phân bổ SKU…</p> : null}{selectedDetail ? <div className="drawer-table-scroll"><table className="data-table forecast-b06-drawer-table"><thead><tr><th>Base SKU</th>{(manifest?.months || []).map((month) => <th key={month}>{monthLabel(month)}</th>)}<th>Tổng 3M</th><th>H3 / H1</th></tr></thead><tbody>{visiblePairs.map((pair) => <tr key={pair.sku}><td><strong translate="no">{pair.sku}</strong><small>Forecasted pair</small></td><ValuesCells values={pair.values} /><td className="number-cell forecast-b06-total">{formatNumber(total(pair.values))}</td><td className={changeClass(pair.values)}>{changeLabel(pair.values)}</td></tr>)}{visiblePairs.length === 0 ? <tr><td className="empty" colSpan={6}>Không có Base SKU có forecast phù hợp.</td></tr> : null}</tbody></table></div> : null}</div>{selectedBranch ? <details className="forecast-b06-tech"><summary>Đối chiếu kỹ thuật của chi nhánh</summary><div><span>Reconciled R2_CAP30</span><strong>{formatNumber(total(selectedBranch.values))} m²</strong></div><div><span>Direct Branch V2 · reference</span><strong>{formatNumber(total(selectedBranch.direct_values))} m²</strong></div><div><span>Original Pair · baseline</span><strong>{formatNumber(total(selectedBranch.original_values))} m²</strong></div><div><span>Pair × month chạm cap</span><strong>{formatNumber(selectedBranch.cap_bound_pair_months)}</strong></div></details> : null}</aside></div> : null}
  </section>;
}
