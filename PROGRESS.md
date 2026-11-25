# Project notes

## Implementation principles

- Use provider-reported US AQI variables; do not apply one jurisdiction's AQI breakpoints to another index or to a single-hour pollutant value.
- Keep model estimates, cached readings, forecasts, user-entered monitor readings, and unavailable data visibly distinct.
- A forecast period with lower AQI is a comparison only. Do not label it safe or advise a fixed time of day without supporting local data.
- Do not infer indoor concentrations, personal doses, health outcomes, emissions savings, cleaner CADR, or mixing height from a fan setting or AQI.
- Keep medical red flags and personal care plans grounded in public-health guidance; the advisor is educational and must not diagnose or change treatment.
- Use local deterministic advice and public feeds that require no API keys.
- Store user preferences locally. Send only the selected profile context needed for a user-initiated advisor request, without location coordinates.

The app's data limitations and cited source material are documented in README.md.

## Frontend and verification

Aura is a responsive React application for urban air-quality planning. Its main workflows are location selection, forecast comparison, household-aware action planning, a local advisor, indoor filtration guidance, a household choices log, and community action ideas.

The interface supports English, Hindi, and Punjabi. Forecast values are labeled as model estimates, stale cached hourly values are hidden, and the app does not derive indoor air quality from outdoor AQI or filter controls. The 3D scene is clearly presented as an illustration.

The canonical implementation details, setup, assumptions, and validation commands are in [README.md](README.md). Unit and API tests live under `frontend/src` and `server`. Browser behavior and accessibility tests live under `frontend/tests`.

## Handover

README.md is the canonical setup and product description. The repository contains a React/Vite client, an Express API, and shared deterministic advice rules.

## Local development

Install from the lockfiles with `npm ci`, `npm --prefix frontend ci`, and `npm --prefix server ci`. Run `npm run dev`. No API keys or accounts are needed. The client is at `http://localhost:3000` and the API is at `http://localhost:3001`.

## Important behavior

- Live air-quality values come from Open-Meteo/CAMS and are model estimates, not street-level monitor readings.
- No fabricated city values are used when data is unavailable. Cached readings are aged and cached forecasts are hidden.
- `shared/advice.mjs` provides deterministic, schema-validated advice returned as JSON. Urgent safety summaries and rule-based recommendations support English, Hindi, and Punjabi. Hindi and Punjabi advice copy has not had native-speaker review.
- Nearby CPCB station readings are sourced from a third-party no-key mirror for India and are shown separately from model estimates. Snapdata does not document the averaging period for its reported `avg` values. Null and over-six-hour values are excluded.
- The 3D scene is a schematic illustration. It does not estimate mixing height, indoor particle levels, or cleaner performance.
- User-entered indoor PM2.5 readings, profile values, selected location, and action history are saved in local browser storage.

## Verification and limits

- The suite covers forecast changes, cache fallback, household edits, share files, keyboard focus, language selection, API limits, multilingual urgent phrases, direct shared-advice and station-service rules, and the advice fallback. Vitest coverage thresholds run in CI. See [README.md](README.md) for the commands.
- Direct route loading and offline reload were checked against the local production build. Browser tests use the keyless advisor. Server tests exercise optional Gemini mode with a test provider.
- Browser runs use Chromium at two viewport widths. Physical-device audio, native share sheets, screen-reader behavior, and native-speaker review of the new Hindi and Punjabi text remain unverified.
- The Three.js scene is split into smaller chunks. The app shell excludes them from PWA precaching and the service worker caches them after a Sanctuary visit.

## Change log

### 2026-11-21

- Replaced client-side AQI conversion with Open-Meteo US AQI values and a bounded next-24-hour hourly forecast.
- Removed static city fallback readings and hid cached hourly forecast values when they may be stale.
- Removed unsupported indoor-air, mixing-height, household emissions, and community savings calculations.
- Kept the interactive 3D scene as an explicitly labeled schematic illustration.
- Hardened advisor request and response validation, added deterministic offline guidance, and aligned README and handover docs with actual behavior.
- Updated existing tests and project copy to match these changes.

### 2026-11-22

- Split the 3D scene setup into a dedicated hook and smaller component modules.
- Extracted the advisory banner and added English, Hindi, and Punjabi translations.
- Added desktop and mobile screenshots and documented the reverse-proxy trust setting in README.md.
- Consolidated project notes and removed scratch prompts and stale generated files.
- Added request-correlated server error logs and removed synthetic chunking of completed local advice.
- Kept the advisor keyless and local; added a public CPCB station-feed integration for nearby raw observations.
- Added focused component and service tests for translations, station readings, and streamed responses.
- Expanded urgent symptom matching and topic keywords across English, Hindi, and Punjabi; moved rule-based recommendation copy into language-specific templates.
- Added direct unit coverage for shared advice, CPCB station selection, and forecast trend summaries, with a coverage threshold in CI; added a JSDoc typecheck for `shared/` and `server/`.
- Lazy-loaded route pages and share/glossary dialogs, split scene construction and Navbar search into smaller modules, and added a forecast trend prompt and provider reading timestamp.
- Added a copyable plain-text share summary and moved the Vercel proxy handler outside `api/`.
- Health checks now log the observed forwarded-IP chain length and warn when it changes during the process. Optional Gemini mode checks model metadata once at startup and exposes readiness through `/api/health`.
