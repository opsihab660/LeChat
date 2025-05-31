import React, { createContext, useContext, useEffect, useState } from 'react';

const ChatThemeContext = createContext();

export const ChatThemeProvider = ({ children }) => {
  const [chatTheme, setChatTheme] = useState(() => {
    // Get chat theme from localStorage or default to 'whatsapp'
    const savedTheme = localStorage.getItem('chatTheme');
    return savedTheme || 'whatsapp';
  });

  const themes = {
    whatsapp: {
      name: 'WhatsApp',
      description: 'Classic WhatsApp green theme',
      preview: {
        background: '#efeae2',
        ownMessage: '#d9fdd3',
        otherMessage: '#ffffff',
        accent: '#00a884'
      }
    },
    ocean: {
      name: 'Ocean Blue',
      description: 'Calm ocean blue theme',
      preview: {
        background: '#e3f2fd',
        ownMessage: '#bbdefb',
        otherMessage: '#ffffff',
        accent: '#2196f3'
      }
    },
    purple: {
      name: 'Purple Dream',
      description: 'Elegant purple theme',
      preview: {
        background: '#f3e5f5',
        ownMessage: '#e1bee7',
        otherMessage: '#ffffff',
        accent: '#9c27b0'
      }
    },
    forest: {
      name: 'Forest Green',
      description: 'Natural forest green theme',
      preview: {
        background: '#e8f5e8',
        ownMessage: '#c8e6c9',
        otherMessage: '#ffffff',
        accent: '#4caf50'
      }
    },
    sunset: {
      name: 'Sunset Orange',
      description: 'Warm sunset orange theme',
      preview: {
        background: '#fff3e0',
        ownMessage: '#ffcc80',
        otherMessage: '#ffffff',
        accent: '#ff9800'
      }
    },
    rose: {
      name: 'Rose Pink',
      description: 'Romantic rose pink theme',
      preview: {
        background: '#fce4ec',
        ownMessage: '#f8bbd9',
        otherMessage: '#ffffff',
        accent: '#e91e63'
      }
    },
    midnight: {
      name: 'Midnight Black',
      description: 'Sleek midnight black theme',
      preview: {
        background: '#f5f5f5',
        ownMessage: '#e0e0e0',
        otherMessage: '#ffffff',
        accent: '#666666'
      }
    }
  };

  // Apply theme to document
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      
      // Set the chat theme data attribute
      root.setAttribute('data-chat-theme', chatTheme);
    };

    applyTheme();
  }, [chatTheme]);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('chatTheme', chatTheme);
  }, [chatTheme]);

  const setTheme = (newTheme) => {
    if (themes[newTheme]) {
      setChatTheme(newTheme);
    }
  };

  const getCurrentTheme = () => {
    return themes[chatTheme] || themes.whatsapp;
  };

  const value = {
    chatTheme,
    themes,
    setTheme,
    getCurrentTheme
  };

  return (
    <ChatThemeContext.Provider value={value}>
      {children}
    </ChatThemeContext.Provider>
  );
};

export const useChatTheme = () => {
  const context = useContext(ChatThemeContext);
  if (!context) {
    throw new Error('useChatTheme must be used within a ChatThemeProvider');
  }
  return context;
};

export default ChatThemeContext;
