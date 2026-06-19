@echo off
echo Automatically updating Wi-Fi IP configuration for Docker...
powershell -Command "$wifiIp = (Get-NetIPAddress -InterfaceAlias 'WiFi' -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress; if (-not $wifiIp) { $wifiIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.IPAddress -notlike '172.*' } | Select-Object -First 1).IPAddress }; if ($wifiIp) { 'HOST_IP=' + $wifiIp | Out-File -FilePath .env -Encoding ascii; Write-Host 'SUCCESS: HOST_IP updated to' $wifiIp -ForegroundColor Green; docker-compose up -d } else { Write-Host 'ERROR: Could not detect active Wi-Fi IP address!' -ForegroundColor Red }"
pause
