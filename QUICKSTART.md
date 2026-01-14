# StatViet - Quick Start Guide

## 🚀 Chạy Ứng Dụng

```bash
cd d:\NC101_hy\statviet
npm run dev
```

Truy cập: **http://localhost:3002**

---

## 📊 Test với Sample Data

File mẫu: `sample_data.csv` (đã có sẵn trong project)

### Workflow:
1. Vào `/analyze`
2. Upload `sample_data.csv`
3. Xem báo cáo Data Profiling
4. Chọn phân tích (Cronbach's Alpha, Correlation, Descriptive)
5. Xem kết quả với visualization
6. Xuất PDF

---

## ⚙️ Environment Variables

Tạo file `.env.local`:

```
GEMINI_API_KEY=your_api_key_here
NEXT_PUBLIC_APP_NAME=StatViet
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

---

## 🎯 Features Hoàn Thành

### Phase 1 MVP ✅
- [x] File Upload (CSV/Excel)
- [x] Data Profiling & Quality Report
- [x] WebR Integration
- [x] Cronbach's Alpha
- [x] Correlation Matrix (Heatmap)
- [x] Descriptive Statistics (Charts)
- [x] PDF Export

### Coming Soon
- [ ] EFA (Exploratory Factor Analysis)
- [ ] T-test & ANOVA
- [ ] Linear Regression
- [ ] AI Explanation (Gemini API)

---

## 🐛 Known Issues

1. **WebR First Load**: Lần đầu chạy phân tích sẽ mất 10-20s để load WebR runtime
2. **Large Files**: Files > 10MB có thể gặp vấn đề memory trong browser
3. **CORS Headers**: Cần deploy lên Vercel để test đầy đủ WebR (localhost có thể gặp CORS issues)

---

## 📝 Next Steps

1. **Test WebR**: Upload CSV và chạy Cronbach's Alpha
2. **Fix Bugs**: Dùng extension check code
3. **Add Gemini API**: Implement AI explanation
4. **Deploy**: Push lên Vercel

---

## 🔗 Useful Commands

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint
```
