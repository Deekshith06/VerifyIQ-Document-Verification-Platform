"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  FileUp,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  DocumentKind,
  VerificationResult,
  demoDocuments,
  getDemoDocument,
  verifyDocument,
  parseMRZ,
} from "../../lib/verification";

const fieldConfig: Record<DocumentKind, Array<{ key: string; label: string; placeholder: string }>> = {
  passport: [
    { key: "mrz1", label: "MRZ line 1", placeholder: "P<UTO..." },
    { key: "mrz2", label: "MRZ line 2", placeholder: "L898902C36..." },
  ],
  aadhaar: [
    { key: "number", label: "Aadhaar Number", placeholder: "1234 5678 9012" },
  ],
  voter: [
    { key: "epic", label: "EPIC number", placeholder: "ABC1234567" },
    { key: "dob", label: "Date of birth", placeholder: "1992-04-18" },
    { key: "eciLogo", label: "ECI logo", placeholder: "detected" },
  ],
  licence: [
    { key: "number", label: "DL number", placeholder: "KA0520120012345" },
    { key: "dob", label: "Date of birth", placeholder: "1990-09-20" },
    { key: "issueYear", label: "Issue year", placeholder: "2012" },
  ],
  "credit-card": [
    { key: "displayed", label: "Card number", placeholder: "4111 1111 1111 1111" },
    { key: "expiry", label: "Expiry", placeholder: "09/29" },
    { key: "network", label: "Network", placeholder: "Visa" },
  ],
};

export default function VerifyTypePage({ params }: { params: { type: string } }) {
  const documentKind = params.type as DocumentKind;
  const [manualFields, setManualFields] = useState<Record<string, string>>({});
  const [result, setResult] = useState<VerificationResult | null>(null);
  
  const selectedDocument = useMemo(() => getDemoDocument(documentKind), [documentKind]);
  const extractedData = useMemo(() => documentKind === 'passport' ? parseMRZ(manualFields.mrz1 || "", manualFields.mrz2 || "") : null, [manualFields, documentKind]);

  useEffect(() => {
    setManualFields({});
    setResult(null);
  }, [documentKind]);

  if (!demoDocuments.some((document) => document.id === documentKind)) {
    return (
      <div className="mx-auto mt-20 max-w-md text-center">
        <h2 className="text-xl font-semibold text-stone-900">Document not found</h2>
        <p className="mt-2 text-stone-500">The requested document type does not exist.</p>
      </div>
    );
  }

  function updateManualField(key: string, value: string) {
    setManualFields((current) => ({ ...current, [key]: value }));
  }

  function run() {
    setResult(verifyDocument(documentKind, manualFields));
  }

  function clearSession() {
    setManualFields({});
    setResult(null);
  }

  const screenTone = result?.verdict === "verified" ? "bg-emerald-50 border-emerald-200" : result?.verdict === "failed" ? "bg-red-50 border-red-200" : "bg-white border-stone-200";

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
      <section className="h-fit rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 h-5 w-5 text-stone-800" aria-hidden="true" />
          <div>
            <h1 className="text-xl font-semibold text-stone-950">Verify {selectedDocument.name}</h1>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Enter manual fields or extract live data. Nothing is uploaded or saved.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-sm font-semibold text-stone-800">Manual input & extraction</p>
          <div className="mt-3 space-y-3">
            {fieldConfig[documentKind].map((field) => (
              <label key={field.key} className="block">
                <span className="text-xs font-semibold text-stone-600">{field.label}</span>
                <input
                  value={manualFields[field.key] ?? ""}
                  onChange={(event) => updateManualField(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-950 outline-none transition-colors focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
                />
              </label>
            ))}
          </div>
          {extractedData && (
            <div className="mt-4 rounded-lg bg-indigo-50 border border-indigo-100 p-4 shadow-inner">
               <h4 className="text-sm font-semibold text-indigo-900 mb-2">Live Extraction (MRZ)</h4>
               <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-indigo-800">
                 <p><strong className="font-semibold">Name:</strong> {extractedData.name}</p>
                 <p><strong className="font-semibold">Passport No:</strong> {extractedData.passportNumber}</p>
                 <p><strong className="font-semibold">DOB:</strong> {extractedData.dob}</p>
                 <p><strong className="font-semibold">Expiry:</strong> {extractedData.expiry}</p>
                 <p><strong className="font-semibold">Gender:</strong> {extractedData.gender}</p>
                 <p><strong className="font-semibold">Nationality:</strong> {extractedData.nationality}</p>
               </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-stone-800">Local file</p>
          <div className="mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50 p-6 text-center cursor-not-allowed opacity-75">
            <FileUp className="h-6 w-6 text-stone-400" aria-hidden="true" />
            <span className="mt-2 text-sm font-semibold text-stone-900">Upload & Extract</span>
            <span className="mt-1 text-xs text-stone-500">Offline AI models are currently disabled. This feature is coming soon.</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={run}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Verify
          </button>
          <button
            type="button"
            onClick={clearSession}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear
          </button>
        </div>
      </section>

      <section className={`rounded-xl border p-5 shadow-sm sm:p-6 transition-colors duration-300 ${screenTone}`}>
        {!result ? (
          <div className="grid min-h-[620px] place-items-center rounded-lg border border-dashed border-stone-300 bg-white/70 p-8 text-center backdrop-blur-sm">
            <div>
              <FileUp className="mx-auto h-10 w-10 text-stone-400" aria-hidden="true" />
              <h2 className="mt-4 text-2xl font-semibold text-stone-950">Results appear here</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-600">
                Run a manual check to see the exact calculations, failed step, risk score, and retention status.
              </p>
            </div>
          </div>
        ) : (
          <ResultView result={result} />
        )}
      </section>
    </div>
  );
}

function ResultView({ result }: { result: VerificationResult }) {
  const verified = result.verdict === "verified";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Verification result</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
            {result.document.name}: {verified ? "Verified" : "Failed"}
          </h2>
          <p className="mt-2 fine-print text-sm text-stone-700">
            {result.document.holder} - {result.document.identifier}
          </p>
        </div>
        <div className={`rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm ${verified ? "bg-emerald-600" : "bg-red-600"}`}>
          {verified ? "Original" : "Fake"}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Metric label="Status" value={verified ? "Original" : "Fake"} />
        <Metric label="Processing time" value={`${result.processingTimeMs}ms`} />
        <Metric label="Failure point" value={result.failurePoint} />
      </div>

      <div className="mt-5 rounded-lg bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-stone-950">Reasoning</h3>
        <p className="mt-2 text-sm leading-6 text-stone-700">{result.summary}</p>
        <p className="mt-3 rounded-md border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-700">
          {result.retention}
        </p>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.15fr_1.15fr_0.8fr_92px] border-b border-stone-200 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
          <span>Check</span>
          <span>Calculation</span>
          <span>Evidence</span>
          <span className="text-right">Result</span>
        </div>
        <div>
          {result.checks.map((check) => (
            <div key={check.name} className="flex flex-col border-b border-stone-100 last:border-b-0 transition-colors hover:bg-stone-50/50">
              <div className="grid grid-cols-1 gap-2 px-4 py-4 md:grid-cols-[1.15fr_1.15fr_0.8fr_92px] md:items-start">
                <div className="flex items-start gap-2">
                  {check.status === "pass" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  ) : check.status === "skipped" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
                  ) : (
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                  )}
                  <span className="text-sm font-semibold text-stone-950">{check.name}</span>
                </div>
                <p className="fine-print text-xs leading-5 text-stone-700">{check.calculation}</p>
                <p className="text-xs leading-5 text-stone-600">{check.evidence}</p>
                <div className="text-left md:text-right">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    check.status === "pass" ? "bg-emerald-100 text-emerald-700" : 
                    check.status === "skipped" ? "bg-stone-100 text-stone-600" : "bg-red-100 text-red-700"
                  }`}>
                    {check.status === "pass" ? "PASS" : check.status === "skipped" ? "SKIPPED" : "FAIL"}
                  </span>
                </div>
              </div>
              {check.steps && check.steps.length > 0 && (
                <div className="px-4 pb-4 pt-1">
                  <div className="rounded-md bg-stone-50 border border-stone-200 p-3 shadow-inner">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 mb-2">Step-by-step trace</p>
                    <ul className="space-y-1">
                      {check.steps.map((step, idx) => (
                        <li key={idx} className="text-xs text-stone-600 fine-print">{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm border border-stone-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-stone-950">{value}</p>
    </div>
  );
}
