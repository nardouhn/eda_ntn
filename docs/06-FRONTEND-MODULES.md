# Đặc tả frontend Module 1–3

## 1. Khung ứng dụng

```text
Header: tên sản phẩm | data as-of | trạng thái dữ liệu
Sidebar/Tabs:
  1. SKU Explorer
  2. EDA
  3. Forecast
Main content
Global error/loading/empty state
```

URL phải lưu filter để có thể copy/chia sẻ, ví dụ:

```text
/items?branch=015&status=active&level=base
/eda?region=mien-nam&measure=gross_positive_qty
/forecast?branch=015&from=2026-01&to=2026-12
```

## 2. Module 1 — SKU Explorer

### Mục tiêu

Tra cứu nhanh SKU đang hoạt động/vô hiệu hóa và lịch sử thực tế 12 tháng; cho phép xem sâu xuống Bravo SKU.

### Bộ lọc

```text
[Tìm SKU/tên]
[Chi nhánh: Tất cả ▼]
[Trạng thái: Tất cả | Hoạt động | Vô hiệu hóa]
[Mức hiển thị: SKU gốc | Bravo SKU]
[Measure: Bán ra | Thuần]
[Reset]
```

Chi nhánh là filter bắt buộc có trong Module 1. Module 2 không thay thế chức năng tra cứu này.

### Bảng mặc định

| Cột | Nội dung |
|---|---|
| Trạng thái | Chấm/badge xanh hoặc đỏ |
| Mã SKU – Tên sản phẩm | SKU gốc và mô tả |
| Quy cách | lấy từ size/mô tả nếu mapping đáng tin cậy |
| Chi nhánh | tên filter hiện tại hoặc `Tất cả` |
| Bravo SKU | số variant, nút mở rộng |
| Xu hướng TT 12 tháng | sparkline |
| 12 cột tháng | quantity thực tế, tháng cũ → mới |

### Màu trạng thái

- Xanh: SKU gốc còn ít nhất một Bravo SKU hoạt động.
- Đỏ: tất cả Bravo SKU đã biết đều vô hiệu hóa.
- Không dùng màu đỏ vì một chi nhánh không bán gần đây.
- Màu phải đi kèm text/icon để bảo đảm accessibility.

### Drill-down Bravo SKU

Khi mở một dòng:

```text
SKU gốc 05.L1.3060.KAG36900                       [Đang hoạt động]
├─ 05.L1.3060.KAG36900       Group5: Không có    [Đang hoạt động]
├─ 05.L1.3060.KAG36900.D     Group5: D           [Vô hiệu hóa]
└─ 05.L1.3060.KAG36900.V     Group5: V           [Đang hoạt động]
```

Không ghi “không có màu”; ghi “không có đuôi màu” để không suy diễn ngoài dữ liệu.

### Xu hướng 12 tháng

- Sparkline dùng cùng 12 giá trị với cột tháng.
- Tháng mới nhất nằm bên phải.
- Tooltip: tháng, gross quantity, returns và net quantity nếu API cung cấp.
- Missing tạo khoảng trống hoặc điểm `—`, không biến thành zero.
- Khi đổi chi nhánh, tải lại toàn bộ trend và month values theo chi nhánh.

### Trạng thái giao diện bắt buộc

- Skeleton khi tải.
- Empty state ghi rõ bộ lọc không có kết quả.
- Error state có request ID và nút thử lại.
- Badge `Dữ liệu đến tháng MM/YYYY`.
- Virtualize hàng nếu có trên 200 dòng; phân trang từ server.

## 3. Module 2 — EDA

### Mục tiêu

Giải thích dữ liệu, vòng đời SKU, độ phủ chi nhánh, mức độ ổn định và vấn đề chất lượng trước khi tin forecast.

### Global filters

```text
Khoảng tháng | Vùng | Chi nhánh (multi-select) | Trạng thái SKU
Kích thước | SKU | Measure Gross/Return/Net | Reset
```

### Tab A — Tổng quan

- KPI: SKU gốc, Bravo SKU, chi nhánh, gross M2, returns M2, net M2.
- Line chart theo tháng: gross/net/returns.
- Cơ cấu theo vùng, size và trạng thái.
- Top/bottom SKU và branch theo quantity/tăng trưởng.

### Tab B — Vòng đời & đuôi màu

- Timeline first/last sale của từng Bravo SKU trong một SKU gốc.
- Số variant hoạt động/vô hiệu hóa theo SKU gốc.
- Danh sách SKU có thay đổi variant theo thời gian.
- Recency cohort 0–3, 4–6, 7–12, trên 12 tháng.

Chú thích bắt buộc: timeline là “lịch sử quan sát giao dịch”, không phải lịch sử thay đổi trạng thái master nếu master không có event log.

### Tab C — Chi nhánh & độ phủ

- Heatmap SKU × chi nhánh.
- Số chi nhánh có phát sinh dương theo SKU.
- Cơ cấu size/SKU theo vùng.
- Pareto contribution của chi nhánh.
- So sánh nhiều chi nhánh trên cùng khoảng thời gian.

### Tab D — Nhu cầu & forecast readiness

- Trend/seasonality theo SKU hoặc branch.
- Tỷ lệ tháng có bán dương.
- ADI/CV² hoặc phân loại smooth/intermittent/erratic/lumpy.
- ABC theo gross quantity hoặc amount; XYZ theo biến động.
- Danh sách series quá ngắn, quá sparse hoặc không đủ backtest.

### Tab E — Chất lượng dữ liệu

- Tỷ lệ match Bravo SKU/master.
- SKU sai cấu trúc Group 1–5.
- Duplicate khóa.
- Branch unmatched.
- Unit ngoài M2 bị loại.
- Quantity âm, null và outlier.
- Missing month và freshness.
- Có thể tải danh sách ngoại lệ CSV; thao tác tải không sửa nguồn.

### Quy tắc biểu đồ

- Tiêu đề phải nêu measure và filter chính.
- Trục quantity ghi `M2`; amount ghi `VND`.
- Tooltip có numerator/denominator cho tỷ lệ.
- Không dùng pie chart khi có quá 6 nhóm.
- Có bảng dữ liệu thay thế cho biểu đồ quan trọng.

## 4. Module 3 — Forecast Matrix

### Mục tiêu

Trình bày forecast theo đúng cách người dùng nghiệp vụ đọc: chi nhánh/nhóm ở hàng, tháng ở cột, FC–TT–Acc ở từng tháng.

### Bộ lọc

```text
Origin | Khoảng tháng | Vùng | Chi nhánh | SKU | Trạng thái
Horizon | Phương pháp: Auto/Naive/MA/SES/... | Chỉ cảnh báo
```

### Ma trận

```text
Chi nhánh/Nhóm SP | Vùng | 01/2026        | 02/2026        | 07/2026
                  |      | FC | TT | Acc  | FC | TT | Acc  | FC | PI
```

- Hàng nhóm hiển thị tổng FC, TT và WAPE.
- Hàng con hiển thị SKU gốc.
- Quá khứ có FC từ rolling backtest, TT và Acc.
- Tương lai có FC và prediction interval; TT/Acc là `—`.
- Header phân biệt `QUÁ KHỨ` và `TƯƠNG LAI`.
- Freeze hai cột đầu; scroll ngang các tháng.
- Virtualize hàng và chỉ render nhóm đang mở.

### Acc

Ở cấp ô, chỉ hiển thị khi `TT > 0`:

```text
Acc = max(0, 1 - abs(FC - TT) / TT)
```

Khi `TT = 0` hoặc missing, hiển thị `—`. Ở hàng tổng dùng WAPE, không trung bình cộng Acc của các ô.

### Màu Acc gợi ý

- Xanh: `>= 80%`.
- Vàng: `50%–79.99%`.
- Đỏ: `< 50%`.
- `—`: xám.

Ngưỡng chỉ phục vụ hiển thị và phải có tooltip; chất lượng chính thức dựa trên WAPE/MAE/Bias.

### Drawer chi tiết forecast

- Lịch sử 12–30 tháng.
- Đường actual, fitted/backtest forecast và future forecast.
- Phương pháp/parameter được chọn.
- WAPE, MAE, Bias theo horizon.
- Lower/upper interval.
- Cảnh báo: series ngắn, intermittent, all-zero/missing, SKU inactive.

## 5. Component structure đề xuất

```text
src/
├── app/
│   ├── items/
│   ├── eda/
│   └── forecast/
├── components/
│   ├── filters/
│   ├── sku-table/
│   ├── charts/
│   ├── forecast-matrix/
│   └── ui/
├── features/
│   ├── items/
│   ├── eda/
│   └── forecast/
├── lib/
│   ├── api-client.ts
│   ├── formatters.ts
│   └── query-keys.ts
└── types/
```

Business rules không được sao chép vào nhiều component. Frontend chỉ render status và metric backend trả về.

## 6. Responsive

- Desktop >= 1280px là trải nghiệm chính.
- Tablet: filters thu gọn thành drawer; bảng vẫn scroll ngang.
- Mobile: chỉ hỗ trợ tra cứu/tổng quan rút gọn; ma trận forecast hiển thị thông báo khuyến nghị desktop.
