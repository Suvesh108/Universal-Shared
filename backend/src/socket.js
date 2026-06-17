import { v4 as uuidv4 } from 'uuid';
import {
  addClipboardItem,
  getDeviceByToken,
  touchDevice,
} from './db.js';
import { detectType, serializeItem } from './clipboard.js';

export function setupSocket(io) {
  const connectedSockets = new Map(); // deviceId -> Set<socketId>

  io.on('connection', (socket) => {
    let device = null;

    socket.on('device:register', ({ token, name }, ack) => {
      const found = getDeviceByToken(token);
      if (!found) {
        ack?.({ ok: false, error: 'Invalid token' });
        return;
      }

      device = found;
      if (name) touchDevice(device.id, name);
      else touchDevice(device.id);

      socket.join('clipboard');
      socket.data.deviceId = device.id;

      if (!connectedSockets.has(device.id)) {
        connectedSockets.set(device.id, new Set());
      }
      connectedSockets.get(device.id).add(socket.id);

      io.emit('devices:updated', { deviceId: device.id, online: true });
      ack?.({ ok: true, device: { id: device.id, name: device.name, type: device.type } });
    });

    socket.on('device:heartbeat', ({ name }) => {
      if (!device) return;
      touchDevice(device.id, name);
      socket.emit('device:pong', { at: Date.now() });
    });

    socket.on('clipboard:send', (payload, ack) => {
      if (!device) {
        ack?.({ ok: false, error: 'Not registered' });
        return;
      }

      const { content, type } = payload || {};
      if (!content || typeof content !== 'string') {
        ack?.({ ok: false, error: 'content required' });
        return;
      }

      const itemType = type || detectType({ content });
      const item = addClipboardItem({
        id: uuidv4(),
        deviceId: device.id,
        deviceName: device.name,
        type: itemType,
        content,
        filePath: null,
        fileName: null,
        mimeType: null,
        size: Buffer.byteLength(content, 'utf8'),
        createdAt: Date.now(),
      });

      const host = socket.handshake.headers.host || 'localhost:3847';
      const baseUrl = `http://${host}`;
      const serialized = serializeItem(item, baseUrl);

      socket.to('clipboard').emit('clipboard:receive', serialized);
      ack?.({ ok: true, item: serialized });
    });

    socket.on('disconnect', () => {
      if (!device) return;
      const set = connectedSockets.get(device.id);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          connectedSockets.delete(device.id);
          io.emit('devices:updated', { deviceId: device.id, online: false });
        }
      }
    });
  });

  return connectedSockets;
}
