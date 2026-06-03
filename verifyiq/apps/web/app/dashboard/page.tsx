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
} from "lucide-react";
import {
  demoDocuments,
} from "../lib/verification";
import { DocumentPreview } from "../components/DocumentPreview";


export default function DashboardPage() {

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-stone-200 bg-white px-3 py-1 text-sm font-semibold text-stone-600">
            Anonymous verification workspace
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
            Verify a document, see every calculation, keep nothing afterward.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
            VerifyIQ runs document checks in session memory and returns the complete reasoning trail.
            There are no accounts, saved histories, retained uploads, or hidden scoring steps.
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 text-emerald-600" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-stone-950">Zero-retention session</h2>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Uploaded files are used only by the current browser session. Results are recalculated
                on demand and disappear on refresh or close.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-stone-950">Verification Workflow</h2>
            <p className="mt-1 text-sm text-stone-600">The entire process is designed to be readable from left to right.</p>
          </div>
          <Link
            href="/verify"
            className="inline-flex w-fit items-center gap-2 rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
          >
            <FileUp className="h-4 w-4" aria-hidden="true" />
            Open verifier
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {[
            { title: "1. Upload or choose", icon: Upload, text: "Use a local file, manual fields, or one of the visible demo documents." },
            { title: "2. Run checks", icon: Cpu, text: "Checksum, format, expiry, QR, MRZ, and cross-field rules run in memory." },
            { title: "3. Read result", icon: FileText, text: "Each pass/fail row shows the formula, evidence, and risk contribution." },
            { title: "4. Clear session", icon: Trash2, text: "No document image, number, result, account, or history is persisted." },
          ].map((step, index) => (
            <div key={step.title} className="relative rounded-lg border border-stone-200 bg-stone-50 p-4">
              <step.icon className="mb-4 h-5 w-5 text-stone-700" aria-hidden="true" />
              <h3 className="font-semibold text-stone-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">{step.text}</p>
              {index < 3 ? (
                <ArrowRight className="absolute -right-5 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-stone-300 md:block" aria-hidden="true" />
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-stone-950">Original Sample Documents</h2>
            <p className="mt-1 text-sm text-stone-600">Realistic representations of supported documents and their original aspect ratios.</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {demoDocuments.map((document) => (
            <div
              key={document.id}
              className="group flex flex-col rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md hover:border-stone-300"
            >
              <Link href={`/verify/${document.id}`} className="block">
                <DocumentPreview document={document} />
              </Link>
              <div className="mt-5 px-1 flex items-center justify-between">
                <Link href={`/verify/${document.id}`} className="block">
                  <p className="font-semibold text-stone-950 group-hover:text-stone-700">{document.name}</p>
                  <p className="mt-0.5 text-xs text-stone-500">{document.identifier}</p>
                </Link>
                <Link 
                  href={`/demo/${document.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-900 transition-colors hover:bg-stone-950 hover:text-white"
                >
                  Demo
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


