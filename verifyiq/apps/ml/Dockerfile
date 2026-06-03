# apps/ml/Dockerfile — FastAPI ML Service
FROM python:3.11-slim AS base

# Install system dependencies for Pillow/numpy
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Models and keys mounted as volumes (not baked into image)
RUN mkdir -p /app/models /app/keys

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=10s --retries=5 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--log-level", "info"]
