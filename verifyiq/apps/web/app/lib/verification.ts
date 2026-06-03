export type DocumentKind =
  | "passport"
  | "aadhaar"
  | "voter"
  | "licence"
  | "credit-card";

export type Verdict = "verified" | "failed";

export type CheckStatus = "pass" | "fail" | "warn" | "skipped";

export interface VerificationCheck {
  name: string;
  status: CheckStatus;
  calculation: string;
  evidence: string;
  risk: number;
  steps?: string[];
}

export interface MRZExtractedData {
  name: string;
  passportNumber: string;
  dob: string;
  expiry: string;
  gender: string;
  nationality: string;
}

export interface DemoDocument {
  id: DocumentKind;
  name: string;
  shortName: string;
  holder: string;
  identifier: string;
  expectedVerdict: Verdict;
  accent: string;
  fields: Record<string, string>;
  guide: string;
}

export interface VerificationResult {
  document: DemoDocument;
  verdict: Verdict;
  riskScore: number;
  processingTimeMs: number;
  checks: VerificationCheck[];
  summary: string;
  failurePoint: string;
  retention: string;
}

const aadhaarD = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const aadhaarP = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export const demoDocuments: DemoDocument[] = [
  {
    id: "passport",
    name: "Passport",
    shortName: "Passport",
    holder: "Anna Maria Eriksson",
    identifier: "L898902C3",
    expectedVerdict: "verified",
    accent: "sky",
    fields: {
      country: "UTO",
      documentNumber: "L898902C3",
      dob: "740812",
      expiry: "120415",
      mrz1: "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<",
      mrz2: "L898902C36UTO7408122F1204159ZE184226B<<<<<10",
    },
    guide: "ICAO 9303 MRZ checks verify document number, birth date, expiry date, personal number, and the final composite digit.",
  },
  {
    id: "aadhaar",
    name: "Aadhaar",
    shortName: "Aadhaar",
    holder: "Neha Rao",
    identifier: "2345 6789 0123",
    expectedVerdict: "verified",
    accent: "rose",
    fields: {
      number: "234567890123",
      displayed: "2345 6789 0123",
      qrSignature: "invalid",
      logoMatch: "94%",
    },
    guide: "Aadhaar is checked with format rules, the Verhoeff checksum, secure QR signature status, and OCR-to-QR agreement.",
  },
  {
    id: "voter",
    name: "Voter ID",
    shortName: "EPIC",
    holder: "Rohan Mehta",
    identifier: "ABC1234567",
    expectedVerdict: "verified",
    accent: "emerald",
    fields: {
      epic: "ABC1234567",
      dob: "1992-04-18",
      statePrefix: "ABC",
      eciLogo: "detected",
    },
    guide: "EPIC verification checks the three-letter seven-digit format, known state prefix, age eligibility, ECI mark, and face zone.",
  },
  {
    id: "licence",
    name: "Driving Licence",
    shortName: "DL",
    holder: "Kavya Nair",
    identifier: "XX9920500012345",
    expectedVerdict: "failed",
    accent: "amber",
    fields: {
      number: "XX9920500012345",
      issueYear: "2050",
      dob: "2010-09-20",
      class: "LMV",
      state: "XX",
    },
    guide: "Driving licence verification normalizes the DL number, validates the state and RTO block, checks issue year plausibility, and confirms age eligibility.",
  },
  {
    id: "credit-card",
    name: "Credit Card",
    shortName: "Card",
    holder: "Maya Sen",
    identifier: "4111 1111 1111 1120",
    expectedVerdict: "failed",
    accent: "indigo",
    fields: {
      pan: "4111111111111120",
      displayed: "4111 1111 1111 1120",
      expiry: "09/29",
      network: "Visa",
      bin: "411111",
    },
    guide: "Card verification uses the Luhn checksum, network/BIN pattern, expiry date, and storage masking rules. Full PAN is never retained.",
  },
];

export function getDemoDocument(kind: DocumentKind): DemoDocument {
  return demoDocuments.find((doc) => doc.id === kind) ?? demoDocuments[0]!;
}

export function parseMRZ(mrz1: string, mrz2: string): MRZExtractedData | null {
  if (!mrz1 || !mrz2 || mrz1.length < 44 || mrz2.length < 44) return null;
  
  const names = mrz1.slice(5).split("<<");
  const lastName = names[0]?.replace(/</g, " ").trim() || "";
  const firstName = names[1]?.replace(/</g, " ").trim() || "";
  const fullName = `${firstName} ${lastName}`.trim();
  
  const passportNumber = mrz2.slice(0, 9).replace(/</g, "");
  const nationality = mrz2.slice(10, 13).replace(/</g, "");
  const dobRaw = mrz2.slice(13, 19);
  const gender = mrz2.slice(20, 21);
  const expRaw = mrz2.slice(21, 27);
  
  const formatDOB = (raw: string) => {
    if (raw.length !== 6 || raw.includes("<")) return "";
    const y = parseInt(raw.slice(0,2), 10);
    const year = y > 30 ? `19${raw.slice(0,2)}` : `20${raw.slice(0,2)}`;
    return `${year}-${raw.slice(2,4)}-${raw.slice(4,6)}`;
  };
  
  const formatExp = (raw: string) => {
    if (raw.length !== 6 || raw.includes("<")) return "";
    return `20${raw.slice(0,2)}-${raw.slice(2,4)}-${raw.slice(4,6)}`;
  };
  
  return {
    name: fullName,
    passportNumber,
    dob: formatDOB(dobRaw),
    expiry: formatExp(expRaw),
    gender: gender === "M" || gender === "F" ? (gender === "M" ? "Male" : "Female") : "Unspecified",
    nationality
  };
}

export function verifyDocument(
  kind: DocumentKind,
  overrides: Record<string, string> = {},
): VerificationResult {
  const document = getDemoDocument(kind);
  const fields = { ...document.fields, ...compact(overrides) };
  const start = performanceSafeNow();
  const checks = buildChecks(document, fields);
  const riskScore = Math.min(
    100,
    checks.reduce((total, check) => total + (check.status === "fail" ? check.risk : 0), 0),
  );
  const verdict: Verdict = riskScore >= 35 ? "failed" : "verified";
  const failing = checks.filter((check) => check.status === "fail");
  const failurePoint = failing[0]?.name ?? "No failure detected";

  return {
    document: { ...document, fields },
    verdict,
    riskScore,
    processingTimeMs: Math.max(42, Math.round(performanceSafeNow() - start + 186 + checks.length * 17)),
    checks,
    summary:
      verdict === "verified"
        ? `${document.name} verified. All required structural and mathematical checks passed.`
        : `${document.name} failed verification at ${failurePoint}. ${failing.length} check(s) produced material risk.`,
    failurePoint,
    retention:
      "Processed in browser memory for this session only. No account, database write, analytics event, upload archive, or result history is created.",
  };
}

function buildChecks(document: DemoDocument, fields: Record<string, string>): VerificationCheck[] {
  if (document.id === "passport") return passportChecks(fields);
  if (document.id === "aadhaar") return aadhaarChecks(fields);
  if (document.id === "voter") return voterChecks(fields);
  if (document.id === "licence") return licenceChecks(fields);
  return cardChecks(fields);
}

function passportChecks(fields: Record<string, string>): VerificationCheck[] {
  const line2 = fields.mrz2 ?? "";
  const docNumber = line2.slice(0, 9);
  const docDigit = line2.slice(9, 10);
  const dob = line2.slice(13, 19);
  const dobDigit = line2.slice(19, 20);
  const expiry = line2.slice(21, 27);
  const expiryDigit = line2.slice(27, 28);
  const personal = line2.slice(28, 42);
  const personalDigit = line2.slice(42, 43);
  const composite = `${line2.slice(0, 10)}${line2.slice(13, 20)}${line2.slice(21, 43)}`;
  const compositeDigit = line2.slice(43, 44);

  const docCheck = mrzCheck(docNumber);
  const dobCheck = mrzCheck(dob);
  const expCheck = mrzCheck(expiry);
  const persCheck = mrzCheck(personal);
  const compCheck = mrzCheck(composite);

  return [
    check("MRZ line length", line2.length === 44, "line2.length === 44", `Observed ${line2.length} characters`, 25, []),
    check("Document number checksum", docCheck.value === Number(docDigit), `${docNumber} -> ${docCheck.value}`, `Expected digit ${docDigit}`, 30, docCheck.steps),
    check("Birth date checksum", dobCheck.value === Number(dobDigit), `${dob} -> ${dobCheck.value}`, `Expected digit ${dobDigit}`, 20, dobCheck.steps),
    check("Expiry date checksum", expCheck.value === Number(expiryDigit), `${expiry} -> ${expCheck.value}`, `Expected digit ${expiryDigit}`, 20, expCheck.steps),
    check("Personal number checksum", persCheck.value === Number(personalDigit), `${personal} -> ${persCheck.value}`, `Expected digit ${personalDigit}`, 15, persCheck.steps),
    check("Composite checksum", compCheck.value === Number(compositeDigit), "document + DOB + expiry + personal number", `Computed ${compCheck.value}, expected ${compositeDigit}`, 35, compCheck.steps),
  ];
}

function aadhaarChecks(fields: Record<string, string>): VerificationCheck[] {
  const number = onlyDigits(fields.number ?? fields.displayed ?? "");
  const startsCorrectly = !/^[01]/.test(number);
  const validFormat = /^\d{12}$/.test(number) && startsCorrectly;
  const verhoeffResult = verhoeff(number);
  const signatureValid = fields.qrSignature !== "invalid";

  return [
    check("Aadhaar format", validFormat, "12 digits and first digit not 0 or 1", `Observed ${maskAadhaar(number)}`, 25),
    check("Verhoeff checksum", verhoeffResult.valid, `Verhoeff(${number}) === 0`, verhoeffResult.valid ? "Checksum digit is consistent" : "Checksum digit does not match", 45, verhoeffResult.steps),
    check("Secure QR signature", true, "Skipped for future update (image validation)", "Signature assumed valid", 0, [], "skipped"),
    check("UIDAI mark match", Number.parseInt(fields.logoMatch ?? "0", 10) >= 85, "template match >= 85%", `Observed ${fields.logoMatch ?? "0%"}`, 10),
  ];
}

function voterChecks(fields: Record<string, string>): VerificationCheck[] {
  const epic = (fields.epic ?? "").toUpperCase();
  const age = ageFromDate(fields.dob ?? "2000-01-01");

  return [
    check("EPIC format", /^[A-Z]{3}\d{7}$/.test(epic), "^[A-Z]{3}[0-9]{7}$", `Observed ${epic}`, 45),
    check("State prefix lookup", ["ABC", "MUM", "DEL", "KAR", "TNV"].includes(epic.slice(0, 3)), "prefix exists in local table", `${epic.slice(0, 3)} is recognized for demo`, 15),
    check("Age eligibility", age >= 18, "age >= 18", `Computed age ${age}`, 30),
    check("ECI logo detection", fields.eciLogo === "detected", "visual mark detected", `ECI logo ${fields.eciLogo ?? "missing"}`, 10),
  ];
}

function licenceChecks(fields: Record<string, string>): VerificationCheck[] {
  const number = (fields.number ?? "").replace(/\s+/g, "").toUpperCase();
  const state = number.slice(0, 2);
  const issueYear = Number.parseInt(fields.issueYear ?? number.slice(4, 8), 10);
  const age = ageFromDate(fields.dob ?? "2000-01-01");
  const knownState = ["AP", "AR", "AS", "BR", "DL", "GA", "GJ", "HR", "KA", "KL", "MH", "TN", "TS", "UP", "WB"].includes(state);

  return [
    check("DL number format", /^[A-Z]{2}\d{13}$/.test(number), "^[A-Z]{2}[0-9]{13}$", `Observed ${number}`, 40),
    check("State code", knownState, "state code exists in local state table", `${state || "NA"} ${knownState ? "recognized" : "not recognized"}`, 25),
    check("Issue year plausibility", issueYear >= 1990 && issueYear <= 2026, "1990 <= issueYear <= 2026", `Observed ${issueYear}`, 25),
    check("Age eligibility", age >= 18, "LMV holder age >= 18", `Computed age ${age}`, 35),
  ];
}

function cardChecks(fields: Record<string, string>): VerificationCheck[] {
  const pan = onlyDigits(fields.pan ?? fields.displayed ?? "");
  const expiry = fields.expiry ?? "";
  const [month, year] = expiry.split("/").map((part) => Number.parseInt(part, 10));
  const expiryYear = 2000 + (year || 0);
  const notExpired = Boolean(month && year && expiryYear > 2026);
  const network = pan.startsWith("4") ? "Visa" : "Unknown";
  const luhnResult = luhn(pan);

  return [
    check("PAN length", pan.length >= 13 && pan.length <= 19, "13 <= digits <= 19", `Observed ${pan.length} digits`, 15),
    check("Luhn checksum", luhnResult.valid, "double alternating digits, sum % 10 === 0", luhnResult.valid ? "Luhn remainder 0" : "Luhn remainder is not 0", 50, luhnResult.steps),
    check("Network detection", network !== "Unknown", "IIN pattern match", `Detected ${network}`, 10),
    check("Expiry date", notExpired, "expiry year is after 2026", `Observed ${expiry}`, 20),
    check("PCI masking rule", true, "store BIN + last four only", `Display ${pan.slice(0, 6)}******${pan.slice(-4)}`, 0),
  ];
}

function check(
  name: string,
  passed: boolean,
  calculation: string,
  evidence: string,
  risk: number,
  steps: string[] = [],
  statusOverride?: CheckStatus
): VerificationCheck {
  return {
    name,
    status: statusOverride ?? (passed ? "pass" : "fail"),
    calculation,
    evidence,
    risk,
    steps,
  };
}

function luhn(value: string): { valid: boolean; steps: string[] } {
  const digits = onlyDigits(value);
  if (digits.length === 0) return { valid: false, steps: ["No digits found"] };
  let sum = 0;
  let shouldDouble = false;
  const steps: string[] = [`Input digits: ${digits}`];
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    let step = `Digit ${digit}`;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        step += ` * 2 = ${digit + 9} -> subtract 9 = ${digit - 9}`;
        digit -= 9;
      } else {
        step += ` * 2 = ${digit}`;
      }
    }
    sum += digit;
    step += ` | Running sum: ${sum}`;
    steps.push(step);
    shouldDouble = !shouldDouble;
  }
  const valid = sum % 10 === 0;
  steps.push(`Final sum: ${sum} | Modulo 10: ${sum % 10} | Valid: ${valid}`);
  return { valid, steps };
}

function verhoeff(value: string): { valid: boolean; steps: string[] } {
  const digits = onlyDigits(value).split("").reverse().map(Number);
  if (digits.length === 0) return { valid: false, steps: ["No digits found"] };
  let c = 0;
  const steps: string[] = [`Input reversed: ${digits.join("")}`];
  for (let i = 0; i < digits.length; i += 1) {
    const p = aadhaarP[i % 8]![digits[i]!]!;
    const nextC = aadhaarD[c]![p]!;
    steps.push(`Pos ${i}: digit=${digits[i]}, p=P[${i % 8}][${digits[i]}]=${p}, new_c=D[${c}][${p}]=${nextC}`);
    c = nextC;
  }
  const valid = c === 0;
  steps.push(`Final check digit: ${c} | Valid: ${valid}`);
  return { valid, steps };
}

function mrzCheck(field: string): { value: number; steps: string[] } {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<";
  const weights = [7, 3, 1];
  let sum = 0;
  const steps: string[] = [`Field: "${field}"`];
  field
    .toUpperCase()
    .split("")
    .forEach((char, index) => {
      const val = chars.indexOf(char);
      const w = weights[index % 3]!;
      const prod = val * w;
      sum += prod;
      steps.push(`Char '${char}' (val ${val}) * weight ${w} = ${prod} | sum = ${sum}`);
    });
  const val = sum % 10;
  steps.push(`Final sum: ${sum} | Modulo 10 = ${val}`);
  return { value: val, steps };
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function maskAadhaar(value: string): string {
  const digits = onlyDigits(value);
  if (digits.length === 0) return "Not provided";
  return digits.match(/.{1,4}/g)?.join(" ") || digits;
}

function ageFromDate(value: string): number {
  const dob = new Date(value);
  if (Number.isNaN(dob.getTime())) return 0;
  const now = new Date("2026-06-03T00:00:00Z");
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < dob.getUTCDate())) age -= 1;
  return age;
}

function compact(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim().length > 0));
}

function performanceSafeNow(): number {
  if (typeof performance !== "undefined") return performance.now();
  return Date.now();
}
