import React, { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  /** List of chat messages to display */
  messages: ChatMessage[];
  /** Callback when user sends a message */
  onSendMessage: (text: string) => void;
  /** Whether the AI is currently generating a response */
  isTyping: boolean;
}

/**
 * Chat interface component for follow-up questions about room organization
 */
export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isTyping 
}) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isTyping) return;
    
    onSendMessage(trimmedInput);
    setInput('');
  }, [input, isTyping, onSendMessage]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    // Allow Escape to blur the input
    if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  }, []);

  /**
   * Format timestamp for screen readers
   */
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <section 
      className="flex flex-col h-[calc(100vh-12rem)] sm:h-[600px] max-h-[600px] bg-white dark:bg-stone-800 shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden transition-colors duration-300"
      aria-labelledby="chat-heading"
    >
      {/* Header */}
      <header className="p-4 border-b border-stone-100 dark:border-stone-700 bg-emerald-50/50 dark:bg-emerald-900/20 flex items-center gap-2">
        <Bot className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <h3 id="chat-heading" className="font-semibold text-stone-800 dark:text-stone-100">
          Chat with Room AI
        </h3>
      </header>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Chat messages"
      >
        {/* Empty State */}
        {messages.length === 0 && !isTyping && (
          <div className="text-center text-stone-400 dark:text-stone-500 mt-10" aria-hidden="true">
            <p>Ask me anything about organizing your room!</p>
            <div className="mt-4 space-y-2 text-sm">
              <p className="italic">"Where should I put the shoes?"</p>
              <p className="italic">"Suggest a color for the bins."</p>
              <p className="italic">"What's the best way to start?"</p>
            </div>
          </div>
        )}
        
        {/* Message List */}
        {messages.map((msg) => (
          <article
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            aria-label={`${msg.role === 'user' ? 'You' : 'Room'} said at ${formatTime(msg.timestamp)}`}
          >
            <div
              className={`
                max-w-[85%] p-3 text-sm leading-relaxed
                ${msg.role === 'user' 
                  ? 'bg-emerald-600 text-white-none' 
                  : msg.isError 
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200-none border border-red-200 dark:border-red-700' 
                    : 'bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-100-none'
                }
              `}
            >
              {/* Message Header */}
              <div className="flex items-center gap-2 mb-1 opacity-80 text-xs font-medium">
                {msg.role === 'user' ? (
                  <User className="w-3 h-3" aria-hidden="true" />
                ) : msg.isError ? (
                  <AlertCircle className="w-3 h-3 text-red-500" aria-hidden="true" />
                ) : (
                  <Bot className="w-3 h-3" aria-hidden="true" />
                )}
                <span>{msg.role === 'user' ? 'You' : 'Room'}</span>
              </div>
              
              {/* Message Content */}
              <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : ''}`}>
                <ReactMarkdown>
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          </article>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div 
            className="flex justify-start w-full"
            role="status"
            aria-label="Room is typing"
          >
            <div className="bg-stone-100 dark:bg-stone-700-none p-4 flex items-center gap-2">
              <Loader2 
                className="w-4 h-4 animate-spin text-stone-400 dark:text-stone-500" 
                aria-hidden="true" 
              />
              <span className="text-xs text-stone-500 dark:text-stone-400">Thinking...</span>
            </div>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Input Form */}
      <form 
        onSubmit={handleSubmit} 
        className="p-4 border-t border-stone-100 dark:border-stone-700 bg-white dark:bg-stone-800"
      >
        <div className="relative">
          <label htmlFor="chat-input" className="sr-only">
            Type your message
          </label>
          <input
            id="chat-input"
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up question..."
            disabled={isTyping}
            className="w-full pl-4 pr-12 py-3 border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/50 outline-none transition-all text-stone-700 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 disabled:bg-stone-50 dark:disabled:bg-stone-800 disabled:cursor-not-allowed"
            aria-describedby={isTyping ? "typing-status" : undefined}
          />
          {isTyping && (
            <span id="typing-status" className="sr-only">
              Please wait, Room is responding
            </span>
          )}
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-800"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </form>
    </section>
  );
};
