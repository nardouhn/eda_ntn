"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";
import { formatMonth, formatNumber, formatPercent } from "@/lib/format";
import type { Branch } from "@/lib/types";

type Cell = { month: string; period_type: "past" | "future"; forecast: number | null; actual: number | null; accuracy: number | null; lower: number | null; upper: number | null };
type ForecastRow = { base_sku: string; sku_name: string | null; status: string; method: string; metrics: { wape: number | null; mae: number | null; bias: number | null }; cells: Cell[] };
type ForecastData = { data_as_of_month: string; branch: Branch; metrics: { forecast_total: number; actual_total: number; wape: number | null }; rows: ForecastRow[] };

export function ForecastModule({ branches, branchCode, onBranchChange }: { branches: Branch[]; branchCode: string; onBranchChange: (value: string) => void }) {
  const uniqueBranches = useMemo(
    () => [...new Map(branches.map((branch) => [branch.branch_code, branch])).values()],
    [branches],
  );
  const effectiveBranch = branchCode === "__ALL__" ? uniqueBranches[0]?.branch_code : branchCode;
  const [data, setData] = useState<ForecastData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!effectiveBranch) return;
    apiGet<ForecastData>("/forecast/matrix", { branch_code: effectiveBranch, limit: 30, horizon: 3 }).then(setData).catch((reason: Error) => setError(reason.message));
  }, [effectiveBranch]);
  const months = useMemo(() => data?.rows[0]?.cells.map((cell) => ({ month: cell.month, period_type: cell.period_type })) ?? [], [data]);
  return (
    <section className="module forecast-module">
      <div className="module-heading"><div><p className="eyebrow">MODULE 03</p><h2>Forecast theo chi nhánh</h2><p className="subtitle">Baseline thống kê được chọn bằng rolling backtest, không dùng dữ liệu tương lai.</p></div><select value={effectiveBranch ?? ""} onChange={(event) => onBranchChange(event.target.value)}>{uniqueBranches.map((branch) => <option key={`forecast-branch-${branch.branch_code}-${branch.branch_name}`} value={branch.branch_code}>{branch.branch_code} · {branch.branch_name}</option>)}</select></div>
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="forecast-summary"><div><span>Chi nhánh</span><strong>{data?.branch?.branch_name ?? "Đang tải..."}</strong></div><div><span>Tổng FC quá khứ</span><strong>{formatNumber(data?.metrics.forecast_total)}</strong></div><div><span>Tổng TT quá khứ</span><strong>{formatNumber(data?.metrics.actual_total)}</strong></div><div><span>WAPE</span><strong>{formatPercent(data?.metrics.wape)}</strong></div></div>
      <div className="table-card forecast-card"><div className="table-scroll"><table className="data-table forecast-table"><thead><tr><th rowSpan={2}>Chi nhánh / SKU gốc</th><th rowSpan={2}>Method</th>{months.map((item) => <th key={item.month} colSpan={item.period_type === "past" ? 3 : 2} className={item.period_type}>{formatMonth(item.month)}<small>{item.period_type === "past" ? "QUÁ KHỨ" : "TƯƠNG LAI"}</small></th>)}</tr><tr>{months.flatMap((item) => item.period_type === "past" ? [<th key={`${item.month}-fc`}>FC</th>,<th key={`${item.month}-tt`}>TT</th>,<th key={`${item.month}-acc`}>Acc</th>] : [<th key={`${item.month}-fc`}>FC</th>,<th key={`${item.month}-pi`}>Khoảng</th>])}</tr></thead><tbody>
        <tr className="group-row"><td><strong>{data?.branch?.branch_name}</strong><small>{data?.rows.length ?? 0} SKU top sản lượng</small></td><td>Auto</td>{months.flatMap((item) => item.period_type === "past" ? [<td key={`${item.month}-a`}>—</td>,<td key={`${item.month}-b`}>—</td>,<td key={`${item.month}-c`}>{formatPercent(data?.metrics.wape === null || data?.metrics.wape === undefined ? null : Math.max(0, 1 - data.metrics.wape))}</td>] : [<td key={`${item.month}-d`}>—</td>,<td key={`${item.month}-e`}>—</td>])}</tr>
        {data?.rows.map((row, rowIndex) => <tr key={`forecast-row-${effectiveBranch}-${row.base_sku}-${rowIndex}`}><td className="item-cell"><strong className={row.status === "inactive" ? "inactive-name" : ""}>{row.base_sku}</strong><span>{row.sku_name}</span></td><td><span className="method-pill">{row.method.replaceAll("_", " ")}</span></td>{row.cells.flatMap((cell) => cell.period_type === "past" ? [<td key={`${row.base_sku}-${cell.month}-fc`}>{formatNumber(cell.forecast)}</td>,<td key={`${row.base_sku}-${cell.month}-tt`}>{formatNumber(cell.actual)}</td>,<td key={`${row.base_sku}-${cell.month}-acc`} className={`accuracy ${(cell.accuracy ?? 0) >= .8 ? "good" : (cell.accuracy ?? 0) >= .5 ? "warn" : "bad"}`}>{formatPercent(cell.accuracy)}</td>] : [<td key={`${row.base_sku}-${cell.month}-fc`}>{formatNumber(cell.forecast)}</td>,<td key={`${row.base_sku}-${cell.month}-pi`} className="interval">{cell.lower === null ? "—" : `${formatNumber(cell.lower)}–${formatNumber(cell.upper)}`}</td>])}</tr>)}
      </tbody></table></div></div>
      <p className="footnote">Acc chỉ hiển thị khi TT &gt; 0. Hàng tổng sử dụng WAPE; không lấy trung bình Acc của từng ô. Missing giữ là “—”.</p>
    </section>
  );
}
