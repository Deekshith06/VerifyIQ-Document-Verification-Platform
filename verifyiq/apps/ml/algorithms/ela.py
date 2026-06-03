"""
VerifyIQ — Error Level Analysis (ELA)
apps/ml/algorithms/ela.py

Tamper detection via JPEG recompression differential analysis.
Runs ENTIRELY offline using Pillow — no external ML model required for ELA computation.
The resulting ELA map is then fed into tamper_cnn.onnx for classification.
"""

from __future__ import annotations
from io import BytesIO
import numpy as np
from PIL import Image


def compute_ela(img_bytes: bytes, quality: int = 95) -> np.ndarray:
    """
    Error Level Analysis: recompress at `quality`% JPEG, compute pixel-wise diff.

    Algorithm:
    1. Save image as JPEG at 95% quality (recompress)
    2. Reload the recompressed image
    3. Compute absolute pixel-wise difference (original vs recompressed)
    4. Normalize to 0–255

    Why it works:
    Authentic images compressed from camera show uniform recompression error.
    Tampered regions (copy-pasted text, spliced photos) show higher error
    because they were compressed at a different quality level.

    Returns:
        np.ndarray: uint8 ELA map, same HxW as input, 3 channels
    """
    img = Image.open(BytesIO(img_bytes)).convert("RGB")

    buf = BytesIO()
    img.save(buf, "JPEG", quality=quality)
    buf.seek(0)
    compressed = Image.open(buf).convert("RGB")

    ela = np.abs(np.array(img, dtype=float) - np.array(compressed, dtype=float))
    max_val = ela.max()
    if max_val > 0:
        ela = (ela / max_val * 255).astype(np.uint8)
    else:
        ela = ela.astype(np.uint8)

    return ela


def get_ela_score(ela_map: np.ndarray, roi: tuple[int, int, int, int] | None = None) -> float:
    """
    Compute a scalar ELA suspicion score from the ELA map.
    Higher score → more likely tampered.

    Args:
        ela_map: uint8 ELA map (H, W, 3)
        roi: Optional (x, y, w, h) region of interest

    Returns:
        float: 0.0–1.0 suspicion score
    """
    if roi is not None:
        x, y, w, h = roi
        region = ela_map[y : y + h, x : x + w]
    else:
        region = ela_map

    if region.size == 0:
        return 0.0

    mean = region.mean()
    std  = region.std()

    # Higher mean and variance = more suspicious
    score = float(min(1.0, (mean / 255) * 1.5 + (std / 128) * 0.5))
    return round(score, 4)


def prepare_ela_for_onnx(ela_map: np.ndarray, target_size: int = 224) -> np.ndarray:
    """
    Prepare ELA map as input tensor for tamper_cnn.onnx.
    Output: float32 NCHW tensor normalized to [0, 1].
    """
    img = Image.fromarray(ela_map).resize((target_size, target_size))
    arr = np.array(img, dtype=np.float32) / 255.0
    # HWC → NCHW
    return arr.transpose(2, 0, 1)[np.newaxis, ...]  # (1, 3, 224, 224)
