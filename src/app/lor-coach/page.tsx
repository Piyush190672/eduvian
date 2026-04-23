import { redirect } from "next/navigation";

export default function LorCoachRedirect() {
  redirect("/application-check?tab=lor");
}
