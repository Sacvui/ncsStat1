// Data Profiling Types and Functions
export interface DataProfile {
  rows: number;
  columns: number;
  issues: Issue[];
  columnStats: Record<string, ColumnStats>;
}

export interface Issue {
  severity: 'critical' | 'warning' | 'info';
  type: 'missing' | 'outliers' | 'duplicates' | 'invalid';
  column?: string;
  count: number;
  details: any;
  suggestedFix: string;
}

export interface ColumnStats {
  name: string;
  type: 'numeric' | 'text' | 'date';
  count: number;
  missing: number;
  missingRate: number;
  mean?: number;
  sd?: number;
  min?: number;
  max?: number;
  outliers: number[];
  invalidValues: Array<{ row: number; value: any }>;
  distribution?: number[]; // For histogram
}

/**
 * Detect column type based on values
 */
function detectColumnType(values: any[]): 'numeric' | 'text' | 'date' {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonNullValues.length === 0) return 'text';
  
  // Check if numeric
  const numericCount = nonNullValues.filter(v => !isNaN(Number(v))).length;
  if (numericCount / nonNullValues.length > 0.8) return 'numeric';
  
  // Check if date
  const dateCount = nonNullValues.filter(v => !isNaN(Date.parse(String(v)))).length;
  if (dateCount / nonNullValues.length > 0.8) return 'date';
  
  return 'text';
}

/**
 * Calculate basic statistics for numeric column
 */
function calculateStats(values: number[]): { mean: number; sd: number; min: number; max: number } {
  const validValues = values.filter(v => !isNaN(v) && v !== null);
  
  if (validValues.length === 0) {
    return { mean: 0, sd: 0, min: 0, max: 0 };
  }
  
  const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
  const variance = validValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validValues.length;
  const sd = Math.sqrt(variance);
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  
  return { mean, sd, min, max };
}

/**
 * Detect outliers using IQR method
 */
function detectOutliers(values: number[]): number[] {
  const validValues = values.filter(v => !isNaN(v) && v !== null).sort((a, b) => a - b);
  
  if (validValues.length < 4) return [];
  
  const q1Index = Math.floor(validValues.length * 0.25);
  const q3Index = Math.floor(validValues.length * 0.75);
  const q1 = validValues[q1Index];
  const q3 = validValues[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return values
    .map((v, i) => ({ value: v, index: i }))
    .filter(({ value }) => value < lowerBound || value > upperBound)
    .map(({ index }) => index);
}

/**
 * Profile a single column
 */
function profileColumn(columnName: string, values: any[]): ColumnStats {
  const type = detectColumnType(values);
  const missing = values.filter(v => v === null || v === undefined || v === '').length;
  const missingRate = missing / values.length;
  
  const stats: ColumnStats = {
    name: columnName,
    type,
    count: values.length,
    missing,
    missingRate,
    outliers: [],
    invalidValues: []
  };
  
  if (type === 'numeric') {
    const numericValues = values.map(v => Number(v));
    const { mean, sd, min, max } = calculateStats(numericValues);
    stats.mean = mean;
    stats.sd = sd;
    stats.min = min;
    stats.max = max;
    stats.outliers = detectOutliers(numericValues);
  }
  
  return stats;
}

/**
 * Main profiling function
 */
export function profileData(data: any[]): DataProfile {
  if (!data || data.length === 0) {
    return {
      rows: 0,
      columns: 0,
      issues: [],
      columnStats: {}
    };
  }
  
  const columns = Object.keys(data[0]);
  const columnStats: Record<string, ColumnStats> = {};
  const issues: Issue[] = [];
  
  // Profile each column
  columns.forEach(col => {
    const values = data.map(row => row[col]);
    const stats = profileColumn(col, values);
    columnStats[col] = stats;
    
    // Generate issues
    if (stats.missingRate > 0.5) {
      issues.push({
        severity: 'critical',
        type: 'missing',
        column: col,
        count: stats.missing,
        details: { missingRate: stats.missingRate },
        suggestedFix: `Cột "${col}" có ${(stats.missingRate * 100).toFixed(1)}% giá trị bị thiếu. Xem xét loại bỏ cột hoặc điền giá trị.`
      });
    } else if (stats.missingRate > 0.1) {
      issues.push({
        severity: 'warning',
        type: 'missing',
        column: col,
        count: stats.missing,
        details: { missingRate: stats.missingRate },
        suggestedFix: `Cột "${col}" có ${(stats.missingRate * 100).toFixed(1)}% giá trị bị thiếu. Có thể điền bằng mean/median.`
      });
    }
    
    if (stats.outliers.length > 0) {
      issues.push({
        severity: 'warning',
        type: 'outliers',
        column: col,
        count: stats.outliers.length,
        details: { outlierIndices: stats.outliers },
        suggestedFix: `Phát hiện ${stats.outliers.length} outliers trong cột "${col}". Kiểm tra và xem xét loại bỏ.`
      });
    }
  });
  
  // Check for duplicate rows
  const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
  if (uniqueRows.size < data.length) {
    issues.push({
      severity: 'warning',
      type: 'duplicates',
      count: data.length - uniqueRows.size,
      details: {},
      suggestedFix: `Phát hiện ${data.length - uniqueRows.size} dòng trùng lặp. Xem xét loại bỏ.`
    });
  }
  
  return {
    rows: data.length,
    columns: columns.length,
    issues: issues.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
    columnStats
  };
}
