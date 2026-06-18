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
echo   UNIVERSAL CLIPBOARD - PUBLIC NETWORK CONNECTION SETUP
echo ==========================================================
echo.
echo This script will configure sharing on a PUBLIC network:
echo   [1] Apply Windows Firewall rule for port 3847 (Public/Private/Domain)
echo   [2] Add port forwarding: 192.168.0.130:3847 --^> 127.0.0.1:3847
echo.
echo Note: This script will NOT change your network category. 
echo       Your Wi-Fi will remain PUBLIC for safety in your hostel.
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

:: Step 2: Add port proxy (Wi-Fi IP -> Docker localhost)
echo.
echo [2] Configuring port forwarding (192.168.0.130:3847 -^> 127.0.0.1:3847)...
netsh interface portproxy delete v4tov4 listenport=3847 listenaddress=192.168.0.130 >nul 2>&1
netsh interface portproxy add v4tov4 listenport=3847 listenaddress=192.168.0.130 connectport=3847 connectaddress=127.0.0.1
if %errorlevel% equ 0 (
    echo     SUCCESS! Port forwarding active.
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
echo   Open http://192.168.0.130:3847 on your phone
echo   while connected to the hostel Wi-Fi network.
echo ==========================================================
echo.
pause
