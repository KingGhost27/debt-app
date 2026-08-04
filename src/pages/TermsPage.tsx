/**
 * TermsPage — public route at /terms
 *
 * The financial-advice disclaimer is the load-bearing section: Cowculator projects
 * payoff dates and interest totals from user-entered figures, and users may make real
 * money decisions from them.
 */

import { LegalPageShell, LegalSection } from './LegalPageShell';

export function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" lastUpdated="August 3, 2026">
      <p className="text-lg">
        These terms cover your use of Cowculator. By creating an account or using the app, you
        agree to them.
      </p>

      <LegalSection heading="Cowculator is not financial advice">
        <p>
          This is the most important section on this page, so it goes first.
        </p>
        <p>
          Cowculator is a calculator. It takes the numbers you enter and projects what your debt
          payoff could look like. It is <strong>not</strong> financial, legal, tax, or credit
          advice, and we are not your financial advisor, broker, or fiduciary.
        </p>
        <p>
          Projections are estimates based entirely on the figures you provide and on assumptions
          that will not perfectly match reality. Real interest is compounded by your lender on
          their schedule, not ours. Rates change. Fees, penalties, promotional periods, and
          minimum-payment formulas vary by lender and are not modelled. A payoff date shown in
          Cowculator is an informed projection, not a promise.
        </p>
        <p>
          Decisions about your money are yours. For advice specific to your situation, talk to a
          qualified financial professional.
        </p>
      </LegalSection>

      <LegalSection heading="Your account">
        <p>
          You need an account to save your data. You are responsible for keeping your login
          secure and for activity that happens under your account. Tell us promptly if you think
          someone else has access.
        </p>
        <p>
          You must be at least 13 years old, and old enough to enter a binding agreement where you
          live.
        </p>
        <p>
          The accuracy of what Cowculator shows you depends entirely on the accuracy of what you
          enter. Garbage in, garbage out — that part is on you.
        </p>
      </LegalSection>

      <LegalSection heading="Free and Pro">
        <p>
          The calculator on our home page is free and requires no account. A free account is free
          permanently, with limits on some features. Cowculator Pro is a paid upgrade that unlocks
          additional features, and its price and contents are shown at the point of purchase.
        </p>
        <p>
          Subscriptions renew automatically until cancelled. You can cancel at any time from the
          billing portal in Settings; you keep Pro access through the end of the period you have
          already paid for. Lifetime purchases are one-time and do not renew.
        </p>
        <p>
          If Pro is not what you expected, email us within 30 days of purchase and we will refund
          you. A debt payoff plan takes a real billing cycle to live with, so we would rather give
          you a full month to decide than rush you. Beyond that window, refunds are at our
          discretion — but ask, and we will be reasonable about it.
        </p>
        <p>
          If we ever change what Pro includes in a way that removes something you paid for, we
          will tell you first and offer a refund.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>Please do not:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>break into, overload, probe, or disrupt the service or its infrastructure;</li>
          <li>access another user's account or data;</li>
          <li>scrape or bulk-extract the service, or resell it as your own;</li>
          <li>use Cowculator for anything unlawful.</li>
        </ul>
        <p>
          We may suspend accounts that do these things. If we suspend yours and you think we got
          it wrong, email us — we would rather fix a mistake than keep it.
        </p>
      </LegalSection>

      <LegalSection heading="Your data belongs to you">
        <p>
          You keep ownership of everything you enter. You grant us only the permission needed to
          store and process it in order to run the service for you. How we handle it is described
          in our{' '}
          <a
            href="/privacy"
            className="font-medium text-primary-700 dark:text-primary-300 underline"
          >
            Privacy Policy
          </a>
          .
        </p>
        <p>
          Cowculator itself — the software, design, mascots, and brand — remains ours.
        </p>
      </LegalSection>

      <LegalSection heading="Availability">
        <p>
          We aim to keep Cowculator running, but we do not guarantee uninterrupted availability.
          The service may be unavailable for maintenance, or because of a problem at one of the
          providers we depend on. Cowculator is provided "as is", without warranties of any kind.
        </p>
        <p>
          Keep your own records of anything you would be upset to lose. This is a planning tool,
          not a system of record for your finances.
        </p>
      </LegalSection>

      <LegalSection heading="Limitation of liability">
        <p>
          To the fullest extent permitted by law, we are not liable for indirect, incidental, or
          consequential damages, or for lost profits or lost savings, arising from your use of
          Cowculator — including any financial decision you make based on its projections.
        </p>
        <p>
          Our total liability for any claim relating to the service is limited to the amount you
          paid us in the twelve months before the claim arose.
        </p>
        <p>
          Some jurisdictions do not allow certain limitations, in which case the limitations above
          apply only to the extent permitted.
        </p>
      </LegalSection>

      <LegalSection heading="Ending things">
        <p>
          You can stop using Cowculator and delete your account at any time. We may suspend or end
          your access if you materially breach these terms. If we discontinue the service
          entirely, we will give account holders reasonable notice and a way to export their data.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to these terms">
        <p>
          We may update these terms. For material changes we will notify account holders by email
          before they take effect. Continuing to use Cowculator after that means you accept the
          updated terms.
        </p>
      </LegalSection>

      <LegalSection heading="Governing law">
        <p>
          These terms are governed by the laws of the State of Texas, United States, without
          regard to its conflict-of-laws rules.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
