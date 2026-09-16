# TerraMind-X — Chat Intent Classification & Conversational Correctness Audit

> **P0 Architectural Mandate:**  
> *"Casual user messages ('how are you', 'hello', 'thanks') must never trigger the 5-Agent Agricultural Decision Council or generate unprompted crop recommendation cards."*

---

## 1. Root Cause Analysis

### Identified Flaw
In the AI Advisor interface ([`AIAdvisorPage.tsx`](file:///c:/Users/admin/Downloads/Agri%20New/src/pages/AIAdvisorPage.tsx)), the chat submission handler used simplistic string keyword matching (`if (q.includes('accuracy'))... else if (q.includes('urea'))... else if (q.includes('tomato'))... else { ... }`).

Any query that was not explicitly matched (including `"how are you"`, `"hello"`, `"good morning"`, `"thanks"`, `"what can you do"`) fell directly into the `else` block, which generated a full pre-sowing crop recommendation card for the active farm (*"TerraMind-X Council evaluated your 5 acres in Baramati, Pune. Soybean (JS 335) or Sugarcane..."*).

---

## 2. New Architectural Boundary

```
                     USER QUERY
                         │
                         ▼
             ┌─────────────────────────┐
             │ Intent Classifier Router│
             └───────────┬─────────────┘
                         │
         ┌───────────────┼────────────────────────┐
         │               │                        │
         ▼               ▼                        ▼
      CASUAL        EXPLANATION              AGRICULTURAL
 (Greeting / Help) (SIS / Accuracy)     (Crop / Soil / Market)
         │               │                        │
         ▼               ▼                        ▼
   Direct Text      Deterministic           5-Agent Council
    Response      Math Verification        Tailored Evidence
  (NO Crop Cards)  (Verification Gate)   (Structured Advisory)
```

---

## 3. Intent Taxonomy ([`chatIntentClassifier.ts`](file:///c:/Users/admin/Downloads/Agri%20New/src/services/chatIntentClassifier.ts))

| Intent | Sample Queries | Requires Agri Pipeline? | Response Structure |
| :--- | :--- | :--- | :--- |
| `greeting` | `"hi"`, `"hello"`, `"vanakkam"`, `"namaskar"` | ❌ No | Friendly multilingual greeting. |
| `casual_conversation` | `"how are you"`, `"how r u"`, `"thanks"`, `"bye"` | ❌ No | Polite conversational reply; no crop cards. |
| `capabilities` | `"what can you do"`, `"who are you"`, `"features"` | ❌ No | Structured 5-point capability explanation. |
| `technical_question` | `"what is sis model"`, `"72% accuracy"` | ❌ No | Mathematical proof & backtest explanation. |
| `crop_recommendation` | `"which crop to plant"`, `"recommend crop"` | ✅ Yes | Full 5-Agent Council evaluation for active farm. |
| `soil_analysis` | `"my soil ph is 5.2"`, `"urea substitute"` | ✅ Yes | Soil Guardian nutrient & organic schedule. |
| `market_query` | `"tomato price"`, `"onion mandi price"` | ✅ Yes | AGMARKNET price discovery & anti-glut warning. |
| `what_if` | `"what if rainfall decreases 30%"` | ✅ Yes | Counterfactual sensitivity & resilience analysis. |
| `unknown` | Ambiguous input | ❌ No | Clarification prompt; **never** guesses a random crop! |

---

## 4. Verification Matrix

| User Input | Previous Behavior (Bug) | Upgraded Behavior |
| :--- | :--- | :--- |
| `"how are you"` | ❌ Returned *"TerraMind-X Council evaluated your 5 acres in Baramati, Pune..."* | ✅ *"I'm doing very well, thank you! How are things on your farm today? Let me know if you need help with crop selection, soil health, weather, or market rates."* |
| `"hello"` | ❌ Returned crop recommendation | ✅ *"Hello! I'm TerraMind-X, your AI agricultural decision assistant. How can I help with your farm, crops, or market prices today?"* |
| `"what can you do?"` | ❌ Returned crop recommendation | ✅ Explains 5 core capabilities (Council, Soil, SIS Market, What-If, Voice). |
| `"which crop should I plant?"` | ✅ Returned crop recommendation | ✅ Returns 5-Agent Council decision with structured evidence. |
