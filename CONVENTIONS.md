# Development Conventions

This document standardizes workflows, API response formats, and error handling across the team.

## Git Workflow

### Branch Naming
- `main` — Production-ready code
- `develop` — Integration branch for Phase work
- `feature/PHASE-N-description` — Feature branches (e.g., `feature/PHASE-2-auth-login`)
- `bugfix/description` — Bug fix branches (e.g., `bugfix/jwt-expiry-null-check`)

### Commit Messages
Format: `[PHASE-N] Brief description`

Examples:
```
[PHASE-0] Add README and environment templates
[PHASE-2] Implement JWT login endpoint
[PHASE-3] Add balance validation in leave request flow
[BUGFIX] Fix role guard not checking inactive users
```

### Pull Requests
- **Title:** `[PHASE-N] Feature name`
- **Description:** Reference PRD section, test coverage, known issues
- **Reviewers:** At least one approval before merge to develop/main

## API Response Format

### Success Response (2xx)
All successful responses return JSON with consistent structure.

**200 OK - GET/PUT/PATCH**
```json
{
  "data": { /* resource or array */ },
  "message": "Operation successful",
  "timestamp": "2026-03-20T10:30:00Z"
}
```

**201 Created - POST**
```json
{
  "data": { /* created resource */ },
  "message": "Resource created",
  "timestamp": "2026-03-20T10:30:00Z"
}
```

**204 No Content - DELETE**
(Empty body, status code only)

### Error Response (4xx, 5xx)
```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "timestamp": "2026-03-20T10:30:00Z"
}
```

**400 Bad Request — Validation Error**
```json
{
  "error": "validation_error",
  "message": "Email is required and must be valid",
  "fields": {
    "email": ["Email is required", "Must be a valid email"]
  },
  "timestamp": "2026-03-20T10:30:00Z"
}
```

**401 Unauthorized**
```json
{
  "error": "unauthorized",
  "message": "Invalid or missing authorization token",
  "timestamp": "2026-03-20T10:30:00Z"
}
```

**403 Forbidden**
```json
{
  "error": "forbidden",
  "message": "You do not have permission to access this resource",
  "timestamp": "2026-03-20T10:30:00Z"
}
```

**500 Internal Server Error**
```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred. Please try again later.",
  "timestamp": "2026-03-20T10:30:00Z"
}
```

## Error Codes and Meanings

| Code | Meaning | HTTP Status |
| --- | --- | --- |
| `validation_error` | Input validation failed | 400 |
| `invalid_credentials` | Email or password incorrect | 401 |
| `unauthorized` | Missing or invalid token | 401 |
| `forbidden` | Insufficient permissions | 403 |
| `not_found` | Resource does not exist | 404 |
| `conflict` | Resource already exists or state conflict | 409 |
| `internal_error` | Unexpected server error | 500 |

## Backend Code Standards

### File Organization
- All routes defined in `cmd/server/main.go`
- Business logic in `internal/handlers/`
- Database queries in `internal/repository/`
- Data models in `internal/models/`
- Middleware in `internal/middleware/`

### Error Handling
Always return structured errors consistent with the error response format above.

```go
// Bad
fmt.Println("error:", err)

// Good
c.JSON(http.StatusBadRequest, gin.H{
  "error": "validation_error",
  "message": "Email is required",
})
```

### Middleware Order
1. Auth middleware (validates JWT)
2. Role guard (checks permission level)
3. Handler logic

## Frontend Code Standards

### Component Organization
- `/components` — Reusable UI components (Sidebar, Navbar, Layout, etc.)
- `/pages` — Full page components (Login, Dashboard, etc.)
- `/context` — Global state (AuthContext)
- `/utils` — Helper functions and API client

### State Management
- Auth state: `AuthContext` (Redux-like reducer not needed for MVP)
- Page state: Local React state with `useState`
- Server data: Fetch via Axios and store locally until mutation required

### API Calls
Always use the centralized Axios client in `utils/api.js`:

```javascript
// Good
import api from '../utils/api';
const response = await api.get('/leave-requests');

// Bad
const response = await axios.get('http://localhost:8080/api/leave-requests');
```

### Error Handling
1. Catch errors in try-catch
2. Display user-friendly toast via `react-hot-toast`
3. Log to console in development

```javascript
try {
  await api.post('/leave-requests', form);
  toast.success('Request submitted');
} catch (error) {
  const msg = error.response?.data?.message || 'Failed to submit';
  toast.error(msg);
  console.error(error);
}
```

## Testing Standards

### Backend Tests (Phase 7)
- Test auth middleware behavior
- Test leave lifecycle transitions (submit → approve/reject/cancel)
- Test balance calculations
- Test role-based access control

### Frontend Tests (Phase 7)
- Test protected route guards
- Test role-based menu visibility
- Test form validation and submission

## Code Review Checklist

Before merging any PR:
- [ ] Follows naming conventions
- [ ] No hardcoded secrets or credentials
- [ ] Error handling is consistent
- [ ] Functions are documented with comments
- [ ] Tests added or updated
- [ ] No console.log or debug code left behind
- [ ] Database migrations are reversible

## Documentation Requirements

- Every new endpoint must be documented in this file or PRD.md
- Complex business logic should have comments explaining the "why"
- Database schema changes must include migration files
