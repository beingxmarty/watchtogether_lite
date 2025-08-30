import React from 'react';
import Icon from '../../../components/AppIcon';

const ConnectionStatus = ({ 
  connectionStatus = 'connected',
  userCount = 0,
  syncStatus = 'synced',
  onlineUsers = []
}) => {
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'synced':
        return 'CheckCircle';
      case 'syncing':
        return 'RefreshCw';
      default:
        return 'AlertCircle';
    }
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'synced':
        return 'text-green-600';
      case 'syncing':
        return 'text-yellow-600';
      default:
        return 'text-red-600';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between text-sm">
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()} ${
            connectionStatus === 'connecting' ? 'animate-pulse' : ''
          }`} />
          <span className="text-gray-600">
            {connectionStatus === 'connected' && `${userCount} viewer${userCount !== 1 ? 's' : ''} online`}
            {connectionStatus === 'connecting' && 'Connecting...'}
            {connectionStatus === 'disconnected' && 'Disconnected'}
          </span>
        </div>

        {/* Sync Status */}
        <div className="flex items-center space-x-2">
          <Icon 
            name={getSyncStatusIcon()} 
            size={14} 
            className={`${getSyncStatusColor()} ${
              syncStatus === 'syncing' ? 'animate-spin' : ''
            }`}
          />
          <span className={getSyncStatusColor()}>
            {syncStatus === 'synced' && 'Synchronized'}
            {syncStatus === 'syncing' && 'Syncing...'}
          </span>
        </div>

        {/* Online Users Preview */}
        {onlineUsers?.length > 0 && (
          <div className="flex items-center space-x-1">
            <div className="flex -space-x-1">
              {onlineUsers?.slice(0, 3)?.map((user, index) => (
                <div
                  key={user?.id || index}
                  className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-medium"
                  title={user?.name}
                >
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
              ))}
              {onlineUsers?.length > 3 && (
                <div className="w-6 h-6 bg-gray-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-medium">
                  +{onlineUsers?.length - 3}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;