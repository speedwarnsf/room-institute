/**
 * DesignExportMenu — Dropdown menu for design export/download actions.
 * Pro users get high-res; free users get watermarked previews.
 * NO border-radius. NO emojis.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, FileText, Image, Share2, ChevronDown, Loader2, Lock } from 'lucide-react';
import { useAuth } from './AuthProvider';
import {
  downloadDesignImage,
  downloadBeforeAfter,
  downloadDesignReport,
  downloadSocialTemplate,
} from '../services/designExport';
import type { LookbookEntry } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface DesignExportMenuProps {
  entry: LookbookEntry;
  sourceImage?: { base64: string; mimeType: string };
  /** Compact mode — just icon buttons instead of full dropdown */
  compact?: boolean;
  className?: string;
}

type ExportAction = 'image' | 'before-after' | 'pdf' | 'instagram' | 'pinterest';

export function DesignExportMenu({ entry, sourceImage, compact = false, className = '' }: DesignExportMenuProps) {
  const { userTier } = useAuth();
  const isPro = userTier.tier === 'pro';
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<ExportAction | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const run = useCallback(async (action: ExportAction) => {
    setLoading(action);
    try {
      switch (action) {
        case 'image':
          await downloadDesignImage(entry.option, isPro);
          break;
        case 'before-after':
          if (!sourceImage) throw new Error('No source image for comparison');
          await downloadBeforeAfter(sourceImage.base64, sourceImage.mimeType, entry.option, isPro);
          break;
        case 'pdf':
          await downloadDesignReport(entry, sourceImage?.base64, sourceImage?.mimeType, isPro);
          break;
        case 'instagram':
          await downloadSocialTemplate({ option: entry.option, isPro, format: 'instagram' });
          break;
        case 'pinterest':
          await downloadSocialTemplate({ option: entry.option, isPro, format: 'pinterest' });
          break;
      }
    } catch (err) {
      console.error(`Export ${action} failed:`, err);
    } finally {
      setLoading(null);
    }
  }, [entry, sourceImage, isPro]);

  const hasImage = !!entry.option.visualizationImage;
  const hasSource = !!sourceImage;

  const items: { action: ExportAction; label: string; icon: typeof Download; disabled: boolean; proOnly: boolean }[] = [
    { action: 'image', label: 'Download Design', icon: Download, disabled: !hasImage, proOnly: false },
    { action: 'before-after', label: 'Before / After', icon: Image, disabled: !hasImage || !hasSource, proOnly: false },
    { action: 'pdf', label: 'Design Report (PDF)', icon: FileText, disabled: false, proOnly: false },
    { action: 'instagram', label: 'Instagram Template', icon: Share2, disabled: !hasImage, proOnly: false },
    { action: 'pinterest', label: 'Pinterest Template', icon: Share2, disabled: !hasImage, proOnly: false },
  ];

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={() => hasImage && run('image')}
          disabled={!hasImage || loading === 'image'}
          className="h-10 px-4 bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center gap-2 hover:bg-black/70 transition-colors text-xs uppercase tracking-widest text-neutral-300 disabled:opacity-40"
          aria-label="Download design image"
        >
          {loading === 'image' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          <span className="hidden sm:inline">Image</span>
          {!isPro && <span className="text-[9px] text-neutral-500 hidden sm:inline">(preview)</span>}
        </button>
        <button
          onClick={() => run('pdf')}
          disabled={loading === 'pdf'}
          className="h-10 px-4 bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center gap-2 hover:bg-black/70 transition-colors text-xs uppercase tracking-widest text-neutral-300 disabled:opacity-40"
          aria-label="Download PDF report"
        >
          {loading === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          <span className="hidden sm:inline">PDF</span>
        </button>
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="h-10 px-3 bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center gap-1 hover:bg-black/70 transition-colors text-xs uppercase tracking-widest text-neutral-300"
            aria-label="More export options"
            aria-expanded={open}
          >
            <Share2 size={16} />
            <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-neutral-900 border border-neutral-700 shadow-xl z-50">
              {items.filter(i => i.action !== 'image' && i.action !== 'pdf').map((item) => (
                <button
                  key={item.action}
                  onClick={() => { run(item.action); setOpen(false); }}
                  disabled={item.disabled || loading === item.action}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading === item.action ? <Loader2 size={14} className="animate-spin" /> : <item.icon size={14} />}
                  <span className="flex-1 text-left">{item.label}</span>
                  {!isPro && <span className="text-[10px] text-neutral-500">preview</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full dropdown mode
  return (
    <div ref={menuRef} className={`relative inline-block ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-5 py-3 border border-neutral-700 text-sm text-neutral-300 hover:bg-neutral-900 hover:border-neutral-500 transition-all"
        aria-label="Export and download options"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Download size={16} />
        Export / Download
        {!isPro && <Lock size={12} className="text-neutral-500" />}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-neutral-900 border border-neutral-700 shadow-xl z-50" role="menu">
          {!isPro && (
            <div className="px-4 py-2 border-b border-neutral-800 text-[11px] text-neutral-500">
              Free tier -- downloads include watermark at lower resolution.
              Upgrade for full quality.
            </div>
          )}
          {items.map((item) => (
            <button
              key={item.action}
              onClick={() => { run(item.action); setOpen(false); }}
              disabled={item.disabled || loading === item.action}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              role="menuitem"
            >
              {loading === item.action ? <Loader2 size={14} className="animate-spin" /> : <item.icon size={14} />}
              <span className="flex-1 text-left">{item.label}</span>
              {!isPro && !item.disabled && <span className="text-[10px] text-neutral-500">preview</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DesignExportMenu;
