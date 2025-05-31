import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  KeyIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { SettingsModalSkeleton } from './skeletons/SettingsSkeleton';
import { useSettingsCache } from '../hooks/useSettingsCache';

// Import modern settings components
import ModernProfileSettings from './settings/ModernProfileSettings';
import ModernNotificationSettings from './settings/ModernNotificationSettings';
import ModernPrivacySettings from './settings/ModernPrivacySettings';
import ModernThemeSettings from './settings/ModernThemeSettings';
import ModernPasswordSettings from './settings/ModernPasswordSettings';

const SettingsModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [isClosing, setIsClosing] = useState(false);

  // Use settings cache hook for smart loading
  const { isLoading, simulateLoading } = useSettingsCache('modal');

  // Handle loading state only on first open
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);

      // Simulate loading with cache awareness
      const cleanup = simulateLoading(800);
      return cleanup;
    }
  }, [isOpen, simulateLoading]);

  const tabs = [
    {
      id: 'profile',
      name: 'Profile',
      icon: UserIcon,
      component: ModernProfileSettings,
      description: 'Manage your personal information'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: BellIcon,
      component: ModernNotificationSettings,
      description: 'Configure notification preferences'
    },
    {
      id: 'privacy',
      name: 'Privacy',
      icon: ShieldCheckIcon,
      component: ModernPrivacySettings,
      description: 'Control your privacy settings'
    },
    {
      id: 'theme',
      name: 'Appearance',
      icon: PaintBrushIcon,
      component: ModernThemeSettings,
      description: 'Customize your theme'
    },
    {
      id: 'password',
      name: 'Security',
      icon: KeyIcon,
      component: ModernPasswordSettings,
      description: 'Update your password'
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  // Show skeleton loading state
  if (isLoading) {
    return <SettingsModalSkeleton variant="shimmer" />;
  }

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 transition-all duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-5xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        } glass dark:glass-dark`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
              <Cog6ToothIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                Settings
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                Manage your account and preferences
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-110 group flex-shrink-0 ml-2"
          >
            <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col sm:flex-row h-[calc(100vh-80px)] sm:h-[calc(90vh-120px)]">
          {/* Mobile Tab Selector */}
          <div className="sm:hidden bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 p-3">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.name}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden sm:block w-64 md:w-72 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 flex-shrink-0">
            <nav className="space-y-2">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 p-3 md:p-4 rounded-lg md:rounded-xl text-left transition-all duration-200 group stagger-item hover-lift ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`p-1.5 md:p-2 rounded-md md:rounded-lg transition-all duration-200 flex-shrink-0 ${
                      isActive
                        ? 'bg-white/20'
                        : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                    }`}>
                      <Icon className={`w-4 h-4 md:w-5 md:h-5 ${
                        isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm md:text-base truncate ${
                        isActive ? 'text-white' : 'text-gray-900 dark:text-white'
                      }`}>
                        {tab.name}
                      </div>
                      <div className={`text-xs md:text-sm hidden md:block ${
                        isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {tab.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* User info at bottom */}
            <div className="mt-6 md:mt-8 p-3 md:p-4 bg-white dark:bg-gray-800 rounded-lg md:rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-xs md:text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.displayName || user?.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{user?.username}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
            <div className="animate-fade-in h-full">
              {ActiveComponent && <ActiveComponent />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
