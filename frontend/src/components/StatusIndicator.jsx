import React from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  XCircleIcon,
  SignalIcon,
  WifiIcon
} from '@heroicons/react/24/outline';

const StatusIndicator = ({ 
  status = 'offline', 
  size = 'sm', 
  showText = false, 
  showIcon = true,
  className = '',
  connectionQuality = 'good'
}) => {
  // 🎨 Status configurations
  const statusConfig = {
    online: {
      color: 'text-green-500',
      bgColor: 'bg-green-500',
      icon: CheckCircleIcon,
      text: 'Online',
      pulse: false
    },
    away: {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500',
      icon: ClockIcon,
      text: 'Away',
      pulse: true
    },
    busy: {
      color: 'text-red-500',
      bgColor: 'bg-red-500',
      icon: ExclamationTriangleIcon,
      text: 'Busy',
      pulse: false
    },
    offline: {
      color: 'text-gray-400',
      bgColor: 'bg-gray-400',
      icon: XCircleIcon,
      text: 'Offline',
      pulse: false
    }
  };

  // 📶 Connection quality configurations
  const qualityConfig = {
    excellent: { bars: 4, color: 'text-green-500' },
    good: { bars: 3, color: 'text-green-500' },
    fair: { bars: 2, color: 'text-yellow-500' },
    poor: { bars: 1, color: 'text-red-500' },
    offline: { bars: 0, color: 'text-gray-400' }
  };

  // 📏 Size configurations
  const sizeConfig = {
    xs: {
      dot: 'w-2 h-2',
      icon: 'w-3 h-3',
      text: 'text-xs',
      signal: 'w-3 h-3'
    },
    sm: {
      dot: 'w-3 h-3',
      icon: 'w-4 h-4',
      text: 'text-sm',
      signal: 'w-4 h-4'
    },
    md: {
      dot: 'w-4 h-4',
      icon: 'w-5 h-5',
      text: 'text-base',
      signal: 'w-5 h-5'
    },
    lg: {
      dot: 'w-5 h-5',
      icon: 'w-6 h-6',
      text: 'text-lg',
      signal: 'w-6 h-6'
    }
  };

  const config = statusConfig[status] || statusConfig.offline;
  const sizeClasses = sizeConfig[size] || sizeConfig.sm;
  const qualityInfo = qualityConfig[connectionQuality] || qualityConfig.good;
  const IconComponent = config.icon;

  // 📶 Signal bars component
  const SignalBars = () => (
    <div className={`flex items-end space-x-0.5 ${sizeClasses.signal}`}>
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className={`
            ${bar <= qualityInfo.bars ? qualityInfo.color : 'text-gray-300'}
            ${bar === 1 ? 'h-1/4' : bar === 2 ? 'h-2/4' : bar === 3 ? 'h-3/4' : 'h-full'}
            w-1 bg-current rounded-sm
          `}
        />
      ))}
    </div>
  );

  if (showText && showIcon) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Status Icon */}
        <IconComponent className={`${sizeClasses.icon} ${config.color}`} />
        
        {/* Status Text */}
        <span className={`${sizeClasses.text} ${config.color} font-medium`}>
          {config.text}
        </span>
        
        {/* Connection Quality */}
        {status === 'online' && (
          <div className="flex items-center space-x-1">
            <SignalBars />
          </div>
        )}
      </div>
    );
  }

  if (showText) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Status Dot */}
        <div 
          className={`
            ${sizeClasses.dot} 
            ${config.bgColor} 
            rounded-full 
            ${config.pulse ? 'animate-pulse' : ''}
          `}
        />
        
        {/* Status Text */}
        <span className={`${sizeClasses.text} ${config.color} font-medium`}>
          {config.text}
        </span>
        
        {/* Connection Quality */}
        {status === 'online' && (
          <SignalBars />
        )}
      </div>
    );
  }

  if (showIcon) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <IconComponent 
          className={`
            ${sizeClasses.icon} 
            ${config.color}
            ${config.pulse ? 'animate-pulse' : ''}
          `} 
        />
        
        {/* Connection Quality for online status */}
        {status === 'online' && (
          <SignalBars />
        )}
      </div>
    );
  }

  // Default: just the dot
  return (
    <div className={`relative ${className}`}>
      <div 
        className={`
          ${sizeClasses.dot} 
          ${config.bgColor} 
          rounded-full 
          ${config.pulse ? 'animate-pulse' : ''}
        `}
      />
      
      {/* Connection quality overlay for online status */}
      {status === 'online' && connectionQuality !== 'good' && (
        <div className="absolute -top-1 -right-1">
          <div className={`w-2 h-2 ${qualityInfo.color === 'text-red-500' ? 'bg-red-500' : 'bg-yellow-500'} rounded-full`} />
        </div>
      )}
    </div>
  );
};

// 🔄 Connection Status Component
export const ConnectionStatus = ({ 
  isConnected, 
  connectionQuality, 
  className = '',
  showText = true 
}) => {
  const getStatusInfo = () => {
    if (!isConnected) {
      return {
        icon: XCircleIcon,
        color: 'text-red-500',
        text: 'Disconnected',
        bgColor: 'bg-red-100 dark:bg-red-900/20'
      };
    }

    switch (connectionQuality) {
      case 'excellent':
      case 'good':
        return {
          icon: WifiIcon,
          color: 'text-green-500',
          text: 'Connected',
          bgColor: 'bg-green-100 dark:bg-green-900/20'
        };
      case 'fair':
        return {
          icon: SignalIcon,
          color: 'text-yellow-500',
          text: 'Weak Connection',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
        };
      case 'poor':
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-orange-500',
          text: 'Poor Connection',
          bgColor: 'bg-orange-100 dark:bg-orange-900/20'
        };
      default:
        return {
          icon: WifiIcon,
          color: 'text-blue-500',
          text: 'Connected',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const IconComponent = statusInfo.icon;

  return (
    <div className={`flex items-center space-x-2 px-2 py-1 rounded-lg ${statusInfo.bgColor} ${className}`}>
      <IconComponent className={`w-4 h-4 ${statusInfo.color}`} />
      {showText && (
        <span className={`text-sm font-medium ${statusInfo.color}`}>
          {statusInfo.text}
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;
