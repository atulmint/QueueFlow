# QueueFlow — Mini Job Queue Management Dashboard

A full-stack, production-grade web application for creating, viewing, filtering, updating, and deleting background jobs with server-enforced state transitions, atomic database-level concurrency protection, and a responsive neumorphic dashboard.

---

## 1. Project Overview

QueueFlow provides a robust job queue management dashboard. The system prioritizes server-side data integrity, atomic concurrency control, structured logging, and clean component architecture.

Key design principles:
- **Backend as Source of Truth**: All business logic, input validation, and state transition rules are enforced server-side.
- **Atomic Concurrency Protection**: Database-level atomic updates guarantee that concurrent requests cannot trigger race conditions.
- **Persistent Storage**: Full persistence using PostgreSQL and Prisma ORM.
- **Modern UI & Design System**: Responsive neumorphic dashboard with light/dark theme toggle, real-time metrics, status filters, and smooth micro-animations.

---

## 2. Features

- **Job Creation**: Create jobs with title and type validation.
- **Job Overview & Status Statistics**: Live count breakdown across All, Pending, Running, Completed, and Failed jobs.
- **Status Filtering**: Filter job lists by status (`all`, `pending`, `running`, `completed`, `failed`).
- **State Transition Control**: Execute valid transitions (`pending → running`, `running → completed`, `running → failed`).
- **Job Deletion**: Delete background jobs with instant UI feedback.
- **Theme Support**: Seamless Light/Dark mode switcher with `localStorage` persistence.
- **Error & Loading States**: Clean UI feedback for loading and server error states.

---

## 3. Tech Stack

- **Frontend**: React 18, TypeScript, Vite, CSS Design Tokens (Vanilla CSS)
- **Backend**: NestJS, TypeScript, Node.js
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 7 (with `@prisma/adapter-pg` driver adapter)
- **Testing**: Vitest, Supertest
- **Validation**: `class-validator`, `class-transformer`

---

## 4. Project Structure

```
queueflow/
├── README.md
├── frontend/                  # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/        # JobStats, JobFilters, JobForm, JobCard, LoadingState, ErrorState
│   │   ├── hooks/             # useJobs state management hook
│   │   ├── services/          # jobsApi HTTP client (fetch)
│   │   ├── types/             # Job interfaces and status constants
│   │   ├── pages/             # DashboardPage layout
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css          # Design system, Neumorphic tokens & styles
│   └── index.html             # Google Fonts & theme script
└── backend/                   # NestJS + Prisma + PostgreSQL
    ├── prisma/
    │   └── schema.prisma      # Job database model & JobStatus enum
    ├── src/
    │   ├── common/
    │   │   └── middleware/    # LoggingMiddleware (structured JSON request logging)
    │   ├── prisma/            # PrismaService database connection
    │   ├── jobs/
    │   │   ├── dto/           # CreateJobDto, UpdateJobStatusDto
    │   │   ├── jobs.controller.ts
    │   │   ├── jobs.service.ts
    │   │   └── jobs.service.spec.ts  # Unit tests (14 passing)
    │   ├── app.module.ts
    │   └── main.ts            # CORS configuration & global ValidationPipe
    └── test/                  # E2E Integration tests
        ├── app.e2e-spec.ts
        └── concurrency.e2e-spec.ts  # Atomic concurrency E2E test
```

---

## 5. Local Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm

### 1. Clone & Navigate
```bash
git clone <repo-url>
cd queueflow
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Configure DATABASE_URL and DATABASE_TEST_URL in backend/.env

npm install
npx prisma migrate dev --name init
npx prisma generate
npm run start:dev
```
The NestJS backend runs on `http://localhost:3000`.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
The React frontend runs on `http://localhost:5173`.

---

## 6. Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/queueflow?schema=public"
DATABASE_TEST_URL="postgresql://postgres:password@localhost:5432/queueflow_test?schema=public"
PORT=3000
```
> [!IMPORTANT]
> `backend/.env` is listed in `.gitignore` and is never committed to version control.

---

## 7. API Endpoints

| Method | Path | Description | Request Body | Response |
|---|---|---|---|---|
| `POST` | `/jobs` | Create a new job | `{ "title": "...", "type": "..." }` | `201 Created` + Job Object |
| `GET` | `/jobs` | Retrieve all jobs | None | `200 OK` + Array of Jobs |
| `PATCH` | `/jobs/:id/status` | Transition job status | `{ "status": "running" }` | `200 OK` + Updated Job |
| `DELETE` | `/jobs/:id` | Delete a job by ID | None | `200 OK` + `{ "success": true }` |

---

## 8. Allowed Job Statuses

The database and backend enforce four explicit statuses defined in the `JobStatus` enum:

1. `pending`: Initial status when a job is created.
2. `running`: Job is actively being processed.
3. `completed`: Job has finished successfully (Terminal state).
4. `failed`: Job has failed during processing (Terminal state).

---

## 9. Valid Status Transitions

State transition rules are strictly enforced by `JobsService`:

```
               ┌─────────────┐
               │   pending   │
               └──────┬──────┘
                      │
                      ▼
               ┌─────────────┐
               │   running   │
               └──────┬──────┘
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
  ┌─────────────┐           ┌─────────────┐
  │  completed  │           │   failed    │
  └─────────────┘           └─────────────┘
  (Terminal State)          (Terminal State)
```

- **Allowed Transitions**:
  - `pending` → `running`
  - `running` → `completed`
  - `running` → `failed`
- **Disallowed Transitions**:
  - `completed` → any status (Terminal state rejection)
  - `failed` → any status (Terminal state rejection)
  - `pending` → `completed` or `failed` (Must transition through `running`)
  - Transitioning to the same status (e.g., `running` → `running`) returns a 409 Conflict.

---

## 10. Validation & Error Handling

- **DTO Validation**: NestJS `ValidationPipe` with `class-validator` enforces non-empty strings (`@IsNotEmpty`, `@IsString`) for `title` and `type`, and strict enum matching (`@IsEnum(JobStatus)`) for `status`.
- **400 Bad Request**: Returned when request payloads are missing required fields or contain invalid types.
- **404 Not Found**: Returned when attempting to update or delete a non-existent job ID.
- **409 Conflict**: Returned when an illegal status transition is attempted or when a concurrent request loses an atomic update race.
- **500 Internal Server Error**: Unexpected runtime errors are returned by NestJS while request activity is captured through structured logging.

---

## 11. PostgreSQL Persistence

- All job records are stored in PostgreSQL database tables via Prisma ORM.
- Reloading the browser or restarting the application preserves job records, status counts, and creation timestamps.

---

## 12. Concurrency Approach & Database Enforcement

To handle race conditions without external distributed lock managers (e.g., Redis/Redlock), QueueFlow uses **database-level atomic conditional updates**:

```typescript
const result = await this.prisma.job.updateMany({
  where: {
    id,
    status: currentStatus, // Conditional lock check
  },
  data: {
    status: targetStatus,
  },
});
```

### Why the Database/Backend Enforces It:
1. **Database Row-Level Locking**: PostgreSQL locks the target row during the `UPDATE` operation.
2. **Atomicity**: The `WHERE id = :id AND status = :currentStatus` clause guarantees that the update succeeds only if the job is still in the expected `currentStatus` at the exact instant the transaction executes.
3. **Zero External Lock Manager Overhead**: PostgreSQL provides the row-level atomicity required for conditional state transitions without needing an external lock manager.

---

## 13. What Happens During Simultaneous `pending → running` Requests

When two simultaneous HTTP requests attempt to transition the same job from `pending` to `running`:

1. Both requests arrive at the NestJS backend concurrently.
2. Both pass the in-memory validation check (since both read `pending` initial state).
3. Both execute the atomic query `UPDATE "Job" SET "status" = 'running' WHERE "id" = :id AND "status" = 'pending'`.
4. PostgreSQL's transaction manager grants execution to **Request A** first:
   - **Request A** updates 1 row (`count = 1`). Request A returns `200 OK` with the updated job object.
5. **Request B** executes immediately after:
   - The job's status is now `running`, so `WHERE status = 'pending'` matches 0 rows (`count = 0`).
   - The service detects `count = 0`, checks if the job exists, and rejects **Request B** with a `409 Conflict` (`"Job status has changed or concurrent update occurred"`).

---

## 14. Prevention of Direct API Rule Bypasses

Even if a user or external agent bypasses the frontend UI and makes direct API calls (via `curl`, Postman, or custom scripts):

- All incoming request payloads pass through global NestJS `ValidationPipe` for strict DTO type checking.
- `JobsService` verifies state transition validity before issuing database queries.
- The atomic `updateMany` database query enforces state matching at the database engine level.
- Direct API calls attempting invalid transitions (e.g., `completed → running`) or invalid payloads are rejected with HTTP 400 or 409 responses.

---

## 15. Assumptions & Trade-offs

### Assumptions
- Free-text job `type` (e.g., `email`, `report`, `export`) rather than fixed enum values to support arbitrary job queues.
- Single-tenant application without authentication/authorization requirements.
- Client-side status filtering suitable for small to medium queue sizes.

### Trade-offs
- **`updateMany` over `$executeRaw`**: Used Prisma `updateMany` for type-safe database queries. `updateMany` returns a count rather than the updated object, requiring a secondary fetch, but maintains type safety across Prisma adapters.
- **Client-Side Filtering**: `GET /jobs` fetches all jobs and filters in memory for responsive UX. For millions of jobs, server-side pagination (`LIMIT`/`OFFSET` or cursor-based) would be preferred.

---

## 16. Production-Ready Feature: Structured Request Logging

QueueFlow includes a production-ready `LoggingMiddleware` registered in `AppModule`:

- Logs all HTTP requests with method, path, HTTP status code, duration in milliseconds, and timestamp in structured JSON format.
- Example log output:
  ```json
  {"timestamp":"2026-09-16T11:08:55.272Z","method":"GET","path":"/jobs","statusCode":200,"durationMs":50}
  ```

---

## 17. Testing Instructions

All unit and integration tests can be run from the `backend/` directory:

### Run Unit Tests (14 passing)
```bash
cd backend
npm run test
```

### Run E2E Integration Tests (2 passing, including atomic concurrency test)
```bash
cd backend
npm run test:e2e
```

---

## 18. Build Instructions

### Backend Production Build
```bash
cd backend
npm run build
```
Generates production bundle in `backend/dist`.

### Frontend Production Build
```bash
cd frontend
npm run build
```
Runs `tsc -b` type-check and Vite build, generating production assets in `frontend/dist`.
