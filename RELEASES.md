# 📦 Universal Shared — Releases

## 🚀 Release v0.2.3 (Latest)

| File Name | Platform | Format | Size | Description |
| :--- | :--- | :--- | :--- | :--- |
| **[`releases/universal-shared-v0.2.3.apk`](./releases/universal-shared-v0.2.3.apk)** | Android (8.0+) | APK | **4.15 MB** | Zero-echo sync, lightweight history polling (<5KB), direct-to-device transfers |
| **[`releases/universal-shared-v0.2.3-setup.exe`](./releases/universal-shared-v0.2.3-setup.exe)** | Windows (10/11) | NSIS Installer | **124.84 MB** | Complete Windows desktop installer with expandable history layout and secured pairing |
| **[`releases/universal-shared-v0.2.3.exe`](./releases/universal-shared-v0.2.3.exe)** | Windows (10/11) | Portable EXE | **124.60 MB** | Single-file portable executable for Windows (no install required) |

### ✨ What's New & Fixed in v0.2.3:
1. **⚡ 99% Lighter Polling Payloads & Memory Protection**:
   - Stripped redundant base64 data from file/media history entries. Continuous background sync polls now transfer <5 KB instead of 50–100 MB+, completely preventing browser tab lag and memory exhaustion.
2. **🔄 Zero-Echo Clipboard Synchronization**:
   - Filtered self-originated clipboard events during polling, eliminating duplicate toasts and clipboard self-overwrites.
3. **🌐 Seamless Cloud & Vercel Pairing**:
   - Host header detection automatically routes pairing QR codes to your public domain when deployed online, with strict pairing code validation.
4. **🛡️ Security Hardening**:
   - Protected system settings endpoints with device token authentication and IP sanitization.
5. **🎯 Direct-to-Device File Transfers**:
   - Dragging and dropping files onto a specific device card now directly targets that recipient device.
6. **🎨 UI & Layout Polish**:
   - Corrected chat bubble layout (own items on right with accent styling, incoming on left), cleaned up mobile history dialog, and enabled the desktop "Expand History" grid mode.

---

## 📦 Release v0.2.2

| File Name | Platform | Format | Size | Description |
| :--- | :--- | :--- | :--- | :--- |
| **[`releases/universal-shared-v0.2.2.apk`](./releases/universal-shared-v0.2.2.apk)** | Android (8.0+) | APK | **3.96 MB** | Expandable stacked accordion Settings, unread notification red dot, and real-time auto sync |
| **[`releases/universal-shared-v0.2.2-setup.exe`](./releases/universal-shared-v0.2.2-setup.exe)** | Windows (10/11) | NSIS Installer | **119.06 MB** | Windows desktop setup installer with 45%/50% split layout and stacked accordion Settings |
| **[`releases/universal-shared-v0.2.2.exe`](./releases/universal-shared-v0.2.2.exe)** | Windows (10/11) | Portable EXE | **118.83 MB** | Single-file portable executable for Windows (no install required) |
| **[`releases/universal-shared-v0.2.2-linux.tar.gz`](./releases/universal-shared-v0.2.2-linux.tar.gz)** | Linux (x64) | tar.gz Archive | **129.63 MB** | Standalone portable Linux distribution (Ubuntu, Debian, Fedora, Arch, etc.) |
| **[`releases/universal-shared-v0.2.2-linux.zip`](./releases/universal-shared-v0.2.2-linux.zip)** | Linux (x64) | ZIP Archive | **129.95 MB** | Portable zip archive for Linux desktop environments |

### ✨ What's New & Fixed in v0.2.2:
1. **Vertical Stacked Accordion in Settings**:
   - All settings sections are stacked vertically in clean, modern card panels:
     - 👤 **Device Profile** (Name, platform type, and quick profile save)
     - 🌐 **Connected Devices on Network** (Real-time cluster peers and live status)
     - 🎨 **Theme & Appearance** (Interactive Dark Mode 🌙 / Light Mode ☀️ selectors)
     - 📡 **Network & Connection** (Server endpoint and Wi-Fi host IP override)
     - ℹ️ **About Universal Shared** (App version and 1-click update check)
   - Clicking on any section header smoothly expands/drops down its content with interactive arrow indicators (`▼` / `▲`).
2. **🐧 Linux Support Across the Platform**:
   - Streamlined platform picker: **Windows PC (💻)**, **Android Phone (📱)**, and **Linux PC (🐧)**.
   - Removed legacy Mac and iOS options.
   - Linux standalone portable archives (`.tar.gz` and `.zip`).
3. **⚡ Instant Real-Time Auto Sync & Mobile Unread Red Dot**:
   - Zero-touch real-time sync across all devices without refresh buttons.
   - Android Header unread red dot notification badge.

---

## 📦 Release v0.2.1
- Settings dropdown navigation, native Linux application builds, and Mac/iOS removal.

## 📦 Release v0.2.0
- Rebuilt Settings UI/UX, desktop 45/50 split layout, dedicated Android history modal, real-time sync.