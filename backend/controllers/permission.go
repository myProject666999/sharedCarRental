package controllers

import (
	"net/http"
	"sharedCarRental/config"
	"sharedCarRental/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetPermissions(c *gin.Context) {
	var permissions []models.Permission
	config.DB.Order("created_at DESC").Find(&permissions)

	c.JSON(http.StatusOK, gin.H{
		"data": permissions,
	})
}

func GetPermissionByID(c *gin.Context) {
	permID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的权限ID"})
		return
	}

	var permission models.Permission
	if err := config.DB.First(&permission, permID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "权限不存在"})
		return
	}

	c.JSON(http.StatusOK, permission)
}

func CreatePermission(c *gin.Context) {
	var req struct {
		Name        string `json:"name" binding:"required"`
		URL         string `json:"url" binding:"required"`
		Method      string `json:"method" binding:"required"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	permission := models.Permission{
		Name:        req.Name,
		URL:         req.URL,
		Method:      req.Method,
		Description: req.Description,
	}

	if err := config.DB.Create(&permission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建权限失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "创建成功", "permission_id": permission.ID})
}

func UpdatePermission(c *gin.Context) {
	permID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的权限ID"})
		return
	}

	var permission models.Permission
	if err := config.DB.First(&permission, permID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "权限不存在"})
		return
	}

	var req struct {
		Name        string `json:"name"`
		URL         string `json:"url"`
		Method      string `json:"method"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	if req.Name != "" {
		permission.Name = req.Name
	}
	if req.URL != "" {
		permission.URL = req.URL
	}
	if req.Method != "" {
		permission.Method = req.Method
	}
	permission.Description = req.Description

	if err := config.DB.Save(&permission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新权限失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "更新成功"})
}

func DeletePermission(c *gin.Context) {
	permID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的权限ID"})
		return
	}

	if err := config.DB.Delete(&models.Permission{}, permID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除权限失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}
