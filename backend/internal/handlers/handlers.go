package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"leave-management/backend/internal/middleware"
	"leave-management/backend/internal/models"
	"leave-management/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	repo      *repository.Repository
	jwtSecret []byte
}

func New(repo *repository.Repository, jwtSecret []byte) *Handler {
	return &Handler{repo: repo, jwtSecret: jwtSecret}
}

func (h *Handler) RegisterRoutes(router *gin.Engine) {
	api := router.Group("/api")
	{
		// Public endpoints
		api.GET("/health", h.Health)
		api.POST("/auth/login", h.Login)

		// Protected endpoints
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware(h.jwtSecret))
		{
			// Profile & Auth
			protected.GET("/profile", h.GetProfile)
			protected.PUT("/profile", h.UpdateProfile)
			protected.POST("/auth/register", middleware.RoleGuard(string(models.RoleAdmin)), h.Register)

			// Users (admin + manager)
			usersGroup := protected.Group("/users")
			usersGroup.Use(middleware.RoleGuard(string(models.RoleAdmin), string(models.RoleManager)))
			{
				usersGroup.GET("", h.ListUsers)
				usersGroup.PUT("/:userID", h.UpdateUser)
				usersGroup.DELETE("/:userID/deactivate", middleware.RoleGuard(string(models.RoleAdmin)), h.DeactivateUser)
			}

			// Leave Types (all authenticated)
			protected.GET("/leave-types", h.GetLeaveTypes)

			// Leave Balances
			protected.GET("/leave-balances", h.GetLeaveBalances)
			protected.GET("/leave-balances/:userID", h.GetUserBalances)

			// Leave Requests
			leaveGroup := protected.Group("/leave-requests")
			{
				leaveGroup.POST("", h.CreateLeaveRequest)
				leaveGroup.GET("", h.ListLeaveRequests)
				leaveGroup.GET("/:requestID", h.GetLeaveRequest)
				leaveGroup.DELETE("/:requestID/cancel", h.CancelLeaveRequest)

				// Review (admin + manager only)
				leaveGroup.PUT("/:requestID/review", middleware.RoleGuard(string(models.RoleAdmin), string(models.RoleManager)), h.ReviewLeaveRequest)
			}

			// Departments (admin + manager)
			protected.GET("/departments", h.GetDepartments)

			// Dashboard (admin + manager)
			dashboardGroup := protected.Group("/dashboard")
			dashboardGroup.Use(middleware.RoleGuard(string(models.RoleAdmin), string(models.RoleManager)))
			{
				dashboardGroup.GET("", h.GetDashboard)
			}
		}
	}
}

// ============== Health ==============
func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: gin.H{
			"status":  "ok",
			"service": "leave-management-api",
		},
	})
}

// ============== Auth ==============
func (h *Handler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "invalid login payload",
		})
		return
	}

	user, err := h.repo.GetUserByEmail(c.Request.Context(), req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "invalid credentials",
		})
		return
	}

	if !user.IsActive {
		c.JSON(http.StatusForbidden, models.APIResponse{
			Success: false,
			Error:   "account is inactive",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "invalid credentials",
		})
		return
	}

	token, err := middleware.GenerateToken(user.ID, string(user.Role), h.jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "failed to generate token",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: models.LoginResponse{
			Token: token,
			User:  *user,
		},
	})
}

func (h *Handler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "invalid register payload",
		})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "failed to hash password",
		})
		return
	}

	now := time.Now().Format(time.RFC3339)
	role := models.RoleEmployee
	if req.Role != "" {
		role = models.UserRole(req.Role)
	}

	user := models.User{
		EmployeeID:   req.EmployeeID,
		Email:        req.Email,
		FullName:     req.FullName,
		PasswordHash: string(hashedPassword),
		Role:         role,
		DepartmentID: req.DepartmentID,
		Position:     req.Position,
		IsActive:     true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := h.repo.CreateUser(c.Request.Context(), &user); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "failed to create user",
		})
		return
	}

	if err := h.repo.InitializeLeaveBalancesForUser(c.Request.Context(), user.ID, time.Now().Year()); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "failed to initialize leave balances",
		})
		return
	}

	token, err := middleware.GenerateToken(user.ID, string(user.Role), h.jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "failed to generate token",
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Data: models.LoginResponse{
			Token: token,
			User:  user,
		},
	})
}

// ============== Profile ==============
func (h *Handler) GetProfile(c *gin.Context) {
	userID := c.GetString("userID")

	user, err := h.repo.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Error:   "user not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    user,
	})
}

func (h *Handler) UpdateProfile(c *gin.Context) {
	userID := c.GetString("userID")

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "invalid update payload",
		})
		return
	}

	user, err := h.repo.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Error:   "user not found",
		})
		return
	}

	if req.FullName != nil && *req.FullName != "" {
		user.FullName = *req.FullName
	}
	if req.Position != nil && *req.Position != "" {
		user.Position = req.Position
	}
	user.UpdatedAt = time.Now().Format(time.RFC3339)

	if err := h.repo.UpdateUser(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "failed to update profile",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    user,
	})
}

// ============== Users ==============
func (h *Handler) ListUsers(c *gin.Context) {
	users, err := h.repo.ListUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "failed to fetch users",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    users,
	})
}

func (h *Handler) UpdateUser(c *gin.Context) {
	userID := c.Param("userID")

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "invalid update payload",
		})
		return
	}

	user, err := h.repo.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Error:   "user not found",
		})
		return
	}

	if req.EmployeeID != nil && strings.TrimSpace(*req.EmployeeID) != "" {
		user.EmployeeID = strings.TrimSpace(*req.EmployeeID)
	}
	if req.FullName != nil && strings.TrimSpace(*req.FullName) != "" {
		user.FullName = strings.TrimSpace(*req.FullName)
	}
	if req.Email != nil && strings.TrimSpace(*req.Email) != "" {
		user.Email = strings.TrimSpace(*req.Email)
	}
	if req.Role != nil {
		nextRole := strings.TrimSpace(strings.ToLower(*req.Role))
		if !isAllowedUserRole(nextRole) {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Error:   "invalid user role",
			})
			return
		}
		user.Role = models.UserRole(nextRole)
	}
	if req.DepartmentID != nil {
		user.DepartmentID = req.DepartmentID
	}
	if req.Position != nil {
		nextPosition := strings.TrimSpace(*req.Position)
		if nextPosition == "" {
			user.Position = nil
		} else {
			user.Position = &nextPosition
		}
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	user.UpdatedAt = time.Now().Format(time.RFC3339)

	if err := h.repo.UpdateUser(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "failed to update user",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    user,
	})
}

func (h *Handler) DeactivateUser(c *gin.Context) {
	userID := c.Param("userID")

	user, err := h.repo.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Error:   "user not found",
		})
		return
	}

	user.IsActive = false
	user.UpdatedAt = time.Now().Format(time.RFC3339)

	if err := h.repo.UpdateUser(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "failed to deactivate user",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    user,
	})
}

// ============== Leave Types ==============
func (h *Handler) GetLeaveTypes(c *gin.Context) {
	leaveTypes, err := h.repo.GetLeaveTypes(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "failed to fetch leave types",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    leaveTypes,
	})
}

// ============== Leave Balances ==============
func (h *Handler) GetLeaveBalances(c *gin.Context) {
	userID := c.GetString("userID")

	balances, err := h.repo.GetLeaveBalances(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "failed to fetch leave balances",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    balances,
	})
}

func (h *Handler) GetUserBalances(c *gin.Context) {
	targetUserID := c.Param("userID")
	requesterID := c.GetString("userID")
	requesterRole := c.GetString("role")

	// Only allow viewing own balances or if admin/manager
	if targetUserID != requesterID && requesterRole != string(models.RoleAdmin) && requesterRole != string(models.RoleManager) {
		c.JSON(http.StatusForbidden, models.APIResponse{
			Success: false,
			Error:   "unauthorized",
		})
		return
	}

	balances, err := h.repo.GetLeaveBalances(c.Request.Context(), targetUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "failed to fetch user leave balances",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    balances,
	})
}

// ============== Leave Requests ==============
func (h *Handler) CreateLeaveRequest(c *gin.Context) {
	userID := c.GetString("userID")

	var req models.CreateLeaveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "invalid leave request payload",
		})
		return
	}

	// Validate balance
	balance, err := h.repo.GetLeaveBalance(c.Request.Context(), userID, req.LeaveTypeID, time.Now().Year())
	if err != nil || balance.AvailableDays < req.Days {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "insufficient leave balance",
		})
		return
	}

	now := time.Now().Format(time.RFC3339)
	leaveReq := models.LeaveRequest{
		UserID:      userID,
		LeaveTypeID: req.LeaveTypeID,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		Days:        req.Days,
		Reason:      req.Reason,
		Status:      models.StatusPending,
		RequestedAt: now,
	}

	created, err := h.repo.CreateLeaveRequest(c.Request.Context(), &leaveReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "failed to create leave request",
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Data:    created,
	})
}

func (h *Handler) ListLeaveRequests(c *gin.Context) {
	userID := c.GetString("userID")
	role := c.GetString("role")
	statusFilter := strings.TrimSpace(strings.ToLower(c.Query("status")))

	if statusFilter != "" && statusFilter != "all" && !isAllowedLeaveStatus(statusFilter) {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "invalid status filter",
		})
		return
	}

	// Employees see only their own requests; managers/admins see all
	var requests []*models.LeaveRequest
	var err error

	if role == string(models.RoleEmployee) {
		requests, err = h.repo.ListLeaveRequestsByUser(c.Request.Context(), userID)
	} else {
		requests, err = h.repo.ListLeaveRequests(c.Request.Context())
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "failed to fetch leave requests",
		})
		return
	}

	if statusFilter != "" && statusFilter != "all" {
		filtered := make([]*models.LeaveRequest, 0, len(requests))
		for _, request := range requests {
			if strings.EqualFold(string(request.Status), statusFilter) {
				filtered = append(filtered, request)
			}
		}
		requests = filtered
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    requests,
	})
}

func (h *Handler) GetLeaveRequest(c *gin.Context) {
	requestID := c.Param("requestID")
	userID := c.GetString("userID")
	role := c.GetString("role")

	request, err := h.repo.GetLeaveRequest(c.Request.Context(), requestID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Error:   "leave request not found",
		})
		return
	}

	// Employees can only view their own requests
	if role == string(models.RoleEmployee) && request.UserID != userID {
		c.JSON(http.StatusForbidden, models.APIResponse{
			Success: false,
			Error:   "unauthorized",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    request,
	})
}

func (h *Handler) ReviewLeaveRequest(c *gin.Context) {
	requestID := c.Param("requestID")
	reviewerID := c.GetString("userID")

	var req models.ReviewLeaveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "invalid review payload",
		})
		return
	}

	leaveReq, err := h.repo.GetLeaveRequest(c.Request.Context(), requestID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Error:   "leave request not found",
		})
		return
	}

	if leaveReq.Status != models.StatusPending {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "can only review pending requests",
		})
		return
	}

	// Update leave request
	leaveReq.Status = models.LeaveRequestStatus(req.Status)
	leaveReq.ReviewedBy = &reviewerID
	now := time.Now().Format(time.RFC3339)
	leaveReq.ReviewedAt = &now
	leaveReq.ReviewComment = req.Comment

	// Update balance if approved
	if req.Status == string(models.StatusApproved) {
		balance, err := h.repo.GetLeaveBalance(c.Request.Context(), leaveReq.UserID, leaveReq.LeaveTypeID, time.Now().Year())
		if err == nil && balance != nil {
			balance.UsedDays += leaveReq.Days
			balance.UpdatedAt = time.Now().Format(time.RFC3339)
			h.repo.UpdateLeaveBalance(c.Request.Context(), balance)
		}
	}

	if err := h.repo.ReviewLeaveRequest(c.Request.Context(), leaveReq); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "failed to review leave request",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    leaveReq,
	})
}

func (h *Handler) CancelLeaveRequest(c *gin.Context) {
	requestID := c.Param("requestID")
	userID := c.GetString("userID")

	leaveReq, err := h.repo.GetLeaveRequest(c.Request.Context(), requestID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Error:   "leave request not found",
		})
		return
	}

	if leaveReq.UserID != userID {
		c.JSON(http.StatusForbidden, models.APIResponse{
			Success: false,
			Error:   "unauthorized",
		})
		return
	}

	if leaveReq.Status != models.StatusPending {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "can only cancel pending requests",
		})
		return
	}

	now := time.Now().Format(time.RFC3339)
	leaveReq.Status = models.StatusCancelled
	leaveReq.CancelledAt = &now

	if err := h.repo.CancelLeaveRequest(c.Request.Context(), leaveReq); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "failed to cancel leave request",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    leaveReq,
	})
}

// ============== Departments ==============
func (h *Handler) GetDepartments(c *gin.Context) {
	departments, err := h.repo.GetDepartments(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "failed to fetch departments",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    departments,
	})
}

// ============== Dashboard ==============
func (h *Handler) GetDashboard(c *gin.Context) {
	role := c.GetString("role")
	userID := c.GetString("userID")
	yearStr := c.DefaultQuery("year", strconv.Itoa(time.Now().Year()))

	year, err := strconv.Atoi(yearStr)
	if err != nil {
		year = time.Now().Year()
	}

	stats, err := h.repo.GetDashboardStats(c.Request.Context(), role, userID, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "failed to fetch dashboard stats",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    stats,
	})
}

func isAllowedLeaveStatus(status string) bool {
	switch models.LeaveRequestStatus(status) {
	case models.StatusPending, models.StatusApproved, models.StatusRejected, models.StatusCancelled:
		return true
	default:
		return false
	}
}

func isAllowedUserRole(role string) bool {
	switch models.UserRole(role) {
	case models.RoleAdmin, models.RoleManager, models.RoleEmployee:
		return true
	default:
		return false
	}
}
