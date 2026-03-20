/**
 * Network Status Monitor with Offline Support
 * Provides real-time network status and offline mode handling
 */
import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle, CloudOff } from 'lucide-react';
import { analytics } from '../services/analytics';
import { getTranslation } from '../i18n/I18nContext';
import { useI18n } from '../i18n/I18nContext';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface NetworkStatusProps {
  onNetworkChange?: (status: NetworkStatus) => void;
  showIndicator?: boolean;
  className?: string;
}

export function NetworkStatus({ onNetworkChange, showIndicator = true, className = '' }: NetworkStatusProps) {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
  });
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [offlineActions, setOfflineActions] = useState<string[]>([]);

  // Check network quality using Network Information API
  const checkNetworkQuality = useCallback(() => {
    const connection = (navigator as any).connection;
    if (!connection) return;

    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink;
    const rtt = connection.rtt;

    const isSlowConnection = 
      effectiveType === 'slow-2g' || 
      effectiveType === '2g' || 
      downlink < 0.5 || 
      rtt > 2000;

    setStatus(prev => ({
      ...prev,
      effectiveType,
      downlink,
      rtt,
      isSlowConnection,
    }));

    return { effectiveType, downlink, rtt, isSlowConnection };
  }, []);

  // Handle online status change
  const handleOnline = useCallback(() => {
    const newStatus = {
      ...status,
      isOnline: true,
    };
    setStatus(newStatus);
    setShowOfflineMessage(false);
    
    analytics.track('network_status_changed', {
      status: 'online',
      offlineActionsCount: offlineActions.length,
    });

    // Check network quality when coming online
    setTimeout(checkNetworkQuality, 1000);

    onNetworkChange?.(newStatus);
  }, [status, onNetworkChange, offlineActions, checkNetworkQuality]);

  // Handle offline status change
  const handleOffline = useCallback(() => {
    const newStatus = {
      ...status,
      isOnline: false,
    };
    setStatus(newStatus);
    setShowOfflineMessage(true);
    
    analytics.track('network_status_changed', {
      status: 'offline',
    });

    onNetworkChange?.(newStatus);
  }, [status, onNetworkChange]);

  // Add action to offline queue
  const queueOfflineAction = useCallback((action: string) => {
    setOfflineActions(prev => [...prev, action]);
  }, []);

  // Clear offline actions (e.g., when synced)
  const clearOfflineActions = useCallback(() => {
    setOfflineActions([]);
  }, []);

  useEffect(() => {
    // Initial network quality check
    checkNetworkQuality();

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for network quality changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', checkNetworkQuality);
    }

    // Periodic connection quality check
    const qualityCheckInterval = setInterval(checkNetworkQuality, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', checkNetworkQuality);
      }
      clearInterval(qualityCheckInterval);
    };
  }, [handleOnline, handleOffline, checkNetworkQuality]);

  // Auto-hide offline message after 5 seconds
  useEffect(() => {
    if (!status.isOnline) {
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [status.isOnline]);

  if (!showIndicator) return null;

  return (
    <>
      {/* Network Status Indicator */}
      <div className={`flex items-center ${className}`}>
        {status.isOnline ? (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            {status.isSlowConnection ? (
              <div className="flex items-center gap-1" title={getTranslation('network.slowConnection')}>
                <Wifi className="w-4 h-4" />
                <div className="w-1 h-1 bg-orange-500 animate-pulse" />
              </div>
            ) : (
              <Wifi className="w-4 h-4" aria-label={getTranslation('network.connected')} />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
            <WifiOff className="w-4 h-4" aria-label={getTranslation('network.offlineLabel')} />
          </div>
        )}
      </div>

      {/* Offline Message Toast */}
      {showOfflineMessage && (
        <div 
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300"
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-amber-50 dark:bg-emerald-950/80 border border-amber-200 dark:border-emerald-600 text-emerald-700 dark:text-emerald-200 px-4 py-3 shadow-lg max-w-sm">
            <div className="flex items-center gap-3">
              <CloudOff className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">You're offline</p>
                <p className="text-sm opacity-90">
                  Some features won't work until you reconnect
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slow Connection Warning */}
      {status.isOnline && status.isSlowConnection && (
        <div 
          className="fixed top-4 right-4 z-40 animate-in slide-in-from-right-4 duration-300"
          role="alert"
          aria-live="polite"
        >
          <div className="bg-orange-50 dark:bg-orange-900/80 border border-orange-200 dark:border-orange-700 text-orange-800 dark:text-orange-200 px-4 py-3 shadow-lg max-w-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Slow connection</p>
                <p className="text-sm opacity-90">
                  Some features may take longer to load
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back Online Message */}
      {status.isOnline && offlineActions.length > 0 && (
        <div 
          className="fixed bottom-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-300"
          role="alert"
          aria-live="polite"
        >
          <div className="bg-emerald-50 dark:bg-emerald-900/80 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 px-4 py-3 shadow-lg max-w-sm">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Back online</p>
                <p className="text-sm opacity-90">
                  Syncing {offlineActions.length} pending action{offlineActions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Hook for using network status in components
export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
  });

  const checkNetworkQuality = useCallback(() => {
    const connection = (navigator as any).connection;
    if (!connection) return status;

    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink;
    const rtt = connection.rtt;

    const isSlowConnection = 
      effectiveType === 'slow-2g' || 
      effectiveType === '2g' || 
      downlink < 0.5 || 
      rtt > 2000;

    const newStatus = {
      isOnline: navigator.onLine,
      effectiveType,
      downlink,
      rtt,
      isSlowConnection,
    };

    setStatus(newStatus);
    return newStatus;
  }, [status]);

  useEffect(() => {
    const handleOnline = () => {
      setTimeout(checkNetworkQuality, 1000);
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', checkNetworkQuality);
    }

    // Initial check
    checkNetworkQuality();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', checkNetworkQuality);
      }
    };
  }, [checkNetworkQuality]);

  return status;
}

// Higher-order component for offline-aware components
export function withOfflineSupport<P extends object>(
  Component: React.ComponentType<P>,
  customOfflineMessage?: string
) {
  return function OfflineAwareComponent(props: P) {
    const { isOnline } = useNetworkStatus();
    const { t } = useI18n();

    if (!isOnline) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CloudOff className="w-12 h-12 text-stone-400 dark:text-stone-500 mb-4" />
          <h3 className="text-lg font-medium text-stone-700 dark:text-stone-300 mb-2">
            {(t as any)('network.offline')}
          </h3>
          <p className="text-stone-500 dark:text-stone-400 max-w-md">
            {customOfflineMessage || (t as any)('network.featureRequiresConnection')}
          </p>
        </div>
      );
    }

    return <Component {...props} />;
  };
}