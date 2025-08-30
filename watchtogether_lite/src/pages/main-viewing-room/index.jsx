import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import VideoPlayer from './components/VideoPlayer';
import ChatPanel from './components/ChatPanel';
import VideoUrlInput from './components/VideoUrlInput';
import ConnectionStatus from './components/ConnectionStatus';
import MobileChatToggle from './components/MobileChatToggle';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

const MainViewingRoom = () => {
  // Load current video for new users
  useEffect(() => {
    const lastVideo = localStorage.getItem('currentVideo');
    const lastTime = localStorage.getItem('currentTime');
    if (lastVideo) {
      setCurrentVideo(lastVideo);
      setIsPlaying(true);
      setCurrentTime(Number(lastTime) || 0);
    } else {
      // Request sync from other users
      videoSyncChannel?.send?.({
        type: 'broadcast',
        event: 'video-action',
        payload: { type: 'request-sync' }
      });
    }
  }, []);
  const { user, profile, signOut } = useAuth();
  
  // Video state
  const [currentVideo, setCurrentVideo] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  // Chat state
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  // Room state
  const [roomId] = useState('main-room'); // Default room
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [syncStatus, setSyncStatus] = useState('synced');
  const [userCount, setUserCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Real-time subscriptions
  const [messagesChannel, setMessagesChannel] = useState(null);
  const [presenceChannel, setPresenceChannel] = useState(null);
  const [videoSyncChannel, setVideoSyncChannel] = useState(null);

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const currentUser = {
    id: user?.id,
    name: profile?.display_name || user?.email?.split('@')?.[0] || 'Anonymous',
    avatar: profile?.avatar_url || null
  };

  // Initialize real-time features
  useEffect(() => {
    if (!user || !roomId) return;

    // Set up messages subscription
    const messagesChannel = supabase?.channel(`room_${roomId}_messages`)?.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        if (payload?.eventType === 'INSERT') {
          const newMessage = {
            id: payload?.new?.id,
            userId: payload?.new?.user_id,
            userName: payload?.new?.user_name,
            content: payload?.new?.content,
            timestamp: new Date(payload?.new?.created_at)
          };
          setMessages(prev => {
            // Avoid duplicates
            if (prev?.some(msg => msg?.id === newMessage?.id)) return prev;
            return [...prev, newMessage];
          });
          // Update unread count if chat is collapsed
          if (!isChatExpanded && window.innerWidth < 768) {
            setUnreadCount(prev => prev + 1);
          }
        }
      }
    )?.subscribe();

    // Set up presence subscription
    const presenceChannel = supabase?.channel(`room_${roomId}_presence`)
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel?.presenceState();
        const users = Object?.keys(newState || {})?.map(userId => {
          const presence = newState?.[userId]?.[0];
          return {
            id: userId,
            name: presence?.display_name || 'Anonymous',
            lastSeen: presence?.last_seen
          };
        });
        setOnlineUsers(users || []);
        setUserCount(users?.length || 0);
        // Typing users
        const typing = Object.keys(newState || {})
          .filter(userId => newState[userId]?.[0]?.isTyping)
          .map(userId => newState[userId]?.[0]?.display_name || 'Anonymous');
        setTypingUsers(typing);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Join presence
          await presenceChannel?.track({
            user_id: user?.id,
            display_name: currentUser?.name,
            last_seen: new Date()?.toISOString(),
            isTyping: false
          });
          setConnectionStatus('connected');
        }
      });

    // Set up video sync channel
    const videoSyncChannel = supabase?.channel(`room_${roomId}_video_sync`)
      ?.on('broadcast', { event: 'video-action' }, ({ payload }) => {
        if (!payload) return;
        switch (payload.type) {
          case 'play':
            setIsPlaying(true);
            setCurrentTime(payload.currentTime ?? currentTime);
            setSyncStatus('synced');
            localStorage.setItem('currentVideo', currentVideo);
            localStorage.setItem('currentTime', String(payload.currentTime ?? currentTime));
            break;
          case 'pause':
            setIsPlaying(false);
            setCurrentTime(payload.currentTime ?? currentTime);
            setSyncStatus('synced');
            localStorage.setItem('currentVideo', currentVideo);
            localStorage.setItem('currentTime', String(payload.currentTime ?? currentTime));
            break;
          case 'seek':
            setCurrentTime(payload.currentTime ?? currentTime);
            setSyncStatus('synced');
            localStorage.setItem('currentTime', String(payload.currentTime ?? currentTime));
            break;
          case 'load':
            setCurrentVideo(payload.videoUrl ?? '');
            setDuration(payload.duration ?? 180);
            setCurrentTime(0);
            setIsPlaying(false);
            setSyncStatus('synced');
            localStorage.setItem('currentVideo', payload.videoUrl ?? '');
            localStorage.setItem('currentTime', '0');
            break;
          case 'sync-state':
            setCurrentVideo(payload.videoUrl ?? '');
            setDuration(payload.duration ?? 180);
            setCurrentTime(payload.currentTime ?? 0);
            setIsPlaying(payload.isPlaying ?? false);
            setSyncStatus('synced');
            localStorage.setItem('currentVideo', payload.videoUrl ?? '');
            localStorage.setItem('currentTime', String(payload.currentTime ?? 0));
            break;
          case 'request-sync':
            // If another user requests sync, send current state
            if (user) {
              videoSyncChannel?.send?.({
                type: 'broadcast',
                event: 'video-action',
                payload: {
                  type: 'sync-state',
                  videoUrl: currentVideo,
                  duration,
                  currentTime,
                  isPlaying
                }
              });
            }
            break;
          default:
            break;
        }
      })
      ?.subscribe();

    setMessagesChannel(messagesChannel);
    setPresenceChannel(presenceChannel);
    setVideoSyncChannel(videoSyncChannel);

    // Load existing messages
    loadMessages();

    return () => {
      messagesChannel?.unsubscribe();
      presenceChannel?.unsubscribe();
      videoSyncChannel?.unsubscribe();
    };
  }, [user, roomId, isChatExpanded, currentUser?.name]);

  // Load existing messages
  const loadMessages = async () => {
    try {
      const { data, error } = await supabase?.from('chat_messages')?.select('*')?.eq('room_id', roomId)?.order('created_at', { ascending: true })?.limit(50);

      if (error) throw error;

      const formattedMessages = data?.map(msg => ({
        id: msg?.id,
        userId: msg?.user_id,
        userName: msg?.user_name,
        content: msg?.content,
        timestamp: new Date(msg?.created_at)
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Auto-expand chat on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsChatExpanded(true);
      } else {
        setIsChatExpanded(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle video loading
  // Broadcast video actions to all users
  const broadcastVideoAction = (type, payload = {}) => {
    videoSyncChannel?.send({
      type: 'broadcast',
      event: 'video-action',
      payload: { type, ...payload }
    });
  };

  const handleVideoLoad = async (videoUrl) => {
    setIsVideoLoading(true);
    setSyncStatus('syncing');
    setTimeout(() => {
      setCurrentVideo(videoUrl);
      setDuration(180); // 3 minutes mock duration
      setIsVideoLoading(false);
      setSyncStatus('synced');
      localStorage.setItem('currentVideo', videoUrl);
      localStorage.setItem('currentTime', '0');
      broadcastVideoAction('load', { videoUrl, duration: 180 });
      broadcastVideoAction('sync-state', { videoUrl, duration: 180, currentTime: 0, isPlaying: false });
      handleSendMessage(`New video loaded: ${videoUrl}`, 'system');
    }, 2000);
  };

  // Video controls with sync
  const handlePlay = () => {
    setIsPlaying(true);
    setSyncStatus('syncing');
    broadcastVideoAction('play', { currentTime });
    broadcastVideoAction('sync-state', { videoUrl: currentVideo, duration, currentTime, isPlaying: true });
    setTimeout(() => setSyncStatus('synced'), 1000);
  };

  const handlePause = () => {
    setIsPlaying(false);
    setSyncStatus('syncing');
    broadcastVideoAction('pause', { currentTime });
    broadcastVideoAction('sync-state', { videoUrl: currentVideo, duration, currentTime, isPlaying: false });
    setTimeout(() => setSyncStatus('synced'), 1000);
  };

  const handleSeek = (time) => {
    setCurrentTime(time);
    setSyncStatus('syncing');
    localStorage.setItem('currentTime', String(time));
    broadcastVideoAction('seek', { currentTime: time });
    broadcastVideoAction('sync-state', { videoUrl: currentVideo, duration, currentTime: time, isPlaying });
    setTimeout(() => setSyncStatus('synced'), 1500);
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => setSyncStatus('synced'), 2000);
  };

  // Send message to Supabase
  const handleSendMessage = async (content, messageType = 'user') => {
    try {
      const messageData = {
        room_id: roomId,
        user_id: user?.id,
        user_name: messageType === 'system' ? 'System' : currentUser?.name,
        content,
        message_type: messageType
      };

      const { error } = await supabase?.from('chat_messages')?.insert([messageData]);

      if (error) throw error;
      // Stop typing after sending
      await presenceChannel?.track({
        user_id: user?.id,
        display_name: currentUser?.name,
        last_seen: new Date()?.toISOString(),
        isTyping: false
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Add message locally if DB fails
      const fallbackMessage = {
        id: Date.now(),
        userId: messageType === 'system' ? 'system' : user?.id,
        userName: messageType === 'system' ? 'System' : currentUser?.name,
        content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    }
  };

  // Broadcast typing status
  const handleTyping = (isTyping) => {
    presenceChannel?.track({
      user_id: user?.id,
      display_name: currentUser?.name,
      last_seen: new Date()?.toISOString(),
      isTyping
    });
  };
  // Expose to window for ChatPanel
  useEffect(() => {
    window.handleTyping = handleTyping;
    return () => { delete window.handleTyping; };
  }, [presenceChannel, user, currentUser?.name]);

  const handleToggleChat = () => {
    setIsChatExpanded(!isChatExpanded);
    if (!isChatExpanded) {
      setUnreadCount(0);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Simulate video time progression
  useEffect(() => {
    let interval;
    if (isPlaying && currentTime < duration) {
      interval = setInterval(() => {
        setCurrentTime(prev => Math.min(prev + 1, duration));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with user info */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon name="Video" size={24} className="text-blue-500" />
            <h1 className="text-lg font-semibold text-gray-900">WatchTogether</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {currentUser?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <Icon name="LogOut" size={16} className="mr-1" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Connection Status Indicator */}
      <ConnectionStatus
        connectionStatus={connectionStatus}
        userCount={userCount}
        syncStatus={syncStatus}
        onlineUsers={onlineUsers}
      />

      {/* Main Content */}
      <div className="flex flex-col md:flex-row h-screen">
        {/* Video Section */}
        <div className="flex-1 flex flex-col p-4 space-y-4">
          {/* Video URL Input - always visible */}
          <VideoUrlInput
            onVideoLoad={handleVideoLoad}
            isLoading={isVideoLoading}
            className="max-w-2xl mx-auto"
          />

          {/* Video Player */}
          <div className="flex-1 min-h-0">
            <VideoPlayer
              videoUrl={currentVideo}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              isMuted={isMuted}
              isBuffering={isBuffering}
              syncStatus={syncStatus}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeek}
              onVolumeChange={handleVolumeChange}
              onMute={handleMute}
              onSync={handleSync}
              onVideoLoad={handleVideoLoad}
              className="w-full h-full"
            />
          </div>

          {/* Video Info */}
          {currentVideo && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">Now Watching</h2>
                  <p className="text-sm text-gray-600 truncate max-w-md">
                    {currentVideo}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {userCount} {userCount === 1 ? 'viewer' : 'viewers'}
                  </p>
                  <p className="text-xs text-gray-400">
                    Synchronized playback
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Panel - Desktop */}
        <div className="hidden md:block">
          <ChatPanel
            isExpanded={isChatExpanded}
            messages={messages}
            currentUser={currentUser}
            onSendMessage={handleSendMessage}
            onToggleExpanded={handleToggleChat}
            typingUsers={typingUsers}
            connectionStatus={connectionStatus}
          />
        </div>
      </div>

      {/* Mobile Chat Panel */}
      <div className="md:hidden">
        <ChatPanel
          isExpanded={isChatExpanded}
          messages={messages}
          currentUser={currentUser}
          onSendMessage={handleSendMessage}
          onToggleExpanded={handleToggleChat}
          typingUsers={typingUsers}
          connectionStatus={connectionStatus}
        />
      </div>

      {/* Mobile Chat Toggle Button */}
      <MobileChatToggle
        isExpanded={isChatExpanded}
        onToggle={handleToggleChat}
        unreadCount={unreadCount}
        isTyping={typingUsers?.length > 0}
      />
    </div>
  );
};

export default MainViewingRoom;