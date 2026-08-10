# SKU Analytics & Forecast

Ứng dụng nội bộ gồm ba module:

1. Tra cứu trạng thái SKU gốc và chi tiết Bravo SKU/Group 5.
2. EDA theo thời gian, chi nhánh, vùng, kích thước và trạng thái.
3. Forecast thống kê theo SKU gốc × chi nhánh × tháng.

## Công nghệ

- Frontend: Next.js, React, TypeScript, Tailwind CSS.
- Backend: FastAPI, Python, Psycopg.
- Database: Supabase PostgreSQL, tách schema `source` và `analytics`.

## Chạy backend

Tạo `backend/.env` từ `backend/.env.example`, điền mật khẩu role chỉ đọc, sau đó:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe run.py
```

API chạy tại `http://127.0.0.1:8000`.

## Chạy frontend

```powershell
cd frontend
npm install
npm run dev
```

Mở `http://localhost:3000`.

## An toàn dữ liệu

- `data/` không được đưa lên GitHub.
- `backend/.env` không được commit.
- Frontend không kết nối trực tiếp tới PostgreSQL.
- Dữ liệu gốc trên Supabase không bị ứng dụng sửa hoặc xóa.

Tài liệu chi tiết nằm trong [`docs/`](docs/README.md).
