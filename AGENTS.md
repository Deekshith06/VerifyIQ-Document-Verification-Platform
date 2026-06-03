# VerifyIQ — AI-Powered Document Intelligence Platform
## Live Project Specification (`AGENTS.md`)

> **Maintainer:** Seelaboyina Deekshith · GitHub: `Deekshith06`
> **Version:** v2.1.0
> **Last Updated:** 2026-06-03
> **Stack:** Next.js 14 · NestJS · FastAPI · ONNX Runtime
> **Classification:** Production-Grade · Stateless · Zero-Retention · Anonymous Public Tool

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v2.1.0 | 2026-06-03 | Rebuilt as anonymous zero-retention verifier; removed default account, audit history, queue, and database-backed verification path |
| v2.0.0 | 2026-06-03 | Advanced upgrade — offline-only AI, transparent fraud reasoning, AGENTS.md introduced |
| v1.0.0 | 2026-05-01 | Initial scaffold — 5 document types, basic ML pipeline |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [AI Agents](#3-ai-agents)
4. [Offline AI Models](#4-offline-ai-models)
5. [Document Verification Modules](#5-document-verification-modules)
6. [Transparent Fraud Reasoning](#6-transparent-fraud-reasoning)
7. [Database Schema](#7-database-schema)
8. [API Contract](#8-api-contract)
9. [Frontend Architecture](#9-frontend-architecture)
10. [ML Pipeline](#10-ml-pipeline)
11. [Setup & Dependencies](#11-setup--dependencies)
12. [Technical Skills Map](#12-technical-skills-map)
13. [Maintenance Protocol](#13-maintenance-protocol)

---

## 1. Project Overview

**VerifyIQ** is a self-contained, offline-capable document verification and KYC fraud detection platform. As of v2.1.0 it is an anonymous, stateless public website: documents are processed in memory, results are returned immediately, and no user account, upload archive, result history, audit feed, or dashboard database record is created by the default application path.

### Core Value Proposition
- **5 document types:** Credit Card, Passport, Aadhaar, Voter ID, Driving Licence
- **Explainable results:** Every APPROVED / REJECTED / REVIEW verdict shows *why*
- **Zero retention:** Session-only processing; closing or refreshing the browser clears visible results
- **No accounts:** No login, dashboard identity, user history, or API-key requirement on the public verification path
- **Offline-first AI:** All ML inference via ONNX Runtime on CPU — no cloud dependency
- **Compliance-grade:** DPDP Act 2023 + PCI-DSS + GDPR data handling built-in

### What Makes v2.0 Advanced
| Feature | v1.0 | v2.0 |
|---------|------|------|
| AI inference | API calls | ONNX offline models |
| Fraud explanation | Score only | Full reasoning chain |
| Architecture | Monolith | Stateless public verifier + optional ML service |
| Frontend | Basic | Light workflow-based verifier |
| Compliance | Partial | Full DPDP + PCI-DSS |
| ML tracking | None | MLflow + model registry |

---

## 2. Architecture

### Monorepo Structure (Optimized — minimal file count)

```
verifyiq/
├── apps/
│   ├── web/                        # Next.js 14 App Router
│   │   ├── app/
│   │   │   ├── (auth)/login/
│   │   │   ├── dashboard/
│   │   │   ├── verify/[type]/
│   │   │   └── results/[id]/
│   │   ├── components/
│   │   │   ├── verify/             # Upload, form, result components
│   │   │   ├── dashboard/          # Charts, stats
│   │   │   └── ui/                 # Design system atoms
│   │   └── lib/                    # API client, types, utils
│   │
│   ├── api/                        # NestJS monolith (gateway + domain)
│   │   ├── src/
│   │   │   ├── auth/               # JWT + API key auth
│   │   │   ├── verify/             # Shared verification orchestrator
│   │   │   ├── documents/          # 5 document modules (one folder each)
│   │   │   ├── audit/              # Immutable audit log
│   │   │   ├── fraud/              # Risk score aggregator
│   │   │   └── queue/              # BullMQ job handlers
│   │   └── prisma/
│   │       └── schema.prisma
│   │
│   └── ml/                         # FastAPI Python ML service
│       ├── routers/                # Per-document-type endpoints
│       ├── models/                 # ONNX model loaders + inference
│       ├── algorithms/             # Luhn, Verhoeff, MRZ, ELA (pure Python)
│       └── schemas/                # Pydantic response models
│
├── libs/
│   ├── types/                      # Shared TypeScript interfaces
│   └── validators/                 # Checksum algorithms (TS)
│
├── infra/
│   ├── docker-compose.yml
│   └── nginx.conf
│
└── AGENTS.md                       # ← THIS FILE (live spec)
```

### Service Communication

```
Browser → Next.js public website (no login)
Browser session state → deterministic verification checks
Optional NestJS API → FastAPI ML service (internal HTTP, port 8000)
FastAPI → ONNX Runtime (local model files, no internet)
Default verification path → no PostgreSQL writes, no Redis queue, no audit/event storage
```

### Design Patterns Used
- **Outbox Pattern** — DB write + event publish are atomic (prevents lost events)
- **CQRS** — Separate read models for dashboard (denormalized) vs write models
- **Saga** — Multi-step verification steps with compensating transactions on failure
- **Strangler Fig** — Document modules are independently deployable

---

## 3. AI Agents

Each agent is an autonomous reasoning unit activated during verification. They run sequentially within the ML service.

### Agent Registry

#### 🔍 DocumentClassifierAgent
- **Trigger:** Every incoming document image
- **Model:** `classifier.onnx` (EfficientNet-B0, fine-tuned)
- **Input:** 224×224 RGB image
- **Output:** `{ documentType, confidence }` — routes to correct pipeline
- **Fallback:** MIME type + file extension heuristic if confidence < 0.7
- **Learns:** Null (static ONNX, no online learning)

#### 🧠 OCRExtractionAgent
- **Trigger:** After classification confirmed
- **Model:** PaddleOCR v3 (offline, bundled weights)
- **Input:** Full-resolution document image
- **Output:** Field map `{ fieldName: { value, confidence, bbox } }`
- **Languages:** English, Hindi, regional scripts (Devanagari, Tamil, Telugu)
- **Fallback:** Tesseract 5 with document-specific char whitelist

#### 👁️ TamperDetectionAgent
- **Trigger:** All visual submissions
- **Model:** ELA algorithm + `tamper_cnn.onnx` (binary classifier on ELA map)
- **Input:** Document image
- **Output:** `{ tampered: bool, confidence, suspiciousRegions: BBox[], elaMap }`
- **Algorithm:** Error Level Analysis — recompress at 95% JPEG, diff original vs compressed
- **Why it works:** Tampered regions (copy-pasted text, photos) show higher re-compression error

#### 😶 FaceDetectionAgent
- **Trigger:** Passport, Aadhaar, Voter ID, Driving Licence
- **Model:** `face_detector.onnx` (RetinaFace lightweight)
- **Input:** Cropped photo zone of document
- **Output:** `{ detected: bool, bbox, confidence, qualityScore }`
- **Minimum quality:** 0.85 MTCNN confidence (flag lower)

#### 🔢 ChecksumValidationAgent
- **Trigger:** Pure algorithmic — no ML model
- **Algorithms:** Luhn (credit card), Verhoeff (Aadhaar), MRZ mod-97 (passport)
- **Output:** `{ valid: bool, algorithm, computed, expected }`
- **Zero-dependency:** Runs offline, pure TypeScript / Python

#### 📊 RiskScorerAgent
- **Trigger:** After all other agents complete
- **Model:** `risk_scorer.onnx` (XGBoost → ONNX, 47 input features)
- **Input:** Structured feature vector from all prior agent outputs
- **Output:** `{ score: 0.0–1.0, breakdown: FeatureContribution[], verdict }`
- **Verdict thresholds:**
  - `< 0.35` → `APPROVED`
  - `0.35–0.65` → `MANUAL_REVIEW`
  - `> 0.65` → `REJECTED`

#### 🔐 QRSignatureAgent
- **Trigger:** Aadhaar (Secure QR), new Voter ID, DigiLocker DL
- **Model:** None — RSA-2048 + ECDSA-256 cryptographic verification
- **Input:** Decoded QR binary payload
- **Output:** `{ signatureValid: bool, issuer, payloadData }`
- **Key source:** UIDAI public key bundled with app (refreshed on deploy)

#### 🌐 CrossValidationAgent
- **Trigger:** When both QR data and OCR data exist
- **Model:** Fuzzy string matching (Levenshtein distance, no ML)
- **Input:** OCR-extracted fields + QR-extracted fields
- **Output:** `{ matchScore: 0–1, mismatches: FieldMismatch[] }`

---

## 4. Offline AI Models

All models are bundled in `apps/ml/models/` — **zero internet required for inference**.

### Model Registry

| Model File | Size | Architecture | Task | Accuracy |
|------------|------|-------------|------|----------|
| `classifier.onnx` | ~15MB | EfficientNet-B0 | Document type classification | >95% |
| `tamper_cnn.onnx` | ~8MB | MobileNetV2 | Tamper detection on ELA map | >88% |
| `face_detector.onnx` | ~1.9MB | RetinaFace-MobileNet | Face detection + quality | >97% |
| `risk_scorer.onnx` | ~500KB | XGBoost (47 features) | Risk score ensemble | AUC 0.94 |
| PaddleOCR weights | ~80MB | DB + CRNN | Multilingual OCR | CER <3% |

### Model Loading Pattern (FastAPI)

```python
# models/model_registry.py
import onnxruntime as ort
from pathlib import Path

class ModelRegistry:
    """Singleton — models loaded once at startup, never reloaded per request."""
    _instances: dict[str, ort.InferenceSession] = {}

    @classmethod
    def get(cls, name: str) -> ort.InferenceSession:
        if name not in cls._instances:
            path = Path(f"models/{name}.onnx")
            opts = ort.SessionOptions()
            opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            cls._instances[name] = ort.InferenceSession(
                str(path), sess_options=opts,
                providers=["CPUExecutionProvider"]
            )
        return cls._instances[name]
```

### ONNX Export (PyTorch → ONNX)

```python
# scripts/export_classifier.py
import torch
from torchvision.models import efficientnet_b0

model = efficientnet_b0()
model.classifier[1] = torch.nn.Linear(1280, 6)  # 6 document classes
model.load_state_dict(torch.load("checkpoints/classifier.pt"))
model.eval()

dummy = torch.randn(1, 3, 224, 224)
torch.onnx.export(
    model, dummy, "models/classifier.onnx",
    input_names=["image"],
    output_names=["logits"],
    dynamic_axes={"image": {0: "batch"}},
    opset_version=17
)
```

---

## 5. Document Verification Modules

### Shared Verification Flow

Every document goes through this 6-stage pipeline:

```
Stage 1: Image Quality Gate (blur, resolution, lighting)
    ↓
Stage 2: DocumentClassifierAgent (confirms expected type)
    ↓
Stage 3: OCRExtractionAgent (all fields)
    ↓
Stage 4: ChecksumValidationAgent (algorithm-specific)
    ↓
Stage 5: TamperDetectionAgent + FaceDetectionAgent (visual)
    ↓
Stage 6: RiskScorerAgent (final verdict + reasoning)
```

### Credit Card

| Check | Algorithm | Weight |
|-------|-----------|--------|
| Luhn checksum | Luhn mod-10 | +0.50 on fail |
| BIN lookup | Local BIN DB (binlist format) | +0.25 unknown |
| Expiry validation | UTC comparison | +0.30 expired |
| Network detection | Regex: Visa/MC/Amex/RuPay | — |
| Hologram presence | HSV color analysis | +0.15 absent |
| ELA tamper | JPEG recompression diff | +0.40 positive |
| OCR cross-validation | Levenshtein < 20% | +0.20 mismatch |

**PCI-DSS constraint:** Only last 4 digits + BIN stored. Full PAN never persists.

### Passport

| Check | Algorithm | Weight |
|-------|-----------|--------|
| MRZ extraction | PaddleOCR + angle correction | — |
| All 5 MRZ checksums | ICAO 9303 Mod-97 | +0.60 any fail |
| Expiry / DOB logic | Date arithmetic | +0.40 expired |
| Face detection | RetinaFace ONNX | +0.30 absent |
| ELA tamper | Biodata page ELA | +0.35 positive |
| Issuing country | ISO 3166-1 alpha-3 | +0.20 unknown |

**MRZ Checksum (Python):**
```python
def mrz_check(field: str) -> int:
    chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<"
    weights = [7, 3, 1]
    return sum(chars.index(c) * weights[i % 3]
               for i, c in enumerate(field.upper())) % 10
```

### Aadhaar

| Check | Algorithm | Weight |
|-------|-----------|--------|
| Format (12 digits, no 0/1 start) | Regex | +0.30 fail |
| Verhoeff checksum | Verhoeff D+P table | +0.55 fail |
| QR type detection | pyzxing decode | — |
| UIDAI RSA signature | RSA-2048 + SHA-256 | +0.60 invalid |
| QR ↔ OCR cross-validation | Levenshtein | +0.35 mismatch |
| UIDAI logo template match | OpenCV matchTemplate | +0.20 absent |

**DPDP Compliance (mandatory):**
- Store: `hash(sha256(aadhaar + salt))` + last 4 digits only
- API always returns: `"XXXX XXXX 3456"` format
- Raw image TTL: 24h (configurable), auto-deleted by cron

### Voter ID (EPIC)

| Check | Algorithm | Weight |
|-------|-----------|--------|
| EPIC format regex | `^[A-Z]{3}[0-9]{7}$` | +0.50 fail |
| State prefix inference | 400+ prefix lookup table | +0.20 unknown |
| Age eligibility (18+) | DOB arithmetic | +0.35 underage |
| ECI logo detection | Template matching | +0.20 absent |
| Face detection | RetinaFace | +0.30 absent |
| ELA tamper | Full card ELA | +0.40 positive |

### Driving Licence

| Check | Algorithm | Weight |
|-------|-----------|--------|
| DL format regex | `^[A-Z]{2}[0-9]{13}$` (normalized) | +0.50 fail |
| State code validation | 36 states + UTs | +0.25 invalid |
| Validity calculation | Issue year + 20yr (LMV) / 5yr (HMV) | +0.30 expired |
| Vehicle class vs DOB | Age eligibility matrix | +0.30 fail |
| RTO code lookup | State-indexed RTO table | +0.15 unknown |
| Signature stripe | Binary pixel analysis | +0.15 absent |

---

## 6. Transparent Fraud Reasoning

Every result includes a human-readable explanation of how the verdict was reached.

### Response Schema (shared across all document types)

```typescript
interface VerificationResult {
  requestId: string;
  documentType: DocumentType;
  verdict: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';
  riskScore: number;                     // 0.0 – 1.0

  // ← THE KEY TRANSPARENCY LAYER
  reasoning: {
    summary: string;                     // "Document passed all structural checks but tamper signal detected in photo zone"
    passingChecks: CheckDetail[];        // What passed (with why)
    failingChecks: CheckDetail[];        // What failed (with why + weight contribution)
    neutralChecks: CheckDetail[];        // N/A or inconclusive
    dominantFactor: string;             // The single biggest risk contributor
    verdictExplanation: string;          // Plain-English verdict rationale
  };

  checks: DocumentChecks;               // Full check results (type-specific)
  extractedData: ExtractedFields;       // Structured OCR + algorithm output
  flags: FraudFlag[];                   // Specific fraud signals
  processingStages: StageLog[];         // Timeline of each pipeline stage
  processingTimeMs: number;
}

interface CheckDetail {
  name: string;            // "Luhn Checksum"
  description: string;     // "Validates card number mathematical integrity"
  result: 'PASS' | 'FAIL' | 'WARN' | 'N/A';
  riskContribution: number;             // 0.0 – 1.0, this check's contribution
  evidence: string;        // "Computed check digit: 7, Expected: 3"
  technicalDetail?: string;             // Optional deep-dive for developers
}
```

### Frontend Display Contract

The frontend renders the `reasoning` object as a collapsible panel:

```
┌─────────────────────────────────────────┐
│ REJECTED   Risk Score: 0.81             │
├─────────────────────────────────────────┤
│ Summary: Aadhaar QR signature invalid + │
│ Verhoeff checksum failed                │
├─────────────────────────────────────────┤
│ ✅ Format valid (12 digits, no 0/1)     │
│ ✅ UIDAI logo detected                  │
│ ✅ Face detected (quality 0.92)         │
│ ❌ Verhoeff checksum FAILED (+0.55)     │
│    → Computed: 3, Expected: 0           │
│ ❌ QR signature invalid (+0.60)         │
│    → RSA-2048 verification failed       │
│ ⚠️  QR↔OCR name mismatch 45% (+0.35)   │
├─────────────────────────────────────────┤
│ Dominant Factor: QR signature invalid   │
│ Verdict: Document appears fraudulent.   │
│ Both the number checksum and digital    │
│ signature are invalid — likely forged.  │
└─────────────────────────────────────────┘
```

---

## 7. Database Schema

### Core Tables (PostgreSQL 16 + Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Organization {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  apiKeys   ApiKey[]
  requests  VerificationRequest[]
}

model ApiKey {
  id         String       @id @default(cuid())
  hashedKey  String       @unique  // sha256(rawKey)
  orgId      String
  org        Organization @relation(fields: [orgId], references: [id])
  rateLimit  Int          @default(100)  // req/min
  revokedAt  DateTime?
  createdAt  DateTime     @default(now())
}

model VerificationRequest {
  id           String       @id @default(cuid())
  orgId        String
  org          Organization @relation(fields: [orgId], references: [id])
  documentType String       // CREDIT_CARD | PASSPORT | AADHAAR | VOTER_ID | DL
  status       String       @default("PROCESSING")
  riskScore    Float?
  verdict      String?      // APPROVED | REJECTED | MANUAL_REVIEW
  submittedAt  DateTime     @default(now())
  resolvedAt   DateTime?
  deletedAt    DateTime?    // soft delete
  result       VerificationResult?
  auditLogs    AuditLog[]
  fraudFlags   FraudFlag[]
}

model VerificationResult {
  id            String              @id @default(cuid())
  requestId     String              @unique
  request       VerificationRequest @relation(fields: [requestId], references: [id])
  checksJson    Json                // Full CheckDetail[] array
  reasoningJson Json                // Full reasoning object
  extractedJson Json                // Extracted fields (no PII above configured threshold)
  modelVersion  String              // Which ONNX model version scored this
  createdAt     DateTime            @default(now())
}

model FraudFlag {
  id          String              @id @default(cuid())
  requestId   String
  request     VerificationRequest @relation(fields: [requestId], references: [id])
  flagType    String              // LUHN_FAIL | TAMPER_DETECTED | SIGNATURE_INVALID | etc
  severity    String              // HIGH | MEDIUM | LOW
  confidence  Float
  description String
  evidence    String?
  createdAt   DateTime            @default(now())
}

model AuditLog {
  id        String              @id @default(cuid())
  requestId String?
  request   VerificationRequest? @relation(fields: [requestId], references: [id])
  event     String              // SUBMITTED | PROCESSING | COMPLETED | ACCESSED | DELETED
  actor     String              // API key ID or user ID
  ipAddress String
  metadata  Json?
  createdAt DateTime            @default(now())
  // Append-only: no UPDATE or DELETE allowed (enforced via RLS trigger)

  @@index([requestId, createdAt(sort: Desc)])
}
```

### Row-Level Security

```sql
-- 002_rls_policies.sql
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON verification_requests
  USING (org_id = current_setting('app.current_org_id')::text);

-- Audit log: insert-only (no update/delete by anyone)
CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING;
```

---

## 8. API Contract

### Endpoints (v1)

```
POST   /api/v1/verify                   → Submit document for verification
GET    /api/v1/verify/:id               → Poll / get full result
GET    /api/v1/verify/:id/reasoning     → Get detailed fraud reasoning (transparency endpoint)
POST   /api/v1/verify/batch             → Up to 10 documents
GET    /api/v1/dashboard/stats          → Org-level KPIs + timeline
GET    /api/v1/audit/logs               → Cursor-paginated audit trail
POST   /api/v1/api-keys                 → Create API key (shown once)
DELETE /api/v1/api-keys/:id             → Revoke key
```

### Error Codes

| Code | Meaning |
|------|---------|
| VIQ-001 | Invalid document type |
| VIQ-002 | File > 10MB |
| VIQ-003 | Unsupported format (not JPEG/PNG/WebP/PDF) |
| VIQ-004 | Image quality too low (blur/resolution) |
| VIQ-005 | Request ID not found |
| VIQ-006 | Rate limit exceeded |
| VIQ-007 | Insufficient permissions |
| VIQ-008 | Verification in progress — retry after N seconds |
| VIQ-009 | ML service unavailable — fallback to rule-based |
| VIQ-010 | Invalid API key |
| VIQ-011 | Consent not obtained (Aadhaar DPDP gate) |
| VIQ-012 | Batch size exceeds 10 |

### Authentication

```
# Dashboard (JWT)
Authorization: Bearer <jwt_token>

# API clients (API key)
X-API-Key: viq_live_<base64_key>

# Rate limit headers (all responses)
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1717440000
```

---

## 9. Frontend Architecture

### Design System — "Intelligence Fortress"

```css
/* Token system */
--color-bg-primary:    #0A0A0F;   /* near-black space */
--color-bg-surface:    #111118;   /* card surfaces */
--color-accent-cyan:   #00D4FF;   /* trust / technology */
--color-accent-violet: #7B61FF;   /* AI/ML elements */
--color-success:       #00F59B;   /* APPROVED */
--color-error:         #FF3B3B;   /* REJECTED */
--color-warning:       #FFB800;   /* MANUAL_REVIEW */
--font-display:        'Clash Display', sans-serif;
--font-body:           'Inter Variable', sans-serif;
```

### Key Components

```typescript
// Core component API

<RiskGauge
  score={0.23}                           // animated SVG arc gauge
  animated={true}
/>

<FraudReasoningPanel
  reasoning={result.reasoning}          // ← THE TRANSPARENCY COMPONENT
  defaultExpanded={result.verdict !== 'APPROVED'}
/>

<ChecklistGrid
  passingChecks={result.reasoning.passingChecks}
  failingChecks={result.reasoning.failingChecks}
  animated={true}
/>

<DocumentUploadZone
  documentType="AADHAAR"
  onUpload={handleFile}
  showCameraCapture={true}
/>

<VerificationWizard
  steps={['select', 'upload', 'processing', 'result']}
/>
```

### Page Routes

| Route | Page |
|-------|------|
| `/` | Landing — animated hero, feature grid, stats |
| `/dashboard` | KPI cards, charts, recent verifications table |
| `/verify` | Multi-step upload wizard |
| `/results/[id]` | Full result + fraud reasoning panel |
| `/audit` | Immutable audit trail viewer |
| `/docs` | Cinematic API documentation |
| `/settings/api-keys` | Key management |

---

## 10. ML Pipeline

### Training Pipeline (MLflow-tracked)

```
Data Collection → Augmentation → Train (EfficientNet-B0) → Validate
     ↓                                                          ↓
  DVC versioned                                          MLflow Registry
                                                              ↓
                                              Export to ONNX (opset 17)
                                                              ↓
                                              Integration test (<200ms CPU)
                                                              ↓
                                              Bundle in apps/ml/models/
```

### Feature Vector for RiskScorerAgent (47 features)

```python
# All boolean/float, no raw strings
features = {
    # Checksum layer (5)
    "luhn_valid": bool, "verhoeff_valid": bool, "mrz_all_checksums": bool,
    "qr_signature_valid": bool, "epic_format_valid": bool,

    # Visual layer (12)
    "face_detected": bool, "face_quality": float, "tamper_ela_score": float,
    "tamper_cnn_confidence": float, "hologram_present": bool,
    "logo_detected": bool, "doc_type_confidence": float,
    "image_blur_score": float, "image_resolution_ok": bool,
    "signature_present": bool, "photo_zone_uniform": bool,
    "font_consistency_score": float,

    # OCR layer (8)
    "ocr_confidence_mean": float, "ocr_confidence_min": float,
    "field_count_extracted": int, "name_field_confidence": float,
    "id_field_confidence": float, "date_field_confidence": float,
    "cross_validation_score": float, "qr_ocr_mismatch_score": float,

    # Structural / logic layer (12)
    "document_expired": bool, "issue_year_plausible": bool,
    "age_eligible": bool, "state_code_known": bool,
    "bin_known": bool, "bin_country_match": bool,
    "issuing_country_known": bool, "name_length_plausible": bool,
    "dob_plausible": bool, "expiry_far_future": bool,
    "all_same_digits": bool, "starts_with_zero_one": bool,

    # Meta (10)
    "file_size_bytes": int, "image_width": int, "image_height": int,
    "submission_hour": int, "is_pdf": bool, "has_qr_code": bool,
    "qr_type": int, "is_masked": bool, "has_manual_entry": bool,
    "manual_image_mismatch": bool,
}
```

### Model Versioning

```
MLflow Registry stages:
  Staging → validated on 1k held-out samples → Production
  Production → current live model
  Archived → retired models (kept 90 days)

ONNX bundle naming:
  models/classifier_v2.1.onnx
  models/tamper_cnn_v1.3.onnx

Rollback: swap symlink models/classifier.onnx → older version, restart ML service
A/B testing: 10% traffic to new model via feature flag in RiskScorerAgent
```

---

## 11. Setup & Dependencies

### Prerequisites

```bash
# Runtime
node >= 20.0.0
python >= 3.11
postgresql >= 16
redis >= 7
docker >= 24 (optional)

# ML dependencies
onnxruntime >= 1.18
paddlepaddle >= 2.6 (offline, CPU build)
paddleocr >= 2.7
Pillow >= 10.0
cryptography >= 41.0
xgboost >= 2.0

# Node dependencies (key ones)
next@14      framer-motion@11    @nestjs/core@10
prisma@5     bullmq@5            @nestjs/swagger@7
recharts@2   sharp@0.33
```

### Local Dev Setup

```bash
# 1. Clone
git clone https://github.com/Deekshith06/verifyiq.git && cd verifyiq

# 2. Install
npm install                          # Node monorepo
cd apps/ml && pip install -r requirements.txt  # Python ML

# 3. Models — download pretrained weights
./scripts/download_models.sh         # Pulls from project release assets (one-time)

# 4. Env
cp .env.example .env                 # Fill DATABASE_URL, REDIS_URL, JWT_SECRET

# 5. DB
npx prisma migrate dev               # Apply migrations
npx prisma db seed                   # Seed test data

# 6. Start all services
docker-compose up -d                 # postgres + redis
npm run dev:api                      # NestJS on :3001
uvicorn apps.ml.main:app --port 8000 # FastAPI ML on :8000
npm run dev:web                      # Next.js on :3000
```

### Environment Variables

```bash
# Core
DATABASE_URL=postgresql://user:pass@localhost:5432/verifyiq
REDIS_URL=redis://localhost:6379
JWT_SECRET=<32-char random>
API_KEY_SALT=<32-char random>

# ML
ML_SERVICE_URL=http://localhost:8000
MODELS_DIR=./apps/ml/models
ONNX_NUM_THREADS=4

# Compliance
AADHAAR_SALT=<32-char random>          # For hash(aadhaar + salt)
RAW_IMAGE_TTL_HOURS=24                 # DPDP retention
DATA_RETENTION_DAYS=30                 # Full record retention

# Feature flags
ENABLE_AB_TESTING=false
NEW_MODEL_TRAFFIC_PCT=10
```

---

## 12. Technical Skills Map

Skills needed to maintain and extend VerifyIQ:

### Core Engineering

| Skill | Level | Learn At |
|-------|-------|----------|
| TypeScript (strict) | Advanced | [typescriptlang.org/docs](https://typescriptlang.org/docs) |
| NestJS | Intermediate | [docs.nestjs.com](https://docs.nestjs.com) |
| Next.js 14 App Router | Intermediate | [nextjs.org/docs](https://nextjs.org/docs) |
| FastAPI + Python 3.11 | Intermediate | [fastapi.tiangolo.com](https://fastapi.tiangolo.com) |
| PostgreSQL + Prisma | Intermediate | [prisma.io/docs](https://prisma.io/docs) |
| Redis + BullMQ | Intermediate | [docs.bullmq.io](https://docs.bullmq.io) |

### ML / AI

| Skill | Level | Learn At |
|-------|-------|----------|
| ONNX Runtime | Intermediate | [onnxruntime.ai/docs](https://onnxruntime.ai/docs) |
| PaddleOCR | Intermediate | [github.com/PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) |
| Computer Vision (PIL, OpenCV) | Intermediate | [opencv.org](https://opencv.org) |
| PyTorch → ONNX export | Intermediate | [pytorch.org/docs/onnx](https://pytorch.org/docs/stable/onnx.html) |
| XGBoost feature engineering | Intermediate | [xgboost.readthedocs.io](https://xgboost.readthedocs.io) |
| MLflow | Beginner | [mlflow.org/docs](https://mlflow.org/docs/latest) |
| EfficientNet fine-tuning | Advanced | [huggingface.co/docs](https://huggingface.co/docs) |

### Security & Compliance

| Skill | Level | Learn At |
|-------|-------|----------|
| JWT + refresh token patterns | Intermediate | [jwt.io/introduction](https://jwt.io/introduction) |
| RSA-2048 / ECDSA signature verification | Intermediate | [cryptography.io/docs](https://cryptography.io/en/latest) |
| PCI-DSS card data rules | Awareness | [pcisecuritystandards.org](https://pcisecuritystandards.org) |
| DPDP Act 2023 | Awareness | [meity.gov.in/dpdp](https://meity.gov.in) |
| PostgreSQL RLS | Intermediate | [postgresql.org/docs/rls](https://postgresql.org/docs/current/ddl-rowsecurity.html) |

### Document Standards

| Skill | Learn At |
|-------|----------|
| ICAO 9303 (MRZ standard) | [icao.int/publications/Documents/9303_p3_cons_en.pdf](https://www.icao.int) |
| Luhn Algorithm | [wikipedia.org/wiki/Luhn](https://en.wikipedia.org/wiki/Luhn_algorithm) |
| Verhoeff Checksum | [wikipedia.org/wiki/Verhoeff](https://en.wikipedia.org/wiki/Verhoeff_algorithm) |
| UIDAI Aadhaar QR spec | [uidai.gov.in/offline-kyc](https://uidai.gov.in) |
| ECI EPIC format | [eci.gov.in](https://eci.gov.in) |

### Frontend

| Skill | Level | Learn At |
|-------|-------|----------|
| Framer Motion | Intermediate | [framer.com/motion](https://www.framer.com/motion) |
| Tailwind CSS | Intermediate | [tailwindcss.com/docs](https://tailwindcss.com/docs) |
| Recharts | Beginner | [recharts.org](https://recharts.org) |
| Shadcn/ui | Beginner | [ui.shadcn.com](https://ui.shadcn.com) |
| React Server Components | Intermediate | [nextjs.org/docs/app/rsc](https://nextjs.org/docs/app/building-your-application/rendering/server-components) |

---

## 13. Maintenance Protocol

### When Project Changes Occur — Update This File

```
Code change type          → Section to update in AGENTS.md
─────────────────────────────────────────────────────────
New document type added   → §5 (new module table) + §3 (new agents)
Model retrained/upgraded  → §4 (model registry table + version)
New API endpoint          → §8 (endpoints table + error codes)
Schema migration          → §7 (Prisma schema block)
New env variable          → §11 (env vars block)
New dependency            → §11 (prerequisites)
New fraud check logic     → §5 (relevant module check table)
Frontend component added  → §9 (components block)
Version bump              → Version History table at top
```

### Session Recovery (Planning Files Protocol)

This project uses file-based planning for complex feature work:

```bash
# Before starting any feature spanning >5 tool calls:
cat task_plan.md    # restore context
cat progress.md     # see what was done
cat findings.md     # see what was discovered

# After each completed phase, update:
# - task_plan.md: mark phase complete
# - progress.md: log session entry
# - AGENTS.md: update relevant section
```

### Security Checklist (Run Before Every Deploy)

```
[ ] No full Aadhaar number stored (DPDP compliance)
[ ] No full PAN/card number stored (PCI-DSS compliance)
[ ] All PII fields encrypted at rest (pgcrypto AES-256)
[ ] TLS 1.3+ on all endpoints
[ ] Rate limits active (100/min API key, 10/min IP)
[ ] File uploads virus-scanned before processing
[ ] Audit log append-only constraint tested
[ ] ONNX models up-to-date in apps/ml/models/
[ ] UIDAI public key current (check quarterly)
[ ] Data retention cron active (auto-delete after TTL)
[ ] Penetration test completed (before initial prod launch)
```

---

*This file is the single source of truth for VerifyIQ's architecture, agents, and technical decisions.*
*Update it whenever the project changes. It is read by Codex, team members, and CI checks.*
