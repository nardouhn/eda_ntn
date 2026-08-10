import type { Branch } from "@/lib/types";

export function EdaBranch({ branchCode }: { branchCode: string }) {
  return (
    <div className="panel">
      <div className="panel-title">
        <div>
          <p className="eyebrow">CHI NHÁNH</p>
          <h3>Phân tích Chi nhánh</h3>
        </div>
      </div>
      <p className="empty">Nội dung Chi nhánh (Sắp ra mắt)</p>
    </div>
  );
}
