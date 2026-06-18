# Self-elevate the script to Administrator if not already running as Admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Requesting Administrator privileges to inspect network and firewall settings..." -ForegroundColor Yellow
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Clear-Host
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   UNIVERSAL CLIPBOARD NETWORK DIAGNOSTIC TOOL" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check OS and active Network Adapters
Write-Host "[1] Checking active Network Adapters and IP Addresses..." -ForegroundColor Yellow
$adapters = Get-NetIPAddress -ErrorAction SilentlyContinue | Where-Object { 
    ($_.AddressFamily -eq 'IPv4' -or $_.InterfaceAddressFamily -eq 'IPv4') -and 
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" 
}
$wifiIp = ""

foreach ($ip in $adapters) {
    $adapterName = (Get-NetAdapter -InterfaceIndex $ip.InterfaceIndex -ErrorAction SilentlyContinue).Name
    if (-not $adapterName) {
        $adapterName = (Get-NetIPInterface -InterfaceIndex $ip.InterfaceIndex).InterfaceAlias
    }
    
    # Identify virtual adapters
    $isVirtual = $adapterName -like "*vEthernet*" -or $adapterName -like "*WSL*" -or $adapterName -like "*VirtualBox*" -or $adapterName -like "*VMware*" -or $adapterName -like "*Loopback*"
    
    if ($isVirtual) {
        Write-Host "  [-] $adapterName : $($ip.IPAddress) (Virtual adapter - DO NOT USE)" -ForegroundColor Gray
    } elseif ($adapterName -like "*Wi-Fi*" -or $adapterName -like "*Wireless*") {
        Write-Host "  [+] $adapterName : $($ip.IPAddress) (Wi-Fi adapter - USE THIS ONE! 🌟)" -ForegroundColor Green
        $wifiIp = $ip.IPAddress
    } else {
        Write-Host "  [?] $adapterName : $($ip.IPAddress) (Ethernet/Other - Use if laptop is wired)" -ForegroundColor Yellow
    }
}

if (-not $wifiIp) {
    Write-Host "  [!] WARNING: Could not identify a physical Wi-Fi IP address. Please check if your laptop Wi-Fi is enabled." -ForegroundColor Red
} else {
    Write-Host "  --> Recommended IP to use: $wifiIp" -ForegroundColor Green
}
Write-Host ""

# 2. Check if server is running and listening on port 3847
Write-Host "[2] Checking port 3847 status..." -ForegroundColor Yellow
$portActive = Get-NetTCPConnection -LocalPort 3847 -ErrorAction SilentlyContinue
if ($portActive) {
    $processId = $portActive[0].OwningProcess
    $processName = (Get-Process -Id $processId -ErrorAction SilentlyContinue).Name
    Write-Host "  [+] Yes, a process ($processName, PID: $processId) is actively listening on port 3847." -ForegroundColor Green
} else {
    Write-Host "  [-] No process is listening on port 3847 on this machine." -ForegroundColor Red
    Write-Host "      Please make sure your Docker container is running (run 'docker-compose up -d')." -ForegroundColor Red
}
Write-Host ""

# 3. Check Windows Firewall
Write-Host "[3] Checking Windows Defender Firewall rules..." -ForegroundColor Yellow
$fwRules = Get-NetFirewallRule -DisplayName "Universal Clipboard" -ErrorAction SilentlyContinue
if ($fwRules) {
    $enabled = $fwRules.Enabled
    $action = $fwRules.Action
    $profile = $fwRules.Profile
    if ($enabled -eq "True" -and $action -eq "Allow") {
        Write-Host "  [+] Firewall rule exists, is ENABLED, and ALLOWS inbound connections." -ForegroundColor Green
        Write-Host "      Profile scope: $profile" -ForegroundColor Green
    } else {
        Write-Host "  [-] Firewall rule exists but is DISABLED or set to block." -ForegroundColor Red
    }
} else {
    Write-Host "  [-] No firewall rule found for 'Universal Clipboard'. Incoming traffic might be blocked." -ForegroundColor Red
}
Write-Host ""

# 4. Check connectivity / common issues
Write-Host "[4] Common Wi-Fi Connection Checks:" -ForegroundColor Yellow
Write-Host "  * Phone Wi-Fi: Is your phone connected to the EXACT SAME Wi-Fi network as this laptop?" -ForegroundColor White
Write-Host "  * Phone VPN: Is there a VPN (e.g. NordVPN, ExpressVPN, AdGuard, corporate VPN) active on your PHONE? (Disable it; VPNs block local networking)." -ForegroundColor White
Write-Host "  * Laptop VPN: Is a VPN active on this laptop? (Disable it)." -ForegroundColor White
Write-Host "  * AP Isolation: Does your router have 'AP Isolation' or 'Client Isolation' enabled? (This setting prevents local wireless devices from talking to each other, common on Guest Wi-Fi networks)." -ForegroundColor White
Write-Host ""

Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host "Apply/Fix Windows Firewall rule for Port 3847?" -ForegroundColor Cyan
$response = Read-Host "Enter 'Y' to auto-fix/enable, or press Enter to skip"

if ($response -eq "Y" -or $response -eq "y") {
    Write-Host "Applying firewall rule..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "Universal Clipboard" -ErrorAction SilentlyContinue
    
    # Create rule for all profiles (Private & Public) in case user's Wi-Fi network category is misconfigured as Public
    New-NetFirewallRule -DisplayName "Universal Clipboard" -Direction Inbound -Protocol TCP -LocalPort 3847 -Action Allow -Profile Any
    Write-Host "  [+] Inbound firewall rule for port 3847 successfully created for all profiles (Private, Public, Domain)!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Diagnostics complete. Press any key to exit..."
[void][System.Console]::ReadKey($true)
