# LAN Setup Guide

This system is designed to run entirely on a Local Area Network with no internet access required. One machine acts as the server; every other device (laptops, phones, tablets) on the same Wi-Fi/router connects to it over the network.

## 1. Find the server machine's local IP address

**Windows:**
```
ipconfig
```
Look for "IPv4 Address" under your active adapter (usually starts with `192.168.` or `10.`).

**Mac/Linux:**
```
ifconfig
# or
ip addr show
```

Example result: `192.168.1.10`

## 2. Configure the backend

In `backend/.env`:
```
SERVER_LOCAL_IP=192.168.1.10
PORT=5000
CORS_ORIGINS=http://localhost:5173,http://192.168.1.10:5173
```

Start it:
```bash
cd backend
npm run dev
```

The server binds to `0.0.0.0`, so it listens on **all** network interfaces — both `localhost` and the LAN IP will work.

## 3. Configure the frontend

In `frontend/.env`:
```
VITE_API_BASE_URL=http://192.168.1.10:5000/api
```

Start it:
```bash
cd frontend
npm run dev
```

Vite's dev server is also configured (in `vite.config.js`) to bind to `0.0.0.0:5173`, so it's reachable from other devices too.

## 4. Access from other devices

On any other laptop or phone connected to the **same Wi-Fi network/router**, open a browser and go to:

```
http://192.168.1.10:5173
```

(substitute your actual server IP from step 1)

## 5. Firewall notes

If other devices can't connect, your server machine's firewall may be blocking incoming connections on ports 5000 and 5173.

**Windows:** Windows Defender Firewall → Advanced Settings → Inbound Rules → New Rule → Port → allow TCP 5000 and 5173.

**Mac:** System Settings → Network → Firewall → allow incoming connections for Node.

**Linux (ufw):**
```bash
sudo ufw allow 5000/tcp
sudo ufw allow 5173/tcp
```

## 6. Production-style LAN deployment (optional)

For a national-exhibition setting, you'll likely want to build the frontend once rather than running the Vite dev server:

```bash
cd frontend
npm run build
npm run preview   # serves the built app on 0.0.0.0:5173
```

And run the backend with a process manager so it stays alive:
```bash
cd backend
npm install -g pm2
pm2 start server.js --name agri-backend
```

## 7. No internet, no cloud — confirming isolation

- PostgreSQL runs locally — no external database service.
- No Firebase, no third-party auth provider — JWT is generated and verified locally.
- Maps use OpenStreetMap tiles via Leaflet. Note: the map tile images themselves are normally fetched from `tile.openstreetmap.org`, which **does** require internet access for the tiles to render. If your exhibition venue has zero internet access, consider hosting a local tile server (e.g. via `tileserver-gl` with a downloaded region extract) — flag this to your team if it matters for the demo.
