# 📦 Universal Shared — Releases

## 🚀 Release v0.1.6 (Latest)

| File Name | Platform | Format | Size | Description |
| :--- | :--- | :--- | :--- | :--- |
| **[`releases/universal-shared-v0.1.6.apk`](./releases/universal-shared-v0.1.6.apk)** | Android (8.0+) | APK | **3.96 MB** | In-app Android update routing fix, local native installer targeting, JSON parse safety, and E2EE |
| **[`releases/universal-shared-v0.1.6-setup.exe`](./releases/universal-shared-v0.1.6-setup.exe)** | Windows (10/11) | NSIS Installer | **119.06 MB** | Full Windows setup installer with dedicated Windows & Android clipboard tabs and in-app updater |
| **[`releases/universal-shared-v0.1.6.exe`](./releases/universal-shared-v0.1.6.exe)** | Windows (10/11) | Portable EXE | **118.83 MB** | Single-file portable executable (no install required) |

### ✨ What's New & Fixed in v0.1.6:
1. **Android APK In-App Update JSON Parsing Fix**:
   - **Root Cause**: When an Android device was paired with a PC (`http://192.168.x.x:3847`), update download requests were sent to the remote PC's server rather than the phone's local Android installer. The PC returned `index.html` (`<!DOCTYPE html>`), throwing a JSON syntax error.
   - **Fix**: Android update operations (`/api/system/download-update`, `/api/system/update-progress`, `/api/system/install-update`) now strictly route to the local Android embedded Java daemon (`http://127.0.0.1:3847`) via `nativeApiUrl()`, with full JSON validation and resilient error handling.

---

## 📦 Release v0.1.5
- Separate Windows and Android clipboard history tabs with item counters, dedicated network profile icons.

## 📦 Release v0.1.4
- Shared Cluster Key E2EE Decryption Fix, transparent cross-device plaintext sync.

## 📦 Release v0.1.3
- Cross-device pairing fix, Wi-Fi/Hotspot/Bluetooth selector, and Host Approval Confirmation.

## 📦 Release v0.1.2
- Camera QR Scanner on Mobile (APK), AES-256-GCM E2EE, Drop-to-Device Sharing.

## 📦 Release v0.1.1
- In-App Auto-Updater subsystem for Windows and Android.
- High-resolution adaptive launcher icons for Android.

## 📦 Release v0.1.0
- Initial cross-platform release with Capacitor Android and Electron desktop support.