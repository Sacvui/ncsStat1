# Hướng Dẫn Sử Dụng Các Tính Năng Phân Tích (ncsStat)

Tài liệu này hướng dẫn chi tiết cách thiết lập và sử dụng các công cụ phân tích thống kê hiện có trên hệ thống **ncsStat**.

---

## 1. Thống Kê Mô Tả (Descriptive Statistics)
Dùng để tóm tắt các đặc điểm cơ bản của dữ liệu (Trung bình, Trung vị, Độ lệch chuẩn, Min, Max, Skewness, Kurtosis).

*   **Dữ liệu đầu vào**: Các biến định lượng (Numeric).
*   **Cách thực hiện**:
    1.  Chọn menu **Descriptive**.
    2.  Chọn các biến cần tính toán (có thể chọn nhiều biến cùng lúc).
    3.  Nhấn **Chạy Phân Tích**.
*   **Kết quả**: Bảng thống kê chi tiết cho từng biến.

---

## 2. Kiểm Định Độ Tin Cậy (Cronbach's Alpha)
Đánh giá độ tin cậy trọn bộ thang đo (Internal Consistency).

*   **Dữ liệu đầu vào**: Các biến quan sát (items) thuộc cùng một nhân tố (thường là thang đo Likert).
*   **Cách thực hiện**:
    1.  Chọn menu **Cronbach's Alpha**.
    2.  Chọn tất cả các biến quan sát của nhân tố (Ví dụ: `DL1`, `DL2`, `DL3`).
    3.  Nhấn **Chạy Phân Tích**.
*   **Kết quả**:
    *   Hệ số Cronbach's Alpha tổng.
    *   Bảng Cronbach's Alpha if Item Deleted (để xem xét loại bỏ biến rác).

---

## 3. Phân Tích Nhân Tố Khám Phá (EFA)
Rút gọn tập biến quan sát thành các nhân tố tiềm ẩn.

*   **Dữ liệu đầu vào**: Tất cả các biến quan sát dự kiến đưa vào mô hình (Định lượng/Likert).
*   **Cách thực hiện**:
    1.  Chọn menu **EFA**.
    2.  Chọn tất cả các biến quan sát.
    3.  Cấu hình (Tùy chọn):
        *   **Số nhân tố**: Để mặc định (Auto) để hệ thống tự xác định dựa trên Eigenvalue > 1.
        *   **Phép trích**: Thường dùng `Principal Axis Factoring`.
        *   **Phép quay**: `Promax` (nếu các nhân tố có tương quan) hoặc `Varimax` (nếu độc lập).
    4.  Nhấn **Chạy EFA**.
*   **Lưu ý**: Hệ thống tự động kiểm tra và cảnh báo nếu có dữ liệu khuyết (N/A) hoặc phương sai bằng 0.

---

## 4. Kiểm Định T-Test (So Sánh Trung Bình 2 Nhóm)
Hiện tại hệ thống hỗ trợ **Independent Samples T-Test** (So sánh 2 nhóm độc lập).

*   **Dữ liệu đầu vào**:
    *   **Biến phân nhóm (Grouping Variable)**: Biến định tính có đúng 2 giá trị (Ví dụ: `GioiTinh` (Nam/Nữ)).
    *   **Biến phụ thuộc (Test Variable)**: Biến định lượng cần so sánh (Ví dụ: `ThuNhap`).
*   **Cách thực hiện**:
    1.  Chọn menu **T-Test**.
    2.  Bước 1: Chọn **Biến Phân Nhóm** (Chọn 1 biến).
    3.  Bước 2: Chọn **Biến Cần Kiểm Định** (Chọn 1 hoặc nhiều biến).
    4.  Nhấn **Chạy T-Test**.
*   **Kết quả**:
    *   Kiểm định Levene (Phương sai đồng nhất).
    *   Kết quả T-Test (Sự khác biệt có ý nghĩa thống kê hay không).
    *   Kích thước ảnh hưởng (Cohen's d).

---

## 5. Phân Tích Phương Sai (One-Way ANOVA)
So sánh trung bình của 3 nhóm trở lên.

*   **Dữ liệu đầu vào**:
    *   **Biến nhân tố (Factor)**: Biến định tính phân loại >= 3 nhóm (Ví dụ: `NhomTuoi`, `TrinhDo`).
    *   **Biến phụ thuộc (Dependent)**: Biến định lượng (Ví dụ: `HaiLong`).
*   **Cách thực hiện**:
    1.  Chọn menu **ANOVA**.
    2.  Chọn **Biến Phân Nhóm** (Factor).
    3.  Chọn **Biến Phụ Thuộc** (Dependent).
    4.  Nhấn **Chạy ANOVA**.
*   **Kết quả**: Bảng ANOVA và kiểm định Post-hoc (Tukey) nếu có sự khác biệt.

---

## 6. Tương Quan Pearson (Correlation)
Đánh giá mối quan hệ tuyến tính giữa các biến định lượng.

*   **Dữ liệu đầu vào**: Các biến định lượng (Numeric).
*   **Cách thực hiện**:
    1.  Chọn menu **Correlation**.
    2.  Chọn các biến cần xem xét tương quan.
    3.  Nhấn **Chạy Phân Tích**.
*   **Kết quả**: Ma trận tương quan (Hệ số r và p-value).

---

## 7. Hồi Quy Tuyến Tính (Linear Regression)
Đánh giá tác động của các biến độc lập lên biến phụ thuộc.

*   **Dữ liệu đầu vào**:
    *   **Biến phụ thuộc (DV)**: 1 biến định lượng.
    *   **Biến độc lập (IVs)**: Các biến định lượng tác động.
*   **Cách thực hiện**:
    1.  Chọn menu **Regression**.
    2.  Chọn **Biến Phụ Thuộc** (Y).
    3.  Chọn **Các Biến Độc Lập** (X1, X2...).
    4.  Nhấn **Chạy Hồi Quy**.
*   **Kết quả**:
    *   Hệ số R-bình phương (R-square).
    *   Hệ số hồi quy (Beta), độ tin cậy.
    *   Kiểm định giả thuyết (VIF, Durbin-Watson, Normality).

---

## 8. Kiểm Định Chi-Bình Phương (Chi-Square Test of Independence)
Kiểm tra mối quan hệ giữa 2 biến định danh (Categorical).

*   **Dữ liệu đầu vào**: 2 biến định danh/phân loại (Ví dụ: `GioiTinh` và `SuYeuThich`).
*   **Cách thực hiện**:
    1.  Chọn menu **Chi-Square**.
    2.  Chọn **Biến Hàng (Row)**.
    3.  Chọn **Biến Cột (Column)**.
    4.  Nhấn **Chạy Kiểm Định**.
*   **Kết quả**: Bảng chéo (Crosstab), giá trị Chi-square và P-value.

---

## 9. Kiểm Định Phi Tham Số Mann-Whitney U
So sánh trung bình hạng của 2 nhóm (Dùng khi dữ liệu không phân phối chuẩn).

*   **Dữ liệu đầu vào**: 2 cột dữ liệu số riêng biệt đại diện cho 2 nhóm cần so sánh.
    *   *LT*: Khác với T-Test dùng biến phân nhóm, phép kiểm này hiện tại trên hệ thống y/c chọn dữ liệu 2 nhóm từ 2 biến khác nhau (nếu dữ liệu ở dạng cột) hoặc 2 biến bất kỳ để so sánh.
*   **Cách thực hiện**:
    1.  Chọn menu **Mann-Whitney U**.
    2.  Chọn **Biến 1**.
    3.  Chọn **Biến 2**.
    4.  Nhấn **Chạy Kiểm Định**.
*   **Kết quả**: Thống kê U, P-value và kích thước ảnh hưởng (Effect Size r).

---

### Lưu Ý Chung
*   **Dữ Liệu Khuyết (Missing Values)**: Hầu hết các phép phân tích sẽ tự động loại bỏ các hàng có dữ liệu khuyết (Listwise Deletion). Hãy đảm bảo làm sạch dữ liệu (hoặc dùng tính năng "Clean Data" nếu có) trước khi chạy để kết quả chính xác.
*   **Biến Định Tính**: Với các biến dạng chữ (String), hệ thống tự động xử lý trong Chi-Square. Với Regression/EFA, hệ thống yêu cầu biến số.
