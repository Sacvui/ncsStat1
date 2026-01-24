"""
Generate Test Dataset for SEM/CFA Analysis
- 500 rows (cases)
- 40 variables (columns)
- ~100 rows with data quality issues (missing values, outliers) for testing cleanup
- Designed for SEM/CFA with 8 latent factors, each with 5 indicators
"""

import random
import csv

# Seed for reproducibility
random.seed(42)

# Define 8 constructs/factors with 5 indicators each (40 variables total)
factors = {
    'SAT': 5,   # Satisfaction (SAT1-SAT5)
    'TRUST': 5, # Trust (TRUST1-TRUST5)  
    'QUAL': 5,  # Quality (QUAL1-QUAL5)
    'VAL': 5,   # Value (VAL1-VAL5)
    'LOY': 5,   # Loyalty (LOY1-LOY5)
    'COM': 5,   # Commitment (COM1-COM5)
    'IMG': 5,   # Image (IMG1-IMG5)
    'EXP': 5,   # Expectation (EXP1-EXP5)
}

# Generate column headers
headers = []
for factor, count in factors.items():
    for i in range(1, count + 1):
        headers.append(f"{factor}{i}")

# Generate 500 rows
data = []
for row_idx in range(500):
    row = {}
    is_bad_row = row_idx < 100  # First 100 rows have issues
    
    for factor, count in factors.items():
        # Generate factor mean (simulates latent variable)
        factor_mean = random.gauss(3.5, 0.8)  # Likert scale centered around 3.5
        
        for i in range(1, count + 1):
            col_name = f"{factor}{i}"
            
            if is_bad_row:
                # Add various data quality issues
                issue_type = random.choice(['missing', 'outlier', 'extreme', 'normal'])
                if issue_type == 'missing':
                    row[col_name] = ''  # Missing value
                elif issue_type == 'outlier':
                    row[col_name] = round(random.choice([-5, 10, 15, -2]), 2)  # Outliers
                elif issue_type == 'extreme':
                    row[col_name] = round(random.gauss(factor_mean, 2.5), 2)  # High variance
                else:
                    value = factor_mean + random.gauss(0, 0.5)
                    row[col_name] = round(max(1, min(5, value)), 2)  # Normal within 1-5
            else:
                # Good data: Likert 1-5 with moderate correlation within factor
                value = factor_mean + random.gauss(0, 0.4)  # Low within-factor variance
                row[col_name] = round(max(1, min(5, value)), 2)
    
    data.append(row)

# Shuffle to mix bad rows throughout
random.shuffle(data)

# Write CSV
output_path = 'c:/ncsstat_paper/ncsStat_git/ncsStat1/public/test_data_sem_cfa.csv'
with open(output_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(data)

print(f"Generated {len(data)} rows with {len(headers)} columns")
print(f"Saved to: {output_path}")
