# TerraMind-X Security & Resilience Specification

## 1. Threat Mitigation Architecture

TerraMind-X implements defense-in-depth protection across all system layers:

### 1. LLM Prompt Injection & Hallucination Defense
- **Strict Input Normalization**: User natural language prompts are sanitized through strict regular expressions before entering the agent reasoning pipeline.
- **Fact-Constrained Grounding**: The LLM prompt context is strictly composed of verified JSON records (mandi prices, soil metrics). Unverified claims or external speculative prices trigger automated abstention flags.
- **Output Schema Enforcement**: LLM responses are parsed against strict Pydantic v2 data models. If an output violates schema constraints, the system falls back to pre-compiled deterministic advisory templates.

### 2. API Gateway Security
- **JWT Authentication**: Token-based authentication with secure HMAC-SHA256 signatures.
- **Rate Limiting**: Sliding window rate limiter preventing API abuse and DoS vectors.
- **CORS Policies**: Explicit origin whitelisting allowing only verified frontend PWA instances.

### 3. Database Security
- **SQLAlchemy 2.0 Parameterized Queries**: Complete prevention of SQL injection vulnerabilities.
- **Sensitive Key Encryption**: API keys (NASA, OpenWeather, Groq) stored exclusively in `.env` variables and excluded from version control via `.gitignore`.
