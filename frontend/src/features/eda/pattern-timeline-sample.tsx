"use client";

import { useEffect, useState, useMemo } from "react";
import { apiGet } from "@/lib/api";

type TimelineItem = {
  month: string;
  gross_positive_qty: number;
  net_qty: number;
};

type SkuSample = {
  base_sku: string;
  branch_code: string;
  demand_pattern: string;
  timeline: TimelineItem[];
};

const COLORS: Record<string, string> = {
  Smooth: "bg-emerald-500",
  Erratic: "bg-amber-500",
  Intermittent: "bg-indigo-500",
  Lumpy: "bg-red-500",
  "Insufficient/Cold-start": "bg-gray-500",
};

export function PatternTimelineSample({ branchCode }: { branchCode: string }) {
  const [data, setData] = useState<SkuSample[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patternFilter, setPatternFilter] = useState<string>("ALL");

  useEffect(() => {
    setLoading(true);
    apiGet<SkuSample[]>("/eda/timeline-sample", { 
      branch_code: branchCode === "__ALL__" ? undefined : branchCode 
    })
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [branchCode]);

  const allMonthsYYYYMM = useMemo(() => {
    if (!data) return [];
    const months = new Set<string>();
    data.forEach(sku => {
      sku.timeline.forEach(t => months.add(t.month.slice(0, 7))); // Extact "YYYY-MM"
    });
    const sorted = Array.from(months).sort();
    if (sorted.length === 0) return [];
    
    // Generate contiguous months to ensure visually correct timeline
    const [startYear, startMonth] = sorted[0].split('-').map(Number);
    const [endYear, endMonth] = sorted[sorted.length - 1].split('-').map(Number);
    
    const result = [];
    let y = startYear;
    let m = startMonth;
    while (y < endYear || (y === endYear && m <= endMonth)) {
      result.push(`${y}-${String(m).padStart(2, '0')}`);
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
    return result;
  }, [data]);

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-500 animate-pulse gap-3">
        <div className="w-8 h-8 border-4 border-gray-700 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-sm">Đang tải biểu đồ Timeline...</p>
      </div>
    );
  }

  if (error) {
    return <div className="h-48 flex items-center justify-center text-red-400 bg-red-500/10 rounded-md text-sm border border-red-500/20">Lỗi tải dữ liệu: {error}</div>;
  }

  if (!data || data.length === 0 || allMonthsYYYYMM.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-500 text-sm italic">Không có dữ liệu mẫu</div>;
  }

  const filteredData = patternFilter === "ALL" 
    ? data 
    : data.filter(d => d.demand_pattern === patternFilter);

  // Sort by pattern and then by total active months for neat waterfall look
  const order = ["Smooth", "Erratic", "Intermittent", "Lumpy", "Insufficient/Cold-start"];
  filteredData.sort((a, b) => {
    const pDiff = order.indexOf(a.demand_pattern) - order.indexOf(b.demand_pattern);
    if (pDiff !== 0) return pDiff;
    const aActive = a.timeline.filter(t => t.gross_positive_qty > 0).length;
    const bActive = b.timeline.filter(t => t.gross_positive_qty > 0).length;
    return bActive - aActive; 
  });

  const skuRenderData = filteredData.map(sku => {
    const activeMap = new Map<string, number>();
    sku.timeline.forEach(t => {
      if (t.gross_positive_qty > 0) {
        activeMap.set(t.month.slice(0, 7), t.gross_positive_qty);
      }
    });
    return { ...sku, activeMap };
  });

  return (
    <div className="flex flex-col gap-4 mt-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h4 className="text-[13px] font-semibold text-gray-400">Dot-matrix Timeline (Tối đa 10 SKU đại diện/nhóm)</h4>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Legend Inline */}
          <div className="hidden md:flex items-center gap-3 mr-4">
            {order.map(cat => (
              <div key={cat} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${COLORS[cat]}`} />
                <span className="text-[10px] uppercase text-gray-500 tracking-wide">{cat}</span>
              </div>
            ))}
          </div>

          <select 
            className="text-xs bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 outline-none text-gray-200 shadow-sm focus:border-indigo-500 transition-colors cursor-pointer"
            value={patternFilter}
            onChange={(e) => setPatternFilter(e.target.value)}
          >
            <option value="ALL">Tất cả Demand Pattern</option>
            <option value="Smooth">Chỉ Smooth</option>
            <option value="Erratic">Chỉ Erratic</option>
            <option value="Intermittent">Chỉ Intermittent</option>
            <option value="Lumpy">Chỉ Lumpy</option>
            <option value="Insufficient/Cold-start">Chỉ Cold-start</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-max flex flex-col gap-1.5 bg-gray-900/20 p-4 rounded-lg border border-gray-800/60">
          
          {/* Header Row (Months) */}
          <div className="flex items-end gap-1 mb-6">
            <div className="w-56 shrink-0"></div> {/* Label Space */}
            {allMonthsYYYYMM.map((m, i) => {
              const isJan = m.endsWith("-01");
              const isFirstOrLast = i === 0 || i === allMonthsYYYYMM.length - 1;
              const showLabel = isJan || isFirstOrLast;
              return (
                <div key={m} className="w-4 shrink-0 flex flex-col items-center justify-end h-8 relative group">
                  {showLabel && (
                    <span className="text-[10px] text-gray-500 absolute -top-5 whitespace-nowrap -rotate-45 origin-bottom-left font-mono">
                      {isJan ? m.split('-')[0] : m}
                    </span>
                  )}
                  {/* Tooltip for all months on hover just in case */}
                  {!showLabel && (
                     <span className="text-[9px] text-gray-400 absolute -top-5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity font-mono pointer-events-none">
                       {m}
                     </span>
                  )}
                  <div className={`w-px mt-auto ${isJan ? 'h-3 bg-gray-600' : 'h-1.5 bg-gray-800'}`} />
                </div>
              );
            })}
          </div>
          
          {/* Data Rows (SKUs) */}
          {skuRenderData.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">Không có mã nào phù hợp với bộ lọc.</div>
          ) : (
            skuRenderData.map(sku => (
              <div key={`${sku.base_sku}-${sku.branch_code}`} className="flex items-center gap-1 group">
                <div className="w-56 shrink-0 text-xs text-gray-400 truncate flex items-center gap-2 pr-2" title={`${sku.base_sku} - ${sku.branch_code}`}>
                  <span className="font-mono text-gray-300 w-28 truncate">{sku.base_sku}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 w-16 text-center truncate">{sku.branch_code}</span>
                </div>
                {allMonthsYYYYMM.map(m => {
                  const qty = sku.activeMap.get(m);
                  const isActive = qty !== undefined;
                  const colorClass = isActive ? COLORS[sku.demand_pattern] : "bg-gray-800/30";
                  
                  return (
                    <div 
                      key={m} 
                      className={`w-4 h-3 shrink-0 rounded-[2px] transition-colors ${colorClass} hover:ring-1 hover:ring-white/80 cursor-crosshair`}
                      title={isActive ? `Tháng: ${m}\nSản lượng: ${qty}\nNhóm: ${sku.demand_pattern}` : `Tháng: ${m}\nKhông có phát sinh`}
                    />
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
