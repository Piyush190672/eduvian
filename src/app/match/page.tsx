import { redirect } from "next/navigation";

// /match is the homepage's match-flow CTA target. Real flow lives at /get-started.
// Kept as a redirect alias so the homepage can use the brand-locked /match URL
// without disrupting the existing /get-started route or its inbound links.
export default function MatchAlias() {
  redirect("/get-started");
}
