package middleware

import (
	"net/http"
	"sharedCarRental/config"
	"sharedCarRental/models"

	"github.com/gin-gonic/gin"
)

func RequireRole(roleName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleID, exists := c.Get("role_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权访问"})
			c.Abort()
			return
		}

		var role models.Role
		if err := config.DB.Preload("Permissions").First(&role, roleID).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "权限不足"})
			c.Abort()
			return
		}

		if role.Name != roleName {
			c.JSON(http.StatusForbidden, gin.H{"error": "权限不足"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func RequirePermission(permissionName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleID, exists := c.Get("role_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权访问"})
			c.Abort()
			return
		}

		var role models.Role
		if err := config.DB.Preload("Permissions").First(&role, roleID).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "权限不足"})
			c.Abort()
			return
		}

		hasPermission := false
		for _, perm := range role.Permissions {
			if perm.Name == permissionName {
				hasPermission = true
				break
			}
		}

		if !hasPermission && role.Name != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "权限不足"})
			c.Abort()
			return
		}

		c.Next()
	}
}
