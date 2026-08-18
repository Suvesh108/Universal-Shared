# US • Universal Shared

<div align="center">
  <img src="frontend/public/logo.svg" width="120" height="120" alt="US Logo" />
  <h3>Universal Shared — Instant Real-Time Cross-Device Clipboard & File Sharing</h3>
  <p>Seamlessly share text, links, images, videos, PDFs, and files across all your phones, tablets, and computers.</p>
</div>

---

## ✨ Features

- ⚡ **Real-Time Cross-Device Sync**: Instant clipboard updates across devices using a hybrid sync engine (WebSockets for local environments & Smart Polling for serverless deployments).
- 📁 **Universal File & Media Support**: Transfer text, URLs, screenshots, photos, videos, PDFs, ZIPs, and documents up to 100MB with progress tracking.
- 📱 **Instant QR & PIN Pairing**: Pair secondary phones, tablets, or laptops in seconds by scanning a QR code or entering a 6-character code.
- ☁️ **Deploy Anywhere**:
  - **Vercel Serverless**: 1-click cloud deployment with zero server maintenance.
  - **Local Node.js Server**: Self-hosted on your local Wi-Fi with auto-configured Windows firewall rules.
  - **Docker Compose**: Containerized single-command execution.
- 🔐 **Stateless Device Authentication**: Cryptographically signed HMAC-SHA256 device tokens guarantee seamless cross-container authentication across serverless lambdas.
- 💬 **WhatsApp-Style Chat History**: Clean bubble-style clipboard log with sender badges, previews, quick copy, and full-screen maximization view.
- 🎨 **Obsidian Glassmorphic UI**: Premium responsive interface with dark/light themes, sleek animations, and custom modal dialogs.

---

## 🏛️ Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    US • Universal Shared                     │
└─────────────────────────────────────────────────────────────┘
                               │
       ┌───────────────────────┴───────────────────────┐
       ▼                                               ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│       Cloud Deployment       │        │       Local Deployment       │
│     (Vercel Serverless)      │        │       (Node.js / Docker)     │
├──────────────────────────────┤        ├──────────────────────────────┤
│ • /api Serverless Functions  │        │ • Express + Socket.io Server │
│ • Smart Polling REST Sync    │        │ • Low-latency WebSockets     │
│ • Cross-Container File Cache │        │ • Local SQLite & /uploads    │
│ • Global HTTPS Domain Access │        │ • Windows Auto-Firewall Rule │
└──────────────────────────────┘        └──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       ┌───────────────┐               ┌───────────────┐
       │   PC / Mac    │◄─── Sync ───►│  Phone/Tablet │
       │  (Desktop UI) │               │  (Mobile Web) │
       └───────────────┘               └───────────────┘
```

---

## 🚀 Deployment Options

### Option 1: Deploy to Vercel (Recommended for Cloud)

1. Push this repository to your GitHub account.
2. Go to [Vercel Dashboard](https://vercel.com/new) and import the **`Universal-Shared`** repository.
3. Keep default settings (`vercel.json` will automatically configure routing and build).
4. Click **Deploy**.
5. Open your public Vercel URL, click **Pair Device**, and scan the QR code from any phone anywhere in the world!

---

### Option 2: Run Locally on Windows / Mac / Linux

#### 1. Install dependencies
```bash
npm run install:all
```

#### 2. Start Development Server
```bash
npm run dev
```
> *On Windows, the startup script automatically verifies your local Wi-Fi IP and configures Windows Defender Firewall rules for port 3847 and 5173.*

#### 3. Production Build & Start
```bash
npm start
```
Open the URL printed in your terminal (e.g. `http://YOUR_WIFI_IP:3847`) on your phone or computer.

---

### Option 3: Run with Docker Compose

1. Create a `.env` file in the project root:
   ```env
   HOST_IP=192.168.0.124
   ```
2. Start the container:
   ```bash
   docker-compose up -d --build
   ```
3. To stop:
   ```bash
   docker-compose down
   ```

---

## 📱 How to Pair Devices

1. Open the application on your primary device and enter a device name (e.g. *"MacBook Pro"* or *"Windows PC"*).
2. Click **Pair device** in the top navbar to display your unique QR code and 6-character PIN.
3. On your phone or secondary computer, scan the QR code or navigate to the connection URL.
4. Tap **Join with code**, enter the PIN, and start sharing immediately!

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 6, Socket.io Client, CSS3 Custom Properties (Glassmorphic Design)
- **Backend**: Node.js, Express, Socket.io, Multer, QRCode
- **Storage**: Dual SQLite (`sql.js`) & In-Memory JSON Cache with serverless cross-container restoration
- **Security**: HMAC-SHA256 Signed Device Tokens & Ephemeral Memory Buffers

---

## 📄 License

MIT License — Feel free to use, modify, and distribute for personal and commercial projects.
