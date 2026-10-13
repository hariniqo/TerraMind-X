# AGENTS.md

## Project Context

TerraMind-X is an AI-powered agricultural intelligence platform (SIH 2026, PS 26132). The frontend is a Vite + React + TypeScript app at the repo root (`src/`), with a Python FastAPI backend in `backend/`.

## Key Files

- `src/`: frontend application source (TypeScript/React)
- `src/App.tsx`: main app component with internal screen state management (landing → dashboard → sub-screens)
- `src/components/landing/LandingScreen.tsx`: mobile-centered landing page matching the Figma reference design
- `vite.config.ts`: Vite config with preview-mode host allowlist
- `docker-compose.base44.yml`: Base44 dev environment (Vite dev server on port 3000)
- `tailwind.config.js`: Tailwind config with TerraMind-X color palette
- `backend/`: Python FastAPI backend

## Working Notes

- The frontend runs via `docker compose -f docker-compose.base44.yml up -d` — it starts a Vite dev server with live reload.
- `vite.config.ts` conditionally allows the sandbox host domain when `BASE44_PREVIEW_MODE=1` so the preview proxy can reach the dev server.
- The app starts on a landing page (mobile-centered card with farmer hero image, language selector, and "Get Started" CTA). Clicking "Get Started" transitions to the full dashboard with sidebar navigation.
- No external secrets are required for the frontend to boot.
