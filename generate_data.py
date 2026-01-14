
import csv
import random
import numpy as np

# Configuration
NUM_RESPONDENTS = 150
SCALE_MIN = 1
SCALE_MAX = 5

# Constructs and their items (Standard Vietnamese Research Codes)
# Context: Student Satisfaction in University (Common context)
constructs = {
    "CSVC": ["CSVC1", "CSVC2", "CSVC3", "CSVC4"], # Cơ sở vật chất
    "GV":   ["GV1",   "GV2",   "GV3",   "GV4"],   # Đội ngũ Giảng viên
    "CT":   ["CT1",   "CT2",   "CT3",   "CT4"],   # Chương trình đào tạo
    "NV":   ["NV1",   "NV2",   "NV3",   "NV4"],   # Nhân viên phục vụ
    "HP":   ["HP1",   "HP2",   "HP3",   "HP4"],   # Học phí
    "HL":   ["HL1",   "HL2",   "HL3",   "HL4"],   # Sự hài lòng (Dependent)
    "TT":   ["TT1",   "TT2",   "TT3",   "TT4"]    # Trung thành (Outcome)
}

header = []
for code, items in constructs.items():
    header.extend(items)

data = []

# Generate data with some underlying structure
# Latent variables means:
# Independent:
mu_CSVC = 3.5
mu_GV = 4.0
mu_CT = 3.8
mu_NV = 3.2
mu_HP = 3.0

# Correlations: HL depends on CSVC, GV, CT, NV, HP
# TT depends on HL

for i in range(NUM_RESPONDENTS):
    row = []
    
    # Base latent factors for this respondent (with individual variation)
    # Factor = Mean + Random Variation
    f_CSVC = np.random.normal(mu_CSVC, 0.8)
    f_GV   = np.random.normal(mu_GV,   0.7)
    f_CT   = np.random.normal(mu_CT,   0.75)
    f_NV   = np.random.normal(mu_NV,   0.9)
    f_HP   = np.random.normal(mu_HP,   0.85)
    
    # Calculate Latent Satisfaction (HL) based on factors + noise
    # HL is strongly influenced by GV and CT, moderately by CSVC and NV, weakly by HP (assumption)
    f_HL = (0.3*f_GV + 0.3*f_CT + 0.2*f_CSVC + 0.1*f_NV + 0.1*f_HP) + np.random.normal(0, 0.5)
    
    # Calculate Latent Loyalty (TT) based on HL + noise
    f_TT = (0.8 * f_HL) + np.random.normal(0, 0.4)
    
    factors = {
        "CSVC": f_CSVC,
        "GV": f_GV,
        "CT": f_CT,
        "NV": f_NV,
        "HP": f_HP,
        "HL": f_HL,
        "TT": f_TT
    }
    
    # Generate item scores
    for code, items in constructs.items():
        base_val = factors[code]
        for item in items:
            # Item score = Latent Factor + Item Specific Noise
            val = base_val + np.random.normal(0, 0.6)
            
            # Clamp to 1-5 and round
            val = round(val)
            val = max(SCALE_MIN, min(SCALE_MAX, val))
            row.append(int(val))
            
    data.append(row)

# Write to CSV
with open('d:/NC101_hy/statviet/sample_data_large.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(header)
    writer.writerows(data)

print("Generated sample_data_large.csv with 150 rows and 28 columns.")
