import { useState, useCallback } from 'react';
import { Share2, Copy, Check, Twitter, MessageCircle, Link2, Loader2 } from 'lucide-react';
import { supabase } from '../services/auth';
import { useI18n } from '../i18n/I18nContext';

interface ShareButtonProps {
  analysis: string;
  roomType?: string;
  designName?: string;
  designMood?: string;
  palette?: string[];
  keyChanges?: string[];
  visualizationThumb?: string;
  onShare?: () => void;
}

interface ShareOption {
  id: string;
  label: string;
  icon: typeof Share2;
  action: () => Promise<void>;
}

/**
 * Share button with public link generation + social sharing
 */
export function ShareButton({
  analysis,
  roomType = 'room',
  designName,
  designMood,
  palette,
  keyChanges,
  visualizationThumb,
  onShare
}: ShareButtonProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  const generateSummary = useCallback((): string => {
    if (designName && designMood) {
      return `${designName}: ${designMood}`;
    }
    const lines = analysis.split('\n').filter(line => line.trim().length > 0);
    const summaryLine = lines.find(line => 
      !line.startsWith('#') && !line.startsWith('**') && line.length > 50
    ) || `I just organized my ${roomType} with Room`;
    return summaryLine.length > 200 ? summaryLine.substring(0, 197) + '...' : summaryLine;
  }, [analysis, roomType, designName, designMood]);

  const generateShareText = useCallback((url?: string): string => {
    const summary = generateSummary();
    const link = url || 'https://room.institute';
    return `${summary}\n\nDesigned with Room: ${link}`;
  }, [generateSummary]);

  // Create a public share link via Supabase
  const createShareLink = useCallback(async (): Promise<string> => {
    if (shareUrl) return shareUrl;
    
    setIsCreatingLink(true);
    try {
      const shareId = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      
      const { error } = await supabase
        .from('shared_designs')
        .insert({
          share_id: shareId,
          design_name: designName || 'Room Design',
          mood: designMood || generateSummary(),
          palette: palette || [],
          key_changes: keyChanges || [],
          visualization_thumb: visualizationThumb || null,
          created_at: new Date().toISOString(),
        });
      
      if (error) {
        console.warn('Failed to create share link, using fallback:', error);
        return 'https://room.institute';
      }
      
      const url = `https://room.institute/share/${shareId}`;
      setShareUrl(url);
      return url;
    } catch {
      return 'https://room.institute';
    } finally {
      setIsCreatingLink(false);
    }
  }, [shareUrl, designName, designMood, palette, keyChanges, visualizationThumb, generateSummary]);

  const canUseWebShare = typeof navigator !== 'undefined' && 
    'share' in navigator && typeof navigator.share === 'function';

  const handleNativeShare = useCallback(async () => {
    if (!canUseWebShare) return;
    setIsSharing(true);
    try {
      const url = await createShareLink();
      await navigator.share({
        title: designName ? `${designName} -- Room Design` : 'My Room Room Analysis',
        text: generateShareText(url),
        url,
      });
      onShare?.();
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error('Share failed:', err);
    } finally {
      setIsSharing(false);
      setIsOpen(false);
    }
  }, [canUseWebShare, createShareLink, generateShareText, onShare, designName]);

  const handleCopyLink = useCallback(async () => {
    try {
      const url = await createShareLink();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onShare?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback: copy share text
      await navigator.clipboard.writeText(generateShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setIsOpen(false);
  }, [createShareLink, generateShareText, onShare]);

  const handleTwitterShare = useCallback(async () => {
    const url = await createShareLink();
    const text = encodeURIComponent(generateSummary() + ' #Room #InteriorDesign');
    const encodedUrl = encodeURIComponent(url);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`, '_blank', 'width=600,height=400');
    onShare?.();
    setIsOpen(false);
  }, [createShareLink, generateSummary, onShare]);

  const handleSMSShare = useCallback(async () => {
    const url = await createShareLink();
    const body = encodeURIComponent(generateShareText(url));
    window.open(`sms:?&body=${body}`, '_self');
    onShare?.();
    setIsOpen(false);
  }, [createShareLink, generateShareText, onShare]);

  const shareOptions: ShareOption[] = [
    {
      id: 'link',
      label: copied ? t('products.copied') : t('products.copyList'),
      icon: copied ? Check : Link2,
      action: handleCopyLink,
    },
    {
      id: 'copy',
      label: 'Copy Text',
      icon: Copy,
      action: async () => {
        await navigator.clipboard.writeText(generateShareText());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        setIsOpen(false);
      },
    },
    {
      id: 'twitter',
      label: 'Share on X',
      icon: Twitter,
      action: handleTwitterShare,
    },
    {
      id: 'sms',
      label: 'Text Message',
      icon: MessageCircle,
      action: handleSMSShare,
    },
  ];

  if (canUseWebShare) {
    return (
      <button
        onClick={handleNativeShare}
        disabled={isSharing}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
        aria-label={t('studio.shareDesign')}
      >
        {isSharing || isCreatingLink ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Share2 className="w-4 h-4" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">Share</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        aria-label={t('studio.shareDesign')}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {isCreatingLink ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Share2 className="w-4 h-4" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">Share</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div 
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-stone-800 shadow-lg border border-stone-200 dark:border-stone-700 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
            role="menu"
          >
            {shareOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => option.action()}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                role="menuitem"
              >
                <option.icon className="w-4 h-4 text-stone-500 dark:text-stone-400" aria-hidden="true" />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
