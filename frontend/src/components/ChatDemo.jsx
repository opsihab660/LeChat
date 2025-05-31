import React, { useState, useEffect } from 'react';
import { useChatTheme } from '../contexts/ChatThemeContext';
import ChatThemeSelector from './ChatThemeSelector';
import { PaintBrushIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

const ChatDemo = () => {
  const { getCurrentTheme } = useChatTheme();
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: "Hey! How are you doing? 😊",
      isOwn: false,
      timestamp: new Date(Date.now() - 300000).toISOString(),
      status: 'read'
    },
    {
      id: 2,
      content: "I'm doing great! Just working on some new features for our chat app. The new themes look amazing! 🎨",
      isOwn: true,
      timestamp: new Date(Date.now() - 240000).toISOString(),
      status: 'read'
    },
    {
      id: 3,
      content: "That's awesome! I love the new animations too ✨",
      isOwn: false,
      timestamp: new Date(Date.now() - 180000).toISOString(),
      status: 'read'
    },
    {
      id: 4,
      content: "Thanks! The send animation is much smoother now 🚀",
      isOwn: true,
      timestamp: new Date(Date.now() - 120000).toISOString(),
      status: 'sent'
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const currentTheme = getCurrentTheme();

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      content: newMessage,
      isOwn: true,
      timestamp: new Date().toISOString(),
      status: 'sending',
      animationClass: 'sending'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate message being sent
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, status: 'sent', animationClass: 'sent' }
            : msg
        )
      );
    }, 1000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Simulate typing indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(prev => !prev);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
      {/* Demo Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chat Theme Demo
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Current theme: <span className="font-medium" style={{ color: currentTheme.preview.accent }}>
              {currentTheme.name}
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowThemeSelector(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <PaintBrushIcon className="w-5 h-5" />
          <span>Change Theme</span>
        </button>
      </div>

      {/* Chat Demo */}
      <div className="h-96 flex flex-col border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 chat-background p-4 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-container ${message.animationClass || ''} flex ${
                message.isOwn ? 'justify-end' : 'justify-start'
              } mb-2`}
            >
              <div className={`message-bubble ${message.isOwn ? 'own' : 'other'} max-w-xs`}>
                <div className="message-content">
                  {message.content}
                </div>
                <div className="message-timestamp">
                  <span>{formatTime(message.timestamp)}</span>
                  {message.isOwn && (
                    <div className="flex items-center">
                      {message.status === 'read' ? (
                        <svg className="w-4 h-4 read-receipt read" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 read-receipt sent" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start mb-2">
              <div className="typing-bubble">
                <div className="typing-dots">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="message-input-container">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="message-input w-full pr-12"
                rows="1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="send-button"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Theme Features */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Enhanced Animations</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Smooth message send animations with optimistic updates and status indicators.
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Custom Themes</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            7 beautiful themes with custom backgrounds and color schemes for both light and dark modes.
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Better Scrolling</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enhanced scroll bars with theme colors and smooth scrolling behavior.
          </p>
        </div>
      </div>

      {/* Theme Selector Modal */}
      <ChatThemeSelector
        isOpen={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />
    </div>
  );
};

export default ChatDemo;
