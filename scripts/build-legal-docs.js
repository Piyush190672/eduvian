/**
 * build-legal-docs.js — Generate Word (.docx) files for the three legal
 * documents (Terms of Use, Privacy Policy, Disclaimer). Each file is
 * a standalone, professionally-formatted document that mirrors the
 * content of the corresponding /terms, /privacy, /disclaimer page.
 *
 * Usage: node scripts/build-legal-docs.js
 * Output: ~/Desktop/eduvian-legal-docs/
 */
const fs = require("node:fs");
const path = require("node:path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageOrientation, LevelFormat, TabStopType, TabStopPosition,
  BorderStyle,
} = require("docx");

// ── Page size / margins ─────────────────────────────────────────────────────
// US Letter portrait, 1" margins.
const PAGE_PROPS = {
  page: {
    size: { width: 12240, height: 15840 },
    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
  },
};

// ── Default styles ──────────────────────────────────────────────────────────
const STYLES = {
  default: { document: { run: { font: "Arial", size: 22 } } }, // 11pt
  paragraphStyles: [
    {
      id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 36, bold: true, font: "Arial" },
      paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 },
    },
    {
      id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 26, bold: true, font: "Arial" },
      paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 },
    },
    {
      id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 22, bold: true, font: "Arial" },
      paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 },
    },
  ],
};

// ── Numbering for bullets ───────────────────────────────────────────────────
const NUMBERING = {
  config: [
    {
      reference: "bullets",
      levels: [
        {
          level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        },
      ],
    },
  ],
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function p(textOrOpts, opts = {}) {
  if (typeof textOrOpts === "string") {
    return new Paragraph({ children: [new TextRun({ text: textOrOpts, ...opts.run })] });
  }
  // textOrOpts is an object literal like { children: [TextRun, ...] }
  return new Paragraph(textOrOpts);
}
function h1(text) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] }); }
function h2(text) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] }); }
function h3(text) { return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] }); }
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: typeof text === "string" ? [new TextRun(text)] : text,
  });
}
function note(text) {
  return new Paragraph({
    border: {
      top: { style: BorderStyle.SINGLE, size: 6, color: "F59E0B", space: 6 },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "F59E0B", space: 6 },
      left: { style: BorderStyle.SINGLE, size: 6, color: "F59E0B", space: 6 },
      right: { style: BorderStyle.SINGLE, size: 6, color: "F59E0B", space: 6 },
    },
    shading: { fill: "FEF3C7" },
    children: [new TextRun({ text, italics: true, size: 20 })],
    spacing: { before: 120, after: 120 },
  });
}
function meta(text) {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, color: "6B7280", size: 18 })],
    spacing: { after: 200 },
  });
}
function bold(t) { return new TextRun({ text: t, bold: true }); }
function plain(t) { return new TextRun(t); }

// ── Document 1: Terms of Use ────────────────────────────────────────────────
const termsChildren = [
  h1("Terms of Use"),
  meta("Last updated: 1 May 2026"),
  note("DRAFT — Requires legal review before publication. Bracketed placeholders ([City], named Grievance Officer, postal address) must be completed by counsel."),
  p("By accessing or using EduvianAI, you agree to these Terms. If you do not agree, please do not use the platform."),

  h2("1. Definitions"),
  bullet([bold("\"EduvianAI\", \"we\", \"our\", \"us\""), plain(" means the entity operating the website at eduvianai.com (and its subdomains) and its affiliated services.")]),
  bullet([bold("\"Platform\""), plain(" means the website, mobile interfaces, application programming interfaces, and any associated tools — including but not limited to the recommendation engine, ROI Calculator, Parent Decision Tool, Visa Coach, Application Tracker, SOP Assistant, LOR Coach, Interview Prep, and English-Test Lab.")]),
  bullet([bold("\"User\", \"you\", \"your\""), plain(" means any individual who accesses, registers on, or uses the Platform, including prospective students, parents, mentors, and visitors.")]),
  bullet([bold("\"Content\""), plain(" means information, text, data, recommendations, scores, ratings, university listings, program data, fees, deadlines, and AI-generated outputs presented through the Platform.")]),
  bullet([bold("\"User Content\""), plain(" means information, documents, statements of purpose, letters of recommendation, profile data, or other materials you submit to or generate through the Platform.")]),
  bullet([bold("\"Universities\""), plain(" means third-party academic institutions whose programs are listed on the Platform.")]),
  bullet([bold("\"DPDPA\""), plain(" means the Digital Personal Data Protection Act, 2023 (India).")]),

  h2("2. Acceptance of Terms"),
  p("By creating an account, submitting a profile, or using any feature of the Platform, you confirm that you (i) have read and understood these Terms, (ii) accept them as a legally binding agreement, and (iii) are at least 18 years of age, or are a minor accessing the Platform under the supervision of a parent or legal guardian who has accepted these Terms on your behalf in accordance with Section 9 of the DPDPA."),

  h2("3. Service Description"),
  p("EduvianAI is a software-as-a-service platform that uses algorithms and large language models to assist users with study-abroad decisions. The Platform provides program recommendations matched to a user's profile, decision-support calculators, application-related tools, and informational content about universities in 12 destination countries."),
  p({ children: [bold("EduvianAI is a decision-support tool, not a licensed educational consultant, immigration adviser, financial adviser, or legal adviser."), plain(" The Platform does not act as an agent of any university and does not process applications on your behalf. All applications, payments, visa filings, and admissions decisions are between you and the relevant institution or authority.")] }),

  h2("4. Eligibility"),
  p("You must:"),
  bullet("Be at least 18 years old, or a minor with verifiable parental consent;"),
  bullet("Provide accurate, current, and complete information when prompted;"),
  bullet("Not be barred from receiving services under the laws of your jurisdiction or any applicable destination country;"),
  bullet("Use the Platform only for lawful, personal, non-commercial purposes related to your own education planning (or the planning of a minor under your care)."),

  h2("5. User Accounts and Responsibility"),
  p("Some features require you to provide profile details. You are responsible for the accuracy of all information you submit, for maintaining the confidentiality of any credentials issued to you, and for all activity under your account. Notify us promptly at support@eduvianai.com of any suspected unauthorised access. We are not liable for losses arising from your failure to safeguard credentials."),

  h2("6. Permitted Use and Prohibited Conduct"),
  p("You may use the Platform only as expressly permitted. You will not:"),
  bullet("Reverse-engineer, decompile, scrape, crawl, or otherwise extract the Platform's data, recommendation logic, or AI prompts except as permitted by law;"),
  bullet("Submit false, misleading, fabricated, or stolen information (including academic transcripts, identity documents, or test scores);"),
  bullet("Use the Platform to harass, defame, harm, or impersonate any person or institution;"),
  bullet("Use the Platform to facilitate fraud, identity theft, document forgery, or any unauthorised admissions or visa scheme;"),
  bullet("Interfere with the Platform's security, availability, or integrity, including via malware, denial-of-service attacks, or unauthorised access attempts;"),
  bullet("Use automated tools (bots, scrapers, AI agents you do not control) to access or extract data from the Platform without our prior written consent;"),
  bullet("Resell, sublicense, or commercially exploit the Platform or its outputs without our prior written consent."),

  h2("7. AI-Generated Content — Important Disclaimer"),
  p("The Platform uses artificial intelligence (including third-party large language models such as Anthropic Claude) to generate recommendations, match scores, ROI estimates, and tool outputs (SOP drafts, LOR review, visa-prep guidance, interview rehearsal feedback)."),
  p({ children: [bold("AI-generated outputs are estimates, suggestions, and drafts — not professional advice, guarantees, or final decisions."), plain(" Outputs may be incomplete, inaccurate, outdated, or inconsistent. You must independently verify any information before relying on it for academic, financial, immigration, or legal decisions. We make no warranty that AI outputs are fit for any particular purpose, free from bias, or compliant with any specific regulatory framework.")] }),

  h2("8. University Data — Verified vs. Listed"),
  p("Each program in our database is shown with one of two trust indicators:"),
  bullet([bold("\"✓ Verified\""), plain(": program data was extracted from the official university page on the date shown by \"verified at source\". Even verified data may become stale as admission cycles roll over — "), bold("always confirm fees, deadlines, eligibility, IELTS/TOEFL minima, and curriculum directly with the university before applying or making payments"), plain(".")]),
  bullet([bold("\"⚠ Listing only\""), plain(": program data has not been re-verified against the official source in the current admissions cycle. Treat such entries as directional only.")]),
  p("We do not guarantee the accuracy, completeness, currency, or availability of any university or program. We are not responsible for changes universities make to their programs, fees, deadlines, eligibility, or admission policies. Discrepancies between the Platform and the official university source must be resolved in favour of the official university source."),

  h2("9. Tool-Specific Disclaimers"),
  bullet([bold("Match Scores & Recommendations"), plain(" are computed from the profile you provide. They are not predictive of admission outcomes. Universities make admissions decisions based on holistic review, current cohort dynamics, and factors we cannot model.")]),
  bullet([bold("ROI Calculator & Parent Decision Tool"), plain(" use median salary data, generic exchange-rate assumptions, and user-supplied inputs. Outputs are illustrative; they are not financial advice or any guarantee of post-graduation earnings, employment, or return on investment.")]),
  bullet([bold("Visa Coach"), plain(" provides general guidance for educational purposes only. It is not legal or immigration advice. Visa policies change frequently; consult the official consular or government source and, where appropriate, a registered immigration adviser before any visa application or financial commitment.")]),
  bullet([bold("SOP Assistant, LOR Coach, Interview Prep"), plain(" generate draft text and feedback. You are solely responsible for the truthfulness and authorship of any document you submit to a university. Submitting AI-generated content as your own may violate the academic integrity policies of universities and may result in admission revocation.")]),
  bullet([bold("English-Test Lab"), plain(" provides practice and indicative scoring. It is not affiliated with the British Council, IDP, IELTS, ETS (TOEFL), Pearson PTE, or Duolingo, and does not predict your official test score.")]),

  h2("10. Third-Party Links and Services"),
  p("The Platform contains links to third-party websites (universities, scholarship boards, government portals, payment processors). We do not control these third-party sites, do not endorse them, and are not responsible for their content, policies, or practices. Your use of any third-party site is governed by that site's terms."),

  h2("11. Intellectual Property"),
  p("All right, title, and interest in and to the Platform, including its software, design, recommendation logic, AI prompts, content (excluding User Content), trademarks, and all derivative works, is and remains the exclusive property of EduvianAI or its licensors. No rights are granted to you by implication, estoppel, or otherwise except as expressly stated in these Terms."),

  h2("12. User Content — Licence and Responsibility"),
  p("You retain ownership of any User Content you submit. By submitting User Content, you grant EduvianAI a worldwide, non-exclusive, royalty-free, sublicensable licence to host, copy, process, transmit, and display the User Content solely for the purpose of providing the Platform and its services to you. We process your User Content using third-party AI providers (currently Anthropic Claude); see our Privacy Policy for details."),
  p("You represent and warrant that (i) you own or have all necessary rights to the User Content you submit, (ii) your User Content does not infringe any third-party rights, and (iii) your User Content does not contain unlawful, defamatory, or harmful material."),

  h2("13. Privacy and Data Protection"),
  p("Our collection and use of personal data is governed by our Privacy Policy, which is incorporated into these Terms by reference. We comply with the DPDPA, 2023 and, where applicable, the General Data Protection Regulation (GDPR / UK GDPR). You consent to our processing of your personal data as described in the Privacy Policy."),

  h2("14. Beta Features and Tool Usage Limits"),
  p("Some features are offered in \"beta\" or with usage caps (a daily limit per user on AI tool calls). Beta features may be modified, suspended, or withdrawn at any time without notice. We may impose, change, or remove limits on AI-tool usage, fair-use thresholds, or rate limits at our discretion."),

  h2("15. Fees and Payment"),
  p("The Platform is currently provided at no charge for personal, non-commercial use. We reserve the right to introduce paid features in the future, with prior notice and your express consent before any charge. We do not currently process payments on behalf of universities; any such payments you make directly to a university or third party are governed by that party's terms."),

  h2("16. No Guarantee of Admission, Visa, or Outcome"),
  p("EduvianAI does not guarantee:"),
  bullet("That you will receive an offer of admission from any university;"),
  bullet("That any visa application will be granted;"),
  bullet("That any scholarship will be awarded;"),
  bullet("That post-study work, employment, residence, or earnings outcomes shown on the Platform will be achieved."),
  p("All admissions, visa, scholarship, and immigration decisions are made at the sole discretion of the relevant institution or government authority."),

  h2("17. Disclaimer of Warranties"),
  p({ children: [plain("The Platform is provided "), bold("\"as is\" and \"as available\""), plain(" without warranties of any kind, express or implied, including without limitation warranties of merchantability, fitness for a particular purpose, non-infringement, accuracy, completeness, or uninterrupted availability. Some jurisdictions do not allow the exclusion of certain implied warranties; in those jurisdictions, our liability is limited to the maximum extent permitted by law.")] }),

  h2("18. Limitation of Liability"),
  p("To the maximum extent permitted by law, in no event shall EduvianAI, its directors, officers, employees, contractors, or affiliates be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, including without limitation loss of profits, loss of opportunity, loss of data, loss of admission opportunities, or any damages arising out of or in connection with your use of, or inability to use, the Platform — whether based on warranty, contract, tort (including negligence), statute, or any other legal theory, and whether or not we have been advised of the possibility of such damages."),
  p("Our total cumulative liability arising out of or relating to these Terms or the Platform shall not exceed the greater of (i) the amount you paid us in the twelve months preceding the claim, or (ii) ₹5,000 (Rupees Five Thousand only)."),

  h2("19. Indemnification"),
  p("You agree to indemnify, defend, and hold harmless EduvianAI and its directors, officers, employees, contractors, and affiliates from and against any claims, damages, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to (i) your use or misuse of the Platform, (ii) your User Content, (iii) your breach of these Terms, or (iv) your violation of any law or third-party right."),

  h2("20. Suspension and Termination"),
  p("We may, in our sole discretion and without prior notice, suspend or terminate your access to the Platform if we reasonably believe you have breached these Terms, posed a security or legal risk, or used the Platform for fraudulent purposes. You may terminate your use of the Platform at any time. Sections that by their nature should survive termination — including Sections 7, 8, 9, 11, 12, 17, 18, 19, 22, and 23 — will survive termination."),

  h2("21. Force Majeure"),
  p("Neither party shall be liable for any failure or delay in performance under these Terms to the extent caused by events beyond its reasonable control, including acts of God, natural disasters, government action, war, civil unrest, pandemic, internet or hosting outages, or third-party service failures."),

  h2("22. Governing Law and Jurisdiction"),
  p("These Terms shall be governed by, and construed in accordance with, the laws of India. Subject to Section 23 (Dispute Resolution), the courts of [City to be specified by counsel; commonly Mumbai or Bengaluru] shall have exclusive jurisdiction over any matters arising out of these Terms."),

  h2("23. Dispute Resolution"),
  p("Any dispute, controversy, or claim arising out of or relating to these Terms or the Platform shall first be attempted to be resolved through good-faith negotiation between the parties for a period of 30 days. If unresolved, the dispute shall be referred to arbitration under the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted by a sole arbitrator mutually appointed by the parties (or in default, appointed in accordance with the said Act), seated in [City to be specified by counsel], in the English language, and the award shall be final and binding."),

  h2("24. Modifications to These Terms"),
  p("We may amend these Terms from time to time. Material changes will be notified through the Platform and/or by email at least seven (7) days before they take effect. Continued use of the Platform after the effective date constitutes acceptance of the amended Terms. The current version is always available at eduvianai.com/terms."),

  h2("25. Severability and Entire Agreement"),
  p("If any provision of these Terms is held to be unenforceable, that provision will be enforced to the maximum extent permitted, and the remainder will remain in full force and effect. These Terms (together with the Privacy Policy) constitute the entire agreement between you and EduvianAI regarding the Platform and supersede all prior agreements."),

  h2("26. Contact"),
  p({ children: [plain("For questions about these Terms, please contact:")] }),
  p({ children: [bold("EduvianAI"), plain("\nEmail: legal@eduvianai.com\nPostal address: [To be specified]")] }),

  meta("This document is provided for informational purposes and represents a draft framework only. It is not legal advice. EduvianAI is in the process of obtaining qualified legal review of these Terms before final publication."),
];

// ── Document 2: Privacy Policy ──────────────────────────────────────────────
const privacyChildren = [
  h1("Privacy Policy"),
  meta("Last updated: 1 May 2026"),
  note("DRAFT — Requires legal review before publication. Bracketed placeholders ([To be specified] for postal address, named Grievance Officer / DPO) must be completed."),
  p("This Privacy Policy explains how EduvianAI (\"we\", \"us\", \"our\") collects, uses, shares, and protects your personal data when you use our website at eduvianai.com and related services (the \"Platform\"). It is incorporated into our Terms of Use."),

  h2("1. Who We Are (Data Fiduciary / Data Controller)"),
  p("EduvianAI is the entity that determines the purposes and means of processing your personal data. For purposes of the Indian Digital Personal Data Protection Act, 2023 (\"DPDPA\"), we are the \"Data Fiduciary\". For purposes of the EU GDPR and UK GDPR (where applicable), we are the \"Data Controller\"."),

  h2("2. Personal Data We Collect"),
  h3("2.1 Information You Provide Directly"),
  bullet([bold("Identity and contact information"), plain(": full name, email address, phone number, nationality, city of residence.")]),
  bullet([bold("Academic information"), plain(": current degree, major / stream, institution, graduation year, GPA / percentage, backlog history, research papers, work experience.")]),
  bullet([bold("Test scores"), plain(": IELTS / TOEFL / PTE / Duolingo, GRE / GMAT, SAT / ACT.")]),
  bullet([bold("Preferences"), plain(": target country and region, intake year and semester, budget range, intended field of study, scholarship requirements.")]),
  bullet([bold("Family and financial signals"), plain(": family income range, family-abroad indicator, visa history, passport status. We do not collect bank account, credit card, PAN, Aadhaar, or other financial-account identifiers.")]),
  bullet([bold("User Content"), plain(": drafts of statements of purpose, letters of recommendation, application essays, or other documents you submit to AI tools.")]),

  h3("2.2 Information We Collect Automatically"),
  bullet("Device and browser information (user agent, screen size, time zone);"),
  bullet("IP address and approximate geographic location derived from it;"),
  bullet("Pages visited, features used, time of visit, referring URL;"),
  bullet("Anonymous identifiers stored in browser cookies / localStorage to recognise you across visits and to enforce fair-use limits on AI tools."),

  h3("2.3 Information from Third Parties"),
  p("If you log in or sign up using a third-party identity provider (e.g., Google), we receive the basic profile information that provider shares with us at sign-in. We do not receive your credentials."),

  h3("2.4 Children's Data"),
  p("The Platform is not directed at children under 18. If you are under 18 and accessing the Platform with parental consent, your parent or legal guardian is the \"Data Principal\" for purposes of the DPDPA. We will obtain verifiable parental consent before processing your personal data and will not use your data for behavioural advertising or profiling that may be detrimental to your wellbeing."),

  h2("3. Purposes for Which We Process Your Data"),
  bullet("To generate program recommendations matched to your profile;"),
  bullet("To compute match scores, ROI estimates, and tool outputs;"),
  bullet("To deliver application-related tools (SOP Assistant, LOR Coach, Visa Coach, Interview Prep, English-Test Lab);"),
  bullet("To send you your match-results email and any service notifications you have opted into;"),
  bullet("To enforce fair-use limits on AI tools (one-call-per-day quota etc.);"),
  bullet("To monitor and improve the Platform's quality, accuracy, and security;"),
  bullet("To detect and prevent fraud, abuse, or unauthorised access;"),
  bullet("To comply with legal obligations and respond to lawful requests by public authorities."),

  h2("4. Legal Basis for Processing"),
  p("We process your personal data on one or more of the following bases:"),
  bullet([bold("Consent"), plain(" (DPDPA s.6, GDPR Art. 6(1)(a)): when you submit your profile, you give us your explicit consent to process your data for the purposes set out in this Policy.")]),
  bullet([bold("Performance of a contract"), plain(" (GDPR Art. 6(1)(b)): processing is necessary to perform the services you request through the Platform.")]),
  bullet([bold("Legitimate interests"), plain(" (GDPR Art. 6(1)(f)): for security, fraud prevention, fair-use enforcement, and Platform improvement, where these interests are not overridden by your rights.")]),
  bullet([bold("Legal obligation"), plain(" (GDPR Art. 6(1)(c) / DPDPA s.7(b)): where we are required to retain or disclose data by law.")]),
  p("You may withdraw consent at any time (see Section 9 below). Withdrawal does not affect lawfulness of processing carried out before withdrawal."),

  h2("5. Sharing with Third Parties"),
  p("We share personal data with the following categories of third parties, only as necessary to operate the Platform:"),
  bullet([bold("Cloud hosting"), plain(" — Vercel Inc. (USA), for application hosting and edge delivery.")]),
  bullet([bold("Database"), plain(" — Supabase Inc. (USA), for storing profile submissions and tool-usage records.")]),
  bullet([bold("AI model providers"), plain(" — Anthropic PBC (USA), for generating recommendations, draft text, and search results.")]),
  bullet([bold("Email delivery"), plain(" — Resend (USA), for sending your match-results email and notifications.")]),
  bullet([bold("Error monitoring"), plain(" — Sentry (USA), for detecting and diagnosing software faults.")]),
  bullet([bold("Analytics"), plain(" (if enabled) — privacy-respecting analytics provider, for aggregate usage measurement; no individual targeting.")]),
  p("We do not sell your personal data. We do not rent your personal data. We do not share your personal data with universities, agents, or third-party education consultants except where you explicitly request us to."),

  h2("6. International Transfers"),
  p("Several of our service providers (Vercel, Supabase, Anthropic, Resend, Sentry) are based in the United States. By using the Platform you acknowledge and consent to your personal data being processed in the United States and other jurisdictions outside India. Where required, we rely on contractual safeguards (Standard Contractual Clauses or equivalent) and the data-protection commitments of these providers. We do not transfer your data to any country specifically restricted by the Central Government under DPDPA s.16."),

  h2("7. Retention"),
  p("We retain your personal data only as long as is necessary for the purposes set out in this Policy, or as required by law. Specifically:"),
  bullet("Profile submissions: retained for 24 months after your last activity, then anonymised or deleted."),
  bullet("Tool-usage logs (rate-limit and audit records): retained for 12 months."),
  bullet("Email-delivery records: retained for 12 months for deliverability tracking."),
  bullet("User Content (SOP / LOR drafts you submit to AI tools): processed in real time and not retained beyond what is necessary to deliver the response, unless you explicitly save it via your profile."),

  h2("8. Security"),
  p("We implement reasonable technical and organisational measures to protect personal data against unauthorised access, disclosure, alteration, or destruction. These include encryption in transit (HTTPS/TLS), access controls, audit logging, and supplier-vetting. No electronic transmission or storage system is 100% secure; we cannot guarantee absolute security. In the event of a personal-data breach, we will notify the Data Protection Board of India and affected Data Principals without undue delay, in accordance with the DPDPA."),

  h2("9. Your Rights"),
  p("Under the DPDPA, GDPR, and UK GDPR (as applicable), you have the right to:"),
  bullet([bold("Access"), plain(" the personal data we hold about you;")]),
  bullet([bold("Correction"), plain(" of inaccurate or incomplete personal data;")]),
  bullet([bold("Erasure"), plain(" of personal data where retention is no longer required;")]),
  bullet([bold("Withdraw consent"), plain(" at any time (this may limit features available to you);")]),
  bullet([bold("Nomination"), plain(" of another individual to exercise your rights in the event of your death or incapacity (DPDPA s.14);")]),
  bullet([bold("Data portability"), plain(": receive your data in a structured, machine-readable format (GDPR Art. 20);")]),
  bullet([bold("Object to processing"), plain(" based on legitimate interests (GDPR Art. 21);")]),
  bullet([bold("Lodge a complaint"), plain(" with the Data Protection Board of India or your local supervisory authority.")]),
  p("To exercise any of these rights, contact our Grievance Officer (Section 12 below). We will respond within statutory time-limits (within 30 days for DPDPA / GDPR requests)."),

  h2("10. Cookies and Tracking"),
  p("We use a small number of essential cookies / localStorage keys to operate core features (anonymous user identification, fair-use rate-limit, session continuity). We do not use third-party advertising cookies, behavioural-advertising trackers, or cross-site tracking pixels. You can clear cookies through your browser settings; some features may not function correctly without them."),

  h2("11. Marketing Communications"),
  p("We send transactional emails (your match results, service-related notifications) as a necessary part of the service. We will only send marketing or promotional emails if you have explicitly opted in. You can unsubscribe at any time using the link at the bottom of any marketing email or by contacting us at privacy@eduvianai.com."),

  h2("12. Grievance Officer / Data Protection Officer"),
  p("In compliance with the Information Technology Act, 2000 (Section 79 and Information Technology Rules 2011, Rule 5(9)) and the DPDPA, 2023, we have appointed a Grievance Officer:"),
  p({ children: [bold("Grievance Officer / Data Protection Officer"), plain("\nName: [To be specified]\nEmail: grievance@eduvianai.com\nPostal address: [To be specified]\nResponse time: within 15 working days of receipt of your complaint.")] }),
  p("For data-protection inquiries specifically, you may contact: privacy@eduvianai.com."),

  h2("13. Changes to This Policy"),
  p("We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. Material changes will be notified through the Platform and/or by email at least seven (7) days before they take effect. The current version is always available at eduvianai.com/privacy."),

  h2("14. Contact"),
  p("If you have questions about this Privacy Policy or our data-handling practices, please contact:"),
  p({ children: [bold("EduvianAI — Privacy Team"), plain("\nEmail: privacy@eduvianai.com\nPostal address: [To be specified]")] }),

  meta("This document is provided as a draft framework. It is not legal advice. EduvianAI is in the process of obtaining qualified legal review before this Policy is finalised."),
];

// ── Document 3: Disclaimer ──────────────────────────────────────────────────
const disclaimerChildren = [
  h1("Disclaimer"),
  meta("Last updated: 1 May 2026"),
  note("EduvianAI is a decision-support tool. It is not a licensed educational consultant, immigration adviser, financial adviser, or legal adviser. The disclaimers below apply to every part of the platform."),

  h2("1. AI-Generated Outputs Are Estimates"),
  p({ children: [plain("The recommendation engine, match scores, ROI projections, SOP drafts, LOR review, visa-prep guidance, and interview-prep feedback are generated by artificial intelligence (including third-party large language models). They are "), bold("educational suggestions and starting drafts, not professional advice"), plain(". They may contain inaccuracies, omissions, or biases. Always verify critical information through the official source before making any academic, financial, immigration, or legal decision.")] }),

  h2("2. University Data — Trust Levels"),
  p("Each program is shown with one of two indicators:"),
  bullet([bold("✓ Verified"), plain(": program data was extracted from the official university page on the date shown. "), bold("Even verified data may be outdated by the time you read it"), plain(" — admission cycles roll over and universities change fees and deadlines without notice. Always reconfirm directly with the university before applying.")]),
  bullet([bold("⚠ Listing only"), plain(": program data has not been re-verified against the official source for the current admissions cycle. Treat such entries as directional only.")]),
  p("Where a fee or deadline is unavailable from the source page, the platform displays \"Verified fee not available — check University website\" rather than showing $0 or an estimate. We do not invent values we cannot verify."),

  h2("3. Match Scores Are Not Predictions"),
  p({ children: [plain("The Safe / Reach / Ambitious tiers and the percentage match scores are computed from the profile inputs you provide. "), bold("They do not predict whether you will be admitted"), plain(". Universities make admission decisions through holistic review that considers factors we cannot model (essays, interviews, current cohort dynamics, internal quotas, year-on-year volatility).")] }),

  h2("4. Tool-Specific Limits"),
  bullet([bold("ROI Calculator / Parent Decision Tool"), plain(": outputs use median salary data and generic exchange-rate assumptions. They are illustrative only, not financial advice, and not a guarantee of post-graduation earnings.")]),
  bullet([bold("Visa Coach"), plain(": provides general guidance for educational purposes only. Not legal or immigration advice. Visa policies change frequently — always consult the official consular source and, where appropriate, a registered immigration adviser.")]),
  bullet([bold("SOP Assistant / LOR Coach"), plain(": produces draft text and feedback. "), bold("You are solely responsible for the truthfulness and authorship of any document you submit to a university"), plain(". Submitting AI-generated content as your own may violate the academic-integrity policies of universities and may result in admission revocation or rescission of any offer.")]),
  bullet([bold("Interview Prep / English-Test Lab"), plain(": practice and indicative feedback only. Not affiliated with the British Council, IDP, IELTS, ETS, Pearson PTE, or Duolingo. Does not predict your official test score.")]),

  h2("5. No Guarantee of Outcome"),
  p("EduvianAI does not guarantee admission, visa approval, scholarship awards, employment, or any post-study outcome. All such decisions are made at the sole discretion of the relevant institution or authority."),

  h2("6. Third-Party Content"),
  p("The platform contains links to university websites, scholarship boards, and government portals. We do not endorse, control, or take responsibility for the content, policies, or practices of those sites. Always verify on the official source."),

  h2("7. Not a Substitute for Professional Advice"),
  p("Information on this platform is not a substitute for consulting a qualified professional in your jurisdiction — an admissions counsellor, a registered immigration adviser, a financial planner, or an attorney — for advice tailored to your specific circumstances."),

  meta("For the full legal framework, see our Terms of Use and Privacy Policy."),
];

// ── Build & write ───────────────────────────────────────────────────────────
function buildDoc(children) {
  return new Document({
    creator: "EduvianAI",
    title: "EduvianAI Legal Document",
    description: "Draft legal document — for legal review only",
    styles: STYLES,
    numbering: NUMBERING,
    sections: [{ properties: PAGE_PROPS, children }],
  });
}

const OUT_DIR = path.join(process.env.HOME, "Desktop", "eduvian-legal-docs");
fs.mkdirSync(OUT_DIR, { recursive: true });

const docs = [
  { name: "EduvianAI-Terms-of-Use.docx", children: termsChildren },
  { name: "EduvianAI-Privacy-Policy.docx", children: privacyChildren },
  { name: "EduvianAI-Disclaimer.docx", children: disclaimerChildren },
];

(async () => {
  for (const d of docs) {
    const buffer = await Packer.toBuffer(buildDoc(d.children));
    const out = path.join(OUT_DIR, d.name);
    fs.writeFileSync(out, buffer);
    console.log(`Wrote ${out} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }
})();
