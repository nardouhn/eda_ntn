"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from "recharts";
import { apiGet } from "@/lib/api";
import { formatNumber, formatMonth } from "@/lib/format";
import { ExternalFeatureInsights } from "./external-feature-insights";

// Hàm format tiền tệ cục bộ
const formatCurrencyLocal = (value: number | null | undefined) => {
  if (!value) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

interface Kpis {
  total_base_skus: number;
  total_bravo_skus: number;
  total_branches: number;
  total_quantity: number;
  total_amount: number;
  data_as_of: string;
  data_from: string;
}

interface TrendItem {
  month: string;
  total_quantity: number;
  total_amount: number;
  active_skus: number;
  active_branches: number;
  quantity_normalized?: number;
  amount_normalized?: number;
  skus_normalized?: number;
}

interface ProductItem {
  base_sku: string;
  sku_name: string;
  size_code: string;
  total_quantity: number;
  total_amount: number;
}

interface ProportionItem {
  name: string;
  value: number;
}

interface OverviewData {
  kpis: Kpis;
  trend: TrendItem[];
  top_products: ProductItem[];
  region_proportion: ProportionItem[];
  branch_proportion: ProportionItem[];
  pattern_proportion: ProportionItem[];
}

interface Branch {
  branch: string;
  branch_name: string;
  region: string;
  branch_status: string;
}

interface FilterOptions {
  branches: Branch[];
  regions: string[];
  sku_statuses: string[];
  branch_statuses: string[];
}

// Bảng màu cho các biểu đồ tỷ trọng (Dark mode compatible)
const COLORS = [
  "#16d8c2",
  "#23afff",
  "#ffc14d",
  "#ff7373",
  "#a855f7",
  "#facc15",
  "#4ade80",
  "#f472b6",
  "#38bdf8",
  "#fb923c",
];

export function EdaOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OverviewData | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null
  );

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedSkuStatus, setSelectedSkuStatus] = useState<string>("");
  const [selectedBranchStatus, setSelectedBranchStatus] = useState<string>("");

  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Tải danh sách Options cho các bộ lọc
  const fetchFilters = async () => {
    try {
      const response = await apiGet<FilterOptions>("/eda/filters");
      setFilterOptions(response);
    } catch (err) {
      console.error("Không thể tải filters:", err);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  // ==========================================
  // XỬ LÝ LỌC DATA (DEBOUNCED FETCH)
  // ==========================================
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (selectedBranch) queryParams.append("branch_code", selectedBranch);
        if (selectedRegion) queryParams.append("region", selectedRegion);
        if (selectedSkuStatus)
          queryParams.append("sku_status", selectedSkuStatus);
        if (selectedBranchStatus)
          queryParams.append("branch_status", selectedBranchStatus);

        // Chỉ search text tự do nếu người dùng chưa chốt 1 chi nhánh cụ thể
        if (searchQuery && !selectedBranch)
          queryParams.append("search", searchQuery);

        const url = `/eda/overview?${queryParams.toString()}`;
        const response = await apiGet<OverviewData>(url);
        setData(response);
      } catch (err) {
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [
    selectedBranch,
    selectedRegion,
    selectedSkuStatus,
    selectedBranchStatus,
    searchQuery,
  ]);

  // Đóng box tìm kiếm khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lọc chi nhánh theo từ khóa
  const filteredBranches = useMemo(() => {
    if (!filterOptions?.branches) return [];
    if (!searchQuery.trim()) return filterOptions.branches;
    const query = searchQuery.toLowerCase().trim();
    return filterOptions.branches.filter(
      (b) =>
        b.branch_name?.toLowerCase().includes(query) ||
        b.branch?.toLowerCase().includes(query)
    );
  }, [filterOptions?.branches, searchQuery]);

  // ==========================================
  // LOGIC KHÓA CHÉO BỘ LỌC (INTERLOCK)
  // ==========================================
  const handleSelectBranch = (branch: Branch) => {
    setSelectedBranch(branch.branch);
    setSearchQuery(`${branch.branch} - ${branch.branch_name}`);
    setShowSuggestions(false);

    // Khóa Nhóm B
    setSelectedRegion("");
    setSelectedBranchStatus("");
  };

  const handleSkuStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSkuStatus(e.target.value);

    // Khóa Nhóm B
    setSelectedRegion("");
    setSelectedBranchStatus("");
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRegion(e.target.value);

    // Khóa Nhóm A
    setSelectedBranch("");
    setSearchQuery("");
    setSelectedSkuStatus("");
  };

  const handleBranchStatusChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedBranchStatus(e.target.value);

    // Khóa Nhóm A
    setSelectedBranch("");
    setSearchQuery("");
    setSelectedSkuStatus("");
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedBranch("");
    setSelectedRegion("");
    setSelectedSkuStatus("");
    setSelectedBranchStatus("");
  };

  // ==========================================
  // XỬ LÝ DỮ LIỆU HIỂN THỊ
  // ==========================================
  const {
    kpis,
    trend,
    top_products,
    region_proportion,
    branch_proportion,
    pattern_proportion,
  } = data || {};

  const maxQuantity = useMemo(() => {
    if (!trend || trend.length === 0) return 1;
    return Math.max(...trend.map((d) => d.total_quantity));
  }, [trend]);

  const maxAmount = useMemo(() => {
    if (!trend || trend.length === 0) return 1;
    return Math.max(...trend.map((d) => d.total_amount));
  }, [trend]);

  const maxSkus = useMemo(() => {
    if (!trend || trend.length === 0) return 1;
    return Math.max(...trend.map((d) => d.active_skus));
  }, [trend]);

  const normalizedTrend = useMemo(() => {
    if (!trend || trend.length === 0) return [];
    return trend.map((d) => ({
      ...d,
      quantity_normalized: (d.total_quantity / maxQuantity) * 100,
      amount_normalized: (d.total_amount / maxAmount) * 100,
      skus_normalized: (d.active_skus / maxSkus) * 100,
    }));
  }, [trend, maxQuantity, maxAmount, maxSkus]);

  // Ép hiển thị 1 chi nhánh nếu đang search đích danh 1 chi nhánh
  const displayBranches = selectedBranch ? 1 : kpis?.total_branches || 0;

  if (error) {
    return (
      <section className="module">
        <div className="error-banner">{error}</div>
      </section>
    );
  }

  return (
    <section className="module">
      <div className="module-heading">
        <div>
          <h2>Tổng quan EDA</h2>
          <p className="subtitle">
            Phân tích Phân bổ Doanh thu: Vùng miền, Chi nhánh và Bộ mẫu
          </p>
        </div>
      </div>

      {/* KHU VỰC BỘ LỌC */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr 1fr auto",
          gap: "8px",
          marginBottom: "16px",
          padding: "12px 16px",
          background: "#0a1b2a",
          borderRadius: "8px",
          border: "1px solid #233a4c",
        }}
      >
        {/* KHUNG TÌM KIẾM CHI NHÁNH */}
        <div ref={searchRef} style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="🔍 Nhóm A: Tìm chi nhánh..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
              if (!e.target.value) {
                setSelectedBranch("");
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            style={{
              width: "100%",
              background: "#0d1d2c",
              color: "#ecf7ff",
              border: "1px solid #233a4c",
              borderRadius: "6px",
              padding: "6px 28px 6px 10px", // Tăng padding-right để chừa chỗ cho nút X
              fontSize: "13px",
              outline: "none",
            }}
          />

          {/* NÚT X (CLEAR TÌM KIẾM) */}
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedBranch("");
                setShowSuggestions(true);
              }}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "#7f9aaf",
                fontSize: "16px",
                cursor: "pointer",
                padding: "0 4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}

          {/* DANH SÁCH GỢI Ý CHI NHÁNH */}
          {showSuggestions && filteredBranches.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#0d1d2c",
                border: "1px solid #233a4c",
                borderRadius: "6px",
                marginTop: "4px",
                maxHeight: "200px",
                overflowY: "auto",
                zIndex: 1000,
              }}
            >
              {filteredBranches.map((branch) => (
                <div
                  key={branch.branch}
                  onClick={() => handleSelectBranch(branch)}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid #1a2d3e",
                    fontSize: "13px",
                    color: "#ecf7ff",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#1a2d3e";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <strong style={{ color: "#16d8c2" }}>{branch.branch}</strong>
                  <span style={{ color: "#7f9aaf", marginLeft: "8px" }}>
                    {branch.branch_name}
                  </span>
                  <span
                    style={{
                      float: "right",
                      color: "#7f9aaf",
                      fontSize: "11px",
                    }}
                  >
                    {branch.region || "N/A"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <select
          value={selectedSkuStatus}
          onChange={handleSkuStatusChange}
          style={{
            background: "#0d1d2c",
            color: "#ecf7ff",
            border: "1px solid #233a4c",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "13px",
            outline: "none",
          }}
        >
          <option value="">📦 Nhóm A: TT SKU</option>
          {(filterOptions?.sku_statuses || []).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={selectedRegion}
          onChange={handleRegionChange}
          style={{
            background: "#0d1d2c",
            color: "#ecf7ff",
            border: "1px solid #233a4c",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "13px",
            outline: "none",
          }}
        >
          <option value="">🌍 Nhóm B: Vùng</option>
          {(filterOptions?.regions || []).map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>

        <select
          value={selectedBranchStatus}
          onChange={handleBranchStatusChange}
          style={{
            background: "#0d1d2c",
            color: "#ecf7ff",
            border: "1px solid #233a4c",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "13px",
            outline: "none",
          }}
        >
          <option value="">🏢 Nhóm B: TT Chi nhánh</option>
          {(filterOptions?.branch_statuses || []).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <button
          onClick={handleResetFilters}
          style={{
            background: "transparent",
            color: "#7f9aaf",
            border: "1px solid #233a4c",
            borderRadius: "6px",
            padding: "6px 12px",
            fontSize: "13px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          🔄 Đặt lại
        </button>
      </div>

      {/* KPIs */}
      <div
        className="kpi-grid"
        style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        <article>
          <span>📦 SKU Base</span>
          <strong>
            {loading ? "..." : formatNumber(kpis?.total_base_skus || 0)}
          </strong>
          <small>
            {loading ? "..." : formatNumber(kpis?.total_bravo_skus || 0)} bravo
            SKU
          </small>
        </article>
        <article>
          <span>🏢 Chi nhánh</span>
          <strong>{loading ? "..." : displayBranches}</strong>
        </article>
        <article>
          <span>📐 Số lượng (M²)</span>
          <strong>
            {loading ? "..." : formatNumber(kpis?.total_quantity || 0)}
          </strong>
        </article>
        <article>
          <span>💰 Doanh thu</span>
          <strong>
            {loading ? "..." : formatCurrencyLocal(kpis?.total_amount || 0)}
          </strong>
        </article>
      </div>

      {/* TỶ LỆ BÁN - CƠ CẤU DOANH THU */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        {/* 1. Theo Vùng Miền */}
        <div className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">TỶ LỆ BÁN</p>
              <h3>Theo Vùng Miền</h3>
            </div>
          </div>
          {loading ? (
            <div
              className="empty"
              style={{ padding: "40px", textAlign: "center" }}
            >
              ⏳ Đang tải...
            </div>
          ) : region_proportion && region_proportion.length > 0 ? (
            <div style={{ height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={region_proportion}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={(props: any) =>
                      `${props.name} ${(props.percent * 100).toFixed(0)}%`
                    }
                  >
                    {region_proportion?.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: any) => [
                      formatCurrencyLocal(Number(value)),
                      "Doanh thu",
                    ]}
                    contentStyle={{
                      backgroundColor: "#0b1927",
                      border: "1px solid #233a4c",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              className="empty"
              style={{ padding: "40px", textAlign: "center" }}
            >
              Không có dữ liệu tỷ trọng
            </div>
          )}
        </div>

        {/* 2. Theo Top 10 Chi Nhánh */}
        <div className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">TỶ LỆ BÁN</p>
              <h3>Top Chi Nhánh</h3>
            </div>
          </div>
          {loading ? (
            <div
              className="empty"
              style={{ padding: "40px", textAlign: "center" }}
            >
              ⏳ Đang tải...
            </div>
          ) : branch_proportion && branch_proportion.length > 0 ? (
            <div style={{ height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={branch_proportion}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    stroke="#1d3547"
                    strokeDasharray="3 3"
                    horizontal={false}
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{ fill: "#7f9aaf", fontSize: 11 }}
                  />
                  <RechartsTooltip
                    formatter={(value: any) => [
                      formatCurrencyLocal(Number(value)),
                      "Doanh thu",
                    ]}
                    contentStyle={{
                      backgroundColor: "#0b1927",
                      border: "1px solid #233a4c",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#23afff"
                    radius={[0, 4, 4, 0]}
                    barSize={12}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              className="empty"
              style={{ padding: "40px", textAlign: "center" }}
            >
              Không có dữ liệu tỷ trọng
            </div>
          )}
        </div>

        {/* 3. Theo Bộ Mẫu */}
        <div className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">TỶ LỆ BÁN</p>
              <h3>Theo Bộ Mẫu</h3>
            </div>
          </div>
          {loading ? (
            <div
              className="empty"
              style={{ padding: "40px", textAlign: "center" }}
            >
              ⏳ Đang tải...
            </div>
          ) : pattern_proportion && pattern_proportion.length > 0 ? (
            <div style={{ height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pattern_proportion}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={(props: any) =>
                      `${props.name} ${(props.percent * 100).toFixed(0)}%`
                    }
                  >
                    {pattern_proportion?.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[(index + 3) % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: any) => [
                      formatCurrencyLocal(Number(value)),
                      "Doanh thu",
                    ]}
                    contentStyle={{
                      backgroundColor: "#0b1927",
                      border: "1px solid #233a4c",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              className="empty"
              style={{ padding: "40px", textAlign: "center" }}
            >
              Không có dữ liệu tỷ trọng
            </div>
          )}
        </div>
      </div>

      {/* BIỂU ĐỒ MOVEMENT */}
      <div className="panel" style={{ marginBottom: "12px" }}>
        <div className="panel-title">
          <div>
            <p className="eyebrow">MOVEMENT</p>
            <h3>Xu hướng theo tháng</h3>
          </div>
          <div className="result-count">
            {kpis?.data_as_of
              ? `📅 Tính đến ${formatMonth(kpis.data_as_of)}`
              : ""}
          </div>
        </div>
        {loading ? (
          <div
            className="empty"
            style={{ padding: "20px", textAlign: "center" }}
          >
            ⏳ Đang tải dữ liệu, vui lòng chờ...
          </div>
        ) : normalizedTrend && normalizedTrend.length > 0 ? (
          <div style={{ height: "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={normalizedTrend}>
                <CartesianGrid stroke="#1d3547" strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(val: any) => formatMonth(val)}
                  stroke="#7f9aaf"
                />
                <YAxis stroke="#7f9aaf" domain={[0, 100]} />
                <RechartsTooltip
                  labelFormatter={(label: any) => formatMonth(label)}
                  contentStyle={{
                    backgroundColor: "#0b1927",
                    border: "1px solid #233a4c",
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === "Số lượng (M²)")
                      return [
                        formatNumber(
                          trend?.find(
                            (d) =>
                              d.month ===
                              normalizedTrend.find(
                                (t: any) => t.quantity_normalized === value
                              )?.month
                          )?.total_quantity || 0
                        ),
                        name,
                      ];
                    if (name === "Doanh thu")
                      return [
                        formatCurrencyLocal(
                          trend?.find(
                            (d) =>
                              d.month ===
                              normalizedTrend.find(
                                (t: any) => t.amount_normalized === value
                              )?.month
                          )?.total_amount || 0
                        ),
                        name,
                      ];
                    if (name === "SKU hoạt động")
                      return [
                        formatNumber(
                          trend?.find(
                            (d) =>
                              d.month ===
                              normalizedTrend.find(
                                (t: any) => t.skus_normalized === value
                              )?.month
                          )?.active_skus || 0
                        ),
                        name,
                      ];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar
                  dataKey="quantity_normalized"
                  fill="#16d8c288"
                  name="Số lượng (M²)"
                  barSize={20}
                />
                <Line
                  type="monotone"
                  dataKey="amount_normalized"
                  stroke="#23afff"
                  name="Doanh thu"
                  strokeWidth={2}
                  dot={{ fill: "#23afff" }}
                />
                <Line
                  type="monotone"
                  dataKey="skus_normalized"
                  stroke="#ffc14d"
                  name="SKU hoạt động"
                  strokeWidth={2}
                  dot={{ fill: "#ffc14d" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty">
            Không có dữ liệu phù hợp với bộ lọc hiện tại.
          </div>
        )}
      </div>

      {/* BẢNG TOP SẢN PHẨM */}
      <div className="panel">
        <div className="panel-title">
          <div>
            <p className="eyebrow">TOP</p>
            <h3>Top sản phẩm</h3>
          </div>
        </div>
        {loading ? (
          <div
            className="empty"
            style={{ padding: "20px", textAlign: "center" }}
          >
            ⏳ Đang tải...
          </div>
        ) : top_products && top_products.length > 0 ? (
          <div className="table-scroll" style={{ maxHeight: "400px" }}>
            <table className="data-table" style={{ minWidth: "auto" }}>
              <thead>
                <tr>
                  <th style={{ fontSize: "12px" }}>Mã SKU</th>
                  <th style={{ fontSize: "12px" }}>Tên sản phẩm</th>
                  <th style={{ fontSize: "12px" }}>Kích thước</th>
                  <th style={{ fontSize: "12px", textAlign: "right" }}>
                    SL (M²)
                  </th>
                  <th style={{ fontSize: "12px", textAlign: "right" }}>
                    Doanh thu
                  </th>
                </tr>
              </thead>
              <tbody>
                {top_products.map((product) => (
                  <tr key={product.base_sku}>
                    <td style={{ fontSize: "12px" }}>
                      <strong style={{ color: "#16d8c2" }}>
                        {product.base_sku}
                      </strong>
                    </td>
                    <td style={{ fontSize: "12px" }}>
                      {product.sku_name || product.base_sku}
                    </td>
                    <td style={{ fontSize: "12px" }}>
                      {product.size_code || "N/A"}
                    </td>
                    <td className="number-cell" style={{ fontSize: "12px" }}>
                      {formatNumber(product.total_quantity)}
                    </td>
                    <td className="number-cell" style={{ fontSize: "12px" }}>
                      {formatCurrencyLocal(product.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">Không có dữ liệu cho bảng xếp hạng.</div>
        )}
      </div>
      <ExternalFeatureInsights level="overview" />
    </section>
  );
}
