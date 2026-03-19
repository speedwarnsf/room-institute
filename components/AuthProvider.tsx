/**
 * AuthProvider — React context for auth state, subscription, and gating
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { getCurrentUser, onAuthStateChange, signOut as authSignOut, signInWithGoogle, signInWithApple, signInWithMagicLink, signInWithPassword } from '../services/auth';
import { migrateLocalRoomsToSupabase } from '../services/houseRoomStorage';
import { getSubscription, getUserUsage, getFreeUsage, Subscription, UsageData } from '../services/subscription';
import { UserTier, FREE_TIER, PRO_TIER } from '../services/gating';

interface AuthContextType {
  user: User | null;
  subscription: Subscription | null;
  userTier: UserTier;
  isLoading: boolean;
  signInGoogle: () => Promise<void>;
  signInApple: () => Promise<void>;
  signInMagic: (email: string) => Promise<void>;
  signInPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshTier: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

const DEFAULT_FREE_TIER: UserTier = {
  tier: 'free',
  generationsUsed: 0,
  ...FREE_TIER,
  iterationsUsed: 0,
  roomsUsed: 0,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [userTier, setUserTier] = useState<UserTier>(DEFAULT_FREE_TIER);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const refreshTier = useCallback(async () => {
    if (user) {
      // Authenticated user — check subscription + usage
      const [sub, usage] = await Promise.all([
        getSubscription(user.id).catch(() => null),
        getUserUsage(user.id).catch((): UsageData => ({ generations: 0, iterations: 0, rooms_created: 0 })),
      ]);
      if (!mountedRef.current) return;
      setSubscription(sub);

      const isPro = sub?.status === 'active';
      const limits = isPro ? PRO_TIER : FREE_TIER;

      if (!isPro) {
        // For free authenticated users, also check anonymous usage
        const freeGens = await getFreeUsage().catch(() => 0);
        if (!mountedRef.current) return;
        setUserTier({
          tier: 'free',
          generationsUsed: Math.max(usage.generations, freeGens),
          ...limits,
          iterationsUsed: usage.iterations,
          roomsUsed: usage.rooms_created,
        });
      } else {
        setUserTier({
          tier: 'pro',
          generationsUsed: usage.generations,
          ...limits,
          iterationsUsed: usage.iterations,
          roomsUsed: usage.rooms_created,
        });
      }
    } else {
      // Anonymous user — free tier with localStorage tracking
      const freeGens = await getFreeUsage().catch(() => 0);
      if (!mountedRef.current) return;
      setUserTier({
        ...DEFAULT_FREE_TIER,
        generationsUsed: freeGens,
      });
      setSubscription(null);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const currentUser = await getCurrentUser();
        if (mounted) setUser(currentUser);
      } catch {
        // No user
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    init();

    const sub = onAuthStateChange((newUser) => {
      if (mounted) {
        setUser(newUser);
        setIsLoading(false);
        if (newUser) {
          migrateLocalRoomsToSupabase().catch(console.warn);
        }
      }
    });

    return () => {
      mounted = false;
      sub.unsubscribe();
    };
  }, []);

  // Refresh tier whenever user changes
  useEffect(() => {
    if (!isLoading) refreshTier();
  }, [user, isLoading, refreshTier]);

  const value: AuthContextType = {
    user,
    subscription,
    userTier,
    isLoading,
    signInGoogle: async () => { await signInWithGoogle(); },
    signInApple: async () => { await signInWithApple(); },
    signInMagic: async (email: string) => { await signInWithMagicLink(email); },
    signInPassword: async (email: string, password: string) => { await signInWithPassword(email, password); },
    signOut: async () => {
      await authSignOut();
      setUser(null);
      setSubscription(null);
      setUserTier(DEFAULT_FREE_TIER);
    },
    refreshTier,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
