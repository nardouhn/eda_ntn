# Hợp đồng API v1

Base URL local:

```text
http://localhost:8000/api/v1
```

## 1. Quy ước chung

- JSON dùng `snake_case`.
- Ngày dùng ISO `YYYY-MM-DD`; tháng luôn là ngày đầu tháng.
- `branch_code`, `base_sku`, `bravo_sku` luôn là string.
- Quantity là number; API không trả `NaN`/`Infinity`.
- Missing là `null`, frontend hiển thị `—`.
- Mọi response dữ liệu có `data_as_of_month` và `pipeline_run_id`.
- Page size mặc định 50, tối đa 200.
- Sort/filter phải thực hiện ở backend/database, không tải toàn bộ rồi lọc ở trình duyệt.

Error format:

```json
{
  "error": {
    "code": "INVALID_FILTER",
    "message": "branch_code is invalid",
    "details": {},
    "request_id": "uuid"
  }
}
```

## 2. Metadata

### `GET /metadata/branches`

Query: `status=active|inactive|all`, `region`, `q`.

Response item:

```json
{
  "branch_code": "015",
  "branch_name": "Chi nhánh Vĩnh Long Unis",
  "region": "Miền Nam",
  "brand": "UNIS",
  "status": "active"
}
```

### `GET /metadata/filters`

Trả danh sách region, size, status, data range và measure hỗ trợ. Frontend không hard-code các giá trị phát sinh từ dữ liệu.

## 3. Module 1 — SKU Explorer

### `GET /items`

Query parameters:

| Tên | Giá trị |
|---|---|
| `q` | mã SKU hoặc tên |
| `branch_code` | một chi nhánh; bỏ trống = tất cả |
| `status` | `active`, `inactive`, `all` |
| `level` | `base`, `bravo`; mặc định `base` |
| `months` | mặc định 12, MVP chỉ chấp nhận 12 |
| `measure` | `gross_positive_qty`, `net_qty` |
| `page`, `page_size` | phân trang |
| `sort` | `base_sku`, `qty_12m`, `last_sale_month` |
| `order` | `asc`, `desc` |

Mặc định khi có `branch_code`: chỉ trả SKU từng được quan sát ở chi nhánh đó. Tùy chọn tương lai `include_unobserved=true` chỉ được bật khi có master assortment theo chi nhánh.

Response rút gọn:

```json
{
  "data_as_of_month": "2026-06-01",
  "pipeline_run_id": "uuid",
  "page": 1,
  "page_size": 50,
  "total": 2792,
  "items": [
    {
      "base_sku": "05.L1.3060.KAG36900",
      "sku_name": "Gạch 30x60 MS KAG36900 Loại 1",
      "status": "active",
      "active_variant_count": 1,
      "inactive_variant_count": 2,
      "last_positive_sale_month": "2026-06-01",
      "quantity_12m": 4475.0,
      "trend": [
        {"month": "2025-07-01", "value": 120.0},
        {"month": "2025-08-01", "value": null}
      ]
    }
  ]
}
```

### `GET /items/{base_sku}`

Trả profile SKU gốc, Group 1–4, mô tả, trạng thái, số variant và dữ liệu truy vết.

### `GET /items/{base_sku}/variants`

Query: `branch_code`, `months=12`, `measure`.

Response item:

```json
{
  "bravo_sku": "05.L1.3060.KAG36900.D",
  "color_suffix": "D",
  "has_color_suffix": true,
  "status": "inactive",
  "in_disabled_master": true,
  "first_observed_month": "2024-01-01",
  "last_positive_sale_month": "2025-09-01",
  "quantity_12m": 80.0
}
```

### `GET /items/{base_sku}/history`

Query: `branch_code`, `level=base|bravo`, `months=12|24|30`, `measure`.

Response trả series đã sắp xếp tăng dần theo tháng. Không được trả array lộn thứ tự.

## 4. Module 2 — EDA

Các endpoint đều nhận bộ filter chung:

```text
date_from, date_to, region, branch_codes[], status,
size_codes[], base_skus[], measure
```

### `GET /eda/overview`

KPI: số SKU gốc, số Bravo SKU, số chi nhánh, gross/net/return quantity, tỷ lệ inactive, tỷ lệ match và data freshness.

### `GET /eda/trend`

Query thêm `group_by=month|region|branch|size|item`. Trả series đã aggregate tại backend.

### `GET /eda/coverage`

Trả heatmap độ phủ SKU × chi nhánh; bắt buộc có `limit_items` và strategy chọn top để tránh ma trận quá lớn.

### `GET /eda/recency`

Trả cohort lần bán dương gần nhất: `0_3m`, `4_6m`, `7_12m`, `over_12m`, `never_observed`.

### `GET /eda/variant-lifecycle`

Trả first/last observed month theo Bravo SKU và SKU gốc để vẽ timeline thay đổi đuôi màu. Đây là lịch sử quan sát bán hàng, không phải lịch sử trạng thái master.

### `GET /eda/intermittency`

Trả tỷ lệ tháng có quan sát dương, khoảng cách trung bình giữa hai tháng bán và phân nhóm smooth/intermittent/erratic/lumpy.

### `GET /eda/returns`

Trả gross, return, net và return rate theo dimension được chọn.

### `GET /eda/data-quality`

Trả số lỗi theo `rule_code`, severity và sample có phân trang.

## 5. Module 3 — Forecast

### `GET /forecast/matrix`

Query:

```text
date_from, date_to, branch_codes[], region,
base_skus[], status, hierarchy=branch|region,
page, page_size
```

Response:

```json
{
  "origin_month": "2026-06-01",
  "months": [
    {"month": "2026-01-01", "period_type": "past"},
    {"month": "2026-07-01", "period_type": "future"}
  ],
  "groups": [
    {
      "group_key": "015",
      "group_name": "Chi nhánh Vĩnh Long Unis",
      "metrics": {"wape": 0.184, "mae": 42.7, "bias": -0.031},
      "rows": [
        {
          "base_sku": "05.L1.3060.KAG36900",
          "sku_name": "Gạch 30x60 MS KAG36900 Loại 1",
          "method": "seasonal_naive",
          "cells": [
            {
              "month": "2026-01-01",
              "forecast": 454.0,
              "actual": 1100.0,
              "accuracy": 0.413,
              "lower": null,
              "upper": null
            }
          ]
        }
      ]
    }
  ]
}
```

### `GET /forecast/items/{base_sku}`

Trả forecast theo branch, lịch sử, phương pháp được chọn, tham số, interval và backtest metrics.

### `GET /forecast/runs`

Trả các run published, origin, horizon, target measure, trạng thái và thời gian chạy.

### `POST /forecast/runs`

Chỉ dành cho admin/job runner; không thuộc frontend người dùng thông thường. Phải có auth, idempotency key và giới hạn một run đang chạy.

## 6. HTTP status

| Status | Ý nghĩa |
|---|---|
| 200 | Thành công |
| 400 | Filter sai |
| 401/403 | Chưa đăng nhập/không có quyền |
| 404 | Không tìm thấy SKU hoặc run |
| 409 | Run đã tồn tại hoặc xung đột |
| 422 | Request không đúng schema |
| 429 | Quá giới hạn request |
| 500 | Lỗi nội bộ có request ID |
| 503 | Chưa có published pipeline/forecast run |

## 7. Versioning

- Thay đổi breaking tạo `/api/v2`.
- Chỉ thêm field optional không cần đổi version.
- OpenAPI do FastAPI sinh là hợp đồng máy đọc; frontend có thể generate TypeScript client từ schema này.
