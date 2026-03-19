/**
 * Subscription & Usage Service
 * Manages Pro subscriptions and usage tracking via Supabase
 */

import { supabase, getAnonymousId } from './auth';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_type: 'monthly' | 'annual';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string | null;
  current_period_end: string | null;
}

export interface UsageData {
  generations: number;
  iterations: number;
  rooms_created: number;
}

/**
 * Get active subscription for a user
 */
export async function getSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as Subscription;
}

/**
 * Get current month's usage for a user
 */
export async function getUserUsage(userId: string): Promise<UsageData> {
  const month = new Date().toISOString().slice(0, 7); // '2026-02'
  const { data } = await supabase
    .from('usage')
    .select('generations, iterations, rooms_created')
    .eq('user_id', userId)
    .eq('month', month)
    .single();

  return data ?? { generations: 0, iterations: 0, rooms_created: 0 };
}

/**
 * Increment usage counter for a user
 */
export async function incrementUsage(userId: string, type: 'generation' | 'iteration' | 'room'): Promise<void> {
  const month = new Date().toISOString().slice(0, 7);
  const column = type === 'generation' ? 'generations' : type === 'iteration' ? 'iterations' : 'rooms_created';

  // Upsert: create row if it doesn't exist, increment if it does
  const { data: existing } = await supabase
    .from('usage')
    .select('id, ' + column)
    .eq('user_id', userId)
    .eq('month', month)
    .single();

  if (existing && 'id' in existing) {
    await supabase
      .from('usage')
      .update({ [column]: (existing as any)[column] + 1, updated_at: new Date().toISOString() })
      .eq('id', (existing as any).id);
  } else {
    await supabase
      .from('usage')
      .insert({ user_id: userId, month, [column]: 1 });
  }
}

/**
 * Get free tier lifetime usage (tracked by anonymous ID, no account needed)
 */
export async function getFreeUsage(): Promise<number> {
  // First check localStorage (works offline, instant)
  const local = localStorage.getItem('zenspace-free-generations');
  const localCount = local ? parseInt(local, 10) : 0;

  // Try to sync with Supabase
  try {
    const anonId = getAnonymousId();
    const { data } = await supabase
      .from('free_usage')
      .select('generations')
      .eq('anonymous_id', anonId)
      .single();

    if (data) {
      const serverCount = data.generations;
      // Use the higher of local vs server (in case of sync issues)
      const best = Math.max(localCount, serverCount);
      localStorage.setItem('zenspace-free-generations', String(best));
      return best;
    }
  } catch {
    // Supabase unavailable — use local count
  }

  return localCount;
}

/**
 * Increment free tier generation count
 */
export async function incrementFreeUsage(): Promise<void> {
  // Always update localStorage (works offline)
  const current = parseInt(localStorage.getItem('zenspace-free-generations') || '0', 10);
  localStorage.setItem('zenspace-free-generations', String(current + 1));

  // Try to sync with Supabase
  try {
    const anonId = getAnonymousId();
    const { data } = await supabase
      .from('free_usage')
      .select('id, generations')
      .eq('anonymous_id', anonId)
      .single();

    if (data) {
      await supabase
        .from('free_usage')
        .update({ generations: data.generations + 1 })
        .eq('id', data.id);
    } else {
      await supabase
        .from('free_usage')
        .insert({ anonymous_id: anonId, generations: current + 1 });
    }
  } catch {
    // Offline — localStorage has the count
  }
}

/**
 * Create a Stripe Checkout session by calling our serverless endpoint
 */
export async function createCheckoutSession(planType: 'monthly' | 'annual'): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ planType }),
  });

  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }

  const { url } = await response.json();
  return url;
}
