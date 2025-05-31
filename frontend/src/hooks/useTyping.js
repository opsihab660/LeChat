import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';

export const useTyping = (conversationId, recipientId) => {
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const { startTyping, stopTyping, socket } = useSocket();

  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const lastTypingEventRef = useRef(0);
  const typingDebounceRef = useRef(null);
  const batchTimeoutRef = useRef(null);
  const typingBatch = useRef([]);
  const persistentTypingRef = useRef(false); // Track persistent typing state

  // Enhanced batch typing handler with better consistency
  const batchTypingEvent = useCallback((type) => {
    if (!conversationId || !recipientId) return;

    const event = {
      type,
      conversationId,
      recipientId,
      timestamp: Date.now()
    };

    typingBatch.current.push(event);

    // Clear existing batch timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Optimized batching - reduced to 30ms for better responsiveness
    batchTimeoutRef.current = setTimeout(() => {
      if (typingBatch.current.length > 0) {
        const latestEvent = typingBatch.current[typingBatch.current.length - 1];

        // Only send the latest event to avoid spam
        if (latestEvent.type === 'start') {
          startTyping({ conversationId, recipientId });
          persistentTypingRef.current = true;
        } else {
          stopTyping({ conversationId, recipientId });
          persistentTypingRef.current = false;
        }

        typingBatch.current = [];
      }
    }, 30);
  }, [conversationId, recipientId, startTyping, stopTyping]);

  // Enhanced debounced typing handler with better throttling
  const debouncedTypingStart = useCallback(() => {
    if (!conversationId || !recipientId) return;

    const now = Date.now();

    // Improved throttle - reduced to 150ms to match backend
    if (now - lastTypingEventRef.current < 150) {
      return;
    }

    lastTypingEventRef.current = now;
    batchTypingEvent('start');
  }, [conversationId, recipientId, batchTypingEvent]);

  // Enhanced typing start handler with better consistency
  const handleTypingStart = useCallback(() => {
    if (!conversationId || !recipientId) return;

    // ✅ INSTANT UI UPDATE (0ms lag)
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      setIsTyping(true);
    }

    // Clear existing debounce timeout
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }

    // Optimized debounce - reduced to 80ms for faster network updates
    typingDebounceRef.current = setTimeout(() => {
      debouncedTypingStart();
    }, 80);

    // Clear existing timeout and reset with longer duration for consistency
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // ✅ Enhanced auto-stop with longer timeout for better consistency
    typingTimeoutRef.current = setTimeout(() => {
      // Only stop if we're still in the same typing session
      if (isTypingRef.current && persistentTypingRef.current) {
        handleTypingStop();
      }
    }, 2500); // Increased to 2.5 seconds for better consistency
  }, [conversationId, recipientId, debouncedTypingStart]);

  // Enhanced typing stop handler with better cleanup
  const handleTypingStop = useCallback(() => {
    if (!conversationId || !recipientId) return;

    // Clear all timeouts to prevent conflicts
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = null;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }

    // ✅ INSTANT UI UPDATE with state consistency check
    if (isTypingRef.current) {
      isTypingRef.current = false;
      persistentTypingRef.current = false;
      setIsTyping(false);
      batchTypingEvent('stop');
    }
  }, [conversationId, recipientId, batchTypingEvent]);

  // Listen for typing events from other users
  useEffect(() => {
    if (!socket) return;

    const handleUserTyping = (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => {
          // Use Set for O(1) lookup instead of array.find() for better performance
          const userIds = new Set(prev.map(u => u.userId));
          if (!userIds.has(data.userId)) {
            return [...prev, { userId: data.userId, username: data.username }];
          }
          return prev;
        });
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
      }
    };

    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, [socket, conversationId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleTypingStop();
    };
  }, [handleTypingStop]);

  // Reset typing users when conversation changes
  useEffect(() => {
    setTypingUsers([]);
    handleTypingStop();
  }, [conversationId, handleTypingStop]);

  return {
    isTyping,
    typingUsers,
    handleTypingStart,
    handleTypingStop
  };
};
