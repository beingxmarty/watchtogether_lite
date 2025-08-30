import React from 'react';
import Icon from '../AppIcon';
import Button from './Button';

const ChatPanelToggle = ({
  isExpanded = false,
  onToggle,
  unreadCount = 0,
  isTyping = false,
  className = ''
}) => {
  return (
    <div className={`
      fixed bottom-4 right-4 z-controls
      md:hidden
      ${className}
    `}>
      <Button
        variant="default"
        size="lg"
        onClick={onToggle}
        className={`
          relative shadow-lg
          transition-all duration-300 ease-out
          ${isExpanded ? 'bg-secondary hover:bg-secondary/90' : 'bg-primary hover:bg-primary/90'}
        `}
      >
        <Icon 
          name={isExpanded ? "X" : "MessageCircle"} 
          size={20} 
          className="mr-2"
        />
        
        <span className="font-medium">
          {isExpanded ? 'Close Chat' : 'Open Chat'}
        </span>

        {/* Unread Count Badge */}
        {!isExpanded && unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-error text-error-foreground rounded-full flex items-center justify-center text-xs font-semibold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}

        {/* Typing Indicator */}
        {!isExpanded && isTyping && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse-connection" />
        )}
      </Button>

      {/* Quick Preview for Mobile */}
      {!isExpanded && (unreadCount > 0 || isTyping) && (
        <div className="absolute bottom-full right-0 mb-2 max-w-xs">
          <div className="bg-card border border-border rounded-lg shadow-lg p-3">
            {isTyping && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Someone is typing...</span>
              </div>
            )}
            
            {unreadCount > 0 && (
              <div className="text-sm text-foreground">
                {unreadCount === 1 ? '1 new message' : `${unreadCount} new messages`}
              </div>
            )}
          </div>
          
          {/* Arrow pointing to button */}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-card" />
        </div>
      )}
    </div>
  );
};

export default ChatPanelToggle;