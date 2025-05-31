import React, { useState } from 'react';
import { CheckIcon, PaintBrushIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useChatTheme } from '../contexts/ChatThemeContext';

const ChatThemeSelector = ({ isOpen, onClose }) => {
  const { chatTheme, themes, setTheme } = useChatTheme();
  const [selectedTheme, setSelectedTheme] = useState(chatTheme);

  const handleThemeSelect = (themeKey) => {
    setSelectedTheme(themeKey);
    setTheme(themeKey);
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <PaintBrushIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Chat Themes
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Theme Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(themes).map(([themeKey, theme]) => (
              <div
                key={themeKey}
                onClick={() => handleThemeSelect(themeKey)}
                className={`
                  relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                  ${selectedTheme === themeKey
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                {/* Theme Preview */}
                <div className="mb-3">
                  <div 
                    className="w-full h-20 rounded-lg relative overflow-hidden"
                    style={{ backgroundColor: theme.preview.background }}
                  >
                    {/* Sample messages */}
                    <div className="absolute top-2 right-2">
                      <div 
                        className="text-xs px-2 py-1 rounded-lg text-black"
                        style={{ backgroundColor: theme.preview.ownMessage }}
                      >
                        Hello! 👋
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <div 
                        className="text-xs px-2 py-1 rounded-lg text-black"
                        style={{ backgroundColor: theme.preview.otherMessage }}
                      >
                        Hi there!
                      </div>
                    </div>
                    {/* Send button preview */}
                    <div className="absolute bottom-2 right-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.preview.accent }}
                      >
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Theme Info */}
                <div className="text-center">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    {theme.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {theme.description}
                  </p>
                </div>

                {/* Selected Indicator */}
                {selectedTheme === themeKey && (
                  <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose a theme that matches your style
            </p>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatThemeSelector;
