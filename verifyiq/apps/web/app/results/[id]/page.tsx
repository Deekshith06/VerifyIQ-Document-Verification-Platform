import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleAlert } from "lucide-react";
import { DocumentKind, demoDocuments, verifyDocument } from "../../lib/verification";

interface ResultsPageProps {
  params: { id: string };
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const isDemo = demoDocuments.some((document) => document.id === params.id);

  if (!isDemo) {
    return (
      <div className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-3xl place-items-center px-4 py-12">
        <section className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-semibold text-stone-950">No retained result</h1>
          <p className="mt-3 text-stone-600">
            VerifyIQ does not store session results by ID. If the browser session was closed or refreshed,
            the document data and reasoning trail have been cleared.
          </p>
          <Link
            href="/verify"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Run a new verification
          </Link>
        </section>
      </div>
    );
  }

  const result = verifyDocument(params.id as DocumentKind);
  const verified = result.verdict === "verified";

  return (
    <div className={`min-h-[calc(100vh-64px)] ${verified ? "bg-emerald-50" : "bg-red-50"}`}>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700 hover:text-stone-950">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to dashboard
        </Link>

        <section className="mt-6 rounded-xl border border-white/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Demo result</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-stone-950">
                {result.document.name}: {verified ? "Verified" : "Failed"}
              </h1>
              <p className="mt-2 fine-print text-stone-700">
                {result.document.holder} - {result.document.identifier}
              </p>
            </div>
            <span className={`w-fit rounded-md px-4 py-2 text-sm font-semibold text-white ${verified ? "bg-emerald-600" : "bg-red-600"}`}>
              {verified ? "Authentic" : "Not verified"}
            </span>
          </div>
          <p className="mt-5 text-sm leading-6 text-stone-700">{result.summary}</p>
          <p className="mt-3 rounded-md border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-700">
            {result.retention}
          </p>
        </section>

        <section className="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          {result.checks.map((check) => (
            <div key={check.name} className="grid gap-3 border-b border-stone-100 px-5 py-4 last:border-b-0 md:grid-cols-[220px_1fr_120px] md:items-center">
              <div className="flex items-center gap-2">
                {check.status === "pass" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                ) : (
                  <CircleAlert className="h-4 w-4 text-red-600" aria-hidden="true" />
                )}
                <span className="font-semibold text-stone-950">{check.name}</span>
              </div>
              <div>
                <p className="fine-print text-xs text-stone-700">{check.calculation}</p>
                <p className="mt-1 text-xs text-stone-500">{check.evidence}</p>
              </div>
              <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                check.status === "pass" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              }`}>
                {check.status === "pass" ? "PASS" : `FAIL +${check.risk}`}
              </span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
