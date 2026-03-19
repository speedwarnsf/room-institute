import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from '../../components/ChatInterface';
import { ChatMessage } from '../../types';

describe('ChatInterface', () => {
  const mockOnSendMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state with suggestions when no messages', () => {
    render(
      <ChatInterface 
        messages={[]} 
        onSendMessage={mockOnSendMessage} 
        isTyping={false} 
      />
    );
    
    expect(screen.getByText('Ask me anything about organizing your room!')).toBeInTheDocument();
    expect(screen.getByText('"Where should I put the shoes?"')).toBeInTheDocument();
  });

  it('renders user messages correctly', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        text: 'Where should I put the books?',
        timestamp: Date.now()
      }
    ];

    render(
      <ChatInterface 
        messages={messages} 
        onSendMessage={mockOnSendMessage} 
        isTyping={false} 
      />
    );
    
    expect(screen.getByText('Where should I put the books?')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('renders AI messages correctly', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'model',
        text: 'I recommend using a bookshelf.',
        timestamp: Date.now()
      }
    ];

    render(
      <ChatInterface 
        messages={messages} 
        onSendMessage={mockOnSendMessage} 
        isTyping={false} 
      />
    );
    
    expect(screen.getByText('I recommend using a bookshelf.')).toBeInTheDocument();
    expect(screen.getByText('ZenSpace')).toBeInTheDocument();
  });

  it('shows typing indicator when AI is responding', () => {
    render(
      <ChatInterface 
        messages={[]} 
        onSendMessage={mockOnSendMessage} 
        isTyping={true} 
      />
    );
    
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'ZenSpace is typing');
  });

  it('renders error messages with proper styling', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'model',
        text: 'Something went wrong.',
        timestamp: Date.now(),
        isError: true
      }
    ];

    render(
      <ChatInterface 
        messages={messages} 
        onSendMessage={mockOnSendMessage} 
        isTyping={false} 
      />
    );
    
    // The error styling is on a grandparent div (the message bubble wrapper)
    const messageText = screen.getByText('Something went wrong.');
    // Walk up the DOM tree to find the element with error styling
    let parent = messageText.parentElement;
    let foundErrorStyling = false;
    while (parent) {
      if (parent.className?.includes('bg-red-50')) {
        foundErrorStyling = true;
        break;
      }
      parent = parent.parentElement;
    }
    expect(foundErrorStyling).toBe(true);
  });

  it('calls onSendMessage when form is submitted', async () => {
    const user = userEvent.setup();
    
    render(
      <ChatInterface 
        messages={[]} 
        onSendMessage={mockOnSendMessage} 
        isTyping={false} 
      />
    );
    
    const input = screen.getByPlaceholderText('Ask a follow-up question...');
    await user.type(input, 'Test message');
    
    const sendButton = screen.getByRole('button', { name: 'Send message' });
    await user.click(sendButton);
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('clears input after sending message', async () => {
    const user = userEvent.setup();
    
    render(
      <ChatInterface 
        messages={[]} 
        onSendMessage={mockOnSendMessage} 
        isTyping={false} 
      />
    );
    
    const input = screen.getByPlaceholderText('Ask a follow-up question...') as HTMLInputElement;
    await user.type(input, 'Test message');
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    
    expect(input.value).toBe('');
  });

  it('disables send button when input is empty', () => {
    render(
      <ChatInterface 
        messages={[]} 
        onSendMessage={mockOnSendMessage} 
        isTyping={false} 
      />
    );
    
    const sendButton = screen.getByRole('button', { name: 'Send message' });
    expect(sendButton).toBeDisabled();
  });

  it('disables send button when AI is typing', async () => {
    const user = userEvent.setup();
    
    render(
      <ChatInterface 
        messages={[]} 
        onSendMessage={mockOnSendMessage} 
        isTyping={true} 
      />
    );
    
    const input = screen.getByPlaceholderText('Ask a follow-up question...');
    await user.type(input, 'Test message');
    
    const sendButton = screen.getByRole('button', { name: 'Send message' });
    expect(sendButton).toBeDisabled();
  });

  it('does not send empty messages', async () => {
    const user = userEvent.setup();
    
    render(
      <ChatInterface 
        messages={[]} 
        onSendMessage={mockOnSendMessage} 
        isTyping={false} 
      />
    );
    
    const input = screen.getByPlaceholderText('Ask a follow-up question...');
    await user.type(input, '   '); // Only whitespace
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(
      <ChatInterface 
        messages={[]} 
        onSendMessage={mockOnSendMessage} 
        isTyping={false} 
      />
    );
    
    expect(screen.getByRole('log')).toHaveAttribute('aria-label', 'Chat messages');
    expect(screen.getByLabelText('Type your message')).toBeInTheDocument();
  });
});
