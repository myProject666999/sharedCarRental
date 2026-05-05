package controllers

import (
	"net/http"
	"sharedCarRental/config"
	"sharedCarRental/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetAnnouncements(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	status := c.Query("status")

	offset := (page - 1) * pageSize

	var announcements []models.Announcement
	var total int64

	query := config.DB.Model(&models.Announcement{})

	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)
	query.Offset(offset).Limit(pageSize).
		Order("is_top DESC, created_at DESC").
		Find(&announcements)

	c.JSON(http.StatusOK, gin.H{
		"data":      announcements,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func GetPublicAnnouncements(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	offset := (page - 1) * pageSize

	var announcements []models.Announcement
	var total int64

	query := config.DB.Model(&models.Announcement{}).Where("status = ?", "published")

	query.Count(&total)
	query.Offset(offset).Limit(pageSize).
		Order("is_top DESC, created_at DESC").
		Find(&announcements)

	c.JSON(http.StatusOK, gin.H{
		"data":      announcements,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func GetAnnouncementByID(c *gin.Context) {
	announcementID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的公告ID"})
		return
	}

	var announcement models.Announcement
	if err := config.DB.First(&announcement, announcementID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "公告不存在"})
		return
	}

	c.JSON(http.StatusOK, announcement)
}

func CreateAnnouncement(c *gin.Context) {
	var req struct {
		Title   string `json:"title" binding:"required"`
		Content string `json:"content" binding:"required"`
		IsTop   bool   `json:"is_top"`
		Status  string `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	announcement := models.Announcement{
		Title:   req.Title,
		Content: req.Content,
		IsTop:   req.IsTop,
		Status:  req.Status,
	}

	if announcement.Status == "" {
		announcement.Status = "draft"
	}

	if err := config.DB.Create(&announcement).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建公告失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "创建成功", "announcement_id": announcement.ID})
}

func UpdateAnnouncement(c *gin.Context) {
	announcementID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的公告ID"})
		return
	}

	var announcement models.Announcement
	if err := config.DB.First(&announcement, announcementID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "公告不存在"})
		return
	}

	var req struct {
		Title   string `json:"title"`
		Content string `json:"content"`
		IsTop   *bool  `json:"is_top"`
		Status  string `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	if req.Title != "" {
		announcement.Title = req.Title
	}
	if req.Content != "" {
		announcement.Content = req.Content
	}
	if req.IsTop != nil {
		announcement.IsTop = *req.IsTop
	}
	if req.Status != "" {
		announcement.Status = req.Status
	}

	if err := config.DB.Save(&announcement).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新公告失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "更新成功"})
}

func DeleteAnnouncement(c *gin.Context) {
	announcementID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的公告ID"})
		return
	}

	if err := config.DB.Delete(&models.Announcement{}, announcementID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除公告失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}
