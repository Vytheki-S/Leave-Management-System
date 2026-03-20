# Leave Management System

A role-based leave request management system built with Go (Gin), PostgreSQL, React, and Vite.

## Quick Start

### Prerequisites
- **Go** 1.21+
- **Node.js** 18+ and npm
- **PostgreSQL** 14+

### 1. Clone and Navigate
```bash
cd leave-management
```

### 2. Backend Setup
```bash
cd backend

# Copy environment file
cp .env.example .env

# Install Go dependencies
go mod download

# (Requires PostgreSQL running)
# Apply migrations and seed data
psql -U postgres -h localhost -d leave_management -f ../backend/migrations/001_init.sql
psql -U postgres -h localhost -d leave_management -f ../backend/migrations/002_seed.sql

# Run the backend server
go run ./cmd/server/main.go
```

The backend will start on `http://localhost:8080`.

### 3. Frontend Setup
```bash
cd frontend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Run dev server
npm run dev
```

The frontend will start on `http://localhost:5173` and proxy API calls to `http://localhost:8080`.

## Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=leave_management
DB_SSLMODE=disable
JWT_SECRET=your-super-secret-key
PORT=8080
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8080
```

## Default Credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@company.com | Admin@123 |
| Manager | manager@company.com | Manager@123 |
| Employee | employee@company.com | Employee@123 |

If you run without PostgreSQL (seed fallback mode), use `password123` for all three users.

## Database

### Reset Database (Development)
```bash
# Drop and recreate (if needed)
psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS leave_management;"
psql -U postgres -h localhost -c "CREATE DATABASE leave_management;"

# Reapply migrations and seed
psql -U postgres -h localhost -d leave_management -f backend/migrations/001_init.sql
psql -U postgres -h localhost -d leave_management -f backend/migrations/002_seed.sql
```

### Seed Data Includes
- 3 demo users (admin, manager, employee)
- 6 departments
- 6 leave types with max days per year
- Automatic balance initialization for all users

## Project Structure

```
leave-management/
├── backend/
│   ├── cmd/server/main.go              # Entry point
│   ├── internal/
│   │   ├── handlers/handlers.go         # HTTP handlers
│   │   ├── middleware/auth.go           # JWT + role guards
│   │   ├── models/models.go             # Structs and DTOs
│   │   └── repository/repository.go     # DB queries
│   ├── migrations/
│   │   ├── 001_init.sql                 # Schema
│   │   └── 002_seed.sql                 # Initial data
│   ├── go.mod
│   ├── go.sum
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/                  # Shared UI
│   │   ├── pages/                       # Route pages
│   │   ├── context/AuthContext.jsx      # Auth state
│   │   ├── utils/api.js                 # Axios client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env
├── PRD.md
├── PROJECT_PHASES.md
├── STYLE_GUIDE.md
└── README.md (this file)
```

## API Overview

All routes except `/api/auth/login` and `/api/auth/register` require a valid JWT token in the `Authorization: Bearer <token>` header.

### Auth
- `POST /api/auth/login` — Login with email + password
- `POST /api/auth/register` — Create account
- `GET /api/profile` — Current user profile
- `PUT /api/profile` — Update own profile

### Users
- `GET /api/users` — List employees (admin/manager only)
- `DELETE /api/users/:userID/deactivate` — Deactivate user (admin/manager)

### Leave Types & Balances
- `GET /api/leave-types` — All leave types
- `GET /api/leave-balances` — My balances
- `GET /api/leave-balances/:userID` — Any user's balances (admin/manager, or self)

### Leave Requests
- `POST /api/leave-requests` — Submit new request
- `GET /api/leave-requests` — My requests or all (by role)
- `GET /api/leave-requests/:requestID` — Request detail
- `PUT /api/leave-requests/:requestID/review` — Approve/reject (manager/admin)
- `DELETE /api/leave-requests/:requestID/cancel` — Cancel own pending request

### Dashboard
- `GET /api/dashboard` — Analytics and KPIs
- `GET /api/departments` — All departments

## Development

### Start Both Services in Parallel
**Terminal 1 — Backend:**
```bash
cd backend
go run ./cmd/server/main.go
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

### Code Conventions
See [CONVENTIONS.md](CONVENTIONS.md) for branch strategy, commit messages, API response format, and coding standards.

### Build for Production
```bash
# Backend
cd backend
go build -o leave-management ./cmd/server

# Frontend
cd frontend
npm run build
# Output in dist/
```

## Testing

### Backend
```bash
cd backend
go mod tidy
go test ./...
go test -cover ./...
```

PowerShell note: if `go` is not in PATH, use:

```powershell
$env:Path = "C:\Program Files\Go\bin;" + $env:Path
go test ./...
```

### Frontend
```bash
cd frontend
npm run test:run
npm run build
```

## Troubleshooting

### PostgreSQL Connection Refused
- Ensure PostgreSQL is running: `pg_isready -h localhost`
- Check credentials in `.env`
- Create database if missing: `createdb leave_management`

### Frontend Cannot Reach Backend
- Ensure backend is running on port 8080
- Check Vite proxy in `vite.config.js`
- Clear browser cache and localStorage

### Port 8080 Already In Use (bind error)
If you see `listen tcp :8080: bind` errors, use the backend launcher script that clears stale listeners and starts the API:

```powershell
cd backend
./start-backend.ps1
```

If you only want to check whether a listener is already running and avoid stopping it:

```powershell
cd backend
./start-backend.ps1 -KeepExistingListener
```

### Go Modules Not Found
```bash
cd backend
go mod tidy
go mod download
```

## References
- [PRD.md](PRD.md) — Full product requirements
- [PROJECT_PHASES.md](PROJECT_PHASES.md) — Implementation phases (Phase 0–8)
- [STYLE_GUIDE.md](STYLE_GUIDE.md) — UI design tokens
- [CONVENTIONS.md](CONVENTIONS.md) — Coding standards
