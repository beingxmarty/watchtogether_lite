import React, { useState, useEffect, useRef } from 'react';
import Icon from '../AppIcon';
import Button from './Button';
import Input from './Input';

const RealtimeChatInterface = ({
  isExpanded = true,
  messages = [],
  currentUser = { id: 'user1', name: 'You', avatar: null },
  onSendMessage,
  onToggleExpanded,
  isTyping = false,
  typingUsers = [],
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
      // Emit typing start event here
    }

    // Clear existing timeout
    if (typingTimeoutRef?.current) {
      clearTimeout(typingTimeoutRef?.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsUserTyping(false);
      // Emit typing stop event here
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
      ? 'bg-primary text-primary-foreground ml-12'
      : 'bg-muted text-muted-foreground mr-12';
  };

  // Mobile layout
  if (!isExpanded) {
    return null;
  }

  return (
    <div className={`
      fixed inset-0 z-chat bg-background
      md:relative md:inset-auto md:bg-transparent
      md:w-88 md:border-l md:border-border
      flex flex-col h-full
      ${className}
    `}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-3">
          <Icon name="MessageCircle" size={20} className="text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Chat</h3>
            <p className="text-xs text-muted-foreground">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Icon name="MessageCircle" size={48} className="text-muted-foreground/50 mb-4" />
            <h4 className="font-medium text-muted-foreground mb-2">No messages yet</h4>
            <p className="text-sm text-muted-foreground/70">
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

                  {/* Timestamp (on hover) */}
                  <div className="text-xs text-muted-foreground/70 mt-1 opacity-0 hover:opacity-100 transition-opacity duration-300">
                    {formatMessageTime(message?.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicators */}
            {typingUsers?.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground px-3 py-2 rounded-lg mr-12">
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
      <div className="p-4 border-t border-border bg-card">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleInputChange}
            className="flex-1"
           
          />
          <Button
            type="submit"
            variant="default"
            size="icon"
            disabled={!newMessage?.trim()}
            className="shrink-0"
          >
            <Icon name="Send" size={16} />
          </Button>
        </form>

        {/* Connection Status */}
        <div className="flex items-center justify-center mt-2">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse-connection" />
            <span>Connected to chat</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeChatInterface;