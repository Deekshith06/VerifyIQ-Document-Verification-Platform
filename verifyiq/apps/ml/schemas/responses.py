"""
VerifyIQ — Pydantic Response Schemas
apps/ml/schemas/responses.py
"""

from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field


class CheckDetail(BaseModel):
    name: str
    description: str
    result: Literal["PASS", "FAIL", "WARN", "N/A"]
    riskContribution: float = Field(ge=0.0, le=1.0)
    evidence: str
    technicalDetail: Optional[str] = None


class FraudFlag(BaseModel):
    flagType: str
    severity: Literal["HIGH", "MEDIUM", "LOW"]
    confidence: float
    description: str
    evidence: Optional[str] = None


class VerificationResponse(BaseModel):
    riskScore: float = Field(ge=0.0, le=1.0)
    checks: dict[str, CheckDetail]
    extractedData: dict = {}
    flags: list[FraudFlag] = []
    modelVersion: str = "v2.0.0"
    processingTimeMs: int = 0
