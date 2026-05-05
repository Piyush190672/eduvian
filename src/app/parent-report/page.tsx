import { redirect } from "next/navigation";

// /parent-report is the homepage's family-decision CTA target. Real flow
// lives at /parent-decision. Alias preserves the brand-locked URL while
// existing inbound links to /parent-decision keep working.
export default function ParentReportAlias() {
  redirect("/parent-decision");
}
