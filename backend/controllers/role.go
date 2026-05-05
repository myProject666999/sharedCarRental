package controllers

import (
	"net/http"
	"sharedCarRental/config"
	"sharedCarRental/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetRoles(c *gin.Context) {
	var roles []models.Role
	config.DB.Preload("Permissions").Order("created_at DESC").Find(&roles)

	c.JSON(http.StatusOK, gin.H{
		"data": roles,
	})
}

func GetRoleByID(c *gin.Context) {
	roleID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的角色ID"})
		return
	}

	var role models.Role
	if err := config.DB.Preload("Permissions").First(&role, roleID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "角色不存在"})
		return
	}

	c.JSON(http.StatusOK, role)
}

func CreateRole(c *gin.Context) {
	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
		PermissionIDs []uint `json:"permission_ids"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	var existingRole models.Role
	if err := config.DB.Where("name = ?", req.Name).First(&existingRole).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "角色名称已存在"})
		return
	}

	role := models.Role{
		Name:        req.Name,
		Description: req.Description,
	}

	if len(req.PermissionIDs) > 0 {
		var permissions []models.Permission
		config.DB.Where("id IN ?", req.PermissionIDs).Find(&permissions)
		role.Permissions = permissions
	}

	if err := config.DB.Create(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建角色失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "创建成功", "role_id": role.ID})
}

func UpdateRole(c *gin.Context) {
	roleID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的角色ID"})
		return
	}

	var role models.Role
	if err := config.DB.Preload("Permissions").First(&role, roleID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "角色不存在"})
		return
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		PermissionIDs []uint `json:"permission_ids"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	if req.Name != "" && req.Name != role.Name {
		var existingRole models.Role
		if err := config.DB.Where("name = ? AND id != ?", req.Name, role.ID).First(&existingRole).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "角色名称已存在"})
			return
		}
		role.Name = req.Name
	}

	if req.Description != "" {
		role.Description = req.Description
	}

	if req.PermissionIDs != nil {
		var permissions []models.Permission
		config.DB.Where("id IN ?", req.PermissionIDs).Find(&permissions)
		config.DB.Model(&role).Association("Permissions").Replace(permissions)
	}

	if err := config.DB.Save(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新角色失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "更新成功"})
}

func DeleteRole(c *gin.Context) {
	roleID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的角色ID"})
		return
	}

	var users []models.User
	config.DB.Where("role_id = ?", roleID).Find(&users)
	if len(users) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "该角色下有用户，无法删除"})
		return
	}

	if err := config.DB.Delete(&models.Role{}, roleID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除角色失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}
