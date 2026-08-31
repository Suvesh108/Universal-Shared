package com.universalshared.app;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.text.format.Formatter;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;

public class LocalHttpServer {
    private static final String TAG = "LocalHttpServer";
    public static final int DEFAULT_PORT = 3847;

    private final Context context;
    private ServerSocket serverSocket;
    private ExecutorService threadPool;
    private volatile boolean isRunning = false;
    private int actualPort = DEFAULT_PORT;

    private final List<JSONObject> clipboardHistory = new CopyOnWriteArrayList<>();
    private final Map<String, JSONObject> devices = new ConcurrentHashMap<>();
    private final Map<String, String> pairingCodes = new ConcurrentHashMap<>();
    private final File dataDir;
    private final File uploadsDir;

    public LocalHttpServer(Context context) {
        this.context = context.getApplicationContext();
        this.dataDir = new File(context.getFilesDir(), "server_data");
        this.uploadsDir = new File(this.dataDir, "uploads");
        this.dataDir.mkdirs();
        this.uploadsDir.mkdirs();
        loadPersistedData();
    }

    public synchronized void start() {
        if (isRunning) return;
        isRunning = true;
        threadPool = Executors.newCachedThreadPool();

        new Thread(() -> {
            try {
                try {
                    serverSocket = new ServerSocket(DEFAULT_PORT);
                    actualPort = DEFAULT_PORT;
                } catch (IOException e) {
                    serverSocket = new ServerSocket(0);
                    actualPort = serverSocket.getLocalPort();
                }

                Log.i(TAG, "Local Android Server started on port " + actualPort);

                while (isRunning && !serverSocket.isClosed()) {
                    try {
                        Socket clientSocket = serverSocket.accept();
                        threadPool.execute(() -> handleClient(clientSocket));
                    } catch (IOException e) {
                        if (!isRunning) break;
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Error starting server: " + e.getMessage(), e);
            }
        }).start();
    }

    public synchronized void stop() {
        isRunning = false;
        if (serverSocket != null) {
            try {
                serverSocket.close();
            } catch (IOException ignored) {}
        }
        if (threadPool != null) {
            threadPool.shutdownNow();
        }
    }

    public int getPort() {
        return actualPort;
    }

    public String getPrimaryUrl() {
        String ip = getIpAddress();
        return "http://" + ip + ":" + actualPort;
    }

    public String getIpAddress() {
        try {
            WifiManager wm = (WifiManager) context.getSystemService(Context.WIFI_SERVICE);
            if (wm != null && wm.getConnectionInfo() != null) {
                int ipInt = wm.getConnectionInfo().getIpAddress();
                if (ipInt != 0) {
                    return Formatter.formatIpAddress(ipInt);
                }
            }
        } catch (Exception ignored) {}

        try {
            for (Enumeration<NetworkInterface> en = NetworkInterface.getNetworkInterfaces(); en.hasMoreElements(); ) {
                NetworkInterface intf = en.nextElement();
                for (Enumeration<InetAddress> enumIpAddr = intf.getInetAddresses(); enumIpAddr.hasMoreElements(); ) {
                    InetAddress inetAddress = enumIpAddr.nextElement();
                    if (!inetAddress.isLoopbackAddress() && inetAddress instanceof Inet4Address) {
                        return inetAddress.getHostAddress();
                    }
                }
            }
        } catch (Exception ignored) {}

        return "127.0.0.1";
    }

    private void handleClient(Socket socket) {
        try (InputStream in = socket.getInputStream();
             OutputStream out = socket.getOutputStream()) {

            BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
            String requestLine = reader.readLine();
            if (requestLine == null || requestLine.isEmpty()) return;

            String[] parts = requestLine.split(" ");
            if (parts.length < 2) return;

            String method = parts[0].toUpperCase();
            String fullUri = parts[1];

            Map<String, String> headers = new HashMap<>();
            String line;
            int contentLength = 0;
            String contentType = "";
            while ((line = reader.readLine()) != null && !line.isEmpty()) {
                int colon = line.indexOf(':');
                if (colon > 0) {
                    String k = line.substring(0, colon).trim().toLowerCase();
                    String v = line.substring(colon + 1).trim();
                    headers.put(k, v);
                    if ("content-length".equals(k)) {
                        try { contentLength = Integer.parseInt(v); } catch (Exception ignored) {}
                    }
                    if ("content-type".equals(k)) {
                        contentType = v;
                    }
                }
            }

            if ("OPTIONS".equals(method)) {
                sendResponse(out, 204, "No Content", "text/plain", new byte[0]);
                return;
            }

            String path = fullUri.contains("?") ? fullUri.substring(0, fullUri.indexOf("?")) : fullUri;

            if (path.startsWith("/api/")) {
                handleApiRoute(method, path, fullUri, headers, reader, in, contentLength, contentType, out);
            } else {
                handleStaticAsset(path, out);
            }

        } catch (Exception e) {
            Log.w(TAG, "Request handle error: " + e.getMessage());
        } finally {
            try { socket.close(); } catch (IOException ignored) {}
        }
    }

    private void handleApiRoute(String method, String path, String fullUri, Map<String, String> headers,
                                BufferedReader reader, InputStream in, int contentLength, String contentType,
                                OutputStream out) throws Exception {

        String token = headers.get("x-device-token");

        if ("/api/info".equals(path) && "GET".equals(method)) {
            JSONObject res = new JSONObject();
            res.put("name", "Universal Shared (Android)");
            res.put("version", "0.1.0");
            res.put("port", actualPort);
            res.put("primaryUrl", getPrimaryUrl());
            JSONArray addrs = new JSONArray();
            JSONObject addrObj = new JSONObject();
            addrObj.put("name", "wlan0");
            addrObj.put("address", getIpAddress());
            addrs.put(addrObj);
            res.put("addresses", addrs);
            res.put("onlineDevices", Math.max(1, devices.size()));
            res.put("hostIpOverride", (Object) null);
            sendJsonResponse(out, 200, res);
            return;
        }

        if ("/api/pair/qr".equals(path) && "GET".equals(method)) {
            String code = generatePairCode();
            JSONObject res = new JSONObject();
            res.put("code", code);
            res.put("url", getPrimaryUrl() + "?pair=" + code);
            res.put("expiresInMs", 600000);
            sendJsonResponse(out, 200, res);
            return;
        }

        if ("/api/devices/register".equals(path) && "POST".equals(method)) {
            String body = readBody(reader, contentLength);
            JSONObject req = new JSONObject(body.isEmpty() ? "{}" : body);
            String name = req.optString("name", "Android Device");
            String type = req.optString("type", "android");
            String devId = UUID.randomUUID().toString();
            String devToken = "tok_" + UUID.randomUUID().toString().replace("-", "");

            JSONObject device = new JSONObject();
            device.put("id", devId);
            device.put("name", name);
            device.put("type", type);
            device.put("token", devToken);
            device.put("createdAt", System.currentTimeMillis());

            devices.put(devToken, device);
            persistData();

            JSONObject res = new JSONObject();
            res.put("device", device);
            sendJsonResponse(out, 200, res);
            return;
        }

        if ("/api/pair/verify".equals(path) && "POST".equals(method)) {
            String body = readBody(reader, contentLength);
            JSONObject req = new JSONObject(body.isEmpty() ? "{}" : body);
            String name = req.optString("name", "Paired Device");
            String type = req.optString("type", "unknown");

            String devId = UUID.randomUUID().toString();
            String devToken = "tok_" + UUID.randomUUID().toString().replace("-", "");

            JSONObject device = new JSONObject();
            device.put("id", devId);
            device.put("name", name);
            device.put("type", type);
            device.put("token", devToken);
            device.put("createdAt", System.currentTimeMillis());

            devices.put(devToken, device);
            persistData();

            JSONObject res = new JSONObject();
            res.put("device", device);
            sendJsonResponse(out, 200, res);
            return;
        }

        if ("/api/devices".equals(path) && "GET".equals(method)) {
            JSONArray arr = new JSONArray(devices.values());
            JSONObject res = new JSONObject();
            res.put("devices", arr);
            sendJsonResponse(out, 200, res);
            return;
        }

        if ("/api/devices/me".equals(path) && "POST".equals(method)) {
            String body = readBody(reader, contentLength);
            JSONObject req = new JSONObject(body.isEmpty() ? "{}" : body);
            JSONObject dev = devices.get(token);
            if (dev == null) {
                dev = new JSONObject();
                dev.put("id", UUID.randomUUID().toString());
                dev.put("token", token != null ? token : "tok_local");
            }
            if (req.has("name")) dev.put("name", req.getString("name"));
            if (req.has("type")) dev.put("type", req.getString("type"));
            if (token != null) devices.put(token, dev);
            persistData();

            JSONObject res = new JSONObject();
            res.put("device", dev);
            sendJsonResponse(out, 200, res);
            return;
        }

        if ("/api/history".equals(path) && "GET".equals(method)) {
            JSONArray arr = new JSONArray();
            for (JSONObject item : clipboardHistory) {
                arr.put(item);
            }
            JSONObject res = new JSONObject();
            res.put("items", arr);
            res.put("total", clipboardHistory.size());
            sendJsonResponse(out, 200, res);
            return;
        }

        if ("/api/clipboard".equals(path) && "POST".equals(method)) {
            String body = readBody(reader, contentLength);
            JSONObject req = new JSONObject(body.isEmpty() ? "{}" : body);
            String content = req.optString("content", "");
            String type = req.optString("type", content.startsWith("http://") || content.startsWith("https://") ? "link" : "text");

            JSONObject dev = token != null ? devices.get(token) : null;
            String devName = dev != null ? dev.optString("name", "Android Device") : "Android Device";
            String devId = dev != null ? dev.optString("id", "local") : "local";

            JSONObject item = new JSONObject();
            item.put("id", UUID.randomUUID().toString());
            item.put("deviceId", devId);
            item.put("deviceName", devName);
            item.put("type", type);
            item.put("content", content);
            item.put("size", content.getBytes(StandardCharsets.UTF_8).length);
            item.put("createdAt", System.currentTimeMillis());

            clipboardHistory.add(0, item);
            if (clipboardHistory.size() > 200) clipboardHistory.remove(clipboardHistory.size() - 1);
            persistData();

            JSONObject res = new JSONObject();
            res.put("item", item);
            sendJsonResponse(out, 200, res);
            return;
        }

        if (path.startsWith("/api/files/") && "GET".equals(method)) {
            String fileId = path.substring("/api/files/".length());
            File target = new File(uploadsDir, fileId);
            if (target.exists()) {
                byte[] bytes = readFileBytes(target);
                String mime = guessMimeType(target.getName());
                sendResponse(out, 200, "OK", mime, bytes);
            } else {
                sendJsonResponse(out, 404, new JSONObject().put("error", "File not found"));
            }
            return;
        }

        if (path.startsWith("/api/history/") && "DELETE".equals(method)) {
            String itemId = path.substring("/api/history/".length());
            clipboardHistory.removeIf(it -> itemId.equals(it.optString("id")));
            persistData();
            sendJsonResponse(out, 200, new JSONObject().put("ok", true));
            return;
        }

        if ("/api/history".equals(path) && "DELETE".equals(method)) {
            clipboardHistory.clear();
            persistData();
            sendJsonResponse(out, 200, new JSONObject().put("ok", true));
            return;
        }

        sendJsonResponse(out, 200, new JSONObject().put("ok", true));
    }

    private void handleStaticAsset(String path, OutputStream out) {
        String assetPath = path.equals("/") ? "public/index.html" : "public" + path;
        try (InputStream is = context.getAssets().open(assetPath)) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int r;
            while ((r = is.read(buf)) != -1) baos.write(buf, 0, r);
            byte[] data = baos.toByteArray();
            sendResponse(out, 200, "OK", guessMimeType(assetPath), data);
        } catch (IOException e) {
            try (InputStream is = context.getAssets().open("public/index.html")) {
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                byte[] buf = new byte[8192];
                int r;
                while ((r = is.read(buf)) != -1) baos.write(buf, 0, r);
                byte[] data = baos.toByteArray();
                sendResponse(out, 200, "OK", "text/html; charset=utf-8", data);
            } catch (IOException e2) {
                sendResponse(out, 404, "Not Found", "text/plain", "Not Found".getBytes());
            }
        }
    }

    private String generatePairCode() {
        String code = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        pairingCodes.put(code, String.valueOf(System.currentTimeMillis()));
        return code;
    }

    private String readBody(BufferedReader reader, int length) throws IOException {
        if (length <= 0) return "";
        char[] buf = new char[length];
        int read = 0;
        while (read < length) {
            int r = reader.read(buf, read, length - read);
            if (r == -1) break;
            read += r;
        }
        return new String(buf, 0, read);
    }

    private byte[] readFileBytes(File file) throws IOException {
        try (FileInputStream fis = new FileInputStream(file)) {
            byte[] data = new byte[(int) file.length()];
            fis.read(data);
            return data;
        }
    }

    private String guessMimeType(String name) {
        name = name.toLowerCase();
        if (name.endsWith(".html")) return "text/html; charset=utf-8";
        if (name.endsWith(".js")) return "application/javascript";
        if (name.endsWith(".css")) return "text/css";
        if (name.endsWith(".svg")) return "image/svg+xml";
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
        if (name.endsWith(".json")) return "application/json";
        if (name.endsWith(".pdf")) return "application/pdf";
        if (name.endsWith(".mp4")) return "video/mp4";
        return "application/octet-stream";
    }

    private void sendJsonResponse(OutputStream out, int status, JSONObject json) {
        byte[] bytes = json.toString().getBytes(StandardCharsets.UTF_8);
        sendResponse(out, status, "OK", "application/json; charset=utf-8", bytes);
    }

    private void sendResponse(OutputStream out, int status, String msg, String mime, byte[] data) {
        try {
            String headers = "HTTP/1.1 " + status + " " + msg + "\r\n" +
                    "Content-Type: " + mime + "\r\n" +
                    "Content-Length: " + data.length + "\r\n" +
                    "Access-Control-Allow-Origin: *\r\n" +
                    "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n" +
                    "Access-Control-Allow-Headers: *\r\n" +
                    "Connection: close\r\n\r\n";
            out.write(headers.getBytes(StandardCharsets.UTF_8));
            out.write(data);
            out.flush();
        } catch (IOException ignored) {}
    }

    private void persistData() {
        try {
            JSONObject root = new JSONObject();
            root.put("history", new JSONArray(clipboardHistory));
            root.put("devices", new JSONObject(devices));
            File f = new File(dataDir, "store.json");
            try (FileWriter fw = new FileWriter(f)) {
                fw.write(root.toString(2));
            }
        } catch (Exception ignored) {}
    }

    private void loadPersistedData() {
        try {
            File f = new File(dataDir, "store.json");
            if (f.exists()) {
                byte[] bytes = readFileBytes(f);
                JSONObject root = new JSONObject(new String(bytes, StandardCharsets.UTF_8));
                JSONArray hist = root.optJSONArray("history");
                if (hist != null) {
                    for (int i = 0; i < hist.length(); i++) {
                        clipboardHistory.add(hist.getJSONObject(i));
                    }
                }
                JSONObject devs = root.optJSONObject("devices");
                if (devs != null) {
                    for (Iterator<String> it = devs.keys(); it.hasNext(); ) {
                        String k = it.next();
                        devices.put(k, devs.getJSONObject(k));
                    }
                }
            }
        } catch (Exception ignored) {}
    }
}