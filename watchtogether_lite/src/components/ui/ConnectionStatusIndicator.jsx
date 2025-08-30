import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const ConnectionStatusIndicator = ({ 
  connectionStatus = 'connected',
  userCount = 1,
  className = '',
  showUserCount = true,
  compact = false 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide after successful connection
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [connectionStatus]);

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          color: 'text-success bg-success/10 border-success/20',
          icon: 'Wifi',
          text: 'Connected',
          pulse: true
        };
      case 'connecting':
        return {
          color: 'text-warning bg-warning/10 border-warning/20',
          icon: 'Loader2',
          text: 'Connecting...',
          pulse: false,
          spin: true
        };
      case 'reconnecting':
        return {
          color: 'text-warning bg-warning/10 border-warning/20',
          icon: 'RefreshCw',
          text: 'Reconnecting...',
          pulse: false,
          spin: true
        };
      case 'disconnected':
        return {
          color: 'text-error bg-error/10 border-error/20',
          icon: 'WifiOff',
          text: 'Disconnected',
          pulse: false
        };
      default:
        return {
          color: 'text-muted-foreground bg-muted border-border',
          icon: 'Wifi',
          text: 'Unknown',
          pulse: false
        };
    }
  };

  const config = getStatusConfig();

  if (!isVisible && connectionStatus === 'connected') {
    return null;
  }

  return (
    <div className={`
      fixed top-20 right-4 z-status
      flex items-center space-x-2
      px-3 py-2 rounded-lg border
      transition-all duration-300 ease-out
      ${config?.color}
      ${compact ? 'text-xs' : 'text-sm'}
      ${className}
    `}>
      <Icon 
        name={config?.icon}
        size={compact ? 14 : 16}
        className={`
          ${config?.color?.split(' ')?.[0]}
          ${config?.pulse ? 'animate-pulse-connection' : ''}
          ${config?.spin ? 'animate-spin' : ''}
        `}
      />
      <span className="font-data font-medium">
        {config?.text}
      </span>
      {showUserCount && connectionStatus === 'connected' && (
        <>
          <div className="w-px h-4 bg-current opacity-30" />
          <div className="flex items-center space-x-1">
            <Icon name="Users" size={compact ? 12 : 14} className="opacity-70" />
            <span className="font-data">
              {userCount}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;