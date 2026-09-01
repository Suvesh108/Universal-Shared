# 📦 Universal Shared — Releases

## 🚀 Release v0.1.1 (Latest)

| File Name | Platform | Format | Size | Description |
| :--- | :--- | :--- | :--- | :--- |
| **[eleases/universal-shared-v0.1.1.apk](./releases/universal-shared-v0.1.1.apk)** | Android (8.0+) | APK | **3.97 MB** | Native standalone APK with embedded backend & in-app auto-update |
| **[eleases/universal-shared-v0.1.1-setup.exe](./releases/universal-shared-v0.1.1-setup.exe)** | Windows (10/11) | NSIS Installer | **119.00 MB** | Full Windows setup installer with auto-update restart support |
| **[eleases/universal-shared-v0.1.1.exe](./releases/universal-shared-v0.1.1.exe)** | Windows (10/11) | Portable EXE | **118.77 MB** | Single-file portable executable (no install required) |

### ✨ What's New in v0.1.1:
1. **In-App Auto-Update Feature**:
   - **Internal Downloads**: The application directly queries the GitHub Releases API, downloads new versions internally in the background with live progress tracking, and does not require external browser downloads.
   - **Windows (.exe)**: One-click "Restart & Apply" to apply updates seamlessly.
   - **Android (.apk)**: Automatically triggers the native Android package installer (FileProvider) to update the app in-place.
   - **On-Demand Check**: Added a "Check for Updates" button in Profile settings.
2. **Android Launcher Icon & Logo Fix**:
   - Generated high-resolution adaptive app icons across all densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi).
   - Integrated crisp vector SVG logos in the in-app headers.
3. **Electron Main Process Fix**:
   - Resolved syntax error in Electron string template literals and enhanced packaged resource paths.

---

## 📦 Release v0.1.0

- Initial cross-platform release with Capacitor Android integration.
- Electron desktop packaging with embedded backend services.
- Multi-format release packaging (APK, Windows NSIS Installer, Windows Portable).
