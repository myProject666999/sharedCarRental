package controllers

import (
	"net/http"
	"sharedCarRental/config"
	"sharedCarRental/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	search := c.Query("search")

	offset := (page - 1) * pageSize

	var users []models.User
	var total int64

	query := config.DB.Model(&models.User{}).Preload("Role")

	if search != "" {
		query = query.Where("username LIKE ? OR real_name LIKE ? OR email LIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	query.Count(&total)
	query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&users)

	c.JSON(http.StatusOK, gin.H{
		"data":  users,
		"total": total,
		"page":  page,
		"page_size": pageSize,
	})
}

func CreateUser(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
		Email    string `json:"email"`
		Phone    string `json:"phone"`
		RealName string `json:"real_name"`
		RoleID   uint   `json:"role_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	var existingUser models.User
	if err := config.DB.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户名已存在"})
		return
	}

	user := models.User{
		Username: req.Username,
		Email:    req.Email,
		Phone:    req.Phone,
		RealName: req.RealName,
		RoleID:   req.RoleID,
	}

	if err := user.SetPassword(req.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "密码加密失败"})
		return
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建用户失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "创建成功", "user_id": user.ID})
}

func UpdateUser(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的用户ID"})
		return
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Phone    string `json:"phone"`
		RealName string `json:"real_name"`
		RoleID   uint   `json:"role_id"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	if req.Username != "" && req.Username != user.Username {
		var existingUser models.User
		if err := config.DB.Where("username = ? AND id != ?", req.Username, user.ID).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "用户名已存在"})
			return
		}
		user.Username = req.Username
	}

	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.RealName != "" {
		user.RealName = req.RealName
	}
	if req.RoleID != 0 {
		user.RoleID = req.RoleID
	}

	if req.Password != "" {
		if err := user.SetPassword(req.Password); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "密码加密失败"})
			return
		}
	}

	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新用户失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "更新成功"})
}

func DeleteUser(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的用户ID"})
		return
	}

	currentUserID, exists := c.Get("user_id")
	if exists && uint(userID) == currentUserID.(uint) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "不能删除当前登录用户"})
		return
	}

	if err := config.DB.Delete(&models.User{}, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除用户失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}
