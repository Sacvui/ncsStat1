# ncsStat: Nền tảng Phân tích Thống kê Trực tuyến

**"Democratizing Data Science for Vietnamese Researchers"**

🔗 **Live App:** [https://stat.ncskit.org](https://stat.ncskit.org)

📄 **Version:** 1.2.0 (Stable Release)

---

## 📄 Giới Thiệu

**ncsStat** là nền tảng phân tích thống kê mã nguồn mở, chạy trực tiếp trên trình duyệt web, được thiết kế đặc biệt cho Nghiên cứu sinh và Giảng viên tại Việt Nam.

### Điểm nổi bật:
- 🔒 **Bảo mật tuyệt đối:** Dữ liệu xử lý 100% client-side, không upload lên server
- ⚡ **Tốc độ cao:** WebAssembly R runtime, không độ trễ mạng
- 💸 **Miễn phí hoàn toàn:** Thay thế SPSS/AMOS đắt đỏ
- 🧠 **AI hỗ trợ:** Gemini AI tự động giải thích kết quả bằng tiếng Việt
- 🌐 **Đa ngôn ngữ:** Hỗ trợ Tiếng Việt và English

---

## 🚀 Tính Năng Chính

### 1. Phân Tích Đa Dạng

| Nhóm | Phương pháp | Chi tiết |
|------|-------------|----------|
| **Độ tin cậy** | Cronbach's Alpha | Item-total stats, Alpha if deleted, Likert 1-5/1-7 |
| **Tương quan** | Pearson, Spearman, Kendall | Ma trận r + p-values |
| **So sánh nhóm** | T-test (độc lập, ghép cặp) | Shapiro-Wilk, Levene's, Cohen's d |
| **ANOVA** | One-Way ANOVA | Tukey HSD post-hoc, Eta² |
| **Khám phá** | EFA | KMO, Bartlett, Varimax/Oblimin |
| **Khẳng định** | CFA | CFI, TLI, RMSEA, SRMR |
| **Mô hình** | SEM | Structural paths, Fit indices |
| **Hồi quy** | Linear Regression | VIF, R², Shapiro residuals |
| **Phi tham số** | Mann-Whitney U, Chi-Square | Effect size (r, Cramér's V) |
| **Mô tả** | Descriptive Stats | Mean, SD, Skew, Kurtosis, SE |

### 2. Kiểm định Giả định (Assumption Tests) ✅

Tự động kiểm tra các giả định thống kê:
- **Shapiro-Wilk:** Kiểm tra phân phối chuẩn
- **Levene's Test:** Kiểm tra đồng nhất phương sai
- **Residual Normality:** Phân phối chuẩn của phần dư

### 3. Workflow Mode (Trợ lý thông minh) 🎯

Hướng dẫn từng bước phân tích:
- Cronbach's Alpha → EFA (khi độ tin cậy đạt)
- EFA → CFA (khi cấu trúc nhân tố rõ ràng)
- CFA → SEM (khi mô hình phù hợp)

### 4. AI Interpretation 🤖

- Tự động viết nhận xét, đánh giá kết quả
- Giải thích các chỉ số phức tạp (CFI, RMSEA, p-value)
- Ngôn ngữ học thuật chuẩn paper

---

## 🛠️ Công Nghệ

| Layer | Stack |
|-------|-------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, Lucide Icons |
| **R Engine** | WebR (WebAssembly R) |
| **R Packages** | `psych`, `GPArotation`, `corrplot` |
| **AI** | Google Gemini 2.0 Flash |
| **Auth** | Supabase Auth (Google, ORCID, LinkedIn) |
| **Database** | Supabase PostgreSQL |
| **Hosting** | Vercel Edge Network |

---

## 📚 Hướng Dẫn Trích Dẫn (Citation)

Khi sử dụng **ncsStat** cho luận văn, luận án hoặc bài báo, vui lòng trích dẫn:

### Trong phần Phương pháp:
> "Dữ liệu được phân tích bằng ngôn ngữ R (R Core Team, 2024) thông qua nền tảng **ncsStat** (Le, 2026). Các phân tích độ tin cậy và nhân tố sử dụng package `psych` (Revelle, 2024)."

### Trong Danh mục Tài liệu tham khảo:

**APA Format:**
> Le, P. H. (2026). *ncsStat: A Web-Based Statistical Analysis Platform for Vietnamese Researchers*. https://stat.ncskit.org

**Tiếng Việt:**
> Lê Phúc Hải (2026). *ncsStat: Nền tảng phân tích thống kê trực tuyến cho nghiên cứu sinh Việt Nam*. Truy cập từ https://stat.ncskit.org

---

## 📦 Cài Đặt Local

```bash
# 1. Clone repo
git clone https://github.com/hailp1/ncsStat2.git
cd ncsStat2

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Run dev server
npm run dev
```

Truy cập `http://localhost:3000`

### Environment Variables cần thiết:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
```

---

## 📂 Cấu trúc Project

```
ncsStat/
├── app/                    # Next.js App Router
│   ├── analyze/            # Trang phân tích chính
│   ├── login/              # Đăng nhập OAuth
│   ├── profile/            # Hồ sơ người dùng
│   └── admin/              # Quản trị
├── components/             # React Components
│   ├── layout/             # Header, Footer
│   ├── ui/                 # Reusable UI components
│   └── results/            # Hiển thị kết quả
├── lib/
│   ├── webr-wrapper.ts     # R statistical functions
│   ├── i18n.ts             # Internationalization
│   └── pdf-exporter.ts     # PDF export
├── paper/                  # Publication documents
│   └── R_CODE_REFERENCE.md # R code documentation
└── utils/supabase/         # Supabase client
```

---

## 📝 License

MIT License © 2026 Le Phuc Hai

---

## 🙏 Acknowledgments

- **WebR Project:** https://docs.r-wasm.org/
- **psych R Package:** William Revelle
- **Next.js:** Vercel Team
- **Supabase:** Open source Firebase alternative
