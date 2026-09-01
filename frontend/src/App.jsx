import { useState, useCallback, useEffect } from 'react';
import Header, { SetupScreen } from './components/Header';
import PairingModal from './components/PairingModal';
import PairApprovalModal from './components/PairApprovalModal';
import SettingsModal from './components/SettingsModal';
import HistoryModal from './components/HistoryModal';
import UpdateModal from './components/UpdateModal';
import ClipboardInput from './components/ClipboardInput';
import HistoryList from './components/HistoryList';
import { useDevice, useServerInfo, useInitialPairCode } from './hooks/useDevice';
import { useSocket } from './hooks/useSocket';
import { useClipboardHistory, copyToClipboard } from './hooks/useClipboard';
import { useTheme } from './hooks/useTheme';
import { saveDeviceName } from './utils/storage';
import CustomDialog from './components/CustomDialog';
import { api, setServerUrl, isCapacitor } from './utils/api';
import { checkForUpdate } from './utils/updater';

export default function App() {
  const { device, loading, waitingApproval, error, register, pairWithCode, logout, updateProfile } = useDevice();
  const serverInfo = useServerInfo();
  const initialCode = useInitialPairCode();
  const { toggle, isDark } = useTheme();
  const [showPair, setShowPair] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [dark, setDark] = useState(isDark());
  const [dialog, setDialog] = useState(null);
  const [isHistoryEnlarged, setIsHistoryEnlarged] = useState(false);
  const [devicesList, setDevicesList] = useState([]);
  const [pendingPairRequest, setPendingPairRequest] = useState(null);
  const [isMobile, setIsMobile] = useState(isCapacitor() || (typeof window !== 'undefined' && window.innerWidth <= 768));

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isCapacitor() || window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (device?.token) {
      api.listDevices(device.token).then((res) => {
        setDevicesList(res.devices || []);
      }).catch(() => {});
    }
  }, [device?.token]);

  const showAlert = useCallback((message, title = 'Notice') => {
    return new Promise((resolve) => {
      setDialog({
        open: true,
        type: 'alert',
        title,
        message,
        onResolve: () => {
          setDialog(null);
          resolve(true);
        }
      });
    });
  }, []);

  const showConfirm = useCallback((message, title = 'Confirm') => {
    return new Promise((resolve) => {
      setDialog({
        open: true,
        type: 'confirm',
        title,
        message,
        onResolve: (result) => {
          setDialog(null);
          resolve(result);
        }
      });
    });
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleTheme = () => {
    const next = toggle();
    setDark(next === 'dark');
  };

  const { items, loading: historyLoading, refresh, prepend, remove, clearAll } = useClipboardHistory(device?.token);

  const { connected, sendText } = useSocket(device?.token, {
    onReceive: async (item, flags = {}) => {
      prepend(item);
      if (item.type === 'text' || item.type === 'link') {
        if (!flags.fromSelf) {
          await copyToClipboard(item.content);
          showToast(`Synced from ${item.deviceName || 'device'}`);
        }
      }
    },
    onPairRequest: (req) => {
      setPendingPairRequest(req);
    }
  });

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
        onProfileClick={() => setShowSettings(true)}
        onHistoryClick={isMobile ? () => setShowHistoryModal(true) : null}
        historyCount={items.length}
        onThemeToggle={handleTheme}
        isDark={dark}
      />

      {isMobile ? (
        <main className="mobile-sender-layout">
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
        </main>
      ) : (
        <main className="desktop-split-layout">
          <div className="left-sender-fixed-column">
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
          </div>

          <div className="right-history-scrollable-column">
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
        </main>
      )}

      {isMobile && (
        <HistoryModal
          open={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          token={device.token}
          currentDeviceId={device.id}
          items={items}
          loading={historyLoading}
          onRefresh={refresh}
          onRemove={remove}
          onClear={async () => {
            if (await showConfirm('Are you sure you want to clear all clipboard history?', 'Clear History')) await clearAll();
          }}
          onToast={showToast}
          showAlert={showAlert}
          showConfirm={showConfirm}
        />
      )}

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

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        device={device}
        updateProfile={updateProfile}
        logout={logout}
        showAlert={showAlert}
        showConfirm={showConfirm}
        onToast={showToast}
        serverInfo={serverInfo}
        isDark={dark}
        onThemeToggle={handleTheme}
        onCheckUpdate={async () => {
          showToast('Checking for updates...');
          const info = await checkForUpdate();
          if (info?.available) {
            setUpdateInfo(info);
            setShowUpdateModal(true);
          } else {
            showAlert('You are using the latest version of Universal Shared (v0.2.0).', 'Up to Date');
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