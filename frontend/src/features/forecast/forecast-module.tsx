"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { apiGet } from "@/lib/api";
import { formatNumber, formatPercent } from "@/lib/format";
import type { Branch } from "@/lib/types";

type Values = number[];
type History = Array<number | null>;
type View = "branches" | "skus" | "diagnostics";
type Accuracy = { wape_h1: number | null; observations: number; actual_m2: number; qualified: boolean };
type HistoryData = { history?: History; history_forecast?: History; history_accuracy?: History };
type BranchSummary = HistoryData & { branch_code: string; values: Values; original_values: Values; direct_values: Values; base_sku_count: number; pair_count: number; forecasted_pairs: number; cap_bound_pair_months: number };
type SkuSummary = HistoryData & { sku: string; values: Values; branch_count: number; pair_count: number; accuracy?: Accuracy };
type PairDetail = HistoryData & { sku: string; values: Values; forecasted: boolean; route: string; accuracy?: Accuracy };
type BranchDetail = HistoryData & { branch_code: string; values: Values; pairs: PairDetail[] };
type Manifest = {
  source: "WorkFinals" | "Forecast API"; vintage_id: string; source_run: string; forecast_origin: string; months: string[]; unit: string; primary_signal: string; pair_count: number; base_sku_count: number; branch_count: number;
  portfolio: { values: Values; original_values: Values; direct_values: Values }; branches: BranchSummary[]; skus: SkuSummary[];
  history_months?: string[]; actual_portfolio?: Values; forecast_portfolio_h1?: Values; history_accuracy?: History;
  history_source?: { run: string; metric: string; eligibility: { minimum_h1_observations: number; minimum_actual_m2: number } };
  diagnostics: { reconciliation_method: string };
};
type VintageOption = { vintage_key: string; status: "promoted" | "superseded" };
type VintageList = { vintages: VintageOption[] };

const MANIFEST_URL = "/data/forecast/manifest.json";
const EMPTY_VALUES: Values = [0, 0, 0];
const total = (values: Array<number | null | undefined>) => values.reduce<number>((sum, value) => sum + (value || 0), 0);
const hasValue = (values?: History) => Boolean(values?.some((value) => value !== null && value !== undefined));
const monthLabel = (month: string) => new Intl.DateTimeFormat("vi-VN", { month: "short", year: "numeric" }).format(new Date(month.slice(0, 7) + "-01T00:00:00"));
const sameValues = (left: Values, right: Values) => left.every((value, index) => Math.abs(value - right[index]) < 0.001);
const normalizedAccuracy = (value: number | null | undefined) => value === null || value === undefined ? null : Math.max(0, value);
const accuracyScore = (accuracy?: Accuracy) => accuracy?.qualified && accuracy.wape_h1 !== null ? Math.max(0, 1 - accuracy.wape_h1) : Number.NEGATIVE_INFINITY;
const compareByAccuracy = <T extends { values: Values; accuracy?: Accuracy }>(left: T, right: T) => accuracyScore(right.accuracy) - accuracyScore(left.accuracy) || total(right.values) - total(left.values);
const accuracyText = (accuracy?: Accuracy) => !accuracy?.qualified || accuracy.wape_h1 === null ? "Chưa đủ mẫu" : "Acc H1 " + formatPercent(Math.max(0, 1 - accuracy.wape_h1));
const displayNumber = (value: number | null | undefined) => value === null || value === undefined ? "—" : formatNumber(value);
const displayAccuracy = (value: number | null | undefined) => value === null || value === undefined ? "—" : formatPercent(Math.max(0, value));
const accuracyClass = (value: number | null | undefined) => value === null || value === undefined ? "forecast-month-acc muted" : Math.max(0, value) >= .7 ? "forecast-month-acc good" : Math.max(0, value) >= .3 ? "forecast-month-acc warn" : "forecast-month-acc bad";

function FutureCells({ values }: { values: Values }) {
  return <>{values.map((value, index) => <td className="number-cell forecast-value" key={index}>{formatNumber(value)}</td>)}</>;
}

function HistoryCells({ months, actual = [], forecast = [], accuracy = [] }: { months: string[]; actual?: History; forecast?: History; accuracy?: History }) {
  return <>{months.map((month, index) => <Fragment key={month}><td className="number-cell history-fc">{displayNumber(forecast[index])}</td><td className="number-cell history-actual">{displayNumber(actual[index])}</td><td className={accuracyClass(normalizedAccuracy(accuracy[index]))}>{displayAccuracy(normalizedAccuracy(accuracy[index]))}</td></Fragment>)}</>;
}

function HistoryHeaders({ months }: { months: string[] }) {
  return <>{months.map((month) => <th className="history-group" colSpan={3} key={month}>{monthLabel(month)}<small>LỊCH SỬ</small></th>)}</>;
}

function HistorySubHeaders({ months }: { months: string[] }) {
  return <>{months.map((month) => <Fragment key={month}><th className="history-sub">FC H1</th><th className="history-sub">TT</th><th className="history-sub">Acc</th></Fragment>)}</>;
}

function TimelineChart({ historyMonths, history, historyForecast, forecastMonths, forecast, label }: { historyMonths: string[]; history: History; historyForecast?: History; forecastMonths: string[]; forecast: Values; label: string }) {
  const width = 760; const height = 222; const left = 42; const right = 18; const top = 18; const bottom = 40;
  const labels = [...historyMonths, ...forecastMonths];
  const allValues = [...history, ...(historyForecast || []), ...forecast].filter((value): value is number => value !== null && value !== undefined);
  const max = Math.max(1, ...allValues); const innerWidth = width - left - right; const innerHeight = height - top - bottom;
  const x = (index: number) => left + (labels.length <= 1 ? 0 : index / (labels.length - 1) * innerWidth);
  const y = (value: number) => top + innerHeight - value / max * innerHeight;
  const path = (points: Array<{ index: number; value: number | null }>) => {
    let drawing = false; let output = "";
    points.forEach((point) => { if (point.value === null || point.value === undefined) { drawing = false; return; } output += (drawing ? "L" : "M") + x(point.index).toFixed(1) + " " + y(point.value).toFixed(1) + " "; drawing = true; });
    return output;
  };
  const actual = history.map((value, index) => ({ index, value }));
  const historicalForecast = (historyForecast || []).map((value, index) => ({ index, value }));
  const lastActual = history.reduce<number>((last, value, index) => value === null || value === undefined ? last : index, -1);
  const projected = [...(lastActual >= 0 ? [{ index: lastActual, value: history[lastActual] }] : []), ...forecast.map((value, index) => ({ index: historyMonths.length + index, value }))];
  return <div className="forecast-timeline" role="img" aria-label={label}>
    <div className="forecast-timeline-legend"><span className="actual">TT thực tế</span><span className="historical">FC H1 lịch sử</span><span className="forecast">Forecast B06</span><strong>Đỉnh {formatNumber(max)} m²</strong></div>
    <svg viewBox={"0 0 " + width + " " + height} preserveAspectRatio="none" aria-hidden="true">
      {[0, .5, 1].map((line) => <line key={line} x1={left} x2={width - right} y1={top + innerHeight * line} y2={top + innerHeight * line} className="forecast-timeline-grid" />)}
      <path d={path(actual)} className="forecast-timeline-actual" /><path d={path(historicalForecast)} className="forecast-timeline-historical" /><path d={path(projected)} className="forecast-timeline-forecast" />
      {actual.filter((point) => point.value !== null).map((point) => <circle key={"actual-" + point.index} cx={x(point.index)} cy={y(point.value!)} r="3.4" className="forecast-timeline-actual-dot" />)}
      {historicalForecast.filter((point) => point.value !== null).map((point) => <circle key={"h1-" + point.index} cx={x(point.index)} cy={y(point.value!)} r="3" className="forecast-timeline-historical-dot" />)}
      {forecast.map((value, index) => <circle key={"future-" + index} cx={x(historyMonths.length + index)} cy={y(value)} r="3.4" className="forecast-timeline-forecast-dot" />)}
      {labels.map((month, index) => <text key={month} x={x(index)} y={height - 14} textAnchor="middle">{monthLabel(month).replace("thg ", "T")}</text>)}
    </svg>
  </div>;
}

export function ForecastModule({ branches }: { branches: Branch[]; branchCode: string; onBranchChange: (value: string) => void }) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVintageKey, setSelectedVintageKey] = useState<string | null>(null);
  const [vintages, setVintages] = useState<VintageOption[]>([]);
  const [view, setView] = useState<View>("branches");
  const [branchSearch, setBranchSearch] = useState(""); const [regionFilter, setRegionFilter] = useState("all"); const [brandFilter, setBrandFilter] = useState("all"); const [skuSearch, setSkuSearch] = useState("");
  const [selectedBranchCode, setSelectedBranchCode] = useState<string | null>(null); const [selectedDetail, setSelectedDetail] = useState<BranchDetail | null>(null); const [detailError, setDetailError] = useState<string | null>(null); const [detailSearch, setDetailSearch] = useState(""); const [selectedPairSku, setSelectedPairSku] = useState<string | null>(null);
  const detailCache = useRef(new Map<string, BranchDetail>());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!cancelled) { setManifest(null); setError(null); setSelectedBranchCode(null); }
      try {
        const response = await apiGet<Manifest>("/forecast/vintages/manifest", selectedVintageKey ? { vintage_key: selectedVintageKey } : {});
        if (!cancelled) setManifest(response);
      } catch {
        if (selectedVintageKey) { if (!cancelled) setError("Vintage đã chọn chưa có trên Forecast API."); return; }
        try {
          const response = await fetch(MANIFEST_URL, { cache: "no-store" });
          if (!response.ok) throw new Error("Không tải được Forecast B06 (" + response.status + ")");
          if (!cancelled) setManifest(await response.json() as Manifest);
        } catch (reason) { if (!cancelled) setError(reason instanceof Error ? reason.message : "Không tải được Forecast"); }
      }
    };
    void load(); return () => { cancelled = true; };
  }, [selectedVintageKey]);

  useEffect(() => {
    let cancelled = false;
    apiGet<VintageList>("/forecast/vintages").then((response) => { if (!cancelled) setVintages(response.vintages); }).catch(() => { if (!cancelled) setVintages([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedBranchCode) return;
    const cacheKey = (manifest?.vintage_id || "loading") + ":" + selectedBranchCode; const cached = detailCache.current.get(cacheKey);
    if (cached) { setSelectedDetail(cached); return; }
    let cancelled = false; setSelectedDetail(null); setDetailError(null);
    const load = async () => {
      try {
        let detail: BranchDetail;
        if (manifest?.source === "Forecast API") detail = await apiGet<BranchDetail>("/forecast/vintages/branches/" + selectedBranchCode, selectedVintageKey ? { vintage_key: selectedVintageKey } : {});
        else {
          const response = await fetch("/data/forecast/branches/" + selectedBranchCode + ".json", { cache: "no-store" });
          if (!response.ok) throw new Error("Không tải được chi tiết chi nhánh");
          detail = await response.json() as BranchDetail;
        }
        if (!cancelled) { detailCache.current.set(cacheKey, detail); setSelectedDetail(detail); }
      } catch (reason) { if (!cancelled) setDetailError(reason instanceof Error ? reason.message : "Không tải được dữ liệu SKU"); }
    };
    void load(); return () => { cancelled = true; };
  }, [manifest, selectedBranchCode, selectedVintageKey]);

  const branchRows = useMemo(() => (manifest?.branches || []).map((row) => ({ ...row, ...(branches.find((branch) => branch.branch_code === row.branch_code) || {}) })), [manifest, branches]);
  const regions = useMemo(() => [...new Set(branchRows.map((row) => row.region).filter((value): value is string => Boolean(value)))].sort(), [branchRows]);
  const brands = useMemo(() => [...new Set(branchRows.map((row) => row.brand).filter((value): value is string => Boolean(value)))].sort(), [branchRows]);
  const filteredBranches = useMemo(() => {
    const query = branchSearch.trim().toLocaleLowerCase("vi-VN");
    return branchRows.filter((row) => (!query || (row.branch_name + " " + row.branch_code).toLocaleLowerCase("vi-VN").includes(query)) && (regionFilter === "all" || row.region === regionFilter) && (brandFilter === "all" || row.brand === brandFilter)).toSorted((left, right) => total(right.values) - total(left.values));
  }, [branchRows, branchSearch, regionFilter, brandFilter]);
  const filteredSkus = useMemo(() => {
    const query = skuSearch.trim().toLocaleLowerCase("vi-VN");
    return (manifest?.skus || []).filter((row) => !query || row.sku.toLocaleLowerCase("vi-VN").includes(query)).toSorted(compareByAccuracy);
  }, [manifest, skuSearch]);
  const reliableSkus = useMemo(() => filteredSkus.filter((sku) => sku.accuracy?.qualified).slice(0, 6), [filteredSkus]);
  const selectedBranch = selectedBranchCode ? branchRows.find((row) => row.branch_code === selectedBranchCode) || null : null;
  const visiblePairs = useMemo(() => {
    const query = detailSearch.trim().toLocaleLowerCase("vi-VN");
    return (selectedDetail?.pairs || []).filter((pair) => pair.forecasted).filter((pair) => !query || pair.sku.toLocaleLowerCase("vi-VN").includes(query)).toSorted(compareByAccuracy);
  }, [selectedDetail, detailSearch]);
  const activePairSku = selectedPairSku && visiblePairs.some((pair) => pair.sku === selectedPairSku) ? selectedPairSku : visiblePairs[0]?.sku || null;
  const selectedPair = visiblePairs.find((pair) => pair.sku === activePairSku) || null;
  const totals = manifest?.portfolio.values || EMPTY_VALUES; const historyMonths = manifest?.history_months || []; const portfolioHistory = manifest?.actual_portfolio || []; const portfolioForecastH1 = manifest?.forecast_portfolio_h1 || []; const portfolioAccuracy = manifest?.history_accuracy || [];
  const hasActualHistory = historyMonths.length > 0 && hasValue(portfolioHistory); const lastHistory = historyMonths.length - 1;
  const branchTotal = branchRows.reduce<Values>((sum, row) => sum.map((value, index) => value + (row.values[index] || 0)), [...EMPTY_VALUES]);
  const skuTotal = (manifest?.skus || []).reduce<Values>((sum, row) => sum.map((value, index) => value + (row.values[index] || 0)), [...EMPTY_VALUES]);
  const conserved = Boolean(manifest && sameValues(totals, branchTotal) && sameValues(totals, skuTotal));
  const historyLabel = hasActualHistory ? monthLabel(historyMonths[0]) + " – " + monthLabel(historyMonths.at(-1) || historyMonths[0]) : "chưa có";
  const openBranch = (branchCode: string) => { setDetailSearch(""); setSelectedPairSku(null); setSelectedBranchCode(branchCode); };
  const branchColSpan = 4 + historyMonths.length * 3 + (manifest?.months.length || 0); const skuColSpan = 2 + historyMonths.length * 3 + (manifest?.months.length || 0); const drawerColSpan = 1 + historyMonths.length * 3 + (manifest?.months.length || 0);

  return <section className="module forecast-module forecast-b06">
    <div className="module-heading forecast-b06-hero"><div><p className="eyebrow">MODULE 03 · KẾ HOẠCH NHU CẦU</p><h2>Forecast điều hành</h2><p className="subtitle">B06 T7–T9 đặt cạnh FC H1, TT thực tế và Acc từng tháng T1–T6 để quản lý chi nhánh quyết định nhanh.</p></div><div className="forecast-b06-vintage"><span>FORECAST TƯƠNG LAI</span><small>{manifest ? "Origin " + monthLabel(manifest.forecast_origin) : "Đang tải vintage…"}</small></div></div>
    {error ? <div className="error-banner">{error}</div> : null}{!manifest && !error ? <div className="forecast-loading">Đang tải kế hoạch WorkFinals…</div> : null}
    <div className="forecast-b06-context"><span><i aria-hidden="true" /> Kế hoạch: <strong>{manifest?.primary_signal || "—"}</strong></span><span>Forecast: <strong>{(manifest?.months || []).map(monthLabel).join(" · ") || "—"}</strong></span><span>Actual: <strong>{historyLabel}</strong></span><span>Đơn vị: <strong>{manifest?.unit || "m²"}, số nguyên</strong></span><span>Độ tin cậy SKU: <strong>{manifest?.history_source?.metric || "chưa có rolling history"}</strong></span></div>
    <div className="forecast-b06-kpis"><article><span>TT {historyMonths[lastHistory] ? monthLabel(historyMonths[lastHistory]) : "gần nhất"}</span><strong>{hasActualHistory ? formatNumber(portfolioHistory[lastHistory]) : "—"}</strong><small>thực tế đã đóng</small></article><article><span>Acc {historyMonths[lastHistory] ? monthLabel(historyMonths[lastHistory]) : "H1"}</span><strong className={accuracyClass(portfolioAccuracy[lastHistory])}>{displayAccuracy(portfolioAccuracy[lastHistory])}</strong><small>độ sát FC H1 với TT</small></article>{(manifest?.months || []).map((month, index) => <article key={month}><span>{monthLabel(month)}</span><strong>{formatNumber(totals[index] || 0)}</strong><small>forecast B06</small></article>)}<article><span>Chi nhánh</span><strong>{formatNumber(manifest?.branch_count)}</strong><small>publication universe</small></article></div>
    <div className="forecast-b06-overview"><div className="panel forecast-b06-chart"><div className="panel-title"><div><p className="eyebrow">PORTFOLIO TIMELINE</p><h3>FC H1 lịch sử, TT và kế hoạch B06</h3></div><span>m²</span></div>{hasActualHistory ? <TimelineChart historyMonths={historyMonths} history={portfolioHistory} historyForecast={portfolioForecastH1} forecastMonths={manifest?.months || []} forecast={totals} label="FC H1 lịch sử, thực tế và forecast B06 toàn hệ thống" /> : <p className="panel-note">Chưa có lịch sử actual trong nguồn này.</p>}<p className="panel-note">FC H1 và TT cùng nằm ở T1–T6 để kiểm tra độ bám sát. T7–T9 là forecast B06, không phải thực tế.</p></div><div className="panel forecast-b06-read"><p className="eyebrow">CÁCH ĐỌC</p><h3>Ưu tiên hành động tại chi nhánh</h3><ul><li>Mỗi tháng lịch sử: FC H1 → TT thực tế → Acc.</li><li>Mở chi nhánh để xem lịch sử của từng SKU × branch.</li><li>SKU đủ bằng chứng được xếp theo Acc H1 cao trước; SKU mới hoặc ít TT luôn ở sau.</li></ul></div></div>
    <div className="forecast-b06-tabs" role="tablist" aria-label="Các góc nhìn Forecast"><button type="button" className={view === "branches" ? "active" : ""} onClick={() => setView("branches")} role="tab">Theo chi nhánh</button><button type="button" className={view === "skus" ? "active" : ""} onClick={() => setView("skus")} role="tab">Base SKU active</button><button type="button" className={view === "diagnostics" ? "active" : ""} onClick={() => setView("diagnostics")} role="tab">Diagnostics</button></div>
    {view === "branches" ? <><div className="filters forecast-b06-filters"><input value={branchSearch} onChange={(event) => setBranchSearch(event.target.value)} placeholder="Tìm chi nhánh hoặc mã branch…" aria-label="Tìm chi nhánh" /><select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} aria-label="Lọc vùng"><option value="all">Tất cả vùng</option>{regions.map((region) => <option key={region} value={region}>{region}</option>)}</select><select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)} aria-label="Lọc brand"><option value="all">Tất cả brand</option>{brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select></div><div className="table-card forecast-b06-table-card"><div className="table-scroll forecast-b06-scroll"><table className="data-table forecast-b06-table forecast-b06-matrix"><thead><tr><th rowSpan={2}>Chi nhánh</th><th rowSpan={2}>Vùng</th><th rowSpan={2}>Base SKU</th><HistoryHeaders months={historyMonths} />{(manifest?.months || []).map((month) => <th className="future" rowSpan={2} key={month}>{monthLabel(month)}<small>FORECAST</small></th>)}<th rowSpan={2} /></tr><tr><HistorySubHeaders months={historyMonths} /></tr></thead><tbody>{filteredBranches.map((row) => <tr key={row.branch_code}><td className="forecast-b06-name"><strong>{row.branch_name}</strong><small>{row.branch_code} · {formatNumber(row.forecasted_pairs)} SKU có forecast</small></td><td>{row.region}</td><td className="number-cell">{formatNumber(row.base_sku_count)}</td><HistoryCells months={historyMonths} actual={row.history} forecast={row.history_forecast} accuracy={row.history_accuracy} /><FutureCells values={row.values} /><td><button className="forecast-b06-open" type="button" onClick={() => openBranch(row.branch_code)}>Xem SKU <span>→</span></button></td></tr>)}{manifest && filteredBranches.length === 0 ? <tr><td className="empty" colSpan={branchColSpan}>Không có chi nhánh phù hợp bộ lọc.</td></tr> : null}</tbody></table></div></div><p className="footnote">Acc là mức độ bám sát của FC H1 với TT tháng đó, hiển thị trong khoảng 0%–100%. Khi thiếu TT hoặc TT bằng 0, hệ thống hiển thị — thay vì bịa số.</p></> : null}
    {view === "skus" ? <><div className="forecast-b06-sku-insights"><div className="panel"><div className="panel-title"><div><p className="eyebrow">SKU ƯU TIÊN</p><h3>Acc H1 cao nhất</h3></div><span>đủ bằng chứng</span></div><div className="forecast-b06-movers">{reliableSkus.map((sku) => <div key={sku.sku}><div><strong translate="no">{sku.sku}</strong><span className="forecast-month-acc good">{accuracyText(sku.accuracy)}</span></div><i><b style={{ width: Math.max(6, Math.min(100, Math.max(0, accuracyScore(sku.accuracy)) * 100)) + "%" }} /></i><small>{formatNumber(sku.accuracy?.observations)} điểm H1 · {formatNumber(sku.branch_count)} chi nhánh</small></div>)}{reliableSkus.length === 0 ? <p className="panel-note">Chưa có SKU đủ bằng chứng.</p> : null}</div></div><div className="panel forecast-b06-sku-note"><p className="eyebrow">QUY TẮC XẾP HẠNG</p><h3>Độ tin cậy có bằng chứng</h3><strong>{formatNumber(filteredSkus.filter((sku) => sku.accuracy?.qualified).length)} SKU</strong><p>Acc H1 cao được ưu tiên trước, chỉ khi có ít nhất {manifest?.history_source?.eligibility.minimum_h1_observations || 4} tháng và {formatNumber(manifest?.history_source?.eligibility.minimum_actual_m2 || 100)} m² TT lịch sử.</p></div></div><div className="filters forecast-b06-sku-filter"><input value={skuSearch} onChange={(event) => setSkuSearch(event.target.value)} placeholder="Tìm Base SKU…" aria-label="Tìm Base SKU" /><span>{formatNumber(filteredSkus.length)} / {formatNumber(manifest?.base_sku_count)} SKU · ưu tiên Acc H1 cao</span></div><div className="table-card forecast-b06-table-card"><div className="table-scroll forecast-b06-scroll"><table className="data-table forecast-b06-table forecast-b06-matrix forecast-b06-sku-table"><thead><tr><th rowSpan={2}>Base SKU</th><th rowSpan={2}>Chi nhánh có FC</th><HistoryHeaders months={historyMonths} />{(manifest?.months || []).map((month) => <th className="future" rowSpan={2} key={month}>{monthLabel(month)}<small>FORECAST</small></th>)}</tr><tr><HistorySubHeaders months={historyMonths} /></tr></thead><tbody>{filteredSkus.map((sku) => <tr key={sku.sku}><td className="forecast-b06-name"><strong translate="no">{sku.sku}</strong><small>{formatNumber(sku.pair_count)} cặp SKU × branch · {accuracyText(sku.accuracy)}</small></td><td className="number-cell">{formatNumber(sku.branch_count)}</td><HistoryCells months={historyMonths} actual={sku.history} forecast={sku.history_forecast} accuracy={sku.history_accuracy} /><FutureCells values={sku.values} /></tr>)}{manifest && filteredSkus.length === 0 ? <tr><td className="empty" colSpan={skuColSpan}>Không có Base SKU phù hợp.</td></tr> : null}</tbody></table></div></div></> : null}
    {view === "diagnostics" && manifest ? <div className="forecast-b06-diagnostics"><div className="forecast-b06-vintage-picker"><label htmlFor="forecast-vintage">Forecast vintage</label><select id="forecast-vintage" value={selectedVintageKey || manifest.vintage_id} onChange={(event) => setSelectedVintageKey(event.target.value === manifest.vintage_id && manifest.source === "WorkFinals" ? null : event.target.value)}><option value={manifest.vintage_id}>{manifest.source === "WorkFinals" ? manifest.vintage_id + " · static fallback" : "Vintage hiện hành"}</option>{vintages.filter((item) => item.vintage_key !== manifest.vintage_id).map((item) => <option value={item.vintage_key} key={item.vintage_key}>{item.vintage_key} · {item.status}</option>)}</select><small>Chỉ vintage promoted hoặc superseded mới được xem.</small></div><div className="forecast-b06-diagnostic-cards"><article><span>Operational signal</span><strong>{manifest.primary_signal}</strong><small>primary forecast shown</small></article><article><span>Conservation</span><strong className={conserved ? "quality-pass" : "quality-pending"}>{conserved ? "PASS" : "CẦN RÀ SOÁT"}</strong><small>Portfolio = Branch = Base SKU</small></article><article><span>Actual / Acc</span><strong className={hasActualHistory ? "quality-pass" : "quality-pending"}>{hasActualHistory ? "V02 AVAILABLE" : "CHƯA GẮN"}</strong><small>{hasActualHistory ? "H1 rolling T1–T6" : "chưa hiển thị độ tin cậy"}</small></article><article><span>Frozen vintage</span><strong>{manifest.vintage_id.replace("wf_reconciled_vintage_", "")}</strong><small>{manifest.source_run}</small></article></div><div className="forecast-b06-diagnostic-grid"><div className="panel"><p className="eyebrow">THREE FROZEN SIGNALS</p><h3>Đối chiếu forecast từng tháng</h3><div className="forecast-b06-compare"><div><span>Signal</span>{manifest.months.map((month) => <span key={month}>{monthLabel(month)}</span>)}</div><div><strong>{manifest.primary_signal}</strong>{manifest.portfolio.values.map((value, index) => <b key={index}>{formatNumber(value)}</b>)}</div><div><strong>Direct Branch <small>reference</small></strong>{manifest.portfolio.direct_values.map((value, index) => <b key={index}>{formatNumber(value)}</b>)}</div><div><strong>Original Pair <small>baseline</small></strong>{manifest.portfolio.original_values.map((value, index) => <b key={index}>{formatNumber(value)}</b>)}</div></div><p className="panel-note">Direct Branch là tín hiệu độc lập; không được hiểu là tổng Base SKU.</p></div><div className="panel"><p className="eyebrow">HISTORY CONTRACT</p><h3>Kiểm soát dữ liệu</h3><dl className="forecast-b06-definition"><div><dt>Actual source</dt><dd>{manifest.history_source?.run || "chưa gắn"}</dd></div><div><dt>SKU metric</dt><dd>{manifest.history_source?.metric || "—"}</dd></div><div><dt>Min. evidence</dt><dd>{manifest.history_source ? manifest.history_source.eligibility.minimum_h1_observations + " tháng · " + formatNumber(manifest.history_source.eligibility.minimum_actual_m2) + " m²" : "—"}</dd></div><div><dt>Reconciliation</dt><dd>{manifest.diagnostics.reconciliation_method}</dd></div></dl></div></div></div> : null}
    {selectedBranchCode ? <div className="forecast-b06-drawer-root"><button className="forecast-b06-backdrop" type="button" aria-label="Đóng chi tiết chi nhánh" onClick={() => setSelectedBranchCode(null)} /><aside className="forecast-b06-drawer" role="dialog" aria-modal="true" aria-labelledby="forecast-branch-detail-title"><div className="forecast-b06-drawer-head"><div><p className="eyebrow">BRANCH PLAN</p><h3 id="forecast-branch-detail-title">{selectedBranch?.branch_name || "Chi nhánh " + selectedBranchCode}</h3><p>{selectedBranchCode} · {selectedBranch?.region || "—"}</p></div><button type="button" onClick={() => setSelectedBranchCode(null)} aria-label="Đóng chi tiết chi nhánh">×</button></div>{selectedBranch ? <div className="forecast-b06-drawer-kpis"><div><span>TT {historyMonths[lastHistory] ? monthLabel(historyMonths[lastHistory]) : "mới nhất"}</span><strong>{displayNumber(selectedDetail?.history?.[lastHistory])} m²</strong></div><div><span>Acc {historyMonths[lastHistory] ? monthLabel(historyMonths[lastHistory]) : "H1"}</span><strong className={accuracyClass(selectedDetail?.history_accuracy?.[lastHistory])}>{displayAccuracy(selectedDetail?.history_accuracy?.[lastHistory])}</strong></div><div><span>Base SKU có forecast</span><strong>{formatNumber(selectedBranch.forecasted_pairs)}</strong></div></div> : null}{selectedDetail && hasValue(selectedDetail.history) ? <div className="forecast-b06-history-panel"><div className="panel-title"><div><p className="eyebrow">TIMELINE CHI NHÁNH</p><h4>FC H1 lịch sử, TT và forecast</h4></div><span>T1–T6 → T7–T9</span></div><TimelineChart historyMonths={historyMonths} history={selectedDetail.history || []} historyForecast={selectedDetail.history_forecast} forecastMonths={manifest?.months || []} forecast={selectedBranch?.values || EMPTY_VALUES} label={"FC H1, thực tế và forecast của " + selectedBranchCode} /></div> : <div className="forecast-b06-no-history"><strong>Chưa có lịch sử TT cho branch này trong nguồn đang dùng.</strong><span>Không thay thế bằng số 0 hoặc dữ liệu suy diễn.</span></div>}<div className="forecast-b06-drawer-section"><div className="panel-title"><div><h4>SKU theo Acc lịch sử</h4><span>Acc H1 cao được xếp trước, chỉ khi đủ bằng chứng.</span></div><span>{selectedDetail ? formatNumber(visiblePairs.length) + " SKU" : "Đang tải…"}</span></div><input value={detailSearch} onChange={(event) => setDetailSearch(event.target.value)} placeholder="Lọc Base SKU trong chi nhánh…" aria-label="Lọc Base SKU trong chi nhánh" />{detailError ? <div className="error-banner">{detailError}</div> : null}{!selectedDetail && !detailError ? <p className="panel-note">Đang tải phân bổ SKU…</p> : null}{selectedPair ? <div className="forecast-b06-sku-timeline"><div><p className="eyebrow">SKU × BRANCH</p><h4 translate="no">{selectedPair.sku}</h4><span className={selectedPair.accuracy?.qualified ? "forecast-accuracy good" : "forecast-accuracy"}>{accuracyText(selectedPair.accuracy)} · {selectedPair.accuracy?.qualified ? selectedPair.accuracy.observations + " điểm H1" : "không xếp hạng"}</span></div><TimelineChart historyMonths={historyMonths} history={selectedPair.history || []} historyForecast={selectedPair.history_forecast} forecastMonths={manifest?.months || []} forecast={selectedPair.values} label={"FC H1, thực tế và forecast SKU " + selectedPair.sku + " tại branch " + selectedBranchCode} /></div> : null}{selectedDetail ? <div className="drawer-table-scroll"><table className="data-table forecast-b06-drawer-table forecast-b06-matrix"><thead><tr><th rowSpan={2}>Base SKU</th><HistoryHeaders months={historyMonths} />{(manifest?.months || []).map((month) => <th rowSpan={2} className="future" key={month}>{monthLabel(month)}<small>FORECAST</small></th>)}</tr><tr><HistorySubHeaders months={historyMonths} /></tr></thead><tbody>{visiblePairs.map((pair) => <tr key={pair.sku} className={pair.sku === activePairSku ? "selected" : ""} onClick={() => setSelectedPairSku(pair.sku)}><td><button className="forecast-b06-sku-select" type="button" aria-pressed={pair.sku === activePairSku}><strong translate="no">{pair.sku}</strong><small>{pair.route} · {accuracyText(pair.accuracy)}</small></button></td><HistoryCells months={historyMonths} actual={pair.history} forecast={pair.history_forecast} accuracy={pair.history_accuracy} /><FutureCells values={pair.values} /></tr>)}{visiblePairs.length === 0 ? <tr><td className="empty" colSpan={drawerColSpan}>Không có Base SKU có forecast phù hợp.</td></tr> : null}</tbody></table></div> : null}</div></aside></div> : null}
  </section>;
}
