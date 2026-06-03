"""
VerifyIQ — Passport Verification Router
apps/ml/routers/passport.py

ICAO 9303 compliant — validates all 5 MRZ checksums.
"""

from __future__ import annotations
import re
import time
import base64
from datetime import date
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
from schemas.responses import CheckDetail, FraudFlag, VerificationResponse
from agents.agents import (
    ImageQualityAgent, DocumentClassifierAgent, ELATamperAgent,
    FaceDetectionAgent, MrzChecksumAgent, RiskScorerAgent,
)
from algorithms.checksums import validate_mrz_checksums

router = APIRouter()

# ISO 3166-1 alpha-3 country codes (sample — full list in production)
VALID_COUNTRIES = {
    "IND","USA","GBR","AUS","CAN","NZL","DEU","FRA","CHN","JPN","PAK","BGD",
    "LKA","NPL","BTN","MDV","AFG","IRN","IRQ","SAU","ARE","QAT","KWT","BHR",
    "SGP","MYS","THA","IDN","PHL","VNM","KOR","RUS","UKR","POL","ITA","ESP",
    "PRT","NLD","BEL","CHE","AUT","SWE","NOR","DNK","FIN","GRC","TUR","ISR",
    "ZAF","NGA","KEN","EGY","MAR","ETH","GHA","TZA","UGA","ZWE","MOZ","AGO",
    "BRA","MEX","ARG","COL","CHL","PER","VEN","ECU","BOL","PRY","URY","<<",
}


class PassportVerifyRequest(BaseModel):
    imageBase64: Optional[str] = None
    mrzLine1:    Optional[str] = None
    mrzLine2:    Optional[str] = None


@router.post("/verify", response_model=VerificationResponse)
async def verify_passport(req: PassportVerifyRequest) -> VerificationResponse:
    start = time.time()
    checks: dict[str, CheckDetail] = {}
    flags:  list[FraudFlag] = []

    img_bytes = base64.b64decode(req.imageBase64) if req.imageBase64 else None
    context = {
        "image_bytes":   img_bytes,
        "document_type": "passport",
        "mrz_line2":     req.mrzLine2 or "",
        "file_size":     len(img_bytes) if img_bytes else 0,
    }

    # ── Stage 1: Image Quality + Classification ─────────────────────────────
    if img_bytes:
        for agent in [ImageQualityAgent(), DocumentClassifierAgent()]:
            c = agent.run(context)
            checks[c.name] = c

    # ── Stage 2: MRZ Checksums ──────────────────────────────────────────────
    if req.mrzLine2:
        mrz_check = MrzChecksumAgent().run(context)
        checks[mrz_check.name] = mrz_check
        if mrz_check.result == "FAIL":
            flags.append(FraudFlag(
                flagType="MRZ_CHECKSUM_FAIL", severity="HIGH",
                confidence=0.98, description="One or more MRZ checksums failed",
                evidence=mrz_check.evidence,
            ))

        # Parse MRZ fields
        parsed = parse_mrz(req.mrzLine1 or "", req.mrzLine2)
        if parsed:
            # Expiry check
            exp_check = check_passport_expiry(parsed.get("dateOfExpiry", ""))
            checks[exp_check.name] = exp_check

            # Country validation
            cc_check = check_country_code(parsed.get("issuingCountry", ""))
            checks[cc_check.name] = cc_check

    # ── Stage 3: Visual (Face + ELA) ───────────────────────────────────────
    if img_bytes:
        face = FaceDetectionAgent().run(context)
        checks[face.name] = face
        if face.result == "FAIL":
            flags.append(FraudFlag(
                flagType="FACE_NOT_DETECTED", severity="HIGH",
                confidence=0.90, description="No face detected in passport photo zone",
                evidence=face.evidence,
            ))

        ela = ELATamperAgent().run(context)
        checks[ela.name] = ela
        if ela.result == "FAIL":
            flags.append(FraudFlag(
                flagType="TAMPER_DETECTED", severity="HIGH",
                confidence=0.85, description="Tamper detected in passport",
                evidence=ela.evidence,
            ))

    risk_score = _compute_risk(checks)

    extracted = {}
    if req.mrzLine2 and (parsed := parse_mrz(req.mrzLine1 or "", req.mrzLine2)):
        extracted = parsed

    return VerificationResponse(
        riskScore=risk_score,
        checks=checks,
        extractedData=extracted,
        flags=flags,
        processingTimeMs=int((time.time() - start) * 1000),
    )


def parse_mrz(line1: str, line2: str) -> dict | None:
    if len(line2) < 44:
        return None
    try:
        doc_num    = line2[0:9].replace("<", "")
        nationality= line2[10:13]
        dob        = line2[13:19]
        sex        = line2[20]
        expiry     = line2[21:27]

        dob_iso    = f"19{dob[:2]}-{dob[2:4]}-{dob[4:6]}" if int(dob[:2]) > 30 else f"20{dob[:2]}-{dob[2:4]}-{dob[4:6]}"
        exp_iso    = f"20{expiry[:2]}-{expiry[2:4]}-{expiry[4:6]}"

        issuing_country = line2[10:13]
        surname = given = ""
        if line1 and len(line1) > 5:
            names_part = line1[5:].split("<<")
            surname = names_part[0].replace("<", " ").strip() if names_part else ""
            given   = names_part[1].replace("<", " ").strip() if len(names_part) > 1 else ""

        return {
            "documentNumber": doc_num,
            "nationality": nationality,
            "dateOfBirth": dob_iso,
            "sex": sex,
            "dateOfExpiry": exp_iso,
            "issuingCountry": issuing_country,
            "surname": surname,
            "givenNames": given,
        }
    except Exception:
        return None


def check_passport_expiry(expiry_iso: str) -> CheckDetail:
    try:
        exp_date = date.fromisoformat(expiry_iso)
        today    = date.today()
        if exp_date < today:
            return CheckDetail(
                name="Passport Expiry", description="Checks passport is not expired",
                result="FAIL", riskContribution=0.40,
                evidence=f"Passport expired: {expiry_iso} < {today.isoformat()}",
            )
        return CheckDetail(
            name="Passport Expiry", description="Checks passport is not expired",
            result="PASS", riskContribution=0.0,
            evidence=f"Passport valid until {expiry_iso}",
        )
    except Exception:
        return CheckDetail(
            name="Passport Expiry", description="Checks passport is not expired",
            result="WARN", riskContribution=0.10,
            evidence=f"Could not parse expiry date: '{expiry_iso}'",
        )


def check_country_code(code: str) -> CheckDetail:
    if code in VALID_COUNTRIES:
        return CheckDetail(
            name="Issuing Country", description="Validates ISO 3166-1 alpha-3 country code",
            result="PASS", riskContribution=0.0,
            evidence=f"Country code '{code}' is valid ISO 3166-1 alpha-3",
        )
    return CheckDetail(
        name="Issuing Country", description="Validates ISO 3166-1 alpha-3 country code",
        result="WARN", riskContribution=0.20,
        evidence=f"Unknown country code '{code}'",
    )


def _compute_risk(checks: dict[str, CheckDetail]) -> float:
    return round(min(1.0, sum(c.riskContribution for c in checks.values() if c.result == "FAIL")), 4)
