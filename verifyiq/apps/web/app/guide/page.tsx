import Link from "next/link";
import { ArrowRight, BookOpen, ShieldCheck } from "lucide-react";
import { demoDocuments, verifyDocument } from "../lib/verification";

export default function GuidePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex max-w-3xl items-start gap-4">
          <BookOpen className="mt-1 h-6 w-6 text-stone-800" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Verification guide</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-stone-950">
              How each document is checked
            </h1>
            <p className="mt-4 text-lg leading-8 text-stone-600">
              This guide replaces user history. VerifyIQ does not keep past sessions, so the product
              teaches the verification logic directly: what is calculated, what passes, and where a
              document fails.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-stone-950">Privacy model</h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            No login, no user table, no saved result page, no document archive, and no analytics payload
            containing document data. Refreshing the browser clears the visible result.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-900"
          >
            Try the workflow
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </aside>

        <div className="space-y-6">
          {demoDocuments.map((document) => {
            const result = verifyDocument(document.id);
            return (
              <article key={document.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">{document.shortName}</p>
                    <h2 className="mt-1 text-2xl font-semibold text-stone-950">{document.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{document.guide}</p>
                  </div>
                  <Link
                    href={`/verify?document=${document.id}`}
                    className="inline-flex w-fit items-center gap-2 rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
                  >
                    Run example
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-stone-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Example document</p>
                    <p className="mt-2 font-semibold text-stone-950">{document.holder}</p>
                    <p className="mt-1 fine-print text-sm text-stone-700">{document.identifier}</p>
                  </div>
                  <div className={`rounded-lg p-4 ${result.verdict === "verified" ? "bg-emerald-50" : "bg-red-50"}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Expected outcome</p>
                    <p className={`mt-2 font-semibold ${result.verdict === "verified" ? "text-emerald-700" : "text-red-700"}`}>
                      {result.verdict === "verified" ? "Verified / authentic" : "Failed / not authentic"}
                    </p>
                    <p className="mt-1 text-sm text-stone-700">Risk score {result.riskScore}/100</p>
                  </div>
                  <div className="rounded-lg bg-stone-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Primary reasoning</p>
                    <p className="mt-2 text-sm leading-6 text-stone-700">{result.summary}</p>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-lg border border-stone-200">
                  {result.checks.map((check) => (
                    <div key={check.name} className="grid gap-2 border-b border-stone-100 px-4 py-3 last:border-b-0 md:grid-cols-[220px_1fr_120px] md:items-center">
                      <p className="text-sm font-semibold text-stone-950">{check.name}</p>
                      <div>
                        <p className="fine-print text-xs text-stone-700">{check.calculation}</p>
                        <p className="mt-1 text-xs text-stone-500">{check.evidence}</p>
                      </div>
                      <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                        check.status === "pass" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}>
                        {check.status === "pass" ? "PASS" : "FAIL"}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
