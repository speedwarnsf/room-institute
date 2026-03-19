/**
 * Advanced Accessibility Features for Room
 * WCAG 2.1 AA compliant features and enhancements
 */
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { EyeOff, Volume2, VolumeX, Focus } from 'lucide-react';

// Accessibility context for global settings
interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  soundEnabled: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  playSound: (soundType: 'success' | 'error' | 'info') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

// Custom hook for accessibility features
export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

// Main accessibility provider
export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Initialize from localStorage and system preferences
    const saved = localStorage.getItem('room-institute-accessibility');
    const defaults = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      largeText: false,
      soundEnabled: true,
      screenReaderMode: false,
      keyboardNavigation: false,
      focusVisible: true,
    };
    
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  // Screen reader announcements
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.getElementById('accessibility-announcer');
    if (announcer) {
      announcer.textContent = message;
      announcer.setAttribute('aria-live', priority);
    }
  }, []);

  // Sound feedback
  const playSound = useCallback((soundType: 'success' | 'error' | 'info') => {
    if (!settings.soundEnabled) return;

    // Use Web Audio API for better control
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different sound types
      const frequencies = {
        success: [440, 550, 660], // Pleasant ascending chord
        error: [300, 200],         // Lower, descending
        info: [440]                // Single neutral tone
      };

      const freq = frequencies[soundType];
      const f0 = freq[0];
      const f1 = freq[1];
      const f2 = freq[2];
      
      if (f0 !== undefined) {
        oscillator.frequency.setValueAtTime(f0, audioContext.currentTime);
      }
      if (f1 !== undefined) {
        oscillator.frequency.setValueAtTime(f1, audioContext.currentTime + 0.1);
      }
      if (f2 !== undefined) {
        oscillator.frequency.setValueAtTime(f2, audioContext.currentTime + 0.2);
      }

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Web Audio API not available — silently degrade
    }
  }, [settings.soundEnabled]);

  // Update settings
  const updateSetting = useCallback((key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('room-institute-accessibility', JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  // Apply accessibility classes to document
  useEffect(() => {
    const html = document.documentElement;
    
    // Apply settings as CSS classes
    html.classList.toggle('reduce-motion', settings.reducedMotion);
    html.classList.toggle('high-contrast', settings.highContrast);
    html.classList.toggle('large-text', settings.largeText);
    html.classList.toggle('keyboard-navigation', settings.keyboardNavigation);
    html.classList.toggle('focus-visible', settings.focusVisible);
  }, [settings]);

  // Keyboard navigation detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !settings.keyboardNavigation) {
        updateSetting('keyboardNavigation', true);
        announce('Keyboard navigation mode activated');
      }
    };

    const handleMouseDown = () => {
      if (settings.keyboardNavigation) {
        updateSetting('keyboardNavigation', false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [settings.keyboardNavigation, updateSetting, announce]);

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, announce, playSound }}>
      {children}
      {/* Screen reader announcer */}
      <div
        id="accessibility-announcer"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
    </AccessibilityContext.Provider>
  );
}

// Accessibility toolbar component
export function AccessibilityToolbar() {
  const { settings, updateSetting, announce, playSound } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback((
    key: keyof AccessibilitySettings, 
    currentValue: boolean, 
    label: string
  ) => {
    const newValue = !currentValue;
    updateSetting(key, newValue);
    announce(`${label} ${newValue ? 'enabled' : 'disabled'}`);
    playSound(newValue ? 'success' : 'info');
  }, [updateSetting, announce, playSound]);

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="a11y-circle bg-stone-800 text-white p-2 shadow-lg hover:bg-stone-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Accessibility settings"
        aria-expanded={isOpen}
      >
        <Focus className="w-5 h-5" />
      </button>

      {/* Toolbar panel */}
      {isOpen && (
        <div 
          className="mb-2 absolute bottom-full left-0 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 shadow-xl p-4 w-64"
          role="dialog"
          aria-label="Accessibility Settings"
        >
          <h3 className="font-semibold mb-3 text-stone-900 dark:text-stone-100">
            Accessibility Settings
          </h3>
          
          <div className="space-y-3">
            {/* Reduced Motion */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={() => handleToggle('reducedMotion', settings.reducedMotion, 'Reduced motion')}
                className="w-4 h-4 text-blue-600 border-stone-300 focus:ring-blue-500"
              />
              <span className="text-sm text-stone-700 dark:text-stone-300">
                Reduce motion
              </span>
            </label>

            {/* High Contrast */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={() => handleToggle('highContrast', settings.highContrast, 'High contrast')}
                className="w-4 h-4 text-blue-600 border-stone-300 focus:ring-blue-500"
              />
              <span className="text-sm text-stone-700 dark:text-stone-300">
                High contrast
              </span>
            </label>

            {/* Large Text */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.largeText}
                onChange={() => handleToggle('largeText', settings.largeText, 'Large text')}
                className="w-4 h-4 text-blue-600 border-stone-300 focus:ring-blue-500"
              />
              <span className="text-sm text-stone-700 dark:text-stone-300">
                Large text
              </span>
            </label>

            {/* Sound Feedback */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={() => handleToggle('soundEnabled', settings.soundEnabled, 'Sound feedback')}
                className="w-4 h-4 text-blue-600 border-stone-300 focus:ring-blue-500"
              />
              <span className="text-sm text-stone-700 dark:text-stone-300 flex items-center gap-1">
                {settings.soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                Sound feedback
              </span>
            </label>

            {/* Focus Indicators */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.focusVisible}
                onChange={() => handleToggle('focusVisible', settings.focusVisible, 'Focus indicators')}
                className="w-4 h-4 text-blue-600 border-stone-300 focus:ring-blue-500"
              />
              <span className="text-sm text-stone-700 dark:text-stone-300">
                Enhanced focus indicators
              </span>
            </label>
          </div>

          {/* Keyboard shortcuts info */}
          <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-600">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Use Tab to navigate, Enter to activate
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Skip navigation component
export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only fixed top-0 left-0 bg-blue-600 text-white px-4 py-2 z-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      Skip to main content
    </a>
  );
}

// Enhanced focus management hook
export function useFocusManagement() {
  const { settings, announce } = useAccessibility();

  const manageFocus = useCallback((element: HTMLElement | null, reason: string) => {
    if (!element) return;

    element.focus();
    
    if (settings.screenReaderMode) {
      announce(`Focus moved to ${reason}`, 'polite');
    }
  }, [settings.screenReaderMode, announce]);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { manageFocus, trapFocus };
}

// Screen reader optimized image component
interface AccessibleImageProps {
  src: string;
  alt: string;
  className?: string;
  longDescription?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function AccessibleImage({ 
  src, 
  alt, 
  className = '', 
  longDescription,
  onLoad,
  onError 
}: AccessibleImageProps) {
  const { announce } = useAccessibility();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    announce(`Image loaded: ${alt}`, 'polite');
    onLoad?.();
  }, [alt, announce, onLoad]);

  const handleError = useCallback(() => {
    setFailed(true);
    announce(`Failed to load image: ${alt}`, 'assertive');
    onError?.();
  }, [alt, announce, onError]);

  if (failed) {
    return (
      <div 
        className={`bg-stone-100 dark:bg-stone-800 flex items-center justify-center p-4 text-stone-500 dark:text-stone-400 ${className}`}
        role="img" 
        aria-label={alt}
      >
        <div className="text-center">
          <EyeOff className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Image unavailable</p>
          {longDescription && (
            <p className="text-xs mt-1">{longDescription}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        // Add aria-describedby if long description exists
        aria-describedby={longDescription ? `desc-${alt.replace(/\s+/g, '-')}` : undefined}
      />
      
      {/* Hidden long description for screen readers */}
      {longDescription && (
        <div
          id={`desc-${alt.replace(/\s+/g, '-')}`}
          className="sr-only"
        >
          {longDescription}
        </div>
      )}
      
      {/* Loading state announcement */}
      {!loaded && !failed && (
        <div className="sr-only" aria-live="polite">
          Loading image: {alt}
        </div>
      )}
    </>
  );
}

// Keyboard shortcut helper
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  const { announce } = useAccessibility();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for modifier combinations
      const key = [
        e.ctrlKey && 'ctrl',
        e.altKey && 'alt',
        e.shiftKey && 'shift',
        e.key.toLowerCase()
      ].filter(Boolean).join('+');

      const action = shortcuts[key];
      if (action) {
        e.preventDefault();
        action();
        announce(`Shortcut activated: ${key}`, 'polite');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, announce]);
}

// CSS for accessibility features (to be included in global styles)
export const accessibilityCSS = `
  /* Reduced motion */
  .reduce-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* High contrast mode */
  .high-contrast {
    filter: contrast(150%);
  }

  /* Large text */
  .large-text {
    font-size: 120% !important;
    line-height: 1.6 !important;
  }

  /* Enhanced focus indicators */
  .focus-visible *:focus-visible {
    outline: 3px solid #3b82f6 !important;
    outline-offset: 2px !important;
  }

  /* Keyboard navigation indicators */
  .keyboard-navigation button:focus,
  .keyboard-navigation a:focus,
  .keyboard-navigation input:focus,
  .keyboard-navigation textarea:focus,
  .keyboard-navigation select:focus {
    box-shadow: 0 0 0 2px #3b82f6 !important;
  }

  /* Screen reader only class */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* High contrast adjustments for dark mode */
  @media (prefers-contrast: high) {
    .dark {
      --stone-50: #ffffff;
      --stone-900: #000000;
    }
  }
`;