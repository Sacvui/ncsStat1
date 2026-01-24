# ncsStat R Code Documentation

Tài liệu này liệt kê tất cả các lệnh R được sử dụng trong ncsStat để phân tích thống kê.
Mỗi phần bao gồm: mô tả phương pháp, R packages cần thiết, và code chi tiết.

---

## 📦 R Packages Sử Dụng

```r
library(psych)        # Cronbach's Alpha, EFA, CFA, Correlation, Descriptive
library(GPArotation)  # Factor rotation methods
library(corrplot)     # Correlation visualization
```

---

## 1. Cronbach's Alpha (Độ tin cậy)

**Function:** `runCronbachAlpha()`

**Mục đích:** Đánh giá độ tin cậy nội tại của thang đo Likert

**R Code:**
```r
library(psych)

# DATA CLEANING: Clamp outliers to valid Likert range (configurable)
valid_min <- 1   # Có thể đổi thành 0, 1, etc.
valid_max <- 5   # Có thể đổi thành 7, 10, etc.
data <- pmax(pmin(raw_data, valid_max), valid_min)

# Run Cronbach's Alpha with auto key checking for reversed items
result <- alpha(data, check.keys = TRUE)

# Extract item-total statistics
item_stats <- result$item.stats
alpha_drop <- result$alpha.drop
n_items <- ncol(data)

# Results
list(
    raw_alpha = result$total$raw_alpha,          # Alpha thô
    std_alpha = result$total$std.alpha,          # Alpha chuẩn hóa
    scale_mean_deleted = alpha_drop$mean,        # Mean nếu xóa item
    scale_var_deleted = alpha_drop$sd^2,         # Variance nếu xóa item
    corrected_item_total = item_stats$r.drop,    # Item-total correlation
    alpha_if_deleted = alpha_drop$raw_alpha,     # Alpha nếu xóa item
    average_r = result$total$average_r           # Inter-item correlation TB
)
```

---

## 2. Correlation Analysis (Tương quan)

**Function:** `runCorrelation()`

**Mục đích:** Tính ma trận tương quan với 3 phương pháp

**R Code:**
```r
library(psych)

df <- as.data.frame(data_mat)
colnames(df) <- paste0("V", 1:ncol(df))

# method = "pearson" | "spearman" | "kendall"
method_name <- "pearson"

# corr.test() cho cả r và p-value
ct <- corr.test(df, use = "pairwise", method = method_name, adjust = "none")

list(
    correlation = as.vector(ct$r),   # Correlation matrix
    p_values = as.vector(ct$p),      # P-values matrix
    n_cols = ncol(df),
    method = method_name
)
```

**Giải thích:**
- **Pearson:** Tương quan tuyến tính (dữ liệu phân phối chuẩn)
- **Spearman:** Tương quan xếp hạng (phi tham số)
- **Kendall:** Concordance xếp hạng (robust hơn Spearman, tốt cho mẫu nhỏ)

---

## 3. Descriptive Statistics (Thống kê mô tả)

**Function:** `runDescriptiveStats()`

**Mục đích:** Tính các thống kê cơ bản (Mean, SD, Skewness, Kurtosis...)

**R Code:**
```r
library(psych)

df <- as.data.frame(data_mat)
colnames(df) <- paste0("V", 1:ncol(df))

# describe() cung cấp đầy đủ thống kê
desc <- describe(df)

list(
    mean = desc$mean,
    sd = desc$sd,
    min = desc$min,
    max = desc$max,
    median = desc$median,
    n = desc$n,
    skew = desc$skew,       # Độ lệch
    kurtosis = desc$kurtosis, # Độ nhọn
    se = desc$se            # Standard Error
)
```

---

## 4. Independent T-Test (So sánh 2 nhóm độc lập)

**Function:** `runTTestIndependent()`

**Mục đích:** So sánh trung bình 2 nhóm độc lập

**R Code:**
```r
# === ASSUMPTION TESTS ===

# 1. Shapiro-Wilk Normality Test cho từng nhóm
shapiro_p1 <- tryCatch({
    if (length(group1) >= 3 && length(group1) <= 5000) {
        shapiro.test(group1)$p.value
    } else { NA }
}, error = function(e) NA)

shapiro_p2 <- tryCatch({
    if (length(group2) >= 3 && length(group2) <= 5000) {
        shapiro.test(group2)$p.value
    } else { NA }
}, error = function(e) NA)

# 2. Levene's Test (Brown-Forsythe - Median)
med1 <- median(group1)
med2 <- median(group2)
z1 <- abs(group1 - med1)
z2 <- abs(group2 - med2)
z_val <- c(z1, z2)
g_fac <- factor(c(rep(1, length(z1)), rep(2, length(z2))))
levene_test <- oneway.test(z_val ~ g_fac, var.equal = TRUE)
levene_p <- levene_test$p.value

# Auto-select Welch's or Student's based on Levene
var_equal <- levene_p > 0.05

# === MAIN T-TEST ===
result <- t.test(group1, group2, var.equal = var_equal)

# Cohen's d Effect Size
pooledSD <- sqrt(((length(group1) - 1) * sd(group1)^2 + 
                  (length(group2) - 1) * sd(group2)^2) / 
                 (length(group1) + length(group2) - 2))
cohensD <- (mean(group1) - mean(group2)) / pooledSD

list(
    t = result$statistic,
    df = result$parameter,
    pValue = result$p.value,
    mean1 = mean(group1),
    mean2 = mean(group2),
    meanDiff = mean(group1) - mean(group2),
    ci95Lower = result$conf.int[1],
    ci95Upper = result$conf.int[2],
    effectSize = cohensD,
    leveneP = levene_p,
    normalityP1 = shapiro_p1,
    normalityP2 = shapiro_p2
)
```

---

## 5. Paired T-Test (So sánh 2 nhóm ghép cặp)

**Function:** `runTTestPaired()`

**Mục đích:** So sánh pre-post trong cùng nhóm

**R Code:**
```r
# Calculate difference scores
diffs <- before - after

# === ASSUMPTION TEST ===
# Normality of DIFFERENCE scores (key assumption)
shapiro_diff_p <- tryCatch({
    if (length(diffs) >= 3 && length(diffs) <= 5000) {
        shapiro.test(diffs)$p.value
    } else { NA }
}, error = function(e) NA)

# === MAIN T-TEST ===
result <- t.test(before, after, paired = TRUE)

# Cohen's d for Paired Samples: d = MeanDiff / SD_diff
mean_diff <- mean(diffs)
sd_diff <- sd(diffs)
cohens_d <- mean_diff / sd_diff

list(
    t = result$statistic,
    df = result$parameter,
    pValue = result$p.value,
    meanBefore = mean(before),
    meanAfter = mean(after),
    meanDiff = mean_diff,
    ci95Lower = result$conf.int[1],
    ci95Upper = result$conf.int[2],
    effectSize = cohens_d,
    normalityDiffP = shapiro_diff_p
)
```

---

## 6. One-Way ANOVA

**Function:** `runOneWayANOVA()`

**Mục đích:** So sánh trung bình 3+ nhóm

**R Code:**
```r
# Create data with group labels
values <- c(group1, group2, group3, ...)
groups <- factor(c(rep(1, n1), rep(2, n2), rep(3, n3), ...))

# === ASSUMPTION TESTS ===

# 1. Levene's Test (Brown-Forsythe)
group_medians <- tapply(values, groups, median)
deviations <- numeric(length(values))
for(i in 1:length(values)) {
    g_idx <- as.numeric(groups)[i]
    deviations[i] <- abs(values[i] - group_medians[g_idx])
}
levene_model <- aov(deviations ~ groups)
levene_p <- summary(levene_model)[[1]][1, 5]

# === MAIN ANOVA ===
model <- aov(values ~ groups)
result <- summary(model)[[1]]

# 2. Normality of Residuals
resids <- residuals(model)
shapiro_resid_p <- tryCatch({
    if (length(resids) >= 3 && length(resids) <= 5000) {
        shapiro.test(resids)$p.value
    } else { NA }
}, error = function(e) NA)

# Eta Squared
ssb <- result[1, 2]  # Sum of squares between
sst <- ssb + result[2, 2]  # Total sum of squares
etaSquared <- ssb / sst

# === POST-HOC: Tukey HSD ===
tukey_result <- TukeyHSD(model)$groups
tukey_comparisons <- rownames(tukey_result)
tukey_diffs <- tukey_result[, "diff"]
tukey_padj <- tukey_result[, "p adj"]

list(
    F = result[1, 4],
    dfBetween = result[1, 1],
    dfWithin = result[2, 1],
    pValue = result[1, 5],
    groupMeans = as.numeric(tapply(values, groups, mean)),
    grandMean = mean(values),
    etaSquared = etaSquared,
    leveneP = levene_p,
    normalityResidP = shapiro_resid_p,
    tukeyComparisons = tukey_comparisons,
    tukeyDiffs = tukey_diffs,
    tukeyPAdj = tukey_padj
)
```

---

## 7. Exploratory Factor Analysis (EFA)

**Function:** `runEFA()`

**Mục đích:** Khám phá cấu trúc nhân tố

**R Code:**
```r
library(psych)

# 1. Clean Data
df_clean <- na.omit(df)
df_clean <- df_clean[apply(df_clean, 1, function(x) all(is.finite(x))), ]

# 2. Correlation Matrix & Eigenvalues
cor_mat <- cor(df_clean)
eigenvalues <- eigen(cor_mat)$values

# 3. Auto-detect number of factors (Kaiser criterion)
n_factors_run <- sum(eigenvalues > 1)
if (n_factors_run < 1) n_factors_run <- 1

# 4. KMO and Bartlett
kmo_result <- KMO(df_clean)
bartlett_result <- cortest.bartlett(cor_mat, n = nrow(df_clean))

# 5. Run EFA
# fm = "pa" (Principal Axis), "ml" (Maximum Likelihood), "minres", etc.
# rotate = "varimax" (orthogonal), "oblimin" (oblique), "promax"
efa_result <- fa(df_clean, nfactors = n_factors_run, rotate = "varimax", fm = "pa")

list(
    kmo = kmo_result$MSA[1],
    bartlett_p = bartlett_result$p.value,
    loadings = efa_result$loadings,
    communalities = efa_result$communalities,
    structure = efa_result$Structure,
    eigenvalues = eigenvalues,
    n_factors_used = n_factors_run
)
```

---

## 8. Confirmatory Factor Analysis (CFA)

**Function:** `runCFA()`

**Mục đích:** Xác nhận cấu trúc nhân tố đã định nghĩa

**Note:** Sử dụng `psych::fa()` thay cho `lavaan` vì lavaan cần `quadprog` không có trên WebR WASM

**R Code:**
```r
library(psych)

# Run FA with ML estimation
fa_result <- fa(df, nfactors = n_factors, rotate = "oblimin", fm = "ml")

# Extract Fit Measures
chi_sq <- fa_result$STATISTIC
df_val <- fa_result$dof
p_val <- fa_result$PVAL
rmsea_val <- fa_result$RMSEA[1]

# Calculate CFI and TLI
null_chisq <- fa_result$null.chisq
null_df <- fa_result$null.dof

tli_val <- ((null_chisq/null_df) - (chi_sq/df_val)) / ((null_chisq/null_df) - 1)
cfi_val <- 1 - max(chi_sq - df_val, 0) / max(null_chisq - null_df, chi_sq - df_val, 0)

list(
    cfi = cfi_val,
    tli = tli_val,
    rmsea = rmsea_val,
    srmr = fa_result$rms,
    chisq = chi_sq,
    df = df_val,
    pvalue = p_val
)
```

---

## 9. Multiple Linear Regression

**Function:** `runLinearRegression()`

**Mục đích:** Hồi quy tuyến tính đa biến

**R Code:**
```r
# Formula: First column ~ all others
y_name <- colnames(df)[1]
f_str <- paste(sprintf("`%s`", y_name), "~ .")
f <- as.formula(f_str)

model <- lm(f, data = df)
s <- summary(model)

# Coefficients
coefs <- coef(s)

# F-statistic p-value
fstat <- s$fstatistic
f_p_value <- pf(fstat[1], fstat[2], fstat[3], lower.tail = FALSE)

# === VIF (Manual calculation) ===
x_data <- df[, -1, drop = FALSE]
n_vars <- ncol(x_data)
vifs <- numeric(n_vars)

for (i in 1:n_vars) {
    r_model <- lm(x_data[, i] ~ ., data = x_data[, -i, drop = FALSE])
    r2 <- summary(r_model)$r.squared
    vifs[i] <- 1 / (1 - r2)
}

# Normality of Residuals
normality_p <- shapiro.test(residuals(model))$p.value

list(
    coef_names = rownames(coefs),
    estimates = coefs[, 1],
    std_errors = coefs[, 2],
    t_values = coefs[, 3],
    p_values = coefs[, 4],
    
    r_squared = s$r.squared,
    adj_r_squared = s$adj.r.squared,
    f_stat = fstat[1],
    f_p_value = f_p_value,
    sigma = s$sigma,
    
    fitted_values = fitted(model),
    residuals = residuals(model),
    vifs = vifs,
    normality_p = normality_p
)
```

---

## 10. Mann-Whitney U Test (Phi tham số)

**Function:** `runMannWhitneyU()`

**Mục đích:** So sánh 2 nhóm độc lập khi vi phạm giả định phân phối chuẩn

**R Code:**
```r
# Wilcoxon Rank Sum Test (= Mann-Whitney U)
test <- wilcox.test(g1, g2, conf.int = TRUE)

n1 <- length(g1)
n2 <- length(g2)
N <- n1 + n2

# Effect Size: r = Z / sqrt(N)
z_score <- qnorm(test$p.value / 2)
effect_r <- abs(z_score) / sqrt(N)

list(
    statistic = test$statistic,
    p_value = test$p.value,
    median1 = median(g1),
    median2 = median(g2),
    effect_size = effect_r
)
```

---

## 11. Chi-Square Test (Kiểm định độc lập)

**Function:** `runChiSquare()`

**Mục đích:** Kiểm tra mối quan hệ giữa 2 biến định danh

**R Code:**
```r
# Create contingency table
tbl <- table(df_raw[,1], df_raw[,2])

# Chi-Square Test
test <- chisq.test(tbl)

# Cramer's V Effect Size
chisq_val <- test$statistic
n <- sum(tbl)
k <- min(nrow(tbl), ncol(tbl))
cramers_v <- sqrt(chisq_val / (n * (min(dim(tbl)) - 1)))

list(
    statistic = test$statistic,
    parameter = test$parameter,  # df
    p_value = test$p.value,
    observed = as.matrix(test$observed),
    expected = as.matrix(test$expected),
    cramers_v = cramers_v
)
```

---

## 📚 Tài liệu tham khảo

1. **psych package:** https://cran.r-project.org/package=psych
2. **R Statistics Documentation:** https://www.rdocumentation.org/
3. **SPSS to R Mappings:** Cronbach's Alpha, T-tests, ANOVA, EFA, Regression

---

## 12. Logistic Regression (Hồi quy nhị phân)

**Function:** `runLogisticRegression()`

**Mục đích:** Dự đoán biến phụ thuộc nhị phân (0/1)

**R Code:**
```r
# DV phải là 0/1
y_name <- colnames(df)[1]
df[[y_name]] <- as.factor(df[[y_name]])

# Formula
f <- as.formula(paste(y_name, "~ ."))

# Fit Logistic Regression
model <- glm(f, data = df, family = binomial(link = "logit"))
s <- summary(model)

# Coefficients & Odds Ratios
coefs <- s$coefficients
odds_ratios <- exp(coefs[, 1])

# McFadden's Pseudo R²
null_dev <- model$null.deviance
resid_dev <- model$deviance
pseudo_r2 <- 1 - (resid_dev / null_dev)

# Confusion Matrix
probs <- predict(model, type = "response")
preds <- ifelse(probs > 0.5, 1, 0)
actual <- as.numeric(as.character(df[[y_name]]))

tp <- sum(preds == 1 & actual == 1)
tn <- sum(preds == 0 & actual == 0)
fp <- sum(preds == 1 & actual == 0)
fn <- sum(preds == 0 & actual == 1)
accuracy <- (tp + tn) / length(actual)
```

---

## 13. Kruskal-Wallis Test (Phi tham số ANOVA)

**Function:** `runKruskalWallis()`

**Mục đích:** So sánh 3+ nhóm khi vi phạm giả định phân phối chuẩn

**R Code:**
```r
# Kruskal-Wallis Test
test <- kruskal.test(values ~ groups)

# Group Medians
groupMedians <- tapply(values, groups, median)

# Effect Size: Epsilon squared
n <- length(values)
epsilon_sq <- test$statistic / (n - 1)

list(
    statistic = test$statistic,  # Chi-squared
    df = test$parameter,
    p_value = test$p.value,
    group_medians = as.numeric(groupMedians),
    effect_size = epsilon_sq
)
```

---

## 14. Wilcoxon Signed-Rank Test (Phi tham số ghép cặp)

**Function:** `runWilcoxonSignedRank()`

**Mục đích:** So sánh cặp khi vi phạm phân phối chuẩn

**R Code:**
```r
# Wilcoxon Signed-Rank Test (paired)
test <- wilcox.test(before, after, paired = TRUE, conf.int = TRUE)

# Effect Size: r = Z / sqrt(N)
n <- length(before)
z_score <- qnorm(test$p.value / 2)
effect_r <- abs(z_score) / sqrt(n)

# Difference
diffs <- before - after

list(
    statistic = test$statistic,  # V
    p_value = test$p.value,
    median_before = median(before),
    median_after = median(after),
    median_diff = median(diffs),
    effect_size = effect_r
)
```

---

## 15. Mediation Analysis (Phân tích trung gian)

**Function:** `runMediationAnalysis()`

**Mục đích:** Kiểm tra liệu M có trung gian hóa mối quan hệ X → Y

**Model:** X → M → Y (với direct effect X → Y)

**R Code:**
```r
# === BARON & KENNY STEPS ===

# Step 1: Path c (Total Effect) - X predicts Y
model_c <- lm(y ~ x)
path_c <- coef(summary(model_c))[2, 1]

# Step 2: Path a - X predicts M
model_a <- lm(m ~ x)
path_a <- coef(summary(model_a))[2, 1]

# Step 3: Paths b and c' - M predicts Y controlling for X
model_bc <- lm(y ~ x + m)
path_b <- coef(summary(model_bc))[3, 1]      # M coefficient
path_cprime <- coef(summary(model_bc))[2, 1] # Direct effect

# === INDIRECT EFFECT ===
indirect_effect <- path_a * path_b
total_effect <- path_c
direct_effect <- path_cprime

# Proportion mediated
prop_mediated <- indirect_effect / total_effect

# === SOBEL TEST ===
sobel_se <- sqrt(path_b^2 * se_a^2 + path_a^2 * se_b^2)
sobel_z <- indirect_effect / sobel_se
sobel_p <- 2 * (1 - pnorm(abs(sobel_z)))

# === BOOTSTRAP CI (1000 iterations) ===
n_boot <- 1000
boot_indirect <- numeric(n_boot)

for (i in 1:n_boot) {
    idx <- sample(1:n, n, replace = TRUE)
    a_b <- coef(lm(m[idx] ~ x[idx]))[2]
    b_b <- coef(lm(y[idx] ~ x[idx] + m[idx]))[3]
    boot_indirect[i] <- a_b * b_b
}

boot_ci_lower <- quantile(boot_indirect, 0.025)
boot_ci_upper <- quantile(boot_indirect, 0.975)

# Mediation Type
# Full: c' not significant, indirect significant
# Partial: both c' and indirect significant
# None: indirect not significant
```

---

## 16. McDonald's Omega (Độ tin cậy)

**Thêm vào `runCronbachAlpha()`**

**Mục đích:** Omega robust hơn Alpha cho multidimensional scales

**R Code:**
```r
library(psych)

# omega() requires at least 3 items
omega_result <- omega(data, nfactors = 1, plot = FALSE)

list(
    omega_total = omega_result$omega.tot,   # Total Omega
    omega_h = omega_result$omega_h          # Hierarchical Omega
)
```

---

## 17. Welch ANOVA (Auto-switch)

**Cập nhật `runOneWayANOVA()`**

**Mục đích:** Khi Levene p < 0.05, tự động dùng Welch ANOVA thay Classic

**R Code:**
```r
if (levene_p < 0.05) {
    # Variance NOT homogeneous -> Use Welch ANOVA
    welch_result <- oneway.test(values ~ groups, var.equal = FALSE)
    f_stat <- welch_result$statistic
    df_between <- welch_result$parameter[1]
    df_within <- welch_result$parameter[2]
    p_val <- welch_result$p.value
    method_used <- "Welch ANOVA"
} else {
    # Classic ANOVA
    model <- aov(values ~ groups)
    method_used <- "Classic ANOVA"
}
```

---

## 18. Parallel Analysis cho EFA

**Cập nhật `runEFA()`**

**Mục đích:** Parallel Analysis tốt hơn Kaiser criterion (eigenvalue > 1)

**R Code:**
```r
library(psych)

# Parallel Analysis - Gold Standard
pa <- fa.parallel(df_clean, fm = "pa", fa = "fa", plot = FALSE, 
                  n.iter = 20, quant = 0.95)
n_factors_suggested <- pa$nfact

# Kaiser criterion as fallback
n_factors_kaiser <- sum(eigenvalues > 1)

# Prefer Parallel Analysis
if (!is.na(n_factors_suggested)) {
    n_factors_run <- n_factors_suggested
    factor_method <- "parallel"
} else {
    n_factors_run <- n_factors_kaiser
    factor_method <- "kaiser"
}
```

---

*Tài liệu này được tạo tự động từ mã nguồn `lib/webr-wrapper.ts`*
*Cập nhật lần cuối: 2026-01-24*
