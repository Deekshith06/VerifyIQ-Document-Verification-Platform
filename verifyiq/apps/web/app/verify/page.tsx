import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { demoDocuments } from "../lib/verification";

export default function VerifyIndexPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-stone-900" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
          What would you like to verify?
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-stone-600">
          Select a document type below to open its dedicated manual verification form. 
          No data is saved or retained.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {demoDocuments.map((document) => (
          <Link
            key={document.id}
            href={`/verify/${document.id}`}
            className="group relative flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-stone-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-600 group-hover:bg-stone-900 group-hover:text-white transition-colors">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-stone-900">{document.name}</h3>
              <p className="mt-2 text-sm text-stone-500">
                Verify {document.name.toLowerCase()} using deterministic rules and mathematical checks.
              </p>
            </div>
            <div className="mt-6 flex items-center text-sm font-semibold text-stone-900 group-hover:text-stone-700">
              Open verify form <span aria-hidden="true" className="ml-1 transition-transform group-hover:translate-x-1">&rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
