# Release Notes

Date: 2026-03-20

## Summary

This release completes implementation through Phase 8 of the project plan:

- Phase 0: Setup and alignment artifacts complete.
- Phase 1: PostgreSQL schema and seed data complete.
- Phase 2: Auth and user management APIs complete.
- Phase 3: Leave request lifecycle APIs complete.
- Phase 4: Dashboard and analytics APIs complete.
- Phase 5: Frontend auth shell and role-based routing complete.
- Phase 6: Frontend feature pages integrated with backend APIs.
- Phase 7: Frontend and backend tests added and executed.
- Phase 8: Packaging and handoff docs updated.

## Delivered Backend Endpoints

- Auth: `/api/auth/login`, `/api/auth/register`
- Profile: `/api/profile` (GET, PUT)
- Users: `/api/users`, `/api/users/:userID/deactivate`
- Leave domain: `/api/leave-types`, `/api/leave-balances`, `/api/leave-balances/:userID`
- Requests: `/api/leave-requests`, `/api/leave-requests/:requestID`, `/api/leave-requests/:requestID/review`, `/api/leave-requests/:requestID/cancel`
- Dashboard: `/api/dashboard`, `/api/departments`

## Delivered Frontend Areas

- Role-aware route guards and navigation.
- Dashboard, Employees, Leave Requests, My Leaves, Apply Leave, and Profile pages wired to API.
- Loading, empty-state, and error toast handling added.
- Status badges for pending, approved, rejected, cancelled.

## Test Status

- Frontend:
  - `npm run test:run` passed (4 files, 7 tests).
  - `npm run build` passed.
- Backend:
  - `go test ./...` passed.
  - `go test -cover ./...` passed.

## Coverage Snapshot

- `internal/middleware`: 79.4%
- `internal/handlers`: 19.0%
- `cmd/server` and `internal/repository`: 0.0% (no tests yet)

## Known Gaps / Next Hardening Targets

- Add repository-layer unit tests (query behavior and edge cases).
- Add transaction-focused tests for approval/cancel balance mutation behavior.
- Add end-to-end API tests across auth + leave workflow.
- Reduce frontend bundle warning by code splitting large chart/table pages.
