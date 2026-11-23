# Hale Frontend (`plant-disease-frontend`)

Interactive client-side user interface for the **Hale** foliar plant leaf disease classification system.

- **Live Demo:** Available at deployment URL.
- **Backend Repository:** https://github.com/Khushii1811/plant-disease-backend

---

## What It Is

A lightweight, responsive web application that connects farmers, agronomists, and researchers to the Hale DualHead ConvNeXt-Tiny classification engine.

Key capabilities:
- **Diagnostic Upload & Camera Capture:** Drag-and-drop, focal leaf cropper, and optional 1 to 3 photo multi-view scanner.
- **Explainable Grad-CAM Overlay:** Visual attention heatmaps rendered directly over uploaded leaf images with interactive opacity sliders.
- **Botanical Reference Wiki:** Visual reference library covering 177 foliar conditions across 33 crops with public license ledger.
- **Exportable PDF Reports:** Client-side generation of standardized single-page A4 diagnostic consultation sheets.

---

## Deployment & Local Execution

### Hosted Deployment
In the production cloud deployment, these static frontend files are mounted directly by the FastAPI backend at the root path (`/`) inside a single container.

### Local Development
To run the frontend locally alongside a local backend:
1. Ensure the backend is running at `http://localhost:8000`:
   ```bash
   cd plant-disease-backend && uv run uvicorn serving.main:app --port 8000
   ```
2. Serve the frontend with any static HTTP server or open `index.html` directly in your browser:
   ```bash
   cd plant-disease-frontend
   python -m http.server 3000
   ```
3. Open `http://localhost:3000` in your web browser.

---

## Privacy & Network Requests

The frontend makes requests only to its own backend (`/api/v1/predict` in hosted mode or `http://localhost:8000` in local dev). All fonts use native system typefaces (`system-ui`), ensuring zero third-party network requests, cookies, or external analytics telemetry.

---

## Disclaimer & Licensing

Automated visual decision-support tool; not a licensed plant pathologist; verify with an extension officer; follow the pesticide label and pre-harvest intervals.

- **Frontend Code:** Released under the [MIT License](LICENSE).
- **Botanical Samples & Metadata:** Released under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) (non-commercial, not for commercial use).
