import { Info } from "lucide-react";

type Variant = "roi" | "visa" | "english-test" | "shortlist" | "scholarship";

const COPY: Record<Variant, string> = {
  roi:
    "Decision-support estimate. Salary, payback and ROI projections use median graduate outcomes; your actual results will vary. Verify tuition, living costs and currency rates from official university and government sources before committing.",
  visa:
    "Decision-support guidance, not legal advice. Visa rules and financial-proof amounts change without notice. Always verify current requirements with the relevant consulate or licensed immigration counsel before applying.",
  "english-test":
    "Exam-style practice based on published test structures. Not affiliated with, endorsed by, or licensed under IELTS, ETS (TOEFL), Pearson (PTE), or Duolingo. AI scoring is a directional estimate — final scores are decided only by the official test provider.",
  shortlist:
    "AI-generated shortlist based on your inputs. Match scores are decision-support estimates, not admission predictions. Always verify fees, deadlines and entry requirements directly with each university.",
  scholarship:
    "Scholarship eligibility, amounts and deadlines change by university, intake and applicant profile. Confirm current rules from the official university page before applying.",
};

interface DecisionDisclaimerProps {
  variant: Variant;
  className?: string;
}

/**
 * Small in-context disclaimer for tools that produce decision-support
 * estimates. Each variant carries the regulator-friendly wording for
 * one tool family (ROI, visa, English-test, shortlist, scholarships).
 *
 * Footer-only disclaimers are too far from the claim. This sits next to
 * the actual output so users see the limitation in the same eye-line as
 * the number that needs the caveat.
 */
export default function DecisionDisclaimer({ variant, className }: DecisionDisclaimerProps) {
  return (
    <div
      role="note"
      className={
        className ??
        "flex items-start gap-2.5 text-[11px] leading-relaxed text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5"
      }
    >
      <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <span>{COPY[variant]}</span>
    </div>
  );
}
