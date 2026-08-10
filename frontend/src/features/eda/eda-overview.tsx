"use client";

import { useEffect, useState } from "react";
import { HorizontalBars, LineChart } from "@/components/charts";
import { CrosstabHistoryPattern } from "./crosstab-history-pattern";
import { PatternTimelineSample } from "./pattern-timeline-sample";
import { BranchCoverageHeatmap } from "./branch-coverage-heatmap";
import { apiGet } from "@/lib/api";
import { formatMonth, formatNumber, formatPercent } from "@/lib/format";
import type { Branch } from "@/lib/types";

type EdaData = {
  kpis: { base_skus: number; branches: number; gross_qty: number; return_qty: number; net_qty: number; data_as_of: string };
  status_counts: Array<{ status: string; value: number }>;
  trend: Array<{ month: string; gross_qty: number; return_qty: number; net_qty: number }>;
  regions: Array<{ region: string; gross_qty: number }>;
  sizes: Array<{ size_code: string; gross_qty: number }>;
  data_quality: Array<{ rule_code: string; severity: string; value: number }>;
};

export function EdaOverview({ branches, branchCode, onBranchChange }: { branches: Branch[]; branchCode: string; onBranchChange: (value: string) => void }) {
  const [data, setData] = useState<EdaData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    apiGet<EdaData>("/eda/overview", { branch_code: branchCode === "__ALL__" ? undefined : branchCode })
      .then(setData)
      .catch((reason: Error) => setError(reason.message));
  }, [branchCode]);
  
  const returnRate = data?.kpis.gross_qty ? data.kpis.return_qty / data.kpis.gross_qty : null;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="kpi-grid">
        <article><span>SKU gốc quan sát</span><strong>{formatNumber(data?.kpis.base_skus)}</strong><small>Group 1–4</small></article>
        <article><span>Chi nhánh</span><strong>{formatNumber(data?.kpis.branches)}</strong><small>Đang hoạt động, có giao dịch</small></article>
        <article><span>Bán ra</span><strong>{formatNumber(data?.kpis.gross_qty)}</strong><small>M2 gross dương</small></article>
        <article><span>Hàng trả</span><strong>{formatNumber(data?.kpis.return_qty)}</strong><small>{formatPercent(returnRate)} so với gross</small></article>
        <article><span>Sản lượng thuần</span><strong>{formatNumber(data?.kpis.net_qty)}</strong><small>Gross trừ return</small></article>
      </div>
      <div className="eda-grid">
        <article className="panel wide"><div className="panel-title"><div><p className="eyebrow">MOVEMENT</p><h3>Xu hướng M2 bán ra theo tháng</h3></div><span>{data?.trend.length ? `${formatMonth(data.trend[0].month)} → ${formatMonth(data.trend.at(-1)!.month)}` : "—"}</span></div><LineChart series={(data?.trend ?? []).map((row) => ({ label: formatMonth(row.month), value: row.gross_qty }))} /></article>
        <article className="panel"><div className="panel-title"><div><p className="eyebrow">MIX</p><h3>Sản lượng theo vùng</h3></div></div><HorizontalBars data={(data?.regions ?? []).map((row) => ({ label: row.region, value: row.gross_qty }))} /></article>
        <article className="panel"><div className="panel-title"><div><p className="eyebrow">SIZE</p><h3>Top kích thước</h3></div></div><HorizontalBars data={(data?.sizes ?? []).map((row) => ({ label: row.size_code, value: row.gross_qty }))} /></article>
        <article className="panel"><div className="panel-title"><div><p className="eyebrow">LIFECYCLE</p><h3>Trạng thái SKU gốc</h3></div></div><HorizontalBars data={(data?.status_counts ?? []).map((row) => ({ label: row.status === "active" ? "Đang hoạt động" : "Vô hiệu hóa", value: row.value }))} /></article>
        <article className="panel"><div className="panel-title"><div><p className="eyebrow">QUALITY GATE</p><h3>Ngoại lệ dữ liệu</h3></div></div>{data?.data_quality.length ? <HorizontalBars data={data.data_quality.map((row) => ({ label: row.rule_code, value: row.value }))} /> : <p className="empty">Không có ngoại lệ.</p>}<p className="panel-note">Các mã sai cấu trúc được giữ để truy vết và loại khỏi forecast, không bị xóa khỏi nguồn.</p></article>
        <article className="panel wide"><div className="panel-title"><div><p className="eyebrow">PATTERN</p><h3>Phân loại Demand Pattern & History</h3></div></div><CrosstabHistoryPattern branchCode={branchCode} /></article>
        <article className="panel wide"><div className="panel-title"><div><p className="eyebrow">TIMELINE</p><h3>Mẫu chuỗi thời gian (Dot-matrix)</h3></div></div><PatternTimelineSample branchCode={branchCode} /></article>
        <article className="panel wide"><div className="panel-title"><div><p className="eyebrow">COVERAGE</p><h3>Độ phủ danh mục theo chi nhánh</h3></div></div><BranchCoverageHeatmap /></article>
      </div>
    </div>
  );
}
