/**
 * Vercel Serverless Function: Create Stripe Checkout Session
 * 
 * POST /api/create-checkout
 * Body: { planType: 'monthly' | 'annual' }
 * Returns: { url: string }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' as any });

const supabaseAdmin = createClient(
  'https://vqkoxfenyjomillmxawh.supabase.co',
  process.env.SUPABASE_SERVICE_KEY!
);

// These should be created in Stripe Dashboard and stored as env vars
const PRICE_IDS: Record<string, string> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_1SzX4lKjTATVIGPiNlld66wS',
  annual: process.env.STRIPE_PRICE_ANNUAL || 'price_1SzX4pKjTATVIGPixyI8o1Ua',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planType } = req.body as { planType: 'monthly' | 'annual' };

    if (!planType || !['monthly', 'annual'].includes(planType)) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    // Get user from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user already has a Stripe customer
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_IDS[planType], quantity: 1 }],
      success_url: `${req.headers.origin || 'https://room-institute.app'}?checkout=success`,
      cancel_url: `${req.headers.origin || 'https://room-institute.app'}?checkout=cancel`,
      metadata: {
        supabase_user_id: user.id,
        plan_type: planType,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
