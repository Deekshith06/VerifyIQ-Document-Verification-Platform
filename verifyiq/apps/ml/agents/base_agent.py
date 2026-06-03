"""
VerifyIQ — Base Agent
apps/ml/agents/base_agent.py
"""

from __future__ import annotations
from abc import ABC, abstractmethod
from schemas.responses import CheckDetail


class BaseAgent(ABC):
    """Abstract base for all verification agents."""
    name: str = "Base Agent"
    description: str = "Base verification check"

    @abstractmethod
    def run(self, context: dict) -> CheckDetail:
        """Execute check. Always returns a CheckDetail with evidence."""
        ...

    def _pass(self, evidence: str, detail: str | None = None) -> CheckDetail:
        return CheckDetail(
            name=self.name,
            description=self.description,
            result="PASS",
            riskContribution=0.0,
            evidence=evidence,
            technicalDetail=detail,
        )

    def _fail(self, evidence: str, risk: float, detail: str | None = None) -> CheckDetail:
        return CheckDetail(
            name=self.name,
            description=self.description,
            result="FAIL",
            riskContribution=round(risk, 3),
            evidence=evidence,
            technicalDetail=detail,
        )

    def _warn(self, evidence: str, risk: float = 0.0, detail: str | None = None) -> CheckDetail:
        return CheckDetail(
            name=self.name,
            description=self.description,
            result="WARN",
            riskContribution=round(risk, 3),
            evidence=evidence,
            technicalDetail=detail,
        )

    def _na(self, reason: str) -> CheckDetail:
        return CheckDetail(
            name=self.name,
            description=self.description,
            result="N/A",
            riskContribution=0.0,
            evidence=reason,
        )
