# VerifyIQ — AI-Powered Document Intelligence Platform

**VerifyIQ** is a self-contained, offline-capable document verification and KYC fraud detection platform. It is an anonymous, stateless public website where documents are processed in memory, results are returned immediately, and no user account, upload archive, result history, audit feed, or dashboard database record is created by the default application path.

## Features
- **5 Document Types**: Credit Card, Passport, Aadhaar, Voter ID, Driving Licence
- **Explainable Results**: Every APPROVED / REJECTED / REVIEW verdict shows *why*
- **Zero Retention**: Session-only processing; closing or refreshing the browser clears visible results
- **No Accounts**: No login, dashboard identity, user history, or API-key requirement on the public verification path
- **Offline-first AI**: All ML inference via ONNX Runtime on CPU — no cloud dependency
- **Compliance-grade**: DPDP Act 2023 + PCI-DSS + GDPR data handling built-in

## Tech Stack
- **Frontend**: Next.js 14 (App Router)
- **Backend API**: NestJS (Monolith)
- **ML Service**: FastAPI with ONNX Runtime
- **Database**: PostgreSQL 16 (via Prisma)

## Setup & Running
This repository uses a monorepo structure.

1. Ensure you have Node.js, Python, and Docker installed.
2. Install frontend and backend dependencies using `npm install`.
3. Start the services (ML service, NestJS API, and Next.js frontend).
4. Access the web app at `http://localhost:3000`.

For detailed architecture, model specifications, and AI agent documentation, refer to the [AGENTS.md](./AGENTS.md) live specification file.
