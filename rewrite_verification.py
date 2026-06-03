import re

with open("verifyiq/apps/web/app/lib/verification.ts", "r") as f:
    content = f.read()

# 1. Update VerificationCheck & add MRZExtractedData
content = content.replace(
    "export interface VerificationCheck {\n  name: string;\n  status: CheckStatus;\n  calculation: string;\n  evidence: string;\n  risk: number;\n}",
    "export interface VerificationCheck {\n  name: string;\n  status: CheckStatus;\n  calculation: string;\n  evidence: string;\n  risk: number;\n  steps?: string[];\n}\n\nexport interface MRZExtractedData {\n  name: string;\n  passportNumber: string;\n  dob: string;\n  expiry: string;\n  gender: string;\n  nationality: string;\n}"
)

# 2. Add parseMRZ after getDemoDocument
parse_mrz_func = """
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
"""
content = content.replace(
    "export function verifyDocument",
    parse_mrz_func + "\nexport function verifyDocument"
)

# 3. Update passportChecks
passport_checks = """function passportChecks(fields: Record<string, string>): VerificationCheck[] {
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
}"""
content = re.sub(r'function passportChecks\(.*?\)\s*:\s*VerificationCheck\[\] \{.*?(?=function aadhaarChecks)', passport_checks + "\n\n", content, flags=re.DOTALL)

# 4. Update aadhaarChecks
aadhaar_checks = """function aadhaarChecks(fields: Record<string, string>): VerificationCheck[] {
  const number = onlyDigits(fields.number ?? fields.displayed ?? "");
  const startsCorrectly = !/^[01]/.test(number);
  const validFormat = /^\d{12}$/.test(number) && startsCorrectly;
  const verhoeffResult = verhoeff(number);
  const signatureValid = fields.qrSignature !== "invalid";

  return [
    check("Aadhaar format", validFormat, "12 digits and first digit not 0 or 1", `Observed ${maskAadhaar(number)}`, 25),
    check("Verhoeff checksum", verhoeffResult.valid, `Verhoeff(${number}) === 0`, verhoeffResult.valid ? "Checksum digit is consistent" : "Checksum digit does not match", 45, verhoeffResult.steps),
    check("Secure QR signature", signatureValid, "RSA/ECDSA payload signature status", signatureValid ? "Signature valid" : "Signature invalid in sample payload", 55),
    check("UIDAI mark match", Number.parseInt(fields.logoMatch ?? "0", 10) >= 85, "template match >= 85%", `Observed ${fields.logoMatch ?? "0%"}`, 10),
  ];
}"""
content = re.sub(r'function aadhaarChecks\(.*?\)\s*:\s*VerificationCheck\[\] \{.*?(?=function voterChecks)', aadhaar_checks + "\n\n", content, flags=re.DOTALL)

# 5. Update cardChecks
card_checks = """function cardChecks(fields: Record<string, string>): VerificationCheck[] {
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
}"""
content = re.sub(r'function cardChecks\(.*?\)\s*:\s*VerificationCheck\[\] \{.*?(?=function check\()', card_checks + "\n\n", content, flags=re.DOTALL)

# 6. Update check signature
check_func = """function check(
  name: string,
  passed: boolean,
  calculation: string,
  evidence: string,
  risk: number,
  steps: string[] = []
): VerificationCheck {
  return {
    name,
    status: passed ? "pass" : "fail",
    calculation,
    evidence,
    risk,
    steps,
  };
}"""
content = re.sub(r'function check\(.*?\}', check_func, content, flags=re.DOTALL)

# 7. Update luhn
luhn_func = """function luhn(value: string): { valid: boolean; steps: string[] } {
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
}"""
content = re.sub(r'function luhn\(.*?\}', luhn_func, content, flags=re.DOTALL)

# 8. Update verhoeff
verhoeff_func = """function verhoeff(value: string): { valid: boolean; steps: string[] } {
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
}"""
content = re.sub(r'function verhoeff\(.*?\}', verhoeff_func, content, flags=re.DOTALL)

# 9. Update mrzCheck
mrz_func = """function mrzCheck(field: string): { value: number; steps: string[] } {
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
}"""
content = re.sub(r'function mrzCheck\(.*?\}', mrz_func, content, flags=re.DOTALL)

# 10. Update maskAadhaar
mask_aadhaar = """function maskAadhaar(value: string): string {
  const digits = onlyDigits(value);
  if (digits.length === 0) return "Not provided";
  return digits.match(/.{1,4}/g)?.join(" ") || digits;
}"""
content = re.sub(r'function maskAadhaar\(.*?\}', mask_aadhaar, content, flags=re.DOTALL)

with open("verifyiq/apps/web/app/lib/verification.ts", "w") as f:
    f.write(content)
