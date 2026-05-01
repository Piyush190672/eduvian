import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — EduvianAI",
  description: "How EduvianAI collects, uses, shares, and protects your personal data, including DPDPA, GDPR, and UK-GDPR compliance.",
};

/**
 * Privacy Policy for EduvianAI.
 *
 * DRAFT — REQUIRES LEGAL REVIEW BEFORE PUBLICATION.
 *
 * Drafted to satisfy India's Digital Personal Data Protection Act 2023
 * (DPDPA), the Information Technology Act 2000 and SPDI Rules 2011, the
 * EU GDPR, and UK GDPR. A qualified attorney must review this for the
 * operating jurisdiction. The Grievance Officer / Data Protection
 * Officer details and the corporate registration details below are
 * placeholders that must be filled before publication.
 */
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-12 prose prose-gray prose-sm sm:prose-base">
        <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 no-underline">← Back to home</Link>

        <h1 className="mt-6 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mt-0">Last updated: 1 May 2026</p>

        <p className="text-sm bg-blue-50 border border-blue-200 rounded p-3">
          This Privacy Policy explains how EduvianAI (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) collects, uses, shares, and protects your personal data when you use our website at eduvianai.com and related services (the &ldquo;Platform&rdquo;). It is incorporated into our <Link href="/terms">Terms of Use</Link>.
        </p>

        <h2 id="who-we-are">1. Who We Are (Data Fiduciary / Data Controller)</h2>
        <p>
          EduvianAI is the entity that determines the purposes and means of processing your personal data. For purposes of the Indian Digital Personal Data Protection Act, 2023 (&ldquo;DPDPA&rdquo;), we are the &ldquo;Data Fiduciary&rdquo;. For purposes of the EU GDPR and UK GDPR (where applicable), we are the &ldquo;Data Controller&rdquo;.
        </p>

        <h2 id="data-we-collect">2. Personal Data We Collect</h2>
        <h3>2.1 Information You Provide Directly</h3>
        <ul>
          <li><b>Identity and contact information</b>: full name, email address, phone number, nationality, city of residence.</li>
          <li><b>Academic information</b>: current degree, major / stream, institution, graduation year, GPA / percentage, backlog history, research papers, work experience.</li>
          <li><b>Test scores</b>: IELTS / TOEFL / PTE / Duolingo, GRE / GMAT, SAT / ACT.</li>
          <li><b>Preferences</b>: target country and region, intake year and semester, budget range, intended field of study, scholarship requirements.</li>
          <li><b>Family and financial signals</b>: family income range, family-abroad indicator, visa history, passport status. We do not collect bank account, credit card, PAN, Aadhaar, or other financial-account identifiers.</li>
          <li><b>User Content</b>: drafts of statements of purpose, letters of recommendation, application essays, or other documents you submit to AI tools.</li>
        </ul>

        <h3>2.2 Information We Collect Automatically</h3>
        <ul>
          <li>Device and browser information (user agent, screen size, time zone);</li>
          <li>IP address and approximate geographic location derived from it;</li>
          <li>Pages visited, features used, time of visit, referring URL;</li>
          <li>Anonymous identifiers stored in browser cookies / localStorage to recognise you across visits and to enforce fair-use limits on AI tools.</li>
        </ul>

        <h3>2.3 Information from Third Parties</h3>
        <p>
          If you log in or sign up using a third-party identity provider (e.g., Google), we receive the basic profile information that provider shares with us at sign-in. We do not receive your credentials.
        </p>

        <h3>2.4 Children&rsquo;s Data</h3>
        <p>
          The Platform is not directed at children under 18. If you are under 18 and accessing the Platform with parental consent, your parent or legal guardian is the &ldquo;Data Principal&rdquo; for purposes of the DPDPA. We will obtain verifiable parental consent before processing your personal data and will not use your data for behavioural advertising or profiling that may be detrimental to your wellbeing.
        </p>

        <h2 id="purposes">3. Purposes for Which We Process Your Data</h2>
        <ul>
          <li>To generate program recommendations matched to your profile;</li>
          <li>To compute match scores, ROI estimates, and tool outputs;</li>
          <li>To deliver application-related tools (SOP Assistant, LOR Coach, Visa Coach, Interview Prep, English-Test Lab);</li>
          <li>To send you your match-results email and any service notifications you have opted into;</li>
          <li>To enforce fair-use limits on AI tools (one-call-per-day quota etc.);</li>
          <li>To monitor and improve the Platform&rsquo;s quality, accuracy, and security;</li>
          <li>To detect and prevent fraud, abuse, or unauthorised access;</li>
          <li>To comply with legal obligations and respond to lawful requests by public authorities.</li>
        </ul>

        <h2 id="legal-basis">4. Legal Basis for Processing</h2>
        <p>We process your personal data on one or more of the following bases:</p>
        <ul>
          <li><b>Consent</b> (DPDPA s.6, GDPR Art. 6(1)(a)): when you submit your profile, you give us your explicit consent to process your data for the purposes set out in this Policy.</li>
          <li><b>Performance of a contract</b> (GDPR Art. 6(1)(b)): processing is necessary to perform the services you request through the Platform.</li>
          <li><b>Legitimate interests</b> (GDPR Art. 6(1)(f)): for security, fraud prevention, fair-use enforcement, and Platform improvement, where these interests are not overridden by your rights.</li>
          <li><b>Legal obligation</b> (GDPR Art. 6(1)(c) / DPDPA s.7(b)): where we are required to retain or disclose data by law.</li>
        </ul>
        <p>You may withdraw consent at any time (see Section 9 below). Withdrawal does not affect lawfulness of processing carried out before withdrawal.</p>

        <h2 id="sharing">5. Sharing with Third Parties</h2>
        <p>We share personal data with the following categories of third parties, only as necessary to operate the Platform:</p>
        <table className="text-sm">
          <thead>
            <tr><th>Recipient category</th><th>Purpose</th><th>Examples</th></tr>
          </thead>
          <tbody>
            <tr><td>Cloud hosting</td><td>Application hosting and edge delivery</td><td>Vercel Inc. (USA)</td></tr>
            <tr><td>Database</td><td>Storing profile submissions and tool-usage records</td><td>Supabase Inc. (USA)</td></tr>
            <tr><td>AI model providers</td><td>Generating recommendations, draft text, search results</td><td>Anthropic PBC (USA)</td></tr>
            <tr><td>Email delivery</td><td>Sending your match-results email and notifications</td><td>Resend (USA)</td></tr>
            <tr><td>Error monitoring</td><td>Detecting and diagnosing software faults</td><td>Sentry (USA)</td></tr>
            <tr><td>Analytics (if enabled)</td><td>Aggregate usage measurement, no individual targeting</td><td>Privacy-respecting analytics provider</td></tr>
          </tbody>
        </table>
        <p>
          We do not sell your personal data. We do not rent your personal data. We do not share your personal data with universities, agents, or third-party education consultants except where you explicitly request us to.
        </p>

        <h2 id="international">6. International Transfers</h2>
        <p>
          Several of our service providers (Vercel, Supabase, Anthropic, Resend, Sentry) are based in the United States. By using the Platform you acknowledge and consent to your personal data being processed in the United States and other jurisdictions outside India. Where required, we rely on contractual safeguards (Standard Contractual Clauses or equivalent) and the data-protection commitments of these providers. We do not transfer your data to any country specifically restricted by the Central Government under DPDPA s.16.
        </p>

        <h2 id="retention">7. Retention</h2>
        <p>
          We retain your personal data only as long as is necessary for the purposes set out in this Policy, or as required by law. Specifically:
        </p>
        <ul>
          <li>Profile submissions: retained for 24 months after your last activity, then anonymised or deleted.</li>
          <li>Tool-usage logs (rate-limit and audit records): retained for 12 months.</li>
          <li>Email-delivery records: retained for 12 months for deliverability tracking.</li>
          <li>User Content (SOP / LOR drafts you submit to AI tools): processed in real time and not retained beyond what is necessary to deliver the response, unless you explicitly save it via your profile.</li>
        </ul>

        <h2 id="security">8. Security</h2>
        <p>
          We implement reasonable technical and organisational measures to protect personal data against unauthorised access, disclosure, alteration, or destruction. These include encryption in transit (HTTPS/TLS), access controls, audit logging, and supplier-vetting. No electronic transmission or storage system is 100% secure; we cannot guarantee absolute security. In the event of a personal-data breach, we will notify the Data Protection Board of India and affected Data Principals without undue delay, in accordance with the DPDPA.
        </p>

        <h2 id="rights">9. Your Rights</h2>
        <p>Under the DPDPA, GDPR, and UK GDPR (as applicable), you have the right to:</p>
        <ul>
          <li><b>Access</b> the personal data we hold about you;</li>
          <li><b>Correction</b> of inaccurate or incomplete personal data;</li>
          <li><b>Erasure</b> of personal data where retention is no longer required;</li>
          <li><b>Withdraw consent</b> at any time (this may limit features available to you);</li>
          <li><b>Nomination</b> of another individual to exercise your rights in the event of your death or incapacity (DPDPA s.14);</li>
          <li><b>Data portability</b>: receive your data in a structured, machine-readable format (GDPR Art. 20);</li>
          <li><b>Object to processing</b> based on legitimate interests (GDPR Art. 21);</li>
          <li><b>Lodge a complaint</b> with the Data Protection Board of India or your local supervisory authority.</li>
        </ul>
        <p>
          To exercise any of these rights, contact our Grievance Officer (Section 12 below). We will respond within statutory time-limits (within 30 days for DPDPA / GDPR requests).
        </p>

        <h2 id="cookies">10. Cookies and Tracking</h2>
        <p>
          We use a small number of essential cookies / localStorage keys to operate core features (anonymous user identification, fair-use rate-limit, session continuity). We do not use third-party advertising cookies, behavioural-advertising trackers, or cross-site tracking pixels. You can clear cookies through your browser settings; some features may not function correctly without them.
        </p>

        <h2 id="marketing">11. Marketing Communications</h2>
        <p>
          We send transactional emails (your match results, service-related notifications) as a necessary part of the service. We will only send marketing or promotional emails if you have explicitly opted in. You can unsubscribe at any time using the link at the bottom of any marketing email or by contacting us at <a href="mailto:privacy@eduvianai.com">privacy@eduvianai.com</a>.
        </p>

        <h2 id="grievance">12. Grievance Officer / Data Protection Officer</h2>
        <p>
          In compliance with the Information Technology Act, 2000 (Section 79 and Information Technology Rules 2011, Rule 5(9)) and the DPDPA, 2023, we have appointed a Grievance Officer:
        </p>
        <p>
          <b>Grievance Officer / Data Protection Officer</b><br />
          Name: [<i>To be specified</i>]<br />
          Email: <a href="mailto:grievance@eduvianai.com">grievance@eduvianai.com</a><br />
          Postal address: [<i>To be specified</i>]<br />
          Response time: within 15 working days of receipt of your complaint.
        </p>
        <p>
          For data-protection inquiries specifically, you may contact: <a href="mailto:privacy@eduvianai.com">privacy@eduvianai.com</a>.
        </p>

        <h2 id="changes">13. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. Material changes will be notified through the Platform and/or by email at least seven (7) days before they take effect. The current version is always available at <Link href="/privacy">eduvianai.com/privacy</Link>.
        </p>

        <h2 id="contact">14. Contact</h2>
        <p>
          If you have questions about this Privacy Policy or our data-handling practices, please contact:<br />
          <b>EduvianAI &mdash; Privacy Team</b><br />
          Email: <a href="mailto:privacy@eduvianai.com">privacy@eduvianai.com</a><br />
          Postal address: [<i>To be specified</i>]
        </p>

        <hr className="my-10" />
        <p className="text-xs text-gray-500">
          This document is provided as a draft framework. It is not legal advice. EduvianAI is in the process of obtaining qualified legal review before this Policy is finalised and the placeholders (corporate registration details, postal address, named Grievance Officer) are populated. For specific compliance questions, please contact our privacy team.
        </p>
      </div>
    </main>
  );
}
