/**
 * TWA (Trusted Web Activity) detection.
 *
 * WHY THIS EXISTS — Google Play policy
 * ------------------------------------
 * Play requires apps distributed through the Play Store to use Google Play Billing
 * for digital goods and subscriptions. Cowculator sells Pro through Stripe, so the
 * Android build ships as a *consumption-only* app: an app that lets users access
 * something they purchased elsewhere, and does not sell anything in-app.
 *
 * Consumption-only is an explicit, first-party exception in Play's Payments policy.
 * To stay inside it, when running as the Android app we must not:
 *   - present a purchase flow, or
 *   - link out to a web checkout.
 *
 * Showing that a feature is Pro-only is fine. Selling, or linking to a sale, is not.
 *
 * HOW DETECTION WORKS
 * -------------------
 * A TWA sets `document.referrer` to `android-app://<package-name>` on the initial
 * document load. That signal is only present on that first navigation — any
 * client-side route change replaces it — so the result is latched into sessionStorage
 * the first time it is observed and read from there afterwards.
 *
 * Deliberately NOT used as a signal: `display-mode: standalone`. That is also true of
 * an installed PWA on desktop or iOS, neither of which is distributed through Play and
 * neither of which should lose the ability to buy Pro.
 */

const STORAGE_KEY = 'cowculator_is_twa';
const TWA_REFERRER_PREFIX = 'android-app://';

function detect(): boolean {
  if (typeof window === 'undefined') return false;

  // Latched value from a previous navigation in this session.
  try {
    if (window.sessionStorage.getItem(STORAGE_KEY) === 'true') return true;
  } catch {
    // sessionStorage can throw in locked-down privacy modes; fall through to referrer.
  }

  const isTwa = typeof document !== 'undefined' && document.referrer.startsWith(TWA_REFERRER_PREFIX);

  if (isTwa) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Non-fatal: we simply re-detect from the referrer if it is still present.
    }
  }

  return isTwa;
}

/**
 * True when the app is running inside the Play-distributed Android wrapper.
 *
 * Callers should use this to hide purchase affordances, never to gate functionality
 * the user has already paid for.
 */
export function isRunningInTwa(): boolean {
  return detect();
}
