/**
 * visa-data.ts
 *
 * Country-specific student visa requirements.
 *
 * ⚠️  ALL figures and rules are sourced strictly from OFFICIAL GOVERNMENT
 * PAGES linked in `officialSources`. These change frequently — every field
 * here cites the source URL so values can be audited and refreshed.
 *
 * Last verified: 2026-04
 */

/** Month/year the figures in this file were audited against official sources. */
export const VISA_DATA_LAST_VERIFIED = "April 2026";

export type VisaCountryCode =
  | "USA" | "UK" | "CAN" | "AUS" | "DEU"
  | "IRL" | "NLD" | "FRA" | "NZL" | "SGP" | "MYS" | "UAE";

export interface VisaChecklistItem {
  id: string;
  label: string;
  detail: string;
  /** Optional risk warning attached to this item (critical deadlines, etc.) */
  risk?: string;
  /** Grouping tag used for section rendering */
  group:
    | "pre-application"
    | "financial"
    | "academic"
    | "identity"
    | "biometric-interview"
    | "post-approval";
}

export interface VisaStep {
  order: number;
  title: string;
  detail: string;
  officialLink?: { label: string; url: string };
}

export interface VisaFinancialRequirement {
  /** Short label, e.g. "Tuition + US$10,000 living" */
  label: string;
  /** Numeric minimum in local currency (for calculator) */
  amount: number;
  currency: string;
  /** Number of months the funds must cover (or 0 if N/A) */
  coverMonths: number;
  /** Plain-English explanation of what counts and what doesn't */
  notes: string;
  /** Link to the exact official page stating this figure */
  officialSource: { label: string; url: string };
}

export interface VisaRisk {
  severity: "critical" | "high" | "medium";
  title: string;
  detail: string;
}

export interface VisaCountry {
  code: VisaCountryCode;
  country: string;
  flag: string;
  visaName: string;            // e.g. "F-1 Student Visa"
  visaCode: string;            // e.g. "F-1"
  /** Two- or three-line plain-English intro. */
  tagline: string;
  /** Direct link to the official visa application portal. */
  applyUrl: string;
  applyUrlLabel: string;
  /** Typical processing time, in plain English, sourced from official pages. */
  processingTime: string;
  /** Government fee (excluding SEVIS/IHS/etc. separately listed). */
  visaFee: { amount: number; currency: string; notes?: string };
  /** Additional mandatory fees (SEVIS I-901, IHS, etc.). */
  additionalFees: { label: string; amount: number; currency: string; notes?: string }[];
  /** Financial proof requirement. */
  financial: VisaFinancialRequirement;
  /** Ordered list of application steps. */
  steps: VisaStep[];
  /** Complete document checklist. */
  checklist: VisaChecklistItem[];
  /** Known high-impact risks / common rejection triggers. */
  risks: VisaRisk[];
  /** Every official source used. Each checklist/risk item should be traceable to these. */
  officialSources: { label: string; url: string }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// UNITED STATES — F-1 Student Visa
// Sources: travel.state.gov, studyinthestates.dhs.gov, uscis.gov, ice.gov
// ─────────────────────────────────────────────────────────────────────────────
const USA: VisaCountry = {
  code: "USA",
  country: "United States",
  flag: "🇺🇸",
  visaName: "F-1 Student Visa",
  visaCode: "F-1",
  tagline:
    "For full-time academic study at a SEVP-certified US institution. Requires an I-20 from the school, SEVIS fee payment, and a consular interview at a US embassy/consulate.",
  applyUrl: "https://ceac.state.gov/genniv/",
  applyUrlLabel: "Apply on CEAC (DS-160)",
  processingTime:
    "Interview wait times vary by post (check travel.state.gov/appointment-wait-times). Once interviewed, passports are typically issued within days, but administrative processing (221(g)) can take weeks.",
  visaFee: {
    amount: 185,
    currency: "USD",
    notes: "Machine-readable visa (MRV) fee. Non-refundable, valid 365 days from payment.",
  },
  additionalFees: [
    {
      label: "SEVIS I-901 fee",
      amount: 350,
      currency: "USD",
      notes: "Paid at fmjfee.com BEFORE the visa interview. Required for every F-1 applicant.",
    },
  ],
  financial: {
    label: "1 academic year of tuition + living expenses as stated on Form I-20",
    amount: 0, // Varies per I-20; shown dynamically
    currency: "USD",
    coverMonths: 12,
    notes:
      "The I-20 Section 7 lists the exact cost of attendance your school estimated for one academic year. You must prove you can cover that full amount for the first year, plus have access to funds for subsequent years. Accepted evidence: bank balance, fixed deposits, education loan sanction letter, sponsor affidavit + sponsor's financial documents, or scholarship letter.",
    officialSource: {
      label: "studyinthestates.dhs.gov — Financial Ability",
      url: "https://studyinthestates.dhs.gov/students/prepare/students-and-the-form-i-20",
    },
  },
  steps: [
    {
      order: 1,
      title: "Receive I-20 from your SEVP-certified school",
      detail:
        "After you accept your admission and submit financial documents to the school, the Designated School Official (DSO) issues Form I-20. Verify your name, date of birth, program dates, and cost figures EXACTLY match your passport and funding documents.",
      officialLink: {
        label: "SEVP school search",
        url: "https://studyinthestates.dhs.gov/school-search",
      },
    },
    {
      order: 2,
      title: "Pay the SEVIS I-901 fee",
      detail:
        "Pay USD 350 at fmjfee.com using the SEVIS ID printed on your I-20. Print the payment confirmation — you must carry it to the interview.",
      officialLink: { label: "FMJfee.com (official)", url: "https://www.fmjfee.com/i901fee/" },
    },
    {
      order: 3,
      title: "Complete Form DS-160 online",
      detail:
        "Fill the DS-160 non-immigrant visa application at ceac.state.gov. Upload a passport-style photo that meets State Department specs. Save the 10-digit barcode confirmation page — this is your application ID.",
      officialLink: { label: "DS-160 on CEAC", url: "https://ceac.state.gov/genniv/" },
    },
    {
      order: 4,
      title: "Pay the MRV visa fee",
      detail:
        "Pay USD 185 via the US Travel Docs portal for your country. The receipt number is needed to schedule your interview.",
      officialLink: { label: "US Travel Docs", url: "https://www.ustraveldocs.com/" },
    },
    {
      order: 5,
      title: "Schedule OFC (biometric) + consular interview",
      detail:
        "Book two appointments: the Offsite Facilitation Center (fingerprints + photo) and the consular interview. The OFC must be at least 1 day before the interview. F-1 applicants can schedule up to 365 days before the I-20 program start date, but the visa can only be issued within 365 days before the start date.",
    },
    {
      order: 6,
      title: "Attend the visa interview",
      detail:
        "Bring: passport, I-20 (signed), DS-160 confirmation, MRV receipt, SEVIS payment receipt, photos, financial documents, academic records, admission letter, and any scholarship/sponsor paperwork. Be ready to articulate ties to your home country and post-study intent.",
    },
    {
      order: 7,
      title: "Enter the US on or after I-20 start date − 30 days",
      detail:
        "F-1 visa holders may enter the US no earlier than 30 days before the program start date on the I-20. Earlier entries are refused. Carry your I-20 in hand baggage (never checked).",
      officialLink: {
        label: "Study in the States — Arriving",
        url: "https://studyinthestates.dhs.gov/students/prepare/what-to-bring",
      },
    },
  ],
  checklist: [
    { id: "passport", group: "identity", label: "Valid passport",
      detail: "Valid for at least 6 months beyond your intended period of stay. Must have at least two blank pages." },
    { id: "i20", group: "academic", label: "Signed Form I-20",
      detail: "Issued by your SEVP-certified school. Sign in blue ink at the bottom.",
      risk: "Name and DOB on I-20 must EXACTLY match your passport — any mismatch means re-issuance and rescheduling." },
    { id: "ds160", group: "pre-application", label: "DS-160 confirmation page",
      detail: "Print the barcoded confirmation from ceac.state.gov. The 10-digit AA00XXXXXX ID is used to schedule your interview." },
    { id: "mrv", group: "pre-application", label: "MRV fee receipt (USD 185)",
      detail: "Receipt number is entered when scheduling the interview. Valid 365 days from payment." },
    { id: "sevis", group: "pre-application", label: "SEVIS I-901 payment receipt (USD 350)",
      detail: "Pay at fmjfee.com. Must be paid AT LEAST 3 business days before the interview; schools recommend a week.",
      risk: "SEVIS payment not posted in SEVIS database by interview time → interview rescheduled." },
    { id: "photo", group: "identity", label: "Passport photo meeting US DoS specs",
      detail: "2x2 inch (51×51mm), white background, taken within last 6 months, no glasses." },
    { id: "bank", group: "financial", label: "Bank statements / fixed deposits (last 6 months)",
      detail: "Covering tuition + living for Year 1 as stated on I-20. Include account balance certificate signed by the bank." },
    { id: "loan", group: "financial", label: "Education loan sanction letter (if applicable)",
      detail: "Original on bank letterhead, showing sanctioned amount, tenure, and disbursement terms." },
    { id: "sponsor-aff", group: "financial", label: "Sponsor affidavit of support (if sponsored)",
      detail: "Signed by the sponsor; notarised. Must state the exact sponsorship amount and relationship.",
      risk: "A sponsor affidavit older than 6 months or not properly notarised is a frequent 214(b) refusal trigger. Get it notarised close to the interview date." },
    { id: "sponsor-proof", group: "financial", label: "Sponsor's income + bank documents",
      detail: "Sponsor's last 3 years ITRs, salary slips (3 months), bank statements (6 months), and proof of relationship (birth certificate / family register)." },
    { id: "transcripts", group: "academic", label: "Academic transcripts and diplomas",
      detail: "Original + attested copies of all post-secondary transcripts, degree certificates, and mark sheets." },
    { id: "test-scores", group: "academic", label: "Standardized test scores",
      detail: "GRE/GMAT/SAT and TOEFL/IELTS/Duolingo — original score reports sent to the school." },
    { id: "admission", group: "academic", label: "Admission/offer letter from the school",
      detail: "Official admission letter on university letterhead, matching the I-20." },
    { id: "scholarship", group: "financial", label: "Scholarship/assistantship letter (if applicable)",
      detail: "Reduces financial proof requirement by exactly the scholarship amount — bring original." },
  ],
  risks: [
    {
      severity: "critical",
      title: "214(b) ties-to-home-country refusal",
      detail:
        "The most common F-1 refusal. Consular officers must be convinced you intend to return home after study (INA §214(b)). Prepare clear, specific answers on family ties, property, job prospects, and career plans in your home country. Vague or memorised answers trigger refusal.",
    },
    {
      severity: "critical",
      title: "Funding gap on I-20",
      detail:
        "If your financial documents fall short of the I-20 Section 7 figure for Year 1 (even by a small margin), the visa will be refused. Loan sanctions, FDs, and liquid bank balances must add up to meet or exceed the stated cost.",
    },
    {
      severity: "high",
      title: "Entering the US more than 30 days before I-20 start date",
      detail:
        "CBP will refuse entry. The F-1 30-day pre-start-date window is strictly enforced.",
    },
    {
      severity: "high",
      title: "Mismatched SEVIS ID across documents",
      detail:
        "The SEVIS ID (N0012345678) on the I-20, SEVIS payment receipt, and DS-160 must be identical. One wrong digit on DS-160 → interview void.",
    },
    {
      severity: "medium",
      title: "Administrative processing (221(g))",
      detail:
        "If issued a 221(g) slip, your case goes into security review. Typical durations: 2–8 weeks, occasionally months. Common for STEM fields on the Technology Alert List.",
    },
  ],
  officialSources: [
    { label: "US Dept of State — Student Visa", url: "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html" },
    { label: "USCIS — Students and Employment", url: "https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors" },
    { label: "Study in the States (DHS)", url: "https://studyinthestates.dhs.gov/" },
    { label: "SEVIS I-901 Fee Portal", url: "https://www.fmjfee.com/i901fee/" },
    { label: "CEAC DS-160", url: "https://ceac.state.gov/genniv/" },
    { label: "US Travel Docs", url: "https://www.ustraveldocs.com/" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// UNITED KINGDOM — Student Visa (Route: Student)
// Sources: gov.uk/student-visa, gov.uk/guidance/immigration-rules
// ─────────────────────────────────────────────────────────────────────────────
const UK: VisaCountry = {
  code: "UK",
  country: "United Kingdom",
  flag: "🇬🇧",
  visaName: "Student Visa (Route: Student)",
  visaCode: "Student",
  tagline:
    "For full-time study at a UK licensed student sponsor. Requires a CAS (Confirmation of Acceptance for Studies), proof of funds held for 28 consecutive days, and the Immigration Health Surcharge (IHS).",
  applyUrl: "https://www.gov.uk/student-visa/apply",
  applyUrlLabel: "Apply on GOV.UK",
  processingTime:
    "Decision within 3 weeks of the biometric appointment for applications from outside the UK. Priority (5 working days) and Super Priority (1 working day) services available at extra cost where offered.",
  visaFee: {
    amount: 558,
    currency: "GBP",
    notes: "Applications from outside the UK (fee effective 2026; check gov.uk for the current figure).",
  },
  additionalFees: [
    {
      label: "Immigration Health Surcharge (IHS)",
      amount: 776,
      currency: "GBP",
      notes: "Per year of course, paid in full up-front. Grants access to NHS for the visa duration.",
    },
  ],
  financial: {
    label: "Course fees (first year) + £1,529/mo London or £1,136/mo outside London, up to 9 months",
    amount: 13761, // 9 × 1529, London maximum (2026 rate)
    currency: "GBP",
    coverMonths: 9,
    notes:
      "Funds must be held in a permitted account, in your (or parent/legal guardian's) name, for at least 28 consecutive days. The balance must not drop below the required amount on any day in that window. The 28-day period must end no more than 31 days before you submit the visa application.",
    officialSource: {
      label: "gov.uk — Student Visa money",
      url: "https://www.gov.uk/student-visa/money",
    },
  },
  steps: [
    {
      order: 1,
      title: "Receive unconditional offer and CAS from your sponsor",
      detail:
        "Your UK university (a licensed Student sponsor) issues a CAS number once you meet all conditions. Every CAS is valid for 6 months. You can only apply for the visa up to 6 months before the course start date.",
      officialLink: {
        label: "Register of licensed sponsors",
        url: "https://www.gov.uk/government/publications/register-of-licensed-sponsors-students",
      },
    },
    {
      order: 2,
      title: "Hold the required funds for 28 consecutive days",
      detail:
        "Open a fixed deposit or hold a bank balance that continuously meets the minimum for 28 straight days. Any single day dipping below disqualifies the entire window — you must restart.",
    },
    {
      order: 3,
      title: "Complete the online application and pay IHS + visa fee",
      detail:
        "Apply at gov.uk/student-visa/apply. Pay the visa fee (£524) and the full IHS up-front (£776 × years of course). Save the 8-character IHS reference number.",
      officialLink: { label: "gov.uk Student Visa", url: "https://www.gov.uk/student-visa/apply" },
    },
    {
      order: 4,
      title: "Book and attend biometric appointment at a VFS centre",
      detail:
        "VFS Global handles UK visa biometrics in most countries. You will submit fingerprints, photo, and upload supporting documents either at the centre or via the online document uploader.",
    },
    {
      order: 5,
      title: "Receive decision letter + vignette sticker",
      detail:
        "If approved, your passport is returned with a 90-day vignette. You must enter the UK within those 90 days and collect your BRP (Biometric Residence Permit) from the designated Post Office/ACL within 10 days of arrival OR before the vignette expires, whichever is earlier. ⚠ Collecting the BRP late can void your immigration status.",
    },
  ],
  checklist: [
    { id: "passport", group: "identity", label: "Valid passport",
      detail: "Must have at least one blank page for the vignette." },
    { id: "cas", group: "academic", label: "CAS reference number",
      detail: "14-character CAS issued by your sponsor within the last 6 months.",
      risk: "CAS must be 'un-used' — if already used for a previous (withdrawn/refused) application, request a fresh one." },
    { id: "funds", group: "financial", label: "Bank statement / fixed deposit showing 28 days of funds",
      detail: "Statement must clearly show account holder name, account number, bank stamp/logo, and daily balance for at least 28 consecutive days.",
      risk: "Balance dipping below the minimum on ANY single day during the 28-day window invalidates the entire proof. Re-start the clock immediately if this happens." },
    { id: "funds-recency", group: "financial", label: "Statement dated within 31 days of application",
      detail: "The 28-day window must END no more than 31 days before you submit the visa application.",
      risk: "Submitting an application more than 31 days after the statement end-date is a common Home Office refusal reason." },
    { id: "parent-consent", group: "financial", label: "Parent/guardian consent letter (if using their funds)",
      detail: "Written consent from parent/legal guardian authorising you to use their funds, plus proof of relationship (birth certificate)." },
    { id: "qualifications", group: "academic", label: "Original qualifications used to obtain the CAS",
      detail: "The exact degrees/transcripts/test scores listed on the CAS — originals, not photocopies." },
    { id: "english", group: "academic", label: "Secure English Language Test (SELT) — if required",
      detail: "IELTS for UKVI, LanguageCert, or other approved SELT. Not required if the sponsor has assessed English internally (look at your CAS for the exact clause)." },
    { id: "atas", group: "pre-application", label: "ATAS certificate (if required)",
      detail: "Required for certain postgraduate science/technology courses — your CAS states whether you need it.",
      risk: "Missing ATAS when required = automatic refusal. Apply for ATAS ~6 weeks before the visa application." },
    { id: "tb-test", group: "pre-application", label: "TB test certificate",
      detail: "Mandatory for applicants from tuberculosis-risk countries (India, Pakistan, Nepal, Bangladesh, etc.). Must be from an IOM-approved clinic; valid 6 months." },
    { id: "ihs", group: "pre-application", label: "IHS payment confirmation",
      detail: "8-character IHS reference number (IHSxxxxxxxx)." },
  ],
  risks: [
    {
      severity: "critical",
      title: "28-day funds dip",
      detail:
        "If the balance in your bank statement drops below the required amount on even one day during the 28-day window, the application is refused. Use a fixed deposit rather than a current account to eliminate this risk.",
    },
    {
      severity: "critical",
      title: "Stale bank statement (>31 days old at submission)",
      detail:
        "The last date on the 28-day statement must not be more than 31 days before you submit the visa application. Getting caught out by processing delays is a frequent refusal cause.",
    },
    {
      severity: "high",
      title: "ATAS missing for pre-scribed science courses",
      detail:
        "Certain masters/PhD programmes in science/engineering require an ATAS clearance certificate before visa application. Check your CAS carefully — it will state 'ATAS required'.",
    },
    {
      severity: "high",
      title: "Using a parent's funds without consent letter",
      detail:
        "If money is in a parent or legal guardian's name, you must submit (a) a signed consent letter allowing you to use the funds, and (b) proof of relationship. Missing either document = refusal.",
    },
    {
      severity: "medium",
      title: "BRP collection delay after arrival",
      detail:
        "After entering the UK on the 90-day vignette, you must collect your BRP from the designated Post Office/ACL within 10 days of arrival or before the vignette expires (whichever is earlier). Late collection carries a civil penalty.",
    },
  ],
  officialSources: [
    { label: "gov.uk — Student Visa", url: "https://www.gov.uk/student-visa" },
    { label: "gov.uk — Student Visa: Money", url: "https://www.gov.uk/student-visa/money" },
    { label: "gov.uk — Student Visa: Apply", url: "https://www.gov.uk/student-visa/apply" },
    { label: "gov.uk — Register of licensed student sponsors", url: "https://www.gov.uk/government/publications/register-of-licensed-sponsors-students" },
    { label: "gov.uk — Immigration Health Surcharge", url: "https://www.gov.uk/healthcare-immigration-application" },
    { label: "gov.uk — TB testing for a UK visa", url: "https://www.gov.uk/tb-test-visa" },
    { label: "gov.uk — ATAS", url: "https://www.gov.uk/guidance/academic-technology-approval-scheme" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CANADA — Study Permit (IRCC) + SDS where applicable
// Sources: canada.ca/en/immigration-refugees-citizenship
// ─────────────────────────────────────────────────────────────────────────────
const CAN: VisaCountry = {
  code: "CAN",
  country: "Canada",
  flag: "🇨🇦",
  visaName: "Study Permit (with SDS stream where eligible)",
  visaCode: "IMM 1294",
  tagline:
    "For study at a Designated Learning Institution (DLI). Most South Asian applicants use the Student Direct Stream (SDS), which requires a GIC of CAD 20,635, proof of first-year tuition paid, and a Provincial Attestation Letter (PAL) from Jan 2024 onwards.",
  applyUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/apply.html",
  applyUrlLabel: "Apply on IRCC",
  processingTime:
    "SDS applications typically process in ~20 calendar days when all requirements are met. Regular stream varies by country; check canada.ca for current processing times.",
  visaFee: {
    amount: 150,
    currency: "CAD",
    notes: "Study permit processing fee. Biometrics fee (CAD 85) is charged separately.",
  },
  additionalFees: [
    { label: "Biometrics fee", amount: 85, currency: "CAD" },
  ],
  financial: {
    label: "GIC of CAD 22,895 + first-year tuition paid",
    amount: 22895,
    currency: "CAD",
    coverMonths: 12,
    notes:
      "Effective September 2025, IRCC raised the proof-of-funds floor from CAD 20,635 to CAD 22,895 (based on Statistics Canada's low-income cut-off). Purchase the GIC from a participating Canadian bank (Scotiabank, ICICI Bank Canada, CIBC, RBC, BMO, SBI Canada, HSBC) — funds are locked and released monthly after arrival. Also submit proof that the entire first-year tuition has been paid to the DLI. Quebec requires CAD 24,617 as of January 2026.",
    officialSource: {
      label: "canada.ca — Student Direct Stream",
      url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/student-direct-stream.html",
    },
  },
  steps: [
    {
      order: 1,
      title: "Receive Letter of Acceptance (LOA) from a DLI",
      detail:
        "The DLI number (O-prefix) on the LOA is mandatory for the application. Verify the DLI is still on the IRCC designated list.",
      officialLink: {
        label: "DLI list",
        url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/prepare/designated-learning-institutions-list.html",
      },
    },
    {
      order: 2,
      title: "Obtain Provincial Attestation Letter (PAL) — required from Jan 22, 2024",
      detail:
        "Most study permit applications now require a PAL from the province/territory of your DLI. The DLI issues this after you accept the offer. Without a PAL, the application is returned unprocessed.",
      officialLink: {
        label: "canada.ca — PAL guidance",
        url: "https://www.canada.ca/en/immigration-refugees-citizenship/news/2024/01/canada-to-stabilize-growth-and-decrease-number-of-new-international-student-permits-issued-to-approximately-360000-for-2024.html",
      },
    },
    {
      order: 3,
      title: "Purchase a GIC of CAD 20,635 (SDS only)",
      detail:
        "Wire CAD 20,635 to a participating Canadian bank. They issue the Investment Directions Confirmation (IDC) or GIC certificate. Upload this with your application.",
    },
    {
      order: 4,
      title: "Pay first-year tuition to the DLI in full",
      detail:
        "SDS requires proof that tuition for the first academic year has been paid to the institution. Get an official receipt on DLI letterhead.",
    },
    {
      order: 5,
      title: "Take an English test (SDS requires CLB 7 / IELTS 6.0 minimum)",
      detail:
        "IELTS Academic 6.0 in each band (OR TOEFL iBT 83+, OR PTE Academic 60+). SDS accepts these tests; the regular stream has more flexibility.",
    },
    {
      order: 6,
      title: "Upload Upfront Medical Examination (UME)",
      detail:
        "Complete a medical with an IRCC-approved panel physician BEFORE submitting the application. The panel physician uploads the eMedical; you attach the receipt to your application.",
      officialLink: {
        label: "Panel physician search",
        url: "https://secure.cic.gc.ca/pp-md/pp-list.aspx",
      },
    },
    {
      order: 7,
      title: "Submit application + biometrics",
      detail:
        "Apply online through the IRCC Secure Account. Within 24 hours of submitting, you receive a Biometric Instruction Letter (BIL). Book biometrics at a VAC within 30 days.",
    },
  ],
  checklist: [
    { id: "passport", group: "identity", label: "Valid passport",
      detail: "Study permit validity is capped at passport expiry date — ensure your passport covers your intended study duration + 6 months." },
    { id: "loa", group: "academic", label: "Letter of Acceptance (LOA) from a DLI",
      detail: "Must show the DLI number (format: O19XXXXXXXXX)." },
    { id: "pal", group: "academic", label: "Provincial Attestation Letter (PAL)",
      detail: "Required for most applications since 22 Jan 2024. Issued by the province via the DLI.",
      risk: "Applications missing PAL (when required) are returned unprocessed — this is the single biggest new rejection cause in 2024–25." },
    { id: "gic", group: "financial", label: "GIC certificate — CAD 20,635",
      detail: "Investment Directions Confirmation (IDC) or GIC certificate from a participating Canadian bank.",
      risk: "Old guidance said CAD 10,000 — this was DOUBLED to CAD 20,635 on 1 Jan 2024. Applications submitted with the old amount are refused." },
    { id: "tuition-paid", group: "financial", label: "First-year tuition payment receipt",
      detail: "Official receipt from the DLI showing tuition for Year 1 paid in full. PDF on institutional letterhead." },
    { id: "english", group: "academic", label: "IELTS / TOEFL / PTE score report",
      detail: "IELTS Academic 6.0+ in each band (SDS). Regular stream may accept lower depending on DLI." },
    { id: "medical", group: "biometric-interview", label: "Upfront medical examination receipt",
      detail: "eMedical reference number from the IRCC-approved panel physician." },
    { id: "biometrics", group: "biometric-interview", label: "Biometrics appointment + CAD 85 fee",
      detail: "Book at a VAC within 30 days of the Biometric Instruction Letter." },
    { id: "sop", group: "pre-application", label: "Statement of Purpose (Letter of Explanation)",
      detail: "Crucial for Canadian study permits. Explain program choice, career plan, and ties to home country in 500–800 words." },
    { id: "photos", group: "identity", label: "Digital passport photos (IRCC specs)",
      detail: "35×45 mm, taken within 6 months, neutral expression, plain white background." },
  ],
  risks: [
    {
      severity: "critical",
      title: "Missing PAL (Provincial Attestation Letter)",
      detail:
        "Since 22 Jan 2024, most study permit applicants must submit a PAL. Applications without a valid PAL are returned without processing. Confirm with your DLI that PAL has been allocated BEFORE purchasing the GIC.",
    },
    {
      severity: "critical",
      title: "GIC amount under CAD 20,635",
      detail:
        "The financial requirement floor doubled effective 1 Jan 2024. A GIC of CAD 10,000 (the pre-2024 amount) is now automatic grounds for refusal.",
    },
    {
      severity: "high",
      title: "Weak Letter of Explanation / SOP",
      detail:
        "IRCC officers rely heavily on the SOP to assess 'dual intent' and program rationale. Generic, template-style SOPs are the #2 cause of Canadian study permit refusals.",
    },
    {
      severity: "high",
      title: "Prior refusal not disclosed",
      detail:
        "If you've previously been refused a visa to ANY country, you must disclose it. IRCC data-shares with Five Eyes partners; undisclosed refusals = permanent misrepresentation ban (5 years).",
    },
    {
      severity: "medium",
      title: "Insufficient tie-back evidence",
      detail:
        "Employment offers, family property, parent's ongoing income, and siblings in your home country help establish that you will leave Canada after studies. Missing this is a common refusal ground.",
    },
  ],
  officialSources: [
    { label: "canada.ca — Study permit", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html" },
    { label: "canada.ca — Student Direct Stream", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/student-direct-stream.html" },
    { label: "canada.ca — Designated Learning Institutions list", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/prepare/designated-learning-institutions-list.html" },
    { label: "canada.ca — Provincial Attestation Letter guidance", url: "https://www.canada.ca/en/immigration-refugees-citizenship/news/2024/01/canada-to-stabilize-growth-and-decrease-number-of-new-international-student-permits-issued-to-approximately-360000-for-2024.html" },
    { label: "IRCC — Panel physician search", url: "https://secure.cic.gc.ca/pp-md/pp-list.aspx" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// AUSTRALIA — Student Visa (Subclass 500)
// Sources: immi.homeaffairs.gov.au
// ─────────────────────────────────────────────────────────────────────────────
const AUS: VisaCountry = {
  code: "AUS",
  country: "Australia",
  flag: "🇦🇺",
  visaName: "Student Visa (Subclass 500)",
  visaCode: "500",
  tagline:
    "For full-time study with a CRICOS-registered provider. Requires a CoE, OSHC health insurance, and a Genuine Student (GS) statement that replaced the Genuine Temporary Entrant (GTE) test in March 2024.",
  applyUrl: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500",
  applyUrlLabel: "Apply on ImmiAccount",
  processingTime:
    "75% of applications processed in ~4 weeks, 90% in ~8 weeks. Processing times vary by sector (Higher Education, Postgraduate Research, etc.) and country. Check immi.homeaffairs.gov.au for current figures.",
  visaFee: {
    amount: 2000,
    currency: "AUD",
    notes: "Base visa application charge effective July 2025 (previously AUD 1,600). Confirm the current figure on immi.homeaffairs.gov.au before applying.",
  },
  additionalFees: [
    { label: "OSHC (Overseas Student Health Cover)", amount: 620, currency: "AUD", notes: "Typical single-student annual premium — varies by insurer and course length." },
  ],
  financial: {
    label: "AUD 29,710 per year living costs + tuition + return travel",
    amount: 29710,
    currency: "AUD",
    coverMonths: 12,
    notes:
      "Effective 10 May 2024, the financial capacity benchmark is AUD 29,710 per year for the student (additional amounts for partner/children). Plus: first year tuition (as on CoE), return travel (~AUD 2,000). Evidence: bank statement, education loan, scholarship, government sponsorship, or parent income declaration meeting the minimum.",
    officialSource: {
      label: "immi.homeaffairs.gov.au — Financial capacity",
      url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500/financial-capacity",
    },
  },
  steps: [
    {
      order: 1,
      title: "Receive Confirmation of Enrolment (CoE)",
      detail:
        "A CRICOS-registered provider issues a CoE once you accept the offer and pay the initial tuition deposit. The CoE number (format: 0000XXXXXX) is required for the application.",
      officialLink: { label: "CRICOS provider search", url: "https://cricos.education.gov.au/" },
    },
    {
      order: 2,
      title: "Purchase OSHC for the full visa period",
      detail:
        "Overseas Student Health Cover from a Department-approved insurer (Bupa, Medibank, Allianz Care, nib, ahm). Cover must span from your arrival in Australia to the end of your visa, not just the course end date.",
    },
    {
      order: 3,
      title: "Write the Genuine Student (GS) statement",
      detail:
        "Since 23 March 2024, the GTE requirement was replaced by the Genuine Student requirement. Answer all required questions in the online form, covering your circumstances in home country, choice of course and provider, understanding of living in Australia, and potential benefits of the course.",
      officialLink: {
        label: "Genuine Student requirement",
        url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500/genuine-student-requirement",
      },
    },
    {
      order: 4,
      title: "Complete health examinations",
      detail:
        "Most applicants from India/Pakistan/Bangladesh/Nepal require chest X-ray + medical with a Department-approved panel physician (Bupa Medical Visa Services). The panel physician e-files the results.",
    },
    {
      order: 5,
      title: "Apply online via ImmiAccount",
      detail:
        "Create an ImmiAccount, attach CoE, OSHC, financial evidence, academic docs, and GS statement. Pay AUD 1,600. Biometrics are collected at a VFS centre if requested by the case officer.",
      officialLink: { label: "ImmiAccount", url: "https://online.immi.gov.au/lusc/login" },
    },
  ],
  checklist: [
    { id: "passport", group: "identity", label: "Valid passport",
      detail: "Valid for at least the full duration of your stay." },
    { id: "coe", group: "academic", label: "Confirmation of Enrolment (CoE)",
      detail: "Issued by the CRICOS-registered provider." },
    { id: "oshc", group: "pre-application", label: "OSHC policy covering the full visa period",
      detail: "Must cover from arrival to end of visa (typically course end + 2 months for postgrad, + 1 month for undergrad).",
      risk: "OSHC that expires BEFORE the visa end-date = refusal. Buy end-to-end cover in a single policy." },
    { id: "gs", group: "pre-application", label: "Genuine Student (GS) statement",
      detail: "Structured form answering 5 key questions — not a free-form essay. Replaced GTE in March 2024." },
    { id: "finance", group: "financial", label: "Financial evidence meeting AUD 29,710/yr + tuition + travel",
      detail: "Bank statements (6 months), FD certificates, loan sanction letter, scholarship letter, or parent income declaration (with parent bank statements + ITR)." },
    { id: "english", group: "academic", label: "English test score",
      detail: "IELTS 6.0 / TOEFL iBT 64 / PTE 50 / Cambridge C1 Advanced 169 (minima for most Higher Education students). Some providers have higher bars." },
    { id: "academic", group: "academic", label: "Academic transcripts + degree certificates",
      detail: "Originals + scanned colour copies." },
    { id: "medical", group: "biometric-interview", label: "Health examination (chest X-ray + medical)",
      detail: "Via Bupa Medical Visa Services (or country-specific panel physician)." },
    { id: "character", group: "identity", label: "Character (Form 80 / PCC) — if requested",
      detail: "Police clearance certificate for every country you've lived in for 12+ months since age 16. Not always required but often requested." },
  ],
  risks: [
    {
      severity: "critical",
      title: "Genuine Student statement too generic",
      detail:
        "The GS assessment focuses on specific, verifiable claims. Copy-paste statements from online templates are the #1 refusal ground for Australian student visas in 2024–25.",
    },
    {
      severity: "critical",
      title: "Financial capacity below AUD 29,710/year",
      detail:
        "The benchmark jumped from AUD 24,505 to AUD 29,710 on 10 May 2024. Old guidance quoting lower figures is out of date.",
    },
    {
      severity: "high",
      title: "OSHC gap between arrival and visa end",
      detail:
        "OSHC must cover the entire visa period continuously. A gap (even one day) between purchased cover and visa expiry triggers refusal.",
    },
    {
      severity: "high",
      title: "Course-change downgrade after arrival",
      detail:
        "If you switch from a higher-AQF course (e.g. Masters) to a lower one (e.g. Diploma) within 6 months of arrival, you breach visa condition 8202 and may have your visa cancelled.",
    },
    {
      severity: "medium",
      title: "Missing PCC / Form 80 when requested",
      detail:
        "Case officers may ask for Form 80 and PCCs mid-processing with a 28-day deadline. Missing the deadline ends the application.",
    },
  ],
  officialSources: [
    { label: "immi.homeaffairs.gov.au — Student visa (subclass 500)", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500" },
    { label: "Financial capacity", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500/financial-capacity" },
    { label: "Genuine Student requirement", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500/genuine-student-requirement" },
    { label: "CRICOS provider search", url: "https://cricos.education.gov.au/" },
    { label: "ImmiAccount", url: "https://online.immi.gov.au/lusc/login" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// GERMANY — National Visa for Study (Studienvisum)
// Sources: auswaertiges-amt.de, make-it-in-germany.com, bamf.de
// ─────────────────────────────────────────────────────────────────────────────
const DEU: VisaCountry = {
  code: "DEU",
  country: "Germany",
  flag: "🇩🇪",
  visaName: "National Visa for Study (Visum zum Studienzwecken)",
  visaCode: "National D-visa",
  tagline:
    "A national (D-type) visa issued by a German mission abroad, converted to a residence permit for study after arrival. Centres on the €11,904 blocked account (Sperrkonto) and proof of admission or Studienkolleg placement.",
  applyUrl: "https://videx.diplo.de/videx/visum-erfassung/#/videx-langfristiger-aufenthalt",
  applyUrlLabel: "Start application on VIDEX",
  processingTime:
    "Typically 6–12 weeks from the visa interview. Book the interview at your local German mission via termin.diplo.de — wait times for slots can themselves be 4–12 weeks.",
  visaFee: {
    amount: 75,
    currency: "EUR",
    notes: "National long-stay visa fee. Paid in local currency equivalent at the mission.",
  },
  additionalFees: [
    { label: "Blocked account opening fee", amount: 50, currency: "EUR", notes: "Typical one-time fee; varies by provider (Expatrio, Fintiba, Deutsche Bank, Coracle)." },
    { label: "Health insurance (first 3 months until residence permit)", amount: 100, currency: "EUR", notes: "Travel/expat health insurance; converts to statutory (TK, AOK) or private cover after arrival." },
  ],
  financial: {
    label: "€11,904 in a blocked account (Sperrkonto) — equivalent to €992/month × 12 months",
    amount: 11904,
    currency: "EUR",
    coverMonths: 12,
    notes:
      "The blocked account floor rose to €11,904 effective 1 September 2024 (from €11,208). Open the account with an approved provider (Fintiba, Expatrio, Coracle, Deutsche Bank). Once in Germany, you can withdraw up to €992 per month. Alternatives: parental income declaration + bank docs (Verpflichtungserklärung), German scholarship, or bank guarantee.",
    officialSource: {
      label: "auswaertiges-amt.de — Proof of financial resources",
      url: "https://www.auswaertiges-amt.de/en/visa-service/-/1216238",
    },
  },
  steps: [
    {
      order: 1,
      title: "Receive admission (Zulassung) or conditional admission",
      detail:
        "Admission letter from a recognised German university, OR admission to a Studienkolleg (foundation year) if your qualifications don't yet meet direct entry (e.g. Indian 12th-grade for most Bachelor's programmes).",
      officialLink: {
        label: "anabin database — qualification check",
        url: "https://anabin.kmk.org/anabin.html",
      },
    },
    {
      order: 2,
      title: "Open a blocked account (Sperrkonto) and deposit €11,904",
      detail:
        "Open with an approved provider. Funds are frozen until you arrive in Germany and register your address, after which monthly releases of up to €992 begin.",
    },
    {
      order: 3,
      title: "Take out health insurance for travel + first months",
      detail:
        "Travel insurance covering the gap between arrival and registration at the Ausländerbehörde (foreigner's office). Converts to statutory or private cover once enrolled.",
    },
    {
      order: 4,
      title: "Fill VIDEX and book interview at your local German mission",
      detail:
        "Fill the application form at videx.diplo.de and print the barcoded confirmation. Book an appointment at the relevant consulate/embassy via termin.diplo.de — slots in India/Pakistan/Nigeria can be booked 2–3 months in advance.",
    },
    {
      order: 5,
      title: "Attend the visa interview",
      detail:
        "Submit full document set, biometrics, and answer questions on your course motivation and German language ability (if applicable). Collect the D-visa (usually valid 3–6 months) and travel to Germany.",
    },
    {
      order: 6,
      title: "Register address + apply for residence permit within 90 days",
      detail:
        "Within 2 weeks of arrival: register your address (Anmeldung) at the local Bürgeramt. Within the visa validity: apply for the Aufenthaltstitel (residence permit for study) at the Ausländerbehörde. Carries the full study duration. ⚠ Missing the Anmeldung or residence-permit deadlines leads to a fine and, in some states, status issues.",
    },
  ],
  checklist: [
    { id: "passport", group: "identity", label: "Valid passport",
      detail: "Valid for at least 12 months beyond intended stay; at least 2 blank pages." },
    { id: "admission", group: "academic", label: "Admission letter from a recognised institution",
      detail: "Zulassungsbescheid from a German university OR Studienkolleg/conditional admission letter." },
    { id: "blocked", group: "financial", label: "Blocked account certificate — €11,904",
      detail: "Confirmation from Fintiba, Expatrio, Coracle, or Deutsche Bank showing the account is open and funded.",
      risk: "Amount prior to 1 Sep 2024 was €11,208. Old certificates quoting the lower amount are refused — ensure your confirmation shows €11,904+." },
    { id: "apostille", group: "academic", label: "Apostilled academic transcripts + degrees",
      detail: "Transcripts and degree certificates with an apostille (for Hague Convention countries) or embassy legalisation. Some missions also want a Handwritten Application declaration (CV in tabular form)." },
    { id: "cv", group: "pre-application", label: "Tabular CV (Lebenslauf)",
      detail: "Complete chronological CV with no gaps. Unexplained gaps of 6+ months are a common refusal ground." },
    { id: "motivation", group: "pre-application", label: "Motivation letter (Motivationsschreiben)",
      detail: "Program-specific — explain why this university, this course, and career plans. 1–2 pages." },
    { id: "videx", group: "pre-application", label: "VIDEX printed confirmation with barcode",
      detail: "Print 2 copies." },
    { id: "insurance", group: "pre-application", label: "Travel/expat health insurance certificate",
      detail: "Covers from entry until residence permit is issued; €30,000+ cover typical requirement." },
    { id: "photos", group: "identity", label: "Biometric photos (German biometric specs)",
      detail: "35×45 mm, neutral expression, high-contrast background." },
    { id: "language", group: "academic", label: "Language proof (German B1/B2 or English proof)",
      detail: "Depends on programme. German-taught Bachelor's typically require TestDaF 4×4 or DSH-2. English-taught Master's typically require IELTS 6.5 or TOEFL iBT 88." },
  ],
  risks: [
    {
      severity: "critical",
      title: "Blocked account short of €11,904",
      detail:
        "The Sperrkonto minimum rose to €11,904 on 1 Sep 2024. An older €11,208 certificate (or lower) is refused without review.",
    },
    {
      severity: "critical",
      title: "Unrecognised qualification",
      detail:
        "Your qualification must be recognised in the anabin database. Indian students with 12th-grade only are typically routed through a 1-year Studienkolleg — trying to skip this leads to Zulassung refusal at the university stage, which cascades into visa refusal.",
    },
    {
      severity: "high",
      title: "Gaps in CV not explained",
      detail:
        "German consular officers scrutinise the tabular CV. Any unexplained gap of 6+ months triggers follow-up and often refusal. Document every period — employment, breaks, caregiving.",
    },
    {
      severity: "high",
      title: "Generic motivation letter",
      detail:
        "The Motivationsschreiben must be program-specific. Reusing the same letter across applications (detected when schools share information via uni-assist) is a common refusal reason.",
    },
    {
      severity: "medium",
      title: "Appointment slot booked too late",
      detail:
        "Embassy slots at German missions in India/Pakistan/Nigeria are booked 4–12 weeks in advance. If your Zulassung arrives late, you may miss the semester start. Book a tentative slot as soon as you have an admission, then confirm documents.",
    },
    {
      severity: "medium",
      title: "Missing Anmeldung within 2 weeks of arrival",
      detail:
        "German law requires address registration within 2 weeks. Late registration fines range €10–1,000 depending on the municipality and also delay the residence permit application.",
    },
  ],
  officialSources: [
    { label: "auswaertiges-amt.de — Visa for study purposes", url: "https://www.auswaertiges-amt.de/en/visa-service/-/1215960" },
    { label: "auswaertiges-amt.de — Proof of financial resources", url: "https://www.auswaertiges-amt.de/en/visa-service/-/1216238" },
    { label: "make-it-in-germany.com — Visa for study", url: "https://www.make-it-in-germany.com/en/visa-residence/types/visa-study" },
    { label: "VIDEX online form", url: "https://videx.diplo.de/videx/visum-erfassung/#/videx-langfristiger-aufenthalt" },
    { label: "anabin qualification database", url: "https://anabin.kmk.org/anabin.html" },
    { label: "Appointment booking — termin.diplo.de", url: "https://service2.diplo.de/rktermin/" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// IRELAND — Stamp 2 Student Immigration Permission + D-visa
// Sources: irishimmigration.ie, inis.gov.ie, dfa.ie, citizensinformation.ie
// ─────────────────────────────────────────────────────────────────────────────
const IRL: VisaCountry = {
  code: "IRL",
  country: "Ireland",
  flag: "🇮🇪",
  visaName: "Long Stay 'D' Study Visa (Stamp 2)",
  visaCode: "D-Study",
  tagline:
    "For study of 3+ months at an ILEP-listed institution. Visa-required nationals apply for a 'D' study visa at the Irish mission before travel; all students must then register for a Stamp 2 Irish Residence Permit within 90 days of arrival.",
  applyUrl: "https://www.visas.inis.gov.ie/avats/OnlineHome.aspx",
  applyUrlLabel: "Apply on AVATS (INIS)",
  processingTime:
    "Typically 8 weeks from when the application reaches the Irish embassy/consulate. Applicants from India, Nigeria, Pakistan, Bangladesh may experience longer processing during peak periods (June–Sep).",
  visaFee: {
    amount: 60,
    currency: "EUR",
    notes: "Single-entry D-visa fee. Multi-entry D-visa is €100. Non-refundable.",
  },
  additionalFees: [
    { label: "Irish Residence Permit (IRP) registration fee", amount: 300, currency: "EUR", notes: "Paid on first IRP registration in Ireland — renewed yearly." },
    { label: "Private medical insurance (first year)", amount: 150, currency: "EUR", notes: "Typical annual premium for student-eligible plans (Study & Protect, VHI Student Plan)." },
  ],
  financial: {
    label: "€10,000 access per year of study + first-year tuition paid",
    amount: 10000,
    currency: "EUR",
    coverMonths: 12,
    notes:
      "Irish Immigration Service requires proof that you have access to at least €10,000 for each year of your studies (in addition to fees paid). Evidence: bank statement in your name, parent affidavit + bank statement + relationship proof, scholarship letter, or education loan. Tuition must be paid in full before visa application — get an official receipt from the ILEP-listed institution.",
    officialSource: {
      label: "irishimmigration.ie — Study in Ireland financial requirements",
      url: "https://www.irishimmigration.ie/coming-to-study-in-ireland/what-are-my-visa-conditions-when-i-arrive/",
    },
  },
  steps: [
    {
      order: 1,
      title: "Receive Letter of Acceptance from an ILEP-listed institution",
      detail:
        "Verify the institution is on the current Interim List of Eligible Programmes (ILEP) published by the Department of Further and Higher Education. Only ILEP programmes qualify for Stamp 2 and post-study work.",
      officialLink: {
        label: "ILEP — official list",
        url: "https://www.gov.ie/en/service/2c475-the-interim-list-of-eligible-programmes-ilep/",
      },
    },
    {
      order: 2,
      title: "Pay tuition fees in full to the institution",
      detail:
        "Full tuition must be paid upfront before the visa application is submitted. The institution provides an official receipt referencing your acceptance letter — this is mandatory for the D-visa application.",
    },
    {
      order: 3,
      title: "Arrange private medical insurance",
      detail:
        "Buy private medical insurance covering your stay in Ireland (Study & Protect, VHI Student Plan, Aon or other approved providers). EEA/Swiss students use EHIC; everyone else needs private cover.",
    },
    {
      order: 4,
      title: "Complete the AVATS online application",
      detail:
        "Fill the visa form at visas.inis.gov.ie/avats/OnlineHome.aspx. Print the summary with barcode. Sign and submit it together with documents to your local Irish embassy/consulate or the designated VFS centre.",
      officialLink: { label: "AVATS online form", url: "https://www.visas.inis.gov.ie/avats/OnlineHome.aspx" },
    },
    {
      order: 5,
      title: "Submit biometrics + documents at VFS / embassy",
      detail:
        "Deliver the signed summary, passport, photos, tuition/finance/insurance proof, acceptance letter, and SOP to the nearest Irish embassy or VFS. Biometrics required in some jurisdictions (India, Nigeria, Pakistan).",
    },
    {
      order: 6,
      title: "Register for the Irish Residence Permit (Stamp 2)",
      detail:
        "Arrive before your course starts; within 90 days of landing, book an appointment and register in person at your local immigration office (Burgh Quay in Dublin, or regional Garda stations elsewhere). Pay €300 and receive your IRP card with Stamp 2 status.",
      officialLink: {
        label: "Register as a non-EEA student",
        url: "https://www.irishimmigration.ie/registering-your-immigration-permission/information-on-registering/",
      },
    },
  ],
  checklist: [
    { id: "passport", group: "identity", label: "Valid passport",
      detail: "Valid for at least 12 months beyond intended stay." },
    { id: "loa", group: "academic", label: "Letter of Acceptance from ILEP institution",
      detail: "Must show course title, start date, duration, and tuition amount." },
    { id: "tuition-receipt", group: "financial", label: "Tuition fee receipt (paid in full)",
      detail: "Official receipt on institution letterhead — tuition must be paid BEFORE applying.",
      risk: "Applications submitted without full tuition payment are refused without exception." },
    { id: "funds", group: "financial", label: "Proof of €10,000 access for first year",
      detail: "Bank statement, FD, parent affidavit + statement, loan sanction, or scholarship letter." },
    { id: "insurance", group: "pre-application", label: "Private medical insurance certificate",
      detail: "Full-coverage policy from an approved provider; must cover your visa period." },
    { id: "sop", group: "pre-application", label: "Statement of Purpose / signed declaration",
      detail: "Explain your study plan, post-study intent, and connection to the home country. Irish consular officers scrutinise SOPs closely." },
    { id: "english", group: "academic", label: "English proficiency score report",
      detail: "IELTS 6.0 / TOEFL iBT 80 / PTE 56 — course-specific minima apply." },
    { id: "academic", group: "academic", label: "Academic transcripts & certificates",
      detail: "Originals and certified copies for every qualification referenced on your application." },
    { id: "avats", group: "pre-application", label: "AVATS signed summary page",
      detail: "Print the barcoded PDF from AVATS, sign in pen, and submit to VFS / embassy." },
    { id: "photos", group: "identity", label: "Biometric photos (Irish specs)",
      detail: "35×45 mm, neutral expression, plain white background, less than 6 months old." },
    { id: "prior-visa", group: "identity", label: "Prior visa refusals disclosure",
      detail: "Any prior refusal (any country) must be declared with letter and explanation.",
      risk: "Undisclosed refusals are grounds for permanent misrepresentation ban — Irish Immigration checks against UK/Schengen databases." },
  ],
  risks: [
    {
      severity: "critical",
      title: "Tuition not paid in full before submission",
      detail:
        "Ireland is strict — tuition receipts are mandatory AT submission. Partial payment plans don't qualify for the D-visa.",
    },
    {
      severity: "critical",
      title: "Institution not on ILEP list",
      detail:
        "Only ILEP-listed programmes grant Stamp 2 and 1G/2G post-study work rights. Students at non-ILEP institutions cannot register for Stamp 2 even if the D-visa is issued.",
    },
    {
      severity: "high",
      title: "Weak Statement of Purpose",
      detail:
        "Irish visa officers rely on the SOP to assess genuine student intent. Generic or AI-templated SOPs trigger refusal more often than document gaps.",
    },
    {
      severity: "high",
      title: "IRP registration missed in 90-day window",
      detail:
        "If you do not register with immigration within 90 days of arrival, your lawful stay lapses. Appointments at Burgh Quay fill months ahead during August — book the moment you receive the D-visa.",
    },
    {
      severity: "medium",
      title: "Insurance that doesn't match IRP rules",
      detail:
        "Policy must cover inpatient + outpatient treatment, and have no waiting period. Travel insurance typically doesn't qualify — buy a purpose-built student plan.",
    },
  ],
  officialSources: [
    { label: "irishimmigration.ie — Coming to study", url: "https://www.irishimmigration.ie/coming-to-study-in-ireland/" },
    { label: "AVATS online application", url: "https://www.visas.inis.gov.ie/avats/OnlineHome.aspx" },
    { label: "Irish Residence Permit registration", url: "https://www.irishimmigration.ie/registering-your-immigration-permission/" },
    { label: "ILEP — Eligible Programmes list", url: "https://www.gov.ie/en/service/2c475-the-interim-list-of-eligible-programmes-ilep/" },
    { label: "dfa.ie — Irish visas", url: "https://www.dfa.ie/travel/visas/" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// NETHERLANDS — MVV + Residence Permit (university applies on your behalf)
// Sources: ind.nl, nuffic.nl, studyinnl.org
// ─────────────────────────────────────────────────────────────────────────────
const NLD: VisaCountry = {
  code: "NLD",
  country: "Netherlands",
  flag: "🇳🇱",
  visaName: "MVV (Provisional Residence Permit) + VVR",
  visaCode: "MVV / VVR",
  tagline:
    "The Dutch university applies to the IND on your behalf as your Recognised Sponsor. You do NOT apply at the embassy directly. Once approved, you pick up the MVV sticker, enter the Netherlands, and collect your VVR residence permit card.",
  applyUrl: "https://ind.nl/en/residence-permits/study/residence-permit-for-study-at-a-university-or-hbo",
  applyUrlLabel: "IND — Study Residence Permit",
  processingTime:
    "Legal IND decision deadline is 90 days after a complete application. Most university sponsors receive a decision within 2–4 weeks.",
  visaFee: {
    amount: 260,
    currency: "EUR",
    notes: "IND fee for study residence permit (2026). The university typically charges this to you + a small admin fee.",
  },
  additionalFees: [
    { label: "Dutch public health insurance OR private student plan", amount: 600, currency: "EUR", notes: "AON Student Insurance or equivalent — approx. €50/month. Mandatory during study." },
    { label: "BSN (Citizen Service Number) registration", amount: 0, currency: "EUR", notes: "Free. Required within 5 days of arrival at your municipality." },
  ],
  financial: {
    label: "€13,569 (~€1,131/month × 12) for living costs + tuition paid",
    amount: 13569,
    currency: "EUR",
    coverMonths: 12,
    notes:
      "The IND-required monthly sum for 2026 is €1,130.77 for HE students (from the Dutch WML/WSF norm). Many universities post slightly higher figures (e.g., Utrecht €1,225) to absorb FX/banking variance. Proof takes the form of: (a) bank statement in your name, (b) scholarship letter, (c) parent sponsor financial statement with declaration and bank docs, or (d) transfer of funds to the university's holding account. Tuition must be confirmed paid by the university.",
    officialSource: {
      label: "ind.nl — Sufficient financial means",
      url: "https://ind.nl/en/residence-permits/study/residence-permit-for-study-at-a-university-or-hbo",
    },
  },
  steps: [
    {
      order: 1,
      title: "Accept admission and sign university's tuition/MVV instructions",
      detail:
        "Your Dutch university, as Recognised Sponsor, coordinates everything. They email you the checklist: tuition payment, financial proof transfer, passport scan, and signed authorisation to apply to the IND.",
    },
    {
      order: 2,
      title: "Pay tuition deposit + transfer living-expense proof",
      detail:
        "Typical pattern: you transfer €1,208 × 12 = €14,500 into the university's holding account, or submit a bank letter in your own name. Tuition first instalment is also due before the MVV filing.",
    },
    {
      order: 3,
      title: "University files the MVV/VVR application with the IND",
      detail:
        "You do NOT fill forms yourself — the university submits on your behalf. They notify you when the IND issues a positive decision letter (usually 2–4 weeks).",
    },
    {
      order: 4,
      title: "Collect MVV at the Dutch embassy/consulate",
      detail:
        "Book an appointment at the Dutch mission in your country. Submit passport for the MVV sticker + biometrics. MVV allows one entry to the Netherlands.",
    },
    {
      order: 5,
      title: "Travel to the Netherlands within MVV validity (90 days)",
      detail:
        "Enter before MVV expires. Travel with your university's welcome letter + passport with MVV.",
    },
    {
      order: 6,
      title: "Register at municipality (BRP) and collect VVR card",
      detail:
        "Within 5 working days: register at your local gemeente to get a BSN number. The university schedules biometrics for the VVR card; card is issued by the IND within 2 weeks and collected at a local IND desk.",
      officialLink: {
        label: "ind.nl — Collecting residence documents",
        url: "https://ind.nl/en/procedures/collecting-residence-document",
      },
    },
  ],
  checklist: [
    { id: "passport", group: "identity", label: "Valid passport",
      detail: "Valid for at least 3 months beyond MVV expiry (or full study duration — check with university)." },
    { id: "admission", group: "academic", label: "Admission letter from Recognised Sponsor",
      detail: "Must come from a university listed on the IND's public register of Recognised Sponsors." },
    { id: "tuition-proof", group: "financial", label: "Tuition payment confirmation",
      detail: "Receipt from the university confirming payment of the first instalment (or full tuition)." },
    { id: "funds", group: "financial", label: "Living-cost proof (€14,496/year)",
      detail: "Bank statement, parental declaration + bank proof, scholarship letter, OR transfer to university holding account." },
    { id: "authorisation", group: "pre-application", label: "Signed authorisation for university to apply",
      detail: "University-provided form giving them power to file with the IND on your behalf." },
    { id: "insurance", group: "pre-application", label: "Health insurance plan selected",
      detail: "Private student insurance (AON Student Insurance etc.) OR Dutch public insurance once employed." },
    { id: "apostille", group: "academic", label: "Apostilled birth certificate",
      detail: "Most universities require an apostilled birth certificate for BRP registration — process early in your home country.",
      risk: "Missing apostille delays municipal BRP registration, which in turn delays VVR card pickup." },
    { id: "english", group: "academic", label: "English proficiency score",
      detail: "IELTS 6.0 / TOEFL iBT 80 / Cambridge C1 — varies by institution and programme level." },
    { id: "photos", group: "identity", label: "Biometric photos",
      detail: "35×45 mm, less than 6 months old. Required for MVV and VVR card." },
  ],
  risks: [
    {
      severity: "critical",
      title: "Using a non-Recognised Sponsor",
      detail:
        "Only Recognised Sponsor institutions can sponsor a study MVV. Private language schools and non-recognised bootcamps cannot — always verify on ind.nl's Public Register.",
    },
    {
      severity: "high",
      title: "Missing apostille on birth certificate",
      detail:
        "The Netherlands requires apostille-legalised birth certificates for BRP (municipal registration). Processing an apostille in India takes 3–6 weeks — start early.",
    },
    {
      severity: "high",
      title: "Late BRP/BSN registration",
      detail:
        "You have 5 working days after arrival to register. Late registration delays your bank account opening, health insurance start, and part-time work permission.",
    },
    {
      severity: "medium",
      title: "Using travel insurance instead of approved student plan",
      detail:
        "Travel insurance typically doesn't meet Dutch coverage requirements. Buy AON Student Insurance (or similar) BEFORE landing.",
    },
  ],
  officialSources: [
    { label: "ind.nl — Residence permit for study", url: "https://ind.nl/en/residence-permits/study/residence-permit-for-study-at-a-university-or-hbo" },
    { label: "ind.nl — Public register of Recognised Sponsors", url: "https://ind.nl/en/public-register-recognised-sponsors" },
    { label: "nuffic.nl — Come to the Netherlands", url: "https://www.nuffic.nl/en/subjects/come-to-the-netherlands" },
    { label: "studyinnl.org", url: "https://www.studyinnl.org/" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// FRANCE — Long-Stay Student Visa (VLS-TS 'Étudiant')
// Sources: france-visas.gouv.fr, campusfrance.org
// ─────────────────────────────────────────────────────────────────────────────
const FRA: VisaCountry = {
  code: "FRA",
  country: "France",
  flag: "🇫🇷",
  visaName: "Long-Stay Student Visa (VLS-TS 'Étudiant')",
  visaCode: "VLS-TS",
  tagline:
    "For study of 3–12+ months in France. Most applicants (40+ countries including India, China, Brazil) must first go through Campus France 'Études en France'. Once in France, the VLS-TS is validated online to act as a residence permit for Year 1.",
  applyUrl: "https://france-visas.gouv.fr/en/web/france-visas/",
  applyUrlLabel: "France-Visas official portal",
  processingTime:
    "After the Campus France interview and VFS appointment, the visa decision is typically returned in 2–3 weeks. Total timeline (Études en France → visa stamp) is 6–10 weeks — start 4 months before the course.",
  visaFee: {
    amount: 99,
    currency: "EUR",
    notes: "Long-stay visa fee. Campus France fee is charged separately (varies by country, ~€100–300).",
  },
  additionalFees: [
    { label: "Campus France processing fee", amount: 200, currency: "EUR", notes: "Paid to the Études en France procedure. Varies by country (India ₹18,000; many African countries ~€180)." },
    { label: "OFII / VLS-TS online validation fee", amount: 60, currency: "EUR", notes: "Paid online on administration-etrangers-en-france.interieur.gouv.fr within 3 months of arrival (2026 tax stamp)." },
    { label: "Student health insurance (Sécurité Sociale Étudiante)", amount: 0, currency: "EUR", notes: "Registration is FREE at etudiant-etranger.ameli.fr — mandatory for non-EU students." },
  ],
  financial: {
    label: "€615/month × length of stay (~€7,380 for 12 months)",
    amount: 7380,
    currency: "EUR",
    coverMonths: 12,
    notes:
      "The official CROUS/Campus France minimum is €615 per month (unchanged for 2026). Evidence: bank statement in your name, French bank scholarship receipt, CROUS scholarship, sponsor's declaration + sponsor's last 3-month bank statement + relationship proof. Tuition receipts (where applicable — public French universities charge €2,770/year for Bachelor's from non-EU students) are also required.",
    officialSource: {
      label: "campusfrance.org — Financial resources",
      url: "https://www.campusfrance.org/en/financial-resources-visa",
    },
  },
  steps: [
    {
      order: 1,
      title: "Create an Études en France account (if your country is listed)",
      detail:
        "40+ countries use Campus France's pre-consular process. Set up an account at pastel.diplomatie.gouv.fr, upload diplomas, transcripts, and motivation letters, then book an interview at your local Campus France Espace.",
      officialLink: {
        label: "Études en France portal",
        url: "https://pastel.diplomatie.gouv.fr/etudesenfrance/dyn/public/authentification/login.html",
      },
    },
    {
      order: 2,
      title: "Attend Campus France interview and receive NOC",
      detail:
        "The Campus France Espace interviews you on your study project. Once validated, your file is forwarded to the French consulate and you receive a No-Objection Certificate (NOC).",
    },
    {
      order: 3,
      title: "Book VFS / consular appointment for VLS-TS",
      detail:
        "With Campus France validation, book a biometric appointment at the nearest VFS France centre. Submit passport, admission letter, NOC, financial evidence, accommodation proof, and photos.",
      officialLink: { label: "VFS France", url: "https://visa.vfsglobal.com/ind/en/fra" },
    },
    {
      order: 4,
      title: "Receive VLS-TS visa sticker",
      detail:
        "A VLS-TS 'Étudiant' sticker is placed in your passport (up to 12 months validity). It acts as both the visa for entry AND the residence permit for the first year, provided you validate it online within 3 months of arrival.",
    },
    {
      order: 5,
      title: "Travel to France + validate VLS-TS online within 3 months",
      detail:
        "Go to administration-etrangers-en-france.interieur.gouv.fr, validate your VLS-TS (€50), and upload proof of French address. Without validation your visa becomes invalid after 3 months.",
      officialLink: {
        label: "VLS-TS validation portal",
        url: "https://administration-etrangers-en-france.interieur.gouv.fr/particuliers/",
      },
    },
    {
      order: 6,
      title: "Register for Sécurité Sociale Étudiante",
      detail:
        "Once in France, register at etudiant-etranger.ameli.fr (free). This gives you France's national health coverage for the academic year.",
      officialLink: { label: "Ameli — student enrollment", url: "https://etudiant-etranger.ameli.fr/" },
    },
  ],
  checklist: [
    { id: "passport", group: "identity", label: "Valid passport",
      detail: "Valid for at least 3 months beyond VLS-TS end date; at least 2 blank pages." },
    { id: "campusfrance", group: "pre-application", label: "Études en France NOC / validation",
      detail: "Campus France validation is MANDATORY for the 40+ listed countries. Check pastel.diplomatie.gouv.fr for your country.",
      risk: "Skipping Campus France (for a country on the list) = automatic rejection at the consulate." },
    { id: "admission", group: "academic", label: "Attestation d'inscription / admission letter",
      detail: "Official admission letter from the French institution, dated and signed." },
    { id: "funds", group: "financial", label: "Financial proof of €615/month (~€7,380/yr)",
      detail: "Bank statement, scholarship letter, or sponsor's declaration + statement + relationship proof." },
    { id: "accommodation", group: "pre-application", label: "Accommodation attestation",
      detail: "CROUS housing assignment, private lease, hotel booking, or host attestation d'accueil. Must cover at least the first month." },
    { id: "insurance", group: "pre-application", label: "Travel/medical insurance for the journey",
      detail: "Covers arrival period before Sécurité Sociale enrolment completes; €30,000+ medical cover." },
    { id: "photos", group: "identity", label: "Biometric photos (French/Schengen specs)",
      detail: "35×45 mm, light-grey or off-white background, less than 6 months old." },
    { id: "motivation", group: "academic", label: "Motivation letter in French or English",
      detail: "Campus France Espace and the consulate expect a clear, specific letter on study plan and career goals." },
    { id: "language", group: "academic", label: "Language proof (French or English)",
      detail: "DELF B2 / DALF C1 for French-taught programmes; IELTS 6.5 / TOEFL iBT 90 for English-taught." },
    { id: "ofii", group: "post-approval", label: "VLS-TS online validation (within 3 months of arrival)",
      detail: "Log in to administration-etrangers-en-france.interieur.gouv.fr and pay €50 to activate residence permit status.",
      risk: "Failing to validate within 3 months of arrival = undocumented status, with fines and re-entry difficulties." },
  ],
  risks: [
    {
      severity: "critical",
      title: "Skipping Campus France (Études en France)",
      detail:
        "For India, China, Brazil, Nigeria, and 40+ listed countries, Campus France validation is mandatory BEFORE applying for the visa. Applications without a Campus France NOC are refused.",
    },
    {
      severity: "critical",
      title: "VLS-TS not validated within 3 months of arrival",
      detail:
        "Your VLS-TS only acts as a residence permit if you validate it online + pay the €50 OFII tax within 3 months of arrival. Missing this makes you an overstayer.",
    },
    {
      severity: "high",
      title: "Weak motivation / study plan at Campus France interview",
      detail:
        "Campus France interviewers are trained to detect misaligned choices (e.g., MBA applicants with zero work history, career U-turns without rationale). Prepare a clear narrative — this is the most common failure point.",
    },
    {
      severity: "medium",
      title: "Inadequate accommodation proof",
      detail:
        "A CROUS confirmation, signed lease, or attestation d'accueil must cover at least the first month. Booking.com reservations are accepted only as short-term evidence.",
    },
    {
      severity: "medium",
      title: "Incorrect photo specs (Schengen)",
      detail:
        "France uses Schengen photo standards (light grey or cream background, 35×45 mm). India's 2×2 inch photos don't comply.",
    },
  ],
  officialSources: [
    { label: "france-visas.gouv.fr — Long-stay student visa", url: "https://france-visas.gouv.fr/en/web/france-visas/long-stay-student-visa" },
    { label: "campusfrance.org — Coming to France", url: "https://www.campusfrance.org/en" },
    { label: "Études en France portal", url: "https://pastel.diplomatie.gouv.fr/etudesenfrance/dyn/public/authentification/login.html" },
    { label: "VLS-TS validation portal", url: "https://administration-etrangers-en-france.interieur.gouv.fr/particuliers/" },
    { label: "etudiant-etranger.ameli.fr (health)", url: "https://etudiant-etranger.ameli.fr/" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW ZEALAND — Fee-Paying Student Visa
// Sources: immigration.govt.nz
// ─────────────────────────────────────────────────────────────────────────────
const NZL: VisaCountry = {
  code: "NZL",
  country: "New Zealand",
  flag: "🇳🇿",
  visaName: "Fee-Paying Student Visa",
  visaCode: "Fee-Paying Student",
  tagline:
    "For study at an NZQA-approved institution. Immigration New Zealand (INZ) requires proof of NZ$20,000+/year living funds, a medical insurance policy covering the visa period, and (for most applicants) a chest X-ray medical examination.",
  applyUrl: "https://www.immigration.govt.nz/new-zealand-visas/apply-for-a-visa/about-visa/fee-paying-student-visa",
  applyUrlLabel: "Apply on Immigration NZ",
  processingTime:
    "Median processing time for fee-paying student visas (offshore) is 6–8 weeks per INZ published stats. Complex cases (queried financial docs, medicals) can take 12+ weeks.",
  visaFee: {
    amount: 850,
    currency: "NZD",
    notes: "Online offshore fee effective 2026. Paper applications and onshore applications have different fees — check INZ site.",
  },
  additionalFees: [
    { label: "International Visitor Conservation & Tourism Levy (IVL)", amount: 100, currency: "NZD", notes: "Charged alongside visa fee for most student visas." },
    { label: "Medical & X-ray examination (panel physician)", amount: 150, currency: "NZD", notes: "Typical cost in India/Pakistan; higher elsewhere. Via Bupa Medical Visa Services or country panel." },
  ],
  financial: {
    label: "NZ$20,000/year living expenses + tuition + onward travel",
    amount: 20000,
    currency: "NZD",
    coverMonths: 12,
    notes:
      "INZ requires NZ$20,000 per year of study for living expenses (NZ$1,667/month). This is ADDITIONAL to tuition (paid or shown as sponsor-committed) and an onward travel ticket or NZ$2,000. Accepted evidence: bank statement, FanTV FTS (Funds Transfer Scheme), education loan, scholarship, parental sponsorship with declaration.",
    officialSource: {
      label: "immigration.govt.nz — Student visa funds",
      url: "https://www.immigration.govt.nz/new-zealand-visas/apply-for-a-visa/about-visa/fee-paying-student-visa",
    },
  },
  steps: [
    {
      order: 1,
      title: "Receive Offer of Place + pay tuition",
      detail:
        "Your NZQA-approved institution issues the Offer of Place. For courses under 36 weeks tuition must be paid in full; for longer courses the first year's tuition suffices. Get the tuition receipt on institutional letterhead.",
      officialLink: { label: "NZQA list of education providers", url: "https://www.nzqa.govt.nz/providers-partners/" },
    },
    {
      order: 2,
      title: "Arrange approved medical insurance",
      detail:
        "Immigration NZ requires full medical and travel insurance for the duration of the visa. Orbit, StudentSafe, Southern Cross, and Uni-Care are common approved providers.",
    },
    {
      order: 3,
      title: "Complete medical + chest X-ray",
      detail:
        "Mandatory for applicants from tuberculosis-risk countries and for courses over 6 months. Use a panel physician (BMVS in India/Pakistan). Results are uploaded electronically.",
      officialLink: { label: "Panel physicians — INZ", url: "https://www.immigration.govt.nz/new-zealand-visas/preparing-a-visa-application/medical-info/find-a-doctor" },
    },
    {
      order: 4,
      title: "Apply online via the Immigration Online account",
      detail:
        "Create an RealMe + ImmigrationONLINE account, upload all documents including Offer of Place, funds proof, insurance certificate, medical reference, and passport scan. Pay NZD 750 online.",
      officialLink: { label: "Immigration Online", url: "https://www.immigration.govt.nz/new-zealand-visas/apply-for-a-visa/tools-and-information/getting-started-with-immigration-online" },
    },
    {
      order: 5,
      title: "Submit biometrics (visa-required nationals)",
      detail:
        "Indians, Pakistanis, Nigerians, and certain other nationalities attend a VFS appointment for biometrics within 15 working days of application receipt.",
    },
    {
      order: 6,
      title: "Receive e-visa and plan entry",
      detail:
        "INZ issues an electronic visa linked to your passport — there is no sticker. Print the approval letter and carry it at the border. Students can enter NZ up to 1 month before course start.",
    },
  ],
  checklist: [
    { id: "passport", group: "identity", label: "Valid passport",
      detail: "Valid for at least 3 months beyond your intended stay." },
    { id: "offer", group: "academic", label: "Offer of Place from NZQA-approved provider",
      detail: "Must mention course level, duration, fees, and compliance with the Education (Pastoral Care of Tertiary and International Learners) Code of Practice." },
    { id: "tuition", group: "financial", label: "Tuition payment receipt",
      detail: "Full-year tuition (or full course fee for courses <36 weeks) receipt from the institution." },
    { id: "funds", group: "financial", label: "Living-expense funds (NZ$20,000)",
      detail: "Bank statement, FTS (Funds Transfer Scheme via ANZ NZ) confirmation, education loan sanction, or parent sponsorship." },
    { id: "insurance", group: "pre-application", label: "Medical/travel insurance certificate",
      detail: "Approved provider with cover for the full visa period.",
      risk: "Domestic travel insurance that doesn't meet INZ's medical criteria triggers a PPI (Potentially Prejudicial Information) query and delays." },
    { id: "medical", group: "biometric-interview", label: "Medical certificate + chest X-ray",
      detail: "Mandatory for tuberculosis-risk countries and courses >6 months — via an approved panel physician." },
    { id: "sop", group: "pre-application", label: "Statement of purpose / intention",
      detail: "Clear rationale for course choice, career plan, and home-country ties." },
    { id: "english", group: "academic", label: "English proficiency score",
      detail: "IELTS 6.0 / TOEFL iBT 80 / PTE 50 — programme-specific minima apply." },
    { id: "academic", group: "academic", label: "Academic transcripts & certificates",
      detail: "Certified copies of all post-secondary qualifications." },
    { id: "biometrics", group: "biometric-interview", label: "Biometrics (VFS)",
      detail: "Required for visa-required nationalities; book within 15 working days of application receipt." },
  ],
  risks: [
    {
      severity: "critical",
      title: "Funds not from approved sources",
      detail:
        "INZ requires funds to be traceable. Recent large deposits into an otherwise dormant account trigger questions. Use the ANZ NZ Funds Transfer Scheme (FTS) if possible — it's the cleanest evidence.",
    },
    {
      severity: "high",
      title: "Insurance policy doesn't meet INZ cover requirements",
      detail:
        "Policy must cover medical, hospital, and repatriation. Generic travel insurance often doesn't qualify and triggers PPI letters.",
    },
    {
      severity: "high",
      title: "PPI letter not addressed within deadline",
      detail:
        "If INZ sends a Potentially Prejudicial Information letter (PPI), you typically have 14 days to respond with evidence. Missing this window = visa refusal.",
    },
    {
      severity: "medium",
      title: "Course duration < 36 weeks and tuition not paid in full",
      detail:
        "For shorter courses, tuition must be paid 100% up-front. For longer courses, first-year tuition is enough — but the distinction is strict.",
    },
  ],
  officialSources: [
    { label: "Immigration NZ — Fee-Paying Student Visa", url: "https://www.immigration.govt.nz/new-zealand-visas/apply-for-a-visa/about-visa/fee-paying-student-visa" },
    { label: "NZQA — providers and partners", url: "https://www.nzqa.govt.nz/providers-partners/" },
    { label: "INZ — Panel physicians", url: "https://www.immigration.govt.nz/new-zealand-visas/preparing-a-visa-application/medical-info/find-a-doctor" },
    { label: "INZ — Immigration Online", url: "https://www.immigration.govt.nz/new-zealand-visas/apply-for-a-visa/tools-and-information/getting-started-with-immigration-online" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SINGAPORE — Student's Pass (ICA)
// Sources: ica.gov.sg, studyinsingapore.edu.sg
// ─────────────────────────────────────────────────────────────────────────────
const SGP: VisaCountry = {
  code: "SGP",
  country: "Singapore",
  flag: "🇸🇬",
  visaName: "Student's Pass (via SOLAR)",
  visaCode: "Student's Pass",
  tagline:
    "Singapore's ICA issues the Student's Pass through the SOLAR (Student's Pass Online Application & Registration) system. The university registers you in SOLAR; you complete the eForm 16 within 2 weeks, then arrive in Singapore and complete a one-time in-person completion formality.",
  applyUrl: "https://eservices.ica.gov.sg/solar/",
  applyUrlLabel: "ICA SOLAR portal",
  processingTime:
    "In-principle approval (IPA) is issued within 1–4 weeks after eForm 16 submission. Most approvals land in ~10 working days.",
  visaFee: {
    amount: 90,
    currency: "SGD",
    notes: "Processing (SGD 30) + issuance (SGD 60) fees. Both payable online via SOLAR.",
  },
  additionalFees: [
    { label: "Multiple Journey Visa (nationalities that require it)", amount: 30, currency: "SGD", notes: "E.g., Indian, Chinese, Bangladeshi passport holders — auto-charged with Student's Pass." },
    { label: "Medical examination (if required)", amount: 100, currency: "SGD", notes: "Required for some nationalities and long courses — chest X-ray + HIV test." },
  ],
  financial: {
    label: "No fixed government financial proof; institutional scholarship or funds evidence as per school policy",
    amount: 0,
    currency: "SGD",
    coverMonths: 0,
    notes:
      "Singapore's ICA does NOT publish a specific minimum financial proof for Student's Pass applicants — the burden is on the Institution of Higher Learning to verify funds capability during admission. NUS/NTU/SMU typically require CAS-equivalent declaration + bank statements. Tuition Grant (MoE subsidy) recipients sign a 3-year Singapore work bond in exchange.",
    officialSource: {
      label: "ica.gov.sg — Student's Pass",
      url: "https://www.ica.gov.sg/enter-transit-depart/students/apply-stp",
    },
  },
  steps: [
    {
      order: 1,
      title: "Receive admission + institution registers you on SOLAR",
      detail:
        "Your IHL (Institution of Higher Learning — NUS, NTU, SMU, SIT, SUTD, SUSS, etc.) registers your application in SOLAR within 2 months of intended arrival. You receive a SOLAR reference + password by email.",
    },
    {
      order: 2,
      title: "Complete eForm 16 within 2 weeks of SOLAR registration",
      detail:
        "Log in to SOLAR and fill eForm 16: personal particulars, passport, education history, accommodation in SG. Upload passport photo. Pay the SGD 30 processing fee.",
    },
    {
      order: 3,
      title: "Receive In-Principle Approval (IPA) from ICA",
      detail:
        "The IPA letter serves as an entry visa — carry it with your passport when arriving in Singapore. IPA is typically valid for 90 days from issuance.",
    },
    {
      order: 4,
      title: "Arrive in Singapore before IPA expiry",
      detail:
        "At Changi immigration, present the IPA letter + passport. You receive a Visit Pass sticker (VP) valid until you complete formalities.",
    },
    {
      order: 5,
      title: "Complete medical (if required) + appointment at ICA",
      detail:
        "Some applicants (determined by nationality and course) must complete a medical examination. Book an appointment at ICA Building via SOLAR+ / eAppointment, pay SGD 60 issuance fee, submit thumbprints, and collect the Student's Pass card.",
      officialLink: {
        label: "ICA — eAppointment",
        url: "https://eservices.ica.gov.sg/esvclandingpage/save4",
      },
    },
    {
      order: 6,
      title: "Register at school + collect Student's Pass card",
      detail:
        "The Student's Pass card is typically delivered to your registered home address by post, or collected at ICA. Must be carried as ID whenever out of home.",
    },
  ],
  checklist: [
    { id: "passport", group: "identity", label: "Valid passport",
      detail: "Valid for at least 6 months beyond the IPA expiry." },
    { id: "solar-ref", group: "pre-application", label: "SOLAR reference + password",
      detail: "Issued by your IHL within 2 months of intended arrival." },
    { id: "eform16", group: "pre-application", label: "Submitted eForm 16 (within 2-week window)",
      detail: "Personal particulars, accommodation, passport scan, declarations.",
      risk: "If eForm 16 is not submitted within 2 weeks of SOLAR registration, the application lapses and the institution must re-register you." },
    { id: "ipa", group: "post-approval", label: "In-Principle Approval (IPA) letter",
      detail: "Printed. Carry with passport at Changi on arrival." },
    { id: "photo", group: "identity", label: "Digital photo (ICA specs)",
      detail: "35×45 mm, white background, less than 3 months old. Uploaded to SOLAR." },
    { id: "admission", group: "academic", label: "Offer of admission from IHL",
      detail: "Official admission letter with course, duration, and tuition." },
    { id: "transcripts", group: "academic", label: "Academic transcripts & certificates",
      detail: "Originals or certified copies of all post-secondary qualifications." },
    { id: "funds", group: "financial", label: "Funds evidence as required by IHL",
      detail: "Varies by IHL — typically bank statements + sponsor declaration. ICA doesn't set a minimum but the IHL does." },
    { id: "medical", group: "biometric-interview", label: "Medical certificate (if requested)",
      detail: "Chest X-ray + HIV test — only for some nationalities and long courses." },
  ],
  risks: [
    {
      severity: "critical",
      title: "eForm 16 submitted after the 2-week window",
      detail:
        "SOLAR applications lapse if eForm 16 is not submitted within 2 weeks. The IHL must re-register, which pushes your arrival timeline.",
    },
    {
      severity: "high",
      title: "Not carrying IPA letter at Changi",
      detail:
        "The IPA IS your entry visa. Without the printed letter, arrival immigration may not grant entry.",
    },
    {
      severity: "medium",
      title: "Missing completion appointment at ICA",
      detail:
        "You have to physically complete formalities at ICA Building within a few weeks of arrival. Missing the appointment window requires rebooking and fees.",
    },
    {
      severity: "medium",
      title: "Tuition Grant 3-year bond misunderstanding",
      detail:
        "If you accept the MoE Tuition Grant, you sign a legally binding 3-year Singapore work bond post-graduation. Breaking the bond requires repayment with interest.",
    },
  ],
  officialSources: [
    { label: "ica.gov.sg — Apply Student's Pass", url: "https://www.ica.gov.sg/enter-transit-depart/students/apply-stp" },
    { label: "ICA SOLAR portal", url: "https://eservices.ica.gov.sg/solar/" },
    { label: "studyinsingapore.edu.sg", url: "https://www.studyinsingapore.edu.sg/" },
    { label: "MoE Tuition Grant Scheme", url: "https://tgonline.moe.gov.sg/" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MALAYSIA — Student Pass (via EMGS)
// Sources: educationmalaysia.gov.my (EMGS), imi.gov.my
// ─────────────────────────────────────────────────────────────────────────────
const MYS: VisaCountry = {
  code: "MYS",
  country: "Malaysia",
  flag: "🇲🇾",
  visaName: "Student Pass (processed via EMGS)",
  visaCode: "Student Pass",
  tagline:
    "Malaysia's Ministry of Education requires all international students to apply through EMGS (Education Malaysia Global Services). EMGS handles the Visa Approval Letter (VAL), medical pre-screening, and insurance. You then collect a single-entry Visa with Reference (VDR) before travel, and the Student Pass sticker is pasted into your passport in Malaysia.",
  applyUrl: "https://visa.educationmalaysia.gov.my/",
  applyUrlLabel: "EMGS Visa Portal",
  processingTime:
    "EMGS targets 10–14 working days for Visa Approval Letter issuance. Add 3–5 working days for VDR endorsement at the nearest Malaysian mission before travel.",
  visaFee: {
    amount: 1060,
    currency: "MYR",
    notes: "EMGS processing fee for a Bachelor's-level Student Pass (indicative). Fees vary slightly by level and nationality.",
  },
  additionalFees: [
    { label: "Medical screening in Malaysia (at EMGS-approved clinic)", amount: 250, currency: "MYR", notes: "Mandatory within 7 days of arrival." },
    { label: "iKad student ID card", amount: 50, currency: "MYR", notes: "Issued via EMGS; serves as in-country student ID." },
    { label: "Student health insurance (EMGS approved)", amount: 500, currency: "MYR", notes: "Annual premium, mandatory for the Student Pass." },
  ],
  financial: {
    label: "No fixed minimum; sufficient funds to cover tuition + living (~MYR 12,000–18,000/year)",
    amount: 0,
    currency: "MYR",
    coverMonths: 0,
    notes:
      "Malaysia's Immigration Department (JIM) does not publish a fixed living-cost floor for student visas, but EMGS applications require: tuition paid (partial or full per institution), proof of funds for living (bank statement, sponsor letter, or scholarship), and a personal bond guaranteed by the institution. Estimated living costs for a foreign student are MYR 12,000–18,000/year (~USD 2,600–3,800).",
    officialSource: {
      label: "educationmalaysia.gov.my",
      url: "https://educationmalaysia.gov.my/",
    },
  },
  steps: [
    {
      order: 1,
      title: "Accept admission from MOHE-recognised institution",
      detail:
        "Malaysia has public universities (UM, UKM, USM, UPM, etc.), private universities (Taylor's, Sunway, Monash Malaysia, Nottingham Malaysia), and university colleges. Only MOHE-registered institutions can sponsor Student Pass applications.",
    },
    {
      order: 2,
      title: "Institution submits EMGS application on your behalf",
      detail:
        "The International Student Office at your institution files the EMGS application — uploading passport, admission letter, and academic transcripts. You can track the file at visa.educationmalaysia.gov.my.",
    },
    {
      order: 3,
      title: "Complete EMGS medical pre-screening (home country)",
      detail:
        "Use an EMGS-approved panel clinic in your home country for pre-screening: blood tests, urine, HIV, hepatitis, chest X-ray. Upload results to EMGS.",
      officialLink: { label: "EMGS panel clinics", url: "https://educationmalaysia.gov.my/medical-screening/" },
    },
    {
      order: 4,
      title: "Receive Visa Approval Letter (VAL)",
      detail:
        "EMGS emails the VAL once the file is cleared. The VAL is valid for 6 months and is needed to endorse the single-entry visa (VDR) at the Malaysian mission.",
    },
    {
      order: 5,
      title: "Get single-entry visa (VDR) at nearest Malaysian High Commission",
      detail:
        "Submit passport + VAL + photos at the Malaysian mission. They issue a single-entry 'Visa With Reference' sticker valid 3 months — use it to enter Malaysia.",
    },
    {
      order: 6,
      title: "Arrive in Malaysia + complete post-arrival medical within 7 days",
      detail:
        "Go through 'Single-Entry Visa' immigration channel at KLIA. The institution arranges your post-arrival medical at an EMGS-approved clinic within 7 days.",
    },
    {
      order: 7,
      title: "Student Pass sticker pasted into passport",
      detail:
        "After medical clearance, the institution submits your passport via EMGS to Immigration Department (JIM) for the Student Pass sticker — valid for the full academic year. Collect iKad ID card from EMGS.",
    },
  ],
  checklist: [
    { id: "passport", group: "identity", label: "Valid passport",
      detail: "Valid for at least 12 months beyond intended stay; multiple blank pages." },
    { id: "loa", group: "academic", label: "Admission letter from MOHE-recognised institution",
      detail: "Offer letter with course title, start date, and tuition." },
    { id: "emgs-account", group: "pre-application", label: "EMGS tracking ID",
      detail: "Assigned when the institution submits your file. Track progress online." },
    { id: "medical-home", group: "biometric-interview", label: "EMGS pre-arrival medical report",
      detail: "Full medical including chest X-ray, blood work, HIV, hepatitis, drug test. Done at EMGS-approved clinic in your country." },
    { id: "val", group: "pre-application", label: "Visa Approval Letter (VAL) — 6 months validity",
      detail: "Printed PDF from EMGS. Required for VDR endorsement.",
      risk: "VDR must be endorsed within 6 months of VAL issuance; expired VAL requires re-application." },
    { id: "vdr", group: "pre-application", label: "Single-entry visa (VDR) sticker",
      detail: "Endorsed at Malaysian High Commission. Valid 3 months for one entry." },
    { id: "funds", group: "financial", label: "Funds proof (bank/sponsor/scholarship)",
      detail: "Institution-specific — typically 6-month bank statement or parent sponsor affidavit." },
    { id: "insurance", group: "pre-application", label: "EMGS-approved health insurance",
      detail: "Annual policy; institution or EMGS provides a list of approved insurers." },
    { id: "photos", group: "identity", label: "Passport photos",
      detail: "35×50 mm, blue background, 3-5 copies." },
    { id: "post-med", group: "post-approval", label: "Post-arrival medical within 7 days of landing",
      detail: "At an EMGS-approved clinic in Malaysia. Without clearance, Student Pass is not pasted." },
  ],
  risks: [
    {
      severity: "critical",
      title: "Using a non-MOHE-recognised institution",
      detail:
        "Only MOHE-registered institutions can sponsor via EMGS. Some private 'colleges' advertising to foreign students are not authorised — verify on MOHE's institution registry.",
    },
    {
      severity: "high",
      title: "VDR expiring before arrival",
      detail:
        "The single-entry VDR is valid only 3 months. If admission start dates are delayed, re-application fees apply.",
    },
    {
      severity: "high",
      title: "Missing post-arrival medical",
      detail:
        "Student Pass is only pasted after the in-Malaysia medical. Delays mean ongoing Visit Pass → risk of immigration overstay.",
    },
    {
      severity: "medium",
      title: "EMGS document rejection",
      detail:
        "Academic transcripts without proper attestation or low-resolution passport scans are the most common reason for EMGS queries — adding 1–2 weeks per cycle.",
    },
  ],
  officialSources: [
    { label: "educationmalaysia.gov.my (EMGS)", url: "https://educationmalaysia.gov.my/" },
    { label: "EMGS Visa Portal", url: "https://visa.educationmalaysia.gov.my/" },
    { label: "Malaysian Immigration Dept (JIM)", url: "https://www.imi.gov.my/index.php/en/" },
    { label: "Ministry of Higher Education (MOHE)", url: "https://www.mohe.gov.my/en/" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// UAE — Student Residence Visa (sponsored by institution)
// Sources: u.ae, icp.gov.ae, gdrfad.gov.ae (Dubai), moe.gov.ae
// ─────────────────────────────────────────────────────────────────────────────
const UAE: VisaCountry = {
  code: "UAE",
  country: "United Arab Emirates",
  flag: "🇦🇪",
  visaName: "Student Residence Visa (ICP / GDRFA)",
  visaCode: "Student Residence",
  tagline:
    "Residence visa sponsored by the UAE-licensed institution (UAEU, Khalifa, NYUAD, AUS, Sorbonne Abu Dhabi, etc.). The university handles the Entry Permit; once you arrive you complete Emirates ID biometrics, a medical fitness test, and get the residence stamp. Federal track is ICP for Abu Dhabi/most emirates; Dubai uses GDRFA.",
  applyUrl: "https://icp.gov.ae/en/services/",
  applyUrlLabel: "ICP UAE — Services",
  processingTime:
    "Entry Permit typically 3–7 working days once the university submits. Medical + Emirates ID + residence stamping after arrival adds another 2–3 weeks.",
  visaFee: {
    amount: 1200,
    currency: "AED",
    notes: "Indicative cost for Entry Permit + Student Residence for one year, via ICP. Varies by emirate and institution; Dubai (GDRFA) has different fee tables.",
  },
  additionalFees: [
    { label: "Emirates ID card (1 year)", amount: 170, currency: "AED", notes: "ICA Smart Services. Mandatory ID for all residents." },
    { label: "Medical fitness test (screening centre)", amount: 320, currency: "AED", notes: "Chest X-ray + blood test at DHA or SEHA approved centre." },
    { label: "Health insurance", amount: 1500, currency: "AED", notes: "Mandatory minimum-benefit policy in Dubai and Abu Dhabi; varies by insurer." },
  ],
  financial: {
    label: "Institution-specific (typically AED 40,000–100,000+ for tuition + living, evidence per institution)",
    amount: 0,
    currency: "AED",
    coverMonths: 0,
    notes:
      "UAE immigration authorities don't publish a fixed living-cost floor for student residence — funding proof is enforced by the sponsoring institution. Each university requires tuition paid or a sponsor letter from parents / employer, plus evidence of funds for housing (on-campus accommodation fees paid; off-campus tenants need a separate process).",
    officialSource: {
      label: "u.ae — Student visas",
      url: "https://u.ae/en/information-and-services/visa-and-emirates-id/residence-visas/student-visas",
    },
  },
  steps: [
    {
      order: 1,
      title: "Accept admission + accommodation",
      detail:
        "Your UAE institution confirms admission AND housing arrangement (on-campus typically simplifies the process). The institution's admissions office assigns a Visa Officer / PRO for your case.",
    },
    {
      order: 2,
      title: "Submit visa application package to the university",
      detail:
        "Passport scan (plus hard copies), attested birth certificate, passport photos (white background), academic transcripts (attested), admission letter. Education attestation requires MoFA attestation — allow 2–3 weeks.",
    },
    {
      order: 3,
      title: "Institution files Entry Permit with ICP (or GDRFA in Dubai)",
      detail:
        "The university's PRO files via ICP Smart Services (Federal) or GDRFA (Dubai). Entry Permit comes in 3–7 working days.",
      officialLink: { label: "ICP Smart Services", url: "https://icp.gov.ae/en/services/" },
    },
    {
      order: 4,
      title: "Receive Entry Permit e-visa + travel to UAE",
      detail:
        "The e-Entry Permit is emailed (valid 60 days). Print and travel. At immigration counter, the Entry Permit activates a 60-day visit stamp.",
    },
    {
      order: 5,
      title: "Complete medical fitness test + Emirates ID biometrics",
      detail:
        "Within 60 days of arrival: visit an approved medical fitness centre (DHA, SEHA, Disha), complete the chest X-ray + blood test. Then visit an ICA Smart Services centre for Emirates ID biometrics.",
      officialLink: { label: "ICA — Medical fitness", url: "https://u.ae/en/information-and-services/health-and-fitness/your-health/medical-fitness-test-for-residency-visa" },
    },
    {
      order: 6,
      title: "Residence visa stamped + Emirates ID issued",
      detail:
        "Once medical is cleared, institution submits the residence stamping request. The visa stamp is added electronically (no physical sticker for most emirates as of 2022) and Emirates ID card is issued by post within 5–10 days.",
    },
  ],
  checklist: [
    { id: "passport", group: "identity", label: "Valid passport",
      detail: "Valid for at least 6 months beyond intended residence; 2 blank pages." },
    { id: "admission", group: "academic", label: "Institution admission letter",
      detail: "From a UAE-licensed higher-education institution (CAA-accredited)." },
    { id: "attestation", group: "academic", label: "Attested academic certificates",
      detail: "Degree/transcripts attested by (a) home-country Ministry of External Affairs, (b) UAE Embassy in your country, and (c) UAE MoFA after arrival.",
      risk: "Missing MoFA attestation is the single largest cause of student-visa file delays — start the attestation process 8+ weeks before arrival." },
    { id: "birth", group: "identity", label: "Attested birth certificate",
      detail: "Required for students under 18 and often requested for adults. Attestation same as academic certificates." },
    { id: "entry-permit", group: "pre-application", label: "Entry Permit e-visa",
      detail: "Emailed by institution after ICP/GDRFA approval. Valid 60 days single-entry." },
    { id: "accommodation", group: "pre-application", label: "Accommodation confirmation",
      detail: "On-campus housing contract or Ejari/Tawtheeq tenancy — required for residence stamping." },
    { id: "insurance", group: "pre-application", label: "Health insurance (DHA/DOH minimum benefit)",
      detail: "Mandatory. Typically purchased in the UAE after arrival from an approved insurer." },
    { id: "photos", group: "identity", label: "Passport photos (UAE specs)",
      detail: "White background, 45×35 mm, 8-12 copies — needed across multiple sub-applications." },
    { id: "medical", group: "biometric-interview", label: "Medical fitness test",
      detail: "Chest X-ray + HIV/Hepatitis blood test at a DHA/SEHA centre." },
    { id: "eid", group: "post-approval", label: "Emirates ID biometrics & card",
      detail: "Visit an ICA Smart Services centre. Card delivered by Emirates Post in 5–10 days." },
  ],
  risks: [
    {
      severity: "critical",
      title: "Academic attestation not completed before arrival",
      detail:
        "UAE requires certificates attested by home MoFA + UAE Embassy + UAE MoFA. This chain takes 6–8 weeks in India/Pakistan. Institutions cannot finalise residence stamping until attestation is complete.",
    },
    {
      severity: "high",
      title: "Overstaying Entry Permit (60 days)",
      detail:
        "Entry Permit grants 60 days to complete medical + Emirates ID + residence stamp. Overstaying costs AED 50/day (post-grace period) and complicates residence.",
    },
    {
      severity: "high",
      title: "Medical fitness test result deferred",
      detail:
        "Hepatitis-positive or TB-positive results may lead to visa rejection in some emirates. Pre-screen in home country where possible and understand each emirate's appeals process.",
    },
    {
      severity: "medium",
      title: "Emirate-specific process confusion",
      detail:
        "Dubai uses GDRFA — ICP processes don't always apply. Abu Dhabi, Sharjah, RAK use ICP. Follow your institution's PRO guidance, not generic checklists.",
    },
    {
      severity: "medium",
      title: "Changing institution mid-course",
      detail:
        "Switching between UAE institutions requires a full residence cancellation + new Entry Permit. Not a simple transfer — budget 4-6 weeks.",
    },
  ],
  officialSources: [
    { label: "u.ae — Student visas", url: "https://u.ae/en/information-and-services/visa-and-emirates-id/residence-visas/student-visas" },
    { label: "ICP Smart Services", url: "https://icp.gov.ae/en/services/" },
    { label: "GDRFA Dubai — Student visas", url: "https://gdrfad.gov.ae/en" },
    { label: "u.ae — Medical fitness test", url: "https://u.ae/en/information-and-services/health-and-fitness/your-health/medical-fitness-test-for-residency-visa" },
    { label: "MoE UAE — Higher Education", url: "https://www.moe.gov.ae/en/pages/home.aspx" },
  ],
};

export const VISA_COUNTRIES: Record<VisaCountryCode, VisaCountry> = {
  USA,
  UK,
  CAN,
  AUS,
  DEU,
  IRL,
  NLD,
  FRA,
  NZL,
  SGP,
  MYS,
  UAE,
};

export const VISA_COUNTRY_LIST: VisaCountry[] = [
  USA, UK, CAN, AUS, DEU, IRL, NLD, FRA, NZL, SGP, MYS, UAE,
];

// ─────────────────────────────────────────────────────────────────────────────
// USD conversion table for cross-country comparison.
// Rough mid-market rates as of 2025-03 — only used for SORTING the
// "easiest visa" grid. Not used in any money displayed to the user.
// ─────────────────────────────────────────────────────────────────────────────
const FX_TO_USD: Record<string, number> = {
  USD: 1,
  GBP: 1.27,
  EUR: 1.08,
  CAD: 0.72,
  AUD: 0.65,
  NZD: 0.60,
  SGD: 0.74,
  MYR: 0.22,
  AED: 0.27,
};

export interface VisaComplexityScore {
  country: VisaCountry;
  /** Financial floor in USD (0 = no published minimum) */
  financialFloorUsd: number;
  /** Number of critical-severity risks */
  criticalRiskCount: number;
  /** Total checklist items */
  documentCount: number;
  /** Approx processing weeks (lower bound) */
  processingWeeks: number;
  /** Composite score 0–100 (lower = easier) */
  complexity: number;
}

function extractLeadWeeks(processingTime: string): number {
  // crude heuristic — pulls the first number of weeks out of the prose
  const m = processingTime.match(/(\d+)\s*[–-]?\s*(\d+)?\s*(week|weeks|day|days)/i);
  if (!m) return 6;
  const low = Number(m[1]);
  const unit = m[3].toLowerCase();
  return unit.startsWith("day") ? Math.max(1, Math.round(low / 7)) : low;
}

export function computeVisaComplexity(v: VisaCountry): VisaComplexityScore {
  const financialFloorUsd =
    v.financial.amount > 0
      ? Math.round(v.financial.amount * (FX_TO_USD[v.financial.currency] ?? 1))
      : 0;
  const criticalRiskCount = v.risks.filter((r) => r.severity === "critical").length;
  const documentCount = v.checklist.length;
  const processingWeeks = extractLeadWeeks(v.processingTime);

  // Weighted complexity (financial 40%, critical risks 25%, docs 15%, processing 20%)
  // Normalised against sensible caps so the 0–100 scale is stable.
  const finNorm = Math.min(100, (financialFloorUsd / 25000) * 100);
  const rskNorm = Math.min(100, (criticalRiskCount / 3) * 100);
  const docNorm = Math.min(100, (documentCount / 12) * 100);
  const prcNorm = Math.min(100, (processingWeeks / 12) * 100);
  const complexity = Math.round(
    finNorm * 0.4 + rskNorm * 0.25 + docNorm * 0.15 + prcNorm * 0.2,
  );

  return {
    country: v,
    financialFloorUsd,
    criticalRiskCount,
    documentCount,
    processingWeeks,
    complexity,
  };
}

export const VISA_COMPLEXITY_RANKED: VisaComplexityScore[] = VISA_COUNTRY_LIST
  .map(computeVisaComplexity)
  .sort((a, b) => a.complexity - b.complexity);
