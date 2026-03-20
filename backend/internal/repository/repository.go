package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"time"

	"leave-management/backend/internal/models"

	"golang.org/x/crypto/bcrypt"
)

type Repository struct {
	DB *sql.DB
}

func New(db *sql.DB) *Repository {
	return &Repository{DB: db}
}

// ============ AUTH & USER QUERIES ============

func (r *Repository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	if r.DB == nil {
		return seedUserByEmail(email)
	}

	query := `
		SELECT id, employee_id, full_name, email, role, department_id, position, is_active, password_hash, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	var user models.User
	if err := r.DB.QueryRowContext(ctx, query, email).Scan(
		&user.ID,
		&user.EmployeeID,
		&user.FullName,
		&user.Email,
		&user.Role,
		&user.DepartmentID,
		&user.Position,
		&user.IsActive,
		&user.PasswordHash,
		&user.CreatedAt,
		&user.UpdatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("invalid credentials")
		}
		return nil, err
	}

	return &user, nil
}

func (r *Repository) GetUserByID(ctx context.Context, userID string) (*models.User, error) {
	if r.DB == nil {
		if userID == "u-admin" {
			return &models.User{ID: "u-admin", EmployeeID: "EMP001", FullName: "Admin User", Email: "admin@company.com", Role: models.RoleAdmin, IsActive: true}, nil
		}
		return &models.User{ID: "u-employee", EmployeeID: "EMP003", FullName: "Employee User", Email: "employee@company.com", Role: models.RoleEmployee, IsActive: true}, nil
	}

	query := `
		SELECT id, employee_id, full_name, email, role, department_id, position, is_active, password_hash, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	var user models.User
	if err := r.DB.QueryRowContext(ctx, query, userID).Scan(
		&user.ID,
		&user.EmployeeID,
		&user.FullName,
		&user.Email,
		&user.Role,
		&user.DepartmentID,
		&user.Position,
		&user.IsActive,
		&user.PasswordHash,
		&user.CreatedAt,
		&user.UpdatedAt,
	); err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) CreateUser(ctx context.Context, user *models.User) error {
	if r.DB == nil {
		return nil
	}

	query := `
		INSERT INTO users (id, employee_id, full_name, email, password_hash, role, department_id, position, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id
	`

	if user.ID == "" {
		user.ID = fmt.Sprintf("u-%d", time.Now().UnixNano())
	}

	return r.DB.QueryRowContext(ctx, query,
		user.ID,
		user.EmployeeID,
		user.FullName,
		user.Email,
		user.PasswordHash,
		user.Role,
		user.DepartmentID,
		user.Position,
		user.IsActive,
		user.CreatedAt,
		user.UpdatedAt,
	).Scan(&user.ID)
}

func (r *Repository) ListUsers(ctx context.Context) ([]*models.User, error) {
	if r.DB == nil {
		users := seedAllUsers()
		result := make([]*models.User, len(users))
		for i := range users {
			result[i] = &users[i]
		}
		return result, nil
	}

	query := `
		SELECT id, employee_id, full_name, email, role, department_id, position, is_active, password_hash, created_at, updated_at
		FROM users
		ORDER BY is_active DESC, full_name ASC
	`

	rows, err := r.DB.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]*models.User, 0)
	for rows.Next() {
		var user models.User
		if err := rows.Scan(
			&user.ID,
			&user.EmployeeID,
			&user.FullName,
			&user.Email,
			&user.Role,
			&user.DepartmentID,
			&user.Position,
			&user.IsActive,
			&user.PasswordHash,
			&user.CreatedAt,
			&user.UpdatedAt,
		); err != nil {
			return nil, err
		}
		users = append(users, &user)
	}

	return users, rows.Err()
}

func (r *Repository) UpdateUser(ctx context.Context, user *models.User) error {
	if r.DB == nil {
		return nil
	}

	query := `
		UPDATE users
		SET employee_id = $1, full_name = $2, email = $3, role = $4, department_id = $5, position = $6, is_active = $7, updated_at = $8
		WHERE id = $9
	`

	_, err := r.DB.ExecContext(ctx, query, user.EmployeeID, user.FullName, user.Email, user.Role, user.DepartmentID, user.Position, user.IsActive, user.UpdatedAt, user.ID)
	return err
}

func (r *Repository) InitializeLeaveBalancesForUser(ctx context.Context, userID string, year int) error {
	if r.DB == nil {
		return nil
	}

	query := `
		INSERT INTO leave_balances (user_id, leave_type_id, year, total_days, used_days)
		SELECT $1, lt.id, $2, lt.max_days_per_year, 0
		FROM leave_types lt
		WHERE lt.is_active = TRUE
		ON CONFLICT (user_id, leave_type_id, year) DO NOTHING
	`

	_, err := r.DB.ExecContext(ctx, query, userID, year)
	return err
}

func (r *Repository) DeactivateUser(ctx context.Context, userID string) error {
	if r.DB == nil {
		return nil
	}

	query := `
		UPDATE users
		SET is_active = FALSE, updated_at = NOW()
		WHERE id = $1
	`

	_, err := r.DB.ExecContext(ctx, query, userID)
	return err
}

// ============ LEAVE TYPE QUERIES ============

func (r *Repository) GetLeaveTypes(ctx context.Context) ([]models.LeaveType, error) {
	if r.DB == nil {
		return seedLeaveTypes(), nil
	}

	query := `
		SELECT id, name, description, max_days_per_year, is_active, created_at
		FROM leave_types
		WHERE is_active = TRUE
		ORDER BY name ASC
	`

	rows, err := r.DB.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	leaveTypes := make([]models.LeaveType, 0)
	for rows.Next() {
		var lt models.LeaveType
		if err := rows.Scan(
			&lt.ID,
			&lt.Name,
			&lt.Description,
			&lt.MaxDaysPerYear,
			&lt.IsActive,
			&lt.CreatedAt,
		); err != nil {
			return nil, err
		}
		leaveTypes = append(leaveTypes, lt)
	}

	return leaveTypes, rows.Err()
}

func (r *Repository) GetLeaveTypeByID(ctx context.Context, ltID int) (*models.LeaveType, error) {
	if r.DB == nil {
		return nil, errors.New("leave type not found")
	}

	query := `
		SELECT id, name, description, max_days_per_year, is_active, created_at
		FROM leave_types
		WHERE id = $1
	`

	var lt models.LeaveType
	if err := r.DB.QueryRowContext(ctx, query, ltID).Scan(
		&lt.ID,
		&lt.Name,
		&lt.Description,
		&lt.MaxDaysPerYear,
		&lt.IsActive,
		&lt.CreatedAt,
	); err != nil {
		return nil, err
	}

	return &lt, nil
}

// ============ LEAVE BALANCE QUERIES ============

func (r *Repository) GetLeaveBalances(ctx context.Context, userID string) ([]*models.LeaveBalance, error) {
	year := time.Now().Year()

	if r.DB == nil {
		balances := seedLeaveBalances(userID)
		result := make([]*models.LeaveBalance, len(balances))
		for i := range balances {
			result[i] = &balances[i]
		}
		return result, nil
	}

	query := `
		SELECT lb.id, lb.user_id, lb.leave_type_id, lt.name, lb.year, lb.total_days, lb.used_days, lb.created_at, lb.updated_at
		FROM leave_balances lb
		JOIN leave_types lt ON lb.leave_type_id = lt.id
		WHERE lb.user_id = $1 AND lb.year = $2
		ORDER BY lt.name ASC
	`

	rows, err := r.DB.QueryContext(ctx, query, userID, year)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	balances := make([]*models.LeaveBalance, 0)
	for rows.Next() {
		var balance models.LeaveBalance
		if err := rows.Scan(
			&balance.ID,
			&balance.UserID,
			&balance.LeaveTypeID,
			&balance.LeaveType,
			&balance.Year,
			&balance.TotalDays,
			&balance.UsedDays,
			&balance.CreatedAt,
			&balance.UpdatedAt,
		); err != nil {
			return nil, err
		}
		balance.AvailableDays = balance.TotalDays - balance.UsedDays
		balances = append(balances, &balance)
	}

	return balances, rows.Err()
}

func (r *Repository) GetLeaveBalance(ctx context.Context, userID string, leaveTypeID int, year int) (*models.LeaveBalance, error) {
	if r.DB == nil {
		return &models.LeaveBalance{
			UserID:        userID,
			LeaveTypeID:   leaveTypeID,
			Year:          year,
			TotalDays:     20,
			UsedDays:      0,
			AvailableDays: 20,
		}, nil
	}

	query := `
		SELECT id, user_id, leave_type_id, year, total_days, used_days
		FROM leave_balances
		WHERE user_id = $1 AND leave_type_id = $2 AND year = $3
	`

	var balance models.LeaveBalance
	if err := r.DB.QueryRowContext(ctx, query, userID, leaveTypeID, year).Scan(
		&balance.ID,
		&balance.UserID,
		&balance.LeaveTypeID,
		&balance.Year,
		&balance.TotalDays,
		&balance.UsedDays,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("leave balance not found")
		}
		return nil, err
	}

	balance.AvailableDays = balance.TotalDays - balance.UsedDays
	return &balance, nil
}

func (r *Repository) UpdateLeaveBalance(ctx context.Context, balance *models.LeaveBalance) error {
	if r.DB == nil {
		return nil
	}

	query := `
		UPDATE leave_balances
		SET used_days = $1, updated_at = $2
		WHERE id = $3
	`

	_, err := r.DB.ExecContext(ctx, query, balance.UsedDays, balance.UpdatedAt, balance.ID)
	return err
}

// ============ LEAVE REQUEST QUERIES ============

func (r *Repository) CreateLeaveRequest(ctx context.Context, leaveReq *models.LeaveRequest) (*models.LeaveRequest, error) {
	if r.DB == nil {
		leaveReq.ID = time.Now().Unix()
		return leaveReq, nil
	}

	query := `
		INSERT INTO leave_requests (user_id, leave_type_id, start_date, end_date, reason, status)
		VALUES ($1, $2, $3::DATE, $4::DATE, $5, $6)
		RETURNING id, requested_at
	`

	if err := r.DB.QueryRowContext(
		ctx,
		query,
		leaveReq.UserID,
		leaveReq.LeaveTypeID,
		leaveReq.StartDate,
		leaveReq.EndDate,
		leaveReq.Reason,
		leaveReq.Status,
	).Scan(&leaveReq.ID, &leaveReq.RequestedAt); err != nil {
		return nil, err
	}

	return leaveReq, nil
}

func (r *Repository) GetLeaveRequest(ctx context.Context, requestID string) (*models.LeaveRequest, error) {
	// Convert string to int64
	id, err := strconv.ParseInt(requestID, 10, 64)
	if err != nil {
		return nil, errors.New("invalid request ID")
	}

	if r.DB == nil {
		return nil, errors.New("leave request not found")
	}

	query := `
		SELECT 
			lr.id, lr.user_id, u.full_name, u.email, lr.leave_type_id, lt.name,
			lr.start_date::text, lr.end_date::text, (lr.end_date - lr.start_date + 1)::int, lr.reason, lr.status,
			lr.requested_at::text, lr.reviewed_by, lr.reviewed_at::text, lr.review_comment, lr.cancelled_at::text
		FROM leave_requests lr
		JOIN users u ON lr.user_id = u.id
		JOIN leave_types lt ON lr.leave_type_id = lt.id
		WHERE lr.id = $1
	`

	var req models.LeaveRequest
	if err := r.DB.QueryRowContext(ctx, query, id).Scan(
		&req.ID,
		&req.UserID,
		&req.EmployeeName,
		&req.EmployeeEmail,
		&req.LeaveTypeID,
		&req.LeaveTypeName,
		&req.StartDate,
		&req.EndDate,
		&req.Days,
		&req.Reason,
		&req.Status,
		&req.RequestedAt,
		&req.ReviewedBy,
		&req.ReviewedAt,
		&req.ReviewComment,
		&req.CancelledAt,
	); err != nil {
		return nil, err
	}

	return &req, nil
}

func (r *Repository) ListLeaveRequests(ctx context.Context) ([]*models.LeaveRequest, error) {
	if r.DB == nil {
		requests := seedLeaveRequests()
		result := make([]*models.LeaveRequest, len(requests))
		for i := range requests {
			result[i] = &requests[i]
		}
		return result, nil
	}

	query := `
		SELECT 
			lr.id, lr.user_id, u.full_name, u.email, lr.leave_type_id, lt.name,
			lr.start_date::text, lr.end_date::text, (lr.end_date - lr.start_date + 1)::int, lr.reason, lr.status,
			lr.requested_at::text, lr.reviewed_by, lr.reviewed_at::text, lr.review_comment, lr.cancelled_at::text
		FROM leave_requests lr
		JOIN users u ON lr.user_id = u.id
		JOIN leave_types lt ON lr.leave_type_id = lt.id
		ORDER BY lr.requested_at DESC
	`

	rows, err := r.DB.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	requests := make([]*models.LeaveRequest, 0)
	for rows.Next() {
		var req models.LeaveRequest
		if err := rows.Scan(
			&req.ID,
			&req.UserID,
			&req.EmployeeName,
			&req.EmployeeEmail,
			&req.LeaveTypeID,
			&req.LeaveTypeName,
			&req.StartDate,
			&req.EndDate,
			&req.Days,
			&req.Reason,
			&req.Status,
			&req.RequestedAt,
			&req.ReviewedBy,
			&req.ReviewedAt,
			&req.ReviewComment,
			&req.CancelledAt,
		); err != nil {
			return nil, err
		}
		requests = append(requests, &req)
	}

	return requests, rows.Err()
}

func (r *Repository) ListLeaveRequestsByUser(ctx context.Context, userID string) ([]*models.LeaveRequest, error) {
	if r.DB == nil {
		requests := seedLeaveRequests()
		result := make([]*models.LeaveRequest, 0)
		for i := range requests {
			if requests[i].UserID == userID {
				result = append(result, &requests[i])
			}
		}
		return result, nil
	}

	query := `
		SELECT 
			lr.id, lr.user_id, u.full_name, u.email, lr.leave_type_id, lt.name,
			lr.start_date::text, lr.end_date::text, (lr.end_date - lr.start_date + 1)::int, lr.reason, lr.status,
			lr.requested_at::text, lr.reviewed_by, lr.reviewed_at::text, lr.review_comment, lr.cancelled_at::text
		FROM leave_requests lr
		JOIN users u ON lr.user_id = u.id
		JOIN leave_types lt ON lr.leave_type_id = lt.id
		WHERE lr.user_id = $1
		ORDER BY lr.requested_at DESC
	`

	rows, err := r.DB.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	requests := make([]*models.LeaveRequest, 0)
	for rows.Next() {
		var req models.LeaveRequest
		if err := rows.Scan(
			&req.ID,
			&req.UserID,
			&req.EmployeeName,
			&req.EmployeeEmail,
			&req.LeaveTypeID,
			&req.LeaveTypeName,
			&req.StartDate,
			&req.EndDate,
			&req.Days,
			&req.Reason,
			&req.Status,
			&req.RequestedAt,
			&req.ReviewedBy,
			&req.ReviewedAt,
			&req.ReviewComment,
			&req.CancelledAt,
		); err != nil {
			return nil, err
		}
		requests = append(requests, &req)
	}

	return requests, rows.Err()
}

func (r *Repository) ReviewLeaveRequest(ctx context.Context, leaveReq *models.LeaveRequest) error {
	if r.DB == nil {
		return nil
	}

	query := `
		UPDATE leave_requests
		SET status = $1, reviewed_by = $2, reviewed_at = $3, review_comment = $4
		WHERE id = $5
	`

	_, err := r.DB.ExecContext(ctx, query, leaveReq.Status, leaveReq.ReviewedBy, leaveReq.ReviewedAt, leaveReq.ReviewComment, leaveReq.ID)
	return err
}

func (r *Repository) CancelLeaveRequest(ctx context.Context, leaveReq *models.LeaveRequest) error {
	if r.DB == nil {
		return nil
	}

	query := `
		UPDATE leave_requests
		SET status = $1, cancelled_at = $2
		WHERE id = $3 AND status = 'pending'
	`

	_, err := r.DB.ExecContext(ctx, query, leaveReq.Status, leaveReq.CancelledAt, leaveReq.ID)
	return err
}

// ============ DEPARTMENT QUERIES ============

func (r *Repository) GetDepartments(ctx context.Context) ([]*models.Department, error) {
	if r.DB == nil {
		depts := seedDepartments()
		result := make([]*models.Department, len(depts))
		for i := range depts {
			result[i] = &depts[i]
		}
		return result, nil
	}

	query := `
		SELECT id, name, description, created_at
		FROM departments
		ORDER BY name ASC
	`

	rows, err := r.DB.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	depts := make([]*models.Department, 0)
	for rows.Next() {
		var dept models.Department
		if err := rows.Scan(&dept.ID, &dept.Name, &dept.Description, &dept.CreatedAt); err != nil {
			return nil, err
		}
		depts = append(depts, &dept)
	}

	return depts, rows.Err()
}

// ============ DASHBOARD QUERIES ============

func (r *Repository) GetDashboardStats(ctx context.Context, role string, userID string, year int) (*models.DashboardStats, error) {
	if r.DB == nil {
		return seedDashboardStats(), nil
	}

	stats := &models.DashboardStats{}

	// Get request counts
	countQuery := `
		SELECT
			COUNT(*) as total,
			COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
			COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
			COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
			COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
		FROM leave_requests
		WHERE EXTRACT(YEAR FROM requested_at) = $1
	`

	countArgs := []interface{}{year}

	if role == string(models.RoleEmployee) {
		countQuery += " AND user_id = $2"
		countArgs = append(countArgs, userID)
	}

	err := r.DB.QueryRowContext(ctx, countQuery, countArgs...).Scan(
		&stats.TotalRequests,
		&stats.PendingRequests,
		&stats.ApprovedRequests,
		&stats.RejectedRequests,
		&stats.CancelledRequests,
	)
	if err != nil {
		return nil, err
	}

	// Get trend data (last 6 months)
	trendQuery := `
		SELECT
			TO_CHAR(DATE_TRUNC('month', requested_at), 'Mon') as month,
			COUNT(*) as requests,
			COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
			COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
		FROM leave_requests
		WHERE requested_at >= NOW() - INTERVAL '6 months'
		AND EXTRACT(YEAR FROM requested_at) = $1
	`

	trendArgs := []interface{}{year}

	if role == string(models.RoleEmployee) {
		trendQuery += " AND user_id = $2"
		trendArgs = append(trendArgs, userID)
	}

	trendQuery += ` 
		GROUP BY DATE_TRUNC('month', requested_at)
		ORDER BY DATE_TRUNC('month', requested_at)
	`

	rows, err := r.DB.QueryContext(ctx, trendQuery, trendArgs...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	trendData := make([]models.TrendDataPoint, 0)
	for rows.Next() {
		var point models.TrendDataPoint
		if err := rows.Scan(&point.Month, &point.Requests, &point.Approved, &point.Rejected); err != nil {
			return nil, err
		}
		trendData = append(trendData, point)
	}
	stats.TrendData = trendData

	return stats, nil
}

// ============ SEED DATA (Fallback) ============

func seedUserByEmail(email string) (*models.User, error) {
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	switch email {
	case "admin@company.com":
		return &models.User{ID: "u-admin", EmployeeID: "EMP001", FullName: "Admin User", Email: email, Role: models.RoleAdmin, IsActive: true, PasswordHash: string(passwordHash)}, nil
	case "manager@company.com":
		return &models.User{ID: "u-manager", EmployeeID: "EMP002", FullName: "Manager User", Email: email, Role: models.RoleManager, IsActive: true, PasswordHash: string(passwordHash)}, nil
	case "employee@company.com":
		return &models.User{ID: "u-employee", EmployeeID: "EMP003", FullName: "Employee User", Email: email, Role: models.RoleEmployee, IsActive: true, PasswordHash: string(passwordHash)}, nil
	default:
		return nil, errors.New("invalid credentials")
	}
}

func seedAllUsers() []models.User {
	return []models.User{
		{ID: "u-admin", EmployeeID: "EMP001", FullName: "Admin User", Email: "admin@company.com", Role: models.RoleAdmin, IsActive: true},
		{ID: "u-manager", EmployeeID: "EMP002", FullName: "Manager User", Email: "manager@company.com", Role: models.RoleManager, IsActive: true},
		{ID: "u-employee", EmployeeID: "EMP003", FullName: "Employee User", Email: "employee@company.com", Role: models.RoleEmployee, IsActive: true},
	}
}

func seedLeaveTypes() []models.LeaveType {
	return []models.LeaveType{
		{ID: 1, Name: "Annual Leave", MaxDaysPerYear: 20, IsActive: true},
		{ID: 2, Name: "Sick Leave", MaxDaysPerYear: 10, IsActive: true},
		{ID: 3, Name: "Casual Leave", MaxDaysPerYear: 5, IsActive: true},
		{ID: 4, Name: "Maternity Leave", MaxDaysPerYear: 90, IsActive: true},
		{ID: 5, Name: "Paternity Leave", MaxDaysPerYear: 14, IsActive: true},
		{ID: 6, Name: "Compassionate Leave", MaxDaysPerYear: 3, IsActive: true},
	}
}

func seedLeaveBalances(userID string) []models.LeaveBalance {
	return []models.LeaveBalance{
		{UserID: userID, LeaveTypeID: 1, Year: 2026, TotalDays: 20, UsedDays: 0, AvailableDays: 20},
		{UserID: userID, LeaveTypeID: 2, Year: 2026, TotalDays: 10, UsedDays: 0, AvailableDays: 10},
		{UserID: userID, LeaveTypeID: 3, Year: 2026, TotalDays: 5, UsedDays: 0, AvailableDays: 5},
	}
}

func seedLeaveRequests() []models.LeaveRequest {
	return []models.LeaveRequest{
		{
			ID:            1,
			UserID:        "u-employee",
			EmployeeName:  "Employee User",
			LeaveTypeID:   1,
			LeaveTypeName: "Annual Leave",
			StartDate:     "2026-04-10",
			EndDate:       "2026-04-12",
			Days:          3,
			Reason:        "Family vacation",
			Status:        models.StatusPending,
			RequestedAt:   time.Now().Format(time.RFC3339),
		},
	}
}

func seedDepartments() []models.Department {
	return []models.Department{
		{ID: 1, Name: "Engineering", Description: "Software development"},
		{ID: 2, Name: "HR", Description: "Human resources"},
		{ID: 3, Name: "Finance", Description: "Financial planning"},
		{ID: 4, Name: "Marketing", Description: "Marketing team"},
		{ID: 5, Name: "Operations", Description: "Business operations"},
		{ID: 6, Name: "Sales", Description: "Sales team"},
	}
}

func seedDashboardStats() *models.DashboardStats {
	return &models.DashboardStats{
		TotalRequests:    15,
		PendingRequests:  5,
		ApprovedRequests: 8,
		RejectedRequests: 2,
		TrendData: []models.TrendDataPoint{
			{Month: "Jan", Requests: 10, Approved: 7, Rejected: 1},
			{Month: "Feb", Requests: 12, Approved: 8, Rejected: 2},
			{Month: "Mar", Requests: 15, Approved: 10, Rejected: 2},
		},
	}
}
