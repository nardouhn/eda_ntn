"use client";

import { useState } from "react";
import type { Branch } from "@/lib/types";
import { EdaOverview } from "./eda-overview";
import { EdaSku } from "./eda-sku";
import { EdaBranch } from "./eda-branch";
import { EdaBranchSku } from "./eda-branch-sku";
import { EdaRegion } from "./eda-region";
import { EdaPatternSet } from "./eda-pattern-set";

export function EdaModule(props: { branches: Branch[]; branchCode: string; onBranchChange: (value: string) => void }) {
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
    <section className="module" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="module-heading">
        <div>
          <p className="eyebrow">MODULE 02</p>
          <h2>EDA chuyên sâu</h2>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '32px', marginTop: '24px', flexGrow: 1 }}>
        <aside style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '1px solid var(--border-color, #eaeaea)', paddingRight: '16px' }}>
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
        
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          {activeTab === 'overview' && <EdaOverview branches={props.branches} branchCode="__ALL__" onBranchChange={props.onBranchChange} />}
          {activeTab === 'sku' && <EdaSku branchCode="__ALL__" />}
          {activeTab === 'branch' && (regionDrilldown
            ? <EdaRegion initialDrillRegion={regionDrilldown} onDrillBack={() => { setRegionDrilldown(null); setActiveTab('region'); }} />
            : <EdaBranch branchCode="__ALL__" />)}
          {activeTab === 'branch_sku' && <EdaBranchSku branchCode="__ALL__" />}
          {activeTab === 'region' && <EdaRegion onRegionDrillDown={(region) => { setRegionDrilldown(region); setActiveTab('branch'); }} />}
          {activeTab === 'pattern_set' && <EdaPatternSet />}
        </div>
      </div>
    </section>
  );
}
