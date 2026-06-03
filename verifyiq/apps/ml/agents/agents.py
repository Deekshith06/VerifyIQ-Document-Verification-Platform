"""
VerifyIQ — All 8 Verification Agents
apps/ml/agents/agents.py

Each agent is an independent unit with run() → CheckDetail.
All ONNX calls use ModelRegistry.get() — models loaded at startup only.
"""

from __future__ import annotations
import re
import base64
from io import BytesIO
from datetime import date, datetime

import numpy as np
from PIL import Image

from agents.base_agent import BaseAgent
from algorithms.checksums import luhn_check, verhoeff_validate, validate_mrz_checksums
from algorithms.ela import compute_ela, get_ela_score, prepare_ela_for_onnx
from models.model_registry import ModelRegistry
from schemas.responses import CheckDetail


# ─── 1. Document Classifier Agent ────────────────────────────────────────────

class DocumentClassifierAgent(BaseAgent):
    """EfficientNet-B0 classifies the document type. Confirms expected type."""
    name = "Document Classification"
    description = "AI model confirms the document type matches the claimed type"

    def run(self, context: dict) -> CheckDetail:
        img_bytes: bytes | None = context.get("image_bytes")
        expected_type: str = context.get("document_type", "unknown")

        if not img_bytes:
            return self._na("No image provided — classification skipped")

        session = ModelRegistry.get("classifier")
        if session is None:
            return self._warn("classifier.onnx not loaded — skipping visual classification", 0.0,
                              "Download models via scripts/download_models.sh")

        # Preprocess: resize to 224×224, normalize
        img = Image.open(BytesIO(img_bytes)).convert("RGB").resize((224, 224))
        arr = np.array(img, dtype=np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406])
        std  = np.array([0.229, 0.224, 0.225])
        arr  = (arr - mean) / std
        inp  = arr.transpose(2, 0, 1)[np.newaxis, ...].astype(np.float32)

        logits = session.run(None, {"image": inp})[0][0]
        probs  = self._softmax(logits)

        classes = ["credit_card", "passport", "aadhaar", "voter_id", "driving_licence", "unknown"]
        predicted = classes[int(np.argmax(probs))]
        confidence = float(probs[int(np.argmax(probs))])

        expected_normalized = expected_type.lower().replace("_", " ").replace("driving_licence", "driving_licence")
        match = predicted == expected_type.lower().replace(" ", "_")

        if confidence < 0.70:
            return self._warn(
                f"Low classification confidence: {confidence:.2f} → {predicted}. Review recommended.",
                0.05,
            )
        if match:
            return self._pass(f"Document classified as '{predicted}' (confidence: {confidence:.2f})")
        return self._fail(
            f"Expected '{expected_type}', classified as '{predicted}' (confidence: {confidence:.2f})",
            0.20,
        )

    @staticmethod
    def _softmax(x: np.ndarray) -> np.ndarray:
        e = np.exp(x - x.max())
        return e / e.sum()


# ─── 2. ELA Tamper Detection Agent ───────────────────────────────────────────

class ELATamperAgent(BaseAgent):
    """Detects image manipulation via JPEG Error Level Analysis + CNN."""
    name = "ELA Tamper Detection"
    description = "Detects copy-paste or pixel manipulation via recompression analysis"

    THRESHOLD = 0.60

    def run(self, context: dict) -> CheckDetail:
        img_bytes: bytes | None = context.get("image_bytes")
        if not img_bytes:
            return self._na("No image provided")

        ela_map = compute_ela(img_bytes)
        ela_score = get_ela_score(ela_map)

        session = ModelRegistry.get("tamper_cnn")
        if session is None:
            # Fall back to raw ELA score without CNN
            if ela_score > 0.55:
                return self._fail(
                    f"ELA score {ela_score:.3f} exceeds threshold (ELA-only, no CNN)",
                    round(ela_score * 0.40, 3),
                    "tamper_cnn.onnx not loaded — using raw ELA score",
                )
            return self._pass(
                f"ELA score {ela_score:.3f} within normal range",
                "tamper_cnn.onnx not loaded — using raw ELA score",
            )

        inp = prepare_ela_for_onnx(ela_map)
        logits = session.run(None, {"input": inp})[0][0]
        e = np.exp(logits - logits.max())
        probs = e / e.sum()
        tamper_prob = float(probs[1])

        if tamper_prob >= self.THRESHOLD:
            return self._fail(
                f"Tamper probability: {tamper_prob:.3f} ≥ threshold {self.THRESHOLD} → TAMPER_DETECTED",
                round(tamper_prob * 0.40, 3),
                f"ELA score: {ela_score:.3f}, CNN tamper prob: {tamper_prob:.3f}",
            )
        return self._pass(
            f"Tamper probability: {tamper_prob:.3f} < threshold {self.THRESHOLD} → authentic",
            f"ELA score: {ela_score:.3f}",
        )


# ─── 3. Face Detection Agent ─────────────────────────────────────────────────

class FaceDetectionAgent(BaseAgent):
    """RetinaFace-MobileNet detects face presence and quality in document."""
    name = "Face Detection"
    description = "Verifies face is present and meets quality standards (RetinaFace offline)"

    MIN_QUALITY = 0.85

    def run(self, context: dict) -> CheckDetail:
        img_bytes: bytes | None = context.get("image_bytes")
        if not img_bytes:
            return self._na("No image provided")

        session = ModelRegistry.get("face_detector")
        if session is None:
            return self._warn(
                "face_detector.onnx not loaded — face check skipped",
                0.10,
                "Download models via scripts/download_models.sh",
            )

        # Simplified: run model and check output scores
        img = Image.open(BytesIO(img_bytes)).convert("RGB")
        w, h = img.size
        pad_w = (32 - w % 32) % 32
        pad_h = (32 - h % 32) % 32
        padded = Image.new("RGB", (w + pad_w, h + pad_h), (0, 0, 0))
        padded.paste(img, (0, 0))

        arr = np.array(padded, dtype=np.float32).transpose(2, 0, 1)[np.newaxis, ...]

        try:
            outputs = session.run(None, {"input": arr})
            # RetinaFace output[0] = confidence scores
            scores = outputs[0].flatten()
            max_score = float(scores.max()) if len(scores) > 0 else 0.0
            face_detected = max_score > 0.5

            if not face_detected:
                return self._fail(
                    f"No face detected (max confidence: {max_score:.3f})",
                    0.30,
                )
            if max_score < self.MIN_QUALITY:
                return self._warn(
                    f"Face detected but quality score {max_score:.3f} < {self.MIN_QUALITY} minimum",
                    0.10,
                )
            return self._pass(
                f"Face detected with confidence {max_score:.3f} ≥ {self.MIN_QUALITY} quality threshold"
            )
        except Exception as e:
            return self._warn(f"Face detection error: {type(e).__name__}", 0.10)


# ─── 4. Checksum Validation Agent ────────────────────────────────────────────

class LuhnChecksumAgent(BaseAgent):
    """Validates credit card number via Luhn mod-10 algorithm."""
    name = "Luhn Checksum"
    description = "Validates card number mathematical integrity (ISO/IEC 7812)"

    def run(self, context: dict) -> CheckDetail:
        card_number: str | None = context.get("card_number")
        if not card_number:
            return self._na("No card number provided")

        result = luhn_check(card_number)
        if result.valid:
            return self._pass(result.evidence, f"Check digit: {result.checkDigit}")
        return self._fail(result.evidence, result.riskContribution,
                          f"Sum: {result.computedSum}, mod 10: {result.computedSum % 10}")


class VerhoeffChecksumAgent(BaseAgent):
    """Validates Aadhaar number via Verhoeff checksum algorithm."""
    name = "Verhoeff Checksum"
    description = "Validates Aadhaar number using UIDAI Verhoeff algorithm"

    def run(self, context: dict) -> CheckDetail:
        number: str | None = context.get("aadhaar_number")
        if not number:
            return self._na("No Aadhaar number provided")

        result = verhoeff_validate(number)
        if result.valid:
            return self._pass(result.evidence, "Verhoeff final value = 0 (expected)")
        return self._fail(result.evidence, result.riskContribution,
                          f"Final Verhoeff value: {result.finalCheck} (must be 0)")


class MrzChecksumAgent(BaseAgent):
    """Validates all 5 ICAO 9303 MRZ checksums in a passport."""
    name = "MRZ Checksum"
    description = "Validates all 5 ICAO 9303 MRZ checksums (document number, DOB, expiry, personal number, composite)"

    def run(self, context: dict) -> CheckDetail:
        mrz_line2: str | None = context.get("mrz_line2")
        if not mrz_line2:
            return self._na("No MRZ line 2 provided")

        results = validate_mrz_checksums(mrz_line2)
        failures = [r for r in results if not r.passed]

        if not results:
            return self._warn("MRZ too short to validate", 0.30)

        if not failures:
            return self._pass(
                f"All {len(results)} MRZ checksums valid",
                f"Validated: {', '.join(r.field for r in results)}",
            )

        fail_names = ", ".join(f.field for f in failures)
        total_risk = min(0.60, sum(f.riskContribution for f in failures))
        evidences  = " | ".join(r.evidence for r in failures)
        return self._fail(
            f"MRZ checksum FAILED for: {fail_names} — {evidences}",
            total_risk,
            f"{len(failures)}/{len(results)} checksums failed",
        )


# ─── 5. UIDAI QR Signature Agent ─────────────────────────────────────────────

class QRSignatureAgent(BaseAgent):
    """RSA-2048 verification of Aadhaar Secure QR signature using bundled UIDAI key."""
    name = "UIDAI QR Signature"
    description = "Verifies Aadhaar QR digital signature via bundled UIDAI RSA-2048 public key"

    def run(self, context: dict) -> CheckDetail:
        qr_payload: bytes | None = context.get("qr_payload")
        if not qr_payload:
            return self._na("No QR payload available")

        try:
            from pathlib import Path
            from cryptography.hazmat.primitives import hashes, serialization
            from cryptography.hazmat.primitives.asymmetric import padding

            key_path = Path(__file__).parent.parent / "keys" / "uidai_public_key.pem"
            if not key_path.exists():
                return self._warn(
                    "UIDAI public key not found — QR signature verification skipped",
                    0.20,
                    f"Expected: {key_path}",
                )

            public_key = serialization.load_pem_public_key(key_path.read_bytes())
            data, signature = qr_payload[:-256], qr_payload[-256:]
            public_key.verify(signature, data, padding.PKCS1v15(), hashes.SHA256())  # type: ignore[union-attr]

            return self._pass("RSA-2048 + SHA-256 QR signature verified — UIDAI authentic")
        except Exception as e:
            return self._fail(
                f"QR signature invalid: {type(e).__name__} — document likely forged or QR tampered",
                0.60,
                "UIDAI RSA-2048 signature verification failed",
            )


# ─── 6. Cross-Validation Agent ───────────────────────────────────────────────

class CrossValidationAgent(BaseAgent):
    """Compares OCR-extracted fields against QR/manual fields using Levenshtein distance."""
    name = "QR↔OCR Cross-Validation"
    description = "Compares scanned data against QR payload via fuzzy string matching"

    THRESHOLD = 0.20  # 20% edit distance threshold

    def run(self, context: dict) -> CheckDetail:
        ocr_fields: dict = context.get("ocr_fields", {})
        qr_fields:  dict = context.get("qr_fields", {})

        if not ocr_fields or not qr_fields:
            return self._na("Insufficient fields for cross-validation")

        mismatches = []
        for key in set(ocr_fields) & set(qr_fields):
            ocr_val = str(ocr_fields[key]).strip().lower()
            qr_val  = str(qr_fields[key]).strip().lower()
            dist    = self._levenshtein(ocr_val, qr_val)
            max_len = max(len(ocr_val), len(qr_val), 1)
            ratio   = dist / max_len
            if ratio > self.THRESHOLD:
                mismatches.append(f"'{key}': OCR='{ocr_fields[key]}' vs QR='{qr_fields[key]}' ({ratio:.0%} mismatch)")

        if not mismatches:
            return self._pass(
                f"All {len(ocr_fields & qr_fields.keys())} common fields match within {self.THRESHOLD:.0%} tolerance"
            )

        return self._fail(
            f"Field mismatches: {'; '.join(mismatches)}",
            0.35,
            f"{len(mismatches)} field(s) exceed {self.THRESHOLD:.0%} Levenshtein distance threshold",
        )

    @staticmethod
    def _levenshtein(a: str, b: str) -> int:
        if not a:
            return len(b)
        if not b:
            return len(a)
        prev = list(range(len(b) + 1))
        for i, ca in enumerate(a):
            curr = [i + 1]
            for j, cb in enumerate(b):
                curr.append(min(prev[j + 1] + 1, curr[j] + 1, prev[j] + (ca != cb)))
            prev = curr
        return prev[-1]


# ─── 7. Risk Scorer Agent ────────────────────────────────────────────────────

class RiskScorerAgent(BaseAgent):
    """
    XGBoost risk scorer (risk_scorer.onnx, 47 features).
    Aggregates all check results into a final 0.0–1.0 risk score.
    Falls back to weighted sum if model not loaded.
    """
    name = "Risk Scorer"
    description = "XGBoost ensemble model computes final risk score from all check results"

    def run(self, context: dict) -> CheckDetail:
        checks: list[CheckDetail] = context.get("checks", [])
        if not checks:
            return self._warn("No checks provided to Risk Scorer", 0.5)

        # Build feature vector from checks
        features = self._build_features(checks, context)
        session  = ModelRegistry.get("risk_scorer")

        if session is not None:
            try:
                inp = np.array([features], dtype=np.float32)
                score = float(session.run(None, {"features": inp})[0][0])
            except Exception:
                score = self._weighted_sum(checks)
        else:
            score = self._weighted_sum(checks)

        score = round(min(1.0, max(0.0, score)), 4)
        return self._pass(
            f"Risk score computed: {score:.4f}",
            f"Features: {len(features)}, Model: {'ONNX' if session else 'weighted-sum'}",
        )

    @staticmethod
    def _weighted_sum(checks: list[CheckDetail]) -> float:
        total = sum(c.riskContribution for c in checks if c.result == "FAIL")
        return min(1.0, total)

    @staticmethod
    def _build_features(checks: list[CheckDetail], context: dict) -> list[float]:
        """Map check results to a 47-dim feature vector."""
        check_map = {c.name: c for c in checks}

        def b(name: str) -> float:
            c = check_map.get(name)
            return 1.0 if (c and c.result == "FAIL") else 0.0

        def s(name: str) -> float:
            c = check_map.get(name)
            return c.riskContribution if c else 0.0

        return [
            b("Luhn Checksum"), b("Verhoeff Checksum"), b("MRZ Checksum"),
            b("UIDAI QR Signature"), b("EPIC Format Validation"),
            b("Face Detection"), s("Face Detection"), s("ELA Tamper Detection"),
            s("ELA Tamper Detection"), b("Hologram Detection"), b("UIDAI Logo Detection"),
            s("Document Classification"), 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            float(context.get("file_size", 0)) / 1_000_000,
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
        ]


# ─── 8. Image Quality Agent ───────────────────────────────────────────────────

class ImageQualityAgent(BaseAgent):
    """Checks blur, resolution, and format before ML pipeline."""
    name = "Image Quality"
    description = "Validates image is sharp enough and high-resolution for accurate verification"

    BLUR_THRESHOLD   = 100.0
    MIN_WIDTH        = 640
    MIN_HEIGHT       = 400

    def run(self, context: dict) -> CheckDetail:
        img_bytes: bytes | None = context.get("image_bytes")
        if not img_bytes:
            return self._na("No image provided")

        try:
            import cv2
            img = Image.open(BytesIO(img_bytes)).convert("RGB")
            w, h = img.size
            arr  = np.array(img.convert("L"), dtype=np.float64)
            lap_var = float(cv2.Laplacian(arr, cv2.CV_64F).var())

            issues = []
            if lap_var < self.BLUR_THRESHOLD:
                issues.append(f"image too blurry (Laplacian var: {lap_var:.1f} < {self.BLUR_THRESHOLD})")
            if w < self.MIN_WIDTH or h < self.MIN_HEIGHT:
                issues.append(f"resolution {w}×{h} below minimum {self.MIN_WIDTH}×{self.MIN_HEIGHT}")

            if issues:
                return self._fail(
                    f"Image quality issues: {'; '.join(issues)}",
                    0.15,
                    f"Laplacian variance: {lap_var:.1f}, Size: {w}×{h}",
                )
            return self._pass(
                f"Image quality OK: {w}×{h}, blur score {lap_var:.1f}",
                f"Laplacian variance: {lap_var:.1f}",
            )
        except ImportError:
            # OpenCV not available — skip blur check
            img = Image.open(BytesIO(img_bytes))
            w, h = img.size
            if w < self.MIN_WIDTH or h < self.MIN_HEIGHT:
                return self._fail(f"Resolution {w}×{h} too low", 0.15)
            return self._pass(f"Resolution OK: {w}×{h} (blur check skipped — no OpenCV)")
