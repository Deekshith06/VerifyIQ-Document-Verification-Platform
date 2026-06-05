import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "VerifyIQ - Stateless Document Verification",
  description:
    "Anonymous document verification demos with transparent calculations and zero data retention.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-stone-50 select-none antialiased">
        <div className="bg-emerald-600 px-4 py-2 text-center text-[13px] font-semibold tracking-wide text-white flex items-center justify-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          100% SECURE & STATELESS: All verifications run locally in your browser. No data is uploaded or saved.
        </div>
        <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/92 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-stone-950 text-sm font-semibold text-white">
                VI
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold tracking-tight text-stone-950">VerifyIQ</span>
                <span className="block text-xs text-stone-500">Stateless verifier</span>
              </span>
            </Link>

            <nav className="ml-auto flex items-center gap-1 text-sm font-medium text-stone-600">
              <Link href="/dashboard" className="rounded-md px-3 py-2 hover:bg-stone-100 hover:text-stone-950">
                Dashboard
              </Link>
              <Link href="/logic" className="rounded-md px-3 py-2 hover:bg-stone-100 hover:text-stone-950">
                Logic Source
              </Link>
              
              <div className="group relative">
                <Link href="/verify" className="inline-flex items-center gap-1 rounded-md px-3 py-2 hover:bg-stone-100 hover:text-stone-950">
                  Verify
                  <svg className="h-4 w-4 text-stone-400 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </Link>
                
                <div className="invisible absolute right-0 top-full z-50 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  <div className="w-screen max-w-md rounded-xl border border-stone-200 bg-white p-4 shadow-xl">
                    <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-stone-500">Test Documents</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/verify/credit-card" className="flex items-center gap-3 rounded-lg p-2 hover:bg-stone-50 transition-colors">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-indigo-100 bg-indigo-50 text-indigo-600"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg></div>
                        <div><p className="text-sm font-semibold text-stone-900">Credit / Debit Card</p></div>
                      </Link>
                      <Link href="/verify/passport" className="flex items-center gap-3 rounded-lg p-2 hover:bg-stone-50 transition-colors">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-sky-100 bg-sky-50 text-sky-600"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg></div>
                        <div><p className="text-sm font-semibold text-stone-900">Passport</p></div>
                      </Link>
                      <Link href="/verify/aadhaar" className="flex items-center gap-3 rounded-lg p-2 hover:bg-stone-50 transition-colors">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-rose-100 bg-rose-50 text-rose-600"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" /></svg></div>
                        <div><p className="text-sm font-semibold text-stone-900">Aadhaar</p></div>
                      </Link>
                      <Link href="/verify/voter" className="flex items-center gap-3 rounded-lg p-2 hover:bg-stone-50 transition-colors">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-emerald-100 bg-emerald-50 text-emerald-600"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
                        <div><p className="text-sm font-semibold text-stone-900">Voter ID</p></div>
                      </Link>
                      <Link href="/verify/licence" className="flex items-center gap-3 rounded-lg p-2 hover:bg-stone-50 transition-colors">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-amber-100 bg-amber-50 text-amber-600"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg></div>
                        <div><p className="text-sm font-semibold text-stone-900">Licence</p></div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </header>

        <main className="min-h-[calc(100vh-64px)]">{children}</main>
      </body>
    </html>
  );
}
