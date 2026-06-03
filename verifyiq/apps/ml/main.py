"""
VerifyIQ — FastAPI ML Service
apps/ml/main.py
Handles all ONNX inference. Loads models ONCE at startup via lifespan.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.model_registry import ModelRegistry
from routers import credit_card, passport, aadhaar, voter_id, driving_licence


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup: load all ONNX models ────────────────────────────────────────
    ModelRegistry.preload_all()
    yield
    # ── Shutdown: nothing special needed (GC handles sessions) ───────────────


app = FastAPI(
    title="VerifyIQ ML Service",
    description="Offline AI inference for document verification. All models run via ONNX Runtime on CPU.",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(credit_card.router,     prefix="/ml/credit-card",     tags=["Credit Card"])
app.include_router(passport.router,        prefix="/ml/passport",         tags=["Passport"])
app.include_router(aadhaar.router,         prefix="/ml/aadhaar",          tags=["Aadhaar"])
app.include_router(voter_id.router,        prefix="/ml/voter-id",         tags=["Voter ID"])
app.include_router(driving_licence.router, prefix="/ml/driving-licence",  tags=["Driving Licence"])


@app.get("/health", tags=["Health"])
async def health():
    loaded = ModelRegistry.loaded_models()
    return {
        "status": "ok",
        "models_loaded": loaded,
        "models_total": 4,
    }
