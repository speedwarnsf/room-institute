/**
 * AuthGate — Sign in screen shown when accessing gated features without auth
 */

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { X, Mail, Chrome, LogIn } from 'lucide-react';

interface AuthGateProps {
  onClose: () => void;
  message?: string;
}

export function AuthGate({ onClose, message }: AuthGateProps) {
  const { signInGoogle, signInApple, signInMagic, signInPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'main' | 'password'>('password');
  const [magicSent, setMagicSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleMagicLink = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInMagic(email);
      setMagicSent(true);
    } catch (e: any) {
      setError(e.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-stone-900 border border-stone-700 p-8 shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-200 transition-colors"
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif font-bold text-white mb-2">
            Sign in to save your designs
          </h2>
          {message && (
            <p className="text-stone-400 text-sm">{message}</p>
          )}
        </div>

        {mode === 'password' ? (
          <>
            <div className="space-y-3 mb-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-stone-800 border border-stone-600 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (async () => {
                  setLoading(true); setError(null);
                  try { await signInPassword(email, password); onClose(); }
                  catch (err: any) { setError(err.message || 'Login failed'); }
                  finally { setLoading(false); }
                })()}
                placeholder={t('auth.password')}
                className="w-full px-4 py-3 bg-stone-800 border border-stone-600 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={async () => {
                  setLoading(true); setError(null);
                  try { await signInPassword(email, password); onClose(); }
                  catch (err: any) { setError(err.message || 'Login failed'); }
                  finally { setLoading(false); }
                }}
                disabled={loading}
                className="w-full px-4 py-3 bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
            <button onClick={() => { setMode('main'); setError(null); }} className="w-full text-center text-stone-500 hover:text-stone-300 text-sm transition-colors py-2">← Back</button>
          </>
        ) : magicSent ? (
          <div className="text-center py-4">
            <Mail className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">Check your email</p>
            <p className="text-stone-400 text-sm">
              We sent a magic link to <strong className="text-stone-200">{email}</strong>
            </p>
          </div>
        ) : (
          <>
            {/* OAuth buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={async () => { setLoading(true); try { await signInGoogle(); } catch {} setLoading(false); }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-stone-900 font-medium hover:bg-stone-100 transition-colors disabled:opacity-50"
              >
                <Chrome className="w-5 h-5" />
                Continue with Google
              </button>
              <button
                onClick={async () => { setLoading(true); try { await signInApple(); } catch {} setLoading(false); }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-stone-800 text-white font-medium hover:bg-stone-700 border border-stone-600 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                Continue with Apple
              </button>
              <button
                onClick={() => setMode('password')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-stone-800 text-white font-medium hover:bg-stone-700 border border-stone-600 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                Sign in with email &amp; password
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-stone-700" />
              <span className="text-stone-500 text-xs uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-stone-700" />
            </div>

            {/* Email magic link */}
            <div className="space-y-3 mb-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMagicLink()}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-stone-800 border border-stone-600 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={handleMagicLink}
                disabled={loading}
                className="w-full px-4 py-3 bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send magic link'}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center mb-4">{error}</p>
            )}
          </>
        )}

        {/* Continue free */}
        <button
          onClick={onClose}
          className="w-full text-center text-stone-500 hover:text-stone-300 text-sm transition-colors py-2"
        >
          Continue free
        </button>
      </div>
    </div>
  );
}
