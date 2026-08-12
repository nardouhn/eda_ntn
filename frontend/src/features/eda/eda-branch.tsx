"use client";

import React, { useCallback, useState, useEffect } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Line,
} from "recharts";
import { apiGet } from "@/lib/api";
import { formatNumber, formatMonth } from "@/lib/format";
import { ExternalFeatureInsights } from "./external-feature-insights";

const PARETO_COLORS: Record<string, string> = {
  "Nhóm A (Khối lượng lớn)": "#10b981", // Xanh lá
  "Nhóm B (Khá)": "#23afff", // Xanh dương
  "Nhóm C (Thấp)": "#ef4444", // Đỏ
};

interface BranchOverview {
  total_branches: number;
  total_skus: number;
  total_quantity: number;
  total_amount: number;
}

interface RegionAnalysis {
  region: string;
  branch_count: number;
  sku_count: number;
  total_quantity: number;
  total_amount: number;
  avg_price_per_m2: number;
}

interface SkuCoverage {
  branch: string;
  branch_name: string;
  sku_count: number;
  total_quantity: number;
}

interface BranchPerformance {
  branch: string;
  branch_name: string;
  region: string;
  sku_count: number;
  total_quantity: number;
  total_amount: number;
  active_months: number;
  volume_per_sku: number;
  pareto_group: string;
  status: string;
}

interface BranchData {
  overview: BranchOverview;
  region_analysis: RegionAnalysis[];
  sku_coverage: SkuCoverage[];
  branch_performance: BranchPerformance[];
}

interface BranchDetail {
  branch_info?: {
    branch_name?: string;
    region?: string;
    sku_count?: number;
    total_quantity?: number;
    total_amount?: number;
    status?: string;
  };
  trend?: {
    month: string;
    quantity: number;
    total_amount: number;
    sku_count: number;
  }[];
  top_skus?: {
    base_sku: string;
    sku_name: string;
    size_code: string;
    quantity: number;
    total_amount: number;
  }[];
}

export function EdaBranch() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BranchData | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [branchDetail, setBranchDetail] = useState<BranchDetail | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | undefined> = {};
      if (searchQuery) params.search = searchQuery;
      params.status = status;

      const response = await apiGet<BranchData>("/eda/branch/overview", params);
      setData(response);
    } catch (err) {
      setError("Không thể tải dữ liệu chi nhánh.");
      console.error(err);
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

  const fetchBranchDetail = async (branch: string) => {
    try {
      const response = await apiGet<BranchDetail>(
        `/eda/branch/detail/${branch}`,
        { status }
      );
      setBranchDetail(response);
      setSelectedBranch(branch);
    } catch (err) {
      console.error("Không thể tải chi tiết chi nhánh:", err);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const { overview, region_analysis, sku_coverage, branch_performance } =
    data || {};

  if (error) {
    return (
      <section className="module">
        <div className="error-banner">{error}</div>
      </section>
    );
  }

  return (
    <section className="module">
      {/* Header */}
      <div className="module-heading">
        <div>
          <h2>Phân tích Mạng lưới Chi nhánh</h2>
          <p className="subtitle">
            Báo cáo Hiệu suất Sản lượng, Phủ hàng và Phân nhóm Pareto (ABC)
          </p>
        </div>
        <div className="result-count">
          {loading
            ? "Đang tải..."
            : `${overview?.total_branches ?? 0} Chi nhánh`}
        </div>
      </div>

      {/* Search */}
      <div
        style={{
          marginBottom: "16px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="🔍 Tìm chi nhánh theo tên hoặc mã..."
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
          aria-label="Lọc trạng thái chi nhánh"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as typeof status);
            setSelectedBranch(null);
            setBranchDetail(null);
          }}
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

      {/* KPIs TỔNG QUAN */}
      <div
        className="kpi-grid"
        style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        <article>
          <span>🏢 Chi nhánh theo bộ lọc</span>
          <strong>
            {loading ? "..." : (overview?.total_branches || 0).toLocaleString()}
          </strong>
        </article>
        <article>
          <span>📦 SKU theo bộ lọc</span>
          <strong>
            {loading ? "..." : (overview?.total_skus || 0).toLocaleString()}
          </strong>
        </article>
        <article>
          <span>📐 Tổng sản lượng (M²)</span>
          <strong>
            {loading ? "..." : formatNumber(overview?.total_quantity || 0)}
          </strong>
        </article>
        <article>
          <span>💰 Tổng doanh thu</span>
          <strong>
            {loading ? "..." : formatCurrency(overview?.total_amount)}
          </strong>
        </article>
      </div>

      {/* CHARTS SÂU HƠN: VÙNG MIỀN VÀ ĐỘ PHỦ SKU */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        {/* 1. Phân tích Vùng miền: So sánh Sản lượng vs Giá bán trung bình / M2 */}
        <div className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">HIỆU SUẤT VÙNG</p>
              <h3>Sản lượng (M²) & Giá bán TB/M² theo Vùng</h3>
            </div>
          </div>
          {loading ? (
            <div
              className="empty"
              style={{ padding: "40px", textAlign: "center" }}
            >
              ⏳ Đang tải...
            </div>
          ) : region_analysis && region_analysis.length > 0 ? (
            <div style={{ height: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={region_analysis}>
                  <CartesianGrid stroke="#1d3547" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="region"
                    stroke="#7f9aaf"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#16d8c2"
                    tickFormatter={(value: number) =>
                      `${(value / 1e3).toFixed(0)}k`
                    }
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#ffc14d"
                    tickFormatter={(value: number) =>
                      `${(value / 1e3).toFixed(0)}k`
                    }
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#0b1927",
                      border: "1px solid #233a4c",
                    }}
                    formatter={(value: unknown, name: unknown) => {
                      if (name === "Sản lượng (M²)")
                        return [formatNumber(Number(value)), String(name)];
                      if (name === "Giá TB / M²")
                        return [
                          `${Number(value).toLocaleString()} ₫/m²`,
                          String(name),
                        ];
                      return [String(value), String(name)];
                    }}
                    labelFormatter={(label: unknown) =>
                      `Vùng: ${String(label)}`
                    }
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="total_quantity"
                    fill="#16d8c288"
                    name="Sản lượng (M²)"
                    barSize={30}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avg_price_per_m2"
                    stroke="#ffc14d"
                    name="Giá TB / M²"
                    strokeWidth={2}
                    dot={{ fill: "#ffc14d" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty">Không có dữ liệu</div>
          )}
        </div>

        {/* 2. Top Chi nhánh đa dạng mẫu mã nhất (SKU Diversity) */}
        <div className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">ĐỘ PHỦ DANH MỤC</p>
              <h3>Top Chi nhánh có nhiều SKU nhất</h3>
            </div>
          </div>
          {loading ? (
            <div
              className="empty"
              style={{ padding: "40px", textAlign: "center" }}
            >
              ⏳ Đang tải...
            </div>
          ) : sku_coverage && sku_coverage.length > 0 ? (
            <div style={{ height: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sku_coverage} layout="vertical">
                  <CartesianGrid
                    stroke="#1d3547"
                    strokeDasharray="3 3"
                    horizontal={false}
                  />
                  <XAxis type="number" stroke="#7f9aaf" />
                  <YAxis
                    type="category"
                    dataKey="branch_name"
                    stroke="#7f9aaf"
                    width={110}
                    tick={{ fontSize: 10 }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#0b1927",
                      border: "1px solid #233a4c",
                    }}
                    formatter={(value: unknown) => [
                      `${String(value)} mã SKU`,
                      "Số mẫu đang bán",
                    ]}
                    labelFormatter={(label: unknown) =>
                      `Chi nhánh: ${String(label)}`
                    }
                  />
                  <Bar
                    dataKey="sku_count"
                    fill="#23afff"
                    radius={[0, 4, 4, 0]}
                    barSize={12}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty">Không có dữ liệu</div>
          )}
        </div>
      </div>

      {/* BẢNG HIỆU SUẤT TOÀN BỘ CHI NHÁNH + PHÂN NHÓM PARETO (ABC) THEO SẢN LƯỢNG */}
      <div className="panel">
        <div className="panel-title">
          <div>
            <p className="eyebrow">ĐÁNH GIÁ PHÂN NHÓM PARETO (ABC)</p>
            <h3>Trọng tải Kho & Phân lớp Chi nhánh theo Sản lượng</h3>
          </div>
          <div className="result-count">
            {branch_performance?.length || 0} Chi nhánh
          </div>
        </div>
        {loading ? (
          <div
            className="empty"
            style={{ padding: "40px", textAlign: "center" }}
          >
            ⏳ Đang tải...
          </div>
        ) : branch_performance && branch_performance.length > 0 ? (
          <div className="table-scroll" style={{ maxHeight: "500px" }}>
            <table className="data-table" style={{ minWidth: "100%" }}>
              <thead>
                <tr>
                  <th style={{ fontSize: "11px" }}>Mã</th>
                  <th style={{ fontSize: "11px" }}>Tên chi nhánh</th>
                  <th style={{ fontSize: "11px" }}>Vùng</th>
                  <th style={{ fontSize: "11px", textAlign: "center" }}>
                    Trạng thái
                  </th>
                  <th style={{ fontSize: "11px", textAlign: "right" }}>
                    Mẫu SKU
                  </th>
                  <th style={{ fontSize: "11px", textAlign: "right" }}>
                    Sản lượng (M²)
                  </th>
                  <th style={{ fontSize: "11px", textAlign: "right" }}>
                    Doanh thu
                  </th>
                  <th style={{ fontSize: "11px", textAlign: "right" }}>
                    Sản lượng / SKU
                  </th>
                  <th style={{ fontSize: "11px", textAlign: "center" }}>
                    Phân nhóm Pareto
                  </th>
                </tr>
              </thead>
              <tbody>
                {branch_performance.map((b) => (
                  <tr
                    key={b.branch}
                    onClick={() => fetchBranchDetail(b.branch)}
                    style={{ cursor: "pointer" }}
                  >
                    <td style={{ fontSize: "11px" }}>
                      <strong style={{ color: "#16d8c2" }}>{b.branch}</strong>
                    </td>
                    <td style={{ fontSize: "11px" }}>
                      {b.branch_name || b.branch}
                    </td>
                    <td style={{ fontSize: "11px", color: "#7f9aaf" }}>
                      {b.region}
                    </td>
                    <td style={{ fontSize: "11px", textAlign: "center" }}>
                      <span
                        className={`status ${
                          b.status === "Hoạt động" ? "active" : "inactive"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="number-cell" style={{ fontSize: "11px" }}>
                      {b.sku_count}
                    </td>
                    <td
                      className="number-cell"
                      style={{ fontSize: "11px", fontWeight: "bold" }}
                    >
                      {formatNumber(b.total_quantity)}
                    </td>
                    <td className="number-cell" style={{ fontSize: "11px" }}>
                      {formatCurrency(b.total_amount)}
                    </td>
                    <td
                      className="number-cell"
                      style={{ fontSize: "11px", color: "#23afff" }}
                    >
                      {formatNumber(b.volume_per_sku)} M²
                    </td>
                    <td style={{ fontSize: "11px", textAlign: "center" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "10px",
                          fontWeight: "bold",
                          backgroundColor: `${
                            PARETO_COLORS[b.pareto_group] || "#94a3b8"
                          }22`,
                          color: PARETO_COLORS[b.pareto_group] || "#94a3b8",
                          border: `1px solid ${
                            PARETO_COLORS[b.pareto_group] || "#94a3b8"
                          }44`,
                        }}
                      >
                        {b.pareto_group}
                      </span>
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

      {/* CHI TIẾT KHI CLICK CHỌN 1 CHI NHÁNH */}
      {selectedBranch && branchDetail && (
        <div className="detail-panel" style={{ marginTop: "12px" }}>
          <div className="detail-title">
            <div>
              <p className="eyebrow">CHI TIẾT CHI NHÁNH CHỌN</p>
              <h3>{branchDetail.branch_info?.branch_name || selectedBranch}</h3>
              <p>
                Mã: {selectedBranch} · Vùng:{" "}
                {branchDetail.branch_info?.region || "N/A"}
              </p>
            </div>
            <button
              className="icon-button"
              onClick={() => {
                setSelectedBranch(null);
                setBranchDetail(null);
              }}
            >
              Đóng
            </button>
          </div>

          <div
            className="kpi-grid"
            style={{ gridTemplateColumns: "repeat(3, 1fr)", marginTop: "12px" }}
          >
            <article>
              <span>Số SKU theo bộ lọc</span>
              <strong>{branchDetail.branch_info?.sku_count || 0}</strong>
            </article>
            <article>
              <span>Tổng sản lượng</span>
              <strong>
                {formatNumber(branchDetail.branch_info?.total_quantity)}
              </strong>
            </article>
            <article>
              <span>Tổng doanh thu</span>
              <strong>
                {formatCurrency(branchDetail.branch_info?.total_amount)}
              </strong>
            </article>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: "12px",
              marginTop: "12px",
            }}
          >
            {/* Trend Chart */}
            {branchDetail.trend && branchDetail.trend.length > 0 && (
              <div style={{ height: "250px" }}>
                <h4>Xu hướng Sản lượng & Doanh thu</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={branchDetail.trend}>
                    <CartesianGrid stroke="#1d3547" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={(value: unknown) =>
                        formatMonth(String(value))
                      }
                      stroke="#7f9aaf"
                    />
                    <YAxis yAxisId="left" stroke="#16d8c2" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#23afff"
                    />
                    <RechartsTooltip
                      labelFormatter={(value: unknown) =>
                        formatMonth(String(value))
                      }
                      contentStyle={{
                        backgroundColor: "#0b1927",
                        border: "1px solid #233a4c",
                      }}
                      formatter={(value: unknown, name: unknown) => {
                        if (name === "Sản lượng")
                          return [formatNumber(Number(value)), String(name)];
                        if (name === "Doanh thu")
                          return [formatCurrency(Number(value)), String(name)];
                        return [String(value), String(name)];
                      }}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="quantity"
                      fill="#16d8c288"
                      name="Sản lượng"
                      barSize={20}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="total_amount"
                      stroke="#23afff"
                      name="Doanh thu"
                      strokeWidth={2}
                      dot={{ fill: "#23afff" }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top SKUs in Branch */}
            {branchDetail.top_skus && branchDetail.top_skus.length > 0 && (
              <div>
                <h4>Top SKU kéo Sản lượng M²</h4>
                <div className="table-scroll" style={{ maxHeight: "250px" }}>
                  <table className="data-table" style={{ minWidth: "100%" }}>
                    <thead>
                      <tr>
                        <th style={{ fontSize: "11px" }}>Mã SKU</th>
                        <th style={{ fontSize: "11px", textAlign: "right" }}>
                          Sản lượng
                        </th>
                        <th style={{ fontSize: "11px", textAlign: "right" }}>
                          Doanh thu
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchDetail.top_skus.map((sku) => (
                        <tr key={sku.base_sku}>
                          <td style={{ fontSize: "11px" }}>
                            <strong style={{ color: "#16d8c2" }}>
                              {sku.base_sku}
                            </strong>
                          </td>
                          <td
                            className="number-cell"
                            style={{ fontSize: "11px", fontWeight: "bold" }}
                          >
                            {formatNumber(sku.quantity)}
                          </td>
                          <td
                            className="number-cell"
                            style={{ fontSize: "11px", color: "#7f9aaf" }}
                          >
                            {formatCurrency(sku.total_amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <ExternalFeatureInsights level="branch" />
    </section>
  );
}
