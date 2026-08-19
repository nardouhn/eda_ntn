"use client";

import { useEffect, useRef, useState } from "react";
import { EdaOverview } from "./eda-overview";
import { EdaSku } from "./eda-sku";
import { EdaBranch } from "./eda-branch";
import { EdaBranchSku } from "./eda-branch-sku";
import { EdaRegion } from "./eda-region";
import { EdaPatternSet } from "./eda-pattern-set";
import { EdaForecastSegments } from "./eda-forecast-segments";
import { EdaBranchForecast } from "./eda-branch-forecast";


const EDA_TABLE_PAGE_SIZE = 10;

export function EdaModule() {
  const [activeTab, setActiveTab] = useState("overview");
  const [regionDrilldown, setRegionDrilldown] = useState<string | null>(null);


  const edaContentRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const root = edaContentRef.current;
  if (!root) return;

  let animationFrame: number | null = null;

  const cleanupPagination = () => {
    root
      .querySelectorAll<HTMLElement>("[data-eda-table-pagination='true']")
      .forEach((pager) => pager.remove());

    root
      .querySelectorAll<HTMLTableRowElement>("table tbody > tr")
      .forEach((row) => row.style.removeProperty("display"));
  };

  const paginateTables = () => {
    cleanupPagination();

    root.querySelectorAll<HTMLTableElement>("table").forEach((table) => {
      const rows = Array.from(
        table.querySelectorAll<HTMLTableRowElement>("tbody > tr")
      ).filter((row) => row.closest("table") === table);

      if (rows.length <= EDA_TABLE_PAGE_SIZE) return;

      const totalPages = Math.ceil(rows.length / EDA_TABLE_PAGE_SIZE);
      let currentPage = 1;

      const pager = document.createElement("div");
      pager.dataset.edaTablePagination = "true";
      pager.setAttribute("role", "navigation");
      pager.setAttribute("aria-label", "Phân trang bảng EDA");

      pager.style.cssText = [
        "display:flex",
        "align-items:center",
        "justify-content:space-between",
        "gap:12px",
        "flex-wrap:wrap",
        "padding:10px 12px",
        "margin-top:8px",
        "border:1px solid var(--border-color, #233a4c)",
        "border-radius:8px",
        "background:var(--bg-secondary, #0d1d2c)",
        "color:var(--fg-muted, #7f9aaf)",
        "font-size:12px",
      ].join(";");

      const rowInfo = document.createElement("span");
      rowInfo.style.whiteSpace = "nowrap";

      const controls = document.createElement("div");
      controls.style.cssText =
        "display:flex;align-items:center;gap:8px;flex-wrap:wrap";

      const previousButton = document.createElement("button");
      previousButton.type = "button";
      previousButton.textContent = "← Trước";

      const pageSelect = document.createElement("select");
      pageSelect.style.cssText = [
        "min-width:96px",
        "padding:5px 8px",
        "border:1px solid var(--border-color, #233a4c)",
        "border-radius:6px",
        "background:var(--bg-primary, #08131f)",
        "color:var(--fg-primary, #ecf7ff)",
        "cursor:pointer",
      ].join(";");

      for (let page = 1; page <= totalPages; page += 1) {
        const option = document.createElement("option");
        option.value = String(page);
        option.textContent = `Trang ${page} / ${totalPages}`;
        pageSelect.appendChild(option);
      }

      const nextButton = document.createElement("button");
      nextButton.type = "button";
      nextButton.textContent = "Sau →";

      const stylePagerButton = (button: HTMLButtonElement) => {
        button.style.cssText = [
          "padding:5px 10px",
          "border:1px solid var(--border-color, #233a4c)",
          "border-radius:6px",
          "background:var(--bg-primary, #08131f)",
          "color:var(--fg-primary, #ecf7ff)",
          "font-size:12px",
        ].join(";");
      };

      stylePagerButton(previousButton);
      stylePagerButton(nextButton);

      const renderPage = (page: number) => {
        currentPage = Math.min(Math.max(page, 1), totalPages);

        const startIndex =
          (currentPage - 1) * EDA_TABLE_PAGE_SIZE;

        const endIndex = Math.min(
          startIndex + EDA_TABLE_PAGE_SIZE,
          rows.length
        );

        rows.forEach((row, rowIndex) => {
          row.style.display =
            rowIndex >= startIndex && rowIndex < endIndex
              ? ""
              : "none";
        });

        rowInfo.textContent =
          `Hiển thị ${startIndex + 1}–${endIndex} / ${rows.length} dòng`;

        pageSelect.value = String(currentPage);

        previousButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages;

        [previousButton, nextButton].forEach((button) => {
          button.style.opacity = button.disabled ? "0.45" : "1";
          button.style.cursor =
            button.disabled ? "not-allowed" : "pointer";
        });
      };

      previousButton.addEventListener("click", () =>
        renderPage(currentPage - 1)
      );

      nextButton.addEventListener("click", () =>
        renderPage(currentPage + 1)
      );

      pageSelect.addEventListener("change", () => {
        renderPage(Number(pageSelect.value));
      });

      controls.append(
        previousButton,
        pageSelect,
        nextButton
      );

      pager.append(rowInfo, controls);

      table.insertAdjacentElement("afterend", pager);

      renderPage(1);
    });
  };

  const observer = new MutationObserver((mutations) => {
    const hasRelevantMutation = mutations.some((mutation) => {
      const target = mutation.target;

      return !(
        target instanceof Element &&
        target.closest("[data-eda-table-pagination='true']")
      );
    });

    if (!hasRelevantMutation || animationFrame !== null) return;

    animationFrame = window.requestAnimationFrame(() => {
      animationFrame = null;

      observer.disconnect();

      paginateTables();

      observer.observe(root, {
        childList: true,
        subtree: true,
      });
    });
  });

  paginateTables();

  observer.observe(root, {
    childList: true,
    subtree: true,
  });

  return () => {
    observer.disconnect();

    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame);
    }

    cleanupPagination();
  };
}, [activeTab, regionDrilldown]);

  const sidebarItems = [
    { id: "overview", label: "Tổng quan" },
    { id: "sku", label: "SKU" },
    { id: "branch", label: "Chi nhánh" },
    { id: "branch_forecast", label: "Tương tác & Cụm CN" },
    { id: "branch_sku", label: "SKU × Chi nhánh" },
    { id: "region", label: "Vùng" },
    { id: "pattern_set", label: "Bộ mẫu" },
    { id: "forecast_segments", label: "Phân khúc Forecast" },
  ];

  return (
    <section className="module eda-module">
      <div className="module-heading">
        <div>
          <p className="eyebrow">MODULE 02</p>
          <h2>EDA chuyên sâu</h2>
        </div>
      </div>
      
      <div className="eda-workspace">
        <aside className="eda-sidebar">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setRegionDrilldown(null); setActiveTab(item.id); }}
              style={{
                textAlign: 'left',
                padding: '10px 16px',
                background: activeTab === item.id ? 'var(--bg-accent, #f4f4f5)' : 'transparent',
                color: activeTab === item.id ? 'var(--fg-primary, #09090b)' : 'var(--fg-muted, #71717a)',
                fontWeight: activeTab === item.id ? 500 : 400,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '14px'
              }}
            >
              {item.label}
            </button>
          ))}
        </aside>
        
        <div className="eda-content" ref={edaContentRef}>
          {activeTab === 'overview' && <EdaOverview />}
          {activeTab === 'sku' && <EdaSku />}
          {activeTab === 'branch' && (regionDrilldown
            ? <EdaRegion initialDrillRegion={regionDrilldown} onDrillBack={() => { setRegionDrilldown(null); setActiveTab('region'); }} />
            : <EdaBranch />)}
          {activeTab === 'branch_sku' && <EdaBranchSku branchCode="__ALL__" />}
          {activeTab === 'branch_forecast' && <EdaBranchForecast />}
          {activeTab === 'region' && <EdaRegion onRegionDrillDown={(region) => { setRegionDrilldown(region); setActiveTab('branch'); }} />}
          {activeTab === 'pattern_set' && <EdaPatternSet />}
          {activeTab === 'forecast_segments' && <EdaForecastSegments />}
        </div>
      </div>
      <style jsx>{`
        .eda-module { display: flex; flex-direction: column; min-width: 0; height: 100%; }
        .eda-workspace { display: flex; flex-grow: 1; gap: 24px; min-width: 0; margin-top: 24px; }
        .eda-sidebar { display: flex; flex: 0 0 200px; flex-direction: column; gap: 4px; min-width: 0; padding-right: 16px; border-right: 1px solid var(--border-color, #eaeaea); }
        .eda-sidebar button { flex: none; white-space: nowrap; }
        .eda-content { flex: 1 1 auto; min-width: 0; }
        @media (max-width: 1100px) {
          .eda-workspace { flex-direction: column; gap: 14px; margin-top: 16px; }
          .eda-sidebar { flex-basis: auto; width: 100%; flex-direction: row; overflow-x: auto; padding: 0 0 10px; border-right: 0; border-bottom: 1px solid var(--border-color, #eaeaea); scrollbar-width: thin; }
          .eda-content { width: 100%; }
        }
      `}</style>
    </section>
  );
}
