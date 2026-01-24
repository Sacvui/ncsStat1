# HƯỚNG DẪN SỬ DỤNG ncsStat

## Phần mềm phân tích thống kê dành cho Nghiên cứu sinh Việt Nam

**Phiên bản:** 2.4  
**Website:** https://stat.ncskit.org  
**Công nghệ:** WebR (R trong trình duyệt), psych package

---

## MỤC LỤC

1. [Giới thiệu ncsStat](#1-giới-thiệu-ncsstat)
2. [Hướng dẫn truy cập](#2-hướng-dẫn-truy-cập)
3. [Quy trình phân tích 4 bước](#3-quy-trình-phân-tích-4-bước)
4. [Các phương pháp phân tích](#4-các-phương-pháp-phân-tích)
5. [Diễn giải kết quả](#5-diễn-giải-kết-quả)
6. [Câu hỏi thường gặp](#6-câu-hỏi-thường-gặp)

---

## 1. GIỚI THIỆU ncsStat

### 1.1 ncsStat là gì?

**ncsStat** (NCS Statistical Tool) là phần mềm phân tích thống kê trực tuyến được thiết kế đặc biệt cho Nghiên cứu sinh (NCS) và nhà nghiên cứu Việt Nam. Phần mềm hoạt động hoàn toàn trên trình duyệt web, không cần cài đặt.

### 1.2 Đặc điểm nổi bật

| Đặc điểm | Mô tả |
|----------|-------|
| **Miễn phí** | Hoàn toàn miễn phí cho mục đích nghiên cứu và học thuật |
| **Không cần cài đặt** | Chạy trực tiếp trên trình duyệt (Chrome, Firefox, Edge) |
| **Sử dụng R thực** | Tính toán bằng ngôn ngữ R với package `psych` - chuẩn quốc tế |
| **Bảo mật** | Dữ liệu xử lý hoàn toàn trên máy người dùng, không upload lên server |
| **Giao diện tiếng Việt** | Thiết kế thân thiện cho người dùng Việt Nam |

### 1.3 Các phân tích được hỗ trợ

- **Thống kê mô tả**: Mean, SD, Min, Max, Median
- **Cronbach's Alpha**: Kiểm tra độ tin cậy thang đo
- **Ma trận tương quan**: Pearson correlation
- **Independent T-test**: So sánh 2 nhóm độc lập
- **Paired T-test**: So sánh trước-sau
- **ANOVA**: So sánh nhiều nhóm
- **EFA**: Phân tích nhân tố khám phá
- **CFA**: Phân tích nhân tố khẳng định
- **SEM**: Mô hình cấu trúc tuyến tính
- **Hồi quy tuyến tính**: Multiple Linear Regression
- **Chi-Square**: Kiểm định độc lập
- **Mann-Whitney U**: Kiểm định phi tham số

---

## 2. HƯỚNG DẪN TRUY CẬP

### 2.1 Yêu cầu hệ thống

- **Trình duyệt**: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
- **Kết nối Internet**: Cần kết nối để tải WebR lần đầu (~20MB)
- **RAM**: Khuyến nghị từ 4GB trở lên

### 2.2 Đăng nhập

1. Truy cập **https://stat.ncskit.org**
2. Click **"Đăng nhập"**
3. Chọn một trong các phương thức:
   - **Google** (khuyến nghị)
   - **LinkedIn**
   - **ORCID** (dành cho researcher)

### 2.3 Lưu ý quan trọng

> ⚠️ **Lần đầu sử dụng**: R Engine cần 30-60 giây để tải. Vui lòng chờ thông báo "Sẵn sàng!" trước khi thực hiện phân tích.

---

## 3. QUY TRÌNH PHÂN TÍCH 4 BƯỚC

ncsStat sử dụng quy trình 4 bước đơn giản và trực quan:

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ BƯỚC 1  │ -> │ BƯỚC 2  │ -> │ BƯỚC 3  │ -> │ BƯỚC 4  │
│ Upload  │    │ Chọn PP │    │ Cấu hình│    │ Kết quả │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### BƯỚC 1: TẢI DỮ LIỆU (Upload Data)

**Mục đích:** Đưa dữ liệu vào hệ thống để phân tích.

**Định dạng hỗ trợ:**
- CSV (.csv) - Khuyến nghị
- Excel (.xlsx, .xls)

**Yêu cầu dữ liệu:**
- Dòng đầu tiên là tên biến (header)
- Mỗi dòng tiếp theo là 1 quan sát
- Giá trị số cho các biến định lượng

**Cách thực hiện:**
1. Kéo thả file vào vùng upload, HOẶC
2. Click để chọn file từ máy tính, HOẶC
3. Sử dụng "Dữ liệu mẫu" để test nhanh

### BƯỚC 2: CHỌN PHƯƠNG PHÁP (Select Method)

**Mục đích:** Chọn phương pháp phân tích phù hợp với mục tiêu nghiên cứu.

**Phân loại theo nhóm:**

| Nhóm | Phương pháp | Mục đích |
|------|------------|----------|
| **Độ tin cậy** | Cronbach's Alpha | Đánh giá thang đo |
| **So sánh nhóm** | T-test, ANOVA | So sánh trung bình |
| **Tương quan** | Correlation, Regression | Mối quan hệ biến |
| **Nhân tố** | EFA, CFA, SEM | Cấu trúc tiềm ẩn |

### BƯỚC 3: CẤU HÌNH BIẾN (Configure Variables)

**Mục đích:** Chọn các biến tham gia vào phân tích.

**Tính năng Smart Grouping:**
- Tự động nhận diện nhóm biến (VD: SAT1, SAT2, SAT3 → Nhóm SAT)
- Tiết kiệm thời gian cấu hình

**Với từng phương pháp:**
- **Cronbach**: Chọn các item thuộc cùng 1 thang đo
- **T-test**: Chọn biến phụ thuộc + biến nhóm
- **Regression**: Chọn biến phụ thuộc + các biến độc lập
- **EFA/CFA**: Chọn tất cả biến quan sát

### BƯỚC 4: XEM KẾT QUẢ (Results)

**Mục đích:** Hiển thị và xuất kết quả phân tích.

**Các thành phần kết quả:**
- **Bảng thống kê**: Các chỉ số chi tiết
- **AI Evaluation**: Đánh giá tự động (nếu có)
- **Biểu đồ**: Visualization (tùy phương pháp)

**Xuất kết quả:**
- **Export PDF**: Xuất báo cáo định dạng PDF chuẩn
- **Copy**: Sao chép bảng để dán vào Word/Excel

---

## 4. CÁC PHƯƠNG PHÁP PHÂN TÍCH

### 4.1 CRONBACH'S ALPHA

**Mục đích:** Đánh giá **độ tin cậy nội tại** của thang đo.

**Khi nào sử dụng:**
- Kiểm tra các item trong thang đo có đo lường cùng một khái niệm không
- Thường là bước đầu tiên sau khi thu thập dữ liệu

**Cách diễn giải:**

| Giá trị α | Đánh giá |
|-----------|----------|
| ≥ 0.9 | Xuất sắc (Excellent) |
| 0.8 - 0.9 | Tốt (Good) |
| 0.7 - 0.8 | Chấp nhận được (Acceptable) |
| 0.6 - 0.7 | Cần xem xét (Questionable) |
| < 0.6 | Kém, cần loại bỏ item |

**Chỉ số quan trọng:**
- **Cronbach's Alpha**: Độ tin cậy tổng thể
- **Item-Total Correlation**: Tương quan item-tổng (≥ 0.3 là tốt)
- **Alpha if Item Deleted**: Alpha nếu loại item (nếu cao hơn Alpha tổng → cân nhắc loại)

---

### 4.2 THỐNG KÊ MÔ TẢ (Descriptive Statistics)

**Mục đích:** Mô tả đặc điểm cơ bản của dữ liệu.

**Các chỉ số:**
- **Mean (Trung bình)**: Giá trị trung bình cộng
- **SD (Độ lệch chuẩn)**: Mức độ phân tán dữ liệu
- **Min/Max**: Giá trị nhỏ nhất/lớn nhất
- **Median**: Giá trị ở vị trí giữa
- **Skewness**: Độ lệch (±2 là chấp nhận được)
- **Kurtosis**: Độ nhọn (±7 là chấp nhận được)

---

### 4.3 MA TRẬN TƯƠNG QUAN (Correlation Matrix)

**Mục đích:** Đo lường **mức độ và hướng** quan hệ giữa 2 biến định lượng.

**Hệ số Pearson (r):**

| Giá trị |r| | Mức độ tương quan |
|----------|-------------------|
| 0.9 - 1.0 | Rất mạnh |
| 0.7 - 0.9 | Mạnh |
| 0.5 - 0.7 | Trung bình |
| 0.3 - 0.5 | Yếu |
| < 0.3 | Rất yếu |

**Lưu ý:**
- r > 0: Tương quan thuận (X tăng → Y tăng)
- r < 0: Tương quan nghịch (X tăng → Y giảm)
- p-value < 0.05: Có ý nghĩa thống kê

---

### 4.4 INDEPENDENT T-TEST

**Mục đích:** So sánh **trung bình** của 2 nhóm **độc lập**.

**Ví dụ:** So sánh điểm hài lòng giữa Nam và Nữ.

**Điều kiện áp dụng:**
- Biến phụ thuộc: Định lượng (thang Likert 1-5, điểm số...)
- Biến nhóm: Định danh 2 giá trị (Nam/Nữ, A/B...)
- Giả định: Phân phối chuẩn, phương sai đồng nhất

**Kết quả quan trọng:**
- **t-statistic**: Giá trị thống kê t
- **p-value**: < 0.05 → Có sự khác biệt có ý nghĩa
- **Mean difference**: Chênh lệch trung bình giữa 2 nhóm
- **Cohen's d**: Độ lớn hiệu ứng (0.2=nhỏ, 0.5=vừa, 0.8=lớn)

---

### 4.5 PAIRED T-TEST

**Mục đích:** So sánh trung bình của **cùng một nhóm** tại 2 thời điểm khác nhau.

**Ví dụ:** So sánh điểm kiến thức trước và sau khóa đào tạo.

**Điều kiện áp dụng:**
- Cùng một mẫu được đo 2 lần
- Biến phụ thuộc: Định lượng

---

### 4.6 ANOVA (Analysis of Variance)

**Mục đích:** So sánh trung bình của **3 nhóm trở lên**.

**Ví dụ:** So sánh điểm hài lòng giữa 3 vùng miền (Bắc, Trung, Nam).

**Kết quả:**
- **F-statistic**: Giá trị F
- **p-value**: < 0.05 → Có ít nhất 1 cặp nhóm khác biệt
- **Post-hoc test**: Xác định cặp nào khác biệt

---

### 4.7 EFA (Exploratory Factor Analysis)

**Mục đích:** **Khám phá** cấu trúc nhân tố tiềm ẩn trong dữ liệu.

**Khi nào sử dụng:**
- Giai đoạn nghiên cứu sơ bộ
- Chưa có lý thuyết rõ ràng về cấu trúc

**Tiêu chuẩn đánh giá:**

| Chỉ số | Ngưỡng chấp nhận |
|--------|------------------|
| KMO | ≥ 0.6 (tốt ≥ 0.8) |
| Bartlett's Test | p < 0.05 |
| Eigenvalue | ≥ 1.0 |
| Factor Loading | ≥ 0.5 |
| Cumulative Variance | ≥ 50% |

**Lưu ý:**
- Loại item có loading < 0.5 hoặc cross-loading
- Số factor phụ thuộc vào Eigenvalue hoặc Scree plot

---

### 4.8 CFA (Confirmatory Factor Analysis)

**Mục đích:** **Kiểm định** mô hình đo lường đã được đề xuất từ lý thuyết.

**Khi nào sử dụng:**
- Sau EFA hoặc có lý thuyết rõ ràng
- Nghiên cứu chính thức

**Tiêu chuẩn Model Fit:**

| Chỉ số | Ngưỡng tốt | Ngưỡng chấp nhận |
|--------|-----------|-----------------|
| Chi-square/df | < 2 | < 3 |
| CFI | ≥ 0.95 | ≥ 0.9 |
| TLI | ≥ 0.95 | ≥ 0.9 |
| RMSEA | < 0.05 | < 0.08 |
| SRMR | < 0.05 | < 0.08 |

---

### 4.9 SEM (Structural Equation Modeling)

**Mục đích:** Kiểm định mô hình **quan hệ nhân quả** giữa các biến tiềm ẩn.

**Đặc điểm:**
- Kết hợp CFA (mô hình đo lường) + Path Analysis (mô hình cấu trúc)
- Kiểm định đồng thời nhiều giả thuyết

**Kết quả quan trọng:**
- **Model Fit**: Như CFA
- **Path Coefficients (β)**: Hệ số đường dẫn
- **R²**: Phương sai được giải thích

---

### 4.10 HỒI QUY TUYẾN TÍNH (Multiple Linear Regression)

**Mục đích:** Dự đoán biến phụ thuộc từ các biến độc lập.

**Kết quả:**
- **R²**: Biến độc lập giải thích bao nhiêu % biến thiên của biến phụ thuộc
- **Adjusted R²**: R² hiệu chỉnh (chính xác hơn với nhiều biến)
- **Coefficients (B, β)**: Hệ số hồi quy
- **p-value**: Ý nghĩa thống kê của từng biến

---

## 5. DIỄN GIẢI KẾT QUẢ

### 5.1 Nguyên tắc chung

1. **Kiểm tra p-value trước**
   - p < 0.05: Có ý nghĩa thống kê
   - p ≥ 0.05: Không có ý nghĩa thống kê

2. **Xem xét độ lớn hiệu ứng**
   - Effect size cho biết mức độ quan trọng thực tế
   - Cohen's d, η², R²...

3. **Đối chiếu với lý thuyết**
   - Kết quả có phù hợp với giả thuyết không?
   - Có giải thích được không?

### 5.2 Lưu ý khi báo cáo

- Luôn báo cáo **cỡ mẫu (N)**
- Báo cáo **giá trị thống kê và p-value**
- Sử dụng **2-3 chữ số thập phân** (VD: α = 0.892, p < 0.001)
- Làm tròn hợp lý

---

## 6. CÂU HỎI THƯỜNG GẶP

### 6.1 R Engine không tải được?

**Nguyên nhân có thể:**
- Kết nối Internet không ổn định
- Trình duyệt quá cũ
- Chặn WebAssembly

**Cách khắc phục:**
1. Refresh trang (F5)
2. Thử trình duyệt Chrome phiên bản mới
3. Tắt VPN/Proxy nếu có
4. Xóa cache trình duyệt

### 6.2 Phân tích bị lỗi "NaN" hoặc "undefined"?

**Nguyên nhân:**
- Dữ liệu có ô trống (missing values)
- Dữ liệu không phải số

**Cách khắc phục:**
- Kiểm tra và xử lý missing values trong Excel trước khi upload
- Đảm bảo tất cả giá trị là số

### 6.3 Kết quả khác với SPSS?

**Lý do:**
- Thuật toán/options khác nhau
- Làm tròn khác nhau
- ncsStat sử dụng R psych package - chuẩn quốc tế

**Kết luận:** Chênh lệch nhỏ (0.001-0.01) là bình thường.

### 6.4 Làm sao để cite ncsStat?

```
ncsStat (2026). ncsStat: Statistical Analysis Tool for Vietnamese Researchers. 
Version 2.4. https://stat.ncskit.org
```

---

## LIÊN HỆ HỖ TRỢ

- **Website:** https://stat.ncskit.org
- **Feedback:** Sử dụng nút "Gửi phản hồi" trong menu

---

*Tài liệu này được cập nhật ngày 24/01/2026*
