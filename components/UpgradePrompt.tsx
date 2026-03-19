/**
 * UpgradePrompt — Clean, compelling modal shown when free user taps a gated feature
 */

import { X, Sparkles, Zap, Layers, Palette, Home, Download } from 'lucide-react';

interface UpgradePromptProps {
  message: string;
  onUpgrade: () => void;
  onDismiss: () => void;
  onSignIn?: () => void;
}

const PRO_PERKS = [
  { icon: Zap, text: '50 designs / month' },
  { icon: Layers, text: '100 iterations / month' },
  { icon: Palette, text: 'Design Studio access' },
  { icon: Home, text: '10 saved rooms' },
  { icon: Download, text: 'PDF export and high-res downloads' },
];

export function UpgradePrompt({ message, onUpgrade, onDismiss, onSignIn }: UpgradePromptProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm bg-stone-900 border border-stone-700 p-8 shadow-2xl text-center">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-200 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
          <Sparkles className="w-7 h-7 text-emerald-400" />
        </div>

        <h3 style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg font-bold text-white mb-2">
          Unlock the full experience
        </h3>

        <p className="text-stone-400 text-sm mb-6">{message}</p>

        <div className="text-left space-y-2.5 mb-6 border-t border-stone-700 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-3">Pro includes</p>
          {PRO_PERKS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5">
              <Icon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-sm text-stone-300">{text}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2.5 mb-3">
          <div className="flex gap-3 text-center">
            <div className="flex-1 bg-stone-800 p-3">
              <div className="text-lg font-bold text-white">$10</div>
              <div className="text-[10px] text-stone-400 uppercase tracking-wide">/ month</div>
            </div>
            <div className="flex-1 bg-emerald-900/30 border border-emerald-600/30 p-3">
              <div className="text-lg font-bold text-emerald-400">$80</div>
              <div className="text-[10px] text-emerald-400/70 uppercase tracking-wide">/ year (save 33%)</div>
            </div>
          </div>
        </div>

        <button
          onClick={onUpgrade}
          className="w-full px-6 py-3 bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors mb-3 shadow-lg shadow-emerald-600/20"
        >
          View Plans
        </button>
        {onSignIn && (
          <button
            onClick={onSignIn}
            className="w-full text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors py-2 mb-1"
          >
            Already have an account? Sign in
          </button>
        )}
        <button
          onClick={onDismiss}
          className="w-full text-stone-500 hover:text-stone-300 text-sm transition-colors py-2"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
