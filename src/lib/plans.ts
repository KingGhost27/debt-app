/**
 * The three Pro plans, shared by the in-app UpgradeModal (which starts Stripe
 * Checkout) and the home page's price board (which only shows them).
 *
 * The ids are what /api/create-checkout maps to Stripe price ids; change them
 * only together with that map.
 */

export type PlanId = 'monthly' | 'annual' | 'lifetime';

export interface PlanOption {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  badge?: string;
  highlight?: boolean;
  features: string[];
  /**
   * The facts the home page's price board prints under the price. It leaves
   * out the modal's "Limited!" badge: the public page uses no pressure devices
   * on money decisions (no urgency badges, countdowns or timers).
   */
  boardNotes: string[];
}

export const PLANS: PlanOption[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$4.99',
    period: '/month',
    features: ['Cancel anytime', 'All Pro features'],
    boardNotes: ['Cancel anytime'],
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '$39.99',
    period: '/year',
    badge: 'Save 33%',
    highlight: true,
    features: ['Best value', 'All Pro features', '~$3.33/month'],
    boardNotes: ['Save 33%', '~$3.33/month'],
  },
  {
    id: 'lifetime',
    name: 'OG Heifer',
    price: '$19',
    period: 'one-time',
    badge: 'Limited!',
    features: ['Pay once, Pro forever', 'First 200-300 members only', 'OG Heifer badge'],
    boardNotes: ['Pay once, Pro forever', 'First 200-300 members only'],
  },
];
