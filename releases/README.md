# 📦 Universal Shared — Releases

## 🚀 Release v0.2.1 (Latest)

| File Name | Platform | Format | Size | Description |
| :--- | :--- | :--- | :--- | :--- |
| **[`releases/universal-shared-v0.2.1.apk`](./releases/universal-shared-v0.2.1.apk)** | Android (8.0+) | APK | **3.96 MB** | Android mobile APK with clean header, unread notification red dot, dropdown Settings, and real-time auto sync |
| **[`releases/universal-shared-v0.2.1-setup.exe`](./releases/universal-shared-v0.2.1-setup.exe)** | Windows (10/11) | NSIS Installer | **119.06 MB** | Windows desktop setup installer with 45%/50% split layout and dropdown Settings |
| **[`releases/universal-shared-v0.2.1.exe`](./releases/universal-shared-v0.2.1.exe)** | Windows (10/11) | Portable EXE | **118.83 MB** | Single-file portable executable for Windows (no install required) |
| **[`releases/universal-shared-v0.2.1-linux.tar.gz`](./releases/universal-shared-v0.2.1-linux.tar.gz)** | Linux (x64) | tar.gz Archive | **129.63 MB** | Native standalone portable Linux package (Ubuntu, Debian, Fedora, Arch, etc.) |
| **[`releases/universal-shared-v0.2.1-linux.zip`](./releases/universal-shared-v0.2.1-linux.zip)** | Linux (x64) | ZIP Archive | **129.95 MB** | Portable zip archive for Linux desktop environments |

### ✨ What's New & Fixed in v0.2.1:
1. **Dropdown Menu for Settings (Zero Horizontal Scroll)**:
   - Replaced horizontal pill scrolling in Settings with a clean top **Dropdown Selector** (`Section: 👤 Device Profile ▾`).
   - Quick, seamless section switching across Android, Windows, and Linux screens without scroll overflow.
2. **Device Profile Platform Selector**:
   - Kept **💻 Windows PC**, **📱 Android Phone**, and added **🐧 Linux PC / Server**.
   - Removed Apple Mac and iPhone / iPad options.
   - History items and device cluster cards now feature native Linux badges (`🐧 Linux`).
3. **🐧 Native Linux Application Support**:
   - Added official Linux build pipeline generating standalone portable `universal-shared-v0.2.1-linux.tar.gz` and `.zip` binaries.
4. **Instant Real-Time Auto Sync**:
   - Zero-touch real-time sync across all devices with WebSocket dispatching and continuous 1500ms fallback.
   - Cleaned UI: Removed manual refresh buttons.
   - Android Header unread red dot notification badge.

---

## 📦 Release v0.2.0
- Rebuilt Settings UI/UX, desktop 45/50 split layout, dedicated Android history modal, real-time sync.

## 📦 Release v0.1.7
- Unified Settings Modal, Merged Timeline History.