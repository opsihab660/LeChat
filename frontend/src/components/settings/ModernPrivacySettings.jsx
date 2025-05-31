import { ShieldCheckIcon, EyeIcon, EyeSlashIcon, UserGroupIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { PrivacySettingsSkeleton } from '../skeletons/SettingsSkeleton';
import { useSettingsCache } from '../../hooks/useSettingsCache';

const ModernPrivacySettings = () => {
  const { user, updateProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    showOnlineStatus: user?.privacy?.showOnlineStatus ?? true,
    showLastSeen: user?.privacy?.showLastSeen ?? true,
    allowDirectMessages: user?.privacy?.allowDirectMessages ?? true,
    showReadReceipts: user?.privacy?.showReadReceipts ?? true,
    allowProfileViewing: user?.privacy?.allowProfileViewing ?? true,
    showTypingIndicator: user?.privacy?.showTypingIndicator ?? true
  });

  // Use settings cache hook for smart loading
  const { isLoading, simulateLoading } = useSettingsCache('privacy');

  // Simulate loading state only on first render
  useEffect(() => {
    const cleanup = simulateLoading(600);
    return cleanup;
  }, [simulateLoading]);

  // Sync settings with user data
  useEffect(() => {
    if (user?.privacy) {
      setSettings({
        showOnlineStatus: user.privacy.showOnlineStatus ?? true,
        showLastSeen: user.privacy.showLastSeen ?? true,
        allowDirectMessages: user.privacy.allowDirectMessages ?? true,
        showReadReceipts: user.privacy.showReadReceipts ?? true,
        allowProfileViewing: user.privacy.allowProfileViewing ?? true,
        showTypingIndicator: user.privacy.showTypingIndicator ?? true
      });
    }
  }, [user?.privacy]);

  const handleToggle = async (key) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    };
    
    setSettings(newSettings);
    setIsSaving(true);

    try {
      const result = await updateProfile({
        privacy: newSettings
      });

      if (result.success) {
        toast.success('Privacy settings updated!', {
          icon: '🔒',
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
          ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg' 
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
    return <PrivacySettingsSkeleton variant="shimmer" />;
  }

  const privacySettings = [
    {
      key: 'showOnlineStatus',
      title: 'Show Online Status',
      description: 'Let others see when you\'re online',
      icon: EyeIcon,
      enabled: settings.showOnlineStatus,
      category: 'Visibility'
    },
    {
      key: 'showLastSeen',
      title: 'Show Last Seen',
      description: 'Display when you were last active',
      icon: EyeIcon,
      enabled: settings.showLastSeen,
      category: 'Visibility'
    },
    {
      key: 'allowDirectMessages',
      title: 'Allow Direct Messages',
      description: 'Let anyone send you direct messages',
      icon: ChatBubbleLeftRightIcon,
      enabled: settings.allowDirectMessages,
      category: 'Communication'
    },
    {
      key: 'showReadReceipts',
      title: 'Read Receipts',
      description: 'Show when you\'ve read messages',
      icon: EyeIcon,
      enabled: settings.showReadReceipts,
      category: 'Communication'
    },
    {
      key: 'allowProfileViewing',
      title: 'Profile Viewing',
      description: 'Allow others to view your full profile',
      icon: UserGroupIcon,
      enabled: settings.allowProfileViewing,
      category: 'Profile'
    },
    {
      key: 'showTypingIndicator',
      title: 'Typing Indicator',
      description: 'Show when you\'re typing a message',
      icon: ChatBubbleLeftRightIcon,
      enabled: settings.showTypingIndicator,
      category: 'Communication'
    }
  ];

  const categories = [...new Set(privacySettings.map(setting => setting.category))];

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl">
          <ShieldCheckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Privacy Settings
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Control your privacy and what others can see
          </p>
        </div>
      </div>

      {/* Privacy Categories */}
      <div className="space-y-6">
        {categories.map((category, categoryIndex) => {
          const categorySettings = privacySettings.filter(setting => setting.category === category);
          
          return (
            <div 
              key={category}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* Category Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {category}
                </h4>
              </div>

              {/* Category Settings */}
              <div className="p-6 space-y-4">
                {categorySettings.map((setting, settingIndex) => {
                  const SettingIcon = setting.icon;
                  
                  return (
                    <div 
                      key={setting.key}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 stagger-item group"
                      style={{ animationDelay: `${(categoryIndex * 3 + settingIndex) * 100}ms` }}
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`p-3 rounded-xl transition-all duration-200 ${
                          setting.enabled 
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg' 
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                        }`}>
                          <SettingIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                            {setting.title}
                          </h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {setting.description}
                          </p>
                        </div>
                      </div>
                      <div className="ml-4">
                        <ToggleSwitch
                          enabled={setting.enabled}
                          onChange={() => handleToggle(setting.key)}
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Privacy Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <ShieldCheckIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Privacy Summary
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${settings.showOnlineStatus ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-gray-700 dark:text-gray-300">Online Status</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${settings.showLastSeen ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-gray-700 dark:text-gray-300">Last Seen</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${settings.allowDirectMessages ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-gray-700 dark:text-gray-300">Direct Messages</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${settings.showReadReceipts ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-gray-700 dark:text-gray-300">Read Receipts</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${settings.allowProfileViewing ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-gray-700 dark:text-gray-300">Profile Viewing</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${settings.showTypingIndicator ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-gray-700 dark:text-gray-300">Typing Indicator</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernPrivacySettings;
