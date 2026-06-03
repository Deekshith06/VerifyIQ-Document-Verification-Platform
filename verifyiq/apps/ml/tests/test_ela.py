"""
VerifyIQ — ELA Algorithm Tests
apps/ml/tests/test_ela.py
"""

import io
import pytest
import numpy as np
from PIL import Image
from algorithms.ela import compute_ela, get_ela_score, prepare_ela_for_onnx


def make_test_image(width: int = 256, height: int = 256, color=(200, 150, 100)) -> bytes:
    img = Image.new("RGB", (width, height), color)
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=95)
    return buf.getvalue()


class TestComputeEla:
    def test_returns_uint8_array(self):
        img = make_test_image()
        ela = compute_ela(img)
        assert ela.dtype == np.uint8
        assert ela.ndim == 3
        assert ela.shape[2] == 3

    def test_same_size_as_input(self):
        img = make_test_image(300, 200)
        ela = compute_ela(img)
        assert ela.shape[0] == 200
        assert ela.shape[1] == 300


class TestGetElaScore:
    def test_uniform_image_low_score(self):
        img  = make_test_image()
        ela  = compute_ela(img)
        score = get_ela_score(ela)
        assert 0.0 <= score <= 1.0

    def test_roi_parameter(self):
        img  = make_test_image()
        ela  = compute_ela(img)
        score_full = get_ela_score(ela)
        score_roi  = get_ela_score(ela, roi=(0, 0, 50, 50))
        assert isinstance(score_roi, float)

    def test_empty_roi_returns_zero(self):
        ela = np.zeros((100, 100, 3), dtype=np.uint8)
        score = get_ela_score(ela, roi=(0, 0, 0, 0))
        assert score == 0.0


class TestPrepareForOnnx:
    def test_output_shape(self):
        img = make_test_image()
        ela = compute_ela(img)
        inp = prepare_ela_for_onnx(ela)
        assert inp.shape == (1, 3, 224, 224)

    def test_output_dtype(self):
        img = make_test_image()
        ela = compute_ela(img)
        inp = prepare_ela_for_onnx(ela)
        assert inp.dtype == np.float32

    def test_values_in_range(self):
        img = make_test_image()
        ela = compute_ela(img)
        inp = prepare_ela_for_onnx(ela)
        assert 0.0 <= inp.min() and inp.max() <= 1.0
