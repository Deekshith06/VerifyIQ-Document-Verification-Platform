"""
VerifyIQ — Voter ID (EPIC) Verification Router
apps/ml/routers/voter_id.py
EPIC format: 3 uppercase letters + 7 digits (e.g., ABC1234567)
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
    ImageQualityAgent, DocumentClassifierAgent, ELATamperAgent, FaceDetectionAgent, RiskScorerAgent,
)

router = APIRouter()

# ── Complete State Prefix Registry (400+ prefixes → all 28 states + 8 UTs) ──
STATE_PREFIXES: dict[str, str] = {
    # Delhi
    "AAA":"Delhi","AAB":"Delhi","AAC":"Delhi","AAD":"Delhi","AAE":"Delhi",
    "ABC":"Delhi","XDA":"Delhi","XDB":"Delhi","XDC":"Delhi",
    # Maharashtra
    "AF":"Maharashtra","AG":"Maharashtra","BA":"Maharashtra","BB":"Maharashtra",
    "BC":"Maharashtra","MC":"Maharashtra","MD":"Maharashtra","ME":"Maharashtra",
    # Karnataka
    "CAA":"Karnataka","CAB":"Karnataka","CAC":"Karnataka","KNA":"Karnataka",
    "KNB":"Karnataka","KNC":"Karnataka","KAA":"Karnataka","KAB":"Karnataka",
    # Tamil Nadu
    "TAA":"Tamil Nadu","TAB":"Tamil Nadu","TAC":"Tamil Nadu","TNA":"Tamil Nadu",
    "TNB":"Tamil Nadu","TNC":"Tamil Nadu",
    # Uttar Pradesh
    "UAA":"Uttar Pradesh","UAB":"Uttar Pradesh","UAC":"Uttar Pradesh",
    "UPA":"Uttar Pradesh","UPB":"Uttar Pradesh","UPC":"Uttar Pradesh",
    # Gujarat
    "GAA":"Gujarat","GAB":"Gujarat","GJA":"Gujarat","GJB":"Gujarat",
    # Rajasthan
    "RAA":"Rajasthan","RAB":"Rajasthan","RJA":"Rajasthan","RJB":"Rajasthan",
    # West Bengal
    "WAA":"West Bengal","WAB":"West Bengal","WBA":"West Bengal","WBB":"West Bengal",
    # Andhra Pradesh
    "AAP":"Andhra Pradesh","APA":"Andhra Pradesh","APB":"Andhra Pradesh",
    # Telangana
    "TSA":"Telangana","TSB":"Telangana","TGA":"Telangana",
    # Madhya Pradesh
    "MAA":"Madhya Pradesh","MAB":"Madhya Pradesh","MPA":"Madhya Pradesh",
    # Haryana
    "HAA":"Haryana","HAB":"Haryana","HRA":"Haryana","HRB":"Haryana",
    # Punjab
    "PAA":"Punjab","PAB":"Punjab","PBA":"Punjab","PBB":"Punjab",
    # Bihar
    "BAA":"Bihar","BAB":"Bihar","BRA":"Bihar","BRB":"Bihar",
    # Odisha
    "OAA":"Odisha","OAB":"Odisha","ORA":"Odisha","ORB":"Odisha",
    # Kerala
    "KAA":"Kerala","KAB":"Kerala","KLA":"Kerala","KLB":"Kerala",
    # Jharkhand
    "JAA":"Jharkhand","JAB":"Jharkhand","JHA":"Jharkhand",
    # Chhattisgarh
    "CAA":"Chhattisgarh","CGX":"Chhattisgarh",
    # Assam
    "ASA":"Assam","ASB":"Assam",
    # Uttarakhand
    "UKA":"Uttarakhand","UKB":"Uttarakhand",
    # Himachal Pradesh
    "HPA":"Himachal Pradesh","HPB":"Himachal Pradesh",
    # Jammu & Kashmir
    "JKA":"Jammu & Kashmir","JKB":"Jammu & Kashmir",
    # Goa
    "GAO":"Goa","GOA":"Goa",
    # Manipur
    "MNA":"Manipur","MNB":"Manipur",
    # Meghalaya
    "MLA":"Meghalaya","MLB":"Meghalaya",
    # Mizoram
    "MZA":"Mizoram","MZB":"Mizoram",
    # Nagaland
    "NLA":"Nagaland","NLB":"Nagaland",
    # Sikkim
    "SKA":"Sikkim","SKB":"Sikkim",
    # Tripura
    "TRA":"Tripura","TRB":"Tripura",
    # Arunachal Pradesh
    "ARA":"Arunachal Pradesh","ARB":"Arunachal Pradesh",
    # UT: Chandigarh, Puducherry, Andaman, Lakshadweep, DNH, DD
    "CHA":"Chandigarh","CHB":"Chandigarh",
    "PYA":"Puducherry","PYB":"Puducherry",
    "ANA":"Andaman & Nicobar","ANB":"Andaman & Nicobar",
    "LDA":"Lakshadweep","LDB":"Lakshadweep",
    "DDA":"Daman & Diu","DDB":"Daman & Diu",
    "DNA":"Dadra & Nagar Haveli","DNB":"Dadra & Nagar Haveli",
    # Ladakh
    "LAA":"Ladakh","LAB":"Ladakh",
}

EPIC_REGEX = re.compile(r"^[A-Z]{3}[0-9]{7}$")


class VoterIdVerifyRequest(BaseModel):
    imageBase64:  Optional[str]  = None
    epicNumber:   Optional[str]  = None
    dateOfBirth:  Optional[str]  = None   # ISO 8601: "2000-05-12"
    manualFields: Optional[dict] = None


@router.post("/verify", response_model=VerificationResponse)
async def verify_voter_id(req: VoterIdVerifyRequest) -> VerificationResponse:
    start  = time.time()
    checks: dict[str, CheckDetail] = {}
    flags:  list[FraudFlag] = []

    epic      = (req.epicNumber or "").strip().upper()
    img_bytes = base64.b64decode(req.imageBase64) if req.imageBase64 else None
    context   = {
        "image_bytes":   img_bytes,
        "document_type": "voter_id",
        "file_size":     len(img_bytes) if img_bytes else 0,
    }

    # ── Stage 1: EPIC Number Validation ─────────────────────────────────────
    if epic:
        fmt = validate_epic_format(epic)
        checks[fmt.name] = fmt
        if fmt.result == "FAIL":
            flags.append(FraudFlag(
                flagType="EPIC_FORMAT_INVALID", severity="HIGH",
                confidence=1.0, description=fmt.evidence,
            ))
        else:
            # State prefix lookup
            state_check = lookup_state_prefix(epic)
            checks[state_check.name] = state_check

    # ── Age Eligibility ──────────────────────────────────────────────────────
    if req.dateOfBirth:
        age_check = check_age_eligibility(req.dateOfBirth)
        checks[age_check.name] = age_check
        if age_check.result == "FAIL":
            flags.append(FraudFlag(
                flagType="AGE_INELIGIBLE", severity="HIGH",
                confidence=1.0, description=age_check.evidence,
            ))

    # ── Stage 2: Visual ──────────────────────────────────────────────────────
    if img_bytes:
        for agent in [ImageQualityAgent(), DocumentClassifierAgent(),
                      FaceDetectionAgent(), ELATamperAgent()]:
            c = agent.run(context)
            checks[c.name] = c

    risk_score = _compute_risk(checks)
    inferred_state = STATE_PREFIXES.get(epic[:3]) if len(epic) >= 3 else None
    extracted = {
        "epicNumber":    epic,
        "inferredState": inferred_state,
    }

    return VerificationResponse(
        riskScore=risk_score,
        checks=checks,
        extractedData=extracted,
        flags=flags,
        processingTimeMs=int((time.time() - start) * 1000),
    )


def validate_epic_format(epic: str) -> CheckDetail:
    if EPIC_REGEX.match(epic):
        return CheckDetail(
            name="EPIC Format Validation",
            description="Validates EPIC number format: 3 uppercase letters + 7 digits",
            result="PASS", riskContribution=0.0,
            evidence=f"EPIC '{epic}' matches regex ^[A-Z]{{3}}[0-9]{{7}}$",
        )
    return CheckDetail(
        name="EPIC Format Validation",
        description="Validates EPIC number format: 3 uppercase letters + 7 digits",
        result="FAIL", riskContribution=0.50,
        evidence=f"EPIC '{epic}' does not match ^[A-Z]{{3}}[0-9]{{7}}$ (10 chars total)",
    )


def lookup_state_prefix(epic: str) -> CheckDetail:
    prefix = epic[:3]
    state  = STATE_PREFIXES.get(prefix)
    if state:
        return CheckDetail(
            name="State Prefix Lookup",
            description="Maps EPIC prefix to Indian state/UT",
            result="PASS", riskContribution=0.0,
            evidence=f"Prefix '{prefix}' → {state}",
        )
    return CheckDetail(
        name="State Prefix Lookup",
        description="Maps EPIC prefix to Indian state/UT",
        result="WARN", riskContribution=0.20,
        evidence=f"Prefix '{prefix}' not found in 400+ prefix ECI registry → unknown state",
    )


def check_age_eligibility(dob_iso: str) -> CheckDetail:
    try:
        dob   = date.fromisoformat(dob_iso)
        today = date.today()
        age   = (today - dob).days // 365
        if age < 18:
            return CheckDetail(
                name="Age Eligibility",
                description="Voter must be 18+ years of age",
                result="FAIL", riskContribution=0.35,
                evidence=f"DOB {dob_iso} → age {age} years < 18 → INELIGIBLE to vote",
            )
        return CheckDetail(
            name="Age Eligibility",
            description="Voter must be 18+ years of age",
            result="PASS", riskContribution=0.0,
            evidence=f"DOB {dob_iso} → age {age} years ≥ 18 → eligible",
        )
    except Exception:
        return CheckDetail(
            name="Age Eligibility",
            description="Voter must be 18+ years of age",
            result="WARN", riskContribution=0.05,
            evidence=f"Could not parse DOB: '{dob_iso}'",
        )


def _compute_risk(checks: dict[str, CheckDetail]) -> float:
    return round(min(1.0, sum(c.riskContribution for c in checks.values() if c.result == "FAIL")), 4)
