import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const Header = () => {
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [userCount, setUserCount] = useState(1);

  // Simulate connection status changes
  useEffect(() => {
    const interval = setInterval(() => {
      const statuses = ['connected', 'connecting', 'disconnected'];
      const randomStatus = statuses?.[Math.floor(Math.random() * statuses?.length)];
      setConnectionStatus(randomStatus);
      setUserCount(Math.floor(Math.random() * 12) + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-success';
      case 'connecting':
        return 'text-warning';
      case 'disconnected':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Wifi';
      case 'connecting':
        return 'WifiOff';
      case 'disconnected':
        return 'WifiOff';
      default:
        return 'Wifi';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-status bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
            <Icon name="Play" size={20} color="white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold font-heading text-foreground">
              WatchTogether Lite
            </h1>
            <p className="text-xs text-muted-foreground font-caption">
              Synchronized Viewing Experience
            </p>
          </div>
        </div>

        {/* Connection Status Section */}
        <div className="flex items-center space-x-4">
          {/* User Count */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-muted rounded-md">
            <Icon name="Users" size={16} className="text-muted-foreground" />
            <span className="text-sm font-data text-muted-foreground">
              {userCount} {userCount === 1 ? 'viewer' : 'viewers'}
            </span>
          </div>

          {/* Connection Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-muted rounded-md">
            <Icon 
              name={getConnectionIcon()} 
              size={16} 
              className={`${getConnectionColor()} ${
                connectionStatus === 'connected' ? 'animate-pulse-connection' : ''
              }`}
            />
            <span className={`text-sm font-data capitalize ${getConnectionColor()}`}>
              {connectionStatus}
            </span>
          </div>

          {/* Room Info (Mobile Hidden) */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-primary/10 rounded-md">
            <Icon name="Globe" size={16} className="text-primary" />
            <span className="text-sm font-data text-primary">
              Global Room
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;