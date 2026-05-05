package controllers

import (
	"net/http"
	"sharedCarRental/config"
	"sharedCarRental/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetCarTypes(c *gin.Context) {
	var carTypes []models.CarType
	config.DB.Preload("Cars").Order("created_at DESC").Find(&carTypes)

	c.JSON(http.StatusOK, gin.H{
		"data": carTypes,
	})
}

func GetCarTypeByID(c *gin.Context) {
	typeID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的类型ID"})
		return
	}

	var carType models.CarType
	if err := config.DB.Preload("Cars").First(&carType, typeID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "汽车类型不存在"})
		return
	}

	c.JSON(http.StatusOK, carType)
}

func CreateCarType(c *gin.Context) {
	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	var existingType models.CarType
	if err := config.DB.Where("name = ?", req.Name).First(&existingType).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "类型名称已存在"})
		return
	}

	carType := models.CarType{
		Name:        req.Name,
		Description: req.Description,
	}

	if err := config.DB.Create(&carType).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建汽车类型失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "创建成功", "type_id": carType.ID})
}

func UpdateCarType(c *gin.Context) {
	typeID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的类型ID"})
		return
	}

	var carType models.CarType
	if err := config.DB.First(&carType, typeID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "汽车类型不存在"})
		return
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	if req.Name != "" && req.Name != carType.Name {
		var existingType models.CarType
		if err := config.DB.Where("name = ? AND id != ?", req.Name, carType.ID).First(&existingType).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "类型名称已存在"})
			return
		}
		carType.Name = req.Name
	}

	carType.Description = req.Description

	if err := config.DB.Save(&carType).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新汽车类型失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "更新成功"})
}

func DeleteCarType(c *gin.Context) {
	typeID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的类型ID"})
		return
	}

	var cars []models.Car
	config.DB.Where("type_id = ?", typeID).Find(&cars)
	if len(cars) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "该类型下有汽车，无法删除"})
		return
	}

	if err := config.DB.Delete(&models.CarType{}, typeID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除汽车类型失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}
