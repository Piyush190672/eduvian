import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import BetaBanner from "@/components/BetaBanner";
import SecurityNoticeBanner from "@/components/SecurityNoticeBanner";
import IdleLogout from "@/components/IdleLogout";
import FloatingGetStartedButton from "@/components/FloatingGetStartedButton";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.eduvianai.com"),
  title: {
    default: "eduvianAI — Independent study-abroad intelligence",
    // Per-route titles (from each route's layout.tsx) slot into this
    // template so every page carries the brand suffix consistently.
    template: "%s | eduvianAI",
  },
  description:
    "AI-powered program recommendations for study abroad aspirants. Get matched with universities in USA, UK, Australia, Canada, and more.",
  alternates: { canonical: "/" },
  keywords: [
    "study abroad",
    "university recommendations",
    "international education",
    "USA universities",
    "UK universities",
  ],
  openGraph: {
    title: "eduvianAI — Independent study-abroad intelligence",
    description:
      "Get personalized university program matches based on your academic profile, budget, and preferences.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="antialiased min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 overflow-x-hidden">
        <BetaBanner />
        <SecurityNoticeBanner />
        <IdleLogout />
        <FloatingGetStartedButton />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: "12px",
              background: "#1e1b4b",
              color: "#fff",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
