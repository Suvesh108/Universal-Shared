# Set working directory to the project root
Set-Location (Split-Path $PSScriptRoot -Parent)

# Get active Wi-Fi or local IP
Write-Host "Detecting active Wi-Fi IP address..." -ForegroundColor Yellow
$wifiIp = (Get-NetIPAddress -InterfaceAlias 'WiFi' -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress
if (-not $wifiIp) {
    $wifiIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
        $_.IPAddress -notlike '127.*' -and 
        $_.IPAddress -notlike '169.254.*' -and 
        $_.IPAddress -notlike '172.*' 
    } | Select-Object -First 1).IPAddress
}

if (-not $wifiIp) {
    Write-Host "ERROR: Could not detect active Wi-Fi or LAN IP address!" -ForegroundColor Red
    exit 1
}

Write-Host "SUCCESS: Detected IP: $wifiIp" -ForegroundColor Green

# Update .env file
"HOST_IP=$wifiIp" | Out-File -FilePath .env -Encoding ascii

# Check if admin privileges are active
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

# Check if we need to update firewall or port proxy
$fwExists = Get-NetFirewallRule -DisplayName "Universal Clipboard" -ErrorAction SilentlyContinue
$proxyActive = (netsh interface portproxy show v4tov4) -match "3847"

if (-not $fwExists -or -not $proxyActive) {
    if (-not $isAdmin) {
        Write-Host "Firewall or Port Proxy configuration is missing/inactive." -ForegroundColor Yellow
        Write-Host "Requesting Administrator privileges to configure them for Docker..." -ForegroundColor Yellow
        # Self-elevate and run this script as admin, waiting for it to complete
        Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs -Wait
        # Exit the current process as the elevated process will take over and launch docker
        exit
    }
    
    # If we are admin (in the elevated process)
    if ($isAdmin) {
        Write-Host "Configuring Windows Firewall rule..." -ForegroundColor Yellow
        Remove-NetFirewallRule -DisplayName "Universal Clipboard" -ErrorAction SilentlyContinue
        New-NetFirewallRule -DisplayName "Universal Clipboard" -Direction Inbound -Protocol TCP -LocalPort 3847,5173 -Action Allow -Profile Any -ErrorAction SilentlyContinue
        
        Write-Host "Configuring Port Proxy for Docker (0.0.0.0:3847 -> 127.0.0.1:3847)..." -ForegroundColor Yellow
        netsh interface portproxy delete v4tov4 listenport=3847 | Out-Null
        netsh interface portproxy add v4tov4 listenport=3847 listenaddress=0.0.0.0 connectport=3847 connectaddress=127.0.0.1
        Write-Host "Sharing setup complete!" -ForegroundColor Green
    }
}

# Run docker-compose up -d
Write-Host "Starting Docker containers..." -ForegroundColor Yellow
docker-compose up -d
