# Kiến trúc hệ thống

## 1. Tổng quan

```mermaid
flowchart LR
    U["Trình duyệt người dùng"] --> FE["Frontend<br/>Next.js + TypeScript"]
    FE -->|"HTTPS REST /api/v1"| BE["Backend<br/>FastAPI + Python"]
    BE -->|"SQL read-only nguồn"| RAW["Supabase PostgreSQL<br/>bảng nguồn"]
    BE -->|"đọc/ghi có giới hạn"| MART["Schema analytics<br/>bảng dẫn xuất"]
    JOB["Refresh & Forecast Jobs"] --> RAW
    JOB --> MART
    MART --> BE
```

Frontend không truy cập PostgreSQL trực tiếp. Backend chịu trách nhiệm xác thực đầu vào, phân trang, aggregate, cache và che giấu cấu trúc nội bộ của database.

## 2. Frontend

### Công nghệ đề xuất

- Next.js + React + TypeScript.
- TanStack Query: fetch, cache, retry và trạng thái loading/error.
- TanStack Table + row virtualization: bảng nhiều SKU và nhiều cột tháng.
- Apache ECharts hoặc Recharts: sparkline và biểu đồ EDA.
- Zod: kiểm tra response API tại biên frontend.
- Playwright: kiểm thử luồng giao diện.

### Trách nhiệm

- Quản lý bộ lọc và đồng bộ filter vào URL.
- Hiển thị bảng, biểu đồ, drill-down và trạng thái tải.
- Không tự tính lại business status từ dữ liệu thô.
- Không chứa SQL, mật khẩu hoặc service-role key.
- Định dạng mã chi nhánh dưới dạng chuỗi.

## 3. Backend

### Công nghệ đề xuất

- FastAPI + Pydantic.
- SQLAlchemy 2.x/psycopg cho truy vấn PostgreSQL.
- pandas hoặc polars cho job tổng hợp; statsmodels cho SES khi cần.
- Alembic hoặc Supabase CLI migrations cho schema dẫn xuất.
- pytest cho unit/integration tests.

### Trách nhiệm

- Kết nối Supabase bằng biến môi trường.
- Chuẩn hóa request, giới hạn page size và chống truy vấn quá rộng.
- Thực thi business rule đã chốt.
- Trả API ổn định cho frontend.
- Tạo/refresh bảng aggregate và chạy forecast theo cutoff.
- Ghi run metadata, lỗi xử lý và data-quality exceptions.

## 4. Supabase/PostgreSQL

### Phân vùng logic

```text
source/raw  → bảng do hệ thống hiện có quản lý, ứng dụng chỉ đọc
analytics   → dim/fact/mart dẫn xuất do pipeline quản lý
api         → view hoặc function được phép expose nếu dùng Data API
```

Nếu dự án hiện chỉ có schema `public`, giai đoạn đầu có thể giữ bảng nguồn tại chỗ và tạo schema `analytics`. Không đổi tên hoặc di chuyển bảng nguồn khi chưa có migration/backup và phê duyệt riêng.

### Nguyên tắc kết nối

- Backend local/persistent trên IPv4 có thể dùng Supavisor session mode, port `5432`.
- Nếu chuyển sang serverless, dùng transaction pooler, thường là port `6543`, và tắt prepared statements theo yêu cầu driver.
- Migration/backup ưu tiên direct connection nếu môi trường hỗ trợ.
- Không hard-code connection string.

Tham khảo chính thức: [Supabase — Connect to your database](https://supabase.com/docs/guides/database/connecting-to-postgres).

## 5. Luồng refresh dữ liệu

```mermaid
flowchart TD
    A["Đọc watermark nguồn"] --> B["Đọc sales/master/channel từ Supabase"]
    B --> C["Chuẩn hóa key và kiểm tra schema"]
    C --> D["Union tập Bravo SKU đã biết"]
    D --> E["Map Group 1–5 và trạng thái"]
    E --> F["Tổng hợp base SKU × branch × month"]
    F --> G["Tạo mart Module 1 và Module 2"]
    G --> H["Chạy data quality checks"]
    H -->|"PASS"| I["Publish run mới"]
    H -->|"FAIL critical"| J["Giữ run cũ và ghi lỗi"]
```

Một run mới chỉ trở thành `published` khi các kiểm tra khóa join, duplicate, row count và khoảng thời gian vượt qua gate.

## 6. Luồng request Module 1

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant API as Backend API
    participant DB as Supabase analytics mart
    UI->>API: GET /items?branch_code=015&status=active
    API->>DB: Query phân trang + filters
    DB-->>API: SKU gốc + status + summary
    API-->>UI: JSON + data_as_of_month
    UI->>API: GET /items/{base_sku}/history?months=12
    API->>DB: Query lịch sử tháng
    DB-->>API: 12 điểm dữ liệu
    API-->>UI: Sparkline/table data
```

## 7. Luồng forecast

```mermaid
flowchart LR
    A["Mart lịch sử"] --> B["Tạo rolling origins"]
    B --> C["Chạy các baseline"]
    C --> D["Tính WAPE MAE Bias"]
    D --> E["Chọn phương pháp theo horizon"]
    E --> F["Fit đến cutoff hiện tại"]
    F --> G["Lưu forecast + interval + metadata"]
    G --> H["API ma trận FC/TT/Acc"]
```

## 8. Cấu hình môi trường

### Frontend

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

### Backend

```dotenv
APP_ENV=local
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:PORT/postgres
DATABASE_SOURCE_SCHEMA=public
DATABASE_ANALYTICS_SCHEMA=analytics
CORS_ORIGINS=http://localhost:3000
```

`.env` phải nằm trong `.gitignore`. `.env.example` chỉ chứa placeholder.

## 9. Auth

MVP local có thể chạy không đăng nhập nếu chỉ truy cập trên máy người dùng. Nếu mở trong mạng nội bộ hoặc internet, phải thêm Supabase Auth hoặc reverse proxy auth trước nghiệm thu. Quyền quản trị không được suy ra từ `user_metadata`; nếu dùng JWT, quyền phải nằm trong app metadata hoặc bảng role được kiểm soát.
