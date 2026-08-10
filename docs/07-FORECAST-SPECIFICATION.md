# Đặc tả forecast thống kê

## 1. Mục tiêu và grain

Forecast mặc định tại:

```text
base_sku × branch_code × origin_month × target_month
```

Target baseline:

```text
gross_positive_qty M2
```

Quantity âm vẫn được lưu thành `return_qty` và đánh giá trong EDA. Nếu sau này chọn net demand, phải tạo forecast run mới với `target_measure = net_qty`; không ghi đè run gross.

## 2. Dữ liệu đầu vào

- Chỉ `unit = M2`, `group2 = L1`, chi nhánh active.
- Aggregate mọi Bravo SKU thuộc cùng SKU gốc.
- Status hiện tại dùng để hiển thị/lọc, không được dùng để sửa actual quá khứ.
- Missing không tự động là zero.
- Series không đủ dữ liệu phải nhận fallback/cảnh báo, không chạy công thức không phù hợp.

## 3. Forecast origin và leakage

Tại một origin `t`, mọi feature và parameter chỉ được dùng dữ liệu có tháng `<= t`.

```text
forecast_month > origin_month
training_month <= origin_month
```

FC hiển thị ở các tháng quá khứ trong Module 3 phải là dự báo out-of-sample từ rolling backtest. Không dùng fitted value được huấn luyện trên chính actual của tháng đó.

## 4. Các phương pháp MVP

Ký hiệu `y_t` là gross quantity tại tháng `t`.

### Naive

```text
FC(t+h) = y_t
```

Phù hợp baseline đơn giản và series tương đối ổn định.

### Moving Average k tháng

```text
FC(t+1) = (y_t + y_(t-1) + ... + y_(t-k+1)) / k
```

Ứng viên `k ∈ {3, 6}`. Với multi-step, dùng recursive hoặc fixed forecast và ghi rõ strategy trong run metadata.

### Weighted Moving Average

```text
FC(t+1) = Σ(w_i × y_(t-i+1)),  Σw_i = 1
```

Trọng số mặc định cho ba tháng: `0.5, 0.3, 0.2`; chỉ giữ nếu backtest tốt hơn MA thường.

### Seasonal Naive

```text
FC(t+h) = y_(t+h-12)
```

Chỉ dùng khi có tối thiểu một chu kỳ 12 tháng trước target; ưu tiên tối thiểu 24 tháng để đánh giá.

### Simple Exponential Smoothing

```text
level_t = α y_t + (1-α) level_(t-1)
FC(t+h) = level_t
```

`α` được fit chỉ trên training window hoặc chọn từ grid cố định; phải lưu parameter.

### Linear Trend

```text
y_t = a + b t + error
FC(t+h) = max(0, a + b(t+h))
```

Chỉ là baseline; cảnh báo khi slope bị chi phối bởi outlier.

### Croston/SBA

Dùng cho nhu cầu gián đoạn nếu zero thực sự được xác nhận. Trong data contract hiện tại missing chưa chắc là zero, vì vậy Croston/SBA chỉ được bật sau khi có quy tắc eligibility/zero-fill được phê duyệt. Không tự bật trong MVP ban đầu.

## 5. Rolling backtest

Ví dụ dữ liệu đến `2026-06`, horizon 1–3:

```text
Origin 2025-12 → dự báo 2026-01..2026-03
Origin 2026-01 → dự báo 2026-02..2026-04
Origin 2026-02 → dự báo 2026-03..2026-05
Origin 2026-03 → dự báo 2026-04..2026-06
```

Không dùng random train/test split.

Điều kiện tối thiểu đề xuất:

- Có ít nhất 12 tháng lịch sử quan sát để chạy baseline non-seasonal.
- Seasonal naive cần đủ lag 12 cho từng target.
- Có ít nhất 3 origin đánh giá cho việc chọn model; nếu không đủ, dùng fallback và gắn `low_evidence`.

## 6. Metrics

### MAE

```text
MAE = mean(abs(FC - TT))
```

### WAPE

```text
WAPE = sum(abs(FC - TT)) / sum(abs(TT))
```

Nếu mẫu số bằng 0, WAPE là null.

### Bias

```text
Bias = sum(FC - TT) / sum(abs(TT))
```

Bias dương là dự báo cao; âm là dự báo thấp.

### RMSE

```text
RMSE = sqrt(mean((FC - TT)^2))
```

### Cell Accuracy cho giao diện

```text
Acc = max(0, 1 - abs(FC - TT) / TT), chỉ khi TT > 0
```

`Acc` là chỉ số trình bày, không phải metric chọn model. Không lấy trung bình Acc qua các ô.

## 7. Chọn phương pháp

1. Đánh giá từng method theo từng horizon trên rolling origins.
2. Metric chính: WAPE; tie-breaker: MAE rồi `abs(Bias)`.
3. Áp dụng ngưỡng số origin tối thiểu.
4. Nếu chênh lệch rất nhỏ, ưu tiên method đơn giản hơn.
5. Lưu leaderboard và lý do chọn.

Fallback đề xuất:

```text
seasonal_naive nếu đủ dữ liệu và thắng backtest
best non-seasonal baseline nếu không
naive nếu evidence quá ít
null forecast + warning nếu không có quan sát hợp lệ
```

## 8. Khoảng dự báo

MVP có thể dùng empirical residual quantiles từ rolling backtest theo horizon:

```text
lower = max(0, point_forecast + quantile(residual, 0.10))
upper = max(0, point_forecast + quantile(residual, 0.90))
```

Chỉ hiển thị interval nếu số residual đủ ngưỡng đã cấu hình; nếu không, trả null và `interval_unavailable`.

## 9. SKU inactive

- Vẫn giữ và hiển thị forecast lịch sử để đánh giá.
- Forecast tương lai mặc định không tạo hoặc được đặt trạng thái `suppressed_inactive` nếu SKU gốc đã vô hiệu hóa tại origin hiện tại.
- Không được xóa lịch sử sales của SKU inactive.
- Nếu nghiệp vụ muốn forecast tồn đơn sau ngày vô hiệu hóa, cần rule riêng.

## 10. Forecast run metadata

Mỗi run phải lưu:

- `origin_month`, `horizon`, `target_measure`.
- Query/filter và source `pipeline_run_id`.
- Danh sách method/phiên bản code.
- Parameter và model-selection rule.
- Số series success/skipped/failed.
- Thời gian chạy và checksum/config version.

## 11. Acceptance tests forecast

- Không target month nào nhỏ hơn hoặc bằng origin trong future output.
- Không training row nào sau fold cutoff.
- Seasonal naive đúng bằng lag 12 trên fixture kiểm thử.
- WAPE/MAE/Bias khớp kết quả tính tay trên fixture nhỏ.
- TT bằng 0 trả `accuracy = null`.
- Forecast âm bị chặn về 0 nhưng raw estimate có thể lưu trong debug metadata.
- Cùng dữ liệu/config tạo kết quả tái lập.
