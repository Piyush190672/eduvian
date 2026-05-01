import Link from "next/link";

export const metadata = {
  title: "Terms of Use — EduvianAI",
  description: "The legal terms governing use of the EduvianAI study-abroad recommendation platform and its tools.",
};

/**
 * Terms of Use for EduvianAI.
 *
 * DRAFT — REQUIRES LEGAL REVIEW BEFORE PUBLICATION.
 *
 * Drafted using common patterns from comparable Indian edtech platforms
 * (IDP Education India, Leap Scholar, Crizac), India's Digital Personal
 * Data Protection Act 2023, the Information Technology Act 2000, and
 * standard SaaS / AI-platform terms. A qualified attorney must review
 * this for the operating jurisdiction, sign-off, and any sector-specific
 * obligations (e.g., RBI rules if payments are added, MEA / consular
 * advisory if any) before this becomes legally binding.
 */
export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-12 prose prose-gray prose-sm sm:prose-base">
        <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 no-underline">← Back to home</Link>

        <h1 className="mt-6 mb-2">Terms of Use</h1>
        <p className="text-sm text-gray-500 mt-0">Last updated: 1 May 2026</p>

        <p className="text-sm bg-amber-50 border border-amber-200 rounded p-3">
          By accessing or using EduvianAI, you agree to these Terms. If you do not agree, please do not use the platform.
        </p>

        <h2 id="definitions">1. Definitions</h2>
        <ul>
          <li><b>&ldquo;EduvianAI&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;</b> means the entity operating the website at eduvianai.com (and its subdomains) and its affiliated services.</li>
          <li><b>&ldquo;Platform&rdquo;</b> means the website, mobile interfaces, application programming interfaces, and any associated tools — including but not limited to the recommendation engine, ROI Calculator, Parent Decision Tool, Visa Coach, Application Tracker, SOP Assistant, LOR Coach, Interview Prep, and English-Test Lab.</li>
          <li><b>&ldquo;User&rdquo;, &ldquo;you&rdquo;, &ldquo;your&rdquo;</b> means any individual who accesses, registers on, or uses the Platform, including prospective students, parents, mentors, and visitors.</li>
          <li><b>&ldquo;Content&rdquo;</b> means information, text, data, recommendations, scores, ratings, university listings, program data, fees, deadlines, and AI-generated outputs presented through the Platform.</li>
          <li><b>&ldquo;User Content&rdquo;</b> means information, documents, statements of purpose, letters of recommendation, profile data, or other materials you submit to or generate through the Platform.</li>
          <li><b>&ldquo;Universities&rdquo;</b> means third-party academic institutions whose programs are listed on the Platform.</li>
          <li><b>&ldquo;DPDPA&rdquo;</b> means the Digital Personal Data Protection Act, 2023 (India).</li>
        </ul>

        <h2 id="acceptance">2. Acceptance of Terms</h2>
        <p>
          By creating an account, submitting a profile, or using any feature of the Platform, you confirm that you (i) have read and understood these Terms, (ii) accept them as a legally binding agreement, and (iii) are at least 18 years of age, or are a minor accessing the Platform under the supervision of a parent or legal guardian who has accepted these Terms on your behalf in accordance with Section&nbsp;9 of the DPDPA.
        </p>

        <h2 id="service">3. Service Description</h2>
        <p>
          EduvianAI is a software-as-a-service platform that uses algorithms and large language models to assist users with study-abroad decisions. The Platform provides program recommendations matched to a user&rsquo;s profile, decision-support calculators, application-related tools, and informational content about universities in 12 destination countries.
        </p>
        <p>
          <b>EduvianAI is a decision-support tool, not a licensed educational consultant, immigration adviser, financial adviser, or legal adviser.</b> The Platform does not act as an agent of any university and does not process applications on your behalf. All applications, payments, visa filings, and admissions decisions are between you and the relevant institution or authority.
        </p>

        <h2 id="eligibility">4. Eligibility</h2>
        <p>You must:</p>
        <ul>
          <li>Be at least 18 years old, or a minor with verifiable parental consent;</li>
          <li>Provide accurate, current, and complete information when prompted;</li>
          <li>Not be barred from receiving services under the laws of your jurisdiction or any applicable destination country;</li>
          <li>Use the Platform only for lawful, personal, non-commercial purposes related to your own education planning (or the planning of a minor under your care).</li>
        </ul>

        <h2 id="accounts">5. User Accounts and Responsibility</h2>
        <p>
          Some features require you to provide profile details. You are responsible for the accuracy of all information you submit, for maintaining the confidentiality of any credentials issued to you, and for all activity under your account. Notify us promptly at <a href="mailto:support@eduvianai.com">support@eduvianai.com</a> of any suspected unauthorised access. We are not liable for losses arising from your failure to safeguard credentials.
        </p>

        <h2 id="permitted-use">6. Permitted Use and Prohibited Conduct</h2>
        <p>You may use the Platform only as expressly permitted. You will not:</p>
        <ul>
          <li>Reverse-engineer, decompile, scrape, crawl, or otherwise extract the Platform&rsquo;s data, recommendation logic, or AI prompts except as permitted by law;</li>
          <li>Submit false, misleading, fabricated, or stolen information (including academic transcripts, identity documents, or test scores);</li>
          <li>Use the Platform to harass, defame, harm, or impersonate any person or institution;</li>
          <li>Use the Platform to facilitate fraud, identity theft, document forgery, or any unauthorised admissions or visa scheme;</li>
          <li>Interfere with the Platform&rsquo;s security, availability, or integrity, including via malware, denial-of-service attacks, or unauthorised access attempts;</li>
          <li>Use automated tools (bots, scrapers, AI agents you do not control) to access or extract data from the Platform without our prior written consent;</li>
          <li>Resell, sublicense, or commercially exploit the Platform or its outputs without our prior written consent.</li>
        </ul>

        <h2 id="ai-disclaimer">7. AI-Generated Content &mdash; Important Disclaimer</h2>
        <p>
          The Platform uses artificial intelligence (including third-party large language models such as Anthropic Claude) to generate recommendations, match scores, ROI estimates, and tool outputs (SOP drafts, LOR review, visa-prep guidance, interview rehearsal feedback).
        </p>
        <p>
          <b>AI-generated outputs are estimates, suggestions, and drafts &mdash; not professional advice, guarantees, or final decisions.</b> Outputs may be incomplete, inaccurate, outdated, or inconsistent. You must independently verify any information before relying on it for academic, financial, immigration, or legal decisions. We make no warranty that AI outputs are fit for any particular purpose, free from bias, or compliant with any specific regulatory framework.
        </p>

        <h2 id="data-disclaimer">8. University Data &mdash; Verified vs. Listed</h2>
        <p>
          Each program in our database is shown with one of two trust indicators:
        </p>
        <ul>
          <li><b>&ldquo;✓ Verified&rdquo;</b>: program data was extracted from the official university page on the date shown by &ldquo;verified at source&rdquo;. Even verified data may become stale as admission cycles roll over &mdash; <b>always confirm fees, deadlines, eligibility, IELTS/TOEFL minima, and curriculum directly with the university before applying or making payments</b>.</li>
          <li><b>&ldquo;⚠ Listing only&rdquo;</b>: program data has not been re-verified against the official source in the current admissions cycle. Treat such entries as directional only.</li>
        </ul>
        <p>
          We do not guarantee the accuracy, completeness, currency, or availability of any university or program. We are not responsible for changes universities make to their programs, fees, deadlines, eligibility, or admission policies. Discrepancies between the Platform and the official university source must be resolved in favour of the official university source.
        </p>

        <h2 id="tool-disclaimers">9. Tool-Specific Disclaimers</h2>
        <ul>
          <li><b>Match Scores &amp; Recommendations</b> are computed from the profile you provide. They are not predictive of admission outcomes. Universities make admissions decisions based on holistic review, current cohort dynamics, and factors we cannot model.</li>
          <li><b>ROI Calculator &amp; Parent Decision Tool</b> use median salary data, generic exchange-rate assumptions, and user-supplied inputs. Outputs are illustrative; they are not financial advice or any guarantee of post-graduation earnings, employment, or return on investment.</li>
          <li><b>Visa Coach</b> provides general guidance for educational purposes only. It is not legal or immigration advice. Visa policies change frequently; consult the official consular or government source and, where appropriate, a registered immigration adviser before any visa application or financial commitment.</li>
          <li><b>SOP Assistant, LOR Coach, Interview Prep</b> generate draft text and feedback. You are solely responsible for the truthfulness and authorship of any document you submit to a university. Submitting AI-generated content as your own may violate the academic integrity policies of universities and may result in admission revocation.</li>
          <li><b>English-Test Lab</b> provides practice and indicative scoring. It is not affiliated with the British Council, IDP, IELTS, ETS (TOEFL), Pearson PTE, or Duolingo, and does not predict your official test score.</li>
        </ul>

        <h2 id="third-party">10. Third-Party Links and Services</h2>
        <p>
          The Platform contains links to third-party websites (universities, scholarship boards, government portals, payment processors). We do not control these third-party sites, do not endorse them, and are not responsible for their content, policies, or practices. Your use of any third-party site is governed by that site&rsquo;s terms.
        </p>

        <h2 id="ip">11. Intellectual Property</h2>
        <p>
          All right, title, and interest in and to the Platform, including its software, design, recommendation logic, AI prompts, content (excluding User Content), trademarks, and all derivative works, is and remains the exclusive property of EduvianAI or its licensors. No rights are granted to you by implication, estoppel, or otherwise except as expressly stated in these Terms.
        </p>

        <h2 id="user-content">12. User Content &mdash; Licence and Responsibility</h2>
        <p>
          You retain ownership of any User Content you submit. By submitting User Content, you grant EduvianAI a worldwide, non-exclusive, royalty-free, sublicensable licence to host, copy, process, transmit, and display the User Content solely for the purpose of providing the Platform and its services to you. We process your User Content using third-party AI providers (currently Anthropic Claude); see our <Link href="/privacy">Privacy Policy</Link> for details.
        </p>
        <p>
          You represent and warrant that (i) you own or have all necessary rights to the User Content you submit, (ii) your User Content does not infringe any third-party rights, and (iii) your User Content does not contain unlawful, defamatory, or harmful material.
        </p>

        <h2 id="privacy">13. Privacy and Data Protection</h2>
        <p>
          Our collection and use of personal data is governed by our <Link href="/privacy">Privacy Policy</Link>, which is incorporated into these Terms by reference. We comply with the DPDPA, 2023 and, where applicable, the General Data Protection Regulation (GDPR / UK&nbsp;GDPR). You consent to our processing of your personal data as described in the Privacy Policy.
        </p>

        <h2 id="beta">14. Beta Features and Tool Usage Limits</h2>
        <p>
          Some features are offered in &ldquo;beta&rdquo; or with usage caps (a daily limit per user on AI tool calls). Beta features may be modified, suspended, or withdrawn at any time without notice. We may impose, change, or remove limits on AI-tool usage, fair-use thresholds, or rate limits at our discretion.
        </p>

        <h2 id="fees">15. Fees and Payment</h2>
        <p>
          The Platform is currently provided at no charge for personal, non-commercial use. We reserve the right to introduce paid features in the future, with prior notice and your express consent before any charge. We do not currently process payments on behalf of universities; any such payments you make directly to a university or third party are governed by that party&rsquo;s terms.
        </p>

        <h2 id="no-guarantee">16. No Guarantee of Admission, Visa, or Outcome</h2>
        <p>
          EduvianAI does not guarantee:
        </p>
        <ul>
          <li>That you will receive an offer of admission from any university;</li>
          <li>That any visa application will be granted;</li>
          <li>That any scholarship will be awarded;</li>
          <li>That post-study work, employment, residence, or earnings outcomes shown on the Platform will be achieved.</li>
        </ul>
        <p>
          All admissions, visa, scholarship, and immigration decisions are made at the sole discretion of the relevant institution or government authority.
        </p>

        <h2 id="warranties">17. Disclaimer of Warranties</h2>
        <p>
          The Platform is provided <b>&ldquo;as is&rdquo; and &ldquo;as available&rdquo;</b> without warranties of any kind, express or implied, including without limitation warranties of merchantability, fitness for a particular purpose, non-infringement, accuracy, completeness, or uninterrupted availability. Some jurisdictions do not allow the exclusion of certain implied warranties; in those jurisdictions, our liability is limited to the maximum extent permitted by law.
        </p>

        <h2 id="liability">18. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, in no event shall EduvianAI, its directors, officers, employees, contractors, or affiliates be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, including without limitation loss of profits, loss of opportunity, loss of data, loss of admission opportunities, or any damages arising out of or in connection with your use of, or inability to use, the Platform &mdash; whether based on warranty, contract, tort (including negligence), statute, or any other legal theory, and whether or not we have been advised of the possibility of such damages.
        </p>
        <p>
          Our total cumulative liability arising out of or relating to these Terms or the Platform shall not exceed the greater of (i) the amount you paid us in the twelve months preceding the claim, or (ii) ₹5,000 (Rupees Five Thousand only).
        </p>

        <h2 id="indemnity">19. Indemnification</h2>
        <p>
          You agree to indemnify, defend, and hold harmless EduvianAI and its directors, officers, employees, contractors, and affiliates from and against any claims, damages, liabilities, costs, and expenses (including reasonable attorneys&rsquo; fees) arising out of or related to (i) your use or misuse of the Platform, (ii) your User Content, (iii) your breach of these Terms, or (iv) your violation of any law or third-party right.
        </p>

        <h2 id="termination">20. Suspension and Termination</h2>
        <p>
          We may, in our sole discretion and without prior notice, suspend or terminate your access to the Platform if we reasonably believe you have breached these Terms, posed a security or legal risk, or used the Platform for fraudulent purposes. You may terminate your use of the Platform at any time. Sections that by their nature should survive termination &mdash; including Sections 7, 8, 9, 11, 12, 17, 18, 19, 22, and 23 &mdash; will survive termination.
        </p>

        <h2 id="force-majeure">21. Force Majeure</h2>
        <p>
          Neither party shall be liable for any failure or delay in performance under these Terms to the extent caused by events beyond its reasonable control, including acts of God, natural disasters, government action, war, civil unrest, pandemic, internet or hosting outages, or third-party service failures.
        </p>

        <h2 id="governing-law">22. Governing Law and Jurisdiction</h2>
        <p>
          These Terms shall be governed by, and construed in accordance with, the laws of India. Subject to Section 23 (Dispute Resolution), the courts of [<i>City to be specified by counsel; commonly Mumbai or Bengaluru</i>] shall have exclusive jurisdiction over any matters arising out of these Terms.
        </p>

        <h2 id="dispute">23. Dispute Resolution</h2>
        <p>
          Any dispute, controversy, or claim arising out of or relating to these Terms or the Platform shall first be attempted to be resolved through good-faith negotiation between the parties for a period of 30 days. If unresolved, the dispute shall be referred to arbitration under the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted by a sole arbitrator mutually appointed by the parties (or in default, appointed in accordance with the said Act), seated in [<i>City to be specified by counsel</i>], in the English language, and the award shall be final and binding.
        </p>

        <h2 id="modifications">24. Modifications to These Terms</h2>
        <p>
          We may amend these Terms from time to time. Material changes will be notified through the Platform and/or by email at least seven (7) days before they take effect. Continued use of the Platform after the effective date constitutes acceptance of the amended Terms. The current version is always available at <Link href="/terms">eduvianai.com/terms</Link>.
        </p>

        <h2 id="severability">25. Severability and Entire Agreement</h2>
        <p>
          If any provision of these Terms is held to be unenforceable, that provision will be enforced to the maximum extent permitted, and the remainder will remain in full force and effect. These Terms (together with the <Link href="/privacy">Privacy Policy</Link>) constitute the entire agreement between you and EduvianAI regarding the Platform and supersede all prior agreements.
        </p>

        <h2 id="contact">26. Contact</h2>
        <p>
          For questions about these Terms, please contact:<br />
          <b>EduvianAI</b><br />
          Email: <a href="mailto:legal@eduvianai.com">legal@eduvianai.com</a><br />
          Postal address: [<i>To be specified</i>]
        </p>

        <hr className="my-10" />
        <p className="text-xs text-gray-500">
          This document is provided for informational purposes and represents a draft framework only. It is not legal advice. EduvianAI is in the process of obtaining qualified legal review of these Terms before final publication. If you are reviewing this document and have specific compliance requirements (sector-specific licensing, foreign-jurisdiction publication, payment processing, GDPR-specific obligations), please contact our legal team at the address above.
        </p>
      </div>
    </main>
  );
}
