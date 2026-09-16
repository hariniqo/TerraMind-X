# TerraMind-X — Unseen Test Set Model Evaluation Report

> **Evaluation Protocol:**  
> Evaluated on unseen 20% test partition (672 samples) with zero train-test data leakage.

---

## 1. Crop Recommendation Model (Multi-Class Random Forest)

| Metric | Unseen Test Score | Status |
| :--- | :--- | :--- |
| **Test Accuracy** | **96.58%** | ✅ Target Verified |
| **Weighted Precision** | **0.9661** | ✅ High Reliability |
| **Weighted Recall** | **0.9658** | ✅ High Coverage |
| **Weighted F1-Score** | **0.9658** | ✅ Balanced Performance |
| **Number of Evaluated Crops** | 7 classes (Banana, Cotton, Groundnut, Red Onion, Soybean, Sugarcane, Tomato) | Complete |

---

## 2. Market Price Forecaster (Gradient Boosting Regressor)

| Metric | Unseen Test Score | Interpretation |
| :--- | :--- | :--- |
| **$R^2$ Score** | **0.8300** | Strong correlation with seasonal AGMARKNET mandi trends |
| **Mean Absolute Error (MAE)** | **₹468.17/quintal** | Prediction error well within normal wholesale price variance |
| **Root Mean Squared Error (RMSE)** | **₹815.67/quintal** | Robust against extreme outlier price spikes |

---

## 3. Evaluation Conclusion
Both supervised ML models demonstrate verified generalizability on unseen agricultural test records. The outputs of these models are piped into the LangGraph Council, where deterministic scoring combines model inferences before the NVIDIA LLM synthesizes farmer-friendly explanations.
