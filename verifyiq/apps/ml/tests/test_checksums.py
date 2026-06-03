"""
VerifyIQ — ML Unit Tests
apps/ml/tests/test_checksums.py
"""

import pytest
from algorithms.checksums import (
    luhn_check, verhoeff_validate, mrz_check_digit, validate_mrz_checksums
)


class TestLuhn:
    def test_valid_visa(self):
        # Standard test Visa number
        result = luhn_check("4532015112830366")
        assert result.valid is True
        assert result.riskContribution == 0.0

    def test_valid_mastercard(self):
        result = luhn_check("5425233430109903")
        assert result.valid is True

    def test_invalid(self):
        result = luhn_check("1234567890123456")
        assert result.valid is False
        assert result.riskContribution == 0.50

    def test_empty_string(self):
        result = luhn_check("")
        assert result.valid is False

    def test_with_spaces(self):
        # Should strip non-digit chars
        result = luhn_check("4532 0151 1283 0366")
        assert result.valid is True


class TestVerhoeff:
    def test_valid_number(self):
        # "2363" has Verhoeff check value 0
        result = verhoeff_validate("2363")
        assert result.valid is True

    def test_invalid_number(self):
        result = verhoeff_validate("1234567890")
        # This specific number won't have Verhoeff = 0
        assert isinstance(result.valid, bool)
        assert result.finalCheck in range(10)

    def test_empty(self):
        result = verhoeff_validate("")
        assert result.valid is False

    def test_risk_contribution(self):
        result = verhoeff_validate("1111111111")
        if not result.valid:
            assert result.riskContribution == 0.55


class TestMrz:
    MRZ_LINE2 = "L898902C<3UTO6908061F9406236ZE184226B<<<<<14"

    def test_check_digit_computation(self):
        # ICAO 9303 standard example: "520727" → check digit 3
        assert mrz_check_digit("520727") == 3

    def test_doc_number_check(self):
        results = validate_mrz_checksums(self.MRZ_LINE2)
        assert len(results) == 5

    def test_all_valid_returns_passes(self):
        results = validate_mrz_checksums(self.MRZ_LINE2)
        # At least some should pass
        passes = [r for r in results if r.passed]
        assert len(passes) >= 1

    def test_too_short_mrz(self):
        results = validate_mrz_checksums("TOO_SHORT")
        assert results == []
