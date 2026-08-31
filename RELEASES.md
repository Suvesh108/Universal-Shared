# 📦 Universal Shared — Release v0.1

Welcome to **Universal Shared v0.1**! This release introduces native standalone applications for **Android** and **Windows**, providing seamless, private, local-network clipboard synchronization and file sharing without relying on any external cloud services.

---

## 🚀 Available Binaries

| File Name | Platform | Format | Size | Description |
| :--- | :--- | :--- | :--- | :--- |
| **[universal-shared-v0.1.apk](./universal-shared-v0.1.apk)** | Android (8.0+) | APK | **4.01 MB** | Standalone native Android application |
| **[universal-shared-v0.1-setup.exe](./universal-shared-v0.1-setup.exe)** | Windows (10/11) | NSIS Installer | **118.90 MB** | Full Windows setup installer with shortcuts |
| **[universal-shared-v0.1.exe](./universal-shared-v0.1.exe)** | Windows (10/11) | Portable EXE | **118.69 MB** | Single-file portable executable (no install required) |

---

## ✨ Features in v0.1

### 📱 Android Application (.apk)
- **Native Experience**: Packaged with Capacitor 6 and Android SDK 36 for high responsiveness.
- **Direct LAN Connection**: Connects directly over local Wi-Fi to your host PC server.
- **Server IP Configuration**: Easily configure or switch host PC server IPs (http://192.168.x.x:3000) right inside the app.
- **One-Tap Clipboard Copying**: Automatically copies incoming text and links with instant notification feedback.
- **File Sharing & Downloads**: Receive images, videos, PDFs, and files directly to device storage.
- **Dark / Light Theme**: Full theme support matching system preferences.

### 🖥️ Windows Desktop Application (.exe)
- **Built-in Self-Hosted Backend**: Bundles the Express, Socket.IO, and SQLite/sql.js engine inside the desktop runtime.
- **System Tray Integration**: Runs quietly in the Windows notification tray with single-click show/hide and quick controls.
- **Dual Packaging**:
  - **Installer**: Installs to AppData/Programs, creates Start Menu and Desktop shortcuts, includes uninstaller.
  - **Portable**: Run directly from any folder or USB flash drive without administrator privileges.
- **Persistent Storage**: Stores history and configuration safely in %APPDATA%\universal-shared\data.

---

## 🛠️ Installation & Setup Guide

### 1. Android Installation
1. Download **[universal-shared-v0.1.apk](./universal-shared-v0.1.apk)** onto your Android phone.
2. Open the file to install (allow *Install from Unknown Sources* if prompted by Android).
3. Ensure your phone is connected to the same Wi-Fi network as your host PC.
4. Open the app:
   - Tap **Change Server IP** and enter your PC's IP address (e.g., http://192.168.1.15:3847).
   - Or tap **Join with code** and enter the 6-character pairing code displayed on your PC.

### 2. Windows Installation
- **Option A (Portable)**: Download **[universal-shared-v0.1.exe](./universal-shared-v0.1.exe)** and double-click to launch immediately.
- **Option B (Installer)**: Download **[universal-shared-v0.1-setup.exe](./universal-shared-v0.1-setup.exe)**, follow the setup wizard, and launch from the Start Menu.

---

## 🔒 Security & Privacy
- **100% Local**: All data remains exclusively on your local area network (LAN).
- **No Telemetry**: No tracking, analytics, or external cloud servers.
- **Cryptographic Device Tokens**: HMAC-SHA256 authenticated device sessions.

---

## 📋 Changelog (v0.1.0)
- Initial cross-platform release with Capacitor Android integration.
- Electron desktop packaging with embedded backend services.
- Multi-format release packaging (APK, Windows NSIS Installer, Windows Portable).
- Mobile server URL auto-routing and socket.io LAN synchronization.
- System tray background handling on Windows.
