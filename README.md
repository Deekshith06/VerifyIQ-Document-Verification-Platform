# VerifyIQ — Stateless Document Intelligence Platform

**Live Demo:** [https://verify-iq-document-verification-pla-seven.vercel.app/](https://verify-iq-document-verification-pla-seven.vercel.app/)

**VerifyIQ** is an anonymous, stateless document verification platform. Documents and details are processed purely in-memory using open-source mathematical algorithms. Results are returned immediately, and absolutely no user account, upload archive, or database record is ever created.

## Features
- **5 Document Types**: Credit/Debit Cards (Luhn), Passports (MRZ), Aadhaar (Verhoeff), Voter ID (EPIC), and Driving Licence.
- **Explainable Results**: Every PASS / FAIL verdict shows a transparent mathematical reasoning trail.
- **Zero Retention**: 100% Session-only processing. Closing or refreshing the browser instantly and permanently clears all entered data.
- **No Accounts Required**: No login walls, dashboard identities, user histories, or API-keys are required.
- **Open Source Math**: Full logic source code is provided in the app so you can independently verify how the algorithms work locally.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Deployment**: Vercel (Edge Network)
- **Architecture**: 100% Stateless Web Client (Zero-Backend)

## Setup & Running Locally
1. Ensure you have Node.js installed (v20+).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js frontend:
   ```bash
   npm run dev:web
   ```
4. Open your browser to `http://localhost:3000`.
