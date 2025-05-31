import React, { useState } from 'react';
import { Cog6ToothIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import SettingsModal from './SettingsModal';
import { resetSettingsCache, getSettingsCacheStatus } from '../hooks/useSettingsCache';

const SettingsLoadingDemo = () => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [cacheStatus, setCacheStatus] = useState(getSettingsCacheStatus());

  const handleOpenSettings = () => {
    setShowSettingsModal(true);
    // Update cache status after a short delay to show the change
    setTimeout(() => {
      setCacheStatus(getSettingsCacheStatus());
    }, 1000);
  };

  const handleResetCache = () => {
    resetSettingsCache();
    setCacheStatus(getSettingsCacheStatus());
  };

  const handleCloseSettings = () => {
    setShowSettingsModal(false);
    // Update cache status after closing
    setTimeout(() => {
      setCacheStatus(getSettingsCacheStatus());
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <Cog6ToothIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Smart Loading Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            প্রথমবার loading হবে, দ্বিতীয়বার instant load হবে
          </p>
        </div>

        {/* Demo Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Demo Controls
          </h3>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={handleOpenSettings}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span>Open Settings Modal</span>
            </button>

            <button
              onClick={handleResetCache}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <ArrowPathIcon className="w-5 h-5" />
              <span>Reset Cache</span>
            </button>
          </div>

          {/* Cache Status */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Cache Status (Loading States):
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(cacheStatus).map(([key, loaded]) => (
                <div 
                  key={key} 
                  className={`flex items-center space-x-2 p-2 rounded-lg ${
                    loaded 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {loaded ? (
                    <CheckCircleIcon className="w-4 h-4" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span className="text-xs font-medium">
                    {key.replace('hasLoaded', '')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            How to Test:
          </h3>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
              <div>
                <strong>প্রথমবার:</strong> "Open Settings Modal" বাটনে ক্লিক করুন। আপনি skeleton loading দেখবেন।
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
              <div>
                <strong>দ্বিতীয়বার:</strong> Modal বন্ধ করে আবার খুলুন। এবার instant load হবে, কোন loading নেই।
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
              <div>
                <strong>Reset:</strong> "Reset Cache" বাটন দিয়ে আবার loading state ফিরিয়ে আনুন।
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</div>
              <div>
                <strong>Tab Navigation:</strong> বিভিন্ন settings tab এ যান। প্রতিটি tab প্রথমবার loading দেখাবে।
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Benefits of Smart Loading:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-gray-900 dark:text-white">Better UX:</strong>
                <p className="text-sm text-gray-600 dark:text-gray-400">Users don't see unnecessary loading on repeat visits</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-gray-900 dark:text-white">Performance:</strong>
                <p className="text-sm text-gray-600 dark:text-gray-400">Faster subsequent interactions</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-gray-900 dark:text-white">Smart Caching:</strong>
                <p className="text-sm text-gray-600 dark:text-gray-400">Remembers what has been loaded before</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-gray-900 dark:text-white">Professional Feel:</strong>
                <p className="text-sm text-gray-600 dark:text-gray-400">Modern app-like behavior</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={handleCloseSettings}
      />
    </div>
  );
};

export default SettingsLoadingDemo;
