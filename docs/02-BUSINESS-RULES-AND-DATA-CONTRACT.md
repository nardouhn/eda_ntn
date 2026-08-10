# Quy tắc nghiệp vụ và data contract

## 1. Phạm vi dữ liệu

- Chỉ phân tích sản phẩm có `unit = M2` sau khi chuẩn hóa hoa/thường và khoảng trắng.
- Chỉ giữ SKU có `group2 = L1`.
- Chỉ sử dụng chi nhánh có trạng thái hoạt động trong master channel.
- Mã chi nhánh là chuỗi; phải giữ số `0` đầu, ví dụ `015`.
- Dữ liệu nguồn là bất biến. Mọi kết quả xử lý phải nằm trong bảng/view/file dẫn xuất.

## 2. Cấu trúc SKU

```text
Bravo SKU = Group1.Group2.Group3.Group4[.Group5]
SKU gốc   = Group1.Group2.Group3.Group4
Group5    = đuôi màu
```

| Trường chuẩn | Ý nghĩa |
|---|---|
| `factory_code` | Group 1 — mã nhà máy |
| `product_type` | Group 2 — loại sản phẩm, phạm vi hiện tại là `L1` |
| `size_code` | Group 3 — kích thước |
| `product_code` | Group 4 — mã sản phẩm |
| `color_suffix` | Group 5 — đuôi màu; nullable |
| `base_sku` | Chuỗi Group 1–4 |
| `bravo_sku` | Mã đầy đủ từ hệ thống Bravo |

### Thứ tự xác định `base_sku`

1. Với dòng có trong master SKU, ưu tiên cột `Mã SKU` làm `base_sku` và cột `Bravo SKU` làm `bravo_sku`.
2. Với Bravo SKU chỉ xuất hiện trong sales, tách theo dấu chấm và lấy đúng 4 group đầu.
3. Nếu ít hơn 4 group hoặc không thỏa cấu trúc, đưa vào bảng ngoại lệ; không đoán bằng cách cắt ký tự cuối.
4. `color_suffix` là group thứ 5. Nếu không có, lưu `NULL` và giao diện hiển thị `Không có đuôi màu`.

Chuẩn hóa khóa join:

```text
trim → uppercase → chuẩn hóa khoảng trắng → giữ nguyên dấu chấm và số 0 đầu
```

Không được sửa mã gốc trong bảng nguồn.

## 3. Tập hợp Bravo SKU đã biết

```text
known_bravo_skus = distinct(sales.bravo_sku) UNION distinct(master_disabled.bravo_sku)
```

Việc dùng phép hợp bảo đảm giữ cả:

- Mã đang hoạt động có trong sales nhưng không có trong master vô hiệu hóa.
- Mã đã vô hiệu hóa có thể không còn giao dịch trong kỳ sales.

## 4. Trạng thái

### Bravo SKU

```text
inactive nếu normalized_bravo_sku có trong master vô hiệu hóa
active   nếu normalized_bravo_sku không có trong master vô hiệu hóa
```

Master vô hiệu hóa là nguồn nghiệp vụ chính thức. Quantity không được dùng để thay đổi trạng thái này.

### SKU gốc

```text
base_sku_status = active
  nếu tồn tại ít nhất một Bravo SKU active

base_sku_status = inactive
  nếu số Bravo SKU active = 0 và có ít nhất một Bravo SKU đã biết
```

### Trạng thái tại chi nhánh

Ba nguồn hiện tại không cung cấp trạng thái nghiệp vụ SKU × chi nhánh. Vì vậy Module 1 chỉ hiển thị trạng thái master toàn hệ thống. Có thể tính `branch_sales_recency` cho EDA nhưng không đổi màu xanh/đỏ của master.

```text
recent_3m  nếu có quantity dương trong 3 tháng hoàn chỉnh gần nhất
recent_6m  nếu có quantity dương trong 6 tháng hoàn chỉnh gần nhất
recent_12m nếu có quantity dương trong 12 tháng hoàn chỉnh gần nhất
never_observed nếu chưa từng có giao dịch trong phạm vi dữ liệu
```

## 5. Quantity

Mỗi dòng sales phải được tách thành ba đại lượng:

```text
gross_positive_qty = greatest(total_quantity, 0)
return_qty          = abs(least(total_quantity, 0))
net_qty             = total_quantity
```

- Module 1 mặc định hiển thị `gross_positive_qty` để diễn tả lượng bán ra.
- Module 2 cho phép chuyển `Gross`, `Return`, `Net`.
- Module 3 dùng `gross_positive_qty` làm target mặc định cho bản baseline.
- Dữ liệu âm không bị xóa; chỉ không cộng vào gross quantity.

## 6. Missing và zero

- Có dòng và `total_quantity = 0`: zero được quan sát.
- Không có dòng: missing, hiển thị `—`.
- Không tự sinh zero cho mọi tổ hợp SKU × chi nhánh × tháng.
- Chỉ được zero-fill trong forecast khi sau này có bảng xác nhận SKU đủ điều kiện bán tại chi nhánh và tháng tương ứng.

## 7. Thời gian và xu hướng 12 tháng

- `data_as_of_month` là tháng hoàn chỉnh lớn nhất có trong dữ liệu.
- Cửa sổ 12 tháng: từ `data_as_of_month - 11 tháng` đến `data_as_of_month`.
- Trình bày từ cũ đến mới: tháng cũ nhất bên trái, tháng mới nhất bên phải.
- Sparkline và cột tháng phải dùng cùng measure, filter và cửa sổ thời gian.
- Nếu chọn `Tất cả chi nhánh`, cộng theo SKU gốc × tháng trên các chi nhánh thuộc bộ lọc.
- Nếu chọn một chi nhánh, chỉ tổng hợp giao dịch của chi nhánh đó.

## 8. Grain chuẩn

| Dataset | Grain |
|---|---|
| Master Bravo SKU | Một dòng/Bravo SKU |
| Master SKU gốc | Một dòng/base SKU |
| Sales nguồn | Bravo SKU × chi nhánh × tháng |
| Sales phân tích | Base SKU × chi nhánh × tháng |
| Forecast | Base SKU × chi nhánh × forecast origin × target month × method |

## 9. Ngoại lệ bắt buộc ghi nhận

- Bravo SKU ít hơn 4 group.
- Bravo SKU nhiều hơn 5 group.
- Mapping một Bravo SKU sang nhiều SKU gốc.
- Trùng Bravo SKU trong master.
- Chi nhánh sales không tồn tại trong channel master.
- SKU có nhiều unit hoặc unit khác M2.
- Tháng không phải ngày đầu tháng.
- Quantity/amount bất thường hoặc null.

Mỗi ngoại lệ cần có `rule_code`, `source_key`, `severity`, `detected_at`, `details`; không âm thầm loại bỏ.
