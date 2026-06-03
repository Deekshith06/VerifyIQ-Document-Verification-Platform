"""
VerifyIQ — Credit Card Verification Router
apps/ml/routers/credit_card.py

PCI-DSS: Full PAN never stored. Only last 4 + BIN returned.
"""

from __future__ import annotations
import re
import time
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
from schemas.responses import CheckDetail, FraudFlag, VerificationResponse
from agents.agents import (
    ImageQualityAgent, DocumentClassifierAgent, ELATamperAgent,
    LuhnChecksumAgent, RiskScorerAgent,
)

router = APIRouter()

# ── Card Network Regexes ────────────────────────────────────────────────────
NETWORK_PATTERNS = {
    "VISA":       re.compile(r"^4[0-9]{15}$"),
    "MASTERCARD": re.compile(r"^5[1-5][0-9]{14}$|^2[2-7][0-9]{14}$"),
    "AMEX":       re.compile(r"^3[47][0-9]{13}$"),
    "RUPAY":      re.compile(r"^6[0-9]{15}$"),
}


class CreditCardVerifyRequest(BaseModel):
    imageBase64: Optional[str] = None
    cardNumber:  Optional[str] = None
    expiryMonth: Optional[int] = None
    expiryYear:  Optional[int] = None
    cvv:         Optional[str] = None
    manualFields: Optional[dict] = None


@router.post("/verify", response_model=VerificationResponse)
async def verify_credit_card(req: CreditCardVerifyRequest) -> VerificationResponse:
    start = time.time()
    checks: dict[str, CheckDetail] = {}
    flags:  list[FraudFlag] = []

    img_bytes = (
        __import__("base64").b64decode(req.imageBase64)
        if req.imageBase64 else None
    )
    context = {
        "image_bytes":   img_bytes,
        "document_type": "credit_card",
        "card_number":   req.cardNumber or "",
        "file_size":     len(img_bytes) if img_bytes else 0,
    }

    # ── Stage 1: Image Quality ──────────────────────────────────────────────
    if img_bytes:
        qc = ImageQualityAgent().run(context)
        checks[qc.name] = qc
        dc = DocumentClassifierAgent().run(context)
        checks[dc.name] = dc

    # ── Stage 2: Luhn Checksum ──────────────────────────────────────────────
    if req.cardNumber:
        luhn = LuhnChecksumAgent().run(context)
        checks[luhn.name] = luhn
        if luhn.result == "FAIL":
            flags.append(FraudFlag(
                flagType="LUHN_FAIL", severity="HIGH",
                confidence=0.95, description="Luhn checksum invalid",
                evidence=luhn.evidence,
            ))

        # Network detection
        network, net_check = detect_network(req.cardNumber)
        checks[net_check.name] = net_check

        # Expiry validation
        if req.expiryMonth and req.expiryYear:
            exp_check = validate_expiry(req.expiryMonth, req.expiryYear)
            checks[exp_check.name] = exp_check
            if exp_check.result == "FAIL":
                flags.append(FraudFlag(
                    flagType="CARD_EXPIRED", severity="HIGH",
                    confidence=1.0, description="Card has expired",
                    evidence=exp_check.evidence,
                ))

    # ── Stage 3: Visual / ELA ──────────────────────────────────────────────
    if img_bytes:
        ela = ELATamperAgent().run(context)
        checks[ela.name] = ela
        if ela.result == "FAIL":
            flags.append(FraudFlag(
                flagType="TAMPER_DETECTED", severity="HIGH",
                confidence=0.85, description="ELA tamper detected",
                evidence=ela.evidence,
            ))

    # ── Stage 4: Risk Score ─────────────────────────────────────────────────
    context["checks"] = list(checks.values())
    risk_check = RiskScorerAgent().run(context)
    risk_score = _compute_risk(checks)

    # ── Extracted data (PCI-DSS: mask PAN) ─────────────────────────────────
    card_num = req.cardNumber or ""
    extracted = {
        "maskedPan":  mask_pan(card_num),
        "lastFour":   card_num[-4:] if len(card_num) >= 4 else "",
        "bin":        card_num[:6] if len(card_num) >= 6 else "",
        "network":    detect_network(card_num)[0] if card_num else "UNKNOWN",
        "expiryMonth": req.expiryMonth,
        "expiryYear":  req.expiryYear,
    }

    return VerificationResponse(
        riskScore=risk_score,
        checks=checks,
        extractedData=extracted,
        flags=flags,
        processingTimeMs=int((time.time() - start) * 1000),
    )


def detect_network(card_number: str) -> tuple[str, CheckDetail]:
    clean = re.sub(r"\D", "", card_number)
    for name, pattern in NETWORK_PATTERNS.items():
        if pattern.match(clean):
            check = CheckDetail(
                name="Network Detection", description="Identifies card network",
                result="PASS", riskContribution=0.0,
                evidence=f"Card identified as {name} ({len(clean)} digits)",
            )
            return name, check
    check = CheckDetail(
        name="Network Detection", description="Identifies card network",
        result="WARN", riskContribution=0.05,
        evidence=f"Unknown card network for number starting {clean[:4] if clean else '?'}",
    )
    return "UNKNOWN", check


def validate_expiry(month: int, year: int) -> CheckDetail:
    from datetime import date
    try:
        today = date.today()
        exp_year  = year if year > 2000 else 2000 + year
        # Card valid through end of expiry month
        if year < today.year or (exp_year == today.year and month < today.month):
            return CheckDetail(
                name="Expiry Validation", description="Checks card expiry date",
                result="FAIL", riskContribution=0.30,
                evidence=f"Card expired: {month:02d}/{exp_year} < current {today.month:02d}/{today.year}",
            )
        if exp_year > today.year + 10:
            return CheckDetail(
                name="Expiry Validation", description="Checks card expiry date",
                result="WARN", riskContribution=0.10,
                evidence=f"Suspiciously far expiry: {month:02d}/{exp_year} (>10 years)",
            )
        return CheckDetail(
            name="Expiry Validation", description="Checks card expiry date",
            result="PASS", riskContribution=0.0,
            evidence=f"Card valid through {month:02d}/{exp_year}",
        )
    except Exception:
        return CheckDetail(
            name="Expiry Validation", description="Checks card expiry date",
            result="WARN", riskContribution=0.05,
            evidence="Could not parse expiry date",
        )


def mask_pan(card_number: str) -> str:
    clean = re.sub(r"\D", "", card_number)
    if len(clean) < 4:
        return "**** **** **** ?????"
    return f"**** **** **** {clean[-4:]}"


def _compute_risk(checks: dict[str, CheckDetail]) -> float:
    total = sum(c.riskContribution for c in checks.values() if c.result == "FAIL")
    return round(min(1.0, total), 4)
