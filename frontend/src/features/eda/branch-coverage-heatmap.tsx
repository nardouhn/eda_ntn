"use client";

import { useEffect, useState, useMemo } from "react";
import { apiGet } from "@/lib/api";

type CoverageRow = {
  month: string;
  branch_code: string;
  total_skus: number;
  active_skus: number;
  coverage_pct: number;
};

export function BranchCoverageHeatmap() {
  const [data, setData] = useState<CoverageRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // API không cần branch_code filter vì heatmap thể hiện TẤT CẢ các chi nhánh trên trục Y
    apiGet<CoverageRow[]>("/eda/branch-coverage")
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const { months, branches, matrix } = useMemo(() => {
    if (!data) return { months: [], branches: [], matrix: new Map() };
    
    const mSet = new Set<string>();
    const bSet = new Set<string>();
    const mat = new Map<string, CoverageRow>();

    data.forEach((row) => {
      const mStr = row.month.slice(0, 7); // Format "YYYY-MM"
      mSet.add(mStr);
      bSet.add(row.branch_code);
      mat.set(`${row.branch_code}_${mStr}`, row);
    });

    const sortedMonths = Array.from(mSet).sort();
    
    // Fill gaps in months to ensure a continuous X axis
    let continuousMonths: string[] = [];
    if (sortedMonths.length > 0) {
      const [startYear, startMonth] = sortedMonths[0].split('-').map(Number);
      const [endYear, endMonth] = sortedMonths[sortedMonths.length - 1].split('-').map(Number);
      
      let y = startYear;
      let m = startMonth;
      while (y < endYear || (y === endYear && m <= endMonth)) {
        continuousMonths.push(`${y}-${String(m).padStart(2, '0')}`);
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }
    }

    return {
      months: continuousMonths,
      branches: Array.from(bSet).sort(),
      matrix: mat,
    };
  }, [data]);

  // Color generator for heatmap cells (Emerald palette)
  const getBackgroundColor = (pct: number) => {
    if (pct === 0) return "rgba(31, 41, 55, 1)"; // gray-800 for 0%
    // To ensure visibility even at low percentages, base opacity is 0.15 + scaling
    const opacity = 0.15 + (pct / 100) * 0.85; 
    return `rgba(16, 185, 129, ${opacity})`;
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-500 animate-pulse gap-3">
        <div className="w-8 h-8 border-4 border-gray-700 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-sm">Đang tính toán ma trận bao phủ (Coverage Heatmap)...</p>
      </div>
    );
  }

  if (error) {
    return <div className="h-48 flex items-center justify-center text-red-400 bg-red-500/10 rounded-md text-sm border border-red-500/20">Lỗi tải dữ liệu: {error}</div>;
  }

  if (!data || data.length === 0 || months.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-500 text-sm italic">Không có dữ liệu Coverage</div>;
  }

  return (
    <div className="flex flex-col gap-4 mt-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] font-semibold text-gray-400">Tỷ lệ SKU Active theo Chi nhánh & Thời gian</h4>
        
        {/* Heatmap Legend */}
        <div className="hidden sm:flex items-center gap-1 text-[10px] text-gray-500">
          <span>0%</span>
          <div className="flex h-2.5 w-24 mx-2 rounded-sm overflow-hidden border border-gray-800">
            {[0, 20, 40, 60, 80, 100].map(pct => (
              <div key={pct} className="flex-1 h-full" style={{ backgroundColor: getBackgroundColor(pct) }} />
            ))}
          </div>
          <span>100%</span>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-max flex flex-col gap-1 bg-gray-900/20 p-5 rounded-lg border border-gray-800/60">
          
          {/* Header Row (Months) */}
          <div className="flex items-end gap-1 mb-6">
            <div className="w-24 shrink-0 text-[11px] font-semibold text-gray-500 pb-1 uppercase tracking-wider">Chi nhánh</div>
            {months.map((m, i) => {
              const isJan = m.endsWith("-01");
              const isFirstOrLast = i === 0 || i === months.length - 1;
              const showLabel = isJan || isFirstOrLast;
              
              return (
                <div key={m} className="w-8 shrink-0 flex flex-col items-center justify-end h-8 relative group">
                  {showLabel && (
                    <span className="text-[10px] text-gray-500 absolute -top-5 whitespace-nowrap -rotate-45 origin-bottom-left font-mono">
                      {isJan ? m.split('-')[0] : m.split('-')[1]}
                    </span>
                  )}
                  {/* Tooltip for header to know exactly which month */}
                  {!showLabel && (
                    <span className="text-[9px] text-gray-400 absolute -top-5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity font-mono pointer-events-none z-10">
                      {m}
                    </span>
                  )}
                  <div className={`w-px mt-auto ${isJan ? 'h-3 bg-gray-600' : 'h-1.5 bg-gray-800'}`} />
                </div>
              );
            })}
          </div>
          
          {/* Data Rows (Branches) */}
          {branches.map(b => (
            <div key={b} className="flex items-center gap-1">
              <div className="w-24 shrink-0 text-xs text-gray-400 font-mono truncate pr-2 flex items-center justify-between" title={b}>
                <span>{b}</span>
                {/* Calculate average coverage for the branch across all months to show as a mini-kpi */}
                <span className="text-[9px] text-gray-600">
                  {Math.round(months.reduce((acc, m) => acc + (matrix.get(`${b}_${m}`)?.coverage_pct ?? 0), 0) / months.length)}%
                </span>
              </div>
              
              {months.map(m => {
                const cell = matrix.get(`${b}_${m}`);
                const pct = cell?.coverage_pct ?? 0;
                const bg = cell ? getBackgroundColor(pct) : 'rgba(31, 41, 55, 0.4)';
                
                return (
                  <div 
                    key={m}
                    className="w-8 h-8 rounded-[3px] transition-colors cursor-crosshair group relative"
                    style={{ backgroundColor: bg }}
                  >
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 w-max opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="bg-gray-900 text-gray-100 text-xs rounded-md py-2 px-3 shadow-2xl border border-gray-700/80 text-center flex flex-col gap-1.5 min-w-[120px]">
                        <div className="font-semibold text-gray-300 border-b border-gray-700/50 pb-1 mb-0.5">{b} <span className="mx-1 text-gray-600">•</span> {m}</div>
                        {cell ? (
                          <>
                            <div className="text-emerald-400 font-mono text-sm">{pct}% Active</div>
                            <div className="text-[10px] text-gray-400">{cell.active_skus} / {cell.total_skus} SKU</div>
                          </>
                        ) : (
                          <div className="text-gray-500 py-1">Không có dữ liệu<br/><span className="text-[9px]">(Chưa có SKU ra mắt)</span></div>
                        )}
                      </div>
                      {/* Tooltip arrow */}
                      <div className="absolute top-full left-1/2 -ml-1.5 border-4 border-transparent border-t-gray-700/80"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
