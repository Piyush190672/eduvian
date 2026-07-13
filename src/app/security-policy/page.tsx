import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Disclosure Policy · EduvianAI",
  description:
    "How to responsibly report security vulnerabilities to EduvianAI. Linked from /.well-known/security.txt per RFC 9116.",
};

// Plain content page — no auth gate, no PII surface. Lives at /security-policy
// because the canonical security.txt at /.well-known/security.txt names this
// path as its Policy URL. Keep it copy-only; no forms.

export default function SecurityPolicyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/40 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-block text-sm text-blue-900 hover:text-blue-900 mb-6"
        >
          ← Back to home
        </Link>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Security disclosure policy
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Last updated 12 May 2026 · Linked from{" "}
          <code className="text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded">
            /.well-known/security.txt
          </code>{" "}
          (RFC 9116)
        </p>

        <section className="prose prose-slate max-w-none">
          <h2>How to report a vulnerability</h2>
          <p>
            Email{" "}
            <a href="mailto:security@eduvianai.com" className="text-blue-800 hover:text-blue-950 font-semibold">
              security@eduvianai.com
            </a>
            {" "}with a clear description, reproduction steps, the URL(s) affected,
            and your assessment of the impact. We aim to acknowledge every
            report within 3 business days.
          </p>

          <h2>What we ask</h2>
          <ul>
            <li>
              Give us <strong>90 days</strong> from initial report to remediate
              before public disclosure. We will keep you updated on progress
              and credit you when the fix lands (with your permission).
            </li>
            <li>
              Stick to the in-scope assets below. Do not attempt to access,
              modify, or destroy data belonging to other users.
            </li>
            <li>
              Avoid heavy load testing, scraping, or anything that would
              degrade service for legitimate users. If your test needs more
              than a handful of requests to confirm, email first.
            </li>
            <li>
              Do not run social-engineering attacks against our team, partners,
              or contractors.
            </li>
          </ul>

          <h2>In scope</h2>
          <ul>
            <li>
              <code>https://www.eduvianai.com</code> and any{" "}
              <code>*.eduvianai.com</code> subdomain we operate
            </li>
            <li>
              Authentication flows (OTP register / login, admin TOTP MFA,
              session cookies)
            </li>
            <li>
              API routes under <code>/api/*</code> including AI tool endpoints
              and admin routes
            </li>
            <li>
              The verification + extraction pipelines that build{" "}
              <code>src/data/programs.ts</code>
            </li>
          </ul>

          <h2>Out of scope</h2>
          <ul>
            <li>
              Third-party services we use: Supabase Cloud, Vercel, Anthropic
              API, Resend, Upstash, Sentry. Please report vulnerabilities in
              those platforms directly to the respective vendor.
            </li>
            <li>
              Reports based solely on the output of automated scanners (e.g.,
              missing security headers on pages that don&apos;t need them, weak
              TLS ciphers on Vercel-managed certificates) unless you can
              demonstrate an exploitable impact.
            </li>
            <li>
              Self-XSS or attacks requiring physical access to a user&apos;s
              unlocked device.
            </li>
            <li>
              Findings already documented in our internal audit register that
              we are actively remediating.
            </li>
          </ul>

          <h2>What you can expect from us</h2>
          <ol>
            <li>Acknowledgement within 3 business days.</li>
            <li>
              An initial severity assessment + remediation plan within 10
              business days for confirmed reports.
            </li>
            <li>
              Status updates at least every 14 days while a fix is in flight.
            </li>
            <li>
              Public credit (researcher name / handle linked from the deploy
              note) once the fix ships, if you want it.
            </li>
            <li>
              No legal action against good-faith researchers who follow this
              policy.
            </li>
          </ol>

          <h2>Bug bounty</h2>
          <p>
            We do not currently run a paid bug bounty programme. We are still
            in beta. We do maintain a researcher acknowledgement list and
            will add a structured programme as we move out of beta — drop us
            a line if you&apos;d like to be the first contact for the
            launch round.
          </p>

          <h2>Encrypted disclosure</h2>
          <p>
            We do not publish a PGP key yet. If you need to send a sensitive
            attachment, email us first and we will share a one-time secure
            link.
          </p>
        </section>
      </div>
    </main>
  );
}
