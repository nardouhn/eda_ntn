# Bộ tài liệu kỹ thuật SKU Analytics & Forecast

Phiên bản: `1.0-draft`
Ngày cập nhật: `2026-08-10`

Đây là nguồn tài liệu thống nhất để xây dựng web tra cứu SKU, EDA và dự báo theo SKU gốc × chi nhánh × tháng. Dữ liệu vận hành lấy từ Supabase; các file trong `data/` chỉ dùng để đối chiếu và không được chỉnh sửa.

## Thứ tự đọc

1. [01-PRD.md](01-PRD.md): mục tiêu sản phẩm, phạm vi và tiêu chí nghiệm thu.
2. [02-BUSINESS-RULES-AND-DATA-CONTRACT.md](02-BUSINESS-RULES-AND-DATA-CONTRACT.md): quy tắc SKU, trạng thái, quantity và thời gian.
3. [03-SYSTEM-ARCHITECTURE.md](03-SYSTEM-ARCHITECTURE.md): kiến trúc frontend/backend/Supabase và luồng dữ liệu.
4. [04-SUPABASE-DATABASE-DESIGN.md](04-SUPABASE-DATABASE-DESIGN.md): thiết kế bảng nguồn, bảng chuẩn hóa và bảng dự báo.
5. [05-API-CONTRACT.md](05-API-CONTRACT.md): hợp đồng API để frontend và backend phát triển độc lập.
6. [06-FRONTEND-MODULES.md](06-FRONTEND-MODULES.md): đặc tả giao diện Module 1, 2 và 3.
7. [07-FORECAST-SPECIFICATION.md](07-FORECAST-SPECIFICATION.md): công thức thống kê, backtest và chỉ số đánh giá.
8. [08-TESTING-SECURITY-AND-OPERATIONS.md](08-TESTING-SECURITY-AND-OPERATIONS.md): kiểm thử, bảo mật, refresh dữ liệu và bàn giao.
9. [09-WEB-LOGIC-QUICK-REFERENCE.md](09-WEB-LOGIC-QUICK-REFERENCE.md): sổ tay ngắn giải thích trạng thái, episode, ADI/CV², Demand Pattern, ABC, vòng đời và forecast đang hiển thị trên web.

## Cấu trúc mã nguồn dự kiến

```text
work1/
├── data/                       # Dữ liệu tham chiếu gốc, bất biến
├── docs/                       # Bộ tài liệu này
├── frontend/                   # Next.js + React + TypeScript
├── backend/                    # FastAPI + Python
├── database/
│   ├── migrations/             # Migration tạo schema/bảng dẫn xuất
│   └── seeds/                  # Chỉ dữ liệu mẫu, không chứa dữ liệu thật
├── .env.example                # Chỉ tên biến và giá trị giả
└── README.md
```

## Quyết định đã chốt

- SKU gốc là Group 1–4; Group 5 là đuôi màu.
- `Bravo SKU` có trong master vô hiệu hóa → vô hiệu hóa.
- `Bravo SKU` không có trong master vô hiệu hóa → đang hoạt động.
- SKU gốc đang hoạt động nếu còn ít nhất một Bravo SKU hoạt động.
- SKU gốc vô hiệu hóa khi tất cả Bravo SKU đã biết đều vô hiệu hóa.
- Module 1 mặc định hiển thị SKU gốc xanh/đỏ; có thể mở rộng hoặc chuyển sang mức Bravo SKU.
- Xu hướng 12 tháng sắp từ tháng cũ nhất bên trái đến tháng mới nhất bên phải.
- Có bộ lọc chi nhánh trong Module 1.
- Dữ liệu nguồn không bị xóa hoặc cập nhật bởi ứng dụng.

## Quyết định còn cần xác nhận

- MVP có cần Supabase Auth hay chỉ chạy nội bộ trên máy local.
- Mục tiêu forecast chính thức là gross quantity dương hay net quantity. Tài liệu hiện chọn `gross_positive_qty` làm mặc định và vẫn lưu quantity âm để EDA.
- Lịch chạy refresh dữ liệu và forecast: thủ công, hàng ngày hay hàng tháng.
