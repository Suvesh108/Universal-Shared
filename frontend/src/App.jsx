import { useState, useCallback, useEffect } from 'react';
import Header, { SetupScreen } from './components/Header';
import PairingModal from './components/PairingModal';
import PairApprovalModal from './components/PairApprovalModal';
import ProfileModal from './components/ProfileModal';
import UpdateModal from './components/UpdateModal';
import ClipboardInput from './components/ClipboardInput';
import HistoryList, { DeviceList } from './components/HistoryList';
import { useDevice, useServerInfo, useInitialPairCode } from './hooks/useDevice';
import { useSocket } from './hooks/useSocket';
import { useClipboardHistory, copyToClipboard } from './hooks/useClipboard';
import { useTheme } from './hooks/useTheme';
import { saveDeviceName } from './utils/storage';
import CustomDialog from './components/CustomDialog';
import { api, setServerUrl } from './utils/api';
import { checkForUpdate } from './utils/updater';

export default function App() {
  const { device, loading, waitingApproval, error, register, pairWithCode, logout, updateProfile } = useDevice();
  const serverInfo = useServerInfo();
  const initialCode = useInitialPairCode();
  const { toggle, isDark } = useTheme();
  const [showPair, setShowPair] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [dark, setDark] = useState(isDark());
  const [dialog, setDialog] = useState(null);
  const [isHistoryEnlarged, setIsHistoryEnlarged] = useState(false);
  const [devicesList, setDevicesList] = useState([]);
  const [pendingPairRequest, setPendingPairRequest] = useState(null);

  useEffect(() => {
    if (device?.token) {
      api.listDevices(device.token).then((res) => {
        setDevicesList(res.devices || []);
      }).catch(() => {});
    }
  }, [device?.token]);

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

  const handlePairRequest = useCallback((reqData) => {
    setPendingPairRequest(reqData);
  }, []);

  const { connected, sendText } = useSocket(device?.token, onReceive, handlePairRequest);

  const handleTheme = () => {
    toggle();
    setDark(isDark());
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      /* no SW — fully local */
    }
  }, []);

  // Check for updates on startup
  useEffect(() => {
    const t = setTimeout(() => {
      checkForUpdate().then((info) => {
        if (info?.available) {
          setUpdateInfo(info);
          setShowUpdateModal(true);
        }
      }).catch(() => {});
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  // Sync saved custom host IP to backend if they are out of sync
  useEffect(() => {
    if (serverInfo && serverInfo.hostIpOverride !== undefined) {
      const savedIp = localStorage.getItem('custom_host_ip');
      if (savedIp && savedIp !== serverInfo.hostIpOverride) {
        api.updateSettings({ hostIp: savedIp }).catch(() => {});
      }
    }
  }, [serverInfo]);

  if (!device) {
    return (
      <SetupScreen
        initialCode={initialCode}
        loading={loading}
        waitingApproval={waitingApproval}
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
    <div className="app-container">
      <Header
        device={device}
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
              devices={devicesList}
              currentDeviceId={device.id}
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
              <h2>Universal Shared</h2>
              <p className="muted">
                Seamless real-time clipboard & file sync across all your devices. Instant QR pairing, cross-platform compatibility, and zero-configuration sharing.
              </p>
            </section>
          </aside>
        )}
      </main>

      <PairingModal
        open={showPair}
        onClose={() => setShowPair(false)}
        serverInfo={serverInfo}
        onPairWithCode={(code, serverUrl) => {
          if (serverUrl) setServerUrl(serverUrl);
          pairWithCode(code);
          showToast('Device paired successfully!');
        }}
      />

      <PairApprovalModal
        request={pendingPairRequest}
        onResolved={(approved, req) => {
          setPendingPairRequest(null);
          if (approved) {
            showToast(`Approved connection for ${req?.name || 'device'}!`);
            if (device?.token) {
              api.listDevices(device.token).then((res) => setDevicesList(res.devices || [])).catch(() => {});
            }
          } else {
            showToast(`Declined connection for ${req?.name || 'device'}.`);
          }
        }}
      />

      <ProfileModal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        device={device}
        updateProfile={updateProfile}
        logout={logout}
        showAlert={showAlert}
        onToast={showToast}
        serverInfo={serverInfo}
        onCheckUpdate={async () => {
          showToast('Checking for updates...');
          const info = await checkForUpdate();
          if (info?.available) {
            setUpdateInfo(info);
            setShowUpdateModal(true);
          } else {
            showAlert('You are using the latest version of Universal Shared (v0.1.3).', 'Up to Date');
          }
        }}
      />
      <UpdateModal
        open={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        updateInfo={updateInfo}
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