package controllers

import (
	"net/http"
	"sharedCarRental/config"
	"sharedCarRental/models"

	"github.com/gin-gonic/gin"
)

func GetAboutUs(c *gin.Context) {
	var aboutUs models.AboutUs
	if err := config.DB.First(&aboutUs, 1).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "关于我们内容不存在"})
		return
	}

	c.JSON(http.StatusOK, aboutUs)
}

func GetPublicAboutUs(c *gin.Context) {
	var aboutUs models.AboutUs
	if err := config.DB.First(&aboutUs, 1).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{
			"id":      0,
			"content": "",
		})
		return
	}

	c.JSON(http.StatusOK, aboutUs)
}

func UpdateAboutUs(c *gin.Context) {
	var req struct {
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	var aboutUs models.AboutUs
	if err := config.DB.First(&aboutUs, 1).Error; err != nil {
		aboutUs = models.AboutUs{
			Content: req.Content,
		}
		if err := config.DB.Create(&aboutUs).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "创建关于我们内容失败"})
			return
		}
	} else {
		aboutUs.Content = req.Content
		if err := config.DB.Save(&aboutUs).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "更新关于我们内容失败"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "更新成功"})
}

func GetSiteIntro(c *gin.Context) {
	var siteIntro models.SiteIntro
	if err := config.DB.First(&siteIntro, 1).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "网站简介内容不存在"})
		return
	}

	c.JSON(http.StatusOK, siteIntro)
}

func GetPublicSiteIntro(c *gin.Context) {
	var siteIntro models.SiteIntro
	if err := config.DB.First(&siteIntro, 1).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{
			"id":      0,
			"content": "",
		})
		return
	}

	c.JSON(http.StatusOK, siteIntro)
}

func UpdateSiteIntro(c *gin.Context) {
	var req struct {
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	var siteIntro models.SiteIntro
	if err := config.DB.First(&siteIntro, 1).Error; err != nil {
		siteIntro = models.SiteIntro{
			Content: req.Content,
		}
		if err := config.DB.Create(&siteIntro).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "创建网站简介内容失败"})
			return
		}
	} else {
		siteIntro.Content = req.Content
		if err := config.DB.Save(&siteIntro).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "更新网站简介内容失败"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "更新成功"})
}
