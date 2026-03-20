# Leave Management System - Implementation Phases

This document turns the PRD into an execution plan with clear phases, deliverables, and acceptance checks.

## Execution Status (2026-03-20)

| Phase | Status |
| --- | --- |
| Phase 0 | Completed |
| Phase 1 | Completed |
| Phase 2 | Completed |
| Phase 3 | Completed |
| Phase 4 | Completed |
| Phase 5 | Completed |
| Phase 6 | Completed |
| Phase 7 | Completed |
| Phase 8 | Completed |

Source PRD: [PRD.md](PRD.md)

## Phase 0 - Alignment and Setup (Half day)

### Objective
Lock project scope, environment, and coding standards before feature work.

### Tasks
- Confirm final PRD baseline, API contracts, and role matrix.
- Install and verify local tools:
  - Go
  - PostgreSQL
  - Node.js and npm
- Configure environment files for backend and frontend.
- Define branch strategy and commit conventions.
- Add baseline README for run commands and architecture summary.

### Deliverables
- Working local backend and frontend startup commands.
- Verified PostgreSQL connection from backend.
- Team agreement on API response format and error format.

### Exit Criteria
- `backend` server runs without crash.
- `frontend` app runs and can call `/api/health` through Vite proxy.

---

## Phase 1 - Database and Seed Foundation (Half day)

### Objective
Create the relational foundation for users, leave requests, balances, departments, and leave types.

### Tasks
- Finalize schema and migration files:
  - users
  - departments
  - leave_types
  - leave_balances
  - leave_requests
  - audit/review metadata fields
- Add constraints and indexes for:
  - role/status enums
  - foreign keys
  - unique employee ID and email
- Implement seed script for:
  - Admin account (`admin@company.com` / `Admin@123`, `EMP001`)
  - 6 departments
  - 6 leave types with max days
- Ensure new employee registration auto-creates annual balances.

### Deliverables
- Migration SQL files in `backend/migrations`.
- Seed SQL or seed runner command.

### Exit Criteria
- Fresh DB can be migrated and seeded in one command sequence.
- Admin user and default reference data exist after seed.

---

## Phase 2 - Auth and User Management APIs (Day 1)

### Objective
Implement secure authentication and employee lifecycle management.

### Tasks
- Implement JWT login (`POST /api/auth/login`) with 24h expiry claim.
- Implement current user endpoint (`GET /api/auth/me`).
- Implement admin registration endpoint (`POST /api/auth/register`) with bcrypt hashing.
- Implement role-based middleware:
  - Auth guard
  - Role guard (`admin`, `manager`, `employee`)
- Implement user endpoints:
  - `GET /api/users`
  - `PUT /api/users/:id`
  - `DELETE /api/users/:id` (soft deactivate)

### Deliverables
- Complete auth middleware and handlers.
- User management handlers and repository queries.

### Exit Criteria
- Invalid credentials rejected.
- Inactive users cannot log in.
- Role restrictions enforced on all protected endpoints.

---

## Phase 3 - Leave Domain Core APIs (Day 2)

### Objective
Build leave request lifecycle and balance engine.

### Tasks
- Implement leave type and balance endpoints:
  - `GET /api/leave-types`
  - `GET /api/leave-balances`
  - `GET /api/users/:id/balances`
- Implement leave request endpoints:
  - `POST /api/leave-requests`
  - `GET /api/leave-requests`
  - `GET /api/leave-requests/:id`
  - `PATCH /api/leave-requests/:id/review`
  - `PATCH /api/leave-requests/:id/cancel`
- Enforce business rules:
  - Validate available balance before creating request.
  - Only manager/admin can approve or reject.
  - Employee can cancel only own `pending` request.
  - Restore balance on `rejected` or `cancelled`.
  - Prevent invalid state transitions.
- Add transaction handling for review and cancellation updates.

### Deliverables
- Complete leave handlers and repository logic.
- Centralized business rule service for status transitions.

### Exit Criteria
- Lifecycle path works end-to-end with correct balance mutation.
- Unauthorized role actions are blocked.

---

## Phase 4 - Dashboard and Analytics APIs (Half day)

### Objective
Expose actionable metrics for admin and manager dashboards.

### Tasks
- Implement `GET /api/dashboard` for role-scoped analytics.
- Implement `GET /api/departments` endpoint.
- Add KPI queries:
  - pending/approved/rejected counts
  - monthly trend data
  - team-level summaries for managers
- Ensure managers only see team-scoped aggregates.

### Deliverables
- Dashboard endpoint contract finalized and documented.

### Exit Criteria
- Dashboard payload powers frontend charts without additional transformations.

---

## Phase 5 - Frontend Auth and Shell (Day 3 - Part 1)

### Objective
Deliver a secure role-aware frontend skeleton.

### Tasks
- Finalize auth context and token persistence in `localStorage`.
- Implement protected routing and role-based route guards.
- Complete app shell:
  - Sidebar with role-aware menu
  - Top navbar
  - Shared layout wrapper
- Implement login page with toast feedback and redirect behavior.

### Deliverables
- Reliable auth flow from login to logout.
- Role-aware navigation and route gating.

### Exit Criteria
- Unauthenticated users are redirected to `/login`.
- Routes unavailable to a role are blocked in UI and route layer.

---

## Phase 6 - Frontend Feature Pages and API Integration (Day 3 - Part 2)

### Objective
Implement all PRD pages with backend integration.

### Tasks
- Employee pages:
  - My Leaves
  - Apply Leave
  - Profile
- Manager/Admin pages:
  - Employees
  - Leave Requests
  - Dashboard with Recharts
- Connect Axios client to all implemented APIs.
- Add loading, empty states, and error toasts.
- Add status badges for `pending`, `approved`, `rejected`, `cancelled`.

### Deliverables
- Functional page flows for all roles.
- Forms and tables wired to real backend responses.

### Exit Criteria
- All pages render real data and mutate state through API calls.

---

## Phase 7 - Testing, QA, and Hardening (Day 4 - Part 1)

### Objective
Validate correctness, security, and regression safety.

### Tasks
- Backend tests:
  - auth middleware behavior
  - leave lifecycle transitions
  - balance calculations and restoration
- API integration tests for critical endpoints.
- Frontend tests (at minimum):
  - auth guard behavior
  - role-based route visibility
  - request review/cancel actions
- Security checks:
  - password hashing only
  - JWT expiry validation
  - input validation and sanitized error messages

### Deliverables
- Test suites and test run commands.
- Bugfix pass from test findings.

### Exit Criteria
- Critical path tests pass consistently.
- No known blocker defects in auth, leave review, or balance flow.

---

## Phase 8 - Packaging and Handoff (Day 4 - Part 2)

### Objective
Prepare the project for assessment delivery and reproducibility.

### Tasks
- Finalize documentation:
  - setup
  - environment variables
  - migration and seed commands
  - role demo credentials
- Add optional Docker setup for backend + frontend + Postgres.
- Prepare demo checklist by role (admin/manager/employee).
- Create release notes with completed PRD coverage and known gaps.

### Deliverables
- Updated `README.md` with one-command setup where possible.
- Delivery-ready repository.

### Exit Criteria
- Reviewer can clone, run, and validate role workflows without manual debugging.

---

## Endpoint-to-Phase Mapping

| Endpoint | Phase |
| --- | --- |
| `POST /api/auth/login` | Phase 2 |
| `GET /api/auth/me` | Phase 2 |
| `POST /api/auth/register` | Phase 2 |
| `GET /api/users` | Phase 2 |
| `PUT /api/users/:id` | Phase 2 |
| `DELETE /api/users/:id` | Phase 2 |
| `GET /api/leave-types` | Phase 3 |
| `GET /api/leave-balances` | Phase 3 |
| `GET /api/users/:id/balances` | Phase 3 |
| `POST /api/leave-requests` | Phase 3 |
| `GET /api/leave-requests` | Phase 3 |
| `GET /api/leave-requests/:id` | Phase 3 |
| `PATCH /api/leave-requests/:id/review` | Phase 3 |
| `PATCH /api/leave-requests/:id/cancel` | Phase 3 |
| `GET /api/dashboard` | Phase 4 |
| `GET /api/departments` | Phase 4 |

## Definition of Done (Project)
- All PRD endpoints implemented and tested.
- Role-based permissions enforced in backend and frontend.
- Leave lifecycle and balance logic verified for all transitions.
- Seed data and admin account available on fresh setup.
- Dashboard metrics align with role visibility rules.
- Full setup documented and reproducible.
