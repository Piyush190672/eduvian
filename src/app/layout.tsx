import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eduvian — Your Global Future, Simplified",
  description:
    "AI-powered program recommendations for study abroad aspirants. Get matched with universities in USA, UK, Australia, Canada, and more.",
  keywords: [
    "study abroad",
    "university recommendations",
    "international education",
    "USA universities",
    "UK universities",
  ],
  openGraph: {
    title: "Eduvian — Your Global Future, Simplified",
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
    <html lang="en" className={inter.variable}>
      <body className="antialiased min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
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
