# PHASE4_MOBILE_INTEGRATION

## 1. Product framing

This project is a mobile-first agricultural intelligence application built in React + TypeScript + Vite. The correct implementation path is to keep the existing interface, navigation, and product flow while integrating it to a real, provenance-aware agricultural data pipeline.

The requirement is not to rebuild the app in a different stack. The requirement is to make the existing mobile product behave like a credible farmer-facing system without inventing real-world data.

## 2. Architecture constraints

### Required agent model
Exactly four specialized agents are allowed:
1. Crop Suitability Agent
2. Market Risk Agent
3. Soil & Sustainability Agent
4. Climate & Weather Risk Agent

### Required validation model
Evidence validation and data-quality checking are separate from the agent layer.

Correct pattern:
- Four agent analysis modules
- Validation and evidence chain
- Decision assembly
- Source registry and provenance tracking

Incorrect pattern:
- A fifth agent called “Evidence Agent” or similar
- Combining validation logic into one of the four specialized agents in a misleading way

## 3. Source registry and data provenance

Every model output should carry provenance metadata, including:
- source
- data_timestamp
- data_period
- geography
- model_version
- confidence

The backend already establishes the correct direction by maintaining a DATA_SOURCES registry and by marking demo or seed values with TEST_DATA.

This is the required production pattern:
- live data from public and legal sources when available
- demo seed values explicitly marked TEST_DATA
- unavailable or partial results when a source cannot be verified

## 4. Data policy

The product must not fabricate:
- real crop prices
- buyer names
- demand scaling or demand percentages
- market growth claims without a clear source
- weather, soil, or cultivation values not tied to a valid source

When the app cannot verify a value, it must present:
- unavailable
- partial
- insufficient
- TEST_DATA

It must not silently replace missing data with confident-sounding market narratives.

## 5. Frontend integration model

The app already has the correct core integration shape:
- Frontend/src/api.ts centralizes requests
- Frontend/src/TerraMindContext.tsx manages app data state
- maps screen data to the global decision packet

That structure should remain the canonical integration layer. This is the correct place for live data provisioning, fallback logic, and error handling.

## 6. UI requirements

The product should remain visually and navigationally consistent with the current mobile-style app. The changes should be limited to:
- correcting copy that references the wrong number of agents,
- making all data claims traceable,
- surfacing source metadata where needed,
- avoiding false certainty in product language.

No major redesign is necessary.

## 7. Planned implementation logic

### A. Preserve the existing app structure
Keep the current screen model and navigation flow.

### B. Keep four-agent council semantics
The final recommendation and council UI must remain explicitly four-agent.

### C. Enforce evidence-backed messaging
Where the UI says “confidence,” “market opportunity,” or “approved,” ensure those are backed by:
- decision payload metadata,
- evidence records,
- validation status,
- data_quality_score

### D. Replace legacy marketing copy
The following phrases should be removed or corrected:
- “5-Agent AI council”
- “All 5 Agents Approved”
- any product copy implying a fifth agent or hidden validation model

### E. Keep service-level availability grounded
If the backend data source is unavailable, the frontend should surface a sober status rather than a confident recommendation.

## 8. Acceptance checklist

The phase is considered complete only when all of the following are true:

- The UI wording and agent model are exactly four agents.
- There is no fifth agent in any UI copy, docs, or code narrative.
- Evidence validation is described and implemented as a non-agent layer.
- Source metadata is present in the backend decision flow.
- Fallback or demo values remain clearly labeled.
- No fabricated price, demand, buyer, or cultivation data is presented as live.
- The existing mobile app remains usable and intact.
- The product works as a real farmer-facing advisory app instead of a static mockup.

## 9. Final note

This integration phase is about bringing the current product into a production-safe architecture without changing the app’s identity. The repo already has the right foundation: a working mobile app, a central API layer, a provenance-aware backend, and a four-agent decision shape. The remaining work is disciplined cleanup and compliance enforcement.
