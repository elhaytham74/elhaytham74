import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Warfarin Dosing — Clinician Console (Demo)",
  description: "Guideline-based warfarin dose adjustment decision support — clinician review console.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <a href="/" className="font-semibold text-brand-700">
              Warfarin Dosing Console <span className="text-xs font-normal text-slate-400">(demo)</span>
            </a>
            <span className="rounded-full bg-urgent-50 px-3 py-1 text-xs font-medium text-urgent-700">
              Clinical decision support only — not a substitute for clinical judgment
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
