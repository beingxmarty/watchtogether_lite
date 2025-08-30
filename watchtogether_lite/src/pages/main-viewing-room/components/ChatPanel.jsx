import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ChatPanel = ({
  isExpanded = true,
  messages = [],
  currentUser = { id: 'user1', name: 'You', avatar: null },
  onSendMessage,
  onToggleExpanded,
  isTyping = false,
  typingUsers = [],
  connectionStatus = 'connected',
  className = ''
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isUserTyping, setIsUserTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef?.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat expands
  useEffect(() => {
    if (isExpanded && inputRef?.current) {
      inputRef?.current?.focus();
    }
  }, [isExpanded]);

  // Handle typing indicator
  const handleInputChange = (e) => {
    setNewMessage(e?.target?.value);
    if (!isUserTyping) {
      setIsUserTyping(true);
      if (typeof window.handleTyping === 'function') window.handleTyping(true);
    }
    if (typingTimeoutRef?.current) {
      clearTimeout(typingTimeoutRef?.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsUserTyping(false);
      if (typeof window.handleTyping === 'function') window.handleTyping(false);
    }, 1000);
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (newMessage?.trim()) {
      onSendMessage?.(newMessage?.trim());
      setNewMessage('');
      setIsUserTyping(false);
      if (typingTimeoutRef?.current) {
        clearTimeout(typingTimeoutRef?.current);
      }
      if (typeof window.handleTyping === 'function') window.handleTyping(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageAlignment = (message) => {
    return message?.userId === currentUser?.id ? 'justify-end' : 'justify-start';
  };

  const getMessageStyle = (message) => {
    return message?.userId === currentUser?.id
      ? 'bg-blue-500 text-white ml-12' :'bg-gray-100 text-gray-800 mr-12';
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  if (!isExpanded) {
    return null;
  }

  return (
    <div className={`
      fixed inset-0 z-50 bg-white
      md:relative md:inset-auto md:bg-transparent
      md:w-96 md:border-l md:border-gray-200
      flex flex-col h-full
      ${className}
    `}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <Icon name="MessageCircle" size={20} className="text-blue-500" />
          <div>
            <h3 className="font-semibold text-gray-900">Live Chat</h3>
            <p className="text-xs text-gray-500">
              {messages?.length} {messages?.length === 1 ? 'message' : 'messages'}
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleExpanded}
          className="md:hidden"
        >
          <Icon name="X" size={20} />
        </Button>
      </div>
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Icon name="MessageCircle" size={48} className="text-gray-300 mb-4" />
            <h4 className="font-medium text-gray-500 mb-2">No messages yet</h4>
            <p className="text-sm text-gray-400">
              Start the conversation while watching together!
            </p>
          </div>
        ) : (
          <>
            {messages?.map((message, index) => (
              <div key={message?.id || index} className={`flex ${getMessageAlignment(message)}`}>
                <div className="max-w-xs lg:max-w-sm">
                  {/* Message Bubble */}
                  <div className={`
                    px-3 py-2 rounded-lg
                    ${getMessageStyle(message)}
                  `}>
                    {/* User Name (for others' messages) */}
                    {message?.userId !== currentUser?.id && (
                      <div className="text-xs font-medium mb-1 opacity-70">
                        {message?.userName || 'Anonymous'}
                      </div>
                    )}
                    
                    {/* Message Content */}
                    <div className="text-sm break-words">
                      {message?.content}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-gray-400 mt-1 px-1">
                    {formatMessageTime(message?.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicators */}
            {typingUsers?.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-600 px-3 py-2 rounded-lg mr-12">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs">
                      {typingUsers?.length === 1 
                        ? `${typingUsers?.[0]} is typing...`
                        : `${typingUsers?.length} people are typing...`
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleInputChange}
            className="flex-1"
            disabled={connectionStatus === 'disconnected'}
          />
          <Button
            type="submit"
            variant="default"
            size="icon"
            disabled={!newMessage?.trim() || connectionStatus === 'disconnected'}
            className="shrink-0"
          >
            <Icon name="Send" size={16} />
          </Button>
        </form>

        {/* Connection Status */}
        <div className="flex items-center justify-center mt-2">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
              connectionStatus === 'connecting'? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
            }`} />
            <span className={getConnectionStatusColor()}>
              {connectionStatus === 'connected' ? 'Connected to chat' :
               connectionStatus === 'connecting'? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;