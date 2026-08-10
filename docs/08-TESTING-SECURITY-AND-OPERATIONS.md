# Kiểm thử, bảo mật và vận hành

## 1. Chiến lược kiểm thử

### Data contract tests

- Sales key `(bravo_sku, branch_code, month)` không duplicate.
- `branch_code` không bị ép số làm mất zero đầu.
- `month` là ngày đầu tháng và không vượt data cutoff.
- Mapping master dùng `Mã SKU ↔ Bravo SKU` đúng một-nhiều.
- Sales-only Bravo SKU tách đủ Group 1–4; Group 5 nullable.
- Status variant/base đúng các bảng truth fixture.
- Tổng base SKU bằng tổng các Bravo SKU cấu thành theo cùng filter.
- Gross, return và net thỏa `net = gross - return`.

### Backend unit tests

- Filter parsing và giới hạn page size.
- Sắp xếp tháng tăng dần.
- Status aggregation.
- Missing/null serialization.
- Forecast formulas và metrics.

### Backend integration tests

- API chạy trên database test có schema tối thiểu.
- Query branch `015` vẫn trả đúng mã `015`.
- Pagination không lặp/mất dòng khi sort ổn định.
- Pipeline failure không thay published run.
- Source role không có quyền update/delete bảng nguồn.

### Frontend tests

- Component test cho badge xanh/đỏ và month header.
- Filter chi nhánh cập nhật URL và request.
- Drill-down hiển thị Group 5/“Không có đuôi màu”.
- Missing hiển thị `—`.
- E2E: tìm SKU → chọn branch → mở variant → sang forecast.
- E2E: horizontal scroll/frozen columns trong forecast matrix.

### Visual QA

- So sánh Module 1 và Module 3 với ảnh tham chiếu ở desktop.
- Kiểm tra overflow ở 1280, 1440 và 1920px.
- Kiểm tra contrast, keyboard navigation và trạng thái focus.
- Không tuyên bố pass visual QA nếu chưa mở trên browser thật.

## 2. Data quality gates trước publish

| Gate | Mức | Điều kiện |
|---|---|---|
| Source readable | Critical | đọc được đủ ba nguồn |
| Required columns | Critical | không thiếu cột khóa |
| Duplicate sales key | Critical | bằng 0 hoặc có rule aggregate rõ ràng |
| Ambiguous SKU mapping | Critical | một Bravo SKU không map nhiều base SKU |
| Unknown branch | Warning/Critical | theo ngưỡng được cấu hình |
| Invalid SKU structure | Warning | lưu issue và báo tỷ lệ |
| Freshness | Warning | max month đúng kỳ kỳ vọng |
| Row multiplication | Critical | tổng sau join không tăng ngoài dự kiến |
| Status count | Warning | biến động lớn so với run trước được cảnh báo |

## 3. Bảo mật

### Secret handling

- Rotate mật khẩu database đã từng được chia sẻ trong chat trước khi code kết nối chính thức.
- Không commit `.env`, connection string, password hoặc service-role key.
- Không đặt secret trong biến `NEXT_PUBLIC_*`.
- Log phải redact URI database và Authorization header.
- Dùng secret manager/environment variables khi triển khai sau này.

### Database access

- Runtime backend dùng role quyền tối thiểu, không dùng `postgres` owner.
- Bảng nguồn chỉ `SELECT`.
- Schema analytics chỉ cho pipeline role ghi.
- Nếu Data API bật: grant tối thiểu + RLS trên mọi object expose.
- View expose dùng `security_invoker = true` trên PostgreSQL 15+ hoặc bị revoke khỏi `anon/authenticated`.
- Không dùng `SECURITY DEFINER` để chữa lỗi quyền; mọi function đặc quyền phải review riêng và revoke execute khỏi `PUBLIC`.

### API

- Validate mọi query parameter.
- Giới hạn page size, date range và heatmap cardinality.
- CORS chỉ cho origin frontend cấu hình.
- Production dùng HTTPS.
- Endpoint chạy forecast/refresh yêu cầu admin auth và idempotency.
- Ghi `request_id`, latency, status code; không log dữ liệu nhạy cảm.

## 4. Hiệu năng

Mục tiêu ban đầu:

- `/items`: p95 < 1 giây, page size 50.
- `/items/{sku}/history`: p95 < 500ms.
- `/eda/overview`: p95 < 2 giây.
- `/forecast/matrix`: p95 < 2 giây cho 50 SKU × 12 tháng.
- Frontend initial route JS và bundle sẽ được đo bằng Lighthouse sau khi scaffold.

Biện pháp:

- Index theo status, base_sku, branch_code, month.
- Materialized summary cho Module 1/EDA overview.
- Cache response metadata và filter dictionary.
- Virtualization ở bảng frontend.
- Không trả raw 200k+ dòng cho trình duyệt.

## 5. Observability

### Backend logs

- `request_id`, route, status, duration.
- `pipeline_run_id`, `forecast_run_id`.
- Row counts và validation outcome.
- Error stack ở server, message rút gọn cho client.

### Health endpoints

```text
GET /health/live   → process còn chạy
GET /health/ready  → DB reachable và có published pipeline run
```

### Pipeline dashboard/status

- Source max month.
- Published run/time.
- Số dòng source/dim/fact/mart.
- Số DQ issue theo severity.
- Forecast origin và số series success/skipped/failed.

## 6. Quy trình phát triển từng module

### Phase 0 — Foundation

- Rotate secret.
- Xác nhận tên/schema/cột Supabase bằng read-only query.
- Tạo fixture nhỏ có active/inactive/mixed variants, branch code có zero đầu, negative và missing.
- Chốt migrations analytics và API contract.

Gate: business-rule tests PASS và không có thao tác ghi lên nguồn.

### Phase 1 — Module 1

- Tạo dim/mart item summary.
- Implement metadata/items/history/variants API.
- Build bảng, filter branch, status badge, sparkline 12 tháng và drill-down.
- Test tổng base SKU = tổng variants.

Gate: dữ liệu 12 tháng khớp truy vấn SQL mẫu và trạng thái fixture đúng 100%.

### Phase 2 — Module 2

- Tạo endpoint overview/trend/coverage/recency/lifecycle/returns/DQ.
- Build các tab EDA theo thứ tự ưu tiên.
- Viết metric dictionary và tooltip.

Gate: mọi chart truy vết được query/measure; DQ issues không bị ẩn.

### Phase 3 — Module 3

- Tạo baseline formulas và rolling backtest.
- Lưu run/value/metric.
- Build matrix FC/TT/Acc, hierarchy, intervals và detail drawer.

Gate: leakage tests, formula tests và aggregate WAPE PASS.

### Phase 4 — Hardening

- Auth nếu cần, RLS/grants review, performance test, browser QA.
- Hoàn thiện README chạy local và handoff backend/frontend.

Gate: không còn secret trong Git, API p95 đạt mục tiêu, E2E critical paths PASS.

## 7. Definition of Done toàn sản phẩm

- Ba module hoạt động với dữ liệu Supabase qua backend.
- Không có frontend query trực tiếp database bằng credential bí mật.
- Không có thay đổi/xóa dữ liệu nguồn.
- Schema, API và business rules khớp tài liệu.
- Có migration, test, sample env và lệnh chạy local.
- Có bằng chứng test và giới hạn kiểm chứng được ghi rõ.
- Có tài liệu rollback cho migration analytics và pipeline publish.

## 8. Nguồn kỹ thuật Supabase

- [Connect to your database](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Securing your API](https://supabase.com/docs/guides/api/securing-your-api)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
