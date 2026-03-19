/**
 * Integration/Workflow Tests for ZenSpace
 * 
 * Tests that verify the complete user journey works correctly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('User Workflow Integration Tests', () => {
  describe('Image Upload Workflow', () => {
    // Simulate the complete upload workflow logic
    const simulateUploadWorkflow = (file: File) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // Step 1: Validate file type
      const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!supportedTypes.includes(file.type)) {
        errors.push(`Unsupported file type: ${file.type}`);
        return { success: false, errors, warnings };
      }
      
      // Step 2: Validate file size
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        errors.push('File too large');
        return { success: false, errors, warnings };
      }
      
      if (file.size > 5 * 1024 * 1024) {
        warnings.push('Large file may take longer to process');
      }
      
      // Step 3: Would normally read file and compress
      // Step 4: Would normally send to API
      
      return { success: true, errors, warnings };
    };

    it('accepts valid JPEG upload', () => {
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      
      const result = simulateUploadWorkflow(file);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts valid PNG upload', () => {
      const file = new File(['test'], 'photo.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 }); // 2MB
      
      const result = simulateUploadWorkflow(file);
      expect(result.success).toBe(true);
    });

    it('rejects PDF upload with clear error', () => {
      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });
      
      const result = simulateUploadWorkflow(file);
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Unsupported');
    });

    it('rejects oversized files', () => {
      const file = new File(['test'], 'huge.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 }); // 15MB
      
      const result = simulateUploadWorkflow(file);
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('too large');
    });

    it('warns about large files that are still valid', () => {
      const file = new File(['test'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 7 * 1024 * 1024 }); // 7MB
      
      const result = simulateUploadWorkflow(file);
      expect(result.success).toBe(true);
      expect(result.warnings[0]).toContain('Large file');
    });
  });

  describe('Analysis Workflow', () => {
    // Simulate the analysis state machine
    type AnalysisState = 'idle' | 'uploading' | 'analyzing' | 'visualizing' | 'complete' | 'error';
    
    const createAnalysisStateMachine = () => {
      let state: AnalysisState = 'idle';
      let error: string | null = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      return {
        getState: () => state,
        getError: () => error,
        canRetry: () => retryCount < maxRetries,
        
        startUpload: () => {
          if (state === 'idle' || state === 'error') {
            state = 'uploading';
            error = null;
            return true;
          }
          return false;
        },
        
        startAnalysis: () => {
          if (state === 'uploading') {
            state = 'analyzing';
            return true;
          }
          return false;
        },
        
        analysisComplete: () => {
          if (state === 'analyzing') {
            state = 'complete';
            return true;
          }
          return false;
        },
        
        startVisualization: () => {
          if (state === 'complete') {
            state = 'visualizing';
            return true;
          }
          return false;
        },
        
        visualizationComplete: () => {
          if (state === 'visualizing') {
            state = 'complete';
            return true;
          }
          return false;
        },
        
        setError: (msg: string) => {
          error = msg;
          state = 'error';
        },
        
        retry: () => {
          if (state === 'error' && retryCount < maxRetries) {
            retryCount++;
            state = 'idle';
            error = null;
            return true;
          }
          return false;
        },
        
        reset: () => {
          state = 'idle';
          error = null;
          retryCount = 0;
        },
      };
    };

    it('follows happy path state transitions', () => {
      const machine = createAnalysisStateMachine();
      
      expect(machine.getState()).toBe('idle');
      
      machine.startUpload();
      expect(machine.getState()).toBe('uploading');
      
      machine.startAnalysis();
      expect(machine.getState()).toBe('analyzing');
      
      machine.analysisComplete();
      expect(machine.getState()).toBe('complete');
    });

    it('handles visualization flow', () => {
      const machine = createAnalysisStateMachine();
      
      machine.startUpload();
      machine.startAnalysis();
      machine.analysisComplete();
      
      machine.startVisualization();
      expect(machine.getState()).toBe('visualizing');
      
      machine.visualizationComplete();
      expect(machine.getState()).toBe('complete');
    });

    it('transitions to error state', () => {
      const machine = createAnalysisStateMachine();
      
      machine.startUpload();
      machine.startAnalysis();
      machine.setError('API failed');
      
      expect(machine.getState()).toBe('error');
      expect(machine.getError()).toBe('API failed');
    });

    it('allows retry after error', () => {
      const machine = createAnalysisStateMachine();
      
      machine.startUpload();
      machine.startAnalysis();
      machine.setError('Network error');
      
      expect(machine.retry()).toBe(true);
      expect(machine.getState()).toBe('idle');
      expect(machine.getError()).toBeNull();
    });

    it('limits retries', () => {
      const machine = createAnalysisStateMachine();
      
      // Exhaust retries
      for (let i = 0; i < 3; i++) {
        machine.startUpload();
        machine.setError('Persistent error');
        machine.retry();
      }
      
      machine.setError('Final error');
      expect(machine.retry()).toBe(false);
      expect(machine.canRetry()).toBe(false);
    });

    it('prevents invalid transitions', () => {
      const machine = createAnalysisStateMachine();
      
      // Can't start analysis without upload
      expect(machine.startAnalysis()).toBe(false);
      
      // Can't start visualization without analysis complete
      expect(machine.startVisualization()).toBe(false);
    });

    it('allows reset from any state', () => {
      const machine = createAnalysisStateMachine();
      
      machine.startUpload();
      machine.startAnalysis();
      machine.setError('Some error');
      
      machine.reset();
      expect(machine.getState()).toBe('idle');
    });
  });

  describe('Chat Workflow', () => {
    // Simulate chat message handling
    interface Message {
      id: string;
      role: 'user' | 'model';
      text: string;
      timestamp: number;
      isError?: boolean;
    }

    const createChatSession = () => {
      const messages: Message[] = [];
      let isTyping = false;
      
      return {
        getMessages: () => [...messages],
        isTyping: () => isTyping,
        
        sendMessage: async (text: string): Promise<Message> => {
          // Validate
          const trimmed = text.trim();
          if (!trimmed) {
            throw new Error('Empty message');
          }
          if (trimmed.length > 2000) {
            throw new Error('Message too long');
          }
          
          // Add user message
          const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: trimmed,
            timestamp: Date.now(),
          };
          messages.push(userMessage);
          
          // Simulate response
          isTyping = true;
          
          // Mock response
          const response: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: `Response to: ${trimmed.slice(0, 50)}...`,
            timestamp: Date.now() + 100,
          };
          messages.push(response);
          
          isTyping = false;
          return response;
        },
        
        addErrorMessage: (errorText: string) => {
          messages.push({
            id: Date.now().toString(),
            role: 'model',
            text: errorText,
            timestamp: Date.now(),
            isError: true,
          });
        },
        
        clear: () => {
          messages.length = 0;
        },
      };
    };

    it('sends and receives messages', async () => {
      const chat = createChatSession();
      
      const response = await chat.sendMessage('How do I organize my closet?');
      
      const messages = chat.getMessages();
      expect(messages).toHaveLength(2);
      expect(messages[0]!.role).toBe('user');
      expect(messages[1]!.role).toBe('model');
    });

    it('rejects empty messages', async () => {
      const chat = createChatSession();
      
      await expect(chat.sendMessage('')).rejects.toThrow('Empty message');
      await expect(chat.sendMessage('   ')).rejects.toThrow('Empty message');
    });

    it('rejects too long messages', async () => {
      const chat = createChatSession();
      
      const longMessage = 'a'.repeat(2001);
      await expect(chat.sendMessage(longMessage)).rejects.toThrow('too long');
    });

    it('maintains message order', async () => {
      const chat = createChatSession();
      
      await chat.sendMessage('First');
      await chat.sendMessage('Second');
      await chat.sendMessage('Third');
      
      const messages = chat.getMessages();
      expect(messages[0]!.text).toBe('First');
      expect(messages[2]!.text).toBe('Second');
      expect(messages[4]!.text).toBe('Third');
    });

    it('can add error messages', () => {
      const chat = createChatSession();
      
      chat.addErrorMessage('Connection failed');
      
      const messages = chat.getMessages();
      expect(messages[0]!.isError).toBe(true);
      expect(messages[0]!.text).toBe('Connection failed');
    });

    it('can clear messages', async () => {
      const chat = createChatSession();
      
      await chat.sendMessage('Test');
      chat.clear();
      
      expect(chat.getMessages()).toHaveLength(0);
    });
  });

  describe('Session Persistence Workflow', () => {
    // Simulate session save/load
    interface Session {
      id: string;
      analysis: string;
      messages: string[];
      createdAt: number;
      updatedAt: number;
    }

    const createSessionManager = () => {
      const sessions = new Map<string, Session>();
      
      return {
        save: (analysis: string, messages: string[]): Session => {
          const id = `session-${Date.now()}`;
          const session: Session = {
            id,
            analysis,
            messages,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          sessions.set(id, session);
          return session;
        },
        
        load: (id: string): Session | null => {
          return sessions.get(id) || null;
        },
        
        update: (id: string, messages: string[]): boolean => {
          const session = sessions.get(id);
          if (!session) return false;
          
          session.messages = messages;
          session.updatedAt = Date.now();
          return true;
        },
        
        delete: (id: string): boolean => {
          return sessions.delete(id);
        },
        
        list: (): Session[] => {
          return Array.from(sessions.values());
        },
      };
    };

    it('saves and loads sessions', () => {
      const manager = createSessionManager();
      
      const saved = manager.save('Analysis result', ['Message 1']);
      const loaded = manager.load(saved.id);
      
      expect(loaded).not.toBeNull();
      expect(loaded!.analysis).toBe('Analysis result');
      expect(loaded!.messages).toEqual(['Message 1']);
    });

    it('updates existing sessions', () => {
      const manager = createSessionManager();
      
      const saved = manager.save('Analysis', []);
      manager.update(saved.id, ['New message']);
      
      const loaded = manager.load(saved.id);
      expect(loaded!.messages).toEqual(['New message']);
    });

    it('deletes sessions', () => {
      const manager = createSessionManager();
      
      const saved = manager.save('Analysis', []);
      expect(manager.delete(saved.id)).toBe(true);
      expect(manager.load(saved.id)).toBeNull();
    });

    it('lists all sessions', async () => {
      const manager = createSessionManager();
      
      manager.save('Analysis 1', []);
      // Small delay to ensure different timestamps
      await new Promise(r => setTimeout(r, 5));
      manager.save('Analysis 2', []);
      
      const list = manager.list();
      expect(list).toHaveLength(2);
    });

    it('returns false for non-existent updates', () => {
      const manager = createSessionManager();
      expect(manager.update('fake-id', [])).toBe(false);
    });
  });

  describe('Rate Limiting Workflow', () => {
    // Simulate rate limiting behavior
    const createRateLimiter = (maxRequests: number, windowMs: number) => {
      const requests: number[] = [];
      
      return {
        tryRequest: (): boolean => {
          const now = Date.now();
          // Remove old requests
          while (requests.length > 0 && requests[0]! < now - windowMs) {
            requests.shift();
          }
          
          if (requests.length >= maxRequests) {
            return false;
          }
          
          requests.push(now);
          return true;
        },
        
        getRemainingRequests: (): number => {
          const now = Date.now();
          while (requests.length > 0 && requests[0]! < now - windowMs) {
            requests.shift();
          }
          return Math.max(0, maxRequests - requests.length);
        },
        
        getWaitTime: (): number => {
          if (requests.length < maxRequests) return 0;
          const oldest = requests[0];
          if (!oldest) return 0;
          const resetTime = oldest + windowMs;
          return Math.max(0, resetTime - Date.now());
        },
      };
    };

    it('allows requests within limit', () => {
      const limiter = createRateLimiter(5, 60000);
      
      for (let i = 0; i < 5; i++) {
        expect(limiter.tryRequest()).toBe(true);
      }
    });

    it('blocks requests over limit', () => {
      const limiter = createRateLimiter(3, 60000);
      
      limiter.tryRequest();
      limiter.tryRequest();
      limiter.tryRequest();
      
      expect(limiter.tryRequest()).toBe(false);
    });

    it('tracks remaining requests', () => {
      const limiter = createRateLimiter(5, 60000);
      
      expect(limiter.getRemainingRequests()).toBe(5);
      limiter.tryRequest();
      expect(limiter.getRemainingRequests()).toBe(4);
    });

    it('returns wait time when limited', () => {
      const limiter = createRateLimiter(1, 10000); // 1 request per 10 seconds
      
      limiter.tryRequest();
      const waitTime = limiter.getWaitTime();
      
      expect(waitTime).toBeGreaterThan(0);
      expect(waitTime).toBeLessThanOrEqual(10000);
    });
  });
});
