import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';
import Button from './Button';

const VideoControlSyncPanel = ({
  isPlaying = false,
  currentTime = 0,
  duration = 0,
  volume = 1,
  isMuted = false,
  isBuffering = false,
  syncStatus = 'synced',
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onMute,
  onSync,
  className = ''
}) => {
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [tempTime, setTempTime] = useState(currentTime);

  // Auto-hide controls
  useEffect(() => {
    let timer;
    if (isPlaying && showControls) {
      timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, showControls]);

  // Show controls on mouse movement
  const handleMouseMove = () => {
    setShowControls(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs?.toString()?.padStart(2, '0')}`;
  };

  const handleSeekStart = (e) => {
    setIsDragging(true);
    const rect = e?.currentTarget?.getBoundingClientRect();
    const percent = (e?.clientX - rect?.left) / rect?.width;
    const newTime = percent * duration;
    setTempTime(newTime);
  };

  const handleSeekMove = (e) => {
    if (!isDragging) return;
    const rect = e?.currentTarget?.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e?.clientX - rect?.left) / rect?.width));
    const newTime = percent * duration;
    setTempTime(newTime);
  };

  const handleSeekEnd = () => {
    if (isDragging) {
      onSeek?.(tempTime);
      setIsDragging(false);
    }
  };

  const getSyncStatusConfig = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          color: 'text-success',
          icon: 'CheckCircle2',
          text: 'Synced'
        };
      case 'syncing':
        return {
          color: 'text-warning',
          icon: 'Loader2',
          text: 'Syncing...',
          spin: true
        };
      case 'out-of-sync':
        return {
          color: 'text-error',
          icon: 'AlertCircle',
          text: 'Out of sync'
        };
      default:
        return {
          color: 'text-muted-foreground',
          icon: 'Circle',
          text: 'Unknown'
        };
    }
  };

  const syncConfig = getSyncStatusConfig();

  return (
    <div 
      className={`
        absolute bottom-0 left-0 right-0 z-controls
        bg-gradient-to-t from-black/80 via-black/40 to-transparent
        transition-opacity duration-300
        ${showControls ? 'opacity-100' : 'opacity-0'}
        ${className}
      `}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => !isDragging && setShowControls(false)}
    >
      <div className="p-4 space-y-3">
        {/* Progress Bar */}
        <div className="space-y-1">
          <div 
            className="relative h-1 bg-white/20 rounded-full cursor-pointer group"
            onMouseDown={handleSeekStart}
            onMouseMove={handleSeekMove}
            onMouseUp={handleSeekEnd}
            onMouseLeave={handleSeekEnd}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-150"
              style={{ 
                width: `${((isDragging ? tempTime : currentTime) / duration) * 100}%` 
              }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ 
                left: `${((isDragging ? tempTime : currentTime) / duration) * 100}%`,
                transform: 'translateX(-50%) translateY(-50%)'
              }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-white/70 font-data">
            <span>{formatTime(isDragging ? tempTime : currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Play/Pause Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={isPlaying ? onPause : onPlay}
              className="text-white hover:bg-white/20 w-10 h-10"
              disabled={isBuffering}
            >
              {isBuffering ? (
                <Icon name="Loader2" size={20} className="animate-spin" />
              ) : (
                <Icon name={isPlaying ? "Pause" : "Play"} size={20} />
              )}
            </Button>

            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onMute}
                className="text-white hover:bg-white/20 w-8 h-8"
              >
                <Icon 
                  name={isMuted ? "VolumeX" : volume > 0.5 ? "Volume2" : "Volume1"} 
                  size={16} 
                />
              </Button>
              
              <div className="hidden sm:block w-20">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => onVolumeChange?.(parseFloat(e?.target?.value))}
                  className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer slider"
                />
              </div>
            </div>

            {/* Time Display */}
            <div className="hidden md:block text-sm text-white/70 font-data">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Sync Status and Controls */}
          <div className="flex items-center space-x-3">
            {/* Sync Status */}
            <div className="flex items-center space-x-2 px-2 py-1 bg-black/40 rounded-md">
              <Icon 
                name={syncConfig?.icon}
                size={14}
                className={`${syncConfig?.color} ${syncConfig?.spin ? 'animate-spin' : ''}`}
              />
              <span className={`text-xs font-data ${syncConfig?.color}`}>
                {syncConfig?.text}
              </span>
            </div>

            {/* Manual Sync Button */}
            {syncStatus === 'out-of-sync' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSync}
                className="text-white hover:bg-white/20 text-xs"
              >
                <Icon name="RefreshCw" size={14} className="mr-1" />
                Sync
              </Button>
            )}

            {/* Fullscreen Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const elem = document.querySelector('.video-container');
                if (elem?.requestFullscreen) {
                  elem?.requestFullscreen();
                }
              }}
              className="text-white hover:bg-white/20 w-8 h-8"
            >
              <Icon name="Maximize" size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoControlSyncPanel;