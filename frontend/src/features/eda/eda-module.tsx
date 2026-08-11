"use client";

import { useState } from "react";
import { EdaOverview } from "./eda-overview";
import { EdaSku } from "./eda-sku";
import { EdaBranch } from "./eda-branch";
import { EdaBranchSku } from "./eda-branch-sku";
import { EdaRegion } from "./eda-region";
import { EdaPatternSet } from "./eda-pattern-set";

export function EdaModule() {
  const [activeTab, setActiveTab] = useState("overview");
  const [regionDrilldown, setRegionDrilldown] = useState<string | null>(null);

  const sidebarItems = [
    { id: "overview", label: "Tổng quan" },
    { id: "sku", label: "SKU" },
    { id: "branch", label: "Chi nhánh" },
    { id: "branch_sku", label: "SKU × Chi nhánh" },
    { id: "region", label: "Vùng" },
    { id: "pattern_set", label: "Bộ mẫu" },
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
        
        <div className="eda-content">
          {activeTab === 'overview' && <EdaOverview />}
          {activeTab === 'sku' && <EdaSku />}
          {activeTab === 'branch' && (regionDrilldown
            ? <EdaRegion initialDrillRegion={regionDrilldown} onDrillBack={() => { setRegionDrilldown(null); setActiveTab('region'); }} />
            : <EdaBranch />)}
          {activeTab === 'branch_sku' && <EdaBranchSku branchCode="__ALL__" />}
          {activeTab === 'region' && <EdaRegion onRegionDrillDown={(region) => { setRegionDrilldown(region); setActiveTab('branch'); }} />}
          {activeTab === 'pattern_set' && <EdaPatternSet />}
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
