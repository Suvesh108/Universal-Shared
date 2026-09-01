# 📦 Universal Shared — Releases

## 🚀 Release v0.2.0 (Latest)

| File Name | Platform | Format | Size | Description |
| :--- | :--- | :--- | :--- | :--- |
| **[`releases/universal-shared-v0.2.0.apk`](./releases/universal-shared-v0.2.0.apk)** | Android (8.0+) | APK | **3.96 MB** | Dedicated Header History Modal for Android, Rebuilt Settings UI/UX, and E2EE sync |
| **[`releases/universal-shared-v0.2.0-setup.exe`](./releases/universal-shared-v0.2.0-setup.exe)** | Windows (10/11) | NSIS Installer | **119.06 MB** | Windows desktop 45%/50% split layout (fixed composer left, scrollable chat box right) |
| **[`releases/universal-shared-v0.2.0.exe`](./releases/universal-shared-v0.2.0.exe)** | Windows (10/11) | Portable EXE | **118.83 MB** | Single-file portable executable (no install required) |

### ✨ What's New & Fixed in v0.2.0:
1. **Rebuilt Settings UI/UX from Scratch**:
   - Redesigned Preferences dialog with modern pill navigation bar and clean cards:
     - **👤 Device Profile**: Avatar badge, display name, device platform selector (Windows/Android/Mac/iOS/Other), and quick save.
     - **🌐 Network Devices**: Paired cluster devices with live connection pulse indicators (🟢 Online, 🟡 Idle, ⚪ Offline) and unpair controls.
     - **🎨 Theme Mode**: Interactive visual cards for 🌙 Dark Mode and ☀️ Light Mode.
     - **📡 Connection**: Target server address, Wi-Fi host IP override.
     - **ℹ️ About & Updates**: Version info and 1-click update check.
2. **Desktop (Windows) 45% / 50% Split Layout**:
   - **Left Column (45% Fixed)**: "Send to Clipboard" composer stays pinned and non-scrollable for fast access.
   - **Right Column (50% Scrollable)**: "Clipboard History" container box with smooth chat-style scrollable timeline feed.
3. **Android Dedicated Clipboard History Window**:
   - Main screen is streamlined and focused on composing/sharing.
   - Header features a dedicated **Clipboard History icon button (📋)** with real-time item counter badge.
   - Tapping it opens a dedicated, full-featured Clipboard History modal window on Android.

---

## 📦 Release v0.1.7
- Unified Settings Modal (Profile, Network Devices & Theme), Merged Timeline History.

## 📦 Release v0.1.6
- In-app Android update routing fix, local native installer targeting, JSON parse safety.

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