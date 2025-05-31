import { useState, useCallback } from 'react';

// Global cache for settings loading states
const settingsCache = {
  hasLoadedModal: false,
  hasLoadedProfile: false,
  hasLoadedNotifications: false,
  hasLoadedPrivacy: false,
  hasLoadedTheme: false,
  hasLoadedPassword: false
};

/**
 * Custom hook to manage settings loading cache
 * Ensures loading states only show on first visit
 */
export const useSettingsCache = (componentType = 'modal') => {
  const cacheKey = `hasLoaded${componentType.charAt(0).toUpperCase() + componentType.slice(1)}`;
  
  const [isLoading, setIsLoading] = useState(!settingsCache[cacheKey]);

  const markAsLoaded = useCallback(() => {
    settingsCache[cacheKey] = true;
    setIsLoading(false);
  }, [cacheKey]);

  const shouldShowLoading = useCallback(() => {
    return !settingsCache[cacheKey];
  }, [cacheKey]);

  const simulateLoading = useCallback((duration = 600) => {
    if (shouldShowLoading()) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        markAsLoaded();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [shouldShowLoading, markAsLoaded]);

  return {
    isLoading,
    shouldShowLoading: shouldShowLoading(),
    markAsLoaded,
    simulateLoading
  };
};

/**
 * Reset all settings cache (useful for testing or logout)
 */
export const resetSettingsCache = () => {
  Object.keys(settingsCache).forEach(key => {
    settingsCache[key] = false;
  });
};

/**
 * Get current cache status (useful for debugging)
 */
export const getSettingsCacheStatus = () => {
  return { ...settingsCache };
};

export default useSettingsCache;
