# Leave Management System - PRD

Product Requirements Document

Company: ABC Company
Assessment Duration: 4 days
Date: 2026-03-19

## 1. Overview
The Leave Management System enables employees to request leave, managers and admins to review requests, and leadership to monitor leave usage through role-based dashboards.

## 2. User Roles and Permissions

| Role | Permissions |
| --- | --- |
| Admin | Register/deactivate employees, manage all leave requests, access full dashboard, manage departments and leave types |
| Manager | View team leave requests, approve/reject requests, access team dashboard, view team balances |
| Employee | Submit leave requests, view own history, view own balances, cancel pending requests |

## 3. Leave Request Lifecycle
1. Employee submits leave request.
2. System validates available leave balance.
3. Request is set to `pending`.
4. Manager/Admin reviews the request.
5. Request is updated to `approved` or `rejected`.
6. Employee can cancel only while status is `pending`.
7. On `rejected` or `cancelled`, leave balance is restored.

### Statuses
- `pending`
- `approved`
- `rejected`
- `cancelled`

## 4. Feature Modules
- Auth and Users
- Leave Management
- Dashboard

## 5. UX Requirements

### 5.1 Authentication
- JWT-based login using email and password.
- Token stored in `localStorage`.
- Token expiry: 24 hours.
- Protected routes redirect unauthenticated users to `/login`.
- User role is embedded in JWT claims.
- Passwords are hashed using bcrypt.

### 5.2 Employee Management
- Admin can register employees with employee ID.
- Admin can assign role: `admin`, `manager`, `employee`.
- Admin can assign department and position.
- Admin can soft-delete users (deactivate only).
- Users can edit profile details.
- Leave balances are auto-initialized on employee registration.

## 6. API Endpoints

| Endpoint | Access | Description |
| --- | --- | --- |
| `POST /api/auth/login` | Public | Login, returns JWT + user |
| `GET /api/auth/me` | All | Current user profile |
| `POST /api/auth/register` | Admin | Register new employee |
| `GET /api/users` | Admin, Manager | List all active employees |
| `PUT /api/users/:id` | All | Update employee profile |
| `DELETE /api/users/:id` | Admin | Deactivate employee |
| `GET /api/leave-types` | All | List leave types |
| `GET /api/leave-balances` | All | My leave balances (current year) |
| `GET /api/users/:id/balances` | Admin, Manager | Any employee's balances |
| `POST /api/leave-requests` | All | Submit new leave request |
| `GET /api/leave-requests` | All | List requests (own or all, by role) |
| `GET /api/leave-requests/:id` | All | Get single request details |
| `PATCH /api/leave-requests/:id/review` | Admin, Manager | Approve or reject a request |
| `PATCH /api/leave-requests/:id/cancel` | All | Cancel own pending request |
| `GET /api/dashboard` | Admin, Manager | Dashboard stats and analytics |
| `GET /api/departments` | All | List departments |

## 7. Tech Stack
- Go (Gin)
- PostgreSQL
- JWT (`golang-jwt`)
- bcrypt
- React 18
- Vite
- Tailwind CSS
- React Router v6
- Recharts
- Axios
- react-hot-toast

## 8. Default Seed Data

### 8.1 Admin Credentials
- Email: `admin@company.com`
- Password: `Admin@123`
- Role: `admin`
- Employee ID: `EMP001`

### 8.2 Pre-seeded Data
- 6 departments:
  - Engineering
  - HR
  - Finance
  - Marketing
  - Operations
  - Sales
- 6 leave types with configured max days.
- Leave balances auto-created for all new employees.

## 9. Success Criteria
- Role-based access is enforced across all endpoints and routes.
- Leave lifecycle transitions are validated and auditable.
- Balance updates are accurate for submit, approve, reject, and cancel actions.
- Dashboard data reflects real-time request and balance state.
- Authentication is secure and session behavior is consistent with 24-hour JWT expiry.
