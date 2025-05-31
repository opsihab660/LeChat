import { useState, useEffect, useRef, useMemo, memo } from 'react';

const TypingIndicator = memo(({ typingUsers, timestamp, className = '', onVisibilityChange }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const [animationKey, setAnimationKey] = useState(0);
  const animationTimeoutRef = useRef(null);
  const lastTimestampRef = useRef(0);
  const visibilityTimeoutRef = useRef(null);

  // Memoize typing users to prevent unnecessary re-renders
  const hasTypingUsers = useMemo(() => typingUsers.length > 0, [typingUsers.length]);

  // Enhanced visibility handling with better consistency
  useEffect(() => {
    // Clear any existing visibility timeout
    if (visibilityTimeoutRef.current) {
      clearTimeout(visibilityTimeoutRef.current);
      visibilityTimeoutRef.current = null;
    }

    if (hasTypingUsers) {
      // ✅ INSTANT visibility (0ms lag)
      setIsVisible(true);
      setAnimationClass('ultra-fast-typing-enter');

      // Notify parent immediately for instant auto-scroll
      if (onVisibilityChange) {
        onVisibilityChange(true);
      }
    } else {
      setAnimationClass('ultra-fast-typing-exit');

      // Enhanced hide delay for better consistency - prevents flickering
      visibilityTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        if (onVisibilityChange) {
          onVisibilityChange(false);
        }
      }, 500); // Increased to 500ms for better consistency
    }
  }, [hasTypingUsers, onVisibilityChange]);

  // Enhanced animation handling with better consistency
  useEffect(() => {
    if (timestamp && hasTypingUsers && timestamp !== lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;

      // Clear any existing timeout to prevent animation conflicts
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      // Optimized throttle for smooth animation without excessive updates
      animationTimeoutRef.current = setTimeout(() => {
        setAnimationKey(prev => prev + 1);
      }, 20); // Balanced at 20ms for smooth animation
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [timestamp, hasTypingUsers]);

  // Enhanced cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`flex justify-start ${className}`}>
      <div className={`typing-bubble ${animationClass} ultra-fast-typing-container transform-gpu`}>
        {/* WhatsApp-style typing dots */}
        <div className="typing-dots" key={animationKey}>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      </div>
    </div>
  );
});

export default TypingIndicator;
