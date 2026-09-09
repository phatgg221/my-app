# Shopee — Vendor Onboarding

> A robust, full-stack vendor onboarding management dashboard built with Next.js 16, TypeScript, Tailwind CSS, PostgreSQL, Prisma ORM, and AWS S3/MinIO storage. Designed to replace error-prone spreadsheet-based vendor tracking with transactional stage management, automated SLA monitoring, audit trails, and KYC document handling.

---

## 📖 Executive Summary & Architectural Write-Up

### 1. Problems Identified with the Original Spreadsheet Process

Operating vendor onboarding via shared spreadsheets introduces critical operational vulnerabilities:

1. **Lack of an Immutable Audit Trail & Accountability**:
   - In a spreadsheet, changing a vendor's status cell simply overwrites the previous value.
   - There is no native record of **who** made the transition, **when** it occurred, or **what** the previous stage was. If an unverified vendor mistakenly goes live or compliance issues emerge, root-cause investigation is impossible.
2. **Absence of Concurrency Control & State Invariants**:
   - Multiple Operations Coordinators editing the sheet simultaneously creates race conditions, cell overwrites, and inconsistent states.
   - Nothing prevents invalid state jumps (e.g., jumping from `CONTRACT_SENT` straight to `ACTIVE` without KYC verification).
3. **Manual, Error-Prone SLA & Time Tracking**:
   - Calculating "days in stage" or identifying bottlenecked vendors in spreadsheets relies on manual date inputs and fragile formulas.
   - When coordinators forget to update dates, vendors stuck for $>7$ days go unnoticed, directly delaying marketplace revenue.
4. **Fragmented Document Management**:
   - Spreadsheets store document links as raw Google Drive/Dropbox URLs without access control, validation for file type or size, or integrity verification.

---

### 2. Overall Approach to Solving the Problem

To solve these problems, we designed a unified, resilient web platform adhering to strict **Full-Stack Dataflow Architecture**:

- **Database-Enforced State & Transactions**: PostgreSQL with Prisma ORM enforces relational integrity, stage enums, and foreign-key constraints. Stage changes are wrapped in atomic database transactions (`prisma.$transaction`) that update the vendor's stage and insert a `StageHistory` log simultaneously.
- **Dynamic SLA Calculation**: Instead of relying on manual timestamps, "Days in Stage" is calculated dynamically on the server based on the latest transition timestamp in `StageHistory`. Any non-active vendor exceeding 7 days ($ \ge 8$ full days) is automatically flagged as **Stuck** (`isStuck: true`).
- **Separation of Concerns**:
  - **Controllers** ([`app/api/.../route.ts`](file:///Users/huynhphat/Documents/Shoppee/my-app/app/api/vendors/route.ts)): Pure HTTP route handlers responsible solely for request validation using Zod.
  - **Server Services** ([`services/server/...`](file:///Users/huynhphat/Documents/Shoppee/my-app/services/server/vendorServerService.ts)): Core business logic and database transactions.
  - **Client Services** ([`services/client/...`](file:///Users/huynhphat/Documents/Shoppee/my-app/app/services/client/vendorClientService.ts)): Type-safe Axios fetchers abstracting network calls from UI components.
  - **Global Context** ([`context/AuthContext.tsx`](file:///Users/huynhphat/Documents/Shoppee/my-app/context/AuthContext.tsx), [`context/VendorContext.tsx`](file:///Users/huynhphat/Documents/Shoppee/my-app/context/VendorContext.tsx)): Global state management for authentication and vendor caching.
- **Integrated Object Storage**: Real MinIO / S3 integration for KYC compliance document uploads, with metadata linked directly to the vendor in PostgreSQL.

---

### 3. Important Technical Decisions

| Technology | Decision & Rationale |
| :--- | :--- |
| **Next.js 16 (App Router)** | Provides full-stack capabilities in a single unified TypeScript codebase. Server Route Handlers serve as API controllers, while React Server & Client Components provide responsive UI with instant hydration. |
| **Prisma ORM & PostgreSQL** | Strong schema typing, automatic migrations, connection pooling, and atomic `$transaction` blocks ensuring zero partial writes when updating stages and logging audit trails. |
| **Zod Schema Validation** | Enforces strict validation on query parameters (pagination, search, tabs) and mutation payloads before executing any database operation. |
| **Docker & Docker Compose** | Orchestrates PostgreSQL, MinIO S3, and Next.js in synchronized containers. Ensures zero-configuration setup and identical behavior across development and evaluation environments. |
| **MinIO (S3-Compatible Storage)** | Emulates AWS S3 locally via Docker. Stores KYC documents using standard `@aws-sdk/client-s3` commands, making the architecture 100% production-ready for cloud deployment (AWS S3 or Cloudflare R2). |
| **Dual Authentication Flow** | Includes both a **Mock Coordinator Selector Dropdown** (for instant evaluation of Sarah, Alex, and David without credentials) and **Google OAuth 2.0** with secure HTTP-only session cookies and Next.js Proxy/Middleware protection. |
| **Tailwind CSS v4** | Clean, responsive design adhering to the Shopee brand palette (`#EE4D2D`), complete with KPI overview cards, status badges, and loading skeletons. |

---

### 4. Assumptions Made to Complete the Workflow

1. **Definition of "Stuck" Vendors**:
   - Any vendor in an onboarding stage (`CONTRACT_SENT`, `CONTRACT_SIGNED`, `KYC_DOCS_RECEIVED`, `KYC_VERIFIED`) that has spent more than 7 days ($ \ge 8$ days) in their current stage is categorized as **Stuck**.
   - Vendors in the `ACTIVE` stage have completed onboarding and are **never** flagged as stuck.
2. **Flexible vs. Rigid Stage Progression**:
   - While the 5 stages represent an intended linear journey (Step 1 to Step 5), Ops Coordinators are permitted to move a vendor to any stage (e.g., rolling back to `KYC_DOCS_RECEIVED` if additional documents are needed), with every transition strictly logged in the audit trail.
3. **Session & Evaluator Access**:
   - To ensure a seamless evaluation experience, if no active session is present, the app auto-selects **Sarah Jenkins** on initial load while providing an immediate dropdown to switch between Alex, David, or test Read-Only mode.

---

### 5. Shortcuts & Trade-Offs (Due to Time Limits)

1. **Server Stream Upload vs. Presigned Direct S3 Uploads**:
   - *Current Implementation*: Files stream through the Next.js API route to MinIO via `@aws-sdk/client-s3`.
   - *Trade-off*: Simpler client implementation, but utilizes server bandwidth. In large-scale production, generating client-side presigned S3 PUT URLs is preferred for files $> 50\text{ MB}$.
2. **Direct MinIO URLs vs. Expiring Presigned GET URLs**:
   - *Current Implementation*: Documents use direct bucket URLs (`http://localhost:9002/shoppee-bucket/...`) for viewing.
   - *Trade-off*: Faster local inspection, but in high-security production environments, short-lived presigned download URLs should be generated on demand.
3. **Optimistic UI vs. Server Round-Trip**:
   - Stage updates and filter changes trigger state updates with an immediate backend refresh to guarantee absolute single-source-of-truth consistency.

---

### 6. Future Improvements & Architecture Enhancements

With more development time, the following features would further enhance the platform:

- **Enforced Document Gatekeeping**: Prevent advancing to `KYC_VERIFIED` or `ACTIVE` unless required documents (e.g., Business License and Identity Document) have been uploaded and approved.
- **Real-Time WebSockets / SSE**: Push instant stage updates and stuck vendor alerts to all active coordinator dashboards using Server-Sent Events or WebSockets.
- **Automated Escalations**: Webhook notifications (Slack/Teams/Email) automatically dispatched to the assigned coordinator when a vendor reaches day 7 without stage movement.
- **Bulk Stage Actions**: Multi-vendor selection to batch-transition vendors or bulk-download compliance dossiers into a ZIP archive.
- **Role-Based Access Control (RBAC)**: Distinct permissions for Ops Specialists (uploading documents, drafting stages) versus Compliance Leads (authorizing KYC and activating vendors).

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [Docker](https://www.docker.com/) & Docker Compose

### 1. Start Infrastructure (PostgreSQL & MinIO)
From the project root:
```bash
docker compose up -d
```

### 2. Install Dependencies & Initialize Database
```bash
cd my-app
npm install

# Push schema and seed 3 Ops Coordinators and 20 Vietnamese Province Vendors
npx prisma db push
npm run db:seed
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Prisma Studio**: [http://localhost:5555](http://localhost:5555)
- **MinIO Console**: [http://localhost:9003](http://localhost:9003) (`admin` / `password123`)

---

## 🧪 Testing

Run all unit and integration test suites:
```bash
npm run test
```
Tests cover:
- Dynamic calculation of days in stage and stuck flag thresholds
- Prisma transactional stage updates and audit trail logging
- Search, tab filtering, pagination clamping, and KPI metrics calculation
- Next.js Proxy/Middleware authentication and authorization interceptors
