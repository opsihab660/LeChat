import { useState, useEffect, useCallback } from 'react';

export const useEnhancedOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');
  const [effectiveType, setEffectiveType] = useState('unknown');
  const [downlink, setDownlink] = useState(0);
  const [rtt, setRtt] = useState(0);

  // 🌐 Update network information
  const updateNetworkInfo = useCallback(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        setConnectionType(connection.type || 'unknown');
        setEffectiveType(connection.effectiveType || 'unknown');
        setDownlink(connection.downlink || 0);
        setRtt(connection.rtt || 0);
      }
    }
  }, []);

  // 📡 Test actual connectivity with ping
  const testConnectivity = useCallback(async () => {
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/ping', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const endTime = Date.now();

      if (response.ok) {
        const pingTime = endTime - startTime;
        setRtt(pingTime);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Connectivity test failed:', error);
      return false;
    }
  }, []);

  // 🔄 Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      updateNetworkInfo();
      testConnectivity();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // 📱 Handle connection change (mobile networks)
    const handleConnectionChange = () => {
      updateNetworkInfo();
      if (navigator.onLine) {
        testConnectivity();
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        connection.addEventListener('change', handleConnectionChange);
      }
    }

    // Initial setup
    updateNetworkInfo();
    if (navigator.onLine) {
      testConnectivity();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
          connection.removeEventListener('change', handleConnectionChange);
        }
      }
    };
  }, [updateNetworkInfo, testConnectivity]);

  // 🔄 Periodic connectivity check
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        testConnectivity();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [testConnectivity]);

  // 📊 Get connection quality
  const getConnectionQuality = useCallback(() => {
    if (!isOnline) return 'offline';
    
    if (effectiveType === '4g' && downlink > 10) return 'excellent';
    if (effectiveType === '4g' && downlink > 5) return 'good';
    if (effectiveType === '3g' || (effectiveType === '4g' && downlink > 1)) return 'fair';
    if (effectiveType === '2g' || downlink < 1) return 'poor';
    
    return 'unknown';
  }, [isOnline, effectiveType, downlink]);

  // 📈 Get connection speed estimate
  const getSpeedEstimate = useCallback(() => {
    if (!isOnline) return 'offline';
    
    if (downlink > 10) return 'fast';
    if (downlink > 5) return 'medium';
    if (downlink > 1) return 'slow';
    return 'very-slow';
  }, [isOnline, downlink]);

  return {
    isOnline,
    connectionType,
    effectiveType,
    downlink,
    rtt,
    connectionQuality: getConnectionQuality(),
    speedEstimate: getSpeedEstimate(),
    testConnectivity
  };
};

export default useEnhancedOnlineStatus;
