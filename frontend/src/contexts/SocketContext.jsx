import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [connectionQuality, setConnectionQuality] = useState('good'); // good, poor, offline
  const [userStatus, setUserStatus] = useState('online'); // online, away, busy, offline

  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const heartbeatInterval = useRef(null);
  const activityTimeout = useRef(null);
  const lastActivity = useRef(Date.now());
  const isPageVisible = useRef(true);

  // 🔄 Start heartbeat mechanism
  const startHeartbeat = useCallback((socket) => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }

    heartbeatInterval.current = setInterval(() => {
      if (socket && socket.connected) {
        socket.emit('heartbeat');
      }
    }, 30000); // Send heartbeat every 30 seconds
  }, []);

  // ⏰ Track user activity
  const updateActivity = useCallback((type = 'active') => {
    lastActivity.current = Date.now();

    if (socket && socket.connected) {
      socket.emit('user_activity', { type });
    }

    // Reset activity timeout
    if (activityTimeout.current) {
      clearTimeout(activityTimeout.current);
    }

    // Set user as away after 5 minutes of inactivity
    activityTimeout.current = setTimeout(() => {
      if (isPageVisible.current && userStatus !== 'away') {
        setUserStatus('away');
        if (socket && socket.connected) {
          socket.emit('update_status', { status: 'away' });
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }, [socket, userStatus]);

  // 📱 Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden;

      if (document.hidden) {
        // Page is hidden, user might be away
        if (userStatus === 'online') {
          setUserStatus('away');
          if (socket && socket.connected) {
            socket.emit('update_status', { status: 'away' });
          }
        }
      } else {
        // Page is visible, user is back
        if (userStatus === 'away') {
          setUserStatus('online');
          lastActivity.current = Date.now();
          if (socket && socket.connected) {
            socket.emit('user_activity', { type: 'active' });
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [socket, userStatus]);

  // 🖱️ Track mouse and keyboard activity
  useEffect(() => {
    const handleActivity = () => {
      if (isPageVisible.current) {
        lastActivity.current = Date.now();

        if (socket && socket.connected) {
          socket.emit('user_activity', { type: 'active' });
        }

        if (userStatus !== 'online') {
          setUserStatus('online');
        }

        // Reset activity timeout
        if (activityTimeout.current) {
          clearTimeout(activityTimeout.current);
        }

        // Set user as away after 5 minutes of inactivity
        activityTimeout.current = setTimeout(() => {
          if (isPageVisible.current && userStatus !== 'away') {
            setUserStatus('away');
            if (socket && socket.connected) {
              socket.emit('update_status', { status: 'away' });
            }
          }
        }, 5 * 60 * 1000); // 5 minutes
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [socket, userStatus]);

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && token && user) {
      const newSocket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('✅ Connected to server');
        setIsConnected(true);
        setSocket(newSocket);
        setConnectionQuality('good');
        reconnectAttempts.current = 0;

        // 🔄 Start heartbeat
        startHeartbeat(newSocket);

        // ⏰ Initialize activity tracking
        lastActivity.current = Date.now();

        toast.success('Connected to chat server');
      });

      // 🔄 Handle heartbeat acknowledgment
      newSocket.on('heartbeat_ack', () => {
        setConnectionQuality('good');
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from server:', reason);
        setIsConnected(false);
        setConnectionQuality('offline');

        // 🔄 Stop heartbeat
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = null;
        }

        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setIsConnected(false);
        setConnectionQuality('poor');

        reconnectAttempts.current += 1;

        // 🔄 Exponential backoff with jitter
        const baseDelay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;

        if (reconnectAttempts.current <= maxReconnectAttempts) {
          console.log(`🔄 Retrying connection in ${Math.round(delay/1000)}s... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
          toast.error(`Connection failed. Retrying in ${Math.round(delay/1000)}s... (${reconnectAttempts.current}/${maxReconnectAttempts})`);

          setTimeout(() => {
            if (reconnectAttempts.current <= maxReconnectAttempts) {
              newSocket.connect();
            }
          }, delay);
        } else {
          console.log('❌ Max reconnection attempts reached');
          setConnectionQuality('offline');
          toast.error('Failed to connect to chat server. Please refresh the page.');
        }
      });



      // All users status events
      newSocket.on('all_users_status', (users) => {
        console.log('👥 Received all users status:', users.length, 'users');
        setAllUsers(users);
        // Filter online users
        const online = users.filter(u => u.isOnline);
        console.log('🟢 Online users:', online.length);
        setOnlineUsers(online);
      });

      // User status change events (online/offline)
      newSocket.on('user_status_changed', (userData) => {

        // Update all users list
        setAllUsers(prev => {
          const filtered = prev.filter(u => u.userId !== userData.userId);
          return [...filtered, userData].sort((a, b) => {
            // Sort: online users first, then by last seen
            if (a.isOnline && !b.isOnline) return -1;
            if (!a.isOnline && b.isOnline) return 1;
            return new Date(b.lastSeen) - new Date(a.lastSeen);
          });
        });

        // Update online users list
        if (userData.isOnline) {
          setOnlineUsers(prev => {
            const filtered = prev.filter(u => u.userId !== userData.userId);
            return [...filtered, userData];
          });
          if (userData.userId !== user._id) {
            toast.success(`${userData.username} is now online`, {
              duration: 2000,
              icon: '🟢'
            });
          }
        } else {
          setOnlineUsers(prev => prev.filter(u => u.userId !== userData.userId));
          if (userData.userId !== user._id) {
            toast(`${userData.username} went offline`, {
              duration: 2000,
              icon: '🔴'
            });
          }
        }
      });

      // ✅ ENHANCED TYPING EVENTS - Better consistency and state management
      newSocket.on('user_typing', (data) => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          const userId = data.userId;

          // Clear any existing timeout for this user to prevent conflicts
          const existingUser = newMap.get(userId);
          if (existingUser && existingUser.timeoutId) {
            clearTimeout(existingUser.timeoutId);
          }

          // Create new timeout for auto-cleanup
          const timeoutId = setTimeout(() => {
            setTypingUsers(current => {
              const currentMap = new Map(current);
              const currentUser = currentMap.get(userId);
              // Only remove if this is the same timeout (prevents race conditions)
              if (currentUser && currentUser.timeoutId === timeoutId) {
                currentMap.delete(userId);
              }
              return currentMap;
            });
          }, 3200); // Slightly longer than backend timeout for consistency

          newMap.set(userId, {
            username: data.username,
            conversationId: data.conversationId,
            timestamp: data.timestamp || Date.now(),
            timeoutId: timeoutId
          });
          return newMap;
        });
      });

      newSocket.on('user_stopped_typing', (data) => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          const userId = data.userId;
          const existingUser = newMap.get(userId);

          // Clear timeout if it exists
          if (existingUser && existingUser.timeoutId) {
            clearTimeout(existingUser.timeoutId);
          }

          newMap.delete(userId);
          return newMap;
        });
      });

      // Message events
      newSocket.on('new_message', () => {
        // This will be handled by the Chat component
      });

      newSocket.on('message_sent', () => {
        // This will be handled by the Chat component
      });

      newSocket.on('message_error', (error) => {
        toast.error(error.error || 'Failed to send message');
      });

      // Reaction events
      newSocket.on('reaction_added', () => {
        // This will be handled by the Chat component
      });

      newSocket.on('reaction_error', (error) => {
        toast.error(error.error || 'Failed to add reaction');
      });

      // Read receipt events
      newSocket.on('message_read', () => {
        // This will be handled by the Chat component
      });

      newSocket.on('read_error', (error) => {
        console.error('Read receipt error:', error);
        toast.error(error.error || 'Failed to mark messages as read');
      });

      // Edit message events
      newSocket.on('message_edited', () => {
        // This will be handled by the Chat component
      });

      newSocket.on('edit_error', (error) => {
        console.error('Edit message error:', error);
        toast.error(error.error || 'Failed to edit message');
      });

      // Delete message events
      newSocket.on('message_deleted', () => {
        // This will be handled by the Chat component
      });

      newSocket.on('delete_error', (error) => {
        console.error('Delete message error:', error);
        toast.error(error.error || 'Failed to delete message');
      });



      return () => {
        // 🔄 Cleanup heartbeat
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = null;
        }

        // ⏰ Cleanup activity timeout
        if (activityTimeout.current) {
          clearTimeout(activityTimeout.current);
          activityTimeout.current = null;
        }

        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setConnectionQuality('offline');
        setOnlineUsers([]);
        setAllUsers([]);
        setTypingUsers(new Map());
      };
    }
  }, [isAuthenticated, token, user, startHeartbeat]);

  // Socket helper functions
  const sendMessage = (messageData) => {
    if (socket && isConnected) {
      socket.emit('send_message', messageData);
    } else {
      toast.error('Not connected to server');
    }
  };

  const startTyping = (conversationData) => {
    if (socket && isConnected) {
      socket.emit('typing_start', conversationData);
    }
  };

  const stopTyping = (conversationData) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', conversationData);
    }
  };

  const addReaction = (messageId, emoji) => {
    if (socket && isConnected) {
      socket.emit('add_reaction', { messageId, emoji });
    } else {
      toast.error('Not connected to server');
    }
  };

  const markMessagesAsRead = (data) => {
    if (socket && isConnected) {
      socket.emit('mark_messages_read', data);
    }
  };

  const updateStatus = (status) => {
    if (socket && isConnected) {
      socket.emit('update_status', { status });
    }
  };

  const editMessage = (messageData) => {
    if (socket && isConnected) {
      socket.emit('edit_message', messageData);
    } else {
      toast.error('Not connected to server');
    }
  };

  const deleteMessage = (messageData) => {
    if (socket && isConnected) {
      socket.emit('delete_message', messageData);
    } else {
      toast.error('Not connected to server');
    }
  };

  const value = {
    socket,
    isConnected,
    connectionQuality,
    userStatus,
    onlineUsers,
    allUsers,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    addReaction,
    markMessagesAsRead,
    updateStatus,
    editMessage,
    deleteMessage,
    updateActivity,
    setUserStatus
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
