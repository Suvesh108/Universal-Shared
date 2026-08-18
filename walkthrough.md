# Walkthrough - Vercel Serverless Optimization for Universal Clipboard

Universal Clipboard is now fully optimized for deployment on **Vercel** as a serverless application, with seamless support for instant device pairing and real-time synchronization over the public web.

---

## What Was Changed

### 1. Vercel Serverless Routing & Deployment Configuration
* **[vercel.json](file:///c:/Users/Suvesh/Desktop/projects/universal%20shared/vercel.json)**:
  * Configured Vite build command (`npm run build`) and output directory (`frontend/dist`).
  * Rewrote `/api/(.*)` requests to `/api/index.js` (Serverless Function).
  * Rewrote all other routes `/(.*)` to `/index.html` (SPA fallback).
* **[api/index.js](file:///c:/Users/Suvesh/Desktop/projects/universal%20shared/api/index.js)**:
  * Serverless entrypoint exporting an Express app with automatic SQLite initialization and CORS support.
* **[package.json](file:///c:/Users/Suvesh/Desktop/projects/universal%20shared/package.json)**:
  * Added required runtime dependencies at root for Vercel's bundler.

### 2. Ephemeral Storage & Dynamic URL Handling
* **[backend/src/config.js](file:///c:/Users/Suvesh/Desktop/projects/universal%20shared/backend/src/config.js)**:
  * Automatically switches `DATA_DIR` and `UPLOADS_DIR` to `/tmp` in serverless environments (`process.env.VERCEL`).
  * Detects `VERCEL_URL` and `x-forwarded-host` / `x-forwarded-proto` headers.
* **[backend/src/db.js](file:///c:/Users/Suvesh/Desktop/projects/universal%20shared/backend/src/db.js)**:
  * Added resilient multi-path WASM file location for `sql.js`.
  * Implemented safe initialization and memory fallback if disk persistence is unavailable.
* **[backend/src/routes/api.js](file:///c:/Users/Suvesh/Desktop/projects/universal%20shared/backend/src/routes/api.js)**:
  * Generates QR codes and pairing links based on public forwarded host headers when accessed over the internet.

### 3. Hybrid Real-Time Synchronization Engine
* **[frontend/src/hooks/useSocket.js](file:///c:/Users/Suvesh/Desktop/projects/universal%20shared/frontend/src/hooks/useSocket.js)**:
  * **Smart Polling Fallback**: Automatically activates a background sync poll (every 2.5s) when WebSockets are unavailable or disconnected (such as on Vercel Serverless).
  * **HTTP REST Fallback**: Seamlessly falls back to `api.sendText(...)` when transmitting clipboard entries.
  * Preserves full high-speed WebSocket connectivity when run locally.
* **[frontend/src/components/Header.jsx](file:///c:/Users/Suvesh/Desktop/projects/universal%20shared/frontend/src/components/Header.jsx)** and **[frontend/src/components/PairingModal.jsx](file:///c:/Users/Suvesh/Desktop/projects/universal%20shared/frontend/src/components/PairingModal.jsx)**:
  * Displays the public Vercel app URL (`https://your-app.vercel.app`) in the header and pairing dialogs.

---

## Verification Results

### Build Verification
Ran `npm run build` with Vite:
```text
vite v6.4.3 building for production...
dist/index.html                   0.73 kB │ gzip:  0.46 kB
dist/assets/index-CoZ0vBeL.css   19.15 kB │ gzip:  4.25 kB
dist/assets/index-BPGtMyZE.js   221.18 kB │ gzip: 69.43 kB
✓ built in 763ms
```

### Serverless API Test
Executed requests directly against `api/index.js`:
- `/api/info` returned `200 OK` with system metadata.
- `/api/devices/register` created a device and generated a secure token.
- `/api/clipboard` created clipboard items and `/api/history` returned the updated history list.

---

## How to Deploy to Vercel

1. Push your changes to GitHub:
   ```bash
   git add .
   git commit -m "Optimize for Vercel Serverless deployment"
   git push
   ```
2. In [Vercel Dashboard](https://vercel.com/new):
   - Click **Add New** > **Project**.
   - Import your GitHub repository (`Universal-Shared`).
   - Keep default settings (Vercel automatically detects `vercel.json` and runs `npm run build`).
   - Click **Deploy**.
3. Once deployed, open your Vercel URL on your computer, click **Pair Device**, and scan the QR code with your phone from anywhere!
