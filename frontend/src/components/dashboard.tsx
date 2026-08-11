"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type { Branch } from "@/lib/types";
import { ItemsModule } from "@/features/items/items-module";
import { EdaModule } from "@/features/eda/eda-module";
import { ForecastModule } from "@/features/forecast/forecast-module";

type Tab = "items" | "eda" | "forecast";

export function Dashboard() {
  const [tab, setTab] = useState<Tab>("items");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchCode, setBranchCode] = useState("__ALL__");
  const [dataAsOf, setDataAsOf] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ data_as_of_month: string; items: Branch[] }>("/metadata/branches")
      .then((response) => {
        setBranches(response.items);
        setDataAsOf(response.data_as_of_month);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">UNIS DATA WORKSPACE</p>
          <h1>SKU Analytics & Forecast</h1>
        </div>
        <div className="freshness"><span className="live-dot" /> Dữ liệu đến {dataAsOf ? dataAsOf.slice(0, 7) : "—"}</div>
      </header>

      <nav className="tabs" aria-label="Modules">
        <button className={tab === "items" ? "active" : ""} onClick={() => setTab("items")}>01 · SKU Explorer</button>
        <button className={tab === "eda" ? "active" : ""} onClick={() => setTab("eda")}>02 · EDA chuyên sâu</button>
        <button className={tab === "forecast" ? "active" : ""} onClick={() => setTab("forecast")}>03 · Forecast</button>
      </nav>

      {error ? <div className="error-banner">Không kết nối được API: {error}</div> : null}
      {tab === "items" ? <ItemsModule branches={branches} branchCode={branchCode} onBranchChange={setBranchCode} /> : null}
      {tab === "eda" ? <EdaModule /> : null}
      {tab === "forecast" ? <ForecastModule branches={branches} branchCode={branchCode} onBranchChange={setBranchCode} /> : null}
    </main>
  );
}
