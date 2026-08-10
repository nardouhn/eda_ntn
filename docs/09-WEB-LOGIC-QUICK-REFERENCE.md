# Sổ tay logic nghiệp vụ của web

Tài liệu này giải thích ngắn gọn các con số, trạng thái và cách phân loại đang được web sử dụng. Nội dung bám theo code backend hiện tại, cập nhật ngày **2026-08-10**.

## 1. Đọc nhanh trong 1 phút

- Cấp dữ liệu chính là **Base SKU × Chi nhánh × Tháng**.
- Demand Pattern được tính ở cấp **Base SKU × Chi nhánh × Episode**.
- Một episode đủ điều kiện phân loại khi có ít nhất **12 tháng lịch sử** và **3 tháng demand dương**.
- Ngưỡng hiện tại: **ADI = 2.333333**, **CV² = 1.007962**.
- Có ít nhất 6 tháng zero giữa hai tháng demand dương thì xem là một lần tái bán/relaunch và tách episode mới.
- SKU/chi nhánh inactive quá 12 tháng kể từ lần demand dương cuối sẽ bị loại khỏi phân loại hiện hành.
- Tab Vùng và Bộ mẫu không tính lại ADI/CV² trên dữ liệu gộp; chúng roll-up từ episode mới nhất của từng Base SKU × Chi nhánh.
- ABC luôn dựa trên tỷ trọng quantity, nhưng được tính riêng theo phạm vi của từng màn hình.

## 2. Các cấp dữ liệu cần phân biệt

| Cấp | Ý nghĩa |
|---|---|
| Bravo SKU | Mã SKU chi tiết/biến thể, có thể có đuôi màu |
| Base SKU | SKU gốc, gom các Bravo SKU cùng sản phẩm |
| Base SKU × Chi nhánh | Một chuỗi demand riêng tại một chi nhánh |
| Episode | Một giai đoạn bán liên tục của chuỗi; có thể tách khi ngừng bán dài rồi bán lại |
| Pattern set/Bộ mẫu | Nhóm nhiều Base SKU/Bravo SKU có chung `pattern_set` |

Không so sánh trực tiếp ADI của một Base SKU × Chi nhánh với quantity gộp của toàn vùng. Hai con số thuộc hai cấp khác nhau.

## 3. Trạng thái Hoạt động/Vô hiệu hóa

Một dòng SKU tại chi nhánh được xem là **Hoạt động** khi đồng thời:

```text
sku_status = "Hoạt động"
và branch_status = "Hoạt động"
```

Code có trim khoảng trắng và chuyển chữ thường trước khi so sánh.

Một cặp **Base SKU × Chi nhánh** được xem là hoạt động nếu còn ít nhất một biến thể hoạt động. Nếu không còn biến thể nào thỏa điều kiện trên thì cặp đó là **Vô hiệu hóa**.

Lưu ý: không có giao dịch không tự động đồng nghĩa với vô hiệu hóa. Trạng thái lấy từ trường trạng thái nghiệp vụ, không suy ra chỉ từ quantity.

## 4. Quantity, revenue, zero và missing

### Quantity

```text
Net quantity tháng = tổng quantity trong tháng
Gross quantity tháng = max(Net quantity tháng, 0)
```

- Quantity âm được giữ để nhận biết return/hàng trả.
- Khi hiển thị gross demand, tháng có net âm được đưa về 0 nhưng vẫn có cảnh báo “net quantity âm”.
- Revenue chỉ cộng các dòng có quantity dương và không lấy amount âm.

### Zero và missing

- **Zero quan sát được**: có dữ liệu nhưng tổng demand bằng 0.
- **Missing**: không có dòng dữ liệu cho tháng đó.
- Khi dựng episode, các tháng nằm giữa tháng demand dương đầu tiên và điểm kết thúc chuỗi được zero-fill để đo độ gián đoạn.
- Module danh sách SKU hiện cũng zero-fill các tháng thiếu trong cửa sổ 12 tháng để vẽ trend. Số 0 này phục vụ hiển thị, không nên hiểu là bằng chứng chắc chắn SKU đã sẵn sàng bán nhưng không phát sinh nhu cầu.

## 5. Episode được tạo như thế nào?

Episode giúp tránh trộn lịch sử cũ với một lần tái bán sau thời gian ngừng dài.

1. Tìm tháng có net demand dương đầu tiên.
2. Với chuỗi hoạt động, kéo chuỗi đến tháng dữ liệu mới nhất.
3. Với chuỗi inactive, dừng tại tháng demand dương cuối cùng.
4. Nếu giữa hai tháng demand dương có ít nhất **6 tháng zero**, tách episode mới.
5. Episode mới nhất được dùng cho pattern hiện hành; episode cũ vẫn giữ để drill-down và so sánh thay đổi pattern.

Ví dụ:

```text
T1 bán dương → T2 bán dương → T3…T8 bằng 0 → T9 bán dương
```

Khoảng T3–T8 có 6 tháng zero, vì vậy T9 bắt đầu episode mới.

## 6. Thế nào là chuỗi đủ/thiếu?

Một episode được xem là **đủ dữ liệu để phân loại** khi thỏa tất cả điều kiện:

```text
history_months >= 12
positive_months >= 3
ADI tính được
CV² tính được
```

Nếu thiếu bất kỳ điều kiện nào, pattern là **Insufficient-New** — “Chưa đủ lịch sử”.

| Tình huống | Kết quả |
|---|---|
| 11 tháng lịch sử, dù bán đều | Insufficient-New |
| 12 tháng lịch sử nhưng chỉ 2 tháng dương | Insufficient-New |
| Không có tháng net demand dương, chuỗi còn active | Insufficient-New |
| Không có tháng net demand dương, chuỗi inactive | Excluded-Inactive |

## 7. ADI được tính như thế nào?

ADI đo mức độ thường xuyên xuất hiện demand dương:

```text
ADI = Số tháng trong episode / Số tháng có net demand dương
```

Ví dụ:

- 12 tháng, tháng nào cũng có demand dương: `ADI = 12 / 12 = 1`.
- 12 tháng, chỉ có 4 tháng demand dương: `ADI = 12 / 4 = 3`.

ADI càng thấp thì demand xuất hiện càng đều. ADI càng cao thì chuỗi càng gián đoạn.

Ngưỡng đang dùng:

```text
ADI threshold = 2.333333
```

## 8. CV² được tính như thế nào?

CV² đo mức độ biến động về độ lớn của demand trong các tháng có demand dương:

```text
CV² = (Độ lệch chuẩn mẫu của demand dương / Trung bình demand dương)²
```

Chỉ các tháng có demand dương được đưa vào công thức; tháng zero và tháng net âm không tham gia tính CV².

- CV² thấp: lượng bán trong các tháng có bán tương đối ổn định.
- CV² cao: lượng bán lúc cao lúc thấp, khó ổn định.

Ngưỡng đang dùng:

```text
CV² threshold = 1.007962
```

## 9. Bốn nhóm Demand Pattern

| Pattern | Điều kiện | Cách hiểu ngắn |
|---|---|---|
| Smooth | ADI < 2.333333 và CV² < 1.007962 | Bán tương đối đều, lượng bán ổn định |
| Erratic | ADI < 2.333333 và CV² ≥ 1.007962 | Có bán thường xuyên nhưng lượng bán biến động mạnh |
| Intermittent | ADI ≥ 2.333333 và CV² < 1.007962 | Bán gián đoạn nhưng lượng mỗi lần khá ổn định |
| Lumpy | ADI ≥ 2.333333 và CV² ≥ 1.007962 | Vừa gián đoạn vừa biến động mạnh; cần review kỹ |

Hai trạng thái bổ sung:

- **Insufficient-New**: chưa đủ dữ liệu để xếp vào bốn nhóm trên.
- **Excluded-Inactive**: inactive quá lâu hoặc không còn phù hợp để đưa vào phân loại hiện hành.

## 10. Quy tắc inactive và loại khỏi phân loại

```text
Recency = số tháng từ tháng demand dương cuối đến tháng dữ liệu mới nhất
```

- Chuỗi inactive nhưng lần bán dương cuối cách hiện tại không quá 12 tháng: vẫn giữ episode mới nhất để tham khảo.
- Chuỗi inactive quá **12 tháng**: episode mới nhất mang nhãn `Excluded-Inactive`.
- Episode lịch sử của một chuỗi inactive không được dùng để tính pattern hiện hành.
- Dữ liệu không bị xóa; việc “excluded” chỉ có nghĩa là không dùng trong roll-up hiện tại.

## 11. Trọng số khi roll-up

Tab Vùng và Bộ mẫu dùng trọng số theo độ dài lịch sử:

```text
series_weight = sqrt(min(history_months, 36) / 12)
```

- 12 tháng lịch sử có trọng số `1`.
- Trên 36 tháng không tăng thêm trọng số.
- Episode bị excluded không tham gia trung bình ADI/CV² và tỷ lệ pattern.

Pattern chủ đạo là nhóm có tổng trọng số lớn nhất. ADI/CV² cấp Vùng hoặc Bộ mẫu là trung bình có trọng số, không phải ADI/CV² tính lại từ chuỗi quantity gộp.

### Độ phân tán pattern của Bộ mẫu

```text
Pattern dispersion = 1 - Trọng số pattern chủ đạo / Tổng trọng số đủ điều kiện
```

Web cảnh báo khi dispersion từ **40%** trở lên, nghĩa là pattern chủ đạo chiếm dưới 60% tổng trọng số.

## 12. ABC được tính như thế nào?

Trong từng phạm vi, các đối tượng được xếp giảm dần theo gross quantity:

```text
A: phần tích lũy trước dòng hiện tại < 80%
B: phần tích lũy trước dòng hiện tại từ 80% đến dưới 95%
C: phần còn lại
```

Phạm vi tính khác nhau theo màn hình:

- SKU × Chi nhánh: ABC tính riêng trong từng chi nhánh.
- Vùng: ABC tính riêng trong từng vùng.
- Bộ mẫu: ABC tính trên các bộ mẫu trong phạm vi bộ lọc hiện tại.

Vì phạm vi khác nhau, cùng một SKU/bộ mẫu có thể là A ở màn hình này nhưng B ở màn hình khác.

## 13. Growth, YoY và vòng đời

### Tăng trưởng

```text
MoM growth = Quantity tháng mới nhất / Quantity tháng trước - 1
YoY growth = Quantity tháng mới nhất / Quantity cùng kỳ năm trước - 1
```

Nếu kỳ so sánh bằng 0 hoặc không có dữ liệu thì growth là `null` và giao diện hiển thị `—`.

### Vòng đời Bộ mẫu

- **Mới ra mắt**: quan sát đầu tiên nằm trong 6 tháng gần nhất.
- **Đang tăng trưởng**: trung bình 3 tháng gần nhất tăng ít nhất 15% so với 3 tháng trước đó; hoặc kỳ trước bằng 0 và kỳ gần nhất có demand.
- **Đang suy giảm**: trung bình 3 tháng gần nhất giảm ít nhất 15%.
- **Trưởng thành**: các trường hợp còn lại.

## 14. Các cảnh báo trên màn hình SKU × Chi nhánh

| Cảnh báo | Khi xuất hiện |
|---|---|
| Demand Lumpy | ADI và CV² đều cao |
| Chưa đủ lịch sử | Episode chưa đạt 12 tháng hoặc 3 tháng dương |
| Inactive quá lâu | Lần demand dương cuối vượt quá 12 tháng |
| Có tháng net quantity âm | Return lớn hơn sales trong ít nhất một tháng |
| Demand spike | Max demand lớn hơn trung bình demand dương cộng 3 độ lệch chuẩn mẫu |
| Pattern changed | Pattern episode mới nhất khác episode liền trước |

`Pattern changed` so sánh giữa các episode, không phải so sánh hai lần refresh dữ liệu.

## 15. Logic chính của từng khu vực trên web

### Tra cứu SKU

- Một dòng là một Base SKU × Chi nhánh.
- Hiển thị trạng thái, số biến thể active/tổng, gross/net/return và trend 12 tháng.
- Drill-down hiển thị các Bravo SKU cấu thành.

### SKU × Chi nhánh

- Một dòng chính là latest episode của Base SKU × Chi nhánh.
- Date filter thay đổi quantity, revenue, growth và ABC trong kỳ.
- Date filter **không tính lại Demand Pattern**; pattern lấy từ mart episode dùng chung.

### Vùng

- Quantity và KPI được cộng theo vùng trong kỳ chọn.
- Pattern mix và ADI/CV² là roll-up có trọng số từ latest episode.
- Inactive rate = số cặp Base SKU × Chi nhánh inactive / tổng số cặp trong vùng.

### Bộ mẫu

- Gom các Base SKU/Bravo SKU cùng `pattern_set`.
- Demand Pattern là pattern có tổng `series_weight` lớn nhất.
- Hiển thị tỷ lệ variant inactive, quantity/revenue trên mỗi line và vòng đời.

### Forecast

Các phương pháp ứng viên hiện tại:

| Phương pháp | Công thức ngắn |
|---|---|
| Naive | Bằng actual gần nhất |
| Moving average 3 | Trung bình 3 quan sát gần nhất |
| Weighted average 3 | `50% tháng gần nhất + 30% tháng trước + 20% tháng trước nữa` |
| Seasonal naive | Bằng actual cùng tháng năm trước |

Backend backtest trên 6 tháng gần nhất và chọn phương pháp có MAE thấp nhất. Nếu bằng nhau, ưu tiên Seasonal naive → Moving average 3 → Weighted average 3 → Naive. Horizon mặc định là 3 tháng.

Các chỉ số:

```text
MAE  = trung bình |FC - TT|
WAPE = tổng |FC - TT| / tổng |TT|
Bias = tổng (FC - TT) / tổng |TT|
Acc  = max(0, 1 - |FC - TT| / TT), chỉ tính khi TT > 0
```

- Bias dương: dự báo cao hơn thực tế; Bias âm: dự báo thấp hơn thực tế.
- Khi tổng actual bằng 0, WAPE/Bias là `null`.
- Khoảng dự báo hiện dùng point forecast ± `1.28 × residual scale`; cận dưới không nhỏ hơn 0.

## 16. Cách đọc web an toàn

1. Kiểm tra `Dữ liệu đến tháng` trước khi kết luận.
2. Xem trạng thái active/inactive và chuỗi có đủ lịch sử hay không.
3. Dùng ADI để hiểu độ thường xuyên, CV² để hiểu độ biến động về lượng.
4. Với Lumpy hoặc Insufficient-New, không nên dựa vào một con số forecast duy nhất.
5. Khi xem Vùng/Bộ mẫu, nhớ rằng ADI/CV² là số roll-up có trọng số.
6. Quantity bằng 0 trên chart có thể là zero-fill của tháng thiếu; cần drill-down trước khi kết luận không có nhu cầu.

## 17. Nguồn sự thật trong hệ thống

| Nội dung | Nguồn hiện tại |
|---|---|
| Sales và trạng thái SKU/chi nhánh | `source.mart_sku_branch_month` |
| Demand Pattern episode | `analytics.mart_demand_pattern_episode` |
| Ngưỡng ADI/CV² | `backend/app/demand_pattern.py` |
| Logic episode/pattern | `backend/app/services/demand_pattern_episode.py` |
| Logic Forecast | `backend/app/services/forecast.py` |

Khi thay đổi ngưỡng hoặc policy episode, cần refresh lại mart Demand Pattern; chỉ restart web không làm thay đổi dữ liệu đã tính.
