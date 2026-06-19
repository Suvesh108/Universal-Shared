@echo off
:: Self-elevate to Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cls
echo.
echo ==========================================================
echo   UNIVERSAL CLIPBOARD - NETWORK SHARING CONFIGURATOR
echo ==========================================================
echo.
echo Please choose your hosting mode to configure sharing:
echo.
echo   [1] Local Node Server (npm run dev / npm start)
echo       - Adds firewall rules for port 3847 and 5173
echo       - Deletes netsh port proxies so Node can bind directly
echo.
echo   [2] Docker Container (docker-compose)
echo       - Adds firewall rules for port 3847 and 5173
echo       - Adds netsh port proxy forwarding (0.0.0.0:3847 --^> 127.0.0.1:3847)
echo.
set /p choice="Enter choice [1 or 2]: "

if "%choice%"=="1" (
    echo.
    echo Configuring sharing for Local Node Server...
    
    :: Firewall rule
    netsh advfirewall firewall delete rule name="Universal Clipboard" >nul 2>&1
    netsh advfirewall firewall add rule name="Universal Clipboard" dir=in action=allow protocol=TCP localport=3847,5173 profile=any
    
    :: Remove port proxy
    netsh interface portproxy delete v4tov4 listenport=3847 >nul 2>&1
    netsh interface portproxy delete v4tov4 listenport=3847 listenaddress=0.0.0.0 >nul 2>&1
    
    echo SUCCESS! Local sharing configured.
    echo Port 3847 is free for Node, and Firewall allows ports 3847 and 5173.
) else if "%choice%"=="2" (
    echo.
    echo Configuring sharing for Docker Container...
    
    :: Firewall rule
    netsh advfirewall firewall delete rule name="Universal Clipboard" >nul 2>&1
    netsh advfirewall firewall add rule name="Universal Clipboard" dir=in action=allow protocol=TCP localport=3847,5173 profile=any
    
    :: Add port proxy
    netsh interface portproxy delete v4tov4 listenport=3847 >nul 2>&1
    netsh interface portproxy add v4tov4 listenport=3847 listenaddress=0.0.0.0 connectport=3847 connectaddress=127.0.0.1
    
    echo SUCCESS! Docker sharing configured.
    echo Port 3847 traffic will forward to 127.0.0.1:3847, and Firewall allows ports 3847 and 5173.
) else (
    echo Invalid choice. Exiting.
)

echo.
pause
