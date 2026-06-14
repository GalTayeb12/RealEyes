# מדריך הכנה מקיף להצגת פרויקט RealEyes
**גרסה:** יוני 2026 | **מטרה:** שליטה מלאה בכל המודלים, הניסויים, הפרמטרים והמסקנות — ללא פערי הבנה

---

## תוכן עניינים

1. [סקירה כללית — מה בנינו ולמה](#1-סקירה-כללית)
2. [יעדים מול תוצאות — למה לא הגענו למקום שרצינו](#2-יעדים-מול-תוצאות)
3. [מאגר הנתונים והמתודולוגיה](#3-מאגר-הנתונים)
4. [מחברת `the_modles_fixed_new.ipynb` — מערכת הייצור](#4-מחברת-the_modles_fixed_new)
5. [מודל 1: Autoencoder + SRM (תשתית CNN-SRM)](#5-autoencoder--srm)
6. [מודל 2: CNN-SRM](#6-cnn-srm)
7. [מודל 3: EfficientNetB0](#7-efficientnetb0)
8. [מודל 4: Two-Stream (דו-זרמי)](#8-two-stream)
9. [מודל 5: Ensemble (אנסמבל)](#9-ensemble)
10. [Grad-CAM — הסבר החלטות](#10-grad-cam)
11. [ניסויים חוצי-מאגר (Cross-Database) — מתודולוגיה](#11-cross-database)
12. [LoRA — מה זה ולמה הוספנו](#12-lora)
13. [ניסוי CNN-SRM — עם LoRA מול בלי LoRA](#13-cnn-srm-ניסויים)
14. [ניסוי EfficientNetB0 — עם LoRA מול בלי LoRA](#14-efficientnet-ניסויים)
15. [ניסוי ViT-Light — עם LoRA מול בלי LoRA](#15-vit-ניסויים)
16. [Xception — למה ננטש](#16-xception)
17. [חיבור לאתר (Frontend + Backend)](#17-חיבור-לאתר)
18. [מסקנות מרכזיות להצגה](#18-מסקנות)
19. [שאלות צפויות מהמנחות ותשובות](#19-qa)

---

## 1. סקירה כללית

הפרויקט **RealEyes** בונה מערכת לזיהוי תמונות Deepfake (מזויפות מול אמיתיות). הגישה היא **היברידית**:

| שכבה | תפקיד |
|------|--------|
| **ניתוח תדרים/רעש (SRM)** | זיהוי "טביעות אצבע" של מודלים גנרטיביים בתחום הרעש |
| **ניתוח ויזואלי (EfficientNet)** | למידת מאפיינים סמנטיים (פנים, טקסטורה, פרופורציות) |
| **שילוב (Two-Stream + Ensemble)** | מיזוג שני העולמות לחיזוי אמין יותר |
| **מחקר (Cross-DB + LoRA)** | בדיקת הכללה בין מאגרים שונים וייעול אימון |

**שתי מחברות עיקריות:**
- **`the_modles_fixed_new.ipynb`** — אימון מלא של כל המודלים על **סט מאוחד** (כל המאגרים יחד) → זו **מערכת הייצור** שמחוברת לאתר.
- **`exp_cnn_srm.ipynb` / `exp_efficientnet.ipynb` / `exp_vit.ipynb`** — ניסויים **חוצי-מאגר** עם **LoRA**.
- **`exp_*_no_lora.ipynb`** — אותם ניסויים **בלי LoRA** (Full Fine-Tuning) לבסיס השוואה.

---

## 2. יעדים מול תוצאות

### יעדים שהגדרנו בפרויקט

| יעד | ערך מבוקש |
|-----|-----------|
| Accuracy (Ensemble, Test Set מאוחד) | **> 85%** |
| ROC-AUC (Ensemble) | **> 0.90** |
| יציבות Cross-DB | פער Within→Cross **< 10%** ב-AUC |
| זמן עיבוד | < 3 שניות (באתר) |

### מה השגנו בפועל (סט מבחן מאוחד — 18,841 תמונות)

| מודל | Accuracy | ROC-AUC | הערה |
|------|----------|---------|------|
| CNN-SRM | 45.4% | 0.697 | Recall FAKE נמוך מאוד (3.2%) |
| EfficientNetB0 | 62.6% | 0.715 | מאוזן יחסית |
| Two-Stream | **66.1%** | 0.722 | הטוב ביותר בודד |
| Ensemble (uniform) | 62.6% | **0.752** | AUC הטוב ביותר |
| Ensemble (optimal) | 61.6% | 0.745 | Precision FAKE גבוה (79.4%) |

### למה לא הגענו ל-85% Accuracy?

1. **סף החלטה 0.5 לא אופטימלי** — במיוחד ב-CNN-SRM: המודל כמעט תמיד חוזה REAL → Accuracy נמוך אבל AUC סביר (0.697). AUC מודד **יכולת הפרדה**, Accuracy מודד **החלטה בינארית בסף קבוע**.

2. **חוסר איזון מחלקות + Class Weights** — יותר תמונות FAKE (10,504) מ-REAL (8,337). המודלים מכוילים לPrecision גבוה (פחות False Positives) על חשבון Recall.

3. **מגוון מאגרים** — סט המבחן כולל OpenForensics, CustomWar, CiFake, CelebDF. כל מאגר נוצר בטכנולוגיה שונה → קשה למודל אחד להצטיין על הכל.

4. **Cross-DB vs Within-DB** — בניסויים המחקריים, Within-DB AUC הגיע ל-0.83–0.97, אבל Cross-DB ירד ל-0.49–0.56. **הכללה** היא האתגר האמיתי, לא Overfitting על מאגר בודד.

5. **LoRA vs Full FT** — בחלק מהמודלים (CNN-SRM על OpenForensics) LoRA פגע בביצועים תוך-מאגריים.

6. **יעד 85% הוגדר ל-Ensemble סופי** — הגענו ל-62–66% Accuracy אך **0.75 AUC**, שזה "טוב" אך לא "מצוין" לפי הסף שהצבנו.

**מה לומר בהצגה:** "הגדרנו יעד שאפתני של 85% Accuracy. בפועל, מדד ה-AUC (0.75) מראה שהמערכת **יודעת להפריד** בין REAL ל-FAKE, אך סף ההחלטה והאתגר של הכללה בין מאגרים מונעים Accuracy גבוה. זה ממצא מחקרי משמעותי — לא כישלון."

---

## 3. מאגר הנתונים

### ארבעה מאגרים

| מאגר | תיאור | Train | Val | Test |
|------|--------|-------|-----|------|
| **OpenForensics** | פנים, זיופים מורכבים | 140,002 | 39,428 | 10,905 |
| **CiFake** | Diffusion + GAN | 100,000 | 20,000 (test folder) | — |
| **CustomWar** | תמונות מלחמתיות (צוות) | 7,100 | 1,061 | 1,061 |
| **CelebDF v2** | פריימי וידאו ידוענים | 71,297 | 7,796 | 6,875 |

**סה"כ Test Set מאוחד (fixed notebook):** 18,841 תמונות (8,337 REAL / 10,504 FAKE)

### למה ארבעה מאגרים?
- **גיוון** — כל מאגר = טכנולוגיית יצירה שונה (GAN, Diffusion, Face-swap video)
- **מניעת Overfitting** — אימון על מאגר אחד בלבד = ביצועים גבוהים "מזויפים"
- **Cross-DB Evaluation** — בודקים: "אם אימנתי על CiFake, האם אני מזהה זיופים מ-CelebDF?"

---

## 4. מחברת `the_modles_fixed_new.ipynb`

### מבנה המחברת (זרימת עבודה)

```
Setup → Sync Drive → Load Data → SRM Pipeline → Autoencoder
  → CNN-SRM → EfficientNetB0 → Two-Stream → Ensemble → Grad-CAM
```

### פרמטרים גלובליים חשובים

| פרמטר | ערך | הסבר |
|--------|-----|------|
| `IMG_SIZE_RGB` | 224×224 | סטנדרט EfficientNet |
| `IMG_SIZE_SRM` | 256×256 | רזולוציה לערוץ הרעש |
| `BATCH_SIZE_RGB` | 8 | קטן — חוסך זיכרון GPU |
| `BATCH_SIZE_SRM` | 32 | SRM features קטנים יותר |
| `BATCH_SIZE_HYBRID` | 4 | Two-Stream = 2 מודלים → זיכרון כפול |
| `SKIP_IF_SAVED` | True | טוען מודלים שמורים, לא מאמן מחדש |
| Memory growth | True | מונע OOM ב-GPU |
| XLA/JIT | **כבוי** | מונע שגיאות BatchNorm |

### Class Weights
```python
{0 (REAL): 1.202, 1 (FAKE): 0.856}
```
משקל גבוה יותר ל-REAL — כי יש פחות דוגמאות REAL, המודל נוטה להתעלם מהן.

---

## 5. Autoencoder + SRM

### מה זה SRM?
**Spatial Rich Model** — 8 פילטרים קבועים (5×5) שמחלצים **מפת רעש/טקסטורה** (24 ערוצים) מתמונת RGB. הרעיון: מודלי GAN/Diffusion משאירים "חתימות" בדומיין הרעש שלא נראות לעין.

### Autoencoder משופר
- **SE blocks** (Squeeze-and-Excitation) — לומד אילו ערוצי רעש חשובים
- **Residual connections** — זרימת גradient טובה יותר
- **L2 regularization** (1e-4) — מפחית Overfitting
- **פלט:** Encoder → (16, 16, 256) features

### פרמטרי אימון Autoencoder
- Loss: MSE (reconstruction)
- Optimizer: Adam
- EarlyStopping על val_loss, patience=5

---

## 6. CNN-SRM

### ארכיטקטורה
```
SRM Image (256×256×24) → Encoder (frozen Phase 1) → ConvBlock×2 → GAP → Dense(1, sigmoid)
```

### שלבי אימון (2 Phases)

| Phase | מה מתאמן | LR | Patience |
|-------|----------|-----|----------|
| **Phase 1** | רק Head (Encoder קפוא) | 1e-4 | 4 (val_auc) |
| **Phase 2** | Head + 30% עליון Encoder | 1e-5 | 5 (val_auc) |

### Loss & Regularization
- `BinaryCrossentropy(label_smoothing=0.1)` — מונע overconfidence
- L2 = 1e-4 על Conv layers
- Dropout: 0.3, 0.25

### תוצאות Test Set (18,841)

| מדד | REAL | FAKE |
|-----|------|------|
| Precision | 0.447 | 0.743 |
| Recall | **0.986** | **0.032** |
| F1 | 0.615 | 0.062 |
| **Accuracy** | | **45.4%** |
| **ROC-AUC** | | **0.697** |

### איך להסביר את התוצאה?
- המודל **כמעט תמיד אומר REAL** (Recall REAL = 98.6%)
- כשהוא **כן** אומר FAKE — הוא צודק ב-74% (Precision FAKE)
- **AUC 0.697** = יש יכולת הפרדה, אבל **סף 0.5 לא מתאים**
- ב-Ensemble, CNN-SRM תורם 44.5% מהמשקל — בעיקר לPrecision

---

## 7. EfficientNetB0

### ארכיטקטורה
```
RGB (224×224×3) → EfficientNetB0 (ImageNet weights) → GAP → Dropout(0.3)
  → Dense(256, relu) → Dropout(0.25) → Dense(64, relu) → Dropout(0.15) → Dense(1, sigmoid)
```

### שלבי אימון

| Stage | Backbone | LR | מה קורה |
|-------|----------|-----|---------|
| **Stage 1** | **קפוא** (ImageNet) | 5e-4 | Head בלבד לומד |
| **Stage 2** | **30% עליון** unfrozen | 1e-5 | Fine-tune |

### Augmentation (RGB)
- flip L/R, flip U/D
- brightness ±0.15
- contrast 0.85–1.15
- saturation 0.85–1.15
- **pad-then-crop** (112% → crop 224) — augmentation מרחבי אמיתי

### תוצאות Test Set

| מדד | REAL (0) | FAKE (1) |
|-----|----------|----------|
| Precision | 0.552 | 0.767 |
| Recall | 0.819 | 0.473 |
| F1 | 0.660 | 0.585 |
| **Accuracy** | | **62.6%** |
| **ROC-AUC** | | **0.715** |

Confusion Matrix: TP(Fake)=4,968 | FN=5,536 | FP=1,510 | TN=6,827

### מסקנה
EfficientNetB0 הוא **המאוזן ביותר** — Recall FAKE סביר (47%) + Precision גבוה (77%). **זה המודל שמחובר לאתר.**

---

## 8. Two-Stream

### רעיון
שילוב **שני Backbones** על **אותה תמונה**:
- **זרם SRM:** Encoder (frozen) → features רעש
- **זרם RGB:** EfficientNetB0 (frozen) → features ויזואליים
- **Concatenate** → Dense head → sigmoid

### Batch Size = 4 (הקטנה!)
Two-Stream טוען **שני מודלים** בזיכרון → Batch=4 במקום 8/32.

### שלבי אימון
| Phase | Backbones | מה מתאמן |
|-------|-----------|----------|
| Phase 1 | קפואים | Head בלבד |
| Phase 2 | 30% עליון unfrozen | Head + חלק מהBackbones |

### תוצאות Test Set

| מדד | REAL | FAKE |
|-----|------|------|
| Precision | 0.585 | 0.782 |
| Recall | 0.809 | 0.544 |
| F1 | 0.679 | 0.642 |
| **Accuracy** | | **66.1%** |
| **ROC-AUC** | | **0.722** |

### מסקנה
Two-Stream הוא **המודל הבודד הטוב ביותר** (Accuracy + AUC). אבל ב-Ensemble קיבל משקל נמוך (7.2%) — כי EfficientNet לבד כבר מכסה את רוב התרומה.

---

## 9. Ensemble

### שיטה
1. **Uniform:** שליש-שליש-שליש
2. **Optimal:** Nelder-Mead minimization על **Validation AUC**

```python
# חיפוש משקלים: minimize(-AUC) על val set
opt_w = [SRM: 0.445, EfficientNet: 0.483, TwoStream: 0.072]
val_AUC with optimal weights = 0.8725
```

### תוצאות Ensemble

| וариант | Accuracy | ROC-AUC | Precision FAKE | Recall FAKE |
|---------|----------|---------|----------------|-------------|
| Uniform (1/3) | 62.6% | **0.752** | 0.791 | 0.448 |
| Optimal | 61.6% | 0.745 | **0.794** | 0.420 |

### למה Uniform עדיף ב-AUC?
Optimal מכויל ל-Validation — על Test, Uniform מעט יותר טוב. **למערכת הייצור:** AUC 0.75 = "טוב", לא "מצוין".

---

## 10. Grad-CAM

### מה זה?
**Gradient-weighted Class Activation Mapping** — מראה **אילו אזורים בתמונה** הובילו להחלטה.

### במחברת
- `gradcam_efficientnet(image_path)` — Heatmap על EfficientNet
- `gradcam_cnn_srm(image_path)` — Heatmap על CNN-SRM
- **מחובר לאתר:** `backend/server/heatmap_utils.py`

### שימוש בהצגה
"המערכת לא רק אומרת FAKE/REAL — היא **מראה** איפה החשד, לשקיפות ואמון המשתמש."

---

## 11. Cross-Database — מתודולוגיה

### עיצוב הניסוי
- **3 מודלים:** CNN-SRM, EfficientNetB0, ViT-Light
- **4 מאגרים:** OpenForensics, CiFake, CustomWar, CelebDF
- **+ Combined:** אימון על כל המאגרים יחד
- **לכל מאגר אימון:** בדיקה על **כל 4** מאגרי המבחן
- **מטריצה 5×4** (או 4×4) — שורה=אימון, עמודה=בדיקה

### Within-DB vs Cross-DB
- **Within-DB (אלכסון):** אימון ומבחן **אותו מאגר** → בדרך כלל גבוה (0.7–1.0)
- **Cross-DB (off-diagonal):** אימון מאגר A, מבחן מאגר B → בדרך כלל נמוך (0.4–0.6)

### פער הכללה (LoRA experiments)

| מודל | Within AUC | Cross AUC | פער |
|------|-----------|-----------|-----|
| CNN-SRM | 0.731 | 0.493 | 23.7% |
| EfficientNetB0 | 0.829 | 0.522 | 30.7% |
| ViT-Light | 0.731 | 0.525 | 20.7% |

**ViT-Light** — הפער הקטן ביותר → הכללה הטובה ביותר (אך עדיין רחוק מ-10%).

---

## 12. LoRA — מה זה?

### הגדרה
**Low-Rank Adaptation** — במקום לאמן **כל** משקלי הרשת (Full Fine-Tuning), מוסיפים **מתאמים** (adapters) בדרגה נמוכה:

```
output = W·x + b + (alpha/rank) · x · A · B
```
- `A`, `B` — מטריצות קטנות (rank=16)
- Phase 1: W + A + B מתאמנים
- Phase 2: רק A + B (`stop_gradient` על W)

### פרמטרים
| פרמטר | ערך |
|--------|-----|
| LORA_RANK | 16 |
| LORA_ALPHA | 32 |
| scale | alpha/rank = 2.0 |

### למה LoRA?
- **פחות פרמטרים** → פחות זיכרון, אימון מהיר
- **מתאים למכשירי קצה** (Edge)
- **ViT** — LoRA עובד מצוין (טרנספורמרים)

### השוואה Within-DB (Pre-LoRA vs LoRA)

| מודל | Pre-LoRA AUC | LoRA AUC | Δ |
|------|-------------|----------|---|
| CNN-SRM (avg) | 0.852 | 0.731 | **-0.121** |
| EfficientNet (avg) | 0.895 | 0.829 | -0.066 |
| ViT (avg) | 0.695 | 0.743 | **+0.047** |

**מסקנה LoRA:** יעיל לViT, פוגע מעט ב-CNN — trade-off יעילות/דיוק.

---

## 13. CNN-SRM — ניסויים

### מחברות
- **עם LoRA:** `exp_cnn_srm.ipynb`
- **בלי LoRA:** `exp_cnn_srm_no_lora.ipynb`

### פרמטרים (שתי המחברות)
- IMG: 256×256 SRM, Batch=32
- Phase 1 LR=5e-4, Phase 2 LR=1e-5
- LoRA: rank=16 על Dense head

### מטריצת AUC (LoRA) — תוצאות Cross-DB

| אומן ↓ \ נבדק → | OF | CiFake | CW | CelebDF |
|-----------------|-----|--------|-----|---------|
| OpenForensics | 0.522 | 0.369 | 0.558 | 0.371 |
| CiFake | 0.538 | **0.770** | 0.595 | 0.464 |
| CustomWar | 0.534 | 0.498 | **0.973** | 0.508 |
| CelebDF | 0.514 | 0.646 | 0.325 | 0.657 |
| Combined | 0.474 | 0.622 | 0.365 | 0.609 |

### תופעות חשובות
1. **CustomWar → CustomWar = 0.973** — מושלם Within-DB
2. **OpenForensics → * = קריסה** — F1-FAKE≈0, AUC≈0.37–0.56
3. **Combined** — משפר Cross-DB לעומת OF בודד, אך לא פותר לגמרי

### Pre-LoRA vs LoRA — OpenForensics
- Pre-LoRA: AUC **0.871** → LoRA: **0.522** (ירידה של 0.35!)
- **הסבר:** Full FT למד את כל המשקלים; LoRA עם rank=16 לא מספיק ל-CNN-SRM על OF

---

## 14. EfficientNetB0 — ניסויים

### מחברות
- **עם LoRA:** `exp_efficientnet.ipynb`
- **בלי LoRA:** `exp_efficientnet_no_lora.ipynb`

### פרמטרים
- IMG: 224×224, ImageNet preprocess
- Stage 1: backbone frozen, LR=5e-4
- Stage 2: top 30% unfrozen, LR=1e-5
- LoRA על Dense(256)
- Batch=32 (Combined: 16 — **הקטנה לזיכרון**)

### מטריצת AUC (LoRA)

| אומן ↓ \ נבדק → | OF | CiFake | CW | CelebDF |
|-----------------|-----|--------|-----|---------|
| OpenForensics | **0.803** | 0.589 | 0.627 | 0.472 |
| CiFake | 0.475 | **0.935** | 0.534 | 0.425 |
| CustomWar | 0.591 | 0.556 | **1.000** | 0.498 |
| CelebDF | 0.472 | 0.456 | 0.573 | 0.579 |
| Combined | 0.573 | 0.575 | **0.870** | 0.405 |

### מסקנות
- **Within-DB הכי גבוה** מכל המודלים (0.829 avg)
- **פער הכללה הכי גדול** (30.7%) — Overfitting למאגר האימון
- **Combined → CustomWar = 0.870** — אימון מאוחד עוזר
- Pre-LoRA OF: 0.957 → LoRA: 0.803 (ירידה קטנה יחסית)

### אופטימיזציות זיכרון (למה הקטנו)
- `shuffle` buffer: 2000 (במקום כל הדאטה)
- `prefetch(4)` (במקום AUTOTUNE)
- `ram_budget = 3GB`
- `gc.collect()` + `malloc_trim(0)` בין מאגרים
- Batch=16 ל-Combined dataset
- **סיבה:** שרת קרס מ-OOM בלי אלה

---

## 15. ViT-Light — ניסויים

### מחברות
- **עם LoRA:** `exp_vit.ipynb`
- **בלי LoRA:** `exp_vit_no_lora.ipynb`

### ארכיטקטורה ViT-Tiny
- Patch 16×16 → 196 patches
- 6 Transformer blocks, hidden=192
- LoRA בכל MLP (192→768→192)
- **~2.9M params**, LoRA adds ~198K
- **אין ImageNet** — מאומן מאפס

### פרמטרים
- Optimizer: **AdamW** (lr=5e-5 Phase 1, 1e-5 Phase 2, weight_decay=0.05)
- Patience: 10 (Phase 1), 8 (Phase 2) — **ViT מתכנס לאט**
- Augmentation חזק יותר (brightness ±0.15, hue)

### מטריצת AUC (LoRA)

| אומן ↓ \ נבדק → | OF | CiFake | CW | CelebDF |
|-----------------|-----|--------|-----|---------|
| OpenForensics | 0.606 | 0.465 | 0.515 | 0.444 |
| CiFake | 0.522 | **0.716** | 0.601 | 0.588 |
| CustomWar | 0.554 | 0.577 | **0.973** | 0.464 |
| CelebDF | 0.512 | 0.524 | 0.529 | 0.630 |
| Combined | 0.581 | **0.920** | 0.592 | 0.594 |

### מסקנות
- **Cross-DB avg הכי גבוה** (0.525) — הכללה הטובה ביותר
- **LoRA שיפר** (+0.047 Within avg) — היחיד שנהנה מ-LoRA
- Combined → CiFake = **0.920** — מצוין
- OF Within: F1-FAKE≈0 (collapse) — אותה בעיה כמו CNN-SRM

---

## 16. Xception — למה ננטש

### מה ניסינו
Dual-Stream Xception:
- 2× Xception מלאים (~22M params כל אחד)
- Input 299×299 (RGB + SRM 15 channels)
- Concatenate → Dense(512) → sigmoid

### למה קרס
- **OOM ~Epoch 2** — שני Backbones + 299×299 + SRM 15ch
- קובץ: `Xception_doc/improved_training_notebook.ipynb` (תא 38, commented out)

### מה בחרנו במקום
EfficientNetB0 + CNN-SRM + ViT-Light + LoRA + ניהול זיכרון

**למצגת:** "בחרנו מודלים קלים יותר — מתאים גם למכשירי קצה."

---

## 17. חיבור לאתר

| רכיב | מיקום | תפקיד |
|------|--------|--------|
| Frontend | React + Vite, port 3000 | UI |
| Backend | Flask, port 5000 | API |
| Model | `ml_service.py` | EfficientNetB0 only |
| Weights | `ml_models/efficientnetb0_finetuned_best.keras` | מהמחברת fixed |
| Heatmap | `heatmap_utils.py` | Grad-CAM |
| Git branch | `final-website` | קוד האתר |

**הערה:** האתר משתמש ב-**EfficientNetB0 בלבד** (לא Ensemble) — trade-off בין דיוק לזמן תגובה.

---

## 18. מסקנות מרכזיות להצגה

1. **בנינו מערכת היברידית** — SRM + EfficientNet + Two-Stream + Ensemble
2. **AUC 0.75 (Ensemble)** — יכולת הפרדה טובה, Accuracy 62–66% — יש מקום לשיפור
3. **Cross-DB הוא האתגר** — פער 20–31% בין Within ל-Cross
4. **ViT + LoRA** — הכללה הטובה ביותר; **EfficientNet** — דיוק Within הטוב ביותר
5. **Combined training** — משפר יציבות Cross-DB
6. **LoRA** — יעיל למכשירי קצה; ViT נהנה, CNN-SRM נפגע
7. **Xception ננטש** — OOM; בחרנו גישה קלה יותר
8. **Grad-CAM** — שקיפות למשתמש
9. **השערת מחקר נדחתה** — CNN-SRM לא הכליל הכי טוב; ViT כן
10. **יעד 85%** — לא הושג; ממצא מחקרי חשוב על הכללה

---

## 19. שאלות צפויות (Q&A)

**ש: למה Accuracy של CNN-SRM רק 45%?**
> המודל נוטה לחזות REAL (Recall FAKE=3%). AUC=0.697 מראה שיש יכולת הפרדה — הבעיה בסף, לא במודל. ב-Ensemble הוא תורם לPrecision.

**ש: מה ההבדל בין Within-DB ל-Cross-DB?**
> Within = אימון ומבחן על אותו מאגר (קל). Cross = אימון על מאגר A, מבחן על B (קשה, ריאלי).

**ש: מה LoRA?**
> כיוונון יעיל — מאמנים רק 0.1% מהפרמטרים. חוסך זיכרון, מתאים לEdge. ViT נהנה, CNN פחות.

**ש: למה לא Xception?**
> קרס מ-OOM — 2×22M params, 299×299. EfficientNetB0 = 5M params, 224×224.

**ש: מה המודל באתר?**
> EfficientNetB0 בלבד (AUC 0.715, Accuracy 62.6%) + Grad-CAM.

**ש: למה לא Ensemble באתר?**
> 3 מודels = 3× זמן inference. EfficientNet מספיק מהיר ומדויק לדמו.

**ש: מה Configuration?**
> מכלול הגדרות: LR, Batch, Epochs, LoRA rank, Augmentation, Class weights, Threshold.

**ש: האם LoRA שיפר?**
> ViT: כן (+0.047). EfficientNet: מעט פחות (-0.066). CNN-SRM: ירידה (-0.121, קריסה על OF).

---

*מסמך זה נוצר אוטומטית מניתוח המחברות, קבצי התוצאות (pkl/json) ו-TensorBoard. לויזואליזציות: `models/RealEyes_v2/visualizations/` ו-`models/lora_vs_no_lora/`.*
