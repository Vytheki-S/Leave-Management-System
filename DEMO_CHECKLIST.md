# Demo Checklist

Use this checklist to validate the delivered system quickly by role.

## Environment Startup

- Start backend:
  - `cd backend`
  - `go run ./cmd/server/main.go`
- Start frontend:
  - `cd frontend`
  - `npm run dev`
- Open app: `http://localhost:5173`

## Admin Flow

- Login with admin credentials.
- Open Dashboard and verify KPI cards and trend render.
- Open Employees and verify user list appears.
- Create a new employee account.
- Deactivate an existing account.
- Open Leave Requests and approve/reject a pending request.

## Manager Flow

- Login with manager credentials.
- Confirm manager can access Dashboard, Employees, Leave Requests.
- Approve/reject a pending leave request.

## Employee Flow

- Login with employee credentials.
- Confirm employee cannot access Dashboard/Employees/Leave Requests routes.
- Open My Leaves and verify balances/history load.
- Submit a new leave request from Apply Leave.
- Cancel own pending leave request from My Leaves.
- Update full name/position in Profile.

## API/Validation Checks

- Unauthenticated request to protected route returns 401.
- Employee request to management-only route returns 403.
- Leave creation fails on insufficient balance.
- Non-pending requests cannot be cancelled/reviewed again.

## Test Commands

- Backend: `go test ./...`
- Backend coverage: `go test -cover ./...`
- Frontend tests: `npm run test:run`
- Frontend build: `npm run build`
