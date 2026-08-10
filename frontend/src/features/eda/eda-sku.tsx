import type { Branch } from "@/lib/types";

export function EdaSku({ branchCode }: { branchCode: string }) {
  return (
    <div className="panel">
      <div className="panel-title">
        <div>
          <p className="eyebrow">SKU</p>
          <h3>Phân tích SKU</h3>
        </div>
      </div>
      <p className="empty">Nội dung SKU (Sắp ra mắt)</p>
    </div>
  );
}
