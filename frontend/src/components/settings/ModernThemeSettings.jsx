import { PaintBrushIcon, SunIcon, MoonIcon, ComputerDesktopIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeSettingsSkeleton } from '../skeletons/SettingsSkeleton';
import { useSettingsCache } from '../../hooks/useSettingsCache';

const ModernThemeSettings = () => {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);

  // Use settings cache hook for smart loading
  const { isLoading, simulateLoading } = useSettingsCache('theme');

  // Simulate loading state only on first render
  useEffect(() => {
    const cleanup = simulateLoading(500);
    return cleanup;
  }, [simulateLoading]);

  const handleThemeChange = async (newTheme) => {
    setIsSaving(true);
    
    try {
      setTheme(newTheme);
      
      const result = await updateProfile({
        preferences: {
          ...user?.preferences,
          theme: newTheme
        }
      });

      if (result.success) {
        toast.success(`Switched to ${newTheme} theme!`, {
          icon: newTheme === 'dark' ? '🌙' : newTheme === 'light' ? '☀️' : '💻',
          style: {
            borderRadius: '12px',
            background: newTheme === 'dark' ? '#374151' : '#10B981',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      toast.error('Failed to update theme', {
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

  if (isLoading) {
    return <ThemeSettingsSkeleton variant="shimmer" />;
  }

  const themes = [
    {
      id: 'light',
      name: 'Light',
      description: 'Clean and bright interface perfect for daytime use',
      icon: SunIcon,
      preview: 'bg-gradient-to-br from-white to-gray-100',
      colors: ['#ffffff', '#f8fafc', '#e2e8f0'],
      textColor: 'text-gray-900'
    },
    {
      id: 'dark',
      name: 'Dark',
      description: 'Easy on the eyes in low light conditions',
      icon: MoonIcon,
      preview: 'bg-gradient-to-br from-gray-900 to-gray-800',
      colors: ['#1f2937', '#111827', '#374151'],
      textColor: 'text-white'
    },
    {
      id: 'system',
      name: 'System',
      description: 'Automatically follows your device settings',
      icon: ComputerDesktopIcon,
      preview: 'bg-gradient-to-br from-blue-100 via-white to-gray-900',
      colors: ['#dbeafe', '#ffffff', '#1f2937'],
      textColor: 'text-gray-900'
    }
  ];

  const accentColors = [
    { name: 'Blue', value: 'blue', color: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600' },
    { name: 'Purple', value: 'purple', color: 'bg-purple-500', gradient: 'from-purple-500 to-purple-600' },
    { name: 'Green', value: 'green', color: 'bg-green-500', gradient: 'from-green-500 to-green-600' },
    { name: 'Pink', value: 'pink', color: 'bg-pink-500', gradient: 'from-pink-500 to-pink-600' },
    { name: 'Orange', value: 'orange', color: 'bg-orange-500', gradient: 'from-orange-500 to-orange-600' },
    { name: 'Teal', value: 'teal', color: 'bg-teal-500', gradient: 'from-teal-500 to-teal-600' }
  ];

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl">
          <PaintBrushIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Appearance Settings
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Customize your theme and visual preferences
          </p>
        </div>
      </div>

      {/* Theme Selection */}
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Theme Preference
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themes.map((themeOption, index) => {
              const ThemeIcon = themeOption.icon;
              const isSelected = theme === themeOption.id;
              
              return (
                <button
                  key={themeOption.id}
                  onClick={() => handleThemeChange(themeOption.id)}
                  disabled={isSaving}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group hover:shadow-lg transform hover:scale-105 stagger-item ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Theme preview */}
                  <div className={`w-full h-20 rounded-xl mb-4 ${themeOption.preview} border border-gray-200 dark:border-gray-600 relative overflow-hidden`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ThemeIcon className={`w-8 h-8 ${themeOption.textColor} opacity-60`} />
                    </div>
                    {/* Color palette */}
                    <div className="absolute bottom-2 left-2 flex space-x-1">
                      {themeOption.colors.map((color, colorIndex) => (
                        <div
                          key={colorIndex}
                          className="w-3 h-3 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Theme info */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      <ThemeIcon className="w-5 h-5" />
                    </div>
                    <h5 className={`font-semibold ${
                      isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                    }`}>
                      {themeOption.name}
                    </h5>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {themeOption.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Colors */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Accent Color
          </h4>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Choose an accent color for buttons, links, and highlights
            </p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {accentColors.map((color, index) => (
                <button
                  key={color.value}
                  className={`group relative p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-md transform hover:scale-105 stagger-item`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color.gradient} mx-auto mb-2 shadow-lg group-hover:shadow-xl transition-shadow duration-200`}></div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {color.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Theme Preview */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Live Preview
          </h4>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            {/* Mock chat interface */}
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">Chat Preview</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">See how your theme looks</div>
              </div>
            </div>
            
            {/* Mock messages */}
            <div className="space-y-2">
              <div className="flex justify-end">
                <div className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm max-w-xs">
                  This is how your messages will look!
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg text-sm max-w-xs">
                  And this is how others' messages appear
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernThemeSettings;
