# Forecast vintage operations

Module Forecast lưu từng lần publication như một **vintage bất biến**, thay vì ghi đè forecast đang chạy.

## Data contract

- Grain bắt buộc: `vintage × base_sku × branch_code × target_month`.
- CSV UTF-8/BOM cần các cột: `forecast_origin`, `target_month`, `horizon`, `base_sku`, `branch_code`, `forecast_m2`.
- `target_month` là ngày đầu tháng và phải đúng `forecast_origin + horizon`.
- Một CSV chỉ có một `forecast_origin`; mỗi cặp Base SKU × branch có đủ toàn bộ horizon; không có khóa trùng; `forecast_m2 >= 0`.
- Các cột WorkFinals B06 như `forecast_m2_original`, `bottom_up_pair_m2`, `direct_branch_m2`, `scale_factor`, `behavior_route`, `lifecycle_state`, `method`, `is_forecasted`, `cap_binding`, `reconciliation_method` được nhận nếu có.

## Lifecycle

`draft → validated → promoted`

- Endpoint import tạo `draft`, nạp pair-month và các summary Branch/SKU/Portfolio, đối soát tổng, rồi mới đổi sang `validated` trong cùng transaction.
- `promote` chuyển vintage promoted cũ sang `superseded`; dữ liệu pair-month không bị sửa hoặc xóa.
- `draft`, `validated`, `rejected` không xuất hiện ở API đọc frontend. Frontend chỉ thấy `promoted` và `superseded` trong Diagnostics.

## Deploy database and backend

1. Áp dụng [`005_forecast_vintages.sql`](../database/migrations/005_forecast_vintages.sql) vào **đúng** Supabase project theo quy trình migration của đội. Migration chưa được tự chạy bởi code deploy.
2. Cấu hình backend/Railway:

```text
FORECAST_IMPORT_TOKEN=<random-long-secret>
FORECAST_UPLOAD_MAX_BYTES=26214400
```

`FORECAST_IMPORT_TOKEN` chỉ ở backend. Tuyệt đối không đưa vào `NEXT_PUBLIC_*`, Vercel frontend, CSV hay GitHub.

3. Cài dependency backend mới (`python-multipart`) và deploy backend trước frontend.

## Import and promote

Ví dụ chỉ thực hiện từ máy/quy trình có secret (PowerShell):

```powershell
$headers = @{ "X-Forecast-Import-Token" = $env:FORECAST_IMPORT_TOKEN; "X-Forecast-Import-Actor" = "forecast-admin" }
$form = @{ file = Get-Item .\forecast_pair_reconciled_2026Q3.csv; vintage_key = "wf_b06_2026q3"; primary_signal = "Reconciled R2_CAP30" }
Invoke-RestMethod -Method Post -Uri "https://<backend>/api/v1/forecast/vintages/import" -Headers $headers -Form $form
Invoke-RestMethod -Method Post -Uri "https://<backend>/api/v1/forecast/vintages/wf_b06_2026q3/promote" -Headers $headers
```

Import trả `checksum`, tổng m², số row/pair/branch/SKU. Chỉ promote sau khi các số này được đối chiếu với artifact nguồn. `409`/`422` nghĩa là không có dữ liệu nào bị ghi đè.

## Frontend behavior

- Forecast thử `GET /api/v1/forecast/vintages/manifest` và tải chi tiết branch theo vintage.
- Khi database/API chưa được deploy, nó giữ static WorkFinals B06 như fallback hiển thị rõ `B06 static fallback`.
- Diagnostics cho phép chọn vintage `promoted` hoặc `superseded`; người xem không thể upload/promote từ frontend.
