import React, { useState, useEffect, useRef } from 'react';
import { 
  WifiIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useSocket } from '../contexts/SocketContext';
import useEnhancedOnlineStatus from '../hooks/useEnhancedOnlineStatus';

const ConnectionStatusBar = ({ className = '' }) => {
  const { isConnected, connectionQuality } = useSocket();
  const { isOnline, effectiveType, downlink, rtt } = useEnhancedOnlineStatus();

  // Only show if there's an issue
  const shouldShow = !isConnected || !isOnline || connectionQuality === 'poor';

  if (!shouldShow) return null;

  // 🎨 Get status configuration
  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: XCircleIcon,
        color: 'bg-red-500',
        textColor: 'text-white',
        message: 'No internet connection',
        action: 'Check your network settings'
      };
    }
    
    if (!isConnected) {
      return {
        icon: ArrowPathIcon,
        color: 'bg-orange-500',
        textColor: 'text-white',
        message: 'Reconnecting to chat server...',
        action: 'Please wait'
      };
    }
    
    if (connectionQuality === 'poor' || networkQuality === 'poor') {
      return {
        icon: ExclamationTriangleIcon,
        color: 'bg-yellow-500',
        textColor: 'text-white',
        message: 'Poor connection quality',
        action: `${effectiveType?.toUpperCase()} • ${downlink}Mbps • ${rtt}ms`
      };
    }
    
    return {
      icon: WifiIcon,
      color: 'bg-green-500',
      textColor: 'text-white',
      message: 'Connected',
      action: `${effectiveType?.toUpperCase()} • ${downlink}Mbps`
    };
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className={`
      fixed top-0 left-0 right-0 z-50 
      ${config.color} ${config.textColor}
      transition-all duration-300 ease-in-out
      ${className}
    `}>
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IconComponent className={`
              w-5 h-5 
              ${!isConnected ? 'animate-spin' : ''}
            `} />
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
              <span className="font-medium text-sm">
                {config.message}
              </span>
              {config.action && (
                <span className="text-xs opacity-90">
                  {config.action}
                </span>
              )}
            </div>
          </div>
          
          {/* Connection Quality Indicator */}
          {isConnected && isOnline && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <span className="text-xs opacity-75">Quality:</span>
                <div className="flex space-x-0.5">
                  {[1, 2, 3, 4].map((bar) => (
                    <div
                      key={bar}
                      className={`
                        w-1 bg-white rounded-sm
                        ${bar === 1 ? 'h-2' : bar === 2 ? 'h-3' : bar === 3 ? 'h-4' : 'h-5'}
                        ${
                          (connectionQuality === 'excellent' && bar <= 4) ||
                          (connectionQuality === 'good' && bar <= 3) ||
                          (connectionQuality === 'fair' && bar <= 2) ||
                          (connectionQuality === 'poor' && bar <= 1)
                            ? 'opacity-100'
                            : 'opacity-30'
                        }
                      `}
                    />
                  ))}
                </div>
              </div>
              
              {/* Connection quality info */}
              <div className="text-xs opacity-75">
                {effectiveType?.toUpperCase()} • {downlink}Mbps • {rtt}ms
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 🔄 Mini Connection Indicator (for header/sidebar)
export const MiniConnectionIndicator = ({ className = '' }) => {
  const { isConnected, connectionQuality } = useSocket();
  const { isOnline } = useEnhancedOnlineStatus();

  const getIndicatorColor = () => {
    if (!isOnline || !isConnected) return 'bg-red-500';
    if (connectionQuality === 'poor') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTooltipText = () => {
    if (!isOnline) return 'No internet connection';
    if (!isConnected) return 'Disconnected from chat server';
    if (connectionQuality === 'poor') return 'Poor connection quality';
    return 'Connected';
  };

  return (
    <div className={`relative group ${className}`}>
      <div 
        className={`
          w-2 h-2 rounded-full 
          ${getIndicatorColor()}
          ${!isConnected ? 'animate-pulse' : ''}
        `}
        title={getTooltipText()}
      />
      
      {/* Tooltip */}
      <div className="
        absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
        bg-gray-900 text-white text-xs rounded py-1 px-2
        opacity-0 group-hover:opacity-100 transition-opacity
        pointer-events-none whitespace-nowrap z-50
      ">
        {getTooltipText()}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
};

export default ConnectionStatusBar;
