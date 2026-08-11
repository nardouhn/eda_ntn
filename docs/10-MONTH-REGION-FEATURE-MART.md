# Month × Region feature mart

## Quan hệ được tạo

- `analytics.dim_month_region_features`: 120 dòng ở grain `thang × vung`, khóa chính `(thang, vung)`.
- `analytics.mart_sku_brand_month_enriched`: giữ nguyên toàn bộ cột và grain SKU × chi nhánh × tháng của `source.mart_sku_branch_month`, sau đó nối thêm các feature từ dimension trên. Tên bảng đích được giữ theo contract ban đầu, nhưng Supabase hiện không có relation `source.mart_sku_brand_month`.

Không đặt khóa chính `(thang, vung)` lên mart enriched vì một tháng-vùng có nhiều SKU/brand.

## Data dictionary

### `analytics.dim_month_region_features`

Đây là bảng feature chuẩn ở grain một dòng cho mỗi `thang × vung`. Toàn bộ các cột dưới đây đều `NOT NULL`.

| Cột | Kiểu PostgreSQL | Khóa/miền giá trị | Nguồn và ý nghĩa |
|---|---|---|---|
| `thang` | `date` | PK cùng `vung`; luôn là ngày đầu tháng | Tháng dương lịch từ `2024-01-01` đến `2026-06-01`. |
| `vung` | `text` | PK cùng `thang`; một trong `Khác`, `Tây Nguyên`, `Đông Nam Bộ`, `Tây Nam Bộ` | Vùng chuẩn hóa dùng để nối với mart nguồn. |
| `trend_index` | `integer` | `> 0` | Chỉ số thời gian 1–30; cùng một tháng có cùng giá trị ở cả bốn vùng. |
| `gg_trends_index` | `numeric(10,3)` | — | `Trung_Binh_Trend` đúng tháng `t` trong `backend/google_trends_trung_binh.csv`. |
| `gg_trends_lag1` | `numeric(10,3)` | — | `Trung_Binh_Trend` của tháng `t-1` trong `backend/google_trends_trung_binh.csv`. |
| `flag_mua_mua` | `smallint` | `0` hoặc `1` | Cờ mùa mưa theo tháng và vùng. |
| `ty_trong_chay_tet` | `numeric(8,6)` | `[0,1]` | Số ngày của tháng nằm trong 30 ngày ngay trước Tết / số ngày của tháng. Không tính ngày mùng 1 Tết. |
| `ty_trong_thang_gieng` | `numeric(8,6)` | `[0,1]` | Số ngày thuộc tháng 1 Âm lịch / số ngày của tháng dương. |
| `ty_trong_thang_co_hon` | `numeric(8,6)` | `[0,1]` | Số ngày thuộc tháng 7 Âm lịch / số ngày của tháng dương. |
| `ty_trong_thanh_minh` | `numeric(8,6)` | `[0,1]` | Số ngày từ tiết Thanh Minh đến trước tiết Cốc Vũ / số ngày của tháng dương. |
| `feature_refreshed_at` | `timestamptz` | mặc định `now()` | Thời điểm dòng feature được nạp gần nhất. |

Primary key:

```sql
primary key (thang, vung)
```

### `analytics.mart_sku_brand_month_enriched`

Đây là bảng vật lý phục vụ phân tích/model. Danh sách cột của bảng được tạo theo thứ tự:

```text
[toàn bộ cột của source.mart_sku_branch_month, giữ nguyên tên và kiểu]
+
[11 cột feature liệt kê bên dưới]
```

Script dùng `SELECT source.*`, vì vậy nếu bảng nguồn có các trường SKU, brand, demand, doanh thu hoặc thuộc tính sản phẩm khác thì chúng đều được giữ lại; mart mới không chỉ gồm các feature thời gian. Script cũng kiểm tra schema nguồn trước khi nạp và không cho phép tên cột nguồn trùng với tên feature.

Mười một cột được nối thêm vào cuối mart:

| Thứ tự | Cột thêm | Kiểu PostgreSQL trong mart | Diễn giải |
|---:|---|---|---|
| 1 | `thang` | `date` | Bản chuẩn hóa của `source.month`; dùng làm tháng feature. |
| 2 | `vung` | `text` | Bản chuẩn hóa của `source.region` theo bảng mapping vùng. |
| 3 | `trend_index` | `integer` | Chỉ số xu hướng thời gian. |
| 4 | `gg_trends_index` | `numeric(10,3)` | Google Trends đúng tháng. |
| 5 | `gg_trends_lag1` | `numeric(10,3)` | Google Trends trễ một tháng. |
| 6 | `flag_mua_mua` | `smallint` | Cờ mùa mưa theo vùng. |
| 7 | `ty_trong_chay_tet` | `numeric(8,6)` | Tỷ trọng ngày trong khung chạy Tết. |
| 8 | `ty_trong_thang_gieng` | `numeric(8,6)` | Tỷ trọng ngày thuộc tháng Giêng Âm lịch. |
| 9 | `ty_trong_thang_co_hon` | `numeric(8,6)` | Tỷ trọng ngày thuộc tháng 7 Âm lịch. |
| 10 | `ty_trong_thanh_minh` | `numeric(8,6)` | Tỷ trọng ngày thuộc tiết Thanh Minh. |
| 11 | `feature_refreshed_at` | `timestamptz` | Thời điểm refresh mart. |

Mart enriched chỉ chứa các dòng nguồn có `source.month` trong khoảng `2024-01-01`–`2026-06-01`. Phép nối feature là `INNER JOIN`, nên mỗi dòng mart phải tìm được đúng một khóa tháng-vùng trong dimension.

Mart enriched không có primary key `(thang, vung)`. Nó giữ nguyên grain của bảng nguồn và có index:

```sql
create index mart_sku_brand_month_enriched_month_region_idx
on analytics.mart_sku_brand_month_enriched (thang, vung);
```

Do schema nguồn chỉ được đọc tại lúc chạy Supabase, xem danh sách đầy đủ các cột kế thừa thực tế bằng:

```sql
select ordinal_position, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'analytics'
  and table_name = 'mart_sku_brand_month_enriched'
order by ordinal_position;
```

Nếu cần riêng danh sách cột gốc trước khi tạo mart:

```sql
select ordinal_position, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'source'
  and table_name = 'mart_sku_branch_month'
order by ordinal_position;
```

## Chuẩn hóa vùng

| Giá trị nguồn | `vung` chuẩn |
|---|---|
| `TNB`, `Tây Nam Bộ` | `Tây Nam Bộ` |
| `DNB`, `Đông Nam Bộ` | `Đông Nam Bộ` |
| `MT-TNG`, `Tây Nguyên` | `Tây Nguyên` |
| Mọi giá trị khác/rỗng | `Khác` |

Mùa mưa của ba vùng phía Nam/Tây Nguyên là tháng 5–11. `Khác` là tháng 8–12.

## Lịch và Google Trends

- Kỳ feature: `2024-01-01` đến `2026-06-01`.
- `trend_index`: 1–30 và lặp lại cho bốn vùng.
- `gg_trends_index`: giá trị `Trung_Binh_Trend` đúng tháng trong `backend/google_trends_trung_binh.csv`.
- `gg_trends_lag1`: giá trị `Trung_Binh_Trend` của tháng liền trước trong `backend/google_trends_trung_binh.csv`. Vì vậy dữ liệu 12/2023 cấp lag cho 01/2024.
- Tỷ trọng sự kiện = số ngày giao với tháng dương / tổng số ngày của tháng.
- Khung chạy Tết là 30 ngày trước ngày mùng 1 Tết, không gồm ngày Tết.
- Tháng Giêng và tháng Bảy dùng khoảng ngày âm lịch đã khóa cho 2024–2026.
- Thanh Minh dùng khoảng từ tiết Thanh Minh đến trước tiết Cốc Vũ.

Ngày âm lịch và tiết khí được khóa theo các bảng chuyển đổi của Hong Kong Observatory:
[2024](https://www.hko.gov.hk/en/gts/time/calendar/pdf/files/2024e.pdf),
[2025](https://www.hko.gov.hk/en/gts/time/calendar/pdf/files/2025e.pdf),
[2026](https://www.hko.gov.hk/en/gts/time/calendar/pdf/files/2026e.pdf).

## Phân tích được dùng trong các tab EDA

API dùng chung: `GET /api/v1/eda/external-features/{level}?metric=quantity|revenue&page=1&page_size=50`. `page_size` bị chặn tối đa 50; response của các bảng chi tiết có `page`, `page_size`, `total`.

| Tab / `level` | Grain trước khi tính | Phân tích triển khai |
|---|---|---|
| Tổng quan / `overview` | Một dòng/tháng toàn hệ thống | Demand và Google Trends được chuẩn hóa index 100; so sánh correlation lag 0–3; event ribbon cho chạy Tết, tháng Giêng, cô hồn, Thanh Minh; decomposition `linear trend + seasonal residual trung bình theo tháng trong năm`. Feature không có vùng được group đúng một lần theo `thang`. |
| Vùng / `region` | Một dòng/tháng/vùng | Dumbbell demand trung bình mùa mưa–mùa khô; event uplift của Tết/Giêng/cô hồn/Thanh Minh so với baseline ngoài bốn sự kiện; bảng correlation theo vùng. |
| Chi nhánh / `branch` | Một dòng/tháng/chi nhánh | Chuẩn hóa doanh số mỗi chi nhánh theo mean riêng, sau đó so với baseline các chi nhánh cùng vùng trong đúng tháng. `operational_outlier_score` là trung bình độ lệch tuyệt đối sau khi seasonal chung của vùng đã được loại. |
| SKU / `sku` | Một dòng/tháng/Base SKU toàn hệ thống | Bubble chart `Corr GG lag1 × event uplift`, kích thước theo demand; chuyển giữa Tết/Thanh Minh; nhãn tin cậy yêu cầu tối thiểu 18 tháng và 2 kỳ sự kiện. |
| SKU × chi nhánh / `branch-sku` | Một dòng/tháng/Base SKU/chi nhánh | Bubble chart và bảng mô tả có coverage/confidence; không fit model riêng từng cặp do dữ liệu thưa. |
| Bộ mẫu / `pattern-set` | Một dòng/tháng/pattern set | Gộp demand theo bộ mẫu × tháng; bubble chart Google Trends lag1 với uplift Tết/Thanh Minh và bảng confidence. |

Các correlation và rainy-vs-dry là thống kê mô tả, không tự suy diễn quan hệ nhân quả. Missing month không bị biến thành zero; `observed_months` và `coverage_pct` được trả về để đánh giá độ tin cậy. Người dùng có thể chuyển riêng từng panel giữa sản lượng và doanh thu.

## Chạy vào Supabase

Dùng connection string của role có quyền `CREATE/INSERT/TRUNCATE` trong schema `analytics`; không dùng anon key frontend.

```powershell
cd "D:\demand forecasting\itern\new_web\sku-analytics-forecast\backend"
# Tạo/chỉnh backend/.env và điền DATABASE_URL=postgresql://...
.\.venv\Scripts\python.exe refresh_sku_brand_month_enriched.py --dry-run
.\.venv\Scripts\python.exe refresh_sku_brand_month_enriched.py
```

Nếu schema của bảng nguồn thay đổi sau lần tạo đầu tiên, review dependency rồi chạy:

```powershell
.\.venv\Scripts\python.exe refresh_sku_brand_month_enriched.py --recreate
```

`--recreate` chỉ xóa và tạo lại `analytics.mart_sku_brand_month_enriched`; không sửa/xóa bảng nguồn.

Nếu mart đã được tạo từ phiên bản chưa có `gg_trends_index`, cũng chạy một lần với `--recreate` để mart vật lý nhận cột mới. Bảng dimension được script tự động thêm và nạp lại cột này.

## Kiểm tra trên Supabase SQL Editor

```sql
select count(*) as feature_rows,
       count(distinct (thang, vung)) as distinct_keys,
       min(thang) as min_month,
       max(thang) as max_month
from analytics.dim_month_region_features;

select thang, vung, trend_index, gg_trends_index, gg_trends_lag1,
       flag_mua_mua,
       ty_trong_chay_tet, ty_trong_thang_gieng,
       ty_trong_thang_co_hon, ty_trong_thanh_minh
from analytics.dim_month_region_features
order by thang, vung;

select count(*) as enriched_rows,
       min(thang) as min_month,
       max(thang) as max_month
from analytics.mart_sku_brand_month_enriched;
```
