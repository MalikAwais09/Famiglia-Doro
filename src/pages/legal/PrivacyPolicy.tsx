import { LegalDocLayout } from './LegalDocLayout';

export function PrivacyPolicy() {
  return (
    <LegalDocLayout title="Privacy Policy" effectiveDate="May 2, 2026">
      <section>
        <h2>Data We Collect</h2>
        <p>
          We collect identifiers (name, email, device IDs), authentication tokens, approximate location derived from IP, usage
          metrics, uploads you submit for challenges and chat, transactional records—including DoroCoins and sponsor flows—and
          technical logs aiding security.
        </p>
      </section>
      <section>
        <h2>Sources</h2>
        <p>Direct submissions, integrations (for example Stripe), cookies/local storage equivalents, inferred fraud scores, aggregated OS/browser telemetry voluntarily enabled.</p>
      </section>
      <section>
        <h2>How We Use Data</h2>
        <p>
          Providing accounts, personalization, payouts, leaderboard integrity, enforcing Terms, complying with AML/sanctions where
          triggered—not routine KYC—or responding lawful requests after narrow review.
        </p>
      </section>
      <section>
        <h2>Legal Bases (GDPR &amp; UK-style)</h2>
        <p>
          Performance of contracts, legitimate interests bounded (moderation/analytics minimally invasive), consent where dialogs
          require it, occasional legal obligations. Automated fraud signals may qualify profiling—you may inquire human escalation.
        </p>
      </section>
      <section>
        <h2>Sharing</h2>
        <p>
          Vendors strictly need-to-know; corporate transactions with successor confidentiality; mandated governmental narrow
          disclosure not blanket fishing.
        </p>
      </section>
      <section>
        <h2>Transfers</h2>
        <p>
          Adequacy decisions SCCs/TIA supplements where exporting—contact for summary copies where jurisdiction compels synopsis not full dump.
        </p>
      </section>
      <section>
        <h2>Retention</h2>
        <p>
          Active account plus rolling fraud windows; transactional tax periods; minimized archives after pseudonymisation where permissible.
        </p>
      </section>
      <section>
        <h2>Security</h2>
        <p>No system perfect—report suspected breaches swiftly; MFA encouraged when available rollout phases expand.</p>
      </section>
      <section>
        <h2>Your Rights</h2>
        <p>
          Subject to verification: access/export, rectification, erasure balancing speech/safety equities, restriction, portability
          machine-readable if technically feasible commercially proportionate objection to certain processing withdraw consent anytime.
        </p>
      </section>
      <section>
        <h2>California Notices</h2>
        <p>No sale monetization of standalone personal dossiers—limited ad tech absent if introduced later updated CPRA disclosures appear.</p>
      </section>
      <section>
        <h2>Children</h2>
        <p>Platform not knowingly directed unsupervised minors under applicable thresholds—terminate discovered underage unmanaged accounts swiftly.</p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>Material alterations surfaced in-product; archival prior versions downloadable soon roadmap.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Privacy requests via published channel—we respond SLA aligned regulatory clock starts receipt confirmation.</p>
      </section>
    </LegalDocLayout>
  );
}
