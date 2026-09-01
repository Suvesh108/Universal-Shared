# 📦 Universal Shared — Releases

## 🚀 Release v0.1.4 (Latest)

| File Name | Platform | Format | Size | Description |
| :--- | :--- | :--- | :--- | :--- |
| **[`releases/universal-shared-v0.1.4.apk`](./releases/universal-shared-v0.1.4.apk)** | Android (8.0+) | APK | **3.96 MB** | Shared Cluster Key E2EE fix, cross-device plaintext sync, multi-transport selector, and Host Approval |
| **[`releases/universal-shared-v0.1.4-setup.exe`](./releases/universal-shared-v0.1.4-setup.exe)** | Windows (10/11) | NSIS Installer | **119.06 MB** | Full Windows setup installer with transparent E2EE decryption and auto-updater |
| **[`releases/universal-shared-v0.1.4.exe`](./releases/universal-shared-v0.1.4.exe)** | Windows (10/11) | Portable EXE | **118.83 MB** | Single-file portable executable (no install required) |

### ✨ What's New & Fixed in v0.1.4:
1. **AES-256-GCM Shared Cluster Key Decryption Fix**:
   - **Root Cause**: Previously, each device was encrypting payloads using its own device token (`tok_...`). Because each device has a distinct token, the receiving device could not derive the same key, causing payloads to display raw ciphertext (`e2ee:...`).
   - **Fix**: All paired devices now derive keys using a synchronized **Shared Cluster Vault Key** with multi-candidate key fallback. Payloads (text, links, clipboard) now decrypt immediately and transparently to original plaintext across all devices.

---

## 📦 Release v0.1.3
- Cross-device pairing fix, Wi-Fi/Hotspot/Bluetooth selector, and Host Approval Confirmation.

## 📦 Release v0.1.2
- Camera QR Scanner on Mobile (APK), AES-256-GCM E2EE, Drop-to-Device Sharing.

## 📦 Release v0.1.1
- In-App Auto-Updater subsystem for Windows and Android.
- High-resolution adaptive launcher icons for Android.

## 📦 Release v0.1.0
- Initial cross-platform release with Capacitor Android and Electron desktop support.