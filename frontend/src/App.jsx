import { useState, useCallback, useEffect } from 'react';
import Header, { SetupScreen } from './components/Header';
import PairingModal from './components/PairingModal';
import ProfileModal from './components/ProfileModal';
import ClipboardInput from './components/ClipboardInput';
import HistoryList, { DeviceList } from './components/HistoryList';
import { useDevice, useServerInfo, useInitialPairCode } from './hooks/useDevice';
import { useSocket } from './hooks/useSocket';
import { useClipboardHistory, copyToClipboard } from './hooks/useClipboard';
import { useTheme } from './hooks/useTheme';
import { saveDeviceName } from './utils/storage';
import CustomDialog from './components/CustomDialog';

export default function App() {
  const { device, loading, error, register, pairWithCode, logout, updateProfile } = useDevice();
  const serverInfo = useServerInfo();
  const initialCode = useInitialPairCode();
  const { toggle, isDark } = useTheme();
  const [showPair, setShowPair] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [toast, setToast] = useState(null);
  const [dark, setDark] = useState(isDark());
  const [dialog, setDialog] = useState(null);
  const [isHistoryEnlarged, setIsHistoryEnlarged] = useState(false);

  const showAlert = useCallback((message, title = 'Alert') => {
    return new Promise((resolve) => {
      setDialog({
        open: true,
        message,
        title,
        type: 'alert',
        onResolve: (res) => {
          setDialog(null);
          resolve(res);
        }
      });
    });
  }, []);

  const showConfirm = useCallback((message, title = 'Confirm') => {
    return new Promise((resolve) => {
      setDialog({
        open: true,
        message,
        title,
        type: 'confirm',
        onResolve: (res) => {
          setDialog(null);
          resolve(res);
        }
      });
    });
  }, []);

  const { items, loading: historyLoading, refresh, prepend, remove, clearAll } =
    useClipboardHistory(device?.token);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const onReceive = useCallback(async (item, { fromSelf } = {}) => {
    prepend(item);
    if (!fromSelf && (item.type === 'text' || item.type === 'link') && item.content) {
      try {
        await copyToClipboard(item.content);
        showToast(`Received from ${item.deviceName} — copied!`);
      } catch {
        showToast(`Received from ${item.deviceName}`);
      }
    } else if (!fromSelf) {
      showToast(`Received ${item.type} from ${item.deviceName}`);
    }
  }, [prepend, showToast]);

  const { connected, sendText } = useSocket(device?.token, onReceive);

  const handleTheme = () => {
    toggle();
    setDark(isDark());
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      /* no SW — fully local */
    }
  }, []);

  if (!device) {
    return (
      <SetupScreen
        initialCode={initialCode}
        loading={loading}
        error={error}
        onRegister={(name) => {
          saveDeviceName(name);
          register(name || undefined);
        }}
        onPair={(code, name) => {
          saveDeviceName(name);
          pairWithCode(code, name || undefined);
        }}
      />
    );
  }

  return (
    <div className="app">
      <Header
        connected={connected}
        serverInfo={serverInfo}
        onPairClick={() => setShowPair(true)}
        onProfileClick={() => setShowProfile(true)}
        onThemeToggle={handleTheme}
        isDark={dark}
      />

      <main className={`main-grid ${isHistoryEnlarged ? 'history-enlarged' : ''}`}>
        <div className="main-primary">
          {!isHistoryEnlarged && (
            <ClipboardInput
              token={device.token}
              sendText={sendText}
              showAlert={showAlert}
              onSent={(item) => {
                prepend(item);
                showToast('Sent to all devices');
              }}
            />
          )}
          <HistoryList
            token={device.token}
            currentDeviceId={device.id}
            items={items}
            loading={historyLoading}
            onRefresh={refresh}
            onRemove={remove}
            showAlert={showAlert}
            showConfirm={showConfirm}
            onClear={async () => {
              if (await showConfirm('Are you sure you want to clear all clipboard history?', 'Clear History')) await clearAll();
            }}
            onToast={showToast}
            isEnlarged={isHistoryEnlarged}
            onToggleResize={() => setIsHistoryEnlarged(!isHistoryEnlarged)}
          />
        </div>

        {!isHistoryEnlarged && (
          <aside className="main-sidebar">
            <DeviceList token={device.token} currentDeviceId={device.id} showConfirm={showConfirm} showAlert={showAlert} />
            <section className="card info-card">
              <h2>Safe & Private</h2>
              <p className="muted">
                Everything runs locally on your Wi-Fi network. No accounts, no cloud servers, and no internet connection needed. Your copied items never leave your home network.
              </p>
            </section>
          </aside>
        )}
      </main>

      <PairingModal open={showPair} onClose={() => setShowPair(false)} />
      <ProfileModal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        device={device}
        updateProfile={updateProfile}
        logout={logout}
        showAlert={showAlert}
        onToast={showToast}
      />

      {toast && <div className="toast">{toast}</div>}

      <CustomDialog
        open={!!dialog?.open}
        message={dialog?.message}
        title={dialog?.title}
        type={dialog?.type}
        onResolve={dialog?.onResolve}
      />
    </div>
  );
}
