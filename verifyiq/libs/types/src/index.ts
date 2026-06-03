// ─── VerifyIQ Shared Types ────────────────────────────────────────────────────
// libs/types/src/index.ts
// Single source of truth for ALL TypeScript interfaces across the monorepo.

// ─── Document Types ───────────────────────────────────────────────────────────

export enum DocumentType {
  CREDIT_CARD = 'CREDIT_CARD',
  PASSPORT = 'PASSPORT',
  AADHAAR = 'AADHAAR',
  VOTER_ID = 'VOTER_ID',
  DRIVING_LICENCE = 'DRIVING_LICENCE',
  PAN_CARD = 'PAN_CARD',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
}

export type VerificationStatus =
  | 'PROCESSING'
  | 'APPROVED'
  | 'REJECTED'
  | 'MANUAL_REVIEW';

export type VerdictType = 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';

export type CheckResult = 'PASS' | 'FAIL' | 'WARN' | 'N/A';

export type FraudFlagSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

// ─── Check & Flag Types ───────────────────────────────────────────────────────

export interface CheckDetail {
  /** Human-readable check name: "Luhn Checksum" */
  name: string;
  /** What the check validates */
  description: string;
  /** Outcome */
  result: CheckResult;
  /** 0.0–1.0 contribution to final risk score */
  riskContribution: number;
  /** Factual evidence: "Sum=70 mod10=0 → valid" */
  evidence: string;
  /** Optional developer-facing deep-dive */
  technicalDetail?: string;
}

export interface FraudFlag {
  flagType: string;  // LUHN_FAIL | TAMPER_DETECTED | SIGNATURE_INVALID | etc.
  severity: FraudFlagSeverity;
  confidence: number;
  description: string;
  evidence?: string;
}

export interface StageLog {
  stage: string;
  durationMs: number;
  agentUsed: string;
  output: Record<string, unknown>;
}

// ─── Fraud Reasoning ─────────────────────────────────────────────────────────

export interface RiskBreakdown {
  /** Contribution from algorithm/checksum checks */
  checksumLayer: number;
  /** Contribution from image/visual AI checks */
  visualLayer: number;
  /** Contribution from business logic checks */
  logicLayer: number;
  /** Final aggregated risk score */
  total: number;
}

export interface FraudReasoning {
  /** 1-sentence executive summary */
  summary: string;
  passingChecks: CheckDetail[];
  failingChecks: CheckDetail[];
  /** N/A or inconclusive checks */
  neutralChecks: CheckDetail[];
  /** Name of the highest-weight failing check */
  dominantFactor: string;
  /** Risk weight of the dominant factor */
  dominantFactorWeight: number;
  /** 2-3 sentence plain-English verdict rationale */
  verdictExplanation: string;
  riskBreakdown: RiskBreakdown;
}

// ─── Document-specific Extracted Fields ───────────────────────────────────────

export interface CreditCardFields {
  /** Always masked: "**** **** **** 4242" */
  maskedPan: string;
  bin: string;
  lastFour: string;
  cardholderName?: string;
  expiryMonth?: number;
  expiryYear?: number;
  network?: 'VISA' | 'MASTERCARD' | 'AMEX' | 'RUPAY' | 'UNKNOWN';
  cardType?: string;
  issuerCountry?: string;
}

export interface PassportFields {
  documentNumber: string;
  surname: string;
  givenNames: string;
  nationality: string;
  dateOfBirth: string;       // ISO 8601
  sex: 'M' | 'F' | '<';
  dateOfExpiry: string;      // ISO 8601
  personalNumber?: string;
  issuingCountry: string;
  mrzLine1?: string;
  mrzLine2?: string;
}

export interface AadhaarFields {
  /** Always masked: "XXXX XXXX 3456" */
  maskedNumber: string;
  lastFour: string;
  /** sha256(number + salt) */
  numberHash: string;
  name?: string;
  dateOfBirth?: string;
  gender?: 'M' | 'F' | 'T';
  address?: string;
  isMasked: boolean;
  qrType?: 'SECURE_QR' | 'LEGACY_QR' | 'NONE';
}

export interface VoterIdFields {
  epicNumber: string;
  holderName?: string;
  fatherOrHusbandName?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  constituency?: string;
  partNumber?: string;
  serialNumber?: string;
  inferredState?: string;
}

export interface DrivingLicenceFields {
  dlNumber: string;
  holderName?: string;
  dateOfBirth?: string;
  fatherOrHusbandName?: string;
  address?: string;
  issueDate?: string;
  validityNonTransport?: string;
  validityTransport?: string;
  vehicleClasses?: string[];
  bloodGroup?: string;
  rtoName?: string;
  stateCode?: string;
  isCurrentlyValid: boolean;
  daysUntilExpiry?: number;
  renewalRequired: boolean;
}

export type ExtractedFields =
  | CreditCardFields
  | PassportFields
  | AadhaarFields
  | VoterIdFields
  | DrivingLicenceFields;

// ─── Verification Result ─────────────────────────────────────────────────────

export interface VerificationResult {
  requestId: string;
  documentType: DocumentType;
  verdict: VerdictType;
  /** Aggregated risk score 0.0–1.0 */
  riskScore: number;
  /** Full transparency layer */
  reasoning: FraudReasoning;
  /** All individual check results keyed by check name */
  checks: Record<string, CheckDetail>;
  /** Structured extracted fields (PII-safe) */
  extractedData: ExtractedFields;
  /** Specific fraud signals */
  flags: FraudFlag[];
  /** Pipeline stage execution timeline */
  processingStages: StageLog[];
  processingTimeMs: number;
  modelVersion: string;
}

// ─── API Payload Types ────────────────────────────────────────────────────────

export interface VerifyRequest {
  documentType: DocumentType;
  /** Base64-encoded image or PDF */
  imageBase64?: string;
  /** Manual field entry (optional, used for cross-validation) */
  manualFields?: Record<string, string>;
  /** Required for Aadhaar — DPDP consent gate */
  consentToken?: string;
}

export interface VerifyResponse {
  requestId: string;
  status: VerificationStatus;
  estimatedMs?: number;
}

export interface BatchVerifyRequest {
  documents: VerifyRequest[];
}

export interface BatchVerifyResponse {
  batchId: string;
  requestIds: string[];
}

export interface DashboardStats {
  total: number;
  approved: number;
  rejected: number;
  review: number;
  avgRiskScore: number;
  timeline: Array<{ date: string; total: number; approved: number; rejected: number }>;
  documentTypeBreakdown: Array<{ type: DocumentType; count: number; percentage: number }>;
}

export interface AuditLogEntry {
  id: string;
  requestId?: string;
  event: 'SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'ACCESSED' | 'DELETED';
  actor: string;
  ipAddress: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PaginatedAuditLogs {
  items: AuditLogEntry[];
  nextCursor: string | null;
}

// ─── API Error (RFC 7807) ─────────────────────────────────────────────────────

export interface ApiError {
  type: string;           // "https://verifyiq.dev/errors/VIQ-006"
  title: string;
  status: number;
  detail: string;
  retryAfter?: number;
  requestId?: string;
}

// ─── ML Service Internal Types ────────────────────────────────────────────────

export interface ImageQualityResult {
  blurScore: number;
  resolutionOk: boolean;
  width: number;
  height: number;
  formatOk: boolean;
}

export interface FaceDetectionResult {
  detected: boolean;
  confidence: number;
  bbox?: [number, number, number, number];
  qualityScore?: number;
}

export interface TamperDetectionResult {
  tampered: boolean;
  confidence: number;
  elaScore: number;
  suspiciousRegions?: Array<[number, number, number, number]>;
}

export interface QRSignatureResult {
  signatureValid: boolean;
  qrType: 'SECURE_QR' | 'LEGACY_QR' | 'NONE';
  issuer?: string;
  payloadData?: Record<string, unknown>;
  error?: string;
}

// ─── Verdict Threshold Constants ─────────────────────────────────────────────

export const VERDICT_THRESHOLDS = {
  APPROVED: 0.35,       // < 0.35 → APPROVED
  MANUAL_REVIEW: 0.65,  // 0.35–0.65 → MANUAL_REVIEW
  // > 0.65 → REJECTED
} as const;
