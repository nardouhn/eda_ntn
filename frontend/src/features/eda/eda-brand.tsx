import type { Branch } from "@/lib/types";

export function EdaBrand({ branchCode }: { branchCode: string }) {
  return (
    <div className="panel">
      <div className="panel-title">
        <div>
          <p className="eyebrow">THƯƠNG HIỆU</p>
          <h3>Phân tích Thương hiệu</h3>
        </div>
      </div>
      <p className="empty">Nội dung Thương hiệu (Sắp ra mắt)</p>
    </div>
  );
}
