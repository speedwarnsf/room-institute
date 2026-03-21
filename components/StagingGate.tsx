/**
 * StagingGate — password wall for pre-launch.
 * Checks cookie; if not authenticated, shows password form.
 * Remove this component when going public.
 */
import { useState, useEffect } from 'react';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? match[1] : null;
}

export default function StagingGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check cookie client-side first (faster than API call)
    if (getCookie('room_access') === 'granted') {
      setAuthenticated(true);
    }
    setChecking(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const resp = await fetch('/api/auth-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (resp.ok) {
        setAuthenticated(true);
      } else {
        setError('Incorrect password');
      }
    } catch {
      setError('Connection error');
    }
  };

  if (checking) return null;
  if (authenticated) return <>{children}</>;

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Nunito:wght@400;600&display=swap" rel="stylesheet" />
      <div className="w-full max-w-sm text-center">
        <img src="/room-logo.png" alt="Room" style={{ height: 24 }} className="mx-auto mb-8 opacity-60" />
        <h1
          className="text-2xl text-stone-200 mb-2"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          Private Preview
        </h1>
        <p className="text-stone-500 text-sm mb-8" style={{ fontFamily: 'Nunito, sans-serif' }}>
          This site is in development. Enter the password to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 bg-stone-900 border border-stone-700 text-stone-200 text-center text-sm tracking-widest focus:outline-none focus:border-emerald-500 placeholder:text-stone-600"
            style={{ fontFamily: 'Nunito, sans-serif' }}
            autoFocus
          />
          {error && (
            <p className="text-red-400 text-xs mt-2" style={{ fontFamily: 'Nunito, sans-serif' }}>{error}</p>
          )}
          <button
            type="submit"
            className="w-full mt-4 px-4 py-3 bg-emerald-600 text-stone-950 text-xs font-bold uppercase tracking-widest hover:bg-emerald-500 transition-colors"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
