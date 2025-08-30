import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VideoPlayer = ({
  videoUrl = '',
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
  onVideoLoad,
  className = ''
}) => {
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [tempTime, setTempTime] = useState(currentTime);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url?.match(regex);
    return match ? match?.[1] : null;
  };

  const videoId = getYouTubeVideoId(videoUrl);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
  }, []);

  // Initialize YouTube Player
  useEffect(() => {
    if (!videoId || !window.YT || !window.YT.Player || ytPlayerRef.current) return;
    ytPlayerRef.current = new window.YT.Player('yt-player', {
      videoId,
      events: {
        onReady: (event) => {
          event.target.seekTo(currentTime, true);
          if (isPlaying) event.target.playVideo();
        },
        onStateChange: (event) => {
          // Optionally handle state changes
        }
      },
      playerVars: {
        controls: 0,
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        playsinline: 1
      }
    });
    return () => {
      ytPlayerRef.current?.destroy?.();
      ytPlayerRef.current = null;
    };
  }, [videoId]);

  // Respond to remote play/pause/seek
  useEffect(() => {
    if (!ytPlayerRef.current) return;
    if (isPlaying) {
      ytPlayerRef.current.playVideo();
    } else {
      ytPlayerRef.current.pauseVideo();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!ytPlayerRef.current) return;
    ytPlayerRef.current.seekTo(currentTime, true);
  }, [currentTime]);

  // Auto-hide controls
  useEffect(() => {
    if (controlsTimeoutRef?.current) {
      clearTimeout(controlsTimeoutRef?.current);
    }

    if (isPlaying && showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef?.current) {
        clearTimeout(controlsTimeoutRef?.current);
      }
    };
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

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef?.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getSyncStatusConfig = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          color: 'text-green-500',
          icon: 'CheckCircle2',
          text: 'Synced'
        };
      case 'syncing':
        return {
          color: 'text-yellow-500',
          icon: 'Loader2',
          text: 'Syncing...',
          spin: true
        };
      case 'out-of-sync':
        return {
          color: 'text-red-500',
          icon: 'AlertCircle',
          text: 'Out of sync'
        };
      default:
        return {
          color: 'text-gray-500',
          icon: 'Circle',
          text: 'Unknown'
        };
    }
  };

  const syncConfig = getSyncStatusConfig();

  return (
    <div 
      ref={playerRef}
      className={`
        relative w-full h-full bg-black rounded-lg overflow-hidden
        video-container
        ${className}
      `}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => !isDragging && setShowControls(false)}
    >
      {/* YouTube Embed with IFrame API */}
      {videoId ? (
        <div id="yt-player" className="w-full h-full" />
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-900">
          <div className="text-center text-white">
            <Icon name="Play" size={64} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Video Selected</h3>
            <p className="text-gray-400">Enter a YouTube URL to start watching together</p>
          </div>
        </div>
      )}
      {/* Custom Controls Overlay */}
      <div 
        className={`
          absolute bottom-0 left-0 right-0 z-10
          bg-gradient-to-t from-black/80 via-black/40 to-transparent
          transition-opacity duration-300
          ${showControls ? 'opacity-100' : 'opacity-0'}
        `}
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
                className="absolute top-0 left-0 h-full bg-red-500 rounded-full transition-all duration-150"
                style={{ 
                  width: `${((isDragging ? tempTime : currentTime) / duration) * 100}%` 
                }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{ 
                  left: `${((isDragging ? tempTime : currentTime) / duration) * 100}%`,
                  transform: 'translateX(-50%) translateY(-50%)'
                }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-white/70">
              <span>{formatTime(isDragging ? tempTime : currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Skip Backward 1min */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSeek?.(Math.max(currentTime - 60, 0))}
                className="text-white hover:bg-white/20 w-8 h-8"
                disabled={isBuffering}
              >
                <Icon name="Rewind" size={16} />
              </Button>
              {/* Skip Backward 10s */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSeek?.(Math.max(currentTime - 10, 0))}
                className="text-white hover:bg-white/20 w-8 h-8"
                disabled={isBuffering}
              >
                <Icon name="RotateCcw" size={16} />
              </Button>
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
              {/* Skip Forward 10s */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSeek?.(Math.min(currentTime + 10, duration))}
                className="text-white hover:bg-white/20 w-8 h-8"
                disabled={isBuffering}
              >
                <Icon name="RotateCw" size={16} />
              </Button>
              {/* Skip Forward 1min */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSeek?.(Math.min(currentTime + 60, duration))}
                className="text-white hover:bg-white/20 w-8 h-8"
                disabled={isBuffering}
              >
                <Icon name="FastForward" size={16} />
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
                    className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>
              {/* Time Display */}
              <div className="hidden md:block text-sm text-white/70">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-3">
              {/* Sync Status */}
              <div className="flex items-center space-x-2 px-2 py-1 bg-black/40 rounded-md">
                <Icon 
                  name={syncConfig?.icon}
                  size={14}
                  className={`${syncConfig?.color} ${syncConfig?.spin ? 'animate-spin' : ''}`}
                />
                <span className={`text-xs ${syncConfig?.color}`}>
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
                onClick={handleFullscreen}
                className="text-white hover:bg-white/20 w-8 h-8"
              >
                <Icon name="Maximize" size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;