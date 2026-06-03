import { notFound } from "next/navigation";
import { CheckCircle2, CircleAlert, ArrowLeft, BookOpen, Calculator } from "lucide-react";
import Link from "next/link";
import { DocumentKind, demoDocuments, getDemoDocument, verifyDocument } from "../../lib/verification";
import { DocumentPreview } from "../../components/DocumentPreview";

export default function DemoPage({ params }: { params: { id: string } }) {
  const documentKind = params.id as DocumentKind;
  if (!demoDocuments.some((doc) => doc.id === documentKind)) {
    notFound();
  }

  const document = getDemoDocument(documentKind);
  const result = verifyDocument(documentKind);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-stone-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
      
      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        {/* Left Column: Visuals */}
        <div className="w-full lg:w-[380px] shrink-0">
          <div className="sticky top-8">
            <h1 className="text-3xl font-bold tracking-tight text-stone-950">
              {document.name} Verification
            </h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {document.guide}
            </p>
            
            <div className="mt-6">
              <DocumentPreview document={document} />
            </div>
            
            <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 shadow-sm">
              <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                What we're learning
              </h3>
              <p className="mt-2 text-sm leading-6 text-indigo-800">
                In the real world, documents like this are protected by clever mathematical formulas to prevent fraud. We'll walk through exactly how the computer calculates if this document is real or fake in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Educational Math Breakdown */}
        <div className="flex-1 space-y-6">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-stone-950 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-emerald-600" />
              Step-by-Step Math Breakdown
            </h2>
            <p className="mt-1 text-sm text-stone-500">How the algorithms check the numbers behind the scenes.</p>
          </div>
          
          {result.checks.map((check, index) => (
            <div key={check.name} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-all hover:border-stone-300">
              <div className="border-b border-stone-100 bg-stone-50/50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-sm font-bold text-white shadow-sm">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900">{check.name}</h3>
                </div>
                {check.status === "pass" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wide">
                    <CheckCircle2 className="h-4 w-4" /> Passed
                  </span>
                ) : check.status === "skipped" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-700 uppercase tracking-wide">
                    <CircleAlert className="h-4 w-4" /> Skipped
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 uppercase tracking-wide">
                    <CircleAlert className="h-4 w-4" /> Failed
                  </span>
                )}
              </div>
              
              <div className="px-6 py-5">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Goal of this check</p>
                  <p className="mt-1 text-sm font-medium text-stone-900">{check.calculation}</p>
                </div>
                
                {check.steps && check.steps.length > 0 ? (
                  <div className="rounded-xl border border-indigo-200/50 bg-[#0F172A] p-4 font-mono text-sm shadow-inner overflow-x-auto">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300">Math Terminal</span>
                    </div>
                    <ul className="space-y-2.5">
                      {check.steps.map((step, idx) => (
                        <li key={idx} className="text-indigo-100 leading-relaxed break-words whitespace-pre-wrap flex items-start gap-3">
                          <span className="text-indigo-500 select-none mt-0.5">❯</span> 
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Result</p>
                    <p className="mt-1 text-sm font-medium text-stone-700">{check.evidence}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
