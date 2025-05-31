import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderTypingIndicator from '../components/HeaderTypingIndicator';
import Message from '../components/Message';
import ReplyPreview from '../components/ReplyPreview';
import TypingIndicator from '../components/TypingIndicator';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import { useChat, useDebounce, useTyping, useUsers } from '../hooks';
// Skeleton Loading Components
import {
    ChatBubbleLeftRightIcon,
    Cog6ToothIcon,
    FaceSmileIcon,
    InformationCircleIcon,
    MagnifyingGlassIcon,
    PaperAirplaneIcon,
    PaintBrushIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import ChatThemeSelector from '../components/ChatThemeSelector';
import CustomEmojiPicker from '../components/CustomEmojiPicker';
import InitialLoader from '../components/InitialLoader';
import LazyLoader from '../components/LazyLoader';
import LazyLoadingTest from '../components/LazyLoadingTest';
import { ConversationListSkeleton } from '../components/skeletons/ConversationSkeleton';
import { MessageListSkeleton } from '../components/skeletons/MessageSkeleton';
import UserProfileModal from '../components/UserProfileModal';
import SettingsModal from '../components/SettingsModal';

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, allUsers, typingUsers: socketTypingUsers, deleteMessage, editMessage, userStatus } = useSocket();
  const { theme, toggleTheme } = useTheme();

  const [message, setMessage] = useState('');
  const [typingTimestamp, setTypingTimestamp] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('profile'); // 'profile' only
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Ref for textarea functionality
  const textareaRef = useRef(null);

  // Custom hooks
  const {
    conversations,
    currentConversation,
    setCurrentConversation,
    messages,
    handleSendMessage,
    selectConversation,
    startConversation,
    isLoading,
    isLoadingMessages,
    isLoadingOlderMessages,
    hasMoreMessages,
    messagesEndRef,
    messagesContainerRef,
    loadTriggerRef,
    forceScrollToBottom,
    handleUserScroll,
    shouldAutoScroll,
    // Conversation lazy loading
    hasMoreConversations,
    isLoadingConversations,
    loadMoreConversations
  } = useChat();

  const {
    users: allUsersList,
    onlineUsers,
    isLoading: isLoadingUsers,
    error: usersError,
    searchQuery,
    setSearchQuery,
    hasMore: hasMoreUsers,
    loadMoreUsers,
    searchUsers
  } = useUsers();

  // Debounced search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Trigger search when debounced query changes
  useEffect(() => {
    // Trigger search whenever the debounced query changes
    // This ensures search is executed after user stops typing for 300ms
    searchUsers(debouncedSearchQuery);
  }, [debouncedSearchQuery, searchUsers]);

  const {
    typingUsers: hookTypingUsers,
    handleTypingStart,
    handleTypingStop
  } = useTyping(
    currentConversation?._id,
    currentConversation?.participant?._id
  );

  // Combine typing users from both sources for current conversation - optimized
  const typingUsers = useMemo(() => {
    if (!currentConversation?._id) return [];

    // Get typing users from socket context for current conversation
    const socketUsers = Array.from(socketTypingUsers.values())
      .filter(user => user.conversationId === currentConversation._id)
      .map(user => ({ userId: user.userId || user.username, username: user.username }));

    // Combine with hook typing users
    const combined = [...hookTypingUsers, ...socketUsers];

    // Remove duplicates more efficiently
    const seen = new Set();
    const unique = combined.filter(user => {
      if (seen.has(user.userId)) return false;
      seen.add(user.userId);
      return true;
    });

    return unique;
  }, [hookTypingUsers, socketTypingUsers, currentConversation?._id]);

  // Helper function to check if user is online - memoized
  const isUserOnline = useCallback((userId) => {
    return allUsers.find(u => u.userId === userId)?.isOnline ||
           onlineUsers.some(u => u.userId === userId);
  }, [allUsers, onlineUsers]);

  // Helper function to get user status - memoized
  const getUserStatus = useCallback((userId) => {
    const user = allUsers.find(u => u.userId === userId);
    if (!user) return 'offline';
    if (user.isOnline) {
      return user.status || 'online';
    }
    return 'offline';
  }, [allUsers]);

  // Helper function to get user status text - memoized
  const getUserStatusText = useCallback((userId) => {
    if (typingUsers.length > 0) return 'Typing...';

    const user = allUsers.find(u => u.userId === userId);
    if (isUserOnline(userId)) {
      return 'Online';
    } else if (user?.lastSeen) {
      const lastSeenDate = new Date(user.lastSeen);
      const now = new Date();
      const diffMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));

      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
      return lastSeenDate.toLocaleDateString();
    }
    return 'Offline';
  }, [typingUsers.length, allUsers, isUserOnline]);

  // Helper function to check if user is typing in a specific conversation - memoized
  const isUserTypingInConversation = useCallback((userId, conversationId) => {
    return typingUsers.some(user =>
      user.userId === userId &&
      user.conversationId === conversationId
    );
  }, [typingUsers]);

  // Enhanced scroll handler - now primarily for user scroll detection
  // Intersection Observer handles the lazy loading
  const handleScroll = useCallback(() => {
    // Handle user scroll detection for auto-scroll behavior
    handleUserScroll();

    // Removed fallback lazy loading to prevent multiple triggers
    // Intersection Observer is the primary method for lazy loading
  }, [handleUserScroll]);

  // Removed debug logs to improve performance

  // Simple conversation filtering for search functionality
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }

    // Filter conversations by participant username
    const searchLower = searchQuery.toLowerCase();
    return conversations.filter(conv =>
      conv.participant?.username?.toLowerCase().includes(searchLower)
    );
  }, [searchQuery, conversations]);

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <SunIcon className="w-5 h-5" />;
      case 'dark':
        return <MoonIcon className="w-5 h-5" />;
      default:
        return <ComputerDesktopIcon className="w-5 h-5" />;
    }
  };



  const handleSubmitMessage = (e) => {
    e.preventDefault();
    if (message.trim() && currentConversation) {
      handleSendMessage(message, 'text', replyingTo?._id);
      setMessage('');
      setReplyingTo(null);
      setShowEmojiPicker(false); // Close emoji picker when message is sent
      handleTypingStop();
    }
  };

  const handleReply = (messageToReply) => {
    setReplyingTo(messageToReply);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };



  // Handle message editing
  const handleEditMessage = async (messageToEdit, newContent) => {
    try {
      if (!currentConversation?._id) {
        console.error('No current conversation');
        return;
      }

      console.log('✏️ Frontend editing message:', messageToEdit._id, 'New content:', newContent);

      editMessage({
        messageId: messageToEdit._id,
        content: newContent,
        conversationId: currentConversation._id
      });

    } catch (error) {
      console.error('Edit message error:', error);
    }
  };

  const handleDeleteMessage = async (messageToDelete) => {
    if (!currentConversation || !messageToDelete) return;

    try {
      console.log('🗑️ Deleting message:', {
        messageId: messageToDelete._id,
        conversationId: currentConversation._id,
        currentConversation: currentConversation
      });

      deleteMessage({
        messageId: messageToDelete._id,
        conversationId: currentConversation._id
      });
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  // Optimized auto-scroll for typing indicators - consolidated logic
  useEffect(() => {
    if (typingUsers.length > 0) {
      // Single scroll attempt with minimal delay
      forceScrollToBottom();

      // One additional scroll after DOM updates - reduced delay
      const timer = setTimeout(() => forceScrollToBottom(), 50);
      return () => clearTimeout(timer);
    }
  }, [typingUsers.length, forceScrollToBottom]);

  // Conditional auto-scroll based on user behavior
  useEffect(() => {
    if (currentConversation && messages.length > 0 && shouldAutoScroll) {
      // Only auto-scroll when user is near bottom or conversation changes
      forceScrollToBottom();
    }
  }, [currentConversation?._id, messages.length, forceScrollToBottom, shouldAutoScroll]);

  // Optimized message change handler with debouncing
  const handleMessageChange = useCallback((e) => {
    const newValue = e.target.value;
    setMessage(newValue);

    // Only trigger typing logic if there's actual content
    if (newValue.trim().length > 0) {
      setTypingTimestamp(Date.now());
      handleTypingStart();
    } else {
      handleTypingStop();
    }
  }, [handleTypingStart, handleTypingStop]);

  // Emoji picker functions
  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const textarea = textareaRef.current;
    let newMessage;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      newMessage = message.slice(0, start) + emoji + message.slice(end);

      setMessage(newMessage);

      // Set cursor position after the emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      // Fallback: append emoji to the end
      newMessage = message + emoji;
      setMessage(newMessage);
    }

    // Trigger typing animation
    if (newMessage.length > 0) {
      setTypingTimestamp(Date.now());
      handleTypingStart();
    }

    // Keep picker open for multiple emoji selection
    // setShowEmojiPicker(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(prev => !prev);
  };

  // Handle profile viewing
  const handleViewProfile = (userId) => {
    if (currentConversation && userId === currentConversation.participant?._id) {
      toggleRightPanel('profile');
    } else {
      setSelectedUserId(userId);
      setShowProfileModal(true);
    }
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedUserId(null);
  };

  // Toggle right panel
  const toggleRightPanel = useCallback((tab = 'profile') => {
    setShowRightPanel(prev => {
      if (prev && rightPanelTab === tab) {
        return false;
      } else {
        setRightPanelTab(tab);
        return true;
      }
    });
  }, [rightPanelTab]);

  // Close right panel if conversation changes
  useEffect(() => {
    setShowRightPanel(false);
  }, [currentConversation?._id]);



  return (
    <div className="chat-container h-screen w-screen flex bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Enhanced Sidebar with Increased Width */}
      <div className={`
        w-full lg:w-96 xl:w-[420px] 2xl:w-[480px] lg:min-w-96 xl:min-w-[420px] 2xl:min-w-[480px] lg:max-w-96 xl:max-w-[420px] 2xl:max-w-[480px]
        bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 dark:from-gray-800 dark:via-gray-800/90 dark:to-gray-700/80
        border-r border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-2xl
        flex flex-col min-h-0
        ${currentConversation
          ? 'hidden lg:flex'
          : 'flex'
        }
        transition-all duration-300 ease-in-out
      `}>
        {/* Enhanced Modern Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Enhanced Logo Container */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-sm opacity-20"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 sm:p-3 rounded-2xl shadow-lg">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate">
                  Chat App
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  {isConnected ? (
                    <>
                      <div className="relative">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                        <div className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping opacity-75"></div>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                        <span className="hidden sm:inline">Connected & Active</span>
                        <span className="sm:hidden">Online</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">
                        <span className="hidden sm:inline">Disconnected</span>
                        <span className="sm:hidden">Offline</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowThemeSelector(true)}
                className="p-2.5 rounded-xl text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200 hover:scale-110 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                title="Chat Themes"
              >
                <PaintBrushIcon className="w-5 h-5" />
              </button>

              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-200 hover:scale-110 border border-transparent hover:border-purple-200 dark:hover:border-purple-700"
                title={`Current theme: ${theme}`}
              >
                {getThemeIcon()}
              </button>

              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2.5 rounded-xl text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 transition-all duration-200 hover:scale-110 border border-transparent hover:border-green-200 dark:hover:border-green-700"
                title="Settings"
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced User Info Section */}
        <div className="p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white/80 to-blue-50/50 dark:from-gray-800/80 dark:to-gray-700/50 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            {/* Enhanced User Avatar */}
            <div className="relative">
              <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                isConnected
                  ? 'ring-2 ring-green-400/50 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
                  : 'ring-2 ring-red-400/50 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
              }`}></div>
              <UserAvatar
                user={user}
                size="lg"
                showStatus={true}
                isOnline={isConnected}
                status={isConnected ? userStatus : 'offline'}
              />
              {/* Status Pulse Animation */}
              {isConnected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-75"></div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <p className="font-bold text-gray-900 dark:text-white text-base sm:text-lg truncate">
                  {user?.username}
                </p>
                {/* Enhanced Status Badge */}
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                  isConnected
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700'
                }`}>
                  {isConnected ? 'Active' : 'Offline'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <div className={`relative w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {isConnected && (
                    <div className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping opacity-75"></div>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                  {isConnected ? 'Connected & Ready' : 'Disconnected'}
                  {isLoadingUsers && (
                    <span className="ml-2 text-blue-600 dark:text-blue-400 animate-pulse">• Loading users...</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Enhanced Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-gray-800/50 dark:to-gray-700/50 backdrop-blur-sm">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <MagnifyingGlassIcon className={`w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-200 ${
                searchQuery ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-blue-500 dark:text-blue-400'
              }`} />
              <input
                type="text"
                placeholder="Search users to start new conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-4 text-sm border-2 border-gray-200/50 dark:border-gray-600/50 rounded-2xl bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white dark:focus:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-2xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-gray-200/80 dark:bg-gray-600/80 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-300/80 dark:hover:bg-gray-500/80 transition-all duration-200 hover:scale-110"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {searchQuery && (
            <div className="mt-3 flex items-center space-x-2 animate-fade-in">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Searching for "<span className="font-semibold">{searchQuery}</span>"...
              </p>
            </div>
          )}
        </div>

        {/* Modern Enhanced Recent Conversations - Full Height */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/40 dark:from-gray-800/90 dark:via-gray-700/80 dark:to-gray-600/70 min-h-0 backdrop-blur-sm">
          {/* Modern Header Section */}
          <div className="p-4 pb-3 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {/* Enhanced Icon Container */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-sm opacity-20"></div>
                  <div className="relative p-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-xl border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm">
                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                <div>
                  <h2 className="text-base font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                    {searchQuery ? 'Search Results' : 'Recent Chats'}
                  </h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      {(searchQuery ? filteredConversations : conversations).length} conversation{(searchQuery ? filteredConversations : conversations).length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Enhanced Search Results Badge */}
              {searchQuery && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-sm"></div>
                  <span className="relative text-xs bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-800 dark:text-blue-200 px-3 py-1.5 rounded-full font-semibold border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm">
                    {filteredConversations.length} found
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="scroll-container flex-1 overflow-y-auto pb-4">
            <InitialLoader
              isLoading={isLoading}
              hasData={conversations.length > 0 || allUsersList.length > 0}
              type="conversations"
              className="h-full"
            >
              {/* Search Results - Show both conversations and users */}
              {searchQuery ? (
              <div className="conversation-list space-y-1 p-2">
                {/* Filtered Conversations */}
                {filteredConversations.length > 0 && (
                  <div className="mb-4">
                    <div className="px-4 py-3 mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-1 h-4 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
                          <h3 className="text-sm font-bold bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-500 bg-clip-text text-transparent uppercase tracking-wide">
                            Conversations
                          </h3>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300/50 to-transparent dark:from-gray-600/50"></div>
                        <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-medium border border-green-200/50 dark:border-green-700/50">
                          {filteredConversations.length}
                        </span>
                      </div>
                    </div>
                    {filteredConversations.map((conversation) => {
                      const isTyping = isUserTypingInConversation(conversation.participant?._id, conversation._id);
                      const isCurrentConversation = currentConversation?._id === conversation._id;
                      const lastMessage = conversation.lastMessage;
                      const isOwnMessage = lastMessage?.sender?._id === user._id || lastMessage?.sender === user._id;

                      return (
                        <button
                          key={conversation._id}
                          onClick={() => selectConversation(conversation)}
                          className={`
                            conversation-item w-full p-3 text-left
                            ${isCurrentConversation
                              ? 'active bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }
                            ${isTyping ? 'ring-2 ring-blue-400 ring-opacity-50 scale-[1.02] shadow-lg' : ''}
                          `}
                        >
                          <div className="flex items-center space-x-3">
                            <UserAvatar
                              user={conversation.participant}
                              showStatus={true}
                              isOnline={isUserOnline(conversation.participant?._id)}
                              status={getUserStatus(conversation.participant?._id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                  {conversation.participant?.username}
                                </p>
                              </div>
                              <p className={`text-sm truncate ${
                                conversation.unreadCount > 0 && !isOwnMessage
                                  ? 'font-semibold text-gray-900 dark:text-white'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {isTyping ? (
                                  <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center">
                                    <span className="mr-1">Typing</span>
                                    <span className="flex space-x-0.5">
                                      <span className="animate-typing-dot">.</span>
                                      <span className="animate-typing-dot animation-delay-200">.</span>
                                      <span className="animate-typing-dot animation-delay-400">.</span>
                                    </span>
                                  </span>
                                ) : (
                                  <>
                                    {isOwnMessage && <span className="text-gray-400 dark:text-gray-500">You: </span>}
                                    {lastMessage?.content || 'No messages yet'}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Available Users for New Conversations with Lazy Loading */}
                {allUsersList.length > 0 && (
                  <div>
                    <div className="px-4 py-3 mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                          <h3 className="text-sm font-bold bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-500 bg-clip-text text-transparent uppercase tracking-wide">
                            Available Users
                          </h3>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300/50 to-transparent dark:from-gray-600/50"></div>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium border border-blue-200/50 dark:border-blue-700/50">
                          {allUsersList.length}
                        </span>
                      </div>
                    </div>
                    <LazyLoader
                      onLoadMore={loadMoreUsers}
                      hasMore={hasMoreUsers}
                      isLoading={isLoadingUsers}
                      className="space-y-1"
                      loadingComponent={
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading more users...</span>
                        </div>
                      }
                    >
                      {allUsersList.map((user) => {
                        // Don't show users who already have conversations
                        const hasConversation = conversations.some(conv =>
                          conv.participant?._id === user._id
                        );

                        if (hasConversation) return null;

                        return (
                          <div
                            key={user._id}
                            className="group relative mx-2 mb-2 animate-slide-in-left stagger-item"
                          >
                            {/* Modern Card Background with Gradient Border */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 animate-gradient-shift"></div>

                            <button
                              onClick={async () => {
                                console.log('🚀 Starting conversation with:', user.username);
                                const conversation = await startConversation(user._id);
                                if (conversation) {
                                  setSearchQuery(''); // Clear search after starting conversation
                                }
                              }}
                              className="relative w-full p-5 sm:p-6 rounded-3xl text-left transition-all duration-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-2xl hover:scale-[1.02] hover:border-blue-300/50 dark:hover:border-blue-600/50 group-hover:shadow-2xl user-card-hover animate-card-hover"
                            >
                              <div className="flex items-center space-x-5">
                                {/* Enhanced Avatar with Status Ring */}
                                <div className="relative flex-shrink-0">
                                  <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                                    isUserOnline(user._id)
                                      ? 'ring-3 ring-green-400/50 ring-offset-3 ring-offset-white dark:ring-offset-gray-800'
                                      : 'ring-3 ring-gray-300/30 ring-offset-3 ring-offset-white dark:ring-offset-gray-800'
                                  }`}></div>
                                  <UserAvatar
                                    user={user}
                                    showStatus={true}
                                    isOnline={isUserOnline(user._id)}
                                    status={getUserStatus(user._id)}
                                    size="xl"
                                  />
                                  {/* Online Pulse Animation */}
                                  {isUserOnline(user._id) && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full animate-ping opacity-75"></div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  {/* Username with Modern Typography */}
                                  <div className="flex items-center space-x-3 mb-2">
                                    <p className="font-bold text-gray-900 dark:text-white truncate text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                      {user.username}
                                    </p>
                                    {/* Enhanced Status Badge */}
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                                      isUserOnline(user._id)
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'
                                        : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                                    }`}>
                                      {isUserOnline(user._id) ? 'Online' : 'Offline'}
                                    </span>
                                  </div>

                                  {/* Action Text with Enhanced Styling */}
                                  <div className="flex items-center space-x-2 text-sm">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                                      Click to start conversation
                                    </span>
                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewProfile(user._id);
                                      }}
                                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold hover:underline transition-colors"
                                    >
                                      View profile
                                    </button>
                                  </div>
                                </div>

                                {/* Enhanced Quick Action Buttons */}
                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-3 group-hover:translate-x-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Add quick message functionality
                                    }}
                                    className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-all duration-200 hover:scale-110 quick-action-btn shadow-lg"
                                    title="Quick message"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Add to favorites functionality
                                    }}
                                    className="p-2.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-all duration-200 hover:scale-110 quick-action-btn shadow-lg"
                                    title="Add to favorites"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </LazyLoader>
                  </div>
                )}

                {/* No Results */}
                {filteredConversations.length === 0 && allUsersList.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full p-8">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MagnifyingGlassIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      No results found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                      No users or conversations match "<span className="font-medium">{searchQuery}</span>"
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </div>
            ) : isLoadingUsers && conversations.length === 0 ? (
              /* Skeleton Loading for Conversations */
              <ConversationListSkeleton
                count={6}
                variant="shimmer"
                staggered={true}
                className="p-0"
              />
            ) : conversations.length === 0 && allUsersList.length > 0 ? (
              /* Show available users when no conversations exist */
              <div className="space-y-1 p-2">
                <div className="mb-4 text-center p-4">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Start Your First Conversation
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Choose someone to chat with from the users below
                  </p>
                </div>
                <div className="px-4 py-3 mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                      <h3 className="text-sm font-bold bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-500 bg-clip-text text-transparent uppercase tracking-wide">
                        Available Users
                      </h3>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-300/50 to-transparent dark:from-gray-600/50"></div>
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full font-medium border border-purple-200/50 dark:border-purple-700/50">
                      {allUsersList.length}
                    </span>
                  </div>
                </div>
                <LazyLoader
                  onLoadMore={loadMoreUsers}
                  hasMore={hasMoreUsers}
                  isLoading={isLoadingUsers}
                  className="space-y-1"
                  loadingComponent={
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading more users...</span>
                    </div>
                  }
                >
                  {allUsersList.map((user) => (
                    <div
                      key={user._id}
                      className="group relative mx-2 mb-2 animate-slide-in-left stagger-item"
                    >
                      {/* Modern Card Background with Gradient Border */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 animate-gradient-shift"></div>

                      <button
                        onClick={async () => {
                          console.log('🚀 Starting conversation with:', user.username);
                          const conversation = await startConversation(user._id);
                          if (conversation) {
                            console.log('✅ Conversation started successfully');
                          }
                        }}
                        className="relative w-full p-5 sm:p-6 rounded-3xl text-left transition-all duration-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-2xl hover:scale-[1.02] hover:border-blue-300/50 dark:hover:border-blue-600/50 group-hover:shadow-2xl user-card-hover animate-card-hover"
                      >
                        <div className="flex items-center space-x-5">
                          {/* Enhanced Avatar with Status Ring */}
                          <div className="relative flex-shrink-0">
                            <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                              isUserOnline(user._id)
                                ? 'ring-3 ring-green-400/50 ring-offset-3 ring-offset-white dark:ring-offset-gray-800'
                                : 'ring-3 ring-gray-300/30 ring-offset-3 ring-offset-white dark:ring-offset-gray-800'
                            }`}></div>
                            <UserAvatar
                              user={user}
                              showStatus={true}
                              isOnline={isUserOnline(user._id)}
                              status={getUserStatus(user._id)}
                              size="xl"
                            />
                            {/* Online Pulse Animation */}
                            {isUserOnline(user._id) && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full animate-ping opacity-75"></div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Username with Modern Typography */}
                            <div className="flex items-center space-x-3 mb-2">
                              <p className="font-bold text-gray-900 dark:text-white truncate text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {user.username}
                              </p>
                              {/* Enhanced Status Badge */}
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                                isUserOnline(user._id)
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'
                                  : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                              }`}>
                                {isUserOnline(user._id) ? 'Online' : 'Offline'}
                              </span>
                            </div>

                            {/* Action Text with Enhanced Styling */}
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="text-gray-600 dark:text-gray-400 font-medium">
                                Click to start conversation
                              </span>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewProfile(user._id);
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold hover:underline transition-colors"
                              >
                                View profile
                              </button>
                            </div>
                          </div>

                          {/* Enhanced Quick Action Buttons */}
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-3 group-hover:translate-x-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Add quick message functionality
                              }}
                              className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-all duration-200 hover:scale-110 quick-action-btn shadow-lg"
                              title="Quick message"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Add to favorites functionality
                              }}
                              className="p-2.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-all duration-200 hover:scale-110 quick-action-btn shadow-lg"
                              title="Add to favorites"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </LazyLoader>
              </div>
            ) : conversations.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ChatBubbleLeftRightIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No users available
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  {usersError ? 'Failed to load users. Please refresh the page.' : 'No users found to start conversations with.'}
                </p>
                {usersError && (
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Refresh Page
                  </button>
                )}
              </div>
            ) : (
              /* Conversations List with Lazy Loading */
              <LazyLoader
                onLoadMore={loadMoreConversations}
                hasMore={hasMoreConversations}
                isLoading={isLoadingConversations}
                className="conversation-list space-y-1 p-2"
                loadingComponent={
                  <ConversationListSkeleton
                    count={3}
                    variant="shimmer"
                    staggered={true}
                    className="p-0"
                  />
                }
              >
                {(searchQuery ? filteredConversations : conversations).map((conversation) => {
                  const isTyping = isUserTypingInConversation(conversation.participant?._id, conversation._id);
                  const isCurrentConversation = currentConversation?._id === conversation._id;
                  const lastMessage = conversation.lastMessage;
                  const isOwnMessage = lastMessage?.sender?._id === user._id || lastMessage?.sender === user._id;

                  return (
                    <button
                      key={conversation._id}
                      onClick={() => selectConversation(conversation)}
                      className={`
                        conversation-item w-full p-3 text-left
                        ${isCurrentConversation
                          ? 'active bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                        ${isTyping ? 'ring-2 ring-blue-400 ring-opacity-50 scale-[1.02] shadow-lg' : ''}
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <UserAvatar
                          user={conversation.participant}
                          showStatus={true}
                          isOnline={isUserOnline(conversation.participant?._id)}
                          status={getUserStatus(conversation.participant?._id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProfile(conversation.participant?._id);
                              }}
                              className="font-medium text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer"
                            >
                              {conversation.participant?.username}
                            </span>
                            {/* Seen/Sent Status for last message */}
                            {lastMessage && isOwnMessage && (
                              <div className="flex items-center space-x-1 ml-2">
                                {lastMessage.readBy && lastMessage.readBy.length > 0 ? (
                                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            )}
                          </div>
                          <p className={`text-sm truncate ${
                            conversation.unreadCount > 0 && !isOwnMessage
                              ? 'font-semibold text-gray-900 dark:text-white'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {isTyping ? (
                              <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center">
                                <span className="mr-1">Typing</span>
                                <span className="flex space-x-0.5">
                                  <span className="animate-typing-dot">.</span>
                                  <span className="animate-typing-dot animation-delay-200">.</span>
                                  <span className="animate-typing-dot animation-delay-400">.</span>
                                </span>
                              </span>
                            ) : (
                              <>
                                {isOwnMessage && <span className="text-gray-400 dark:text-gray-500">You: </span>}
                                {lastMessage?.content || 'No messages yet'}
                              </>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {lastMessage?.createdAt
                              ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : ''
                            }
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </LazyLoader>
            )}
            </InitialLoader>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {currentConversation ? (
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-800">
              <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => {
                      setCurrentConversation(null);
                      // Ensure scroll position is maintained when going back to user list
                    }}
                    className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="relative flex-shrink-0">
                    <UserAvatar
                      user={currentConversation.participant}
                      size="md"
                      showStatus={true}
                      isOnline={isUserOnline(currentConversation.participant?._id)}
                      status={getUserStatus(currentConversation.participant?._id)}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => handleViewProfile(currentConversation.participant?._id)}
                      className="text-left w-full hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-1 -m-1 transition-colors"
                    >
                      <h2 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {currentConversation.participant?.username}
                      </h2>
                      <p className={`text-xs sm:text-sm ${
                        typingUsers.length > 0
                          ? 'text-blue-600 dark:text-blue-400'
                          : isUserOnline(currentConversation.participant?._id)
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {getUserStatusText(currentConversation.participant?._id)}
                      </p>
                    </button>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    {/* Info Button - Single toggle for right panel */}
                    <button
                      onClick={() => toggleRightPanel(rightPanelTab || 'profile')}
                      className={`p-2 rounded-full transition-colors ${
                        showRightPanel
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                      title="View details"
                    >
                      <InformationCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Enhanced Typing Status Bar - More Visible */}
              <HeaderTypingIndicator
                typingUsers={typingUsers}
                currentUser={currentConversation.participant}
              />
            </div>

            {/* Main Chat Container with Right Panel */}
            <div className="flex-1 flex overflow-hidden">
              {/* Messages Area with Enhanced Lazy Loading */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className={`overflow-y-auto p-2 sm:p-4 chat-background scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent ${
                  showRightPanel ? 'hidden md:block md:flex-1' : 'flex-1'
                }`}
              >
                {isLoadingMessages && messages.length === 0 ? (
                  <MessageListSkeleton
                    count={3}
                    variant="shimmer"
                    randomPattern={true}
                    className="py-4" 
                  />
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Start a conversation with {currentConversation.participant?.username}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {/* Load Trigger Element for Intersection Observer - positioned at top */}
                    {hasMoreMessages && (
                      <div
                        ref={loadTriggerRef}
                        className="flex justify-center py-2"
                        style={{ minHeight: '40px' }}
                      >
                        {isLoadingOlderMessages ? (
                          <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                            <span className="text-sm font-medium">Loading older messages...</span>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100/80 dark:bg-gray-800/80 px-3 py-1 rounded-full backdrop-blur-sm">
                            Scroll up for more messages
                          </div>
                        )}
                      </div>
                    )}

                    {/* Messages */}
                    {messages.map((msg) => (
                      <div key={msg._id} data-message-id={msg._id}>
                        <Message
                          message={msg}
                          isOwn={msg.sender._id === user._id}
                          currentUser={user}
                          conversationParticipant={currentConversation?.participant}
                          onReply={handleReply}
                          onEdit={handleEditMessage}
                          onDelete={handleDeleteMessage}
                        />
                      </div>
                    ))}

                    {/* Modern Typing indicator */}
                    <TypingIndicator
                      typingUsers={typingUsers}
                      timestamp={typingTimestamp}
                    />

                    {/* Auto-scroll target */}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Right Side Panel - Responsive */}
              <div 
                className={`bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 h-full overflow-hidden transition-all duration-300 ease-in-out ${
                  showRightPanel 
                    ? 'w-full md:w-80 lg:w-96 opacity-100' 
                    : 'w-0 opacity-0'
                }`}
              >
                {showRightPanel && (
                  <div className="h-full flex flex-col">
                    {/* Panel Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {rightPanelTab === 'profile' ? 'Profile Details' : 'Shared Media'}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {/* Mobile Back Button */}
                        <button
                          onClick={() => setShowRightPanel(false)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Panel Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => setRightPanelTab('profile')}
                        className={`flex-1 py-3 text-sm font-medium text-center ${
                          rightPanelTab === 'profile'
                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => setRightPanelTab('media')}
                        className={`flex-1 py-3 text-sm font-medium text-center ${
                          rightPanelTab === 'media'
                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        Media
                      </button>
                    </div>

                    {/* Panel Content - Responsive Padding */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                      {rightPanelTab === 'profile' && currentConversation?.participant && (
                        <div className="p-3 sm:p-4">
                          {/* User Profile Section */}
                          <div className="text-center mb-6">
                            <div className="mb-4">
                              <UserAvatar
                                user={currentConversation.participant}
                                size="xl"
                                showStatus={true}
                                isOnline={isUserOnline(currentConversation.participant?._id)}
                                status={getUserStatus(currentConversation.participant?._id)}
                                className="mx-auto"
                              />
                            </div>
                            
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                              {currentConversation.participant.displayName || currentConversation.participant.username}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-2">
                              @{currentConversation.participant.username}
                            </p>
                            
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm">
                              <span className={`w-2 h-2 rounded-full mr-2 ${
                                isUserOnline(currentConversation.participant?._id) 
                                  ? 'bg-green-500' 
                                  : 'bg-gray-400'
                              }`}></span>
                              <span>{getUserStatusText(currentConversation.participant?._id)}</span>
                            </div>
                          </div>

                          {/* Bio Section */}
                          {currentConversation.participant.bio && (
                            <div className="mb-6">
                              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Bio
                              </h4>
                              <p className="text-gray-800 dark:text-gray-200 text-sm">
                                {currentConversation.participant.bio}
                              </p>
                            </div>
                          )}

                          {/* User Details */}
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                              Information
                            </h4>
                            <div className="space-y-3">
                              {currentConversation.participant.fullName && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Full Name
                                  </label>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {currentConversation.participant.fullName}
                                  </p>
                                </div>
                              )}
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  Username
                                </label>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {currentConversation.participant.username}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                              Actions
                            </h4>
                            <div className="space-y-2">
                              <button
                                onClick={() => navigate(`/profile/${currentConversation.participant._id}`)}
                                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                              >
                                <span>View Full Profile</span>
                              </button>
                              
                              <button
                                className="w-full py-2 px-4 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center space-x-2"
                              >
                                <span>Block User</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      

                    </div>

                    {/* Back to Chat Button - Mobile Only */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 md:hidden">
                      <button
                        onClick={() => setShowRightPanel(false)}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
                      >
                        Back to Chat
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reply Preview */}
            <ReplyPreview
              replyingTo={replyingTo}
              onCancel={handleCancelReply}
              currentUser={user}
              conversationParticipant={currentConversation?.participant}
            />

            {/* Message Input */}
            <div className="message-input-container relative">
              {/* Custom Emoji Picker */}
              <div className="absolute bottom-full right-2 sm:right-3 mb-2 z-50">
                <CustomEmojiPicker
                  isVisible={showEmojiPicker}
                  onEmojiClick={handleEmojiClick}
                  onClose={() => setShowEmojiPicker(false)}
                />
              </div>

              <form onSubmit={handleSubmitMessage} className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleMessageChange}
                    onFocus={() => {
                      // Optional: Could trigger typing start on focus if there's content
                      if (message.trim()) {
                        handleTypingStart();
                      }
                    }}
                    onBlur={() => {
                      // Stop typing when user leaves the input (mobile keyboards)
                      handleTypingStop();
                    }}
                    placeholder={`Message ${currentConversation.participant?.username}...`}
                    className="message-input w-full pr-12"
                    autoComplete="off"
                    rows="1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitMessage(e);
                      }
                      // Removed redundant typing logic from onKeyDown since onChange handles it
                    }}
                  />
                  {/* Enhanced Emoji Button */}
                  <button
                    type="button"
                    className={`absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                      showEmojiPicker
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={toggleEmojiPicker}
                    title="Add emoji"
                  >
                    <FaceSmileIcon className="w-5 h-5" />
                  </button>
                </div>



                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="send-button"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="text-center max-w-md mx-auto">
              <ChatBubbleLeftRightIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Welcome to Chat App
              </h2>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                <span className="hidden sm:inline">Select a user from the sidebar to start chatting</span>
                <span className="sm:hidden">Tap a user to start chatting</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Performance Monitor - Only in development */}
      {process.env.NODE_ENV === 'development' && (
        <LazyLoadingTest enabled={true} />
      )}

      {/* User Profile Modal - Now only used for non-current conversation users */}
      <UserProfileModal
        userId={selectedUserId}
        isOpen={showProfileModal}
        onClose={handleCloseProfileModal}
      />

      {/* Chat Theme Selector */}
      <ChatThemeSelector
        isOpen={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />

      {/* Modern Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

    </div>
  );
};

export default Chat;
