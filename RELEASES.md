# 📦 Universal Shared — Releases

## 🚀 Release v0.1.3 (Latest)

| File Name | Platform | Format | Size | Description |
| :--- | :--- | :--- | :--- | :--- |
| **[`releases/universal-shared-v0.1.3.apk`](./releases/universal-shared-v0.1.3.apk)** | Android (8.0+) | APK | **3.96 MB** | Cross-device pairing fix, Wi-Fi/Hotspot/Bluetooth selector, and Host Approval Confirmation |
| **[`releases/universal-shared-v0.1.3-setup.exe`](./releases/universal-shared-v0.1.3-setup.exe)** | Windows (10/11) | NSIS Installer | **119.06 MB** | Full Windows setup installer with in-app auto-updater and connection approval dialog |
| **[`releases/universal-shared-v0.1.3.exe`](./releases/universal-shared-v0.1.3.exe)** | Windows (10/11) | Portable EXE | **118.83 MB** | Single-file portable executable (no install required) |

### ✨ What's New in v0.1.3:
1. **Cross-Device Pairing Bug Fix**:
   - Resolved the issue where pairing QR codes embedded loopback `127.0.0.1`.
   - Pairing QR codes now accurately embed the host computer's physical LAN Wi-Fi IP address (`192.168.x.x`), allowing instant phone-to-PC connections.
2. **Multi-Transport Connection Selector**:
   - **📡 Wi-Fi Network**: Direct sharing over your home/office Wi-Fi router.
   - **📲 Mobile & PC Hotspot Mode**: 1-tap presets for mobile hotspot (`192.168.43.1`) and Windows mobile hotspot (`192.168.137.1`).
   - **🔷 Bluetooth Mode**: Low-energy local sync and Bluetooth PAN tethering guide.
   - Live IP Interface dropdown to seamlessly switch network adapters.
3. **Host Connection Approval Confirmation Modal**:
   - When a new device attempts to pair (via QR scan or PIN), the host device displays a real-time security approval prompt:
     *"📱 Android Phone wants to connect. [Decline] [Approve & Connect]"*
   - Gives you 100% control over which devices are permitted to join.

---

## 📦 Release v0.1.2
- Camera QR Scanner on Mobile (APK), AES-256-GCM E2EE, Drop-to-Device Sharing.

## 📦 Release v0.1.1
- In-App Auto-Updater subsystem for Windows and Android.
- High-resolution adaptive launcher icons for Android.

## 📦 Release v0.1.0
- Initial cross-platform release with Capacitor Android and Electron desktop support.