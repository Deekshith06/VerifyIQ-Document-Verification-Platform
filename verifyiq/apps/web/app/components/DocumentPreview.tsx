import { DemoDocument } from "../lib/verification";

export function DocumentPreview({ document }: { document: DemoDocument }) {
  if (document.id === "passport") return <PassportPreview document={document} />;
  if (document.id === "aadhaar") return <AadhaarPreview document={document} />;
  if (document.id === "voter") return <VoterPreview document={document} />;
  if (document.id === "licence") return <LicencePreview document={document} />;
  return <CardPreview document={document} />;
}

function PassportPreview({ document }: { document: DemoDocument }) {
  return (
    <div className="document-shadow aspect-[1.42] w-full min-w-0 rounded-md border border-sky-200 bg-sky-50 p-4 flex flex-col justify-between relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <svg viewBox="0 0 100 100" className="w-16 h-16 fill-sky-800"><circle cx="50" cy="50" r="40"/></svg>
      </div>
      <div>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-sky-700">Republic of Sample</p>
            <p className="text-sm font-bold text-stone-950 tracking-tight">{document.holder}</p>
          </div>
          <div className="grid h-8 w-12 place-items-center rounded bg-white border border-sky-100 text-[10px] font-bold text-sky-700">UTO</div>
        </div>
        <div className="mt-4 flex gap-4">
          <div className="h-20 w-16 rounded bg-stone-200 border border-stone-300 flex-shrink-0 flex items-center justify-center overflow-hidden">
             <div className="w-8 h-8 rounded-full bg-stone-300 mb-4" />
          </div>
          <div className="space-y-1.5 fine-print text-[10px] text-stone-700 font-medium">
            <p className="text-stone-900"><span className="text-stone-500 text-[9px] uppercase tracking-wider block mb-0.5">Passport No</span>{document.fields.documentNumber}</p>
            <div className="grid grid-cols-2 gap-2 mt-1">
               <p><span className="text-stone-500 text-[9px] uppercase tracking-wider block mb-0.5">DOB</span>{document.fields.dob}</p>
               <p><span className="text-stone-500 text-[9px] uppercase tracking-wider block mb-0.5">Expiry</span>{document.fields.expiry}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <p className="fine-print text-[8px] sm:text-[9px] text-stone-800 break-all leading-tight font-bold opacity-80">{document.fields.mrz1}</p>
        <p className="fine-print text-[8px] sm:text-[9px] text-stone-800 break-all leading-tight font-bold opacity-80">{document.fields.mrz2}</p>
      </div>
    </div>
  );
}

function AadhaarPreview({ document }: { document: DemoDocument }) {
  return (
    <div className="document-shadow aspect-[1.58] w-full min-w-0 rounded-md border border-rose-200 bg-white p-4 flex flex-col justify-between relative overflow-hidden">
      <div>
        <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-orange-500 via-white to-emerald-600 border border-stone-100" />
        <div className="mt-4 flex gap-4">
          <div className="h-20 w-16 rounded bg-stone-200 border border-stone-300 flex-shrink-0 flex items-center justify-center overflow-hidden">
             <div className="w-8 h-8 rounded-full bg-stone-300 mb-4" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-rose-700">Government of Sample</p>
            <p className="mt-1.5 text-sm font-bold text-stone-950 tracking-tight">{document.holder}</p>
            <p className="mt-1 fine-print text-[10px] text-stone-500">DOB: 1990-01-01</p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between border-t border-stone-100 pt-2">
        <p className="fine-print text-base font-bold tracking-widest text-stone-900">{document.fields.displayed}</p>
        <div className="h-8 w-8 rounded-sm border-2 border-stone-800 bg-stone-100 flex items-center justify-center">
          <div className="w-6 h-6 border-[3px] border-dashed border-stone-800 opacity-60"></div>
        </div>
      </div>
    </div>
  );
}

function VoterPreview({ document }: { document: DemoDocument }) {
  return (
    <div className="document-shadow aspect-[1.58] w-full min-w-0 rounded-md border border-emerald-200 bg-emerald-50 p-4 flex flex-col justify-between relative overflow-hidden">
      <div className="absolute -bottom-6 -right-4 p-3 opacity-5 text-emerald-900 transform rotate-12 text-6xl font-bold">EPIC</div>
      <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
        <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-800">Election Commission</p>
        <span className="rounded bg-white px-2 py-0.5 border border-emerald-200 text-[9px] font-bold text-emerald-700">EPIC</span>
      </div>
      <div className="mt-3 flex gap-4 relative z-10">
        <div className="h-20 w-16 rounded bg-white border border-emerald-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
           <div className="w-8 h-8 rounded-full bg-stone-200 mb-4" />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-sm font-bold text-stone-950 tracking-tight">{document.holder}</p>
          <p className="mt-1 text-[10px] font-medium text-stone-600">DOB: <span className="font-bold text-stone-800">{document.fields.dob}</span></p>
          <p className="mt-2 fine-print text-sm font-bold tracking-wider text-stone-900 bg-white/60 px-2 py-1 rounded inline-block w-fit border border-emerald-100">{document.fields.epic}</p>
        </div>
      </div>
    </div>
  );
}

function LicencePreview({ document }: { document: DemoDocument }) {
  return (
    <div className="document-shadow aspect-[1.58] w-full min-w-0 rounded-md border border-amber-200 bg-amber-50/70 p-4 flex flex-col justify-between relative overflow-hidden">
      <div className="border-b border-amber-200/50 pb-1.5 flex justify-between items-end">
        <p className="text-[9px] font-bold uppercase tracking-widest text-amber-800">Union of Sample</p>
        <p className="text-[8px] font-bold uppercase text-amber-700 bg-amber-200/50 px-1.5 py-0.5 rounded">Driving Licence</p>
      </div>
      <div className="mt-3 flex gap-4">
        <div className="h-20 w-16 rounded bg-white border border-amber-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
           <div className="w-8 h-8 rounded-full bg-stone-200 mb-4" />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-sm font-bold text-stone-950 tracking-tight">{document.holder}</p>
          <p className="mt-1 fine-print text-sm font-bold tracking-wider text-stone-900">{document.fields.number}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-[9px] font-medium text-stone-600">Issued: <span className="font-bold text-stone-800">{document.fields.issueYear}</span></p>
            <p className="text-[9px] font-medium text-stone-600">Class: <span className="font-bold text-stone-800">{document.fields.class}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardPreview({ document }: { document: DemoDocument }) {
  return (
    <div className="document-shadow aspect-[1.58] w-full min-w-0 rounded-md border border-indigo-200 bg-gradient-to-br from-indigo-900 to-indigo-950 p-4 text-white flex flex-col justify-between relative overflow-hidden">
      <div className="flex items-center justify-between opacity-80">
        <p className="text-[9px] font-medium tracking-widest text-indigo-200 uppercase">Payment Card</p>
        <span className="text-sm font-black italic tracking-tighter text-indigo-100">{document.fields.network}</span>
      </div>
      <div className="mt-3 h-8 w-11 rounded border border-yellow-500/30 bg-gradient-to-br from-yellow-300 to-yellow-500 flex flex-col justify-around p-1">
        <div className="w-full h-px bg-yellow-700/20"></div>
        <div className="w-full h-px bg-yellow-700/20"></div>
        <div className="w-full h-px bg-yellow-700/20"></div>
      </div>
      <div className="mt-3">
        <p className="fine-print text-lg sm:text-xl font-bold tracking-widest text-white drop-shadow-md">{document.fields.displayed}</p>
        <div className="mt-2 flex items-end justify-between text-[10px] font-medium text-indigo-200 uppercase tracking-wider">
          <span className="truncate">{document.holder}</span>
          <span>{document.fields.expiry}</span>
        </div>
      </div>
    </div>
  );
}
