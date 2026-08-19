"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Sparkline } from "@/components/charts";
import { apiGet } from "@/lib/api";
import { formatMonth, formatNumber } from "@/lib/format";
import type {
  Branch,
  ItemRow,
  Variant,
} from "@/lib/types";


type Props = {
  branches: Branch[];
  branchCode: string;
  onBranchChange: (value: string) => void;
};


type HistoryPoint = {
  month: string;
  value: number;
};


type HistoryResponse = {
  base_sku: string;
  branch_code: string;
  start_month: string;
  end_month: string;
  items: HistoryPoint[];
};


export function ItemsModule({
  branches,
  branchCode,
  onBranchChange,
}: Props) {
  const uniqueBranches = useMemo(
    () => [
      ...new Map(
        branches.map((branch) => [
          branch.branch_code,
          branch,
        ])
      ).values(),
    ],
    [branches]
  );


  // ============================================================
  // FILTER STATE
  // ============================================================

  const [query, setQuery] = useState("");

  const deferredQuery = useDeferredValue(query);

  const [status, setStatus] = useState("all");


  // ============================================================
  // MAIN TABLE STATE
  // ============================================================

  const [data, setData] = useState<{
    items: ItemRow[];
    total: number;
    data_as_of_month: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null
  );


  // ============================================================
  // SKU DETAIL STATE
  // ============================================================

  const [selected, setSelected] =
    useState<ItemRow | null>(null);

  const [variants, setVariants] =
    useState<Variant[]>([]);

  const [history, setHistory] =
    useState<HistoryPoint[]>([]);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [detailError, setDetailError] =
    useState<string | null>(null);


  // ============================================================
  // LOAD SKU LIST
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    setLoading(true);

    apiGet<{
      items: ItemRow[];
      total: number;
      data_as_of_month: string;
    }>("/items", {
      q: deferredQuery,
      branch_code: branchCode,
      status,
      page_size: 50,
    })
      .then((response) => {
        if (cancelled) return;

        setData(response);

        setError(null);
      })
      .catch((reason: Error) => {
        if (cancelled) return;

        setError(reason.message);
      })
      .finally(() => {
        if (cancelled) return;

        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    branchCode,
    deferredQuery,
    status,
  ]);


  // ============================================================
  // OPEN SKU DETAIL
  // ============================================================

  async function openSkuDetail(
    item: ItemRow
  ) {
    setSelected(item);

    setVariants([]);

    setHistory([]);

    setDetailError(null);

    setDetailLoading(true);

    const encodedSku =
      encodeURIComponent(item.base_sku);

    try {
      const [
        variantResult,
        historyResult,
      ] = await Promise.allSettled([
        apiGet<{
          items: Variant[];
        }>(
          `/items/${encodedSku}/variants`,
          {
            branch_code:
              item.branch_code,
          }
        ),

        apiGet<HistoryResponse>(
          `/items/${encodedSku}/history`,
          {
            branch_code:
              item.branch_code,

            start_month:
              "2024-01-01",

            end_month:
              "2026-06-01",
          }
        ),
      ]);


      // --------------------------------------------------------
      // VARIANTS
      // --------------------------------------------------------

      if (
        variantResult.status ===
        "fulfilled"
      ) {
        setVariants(
          variantResult.value.items
        );
      }


      // --------------------------------------------------------
      // HISTORY
      // --------------------------------------------------------

      if (
        historyResult.status ===
        "fulfilled"
      ) {
        setHistory(
          historyResult.value.items
        );
      }


      // --------------------------------------------------------
      // ERROR HANDLING
      // --------------------------------------------------------

      if (
        variantResult.status ===
          "rejected" &&
        historyResult.status ===
          "rejected"
      ) {
        setDetailError(
          "Không thể tải thông tin chi tiết SKU."
        );
      } else if (
        variantResult.status ===
        "rejected"
      ) {
        setDetailError(
          "Không thể tải danh sách mã Bravo của SKU."
        );
      } else if (
        historyResult.status ===
        "rejected"
      ) {
        setDetailError(
          "Không thể tải lịch sử nhu cầu của SKU."
        );
      }
    } catch {
      setDetailError(
        "Không thể tải chi tiết SKU."
      );
    } finally {
      setDetailLoading(false);
    }
  }


  // ============================================================
  // CLOSE DETAIL
  // ============================================================

  function closeSkuDetail() {
    setSelected(null);

    setVariants([]);

    setHistory([]);

    setDetailError(null);

    setDetailLoading(false);
  }


  // ============================================================
  // MONTH COLUMNS
  // ============================================================

  const months =
    data?.items[0]?.trend.map(
      (point) => point.month
    ) ?? [];


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section className="module">

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="module-heading">
        <div>
          <p className="eyebrow">
            MODULE 01
          </p>

          <h2>
            Danh mục và lịch sử SKU
          </h2>
        </div>

        <div className="result-count">
          {formatNumber(
            data?.total ?? 0
          )}{" "}
          dòng phù hợp
        </div>
      </div>


      {/* ====================================================== */}
      {/* FILTERS */}
      {/* ====================================================== */}

      <div className="filters">

        <input
          value={query}
          onChange={(event) => {
            setLoading(true);

            setQuery(
              event.target.value
            );
          }}
          placeholder="Tìm SKU hoặc tên sản phẩm..."
          aria-label="Tìm SKU"
        />


        <select
          value={branchCode}
          onChange={(event) => {
            setLoading(true);

            closeSkuDetail();

            onBranchChange(
              event.target.value
            );
          }}
        >
          <option value="__ALL__">
            Tất cả chi nhánh
          </option>

          {uniqueBranches.map(
            (branch) => (
              <option
                key={`items-branch-${branch.branch_code}-${branch.branch_name}`}
                value={
                  branch.branch_code
                }
              >
                {branch.branch_code}
                {" · "}
                {branch.branch_name}
              </option>
            )
          )}
        </select>


        <select
          value={status}
          onChange={(event) => {
            setLoading(true);

            closeSkuDetail();

            setStatus(
              event.target.value
            );
          }}
        >
          <option value="all">
            Tất cả trạng thái
          </option>

          <option value="active">
            Đang hoạt động
          </option>

          <option value="inactive">
            Vô hiệu hóa
          </option>
        </select>


        <button
          className="secondary"
          onClick={() => {
            setLoading(true);

            setQuery("");

            setStatus("all");

            closeSkuDetail();

            onBranchChange(
              "__ALL__"
            );
          }}
        >
          Đặt lại
        </button>

      </div>


      {/* ====================================================== */}
      {/* MAIN ERROR */}
      {/* ====================================================== */}

      {error ? (
        <div className="error-banner">
          {error}
        </div>
      ) : null}


      {/* ====================================================== */}
      {/* SKU TABLE */}
      {/* ====================================================== */}

      <div className="table-card">

        <div className="table-scroll">

          <table className="data-table sku-table">

            <colgroup>

              <col className="sku-column" />

              <col className="branch-column" />

              <col className="variant-count-column" />

              <col className="trend-column" />

              {months.map(
                (month) => (
                  <col
                    key={`items-month-column-${month}`}
                    className="month-column"
                  />
                )
              )}

            </colgroup>


            <thead>

              <tr>

                <th>
                  Mã SKU · Tên sản phẩm
                </th>

                <th>
                  Mã Chi nhánh
                </th>

                <th>
                  Số biến thể

                  <small>
                    Hoạt động / Tổng
                  </small>
                </th>

                <th>
                  Xu hướng TT 12 tháng
                </th>

                {months.map(
                  (month) => (
                    <th
                      key={`items-month-header-${month}`}
                    >
                      {formatMonth(
                        month
                      )}

                      <small>
                        Sản lượng
                      </small>
                    </th>
                  )
                )}

              </tr>

            </thead>


            <tbody>

              {/* LOADING */}

              {loading ? (
                <tr>
                  <td
                    colSpan={
                      4 +
                      months.length
                    }
                    className="empty"
                  >
                    Đang tải dữ liệu từ
                    Supabase…
                  </td>
                </tr>
              ) : null}


              {/* EMPTY */}

              {!loading &&
              !data?.items.length ? (
                <tr>
                  <td
                    colSpan={
                      4 +
                      months.length
                    }
                    className="empty"
                  >
                    Không có SKU theo bộ
                    lọc hiện tại.
                  </td>
                </tr>
              ) : null}


              {/* DATA */}

              {!loading &&
                data?.items.map(
                  (item) => {
                    const isSelected =
                      selected?.base_sku ===
                        item.base_sku &&
                      selected?.branch_code ===
                        item.branch_code;

                    return (
                      <tr
                        key={`${item.base_sku}-${item.branch_code}`}
                        onClick={() =>
                          openSkuDetail(
                            item
                          )
                        }
                        className={`${
                          isSelected
                            ? "selected "
                            : ""
                        }${
                          item.status ===
                          "Hoạt động"
                            ? "sku-active"
                            : "sku-inactive"
                        }`}
                        style={{
                          cursor:
                            "pointer",
                        }}
                      >

                        {/* SKU */}

                        <td className="item-cell">

                          <strong
                            className={
                              item.status ===
                              "Vô hiệu hóa"
                                ? "inactive-name"
                                : ""
                            }
                          >
                            {
                              item.base_sku
                            }
                          </strong>

                          <span
                            className={
                              item.status ===
                              "Vô hiệu hóa"
                                ? "inactive-name"
                                : ""
                            }
                          >
                            {item.sku_name ??
                              "Chưa có tên"}
                          </span>

                        </td>


                        {/* BRANCH */}

                        <td className="branch-cell">
                          {item.branch_code ??
                            "—"}
                        </td>


                        {/* VARIANT COUNT */}

                        <td className="variant-count-cell">

                          <strong className="variant-ratio">

                            <span>
                              {
                                item.active_variant_count
                              }
                            </span>

                            /

                            {
                              item.variant_count
                            }

                          </strong>

                        </td>


                        {/* SPARKLINE */}

                        <td>

                          <Sparkline
                            values={item.trend.map(
                              (point) =>
                                point.value
                            )}
                          />

                        </td>


                        {/* MONTH VALUES */}

                        {item.trend.map(
                          (point) => (
                            <td
                              key={`items-cell-${item.base_sku}-${item.branch_code}-${point.month}`}
                              className="number-cell"
                            >
                              {formatNumber(
                                point.value
                              )}
                            </td>
                          )
                        )}

                      </tr>
                    );
                  }
                )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ====================================================== */}
      {/* SKU DETAIL */}
      {/* ====================================================== */}

      {selected ? (

        <aside className="detail-panel">


          {/* ================================================== */}
          {/* DETAIL HEADER */}
          {/* ================================================== */}

          <div className="detail-title">

            <div>

              <p className="eyebrow">
                SKU ĐANG CHỌN TẠI{" "}
                {
                  selected.branch_code
                }
              </p>

              <h3>
                {selected.base_sku}
              </h3>

              <p>
                {selected.sku_name ??
                  "Chưa có tên"}
              </p>

            </div>


            <button
              className="icon-button"
              onClick={
                closeSkuDetail
              }
            >
              Đóng
            </button>

          </div>


          {/* ================================================== */}
          {/* DETAIL ERROR */}
          {/* ================================================== */}

          {detailError ? (

            <div
              className="error-banner"
              style={{
                marginBottom:
                  "16px",
              }}
            >
              {detailError}
            </div>

          ) : null}


          {/* ================================================== */}
          {/* HISTORY CHART */}
          {/* ================================================== */}

          <div
            className="panel"
            style={{
              marginBottom:
                "16px",
            }}
          >

            <div className="panel-title">

              <div>

                <p className="eyebrow">
                  LỊCH SỬ NHU CẦU
                  {" · "}
                  01/2024 – 06/2026
                </p>

                <h3>
                  Nhu cầu theo tháng
                </h3>

                <p className="subtitle">

                  Base SKU{" "}

                  <strong>
                    {
                      selected.base_sku
                    }
                  </strong>

                  {" · "}

                  Chi nhánh{" "}

                  <strong>
                    {
                      selected.branch_code
                    }
                  </strong>

                </p>

              </div>

            </div>


            {/* CHART LOADING */}

            {detailLoading ? (

              <div
                className="empty"
                style={{
                  padding: "40px",
                  textAlign:
                    "center",
                }}
              >
                Đang tải lịch sử
                nhu cầu…
              </div>

            ) : history.length >
              0 ? (

              <div
                style={{
                  width: "100%",
                  height: "320px",
                }}
              >

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <LineChart
                    data={history}
                    margin={{
                      top: 16,
                      right: 24,
                      bottom: 12,
                      left: 8,
                    }}
                  >

                    {/* GRID */}

                    <CartesianGrid
                      stroke="#1d3547"
                      strokeDasharray="3 3"
                    />


                    {/* X */}

                    <XAxis
                      dataKey="month"
                      stroke="#7f9aaf"
                      tick={{
                        fontSize: 11,
                      }}
                      interval={2}
                      minTickGap={12}
                      tickFormatter={(
                        value
                      ) =>
                        formatMonth(
                          String(
                            value
                          )
                        )
                      }
                    />


                    {/* Y */}

                    <YAxis
                      stroke="#7f9aaf"
                      width={78}
                      tick={{
                        fontSize: 11,
                      }}
                      tickFormatter={(
                        value
                      ) =>
                        formatNumber(
                          Number(
                            value
                          )
                        )
                      }
                    />


                    {/* TOOLTIP */}

                    <Tooltip
                      labelFormatter={(
                        label
                      ) =>
                        formatMonth(
                          String(
                            label
                          )
                        )
                      }
                      formatter={(
                        value
                      ) => [
                        `${formatNumber(
                          Number(
                            value
                          )
                        )} M²`,
                        "Sản lượng",
                      ]}
                      contentStyle={{
                        backgroundColor:
                          "#0b1927",
                        border:
                          "1px solid #233a4c",
                        borderRadius:
                          "8px",
                        color:
                          "#ecf7ff",
                      }}
                    />


                    {/* LINE */}

                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Sản lượng"
                      stroke="#16d8c2"
                      strokeWidth={
                        2.5
                      }
                      dot={false}
                      activeDot={{
                        r: 4,
                      }}
                    />

                  </LineChart>

                </ResponsiveContainer>

              </div>

            ) : (

              <div
                className="empty"
                style={{
                  padding: "40px",
                  textAlign:
                    "center",
                }}
              >
                Không có dữ liệu từ
                01/2024 đến 06/2026.
              </div>

            )}

          </div>


          {/* ================================================== */}
          {/* BRAVO SKU VARIANTS */}
          {/* ================================================== */}

          <div
            className="panel-title"
            style={{
              marginTop:
                "8px",
            }}
          >

            <div>

              <p className="eyebrow">
                CÁC MÃ THUỘC BASE SKU
              </p>

              <h3>
                Mã Bravo SKU
              </h3>

            </div>

            {!detailLoading ? (

              <div className="result-count">
                {formatNumber(
                  variants.length
                )}{" "}
                mã
              </div>

            ) : null}

          </div>


          {detailLoading &&
          variants.length === 0 ? (

            <div
              className="empty"
              style={{
                padding: "30px",
                textAlign:
                  "center",
              }}
            >
              Đang tải danh sách
              mã Bravo…
            </div>

          ) : null}


          {!detailLoading &&
          variants.length === 0 ? (

            <div
              className="empty"
              style={{
                padding: "30px",
                textAlign:
                  "center",
              }}
            >
              Không có mã Bravo
              cho SKU này.
            </div>

          ) : null}


          <div className="variant-grid">

            {variants.map(
              (
                variant,
                index
              ) => (

                <article
                  key={`items-variant-${selected.base_sku}-${selected.branch_code}-${variant.bravo_sku}-${index}`}
                  className="variant-card"
                >

                  <span
                    className={`status-dot ${
                      variant.status ===
                      "Hoạt động"
                        ? "active"
                        : "inactive"
                    }`}
                  />


                  <div>

                    <strong>
                      {
                        variant.bravo_sku
                      }
                    </strong>

                    <p>
                      {variant.sku_name ??
                        "Mã Bravo SKU"}
                    </p>

                    <small>
                      Bán dương cuối:{" "}

                      {variant.last_positive_sale_month
                        ? formatMonth(
                            variant.last_positive_sale_month
                          )
                        : "—"}
                    </small>

                  </div>


                  <span
                    className={`status-text ${
                      variant.status ===
                      "Hoạt động"
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    {variant.status}
                  </span>

                </article>

              )
            )}

          </div>

        </aside>

      ) : null}

    </section>
  );
}
