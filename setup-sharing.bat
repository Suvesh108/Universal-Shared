@echo off
:: Self-elevate to Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
}

cls
echo.
echo ==========================================================
echo   UNIVERSAL CLIPBOARD - PERMANENT PUBLIC NETWORK SETUP
echo ==========================================================
echo.
echo This script will permanently configure sharing on Public/Hostel Wi-Fi:
echo   [1] Apply Windows Firewall rule for port 3847 (Any network)
echo   [2] Add PERMANENT port forwarding (0.0.0.0:3847 --^> 127.0.0.1:3847)
echo.
echo Note: By listening on 0.0.0.0, Windows will forward traffic from ANY
echo       IP your laptop gets. You won't need to run this admin tool again
echo       when your Wi-Fi IP changes!
echo.

:: Step 1: Apply firewall rule for all profiles (Any)
echo [1] Configuring Windows Firewall rule for port 3847...
netsh advfirewall firewall delete rule name="Universal Clipboard" >nul 2>&1
netsh advfirewall firewall add rule name="Universal Clipboard" dir=in action=allow protocol=TCP localport=3847 profile=any
if %errorlevel% equ 0 (
    echo     SUCCESS! Firewall now allows port 3847 on Public/Private/Domain profiles.
) else (
    echo     ERROR applying firewall rule.
)

:: Step 2: Add port proxy listening on all interfaces (0.0.0.0)
echo.
echo [2] Configuring permanent port forwarding (0.0.0.0:3847 -^> 127.0.0.1:3847)...
:: Delete any specific IP proxies first to prevent conflicts
netsh interface portproxy delete v4tov4 listenport=3847 >nul 2>&1
netsh interface portproxy add v4tov4 listenport=3847 listenaddress=0.0.0.0 connectport=3847 connectaddress=127.0.0.1
if %errorlevel% equ 0 (
    echo     SUCCESS! Permanent port forwarding active.
) else (
    echo     ERROR applying port forwarding.
)

:: Verify everything
echo.
echo [3] Verifying port forwarding rules...
netsh interface portproxy show v4tov4

echo.
echo ==========================================================
echo   ALL DONE!
echo   You have permanently enabled connection forwarding.
echo ==========================================================
echo.
pause
