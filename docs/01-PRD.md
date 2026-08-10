# 1. Executive Summary

## Problem Statement

Dữ liệu bán hàng đang ở cấp Bravo SKU (SKU có đuôi màu), trong khi người dùng cần theo dõi và dự báo ở cấp SKU gốc. Nếu join hoặc gán trạng thái sai, một SKU gốc có thể bị hiển thị vô hiệu hóa dù vẫn còn đuôi màu hoạt động.

## Proposed Solution

Xây dựng web nội bộ gồm ba module: tra cứu trạng thái và lịch sử SKU, EDA chuyên sâu, và dự báo thống kê theo SKU gốc × chi nhánh × tháng. Frontend và backend tách riêng; backend đọc dữ liệu Supabase và chỉ ghi vào các bảng dẫn xuất mới.

## Success Criteria

- 100% SKU hiển thị có thể truy vết về danh sách Bravo SKU cấu thành.
- 100% trạng thái xanh/đỏ tuân thủ quy tắc master vô hiệu hóa.
- Lịch sử 12 tháng trả đúng thứ tự và đúng tổng quantity theo bộ lọc chi nhánh.
- API danh sách SKU phản hồi dưới 1 giây tại p95 với phân trang 50 dòng trong môi trường mục tiêu.
- Forecast quá khứ được tạo bằng rolling backtest; không dùng dữ liệu tương lai để dự báo quá khứ.
- Không có mật khẩu database hoặc service-role key trong bundle frontend, Git hoặc log.

# 2. User Experience & Functionality

## User Personas

- Nhân viên kế hoạch: xem lịch sử, dự báo và sai số theo SKU/chi nhánh.
- Nhân viên kinh doanh: tra cứu SKU đang hoạt động và tình hình bán theo khu vực.
- Data analyst: kiểm tra chất lượng dữ liệu, vòng đời đuôi màu và đặc điểm nhu cầu.
- Quản trị dữ liệu: cập nhật trạng thái vô hiệu hóa trong nguồn nghiệp vụ và kiểm tra refresh.

## User Stories và Acceptance Criteria

### US-01 — Tra cứu SKU gốc

Là người dùng, tôi muốn tìm SKU gốc hoặc tên sản phẩm để xem trạng thái và lịch sử 12 tháng.

Hoàn thành khi:

- Tìm kiếm theo mã hoặc tên, không phân biệt hoa thường.
- Có lọc chi nhánh và trạng thái `active/inactive`.
- Một dòng mặc định tương ứng một SKU gốc trong phạm vi lọc.
- Sparkline và bảng tháng sử dụng 12 tháng hoàn chỉnh gần nhất.
- Tháng cũ nhất nằm bên trái, tháng mới nhất nằm bên phải.
- Dữ liệu thiếu hiển thị `—`, không tự đổi thành `0`.

### US-02 — Xem Bravo SKU/đuôi màu

Là người dùng, tôi muốn mở SKU gốc để biết các Bravo SKU và trạng thái từng đuôi màu.

Hoàn thành khi:

- Có chế độ `SKU gốc` và `Bravo SKU`.
- Hiển thị Group 5 là đuôi màu; nếu không có Group 5, ghi `Không có đuôi màu`.
- Bravo SKU có trong master vô hiệu hóa hiển thị đỏ.
- Bravo SKU không có trong master vô hiệu hóa hiển thị xanh.
- Có tháng bán đầu, tháng bán cuối và quantity 12 tháng.

### US-03 — Phân tích EDA

Là data analyst, tôi muốn phân tích nhu cầu theo vùng, chi nhánh, kích thước và vòng đời SKU để phát hiện vấn đề dữ liệu và hành vi bán hàng.

Hoàn thành khi:

- Tất cả biểu đồ dùng chung bộ lọc thời gian, vùng, chi nhánh và trạng thái SKU.
- Có phân tích xu hướng, mùa vụ, độ gián đoạn, độ phủ và hàng trả.
- Có bảng chất lượng dữ liệu: unmatched, sai cấu trúc mã, duplicate và missing.
- Mỗi KPI có định nghĩa, grain và công thức trong tooltip.

### US-04 — Xem forecast dạng ma trận

Là nhân viên kế hoạch, tôi muốn xem FC, TT và Acc theo từng tháng và chi nhánh như bảng nghiệp vụ.

Hoàn thành khi:

- Hàng cấp cha là chi nhánh hoặc vùng; hàng con là SKU gốc.
- Mỗi tháng quá khứ có `FC`, `TT`, `Acc`.
- Tháng tương lai chỉ có `FC` và khoảng dự báo; `TT/Acc` hiển thị `—`.
- Có tổng WAPE, MAE và Bias tại hàng nhóm.
- Có thể drill-down vào lịch sử, công thức được chọn và kết quả backtest.

## Non-Goals của MVP

- Không huấn luyện mô hình machine learning phức tạp.
- Không ghi ngược trạng thái vào bảng master nguồn.
- Không sửa, xóa hoặc thay thế bảng dữ liệu gốc.
- Không triển khai chức năng đặt hàng hoặc tối ưu tồn kho.
- Không tự kết luận SKU bị vô hiệu hóa ở một chi nhánh chỉ vì không có giao dịch.
- Không coi missing là zero nếu chưa có bằng chứng SKU đủ điều kiện bán trong tháng.

# 3. AI System Requirements

MVP không sử dụng AI sinh nội dung. Forecast sử dụng các công thức xác suất/thống kê xác định và có thể tái lập. Mỗi kết quả phải lưu tên phương pháp, tham số, ngày cutoff và phiên bản chạy.

# 4. Technical Specifications

## Architecture Overview

- Frontend: Next.js, React, TypeScript, TanStack Query, TanStack Table và thư viện biểu đồ hỗ trợ canvas/SVG.
- Backend: FastAPI, Pydantic, SQLAlchemy/psycopg, pandas/polars và statsmodels khi cần.
- Database: Supabase PostgreSQL; bảng nguồn read-only, bảng chuẩn hóa và mart nằm ở schema riêng.
- Giao tiếp: frontend gọi REST API của backend; frontend không kết nối Postgres trực tiếp.

## Integration Points

- Supabase PostgreSQL cho dữ liệu nguồn và bảng dẫn xuất.
- Supabase Auth là tùy chọn sau khi xác nhận mô hình người dùng.
- Job backend dùng để refresh mart và chạy forecast.

## Security & Privacy

- Chỉ backend được nhận `DATABASE_URL`.
- Frontend chỉ có `NEXT_PUBLIC_API_BASE_URL`.
- Tạo database role read-only cho bảng nguồn và quyền ghi giới hạn vào schema dẫn xuất.
- RLS và grants phải được kiểm tra nếu bất kỳ bảng/view nào được expose qua Supabase Data API.
- Mật khẩu từng xuất hiện trong hội thoại phải được rotate trước khi dùng cho dự án.

# 5. Risks & Roadmap

## Phased Rollout

1. Phase 0: khóa data contract, kiểm tra schema Supabase và tạo bộ test dữ liệu.
2. Phase 1: Module 1 + API danh mục/lịch sử SKU.
3. Phase 2: Module 2 + các mart EDA và kiểm tra chất lượng.
4. Phase 3: Module 3 + baseline forecast + rolling backtest.
5. Phase 4: tối ưu hiệu năng, auth, logging và nghiệm thu.

## Technical Risks

- Master chỉ chứa mã vô hiệu hóa nên tập hợp Bravo SKU hoạt động phải lấy từ sales hoặc nguồn SKU đầy đủ.
- Trạng thái hiện tại không tái dựng được trạng thái lịch sử nếu không có bảng lịch sử cập nhật.
- Missing item–branch–month không đủ để kết luận zero demand.
- Ma trận nhiều tháng × nhiều SKU có thể nặng; bắt buộc phân trang/virtualization và API aggregate.
- Acc theo từng ô không có ý nghĩa khi thực tế bằng 0; phải hiển thị `—` và dùng WAPE ở cấp tổng.
