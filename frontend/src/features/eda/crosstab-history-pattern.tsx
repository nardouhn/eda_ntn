"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type CrosstabRow = {
  history_pattern: string;
  Smooth: number;
  Erratic: number;
  Intermittent: number;
  Lumpy: number;
  "Insufficient/Cold-start": number;
};

const COLORS: Record<string, string> = {
  Smooth: "#10b981", // emerald-500
  Erratic: "#f59e0b", // amber-500
  Intermittent: "#6366f1", // indigo-500
  Lumpy: "#ef4444", // red-500
  "Insufficient/Cold-start": "#4b5563", // gray-600
};

export function CrosstabHistoryPattern({ branchCode }: { branchCode: string }) {
  const [data, setData] = useState<CrosstabRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiGet<CrosstabRow[]>("/eda/crosstab-history-pattern", { 
      branch_code: branchCode === "__ALL__" ? undefined : branchCode 
    })
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [branchCode]);

  if (loading) {
    return <div className="h-48 flex flex-col items-center justify-center text-gray-500 animate-pulse gap-3">
      <div className="w-8 h-8 border-4 border-gray-700 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-sm">Đang tải dữ liệu biểu đồ...</p>
    </div>;
  }

  if (error) {
    return <div className="h-48 flex items-center justify-center text-red-400 bg-red-500/10 rounded-md text-sm border border-red-500/20">Lỗi tải dữ liệu: {error}</div>;
  }

  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-500 text-sm italic">Không có dữ liệu</div>;
  }

  // Sort patterns logically
  const order = ["Full-history", "Short-history", "Cold-start"];
  const sortedData = [...data].sort((a, b) => {
    return order.indexOf(a.history_pattern) - order.indexOf(b.history_pattern);
  });

  const categories = ["Smooth", "Erratic", "Intermittent", "Lumpy", "Insufficient/Cold-start"];

  return (
    <div className="flex flex-col gap-5 w-full mt-2">
      <div className="flex flex-col gap-4">
        {sortedData.map((row) => (
          <div key={row.history_pattern} className="flex items-center gap-4">
            <div className="w-28 text-sm font-medium text-gray-400 whitespace-nowrap">
              {row.history_pattern}
            </div>
            <div className="flex-1 h-10 flex rounded-md overflow-hidden bg-gray-800 shadow-inner">
              {categories.map((cat) => {
                const val = row[cat as keyof CrosstabRow] as number;
                if (!val || val === 0) return null;
                return (
                  <div
                    key={cat}
                    style={{ width: `${val}%`, backgroundColor: COLORS[cat] }}
                    className="h-full group relative cursor-help transition-all hover:brightness-110 border-r border-gray-900/50 last:border-r-0"
                  >
                    {/* Segment Value Label */}
                    {val > 5 && (
                      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white/95 drop-shadow-md mix-blend-overlay">
                        {val}%
                      </div>
                    )}
                    {/* Tooltip on Hover */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 w-max opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="bg-gray-900 text-gray-100 text-xs rounded py-1.5 px-3 shadow-xl border border-gray-700">
                        <span className="font-semibold block mb-0.5">{cat}</span>
                        Tỷ lệ: <span className="font-mono text-emerald-400">{val}%</span>
                      </div>
                      {/* Tooltip Arrow */}
                      <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-2 py-2 border-t border-gray-800/50">
        {categories.map((cat) => (
          <div key={cat} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: COLORS[cat] }} />
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{cat}</span>
          </div>
        ))}
      </div>

      {/* Insight Note */}
      <div className="mt-1 bg-indigo-500/5 border border-indigo-500/10 rounded-md p-3">
        <p className="text-[13px] text-gray-400 leading-relaxed">
          <strong className="text-indigo-400 font-semibold mr-1">Insight Note:</strong> 
          Phân tích chéo này giúp đánh giá rủi ro của dữ liệu lịch sử. Các SKU thuộc nhóm <strong>Cold-start</strong> hoặc <strong>Short-history</strong> thường có tính bất ổn cao (Lumpy/Erratic) và cần phương pháp dự báo chuyên biệt hoặc bù trừ rủi ro thay vì dựa hoàn toàn vào chuỗi thời gian tiêu chuẩn.
        </p>
      </div>
    </div>
  );
}
