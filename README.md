# ncsStat: Nền tảng Phân tích Thống kê Trực tuyến

**"Democratizing Data Science for Vietnamese Researchers"**

🔗 **Live App:** [https://stat.ncskit.org](https://stat.ncskit.org)

📄 **Version:** 2.0.0 (Major Release - 2026-01-24)

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

### 1. Phân Tích Đa Dạng (18 phương pháp)

| Nhóm | Phương pháp | Chi tiết |
|------|-------------|----------|
| **Độ tin cậy** | Cronbach's Alpha + **McDonald's Omega** | Item-total stats, Alpha/Omega if deleted |
| **Tương quan** | Pearson, Spearman, Kendall | Ma trận r + p-values |
| **So sánh nhóm** | T-test (độc lập, ghép cặp) | Shapiro-Wilk, Levene's, Cohen's d |
| **ANOVA** | One-Way ANOVA (**Auto Welch**) | Tukey HSD, Eta², auto-switch |
| **Khám phá** | EFA (**Parallel Analysis**) | KMO, Bartlett, Varimax/Oblimin |
| **Khẳng định** | CFA | CFI, TLI, RMSEA, SRMR |
| **Mô hình** | SEM | Structural paths, Fit indices |
| **Hồi quy** | Linear Regression | VIF, R², **Standardized β** |
| **Hồi quy nhị phân** | **Logistic Regression** | Odds Ratio, Pseudo R², Confusion Matrix |
| **Phi tham số** | Mann-Whitney U, **Kruskal-Wallis** | Effect size (ε², r) |
| **Phi tham số cặp** | **Wilcoxon Signed-Rank** | Median diff, Effect r |
| **Phân loại** | Chi-Square + **Fisher's Exact** | Cramér's V, Warning < 5 |
| **Trung gian** | **Mediation Analysis** | Sobel test, Bootstrap CI 95% |
| **Mô tả** | Descriptive Stats | Mean, SD, Skew, Kurtosis, SE |

### 2. Kiểm định Giả định Tự động ✅

- **Shapiro-Wilk:** Phân phối chuẩn
- **Levene's Test:** Đồng nhất phương sai → **Auto Welch ANOVA**
- **Fisher's Exact:** Tự động cho bảng 2x2 nhỏ
- **Warning:** Cảnh báo khi expected < 5

### 3. Workflow Mode (Trợ lý thông minh) 🎯

- Cronbach's Alpha → EFA (khi α ≥ 0.7)
- EFA → CFA (khi cấu trúc rõ ràng)
- CFA → SEM (khi fit tốt)

### 4. AI Interpretation 🤖

- Tự động viết nhận xét học thuật
- Giải thích CFI, RMSEA, p-value cho người không chuyên
- Ngôn ngữ chuẩn paper

---

## 🛠️ Công Nghệ

| Layer | Stack |
|-------|-------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, Lucide Icons |
| **R Engine** | WebR (WebAssembly R) |
| **R Packages** | `psych`, `GPArotation` |
| **AI** | Google Gemini 2.0 Flash |
| **Auth** | Supabase Auth (Google, ORCID, LinkedIn) |
| **Database** | Supabase PostgreSQL |
| **Hosting** | Vercel Edge Network |

---

## 📚 Hướng Dẫn Trích Dẫn (Citation)

### Trong phần Phương pháp:
> "Dữ liệu được phân tích bằng ngôn ngữ R (R Core Team, 2024) thông qua nền tảng **ncsStat** (Le, 2026). Các phân tích độ tin cậy và nhân tố sử dụng package `psych` (Revelle, 2024)."

### Trong Danh mục Tài liệu tham khảo:

**APA Format:**
> Le, P. H. (2026). *ncsStat: A Web-Based Statistical Analysis Platform for Vietnamese Researchers*. https://stat.ncskit.org

**Tiếng Việt:**
> Lê Phúc Hải (2026). *ncsStat: Nền tảng phân tích thống kê trực tuyến cho nghiên cứu sinh Việt Nam*. https://stat.ncskit.org

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

---

## 📂 Cấu trúc Project

```
ncsStat/
├── app/                    # Next.js App Router
│   ├── analyze/            # Trang phân tích chính
│   ├── login/              # Đăng nhập OAuth
│   └── profile/            # Hồ sơ người dùng
├── components/             # React Components
├── lib/
│   ├── webr-wrapper.ts     # R statistical functions (2000+ lines)
│   ├── i18n.ts             # Internationalization
│   └── pdf-exporter.ts     # PDF export
├── paper/
│   └── R_CODE_REFERENCE.md # R code documentation (18 methods)
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
