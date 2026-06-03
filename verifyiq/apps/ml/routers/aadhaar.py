"""
VerifyIQ — Aadhaar Verification Router
apps/ml/routers/aadhaar.py

DPDP Act 2023 Compliance:
- Full 12-digit Aadhaar number NEVER stored or returned
- Only: last 4 digits + sha256(number + AADHAAR_SALT)
- All API responses masked: "XXXX XXXX 3456"
- Consent token required before processing
"""

from __future__ import annotations
import re
import hashlib
import os
import time
import base64
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from schemas.responses import CheckDetail, FraudFlag, VerificationResponse
from agents.agents import (
    ImageQualityAgent, DocumentClassifierAgent, ELATamperAgent,
    FaceDetectionAgent, VerhoeffChecksumAgent, QRSignatureAgent,
    CrossValidationAgent, RiskScorerAgent,
)

router = APIRouter()


class AadhaarVerifyRequest(BaseModel):
    imageBase64:   Optional[str]  = None
    aadhaarNumber: Optional[str]  = None   # raw number (processed, never stored)
    consentToken:  Optional[str]  = None   # DPDP consent gate
    qrPayloadB64:  Optional[str]  = None   # Base64-encoded QR binary payload
    ocrFields:     Optional[dict] = None
    qrFields:      Optional[dict] = None


@router.post("/verify", response_model=VerificationResponse)
async def verify_aadhaar(req: AadhaarVerifyRequest) -> VerificationResponse:
    # DPDP Gate: consent required
    if not req.consentToken:
        raise HTTPException(status_code=403, detail="VIQ-011: Consent token required for Aadhaar verification")

    start = time.time()
    checks: dict[str, CheckDetail] = {}
    flags:  list[FraudFlag] = []

    clean_number = re.sub(r"\s+", "", req.aadhaarNumber or "")
    img_bytes    = base64.b64decode(req.imageBase64) if req.imageBase64 else None
    qr_payload   = base64.b64decode(req.qrPayloadB64) if req.qrPayloadB64 else None

    context = {
        "image_bytes":    img_bytes,
        "document_type":  "aadhaar",
        "aadhaar_number": clean_number,
        "qr_payload":     qr_payload,
        "ocr_fields":     req.ocrFields or {},
        "qr_fields":      req.qrFields or {},
        "file_size":      len(img_bytes) if img_bytes else 0,
    }

    # ── Stage 1: Format Validation ──────────────────────────────────────────
    if clean_number:
        fmt = validate_aadhaar_format(clean_number)
        checks[fmt.name] = fmt
        if fmt.result == "FAIL":
            flags.append(FraudFlag(flagType="FORMAT_INVALID", severity="MEDIUM",
                                   confidence=1.0, description=fmt.evidence))

        # Verhoeff Checksum
        verhoeff = VerhoeffChecksumAgent().run(context)
        checks[verhoeff.name] = verhoeff
        if verhoeff.result == "FAIL":
            flags.append(FraudFlag(
                flagType="VERHOEFF_FAIL", severity="HIGH",
                confidence=0.99, description="Aadhaar Verhoeff checksum invalid",
                evidence=verhoeff.evidence,
            ))

    # ── Stage 2: QR Signature ───────────────────────────────────────────────
    if qr_payload:
        qr_sig = QRSignatureAgent().run(context)
        checks[qr_sig.name] = qr_sig
        if qr_sig.result == "FAIL":
            flags.append(FraudFlag(
                flagType="SIGNATURE_INVALID", severity="HIGH",
                confidence=0.95, description="UIDAI QR RSA-2048 signature invalid",
                evidence=qr_sig.evidence,
            ))

        # Cross-validation: QR fields vs OCR fields
        xval = CrossValidationAgent().run(context)
        checks[xval.name] = xval
        if xval.result == "FAIL":
            flags.append(FraudFlag(
                flagType="QR_OCR_MISMATCH", severity="MEDIUM",
                confidence=0.80, description="QR and OCR field mismatch",
                evidence=xval.evidence,
            ))

    # ── Stage 3: Visual ─────────────────────────────────────────────────────
    if img_bytes:
        for agent in [ImageQualityAgent(), DocumentClassifierAgent(),
                      FaceDetectionAgent(), ELATamperAgent()]:
            c = agent.run(context)
            checks[c.name] = c
            if c.result == "FAIL" and c.name in ("ELA Tamper Detection", "Face Detection"):
                flags.append(FraudFlag(
                    flagType=c.name.upper().replace(" ", "_"),
                    severity="HIGH", confidence=0.85,
                    description=c.description, evidence=c.evidence,
                ))

    risk_score = _compute_risk(checks)

    # DPDP: mask number in response
    last_four  = clean_number[-4:] if len(clean_number) >= 4 else "????"
    salt       = os.environ.get("AADHAAR_SALT", "default_salt_change_me")
    num_hash   = hashlib.sha256(f"{clean_number}{salt}".encode()).hexdigest() if clean_number else ""
    extracted  = {
        "maskedNumber": f"XXXX XXXX {last_four}",
        "lastFour":     last_four,
        "numberHash":   num_hash,
        "isMasked":     True,
        "qrType":       "SECURE_QR" if qr_payload and len(qr_payload) > 256 else "NONE",
    }

    return VerificationResponse(
        riskScore=risk_score,
        checks=checks,
        extractedData=extracted,
        flags=flags,
        processingTimeMs=int((time.time() - start) * 1000),
    )


def validate_aadhaar_format(number: str) -> CheckDetail:
    """Aadhaar: exactly 12 digits, doesn't start with 0 or 1, not all same digit."""
    if not re.match(r"^\d{12}$", number):
        return CheckDetail(
            name="Aadhaar Format Check",
            description="Validates Aadhaar number format (12 digits, no 0/1 start)",
            result="FAIL", riskContribution=0.30,
            evidence=f"Invalid format: '{number}' — must be exactly 12 digits",
        )
    if number[0] in ("0", "1"):
        return CheckDetail(
            name="Aadhaar Format Check",
            description="Validates Aadhaar number format (12 digits, no 0/1 start)",
            result="FAIL", riskContribution=0.30,
            evidence=f"Aadhaar cannot start with {number[0]} (UIDAI rule)",
        )
    if len(set(number)) == 1:
        return CheckDetail(
            name="Aadhaar Format Check",
            description="Validates Aadhaar number format (12 digits, no 0/1 start)",
            result="FAIL", riskContribution=0.30,
            evidence=f"All same digit ('{number[0]}' × 12) — clearly invalid",
        )
    return CheckDetail(
        name="Aadhaar Format Check",
        description="Validates Aadhaar number format (12 digits, no 0/1 start)",
        result="PASS", riskContribution=0.0,
        evidence=f"Format valid: 12 digits, starts with {number[0]}, not uniform",
    )


def _compute_risk(checks: dict[str, CheckDetail]) -> float:
    return round(min(1.0, sum(c.riskContribution for c in checks.values() if c.result == "FAIL")), 4)
