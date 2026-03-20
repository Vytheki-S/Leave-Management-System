package middleware

import (
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/gin-gonic/gin"
)

func TestGenerateTokenAndAuthMiddleware_Success(t *testing.T) {
    gin.SetMode(gin.TestMode)

    secret := []byte("test-secret")
    token, err := GenerateToken("u-employee", "employee", secret)
    if err != nil {
        t.Fatalf("GenerateToken failed: %v", err)
    }

    router := gin.New()
    router.Use(AuthMiddleware(secret))
    router.GET("/protected", func(c *gin.Context) {
        userID := c.GetString("userID")
        role := c.GetString("role")
        c.JSON(http.StatusOK, gin.H{"userId": userID, "role": role})
    })

    req := httptest.NewRequest(http.MethodGet, "/protected", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    rec := httptest.NewRecorder()

    router.ServeHTTP(rec, req)

    if rec.Code != http.StatusOK {
        t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
    }
}

func TestAuthMiddleware_MissingToken(t *testing.T) {
    gin.SetMode(gin.TestMode)

    router := gin.New()
    router.Use(AuthMiddleware([]byte("test-secret")))
    router.GET("/protected", func(c *gin.Context) {
        c.Status(http.StatusOK)
    })

    req := httptest.NewRequest(http.MethodGet, "/protected", nil)
    rec := httptest.NewRecorder()

    router.ServeHTTP(rec, req)

    if rec.Code != http.StatusUnauthorized {
        t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rec.Code)
    }
}

func TestRoleGuard_BlocksUnauthorizedRole(t *testing.T) {
    gin.SetMode(gin.TestMode)

    router := gin.New()
    router.Use(func(c *gin.Context) {
        c.Set("role", "employee")
        c.Next()
    })
    router.GET("/admin-only", RoleGuard("admin"), func(c *gin.Context) {
        c.Status(http.StatusOK)
    })

    req := httptest.NewRequest(http.MethodGet, "/admin-only", nil)
    rec := httptest.NewRecorder()

    router.ServeHTTP(rec, req)

    if rec.Code != http.StatusForbidden {
        t.Fatalf("expected status %d, got %d", http.StatusForbidden, rec.Code)
    }
}
