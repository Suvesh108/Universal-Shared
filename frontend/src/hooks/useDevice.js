import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { loadDevice, saveDevice, clearDevice, loadDeviceName, saveDeviceName, defaultDeviceName, detectDeviceType } from '../utils/storage';

export function useDevice() {
  const [device, setDevice] = useState(loadDevice);
  const [loading, setLoading] = useState(false);
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
    try {
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
      logout();
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

  return { device, loading, error, register, pairWithCode, logout, updateProfile };
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
