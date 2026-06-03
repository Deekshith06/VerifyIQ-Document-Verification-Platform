"""
VerifyIQ — ONNX Model Registry
apps/ml/models/model_registry.py

Singleton pattern: all models loaded ONCE at FastAPI startup.
Zero per-request model loading. CPUExecutionProvider only (offline-first).
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import ClassVar

import onnxruntime as ort

logger = logging.getLogger(__name__)

# ─── Available model names ────────────────────────────────────────────────────
MODEL_NAMES = [
    "classifier",       # EfficientNet-B0 → document type
    "tamper_cnn",       # MobileNetV2 → ELA tamper detection
    "face_detector",    # RetinaFace-MobileNet → face detection
    "risk_scorer",      # XGBoost → final risk score
]


class ModelRegistry:
    """
    Singleton registry for ONNX inference sessions.

    Usage:
        session = ModelRegistry.get("classifier")
        outputs = session.run(None, {"image": input_array})
    """

    _instances: ClassVar[dict[str, ort.InferenceSession]] = {}
    _models_dir: ClassVar[Path] = Path(__file__).parent

    @classmethod
    def preload_all(cls) -> None:
        """Load all ONNX models at startup. Call once in FastAPI lifespan."""
        logger.info("🤖 Preloading ONNX models...")
        for name in MODEL_NAMES:
            path = cls._models_dir / f"{name}.onnx"
            if path.exists():
                cls._load(name, path)
            else:
                logger.warning(
                    "⚠️  Model not found: %s — using mock inference for development",
                    path,
                )
        logger.info("✅ Model preload complete: %d/%d models loaded",
                    len(cls._instances), len(MODEL_NAMES))

    @classmethod
    def get(cls, name: str) -> ort.InferenceSession | None:
        """
        Return inference session by model name.
        Returns None if model file not present (graceful degradation).
        """
        if name not in cls._instances:
            path = cls._models_dir / f"{name}.onnx"
            if path.exists():
                cls._load(name, path)
            else:
                return None
        return cls._instances.get(name)

    @classmethod
    def _load(cls, name: str, path: Path) -> None:
        """Internal: create and cache an InferenceSession."""
        opts = ort.SessionOptions()
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        opts.intra_op_num_threads = 4
        opts.inter_op_num_threads = 2
        opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL

        session = ort.InferenceSession(
            str(path),
            sess_options=opts,
            providers=["CPUExecutionProvider"],
        )
        cls._instances[name] = session
        inputs = [i.name for i in session.get_inputs()]
        outputs = [o.name for o in session.get_outputs()]
        logger.info(
            "✅ Loaded %s: inputs=%s outputs=%s",
            name, inputs, outputs
        )

    @classmethod
    def is_loaded(cls, name: str) -> bool:
        """Check if a model is currently loaded."""
        return name in cls._instances

    @classmethod
    def loaded_models(cls) -> list[str]:
        """Return list of currently loaded model names."""
        return list(cls._instances.keys())

    @classmethod
    def unload(cls, name: str) -> None:
        """Remove a model from the registry (for testing / hot-swap)."""
        cls._instances.pop(name, None)
