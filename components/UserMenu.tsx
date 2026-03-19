/**
 * UserMenu — Avatar/menu in header for logged-in users, Pro badge, usage indicator
 */

import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { LogOut, Crown, User as UserIcon } from 'lucide-react';

interface UserMenuProps {
  onOpenPricing: () => void;
  onOpenAuth?: () => void;
}

export function UserMenu({ onOpenPricing, onOpenAuth }: UserMenuProps) {
  const { user, userTier, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const remaining = userTier.generationsLimit - userTier.generationsUsed;

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        {/* Usage indicator for anonymous users */}
        {userTier.tier === 'free' && (
          <button
            onClick={onOpenPricing}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors"
            title={`${remaining} free design${remaining === 1 ? '' : 's'} remaining`}
          >
            <span className={remaining <= 1 ? 'text-emerald-400' : 'text-emerald-500'}>{remaining}</span>
            <span>/ {userTier.generationsLimit} free</span>
          </button>
        )}
        <button
          onClick={() => {
            if (onOpenAuth) onOpenAuth();
            else onOpenPricing();
          }}
          className="fixed bottom-5 right-5 z-40 w-10 h-10 bg-stone-800/80 dark:bg-stone-700/80 backdrop-blur-sm border border-stone-600/50 flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-700 dark:hover:bg-stone-600 transition-all shadow-lg"
          aria-label="Sign in"
        >
          <UserIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const initials = (user.user_metadata?.full_name || user.email || '?')
    .split(' ')
    .map((s: string) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        {userTier.tier === 'pro' && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 text-emerald-500 text-xs font-medium">
            <Crown className="w-3 h-3" />
            Pro
          </span>
        )}
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-8 h-8" />
        ) : (
          <div className="w-8 h-8 bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-medium text-stone-600 dark:text-stone-300">
            {initials}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-stone-800 border border-stone-700 shadow-xl py-1 z-50">
          <div className="px-4 py-2 border-b border-stone-700">
            <p className="text-sm text-white font-medium truncate">{user.user_metadata?.full_name || 'User'}</p>
            <p className="text-xs text-stone-400 truncate">{user.email}</p>
          </div>
          {/* Usage stats */}
          <div className="px-4 py-2 border-b border-stone-700 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-stone-400">Designs</span>
              <span className="text-stone-300">{userTier.generationsUsed} / {userTier.generationsLimit}</span>
            </div>
            <div className="w-full h-1 bg-stone-700">
              <div
                className={`h-full transition-all ${userTier.generationsUsed >= userTier.generationsLimit ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, (userTier.generationsUsed / userTier.generationsLimit) * 100)}%` }}
              />
            </div>
            {userTier.tier === 'pro' && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Iterations</span>
                  <span className="text-stone-300">{userTier.iterationsUsed} / {userTier.iterationsLimit}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Rooms</span>
                  <span className="text-stone-300">{userTier.roomsUsed} / {userTier.roomsLimit}</span>
                </div>
              </>
            )}
          </div>
          {userTier.tier === 'free' && (
            <button
              onClick={() => { setOpen(false); onOpenPricing(); }}
              className="w-full px-4 py-2 text-left text-sm text-emerald-400 hover:bg-stone-700 flex items-center gap-2 transition-colors"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Pro
            </button>
          )}
          <button
            onClick={async () => { setOpen(false); await signOut(); }}
            className="w-full px-4 py-2 text-left text-sm text-stone-300 hover:bg-stone-700 flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
