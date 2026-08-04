/**
 * PrivacyPolicyPage — public route at /privacy
 *
 * Content is written against the ACTUAL Supabase schema as of 2026-08-03:
 * profiles, debts, payments, received_paychecks, assets, budget_settings,
 * subscriptions, custom_categories, strategy_settings, user_subscriptions.
 * If a table or column changes, update this page in the same commit.
 */

import { LegalPageShell, LegalSection } from './LegalPageShell';

export function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated="August 3, 2026">
      <p className="text-lg">
        Cowculator is a debt payoff app. That means you trust us with some of the most
        sensitive numbers in your life. This page explains exactly what we collect, where it
        goes, and how to get rid of it — in plain language, without the usual hedging.
      </p>

      <LegalSection heading="The short version">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            The free calculator on our home page stores nothing. The math runs in your browser.
          </li>
          <li>
            If you create an account, your financial data is stored in our database so you can
            come back to it. Only you can read it.
          </li>
          <li>
            <strong>We do not use any analytics, advertising, or tracking services.</strong> No
            Google Analytics, no advertising pixels, no session recording, no third-party
            trackers of any kind.
          </li>
          <li>We do not sell your data. We do not share it for advertising. Ever.</li>
          <li>You can delete your account and everything in it at any time.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="What we collect">
        <p>
          <strong>If you only use the calculator on our home page:</strong> nothing. No account,
          no email, no stored numbers. Values you type stay in your browser.
        </p>
        <p>
          <strong>If you create an account,</strong> we store what you choose to enter:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Account details</strong> — your email address, and a display name and
            preferences (currency, date format, theme) if you set them.
          </li>
          <li>
            <strong>Debts</strong> — the name, category, current balance, original balance,
            interest rate (APR), minimum payment, due day, and credit limit for each debt you add.
          </li>
          <li>
            <strong>Payments</strong> — amounts, principal and interest split, dates, and any
            notes you write.
          </li>
          <li>
            <strong>Income</strong> — your income sources, pay schedule, expected and actual
            paycheck amounts, and monthly expenses.
          </li>
          <li>
            <strong>Assets</strong> — names, types, balances, balance history, the institution
            name if you enter one, and interest rates.
          </li>
          <li>
            <strong>Recurring subscriptions</strong> — names, amounts, billing frequency, and
            next billing dates you track.
          </li>
          <li>
            <strong>Plan settings</strong> — your chosen payoff strategy and budget allocation.
          </li>
        </ul>
        <p>
          <strong>We never ask for and never store</strong> bank login credentials, account
          numbers, card numbers, or your Social Security number. We do not connect to your bank.
          Every figure in Cowculator is one you typed in yourself.
        </p>
      </LegalSection>

      <LegalSection heading="Payment information">
        <p>
          Payments for Cowculator Pro are processed by <strong>Stripe</strong>. Your card details
          go directly to Stripe and are never sent to or stored on our servers. We store only a
          Stripe customer reference, your plan type, and your subscription status, so we know
          whether to unlock Pro features.
        </p>
        <p>
          Stripe handles that data under its own privacy policy, available at{' '}
          <a
            href="https://stripe.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary-700 dark:text-primary-300 underline"
          >
            stripe.com/privacy
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="Who else touches your data">
        <p>Three service providers, each doing one job:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Supabase</strong> — hosts our database and handles sign-in. Your financial
            data lives here, encrypted at rest, protected by row-level security so that your rows
            are readable only by your account.
          </li>
          <li>
            <strong>Vercel</strong> — hosts and serves the website.
          </li>
          <li>
            <strong>Stripe</strong> — processes payments, as described above.
          </li>
        </ul>
        <p>
          If you choose to sign in with Google, Google confirms your identity to us and shares
          your email address. We receive nothing else from your Google account.
        </p>
        <p>
          That is the complete list. We have no advertising partners and no data brokers, because
          we do not run ads and do not sell data.
        </p>
      </LegalSection>

      <LegalSection heading="What we use it for">
        <p>
          Only to run the app for you: calculating your payoff plan, showing your progress, saving
          your work between visits, and unlocking Pro if you have paid for it. We also use your
          email address to send account and billing messages, and — if you have opted in — the
          occasional product update.
        </p>
        <p>
          We do not use your financial data to train machine learning models, and we do not build
          advertising profiles from it.
        </p>
      </LegalSection>

      <LegalSection heading="Deleting your data">
        <p>
          You can delete individual debts, payments, assets, and subscriptions inside the app at
          any time, and that removes them from our database.
        </p>
        <p>
          To delete your entire account and all associated data, email{' '}
          <a
            href="mailto:support@cowculator.net"
            className="font-medium text-primary-700 dark:text-primary-300 underline"
          >
            support@cowculator.net
          </a>{' '}
          from the address on your account. We will delete everything within 30 days and confirm
          when it is done. Some records may persist briefly in encrypted backups before those
          expire on their normal rotation.
        </p>
        <p>
          Billing records that we are legally required to retain are kept by Stripe under their
          own retention rules.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, export, or
          delete your personal data, and to object to certain processing. Email us and we will
          honour these requests regardless of where you live — it is easier than checking.
        </p>
      </LegalSection>

      <LegalSection heading="Children">
        <p>
          Cowculator is not intended for anyone under 13, and we do not knowingly collect data
          from children. If you believe a child has created an account, email us and we will
          remove it.
        </p>
      </LegalSection>

      <LegalSection heading="Security">
        <p>
          Data is encrypted in transit (HTTPS) and at rest. Access to your rows is restricted by
          row-level security policies at the database level, not merely in application code. That
          said, no service can promise perfect security, and we will not pretend otherwise. If a
          breach ever affects your data, we will tell you promptly and directly.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          If this policy changes in a way that materially affects how we handle your data, we will
          email account holders before the change takes effect. The "last updated" date at the top
          always reflects the current version.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
