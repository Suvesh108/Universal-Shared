import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { loadDevice, saveDevice, clearDevice, loadDeviceName, saveDeviceName, defaultDeviceName, detectDeviceType } from '../utils/storage';

export function useDevice() {
  const [device, setDevice] = useState(loadDevice);
  const [loading, setLoading] = useState(false);
  const [waitingApproval, setWaitingApproval] = useState(false);
  const [error, setError] = useState(null);

  const register = async (name) => {
    setLoading(true);
    setError(null);
    try {
      const { device: d } = await api.registerDevice({
        name: name || defaultDeviceName(),
        type: detectDeviceType(),
        userAgent: navigator.userAgent,
      });
      saveDevice(d);
      saveDeviceName(d.name);
      setDevice(d);
      return d;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const pairWithCode = async (code, name) => {
    setLoading(true);
    setError(null);
    setWaitingApproval(false);
    try {
      // Step 1: Request pairing with host (triggers confirmation modal on host)
      let reqResult = null;
      try {
        reqResult = await api.requestPair({
          code: code.toUpperCase(),
          name: name || defaultDeviceName(),
          type: detectDeviceType(),
          userAgent: navigator.userAgent,
        });
      } catch (reqErr) {
        // Fallback to legacy direct verify
        const { device: d } = await api.verifyPair({
          code: code.toUpperCase(),
          name: name || defaultDeviceName(),
          type: detectDeviceType(),
          userAgent: navigator.userAgent,
        });
        saveDevice(d);
        saveDeviceName(d.name);
        setDevice(d);
        return d;
      }

      if (reqResult?.requestId) {
        setWaitingApproval(true);
        const startTime = Date.now();

        // Poll every 1s for host approval
        return await new Promise((resolve, reject) => {
          const pollTimer = setInterval(async () => {
            if (Date.now() - startTime > 120000) {
              clearInterval(pollTimer);
              setWaitingApproval(false);
              setLoading(false);
              reject(new Error('Pairing request timed out. Please try again.'));
              return;
            }

            try {
              const statusRes = await api.checkPairStatus(reqResult.requestId);
              if (statusRes.status === 'approved' && statusRes.device) {
                clearInterval(pollTimer);
                setWaitingApproval(false);
                setLoading(false);
                saveDevice(statusRes.device);
                saveDeviceName(statusRes.device.name);
                setDevice(statusRes.device);
                resolve(statusRes.device);
              } else if (statusRes.status === 'declined') {
                clearInterval(pollTimer);
                setWaitingApproval(false);
                setLoading(false);
                reject(new Error('Connection request was declined by the host.'));
              }
            } catch (err) {
              // Keep polling
            }
          }, 1000);
        });
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearDevice();
    setDevice(null);
  };

  useEffect(() => {
    const handleAuthFailed = () => {
      console.warn('Authentication 401 notice received');
    };
    window.addEventListener('auth-failed', handleAuthFailed);
    return () => window.removeEventListener('auth-failed', handleAuthFailed);
  }, []);

  const updateProfile = async ({ name, type }) => {
    setLoading(true);
    setError(null);
    try {
      const { device: d } = await api.updateProfile(device.token, { name, type });
      saveDevice(d);
      saveDeviceName(d.name);
      setDevice(d);
      return d;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { device, loading, waitingApproval, error, register, pairWithCode, logout, updateProfile };
}

export function useServerInfo() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    api.info().then(setInfo).catch(() => {});
    const t = setInterval(() => api.info().then(setInfo).catch(() => {}), 10000);
    return () => clearInterval(t);
  }, []);

  return info;
}

export function useInitialPairCode() {
  const params = new URLSearchParams(window.location.search);
  return params.get('pair')?.toUpperCase() || null;
}

export function useDeviceName() {
  return loadDeviceName() || defaultDeviceName();
}