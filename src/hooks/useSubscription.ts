/**
 * useSubscription
 *
 * Queries user_subscriptions table and exposes Pro status.
 * Caches result in state to avoid re-fetching on every render.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { SubscriptionPlanType, SubscriptionStatus } from '../types';

export interface SubscriptionInfo {
  isPro: boolean;
  planType: SubscriptionPlanType | null;
  status: SubscriptionStatus | null;
  stripeCustomerId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export function useSubscription(): SubscriptionInfo {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [planType, setPlanType] = useState<SubscriptionPlanType | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setIsPro(false);
      setPlanType(null);
      setStatus(null);
      setStripeCustomerId(null);
      setCurrentPeriodEnd(null);
      setCancelAtPeriodEnd(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        setIsPro(false);
        setPlanType(null);
        setStatus(null);
        setStripeCustomerId(null);
        setCurrentPeriodEnd(null);
        setCancelAtPeriodEnd(false);
      } else {
        // Pro if active/trialing, or lifetime regardless of period
        const isActive =
          data.status === 'active' || data.status === 'trialing';
        const isLifetime = data.plan_type === 'lifetime';
        const notExpired =
          isLifetime || !data.current_period_end || new Date(data.current_period_end) > new Date();

        setIsPro(isActive && notExpired);
        setPlanType(data.plan_type);
        setStatus(data.status);
        setStripeCustomerId(data.stripe_customer_id);
        setCurrentPeriodEnd(data.current_period_end);
        setCancelAtPeriodEnd(data.cancel_at_period_end);
      }
    } catch {
      setIsPro(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    isPro,
    planType,
    status,
    stripeCustomerId,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    isLoading,
    refetch: fetchSubscription,
  };
}
