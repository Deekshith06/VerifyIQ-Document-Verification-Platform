"""
VerifyIQ — Algorithm Implementations
apps/ml/algorithms/checksums.py

Pure Python — zero external dependencies.
Luhn (credit card), Verhoeff (Aadhaar), MRZ Mod-97 (passport).
"""

from __future__ import annotations
from dataclasses import dataclass


# ─── Luhn Algorithm (Credit Card) ────────────────────────────────────────────

@dataclass
class LuhnResult:
    valid: bool
    checkDigit: int
    computedSum: int
    riskContribution: float
    evidence: str


def luhn_check(card_number: str) -> LuhnResult:
    """
    ISO/IEC 7812 Luhn mod-10 checksum.
    Used for credit/debit card number validation.
    """
    digits = [int(c) for c in card_number if c.isdigit()]
    if not digits:
        return LuhnResult(False, 0, 0, 0.50, "No digits found in input")

    total = 0
    is_even = False
    for d in reversed(digits):
        if is_even:
            d *= 2
            if d > 9:
                d -= 9
        total += d
        is_even = not is_even

    valid = total % 10 == 0
    check_digit = digits[-1]
    contribution = 0.0 if valid else 0.50
    evidence = (
        f"Luhn sum: {total} → {'valid (mod 10 = 0)' if valid else f'INVALID (mod 10 = {total % 10})'}"
        f", check digit: {check_digit}"
    )
    return LuhnResult(valid, check_digit, total, contribution, evidence)


# ─── Verhoeff Algorithm (Aadhaar) ────────────────────────────────────────────

_V_D = [
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
]
_V_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]


@dataclass
class VerhoeffResult:
    valid: bool
    finalCheck: int
    riskContribution: float
    evidence: str


def verhoeff_validate(number: str) -> VerhoeffResult:
    """
    Verhoeff checksum — used by UIDAI for Aadhaar numbers.
    A valid Aadhaar's Verhoeff check produces a final value of 0.
    """
    digits = [int(c) for c in number if c.isdigit()]
    if not digits:
        return VerhoeffResult(False, -1, 0.55, "No digits found in input")

    c = 0
    for i, digit in enumerate(reversed(digits)):
        p_val = _V_P[i % 8][digit]
        c = _V_D[c][p_val]

    valid = c == 0
    contribution = 0.0 if valid else 0.55
    evidence = f"Verhoeff final value: {c} (expected 0) → {'VALID' if valid else 'INVALID'}"
    return VerhoeffResult(valid, c, contribution, evidence)


# ─── MRZ Checksum (Passport) — ICAO 9303 ─────────────────────────────────────

_MRZ_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<"
_MRZ_WEIGHTS = [7, 3, 1]


def mrz_check_digit(field: str) -> int:
    """
    ICAO 9303 checksum — returns expected single check digit (0–9).
    Used for: document number, DOB, expiry, personal number, composite.
    """
    return sum(
        _MRZ_CHARS.index(c) * _MRZ_WEIGHTS[i % 3]
        for i, c in enumerate(field.upper())
        if c in _MRZ_CHARS
    ) % 10


@dataclass
class MrzChecksumResult:
    field: str
    computed: int
    expected: int
    passed: bool
    riskContribution: float
    evidence: str


def validate_mrz_checksums(line2: str) -> list[MrzChecksumResult]:
    """
    Validate all 5 ICAO 9303 MRZ checksums in line 2 of the MRZ.
    Line 2 format: [DOCNO9][CHK][NAT3][DOB6][CHK][SEX][EXPIRY6][CHK][PERSONAL14][CHK][COMPOSITE][CHK]
    """
    if len(line2) < 44:
        return []

    checks = [
        ("Document Number",  line2[0:9],                                  int(line2[9])),
        ("Date of Birth",    line2[13:19],                                 int(line2[19])),
        ("Expiry Date",      line2[21:27],                                 int(line2[27])),
        ("Personal Number",  line2[28:42],                                 int(line2[42])),
        ("Composite",        line2[0:10] + line2[13:20] + line2[21:43],   int(line2[43])),
    ]

    results = []
    for field_name, data, expected in checks:
        computed = mrz_check_digit(data)
        passed = computed == expected
        results.append(MrzChecksumResult(
            field=field_name,
            computed=computed,
            expected=expected,
            passed=passed,
            riskContribution=0.0 if passed else 0.60,
            evidence=f"MRZ {field_name}: field='{data}', computed={computed}, expected={expected} → {'PASS' if passed else 'FAIL'}",
        ))
    return results
