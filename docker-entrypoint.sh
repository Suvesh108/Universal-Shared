#!/bin/sh
# Auto-detect the host machine's LAN IP via Docker gateway
# This allows the container to serve correct QR pairing URLs

if [ -z "$HOST_IP" ]; then
  # Get the default gateway (the Docker host / host machine)
  GATEWAY=$(ip route | awk '/default/ { print $3 }' | head -n1)
  
  if [ -n "$GATEWAY" ]; then
    export HOST_IP="$GATEWAY"
    echo "[entrypoint] Auto-detected HOST_IP from gateway: $HOST_IP"
  else
    echo "[entrypoint] WARNING: Could not detect HOST_IP. Pairing QR may show wrong IP."
    echo "[entrypoint] Set HOST_IP=<your-lan-ip> in your .env file or docker-compose environment."
  fi
else
  echo "[entrypoint] Using provided HOST_IP: $HOST_IP"
fi

exec node src/server.js
