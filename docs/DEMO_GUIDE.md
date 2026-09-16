# TerraMind-X — SIH Grand Finale Demo & Evaluation Guide

## Overview for Evaluators
TerraMind-X is an **AI-Powered Pre-Sowing Agricultural Decision Intelligence Platform**. It addresses the #1 cause of smallholder price crashes: **herd-planting and lack of pre-sowing market/climate intelligence**.

---

## 30-Second Elevator Pitch
> *"Before a farmer puts a single seed in the ground, TerraMind-X analyzes soil, NASA weather forecasts, CMIP6 climate projections, and AGMARKNET market demand. Using an epidemic SIS diffusion model, it predicts collective oversupply risks and recommends the most profitable, climate-resilient crop with explainable multi-agent AI."*

---

## 3 Interactive Judge Scenarios

### Scenario 1: The Madurai Onion Decision (Baseline Demonstration)
1. **Location**: Melur, Madurai, Tamil Nadu (2.8 Acres).
2. **Current State**: Farmer previously planted Cotton. Soil pH is 6.7 (Optimal), rainfall is 45mm, Mandi price for Onion is ₹4,850/qtl.
3. **Observation**:
   - Regional cultivation is **24.5%** (Safe, below the 55% critical cap).
   - The **5-Agent Council** votes unanimously (88% confidence) to recommend **Onion (Bellary)**.
   - Click **"Why was this recommended?"** to view the exact ground-truth evidence chain.

### Scenario 2: The Nashik Tomato Oversupply Crisis (Anti-Herd Demonstration)
1. **Action**: Open the farm switcher or select Nashik district.
2. **Observation**:
   - Regional Tomato cultivation has surged to **68.4%** (Exceeding the 55% critical threshold).
   - Price crash probability spikes to **76.0%**.
   - **Decision Engine Action**: The system penalizes Tomato suitability and automatically recommends **Groundnut / Chilli** as a hedge alternative to prevent catastrophic losses.

### Scenario 3: Live "What-If" Counterfactual Simulation
1. **Action**: Navigate to **What-If Simulator** (`/what-if`).
2. **Interactive Test for Judges**:
   - Drag **Rainfall Anomaly** slider to **-30%** (Simulating delayed monsoon).
   - Drag **Temperature Anomaly** slider to **+2.0°C**.
   - Watch the Decision Engine dynamically invert crop rankings in real time:
     $$\text{Paddy (81\% Suitability)} \longrightarrow \text{Paddy (58\% Stress)} \quad\text{vs}\quad \textbf{Millet (88\% Resilience Rank 1)}$$
   - Read the explainability banner summarizing why the ranking shifted.

---

## Technical Features to Show the Jury

1. **System Health & Observability** (`/system-status`):
   - Shows live operational readiness across all 9 subsystems (FastAPI, PostgreSQL, AGMARKNET, NASA POWER, Zenodo CMIP6, LangGraph Council, IoT ESP32).
2. **Multilingual & Voice Interface**:
   - Switch language to **தமிழ்** or **Tanglish**.
   - Ask voice query: *"Indha season enna crop podalaam?"*
   - Observe live pipeline state: *Listening... $\rightarrow$ Processing... $\rightarrow$ Analyzing 5 Agents... $\rightarrow$ Decision Ready*.
3. **Data Provenance Popover**:
   - Hover over any metric badge to see exact data provenance (Source registry, timestamp, confidence, sample size).
