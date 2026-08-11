"use client";

import React, { useCallback, useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ZAxis,
} from "recharts";
import { apiGet } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { ExternalFeatureInsights } from "./external-feature-insights";

const COLORS = {
  Smooth: "#10b981", // Xanh lá
  Erratic: "#f59e0b", // Vàng
  Intermittent: "#3b82f6", // Xanh dương
  Lumpy: "#ef4444", // Đỏ
  "Insufficient-New": "#94a3b8", // Xám
  "Excluded-Inactive": "#64748b",
};

interface SkuOverview {
  total_valid_skus: number;
  check_pattern_count: number;
  smooth_count: number;
  lumpy_count: number;
}

interface SkuItem {
  base_sku: string;
  sku_name: string;
  size_code: string;
  status: string;
  total_quantity: number;
  total_amount: number;
  adi: number | null;
  cv2: number | null;
  demand_pattern: string;
  is_check_pattern: boolean;
  branch_count: number;
  history_months: number | null;
  positive_months: number | null;
}

interface SkuData {
  overview: SkuOverview;
  demand_distribution: { name: string; value: number }[];
  scatter_data: {
    adi: number;
    cv2: number;
    demand_pattern: string;
    base_sku: string;
  }[];
  sku_list: SkuItem[];
  thresholds: {
    adi: number;
    cv2: number;
    min_history_months: number;
    min_positive_months: number;
    inactive_recent_months: number;
    updated_at: string;
  };
  pattern_source: string;
  methodology: string;
}

export function EdaSku() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SkuData | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | undefined> = {};
      if (searchQuery) params.search = searchQuery;
      params.status = status;

      const response = await apiGet<SkuData>("/eda/sku/overview", params);
      setData(response);
    } catch {
      setError("Không thể tải dữ liệu Phân mảnh SKU.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const {
    overview,
    demand_distribution,
    scatter_data,
    sku_list,
    thresholds,
    pattern_source,
    methodology,
  } = data || {};

  if (error)
    return (
      <section className="module">
        <div className="error-banner">{error}</div>
      </section>
    );

  return (
    <section className="module">
      <div className="module-heading">
        <div>
          <h2>Demand Pattern theo SKU</h2>
          <p className="subtitle">
            Đồng bộ từ latest episode Base SKU × Chi nhánh · ADI/CV² dùng trọng
            số lịch sử và ngưỡng chung
          </p>
        </div>
      </div>

      {/* TÌM KIẾM */}
      <div style={{ marginBottom: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="🔍 Tìm SKU theo mã hoặc tên..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            background: "#0d1d2c",
            color: "#ecf7ff",
            border: "1px solid #233a4c",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <select
          aria-label="Lọc trạng thái SKU"
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          style={{
            minWidth: "180px",
            background: "#0d1d2c",
            color: "#ecf7ff",
            border: "1px solid #233a4c",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "14px",
          }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Vô hiệu hóa</option>
        </select>
      </div>

      {/* KPI BÁO CÁO NHANH */}
      <div
        className="kpi-grid"
        style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        <article>
          <span>📦 Base SKU</span>
          <strong>
            {loading
              ? "..."
              : (overview?.total_valid_skus || 0).toLocaleString()}
          </strong>
        </article>
        <article>
          <span>🚨 Cần rà soát</span>
          <strong style={{ color: "#ef4444" }}>
            {loading
              ? "..."
              : (overview?.check_pattern_count || 0).toLocaleString()}
          </strong>
        </article>
        <article>
          <span>🟢 Tần suất đều (Smooth)</span>
          <strong style={{ color: "#10b981" }}>
            {loading ? "..." : (overview?.smooth_count || 0).toLocaleString()}
          </strong>
        </article>
        <article>
          <span>🔴 Rủi ro cao (Lumpy)</span>
          <strong style={{ color: "#f59e0b" }}>
            {loading ? "..." : (overview?.lumpy_count || 0).toLocaleString()}
          </strong>
        </article>
      </div>

      <div className="panel" style={{ marginBottom: "16px", padding: "12px 16px" }}>
        <p style={{ margin: 0, color: "#9db4c4", fontSize: "11px" }}>
          <strong style={{ color: "#16d8c2" }}>Nguồn pattern:</strong>{" "}
          {pattern_source || "—"} · Ngưỡng ADI {thresholds?.adi ?? "—"} · CV²{" "}
          {thresholds?.cv2 ?? "—"} · Tối thiểu {thresholds?.min_history_months ?? "—"}
          T lịch sử / {thresholds?.min_positive_months ?? "—"}T có demand dương.
          {methodology ? ` ${methodology}` : ""}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.5fr",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        {/* PIE CHART - TỶ TRỌNG NHÓM */}
        <div className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">PHÂN BỔ</p>
              <h3>Cơ cấu Nhóm Nhu cầu</h3>
            </div>
          </div>
          {loading ? (
            <div
              className="empty"
              style={{ padding: "40px", textAlign: "center" }}
            >
              ⏳ Đang tính toán...
            </div>
          ) : demand_distribution && demand_distribution.length > 0 ? (
            <div style={{ height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demand_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={(props: { name?: string; percent?: number }) =>
                      `${props.name ?? ""} (${((props.percent ?? 0) * 100).toFixed(0)}%)`
                    }
                  >
                    {demand_distribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          COLORS[entry.name as keyof typeof COLORS] || "#ccc"
                        }
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: unknown) => [`${String(value)} SKU`, "Số lượng"]}
                    contentStyle={{
                      backgroundColor: "#0b1927",
                      border: "1px solid #233a4c",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              className="empty"
              style={{ padding: "40px", textAlign: "center" }}
            >
              Không có dữ liệu phân loại
            </div>
          )}
        </div>

        {/* SCATTER CHART - BẢN ĐỒ TỌA ĐỘ */}
        <div className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">
                BẢN ĐỒ ROLL-UP (ADI={thresholds?.adi ?? "—"}, CV²={thresholds?.cv2 ?? "—"})
              </p>
              <h3>Ngưỡng tham chiếu dùng chung</h3>
            </div>
          </div>
          {loading ? (
            <div
              className="empty"
              style={{ padding: "40px", textAlign: "center" }}
            >
              ⏳ Đang vẽ bản đồ...
            </div>
          ) : scatter_data && scatter_data.length > 0 ? (
            <div style={{ height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 20, left: -20 }}
                >
                  <CartesianGrid stroke="#1d3547" strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="adi"
                    name="ADI"
                    stroke="#7f9aaf"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="cv2"
                    name="CV²"
                    stroke="#7f9aaf"
                    tick={{ fontSize: 12 }}
                  />
                  <ZAxis type="number" range={[40, 40]} />
                  <RechartsTooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={{
                      backgroundColor: "#0b1927",
                      border: "1px solid #233a4c",
                      borderRadius: "8px",
                    }}
                    formatter={(value: unknown, name: unknown) => [
                      String(value),
                      name === "adi" ? "Độ thưa thớt (ADI)" : "Biến động (CV²)",
                    ]}
                    labelFormatter={() => ""}
                  />
                  <ReferenceLine
                    x={thresholds?.adi}
                    stroke="#ff526a"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{
                      position: "top",
                      value: `ADI=${thresholds?.adi}`,
                      fill: "#ff526a",
                      fontSize: 11,
                    }}
                  />
                  <ReferenceLine
                    y={thresholds?.cv2}
                    stroke="#ff526a"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{
                      position: "right",
                      value: `CV²=${thresholds?.cv2}`,
                      fill: "#ff526a",
                      fontSize: 11,
                    }}
                  />

                  {/* 4 Nhóm Dữ Liệu */}
                  <Scatter
                    name="Smooth"
                    data={scatter_data.filter(
                      (d) => d.demand_pattern === "Smooth"
                    )}
                    fill={COLORS["Smooth"]}
                    opacity={0.6}
                  />
                  <Scatter
                    name="Erratic"
                    data={scatter_data.filter(
                      (d) => d.demand_pattern === "Erratic"
                    )}
                    fill={COLORS["Erratic"]}
                    opacity={0.6}
                  />
                  <Scatter
                    name="Intermittent"
                    data={scatter_data.filter(
                      (d) => d.demand_pattern === "Intermittent"
                    )}
                    fill={COLORS["Intermittent"]}
                    opacity={0.6}
                  />
                  <Scatter
                    name="Lumpy"
                    data={scatter_data.filter(
                      (d) => d.demand_pattern === "Lumpy"
                    )}
                    fill={COLORS["Lumpy"]}
                    opacity={0.6}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              className="empty"
              style={{ padding: "40px", textAlign: "center" }}
            >
              Không có điểm dữ liệu
            </div>
          )}
        </div>
      </div>

      {/* BẢNG SKU CHI TIẾT */}
      <div className="panel">
        <div className="panel-title">
          <div>
            <p className="eyebrow">DANH SÁCH HÀNH ĐỘNG</p>
            <h3>Thông số Kỹ thuật Chuỗi</h3>
          </div>
        </div>
        {loading ? (
          <div
            className="empty"
            style={{ padding: "40px", textAlign: "center" }}
          >
            ⏳ Đang tải...
          </div>
        ) : sku_list && sku_list.length > 0 ? (
          <div className="table-scroll" style={{ maxHeight: "500px" }}>
            <table className="data-table" style={{ minWidth: "100%" }}>
              <thead>
                <tr>
                  <th style={{ fontSize: "11px" }}>Mã SKU Base</th>
                  <th style={{ fontSize: "11px" }}>Tên sản phẩm</th>
                  <th style={{ fontSize: "11px", textAlign: "center" }}>Trạng thái</th>
                  <th style={{ fontSize: "11px", textAlign: "right" }}>
                    Sản lượng (M²)
                  </th>
                  <th style={{ fontSize: "11px", textAlign: "center" }}>ADI</th>
                  <th style={{ fontSize: "11px", textAlign: "center" }}>CV²</th>
                  <th style={{ fontSize: "11px", textAlign: "center" }}>Chi nhánh</th>
                  <th style={{ fontSize: "11px", textAlign: "center" }}>Lịch sử</th>
                  <th style={{ fontSize: "11px", textAlign: "center" }}>
                    Phân Nhóm
                  </th>
                  <th style={{ fontSize: "11px", textAlign: "center" }}>
                    Cảnh báo
                  </th>
                </tr>
              </thead>
              <tbody>
                {sku_list.map((sku) => (
                  <tr key={sku.base_sku}>
                    <td style={{ fontSize: "11px" }}>
                      <strong style={{ color: "#16d8c2" }}>
                        {sku.base_sku}
                      </strong>
                    </td>
                    <td style={{ fontSize: "11px" }}>
                      {sku.sku_name || sku.base_sku}
                    </td>
                    <td style={{ fontSize: "11px", textAlign: "center" }}>
                      <span className={`status ${sku.status === "Hoạt động" ? "active" : "inactive"}`}>
                        {sku.status}
                      </span>
                    </td>
                    <td className="number-cell" style={{ fontSize: "11px" }}>
                      {formatNumber(sku.total_quantity)}
                    </td>
                    <td
                      style={{
                        fontSize: "11px",
                        textAlign: "center",
                        color: "#7f9aaf",
                        fontFamily: "monospace",
                      }}
                    >
                      {sku.adi ?? "—"}
                    </td>
                    <td
                      style={{
                        fontSize: "11px",
                        textAlign: "center",
                        color: "#7f9aaf",
                        fontFamily: "monospace",
                      }}
                    >
                      {sku.cv2 ?? "—"}
                    </td>
                    <td style={{ fontSize: "11px", textAlign: "center" }}>
                      {sku.branch_count}
                    </td>
                    <td style={{ fontSize: "11px", textAlign: "center" }}>
                      {sku.history_months ?? "—"}T / {sku.positive_months ?? "—"}T dương
                    </td>
                    <td style={{ fontSize: "11px", textAlign: "center" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "10px",
                          fontWeight: "bold",
                          backgroundColor: `${
                            COLORS[sku.demand_pattern as keyof typeof COLORS]
                          }22`,
                          color:
                            COLORS[sku.demand_pattern as keyof typeof COLORS],
                        }}
                      >
                        {sku.demand_pattern}
                      </span>
                    </td>
                    <td style={{ fontSize: "11px", textAlign: "center" }}>
                      {sku.is_check_pattern && (
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            backgroundColor: "#ef4444",
                            color: "#fff",
                            fontWeight: "bold",
                          }}
                        >
                          🚨 Cần Check Pattern
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">Không có dữ liệu</div>
        )}
      </div>
      <ExternalFeatureInsights level="sku" />
    </section>
  );
}
