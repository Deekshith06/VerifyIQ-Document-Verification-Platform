"use client";

import Link from "next/link";
import {
  ArrowRight,
  Cpu,
  FileText,
  FileUp,
  ShieldCheck,
  Trash2,
  Upload,
  FileCode2,
} from "lucide-react";
import {
  demoDocuments,
} from "../lib/verification";
import { DocumentPreview } from "../components/DocumentPreview";


export default function DashboardPage() {

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-stone-600 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Anonymous verification workspace
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl lg:text-6xl">
            Verify instantly.<br />
            <span className="text-stone-400">Keep nothing.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            VerifyIQ runs document checks entirely in session memory and returns the complete reasoning trail.
            There are no accounts, saved histories, retained uploads, or hidden scoring steps.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="group relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start gap-4 relative z-10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 border border-emerald-200 shadow-inner">
                <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-stone-950">Zero-retention session</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
                  All data is entered manually and processed locally in your browser's session memory. No information is sent to external servers, ensuring absolute zero retention of sensitive PII.
                </p>
              </div>
            </div>
            <div className="absolute -right-4 -top-4 opacity-[0.03] transition-transform group-hover:scale-110">
              <ShieldCheck className="h-32 w-32 text-emerald-900" />
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 p-6 shadow-lg transition-shadow hover:shadow-xl">
            <div className="flex items-start gap-4 relative z-10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-800 border border-stone-700 shadow-inner">
                <FileCode2 className="h-5 w-5 text-indigo-400" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Logic Source Included</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-400">
                  We believe in transparency. View our full verification algorithms in the <Link href="/logic" className="font-medium text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-500/30 transition-colors">Logic Source</Link> section. The math logic is provided as standalone, runnable <strong className="text-stone-200">Node.js (JavaScript)</strong> scripts.
                </p>
              </div>
            </div>
            <div className="absolute -right-4 -top-4 opacity-[0.05] transition-transform group-hover:-rotate-6 group-hover:scale-110">
              <FileCode2 className="h-32 w-32 text-white" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between relative z-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-stone-950">Verification Workflow</h2>
            <p className="mt-2 text-base text-stone-500">Transparent, stateless, and mathematically proven.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/logic"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition-colors hover:bg-white hover:text-stone-950 hover:border-stone-300"
            >
              <FileCode2 className="h-4 w-4 text-indigo-600" aria-hidden="true" />
              View logic
            </Link>
            <Link
              href="/verify"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-stone-800 hover:shadow-lg hover:-translate-y-0.5"
            >
              <FileUp className="h-4 w-4" aria-hidden="true" />
              Open verifier
            </Link>
          </div>
        </div>

        <div className="relative z-10 grid gap-8 md:grid-cols-5">
          <div className="absolute top-7 left-14 w-[calc(100%-7rem)] h-[2px] bg-stone-100 hidden md:block"></div>
          {[
            { title: "Select", icon: FileText, text: "Pick document. Uploads are disabled for security.", color: "text-stone-600", bg: "bg-stone-100" },
            { title: "Run checks", icon: Cpu, text: "Formatting & rules execute locally in memory.", color: "text-indigo-600", bg: "bg-indigo-100" },
            { title: "Inspect logic", icon: FileCode2, text: "View transparent Node.js verification scripts.", color: "text-emerald-600", bg: "bg-emerald-100" },
            { title: "Read result", icon: FileText, text: "View clear pass/fail rows and risk evidence.", color: "text-sky-600", bg: "bg-sky-100" },
            { title: "Clear session", icon: Trash2, text: "Close tab to permanently erase all local data.", color: "text-red-600", bg: "bg-red-100" },
          ].map((step, index) => (
            <div key={step.title} className="relative flex flex-col group">
              <div className={`relative z-10 mb-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${step.bg} border-4 border-white shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md`}>
                <step.icon className={`h-6 w-6 ${step.color}`} aria-hidden="true" />
                <div className="absolute -right-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-stone-950 text-[10px] font-bold text-white shadow-sm">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-lg font-bold text-stone-950 group-hover:text-stone-700 transition-colors">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 mb-12 relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between relative z-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-stone-950">Sample Documents</h2>
            <p className="mt-2 text-base text-stone-500">Realistic representations of supported documents and their original aspect ratios.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5 relative z-10">
          {demoDocuments.map((document) => (
            <div
              key={document.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-stone-400"
            >
              <Link href={`/verify/${document.id}`} className="block bg-stone-50/50 p-5 overflow-hidden">
                <div 
                  className="w-full relative" 
                  style={{ paddingTop: document.id === 'passport' ? '70.42%' : '63.29%' }}
                >
                  <div className="absolute top-0 left-0 w-[200%] origin-top-left scale-50">
                    <DocumentPreview document={document} />
                  </div>
                </div>
              </Link>
              <div className="flex items-center justify-between border-t border-stone-100 bg-white px-5 py-4">
                <Link href={`/verify/${document.id}`} className="block">
                  <p className="font-semibold text-stone-950 transition-colors">{document.name}</p>
                  <p className="mt-0.5 text-xs font-medium text-stone-500">{document.identifier}</p>
                </Link>
                <Link
                  href={`/verify/${document.id}`}
                  className="flex items-center gap-1 rounded-full bg-stone-100 px-3.5 py-1.5 text-xs font-bold text-stone-600 transition-all duration-200 group-hover:bg-stone-950 group-hover:text-white group-hover:shadow-md"
                >
                  Verify <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


