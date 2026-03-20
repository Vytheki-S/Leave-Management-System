package handlers

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    "leave-management/backend/internal/middleware"
    "leave-management/backend/internal/repository"

    "github.com/gin-gonic/gin"
)

func newTestRouter(t *testing.T) *gin.Engine {
    t.Helper()
    gin.SetMode(gin.TestMode)

    repo := repository.New(nil)
    handler := New(repo, []byte("test-secret"))

    router := gin.New()
    handler.RegisterRoutes(router)
    return router
}

func TestLogin_Success(t *testing.T) {
    router := newTestRouter(t)

    body := map[string]string{
        "email":    "admin@company.com",
        "password": "password123",
    }
    payload, _ := json.Marshal(body)

    req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(payload))
    req.Header.Set("Content-Type", "application/json")
    rec := httptest.NewRecorder()

    router.ServeHTTP(rec, req)

    if rec.Code != http.StatusOK {
        t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
    }
}

func TestProfile_UnauthorizedWithoutToken(t *testing.T) {
    router := newTestRouter(t)

    req := httptest.NewRequest(http.MethodGet, "/api/profile", nil)
    rec := httptest.NewRecorder()

    router.ServeHTTP(rec, req)

    if rec.Code != http.StatusUnauthorized {
        t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rec.Code)
    }
}

func TestProfile_WithValidToken(t *testing.T) {
    router := newTestRouter(t)

    token, err := middleware.GenerateToken("u-admin", "admin", []byte("test-secret"))
    if err != nil {
        t.Fatalf("failed to generate token: %v", err)
    }

    req := httptest.NewRequest(http.MethodGet, "/api/profile", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    rec := httptest.NewRecorder()

    router.ServeHTTP(rec, req)

    if rec.Code != http.StatusOK {
        t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
    }
}

func TestDashboard_ForbiddenForEmployee(t *testing.T) {
    router := newTestRouter(t)

    token, err := middleware.GenerateToken("u-employee", "employee", []byte("test-secret"))
    if err != nil {
        t.Fatalf("failed to generate token: %v", err)
    }

    req := httptest.NewRequest(http.MethodGet, "/api/dashboard", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    rec := httptest.NewRecorder()

    router.ServeHTTP(rec, req)

    if rec.Code != http.StatusForbidden {
        t.Fatalf("expected status %d, got %d", http.StatusForbidden, rec.Code)
    }
}
