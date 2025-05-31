import { BellIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationSettingsSkeleton } from '../skeletons/SettingsSkeleton';
import { useSettingsCache } from '../../hooks/useSettingsCache';

const ModernNotificationSettings = () => {
  const { user, updateProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: user?.notifications?.email ?? true,
    pushNotifications: user?.notifications?.push ?? true,
    soundEnabled: user?.notifications?.sound ?? true,
    messageNotifications: user?.notifications?.messages ?? true,
    mentionNotifications: user?.notifications?.mentions ?? true,
    groupNotifications: user?.notifications?.groups ?? true,
    desktopNotifications: user?.notifications?.desktop ?? true,
    mobileNotifications: user?.notifications?.mobile ?? true
  });

  // Use settings cache hook for smart loading
  const { isLoading, simulateLoading } = useSettingsCache('notifications');

  // Simulate loading state only on first render
  useEffect(() => {
    const cleanup = simulateLoading(500);
    return cleanup;
  }, [simulateLoading]);

  // Sync settings with user data
  useEffect(() => {
    if (user?.notifications) {
      setSettings({
        emailNotifications: user.notifications.email ?? true,
        pushNotifications: user.notifications.push ?? true,
        soundEnabled: user.notifications.sound ?? true,
        messageNotifications: user.notifications.messages ?? true,
        mentionNotifications: user.notifications.mentions ?? true,
        groupNotifications: user.notifications.groups ?? true,
        desktopNotifications: user.notifications.desktop ?? true,
        mobileNotifications: user.notifications.mobile ?? true
      });
    }
  }, [user?.notifications]);

  const handleToggle = async (key) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    };
    
    setSettings(newSettings);
    setIsSaving(true);

    try {
      const result = await updateProfile({
        notifications: {
          email: newSettings.emailNotifications,
          push: newSettings.pushNotifications,
          sound: newSettings.soundEnabled,
          messages: newSettings.messageNotifications,
          mentions: newSettings.mentionNotifications,
          groups: newSettings.groupNotifications,
          desktop: newSettings.desktopNotifications,
          mobile: newSettings.mobileNotifications
        }
      });

      if (result.success) {
        toast.success('Notification settings updated!', {
          icon: '🔔',
          style: {
            borderRadius: '12px',
            background: '#10B981',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      // Revert the change
      setSettings(settings);
      toast.error('Failed to update settings', {
        style: {
          borderRadius: '12px',
          background: '#EF4444',
          color: '#fff',
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const ToggleSwitch = ({ enabled, onChange, disabled = false }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled 
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg' 
          : 'bg-gray-200 dark:bg-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  if (isLoading) {
    return <NotificationSettingsSkeleton variant="shimmer" />;
  }

  const notificationGroups = [
    {
      title: 'Message Notifications',
      description: 'Get notified about new messages and activity',
      icon: BellIcon,
      settings: [
        {
          key: 'messageNotifications',
          title: 'New Messages',
          description: 'Receive notifications for new direct messages',
          enabled: settings.messageNotifications
        },
        {
          key: 'mentionNotifications',
          title: 'Mentions',
          description: 'Get notified when someone mentions you',
          enabled: settings.mentionNotifications
        },
        {
          key: 'groupNotifications',
          title: 'Group Messages',
          description: 'Notifications for group conversations',
          enabled: settings.groupNotifications
        }
      ]
    },
    {
      title: 'Delivery Methods',
      description: 'Choose how you want to receive notifications',
      icon: DevicePhoneMobileIcon,
      settings: [
        {
          key: 'pushNotifications',
          title: 'Push Notifications',
          description: 'Receive push notifications on your devices',
          enabled: settings.pushNotifications
        },
        {
          key: 'emailNotifications',
          title: 'Email Notifications',
          description: 'Get notifications via email',
          enabled: settings.emailNotifications
        },
        {
          key: 'desktopNotifications',
          title: 'Desktop Notifications',
          description: 'Show notifications on your desktop',
          enabled: settings.desktopNotifications
        }
      ]
    },
    {
      title: 'Sound & Alerts',
      description: 'Configure audio and visual alerts',
      icon: SpeakerWaveIcon,
      settings: [
        {
          key: 'soundEnabled',
          title: 'Notification Sounds',
          description: 'Play sounds for notifications',
          enabled: settings.soundEnabled
        },
        {
          key: 'mobileNotifications',
          title: 'Mobile Alerts',
          description: 'Vibration and alerts on mobile devices',
          enabled: settings.mobileNotifications
        }
      ]
    }
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg sm:rounded-xl flex-shrink-0">
          <BellIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
            Notification Settings
          </h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            Manage how and when you receive notifications
          </p>
        </div>
      </div>

      {/* Notification Groups */}
      <div className="space-y-8">
        {notificationGroups.map((group, groupIndex) => {
          const GroupIcon = group.icon;
          
          return (
            <div 
              key={groupIndex} 
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* Group Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <GroupIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {group.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {group.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Group Settings */}
              <div className="p-6 space-y-4">
                {group.settings.map((setting, settingIndex) => (
                  <div 
                    key={setting.key}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 stagger-item"
                    style={{ animationDelay: `${(groupIndex * 3 + settingIndex) * 100}ms` }}
                  >
                    <div className="flex-1">
                      <h5 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                        {setting.title}
                      </h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {setting.description}
                      </p>
                    </div>
                    <div className="ml-4">
                      <ToggleSwitch
                        enabled={setting.enabled}
                        onChange={() => handleToggle(setting.key)}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              Object.keys(settings).forEach(key => {
                if (!settings[key]) handleToggle(key);
              });
            }}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Enable All
          </button>
          <button
            onClick={() => {
              Object.keys(settings).forEach(key => {
                if (settings[key]) handleToggle(key);
              });
            }}
            className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Disable All
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModernNotificationSettings;
