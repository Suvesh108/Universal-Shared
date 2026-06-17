#!/bin/sh

if [ -z "$HOST_IP" ]; then
  echo "[entrypoint] WARNING: HOST_IP environment variable is not set."
  echo "[entrypoint] If you want to connect external devices (like your phone) via QR code,"
  echo "[entrypoint] you should set HOST_IP to your laptop's Wi-Fi IP address (e.g., 192.168.0.130)."
  echo "[entrypoint] You can do this by creating a '.env' file next to docker-compose.yml:"
  echo "---"
  echo "HOST_IP=192.168.0.130"
  echo "---"
  echo "[entrypoint] Alternatively, you can enter your laptop's IP directly in the pairing screen of the web UI."
else
  echo "[entrypoint] Using provided HOST_IP: $HOST_IP"
fi

exec node src/server.js
