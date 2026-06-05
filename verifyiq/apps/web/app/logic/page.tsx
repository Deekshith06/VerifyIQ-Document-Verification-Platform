"use client";

import { FileCode2, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function LogicPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm mb-6">
          <FileCode2 className="h-4 w-4" /> Open Source Math
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-stone-950 sm:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-stone-900 via-indigo-900 to-stone-800 pb-2">
          Transparent Logic Source
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-600 leading-relaxed">
          We believe in complete transparency. Below are the standalone Node.js math scripts used to verify each document type locally. 
          Save them as a <code className="bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded font-mono text-sm">.js</code> file and run them in your terminal.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <CodeBlock 
          title="Credit / Debit Card (Luhn)"
          description="A complete script that prompts for a card number and verifies its validity using the Luhn algorithm."
          code={`const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

function luhn(value) {
  const digits = value.replace(/\\D/g, "");
  if (!digits) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

console.log("--- Credit / Debit Card Verification ---");
readline.question('Enter Card Number (PAN): ', pan => {
  const validLuhn = luhn(pan);
  const lengthValid = pan.replace(/\\D/g, "").length >= 13 && pan.replace(/\\D/g, "").length <= 19;
  
  console.log('\\n[Results]');
  console.log(\`Length Check (13-19): \${lengthValid ? 'PASS' : 'FAIL'}\`);
  console.log(\`Luhn Checksum: \${validLuhn ? 'PASS' : 'FAIL'}\`);
  console.log(\`Overall Status: \${lengthValid && validLuhn ? 'VERIFIED' : 'FAILED'}\`);
  readline.close();
});`}
        />

        <CodeBlock 
          title="Aadhaar (Verhoeff)"
          description="A complete script that checks Aadhaar formatting and applies the advanced Verhoeff dihedral group checksum."
          code={`const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];
const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

function verhoeff(value) {
  const digits = value.replace(/\\D/g, "").split("").reverse().map(Number);
  if (digits.length === 0) return false;
  let c = 0;
  for (let i = 0; i < digits.length; i += 1) {
    c = d[c][p[i % 8][digits[i]]];
  }
  return c === 0;
}

console.log("--- Aadhaar Verification ---");
readline.question('Enter 12-digit Aadhaar Number: ', number => {
  const cleaned = number.replace(/\\D/g, "");
  const validFormat = cleaned.length === 12 && !/^[01]/.test(cleaned);
  const validChecksum = verhoeff(number);
  
  console.log('\\n[Results]');
  console.log(\`Format Check (12 digits, no leading 0/1): \${validFormat ? 'PASS' : 'FAIL'}\`);
  console.log(\`Verhoeff Checksum: \${validChecksum ? 'PASS' : 'FAIL'}\`);
  console.log(\`Overall Status: \${validFormat && validChecksum ? 'VERIFIED' : 'FAILED'}\`);
  readline.close();
});`}
        />

        <CodeBlock 
          title="Passport (MRZ)"
          description="A standalone script that evaluates all 5 ICAO 9303 checksum digits in the bottom line of a passport MRZ."
          code={`const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

function mrzCheck(field) {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<";
  const weights = [7, 3, 1];
  let sum = 0;
  field.toUpperCase().split("").forEach((char, index) => {
    sum += chars.indexOf(char) * weights[index % 3];
  });
  return sum % 10;
}

console.log("--- Passport Verification ---");
readline.question('Enter MRZ Line 2 (exactly 44 chars): ', line2 => {
  if (line2.length !== 44) {
    console.log('Error: MRZ line 2 must be exactly 44 characters long.');
    return readline.close();
  }
  
  const docNum = line2.slice(0, 9);
  const docCheck = line2.slice(9, 10);
  const dob = line2.slice(13, 19);
  const dobCheck = line2.slice(19, 20);
  const exp = line2.slice(21, 27);
  const expCheck = line2.slice(27, 28);
  const pers = line2.slice(28, 42);
  const persCheck = line2.slice(42, 43);
  const comp = \`\${line2.slice(0, 10)}\${line2.slice(13, 20)}\${line2.slice(21, 43)}\`;
  const compCheck = line2.slice(43, 44);

  console.log('\\n[Results]');
  console.log(\`Document Checksum: \${mrzCheck(docNum) == docCheck ? 'PASS' : 'FAIL'}\`);
  console.log(\`DOB Checksum: \${mrzCheck(dob) == dobCheck ? 'PASS' : 'FAIL'}\`);
  console.log(\`Expiry Checksum: \${mrzCheck(exp) == expCheck ? 'PASS' : 'FAIL'}\`);
  console.log(\`Personal Checksum: \${mrzCheck(pers) == persCheck ? 'PASS' : 'FAIL'}\`);
  console.log(\`Composite Checksum: \${mrzCheck(comp) == compCheck ? 'PASS' : 'FAIL'}\`);
  readline.close();
});`}
        />
        
        <CodeBlock 
          title="Voter ID (EPIC)"
          description="A runnable script that checks EPIC format and validates 18+ age eligibility."
          code={`const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

function ageFromDate(dobString) {
  const dob = new Date(dobString);
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return age;
}

console.log("--- Voter ID Verification ---");
readline.question('Enter EPIC Number (e.g. ABC1234567): ', epic => {
  readline.question('Enter Date of Birth (YYYY-MM-DD): ', dob => {
    const epicUpper = epic.toUpperCase().trim();
    const validFormat = /^[A-Z]{3}\\d{7}$/.test(epicUpper);
    const age = ageFromDate(dob);
    
    console.log('\\n[Results]');
    console.log(\`EPIC Format (3 Letters + 7 Digits): \${validFormat ? 'PASS' : 'FAIL'}\`);
    console.log(\`Age Eligibility (>= 18): \${age >= 18 ? 'PASS (' + age + ' yrs)' : 'FAIL (' + age + ' yrs)'}\`);
    console.log(\`Overall Status: \${validFormat && age >= 18 ? 'VERIFIED' : 'FAILED'}\`);
    readline.close();
  });
});`}
        />

        <CodeBlock 
          title="Driving Licence"
          description="A runnable script that validates DL formatting, known state prefixes, and issue year plausibility."
          code={`const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("--- Driving Licence Verification ---");
readline.question('Enter DL Number (e.g. KA0520120012345): ', dl => {
  readline.question('Enter Issue Year (e.g. 2012): ', issue => {
    const number = dl.replace(/\\s+/g, "").toUpperCase();
    const validFormat = /^[A-Z]{2}\\d{13}$/.test(number);
    const state = number.slice(0, 2);
    const knownStates = ["AP", "AR", "AS", "BR", "DL", "GA", "GJ", "HR", "KA", "KL", "MH", "TN", "TS", "UP", "WB"];
    const validState = knownStates.includes(state);
    
    const issueYear = parseInt(issue, 10);
    const validYear = issueYear >= 1990 && issueYear <= new Date().getFullYear();
    
    console.log('\\n[Results]');
    console.log(\`DL Format (2 Letters + 13 Digits): \${validFormat ? 'PASS' : 'FAIL'}\`);
    console.log(\`State Code (\${state}): \${validState ? 'PASS' : 'WARN (Unknown State)'}\`);
    console.log(\`Issue Year Valid: \${validYear ? 'PASS' : 'FAIL'}\`);
    console.log(\`Overall Status: \${validFormat && validYear ? 'VERIFIED' : 'FAILED'}\`);
    readline.close();
  });
});`}
        />
      </div>
    </div>
  );
}

function CodeBlock({ title, description, code }: { title: string; description: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightCode = (rawCode: string) => {
    let safe = rawCode.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    safe = safe.replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, '<span class="text-emerald-300">$&</span>');
    safe = safe.replace(/\b(const|let|var|function|return|if|else|for|while|new|console|readline|process|require)\b/g, '<span class="text-pink-400 font-medium">$1</span>');
    safe = safe.replace(/\b(true|false|null|undefined)\b/g, '<span class="text-indigo-400 italic">$1</span>');
    safe = safe.replace(/\/\/.*/g, '<span class="text-stone-500 italic">$&</span>');
    return safe;
  };

  return (
    <div className="group relative flex flex-col rounded-2xl border border-stone-200 bg-white shadow-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-stone-300">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between border-b border-stone-200 bg-stone-50/80 backdrop-blur-md px-6 py-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100/50 border border-indigo-200 shadow-inner">
               <FileCode2 className="h-4 w-4 text-indigo-600" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-stone-950 text-lg tracking-wide">{title}</h3>
          </div>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed max-w-md">{description}</p>
        </div>
        <button
          onClick={handleCopy}
          className="mt-4 sm:mt-0 flex shrink-0 whitespace-nowrap h-9 items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 text-xs font-semibold text-stone-700 shadow-sm transition-all hover:bg-stone-100 hover:text-stone-950 hover:border-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-600" />
              <span className="text-emerald-700">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 text-stone-400" />
              <span>Copy snippet</span>
            </>
          )}
        </button>
      </div>

      <div className="relative z-10 flex-1 bg-[#0A0A0B] p-6 overflow-x-auto border-t border-stone-800">
        <div className="flex gap-2 mb-4 opacity-80">
           <div className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-500"></div>
           <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-500"></div>
           <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-500"></div>
        </div>
        <pre className="text-[13px] text-stone-300 font-mono leading-loose">
          <code dangerouslySetInnerHTML={{ __html: highlightCode(code) }} />
        </pre>
      </div>
    </div>
  );
}
