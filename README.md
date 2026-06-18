# Universal Clipboard

Self-hosted clipboard sync for personal use. Sync text, links, images, files, and videos across devices on your local Wi-Fi — **no Firebase, no Supabase, no cloud, no internet required**.

Designed for a **Windows 11 laptop** running the server and **Android phones** connecting via the mobile browser.

## Features

- Real-time clipboard sync over WebSocket (Socket.io)
- Text, links, images, videos, and unrestricted support for **all file formats** (PDF, ZIP, docs, spreadsheets, etc.)
- Clipboard history styled as a WhatsApp-style chat bubble log (Left = Sent, Right = Received)
- **Expand/Collapse (Maximize) View** to enlarge history log to full page for easy reading/downloading
- **Device Profile settings in Navbar** to rename or change device types on the fly
- Clipboard history stored in local SQLite database
- Device discovery (active, idle, offline statuses) excluding current device to prevent redundancies
- QR code pairing for new devices
- Drag-and-drop file uploads with active progress bars
- Glassmorphic dark / light theme (Monochrome & Pure Obsidian style with Electric Indigo accents)
- Auto-logout interception if browser device tokens become stale or invalid
- Responsive custom top-center glassmorphic popups replacing default blocking browser alerts
- Fully responsive layout optimized for desktop, tablet, and mobile screens (clean stacked list view on mobile)

## Architecture

```
Windows 11 (server)                    Android (client)
┌─────────────────────┐               ┌─────────────────────┐
│  Node.js + Express  │◄── Wi-Fi ────►│  Chrome / browser   │
│  Socket.io          │   LAN only    │  React UI           │
│  SQLite + uploads/  │               │                     │
└─────────────────────┘               └─────────────────────┘
         │
    All data stays on your laptop
    (backend/data/clipboard.db)
```

## Quick start

### 1. Install dependencies

```powershell
cd "c:\Users\Suvesh\Desktop\universal shared"
npm run install:all
```

### 2. Development (two terminals or one command)

**Option A — run both together:**

```powershell
npm install
npm run dev
```

**Option B — separate terminals:**

```powershell
# Terminal 1 — backend (port 3847)
npm run server

# Terminal 2 — frontend (port 5173, proxies to backend)
npm run client
```

Open **http://localhost:5173** on your Windows PC.

### 3. Production (single server on laptop)

```powershell
npm run start
```

Open **http://YOUR_LAN_IP:3847** (shown in the terminal) on any device on the same Wi-Fi.

### 4. Running via Docker

Alternatively, you can run the entire application as a containerized service using Docker Compose. 

To ensure the pairing QR code and shared file URLs point to your host computer's correct LAN IP address (rather than the container's isolated internal IP), supply your local LAN IP using the `HOST_IP` environment variable:

**Option A: Using a `.env` file (Recommended)**
Create a file named `.env` in the root folder (next to `docker-compose.yml`) with your IP:
```env
HOST_IP=192.168.0.130
```
Then start the container:
```bash
docker-compose up -d --build
```

**Option B: Set environment inline**
- **In PowerShell:**
  ```powershell
  $env:HOST_IP="192.168.0.130"; docker-compose up -d --build
  ```
- **In CMD:**
  ```cmd
  set HOST_IP=192.168.0.130 && docker-compose up -d --build
  ```
- **In Linux / macOS Terminal:**
  ```bash
  HOST_IP=192.168.0.130 docker-compose up -d --build
  ```

- Port `3847` will be exposed.
- All database files and media uploads will be stored securely and persist in a managed volume named `clipboard-data`.

To stop the container:
```bash
docker-compose down
```

## Pairing a phone

1. On Windows, open the app and click **Start on this device** (name it e.g. "Windows PC").
2. Click **Pair device** to show a QR code and 6-character code.
3. On your Android phone (same Wi-Fi), scan the QR or open the URL manually.
   - *Docker/LAN Note:* If the QR connection fails on mobile, open your **Device Profile** (click the profile icon in the top-right navbar), enter your laptop's actual Wi-Fi IP (e.g., `192.168.0.130`) into the **Wi-Fi IP Address** input, and save. This regenerates the QR code and all shared connections to target your physical laptop IP.
4. Choose **Join with code**, enter the code, and name your phone.

## Usage

- **Send text/links:** Type or paste in the input box, or tap **Paste & send**.
- **Send files:** Drag and drop onto the drop zone, or tap **Upload file**.
- **Receive:** New items appear in history; text/links are auto-copied when possible.
- **History:** Browse, copy, or delete past clipboard items.

## Windows firewall

If your phone cannot connect, allow inbound TCP port **3847** on your private network:

```powershell
New-NetFirewallRule -DisplayName "Universal Clipboard" -Direction Inbound -Protocol TCP -LocalPort 3847 -Action Allow -Profile Private
```

## Data storage

| Path | Purpose |
|------|---------|
| `backend/data/clipboard.db` | SQLite database (history, devices) |
| `backend/data/uploads/` | Uploaded images, files, videos |

Delete these folders to reset all data.

## Tech stack

- **Frontend:** React 18, Vite 6
- **Backend:** Node.js, Express, Socket.io
- **Database:** SQLite via sql.js (local file, no native build tools required)
- **Uploads:** Multer (local disk)

## Security note

This app is intended for **personal use on a trusted home network**. It has no authentication beyond device pairing tokens stored in the browser. Do not expose port 3847 to the public internet.
