# Walkthrough - Sharing Setup, Port Proxy Resolution, and IP Automation

I have successfully automated and fixed the network sharing and connection issues. The project now dynamically manages Windows Sharing rules (port proxy) and Firewall rules so that both **Local Node Server** and **Docker Container** environments work seamlessly without conflicts or port binding errors.

## The Root Cause of the "Site Cannot Be Reached" Issue

1. **WSL2/Docker Port Proxy**: When using Docker on Windows, a port proxy rule (`0.0.0.0:3847 -> 127.0.0.1:3847`) is required because Docker runs inside the WSL2 virtual machine, which is isolated from the physical local network.
2. **Port Conflict**: Netsh port proxy rules are persistent across computer restarts. When you restart your computer and start the local Node.js server (`npm run dev`), the system process `svchost.exe` binds to port `3847` to proxy traffic.
3. **Random Port Fallback**: Because port `3847` is blocked by the port proxy, Node.js fails to bind to it and falls back to a random port.
4. **Firewall Blocking**: While port `3847` was allowed in the firewall, the random port Node.js chose was blocked by the Windows Firewall, causing the connected device (phone) to get a "Site Cannot Be Reached" error.

## Changes Made

### 1. Automatic Conflict Resolution in `setup.mjs`
Updated [setup.mjs](file:///c:/Users/Suvesh/Desktop/projects/universal%20shared/scripts/setup.mjs):
* **Stale Proxy Detection**: Dynamically parses the output of `netsh interface portproxy show v4tov4` to identify all active proxies listening on port `3847`.
* **Elevated UAC Cleanup**: If proxies are found when running in Local Node mode, it requests Administrator elevation in a single, combined UAC prompt to delete the conflicting port proxies and add the required firewall rules.
* **Expanded Firewall Rule**: Adds inbound firewall rules for both port `3847` (backend server) and port `5173` (Vite dev server) so the phone can connect to either.

### 2. Streamlined Docker IP and Sharing Setup
Updated Docker configuration files:
* **Created [setup-docker.ps1](file:///c:/Users/Suvesh/Desktop/projects/universal%20shared/scripts/setup-docker.ps1)**: A dedicated, clean PowerShell script that handles Docker environment setup. It resolves the host's Wi-Fi IP, updates `.env`, check if the firewall rule or port proxy rule is missing, and if so, self-elevates to add them before starting the container.
* **Updated [update-ip.bat](file:///c:/Users/Suvesh/Desktop/projects/universal%20shared/update-ip.bat)**: Now simply bootstraps `setup-docker.ps1` with appropriate bypass settings.
* **Updated [setup-sharing.bat](file:///c:/Users/Suvesh/Desktop/projects/universal%20shared/setup-sharing.bat)**: Converted into an interactive menu that lets you choose whether you want to configure sharing for **Local Node Server** (removes port proxy) or **Docker Container** (adds port proxy).

---

## Verification and Testing

### Running the App Locally (`npm run dev`)
When you run `npm run dev`, `setup.mjs` will execute:
1. It automatically updates `.env` with your active Wi-Fi IP (e.g. `192.168.0.124`).
2. It detects if there are any active port proxy rules for port `3847`.
3. If rules exist, it pops up a UAC prompt asking for Administrator permission.
4. Upon approval, the rules are deleted, freeing up port `3847`.
5. The Node.js server starts successfully on port `3847`, and the Vite dev server starts on port `5173`.
6. Since both ports are now allowed through the Windows Firewall, your phone can seamlessly connect to either.

### Running the App via Docker (`update-ip.bat`)
When you run `update-ip.bat`:
1. It detects your active Wi-Fi IP and updates `.env`.
2. It checks if the port proxy rule (`0.0.0.0:3847 -> 127.0.0.1:3847`) is active.
3. If missing, it requests elevation to add it (UAC prompt).
4. It starts the Docker containers. Your phone can now connect to `http://<wifi-ip>:3847` and access the container inside WSL2.
