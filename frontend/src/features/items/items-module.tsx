"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Sparkline } from "@/components/charts";
import { apiGet } from "@/lib/api";
import { formatMonth, formatNumber } from "@/lib/format";
import type { Branch, ItemRow, Variant } from "@/lib/types";

type Props = { branches: Branch[]; branchCode: string; onBranchChange: (value: string) => void };

export function ItemsModule({ branches, branchCode, onBranchChange }: Props) {
  const uniqueBranches = useMemo(
    () => [...new Map(branches.map((branch) => [branch.branch_code, branch])).values()],
    [branches],
  );
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [status, setStatus] = useState("all");
  const [data, setData] = useState<{ items: ItemRow[]; total: number; data_as_of_month: string } | null>(null);
  const [selected, setSelected] = useState<ItemRow | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ items: ItemRow[]; total: number; data_as_of_month: string }>("/items", {
      q: deferredQuery,
      branch_code: branchCode,
      status, // URL query param gửi đi vẫn là 'active' / 'inactive' / 'all'
      page_size: 50,
    })
      .then((response) => {
        if (!cancelled) {
          setData(response);
          setError(null);
        }
      })
      .catch((reason: Error) => {
        if (!cancelled) setError(reason.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [branchCode, deferredQuery, status]);

  function openVariants(item: ItemRow) {
    setSelected(item);
    apiGet<{ items: Variant[] }>(
      `/items/${encodeURIComponent(item.base_sku)}/variants?branch_code=${encodeURIComponent(item.branch_code)}`
    )
      .then((response) => setVariants(response.items))
      .catch((reason: Error) => setError(reason.message));
  }

  const months = data?.items[0]?.trend.map((point) => point.month) ?? [];

  return (
    <section className="module">
      <div className="module-heading">
        <div>
          <p className="eyebrow">MODULE 01</p>
          <h2>Danh mục và lịch sử SKU</h2>
        </div>
        <div className="result-count">{formatNumber(data?.total ?? 0)} dòng phù hợp</div>
      </div>

      <div className="filters">
        <input
          value={query}
          onChange={(event) => { setLoading(true); setQuery(event.target.value); }}
          placeholder="Tìm SKU hoặc tên sản phẩm..."
          aria-label="Tìm SKU"
        />
        <select value={branchCode} onChange={(event) => { setLoading(true); onBranchChange(event.target.value); }}>
          <option value="__ALL__">Tất cả chi nhánh</option>
          {uniqueBranches.map((branch) => (
            <option key={`items-branch-${branch.branch_code}-${branch.branch_name}`} value={branch.branch_code}>
              {branch.branch_code} · {branch.branch_name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(event) => { setLoading(true); setStatus(event.target.value); }}>
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Vô hiệu hóa</option>
        </select>
        <button className="secondary" onClick={() => { setLoading(true); setQuery(""); setStatus("all"); onBranchChange("__ALL__"); }}>
          Đặt lại
        </button>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="table-card">
        <div className="table-scroll">
          <table className="data-table sku-table">
            <colgroup>
              <col className="sku-column" />
              <col className="branch-column" />
              <col className="variant-count-column" />
              <col className="trend-column" />
              {months.map((month) => <col key={`items-month-column-${month}`} className="month-column" />)}
            </colgroup>
            <thead>
              <tr>
                <th>Mã SKU · Tên sản phẩm</th>
                <th>Mã Chi nhánh</th>
                <th>Số biến thể<small>Hoạt động / Tổng</small></th>
                <th>Xu hướng TT 12 tháng</th>
                {months.map((month) => (
                  <th key={`items-month-header-${month}`}>
                    {formatMonth(month)}
                    <small>Sản lượng</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4 + months.length} className="empty">Đang tải dữ liệu từ Supabase…</td></tr>
              ) : null}
              {!loading && !data?.items.length ? (
                <tr><td colSpan={4 + months.length} className="empty">Không có SKU theo bộ lọc hiện tại.</td></tr>
              ) : null}
              {!loading && data?.items.map((item) => {
                const isSelected = selected?.base_sku === item.base_sku && selected?.branch_code === item.branch_code;

                return (
                  <tr
                    key={`${item.base_sku}-${item.branch_code}`}
                    onClick={() => openVariants(item)}
                    className={`${isSelected ? "selected " : ""}${item.status === "Hoạt động" ? "sku-active" : "sku-inactive"}`}
                  >
                    <td className="item-cell">
                      <strong className={item.status === "Vô hiệu hóa" ? "inactive-name" : ""}>
                        {item.base_sku}
                      </strong>
                      <span className={item.status === "Vô hiệu hóa" ? "inactive-name" : ""}>
                        {item.sku_name ?? "Chưa có tên"}
                      </span>
                    </td>
                    <td className="branch-cell">{item.branch_code ?? "—"}</td>
                    <td className="variant-count-cell">
                      <strong className="variant-ratio">
                        <span>{item.active_variant_count}</span>/{item.variant_count}
                      </strong>
                    </td>
                    <td>
                      <Sparkline values={item.trend.map((point) => point.value)} />
                    </td>
                    {item.trend.map((point) => (
                      <td key={`items-cell-${item.base_sku}-${item.branch_code}-${point.month}`} className="number-cell">
                        {formatNumber(point.value)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? (
        <aside className="detail-panel">
          <div className="detail-title">
            <div>
              <p className="eyebrow">SKU ĐANG CHỌN TẠI {selected.branch_code}</p>
              <h3>{selected.base_sku}</h3>
              <p>{selected.sku_name ?? "Chưa có tên"}</p>
            </div>
            <button className="icon-button" onClick={() => setSelected(null)}>Đóng</button>
          </div>
          <div className="variant-grid">
            {variants.map((variant, index) => (
              <article key={`items-variant-${selected.base_sku}-${selected.branch_code}-${variant.bravo_sku}-${index}`} className="variant-card">
                <span className={`status-dot ${variant.status === "Hoạt động" ? "active" : "inactive"}`} />
                <div>
                  <strong>{variant.bravo_sku}</strong>
                  <p>{variant.sku_name ?? "Mã Bravo SKU"}</p>
                  <small>
                    Bán dương cuối: {variant.last_positive_sale_month ? formatMonth(variant.last_positive_sale_month) : "—"}
                  </small>
                </div>
                <span className={`status-text ${variant.status === "Hoạt động" ? "active" : "inactive"}`}>
                  {variant.status}
                </span>
              </article>
            ))}
          </div>
        </aside>
      ) : null}
    </section>
  );
}
