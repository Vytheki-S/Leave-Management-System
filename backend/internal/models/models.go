package models

type UserRole string

const (
	RoleAdmin    UserRole = "admin"
	RoleManager  UserRole = "manager"
	RoleEmployee UserRole = "employee"
)

type LeaveStatus string
type LeaveRequestStatus string

const (
	LeavePending   LeaveStatus = "pending"
	LeaveApproved  LeaveStatus = "approved"
	LeaveRejected  LeaveStatus = "rejected"
	LeaveCancelled LeaveStatus = "cancelled"

	// Status constants for leaving request status field
	StatusPending   LeaveRequestStatus = "pending"
	StatusApproved  LeaveRequestStatus = "approved"
	StatusRejected  LeaveRequestStatus = "rejected"
	StatusCancelled LeaveRequestStatus = "cancelled"
)

// User model
type User struct {
	ID           string   `json:"id"`
	EmployeeID   string   `json:"employeeId"`
	FullName     string   `json:"fullName"`
	Email        string   `json:"email"`
	Role         UserRole `json:"role"`
	DepartmentID *int     `json:"departmentId,omitempty"`
	Position     *string  `json:"position,omitempty"`
	IsActive     bool     `json:"isActive"`
	PasswordHash string   `json:"-"`
	CreatedAt    string   `json:"createdAt,omitempty"`
	UpdatedAt    string   `json:"updatedAt,omitempty"`
}

// Department model
type Department struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	CreatedAt   string `json:"createdAt,omitempty"`
}

// LeaveType model
type LeaveType struct {
	ID             int    `json:"id"`
	Name           string `json:"name"`
	Description    string `json:"description,omitempty"`
	MaxDaysPerYear int    `json:"maxDaysPerYear"`
	IsActive       bool   `json:"isActive"`
	CreatedAt      string `json:"createdAt,omitempty"`
}

// LeaveBalance model
type LeaveBalance struct {
	ID            int    `json:"id"`
	UserID        string `json:"userId"`
	LeaveTypeID   int    `json:"leaveTypeId"`
	LeaveType     string `json:"leaveType,omitempty"`
	Year          int    `json:"year"`
	TotalDays     int    `json:"totalDays"`
	UsedDays      int    `json:"usedDays"`
	AvailableDays int    `json:"availableDays"` // Computed field
	CreatedAt     string `json:"createdAt,omitempty"`
	UpdatedAt     string `json:"updatedAt,omitempty"`
}

// LeaveRequest model
type LeaveRequest struct {
	ID            int64              `json:"id"`
	UserID        string             `json:"userId"`
	EmployeeName  string             `json:"employeeName,omitempty"`
	EmployeeEmail string             `json:"employeeEmail,omitempty"`
	LeaveTypeID   int                `json:"leaveTypeId"`
	LeaveTypeName string             `json:"leaveTypeName,omitempty"`
	StartDate     string             `json:"startDate"`
	EndDate       string             `json:"endDate"`
	Days          int                `json:"days,omitempty"` // Computed field
	Reason        string             `json:"reason"`
	Status        LeaveRequestStatus `json:"status"`
	RequestedAt   string             `json:"requestedAt"`
	ReviewedBy    *string            `json:"reviewedBy,omitempty"`
	ReviewedAt    *string            `json:"reviewedAt,omitempty"`
	ReviewComment *string            `json:"reviewComment,omitempty"`
	CancelledAt   *string            `json:"cancelledAt,omitempty"`
}

// Auth & Login DTOs
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type RegisterRequest struct {
	EmployeeID   string  `json:"employeeId" binding:"required"`
	FullName     string  `json:"fullName" binding:"required"`
	Email        string  `json:"email" binding:"required,email"`
	Password     string  `json:"password" binding:"required,min=6"`
	Role         string  `json:"role" binding:"required,oneof=admin manager employee"`
	DepartmentID *int    `json:"departmentId"`
	Position     *string `json:"position"`
}

type UpdateProfileRequest struct {
	FullName *string `json:"fullName"`
	Position *string `json:"position"`
}

type UpdateUserRequest struct {
	EmployeeID   *string `json:"employeeId"`
	FullName     *string `json:"fullName"`
	Email        *string `json:"email"`
	Role         *string `json:"role"`
	DepartmentID *int    `json:"departmentId"`
	Position     *string `json:"position"`
	IsActive     *bool   `json:"isActive"`
}

// Leave Request DTOs
type CreateLeaveRequest struct {
	LeaveTypeID int    `json:"leaveTypeId" binding:"required"`
	StartDate   string `json:"startDate" binding:"required,datetime=2006-01-02"`
	EndDate     string `json:"endDate" binding:"required,datetime=2006-01-02"`
	Days        int    `json:"days" binding:"required,gt=0"`
	Reason      string `json:"reason" binding:"required"`
}

type ReviewLeaveRequest struct {
	Status  string  `json:"status" binding:"required,oneof=approved rejected"`
	Comment *string `json:"comment"`
}

// Dashboard DTOs
type DashboardStats struct {
	TotalRequests     int                 `json:"totalRequests"`
	PendingRequests   int                 `json:"pendingRequests"`
	ApprovedRequests  int                 `json:"approvedRequests"`
	RejectedRequests  int                 `json:"rejectedRequests"`
	CancelledRequests int                 `json:"cancelledRequests"`
	TrendData         []TrendDataPoint    `json:"trendData,omitempty"`
	TopLeaveTypes     []LeaveTypeStats    `json:"topLeaveTypes,omitempty"`
	TeamSummary       []TeamMemberSummary `json:"teamSummary,omitempty"`
}

type TrendDataPoint struct {
	Month    string `json:"month"`
	Requests int    `json:"requests"`
	Approved int    `json:"approved"`
	Rejected int    `json:"rejected"`
}

type LeaveTypeStats struct {
	Name     string `json:"name"`
	Requests int    `json:"requests"`
}

type TeamMemberSummary struct {
	UserID       string `json:"userId"`
	EmployeeName string `json:"employeeName"`
	Department   string `json:"department"`
	PendingDays  int    `json:"pendingDays"`
	ApprovedDays int    `json:"approvedDays"`
	TotalBalance int    `json:"totalBalance"`
}

// Error & Message responses
type APIError struct {
	Error     string              `json:"error"`
	Message   string              `json:"message"`
	Fields    map[string][]string `json:"fields,omitempty"`
	Timestamp string              `json:"timestamp"`
}

type APIMessage struct {
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}
