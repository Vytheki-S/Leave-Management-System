package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"leave-management/backend/internal/handlers"
	"leave-management/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func getenv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func connectDB() *sql.DB {
	host := getenv("DB_HOST", "localhost")
	port := getenv("DB_PORT", "5432")
	user := getenv("DB_USER", "postgres")
	password := getenv("DB_PASSWORD", "postgres")
	dbName := getenv("DB_NAME", "leave_management")
	sslMode := getenv("DB_SSLMODE", "disable")

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host,
		port,
		user,
		password,
		dbName,
		sslMode,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Printf("database connection setup failed: %v", err)
		return nil
	}

	if err := db.Ping(); err != nil {
		log.Printf("database ping failed: %v", err)
		_ = db.Close()
		return nil
	}

	return db
}

func main() {
	_ = godotenv.Load()

	port := getenv("PORT", "8080")
	jwtSecret := getenv("JWT_SECRET", "change-me")

	db := connectDB()
	if db != nil {
		defer db.Close()
	}

	repo := repository.New(db)
	h := handlers.New(repo, []byte(jwtSecret))

	router := gin.Default()
	h.RegisterRoutes(router)

	log.Printf("leave-management API running on :%s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
