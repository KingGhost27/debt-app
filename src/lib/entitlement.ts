export type EntitlementProvider = 'stripe' | 'play';

export interface EntitlementRowLike {
  plan_type: string;
  status: string;
  current_period_end: string | null;
  provider?: string | null;
}

/**
 * Single place where a subscription row becomes an entitlement decision.
 * Keeping this import-free lets frontend and serverless code share it when
 * Play Billing adds a second writer instead of forcing a rewrite.
 */
export function resolveEntitlement(
  row: EntitlementRowLike | null | undefined,
  now: Date = new Date(),
): { isPro: boolean; provider: EntitlementProvider | null } {
  if (!row) {
    return { isPro: false, provider: null };
  }

  const isActive = row.status === 'active' || row.status === 'trialing';
  const isLifetime = row.plan_type === 'lifetime';
  const notExpired =
    isLifetime || !row.current_period_end || new Date(row.current_period_end) > now;

  return {
    isPro: isActive && notExpired,
    provider: row.provider === 'play' ? 'play' : 'stripe',
  };
}
