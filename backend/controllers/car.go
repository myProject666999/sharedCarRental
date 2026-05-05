package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sharedCarRental/config"
	"sharedCarRental/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func GetCars(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	plateNumber := c.Query("plate_number")
	brand := c.Query("brand")
	typeID := c.Query("type_id")
	status := c.Query("status")

	offset := (page - 1) * pageSize

	var cars []models.Car
	var total int64

	query := config.DB.Model(&models.Car{}).Preload("CarType")

	if plateNumber != "" {
		query = query.Where("plate_number LIKE ?", "%"+plateNumber+"%")
	}
	if brand != "" {
		query = query.Where("brand LIKE ?", "%"+brand+"%")
	}
	if typeID != "" {
		query = query.Where("type_id = ?", typeID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)
	query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&cars)

	c.JSON(http.StatusOK, gin.H{
		"data":      cars,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func GetCarByID(c *gin.Context) {
	carID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的汽车ID"})
		return
	}

	var car models.Car
	if err := config.DB.Preload("CarType").First(&car, carID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "汽车不存在"})
		return
	}

	c.JSON(http.StatusOK, car)
}

func CreateCar(c *gin.Context) {
	var req struct {
		PlateNumber string  `json:"plate_number" binding:"required"`
		Brand       string  `json:"brand" binding:"required"`
		Model       string  `json:"model" binding:"required"`
		TypeID      uint    `json:"type_id" binding:"required"`
		Color       string  `json:"color"`
		Seats       int     `json:"seats"`
		RentalPrice float64 `json:"rental_price" binding:"required"`
		Image       string  `json:"image"`
		Status      string  `json:"status"`
		Description string  `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	var existingCar models.Car
	if err := config.DB.Where("plate_number = ?", req.PlateNumber).First(&existingCar).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "车牌号已存在"})
		return
	}

	car := models.Car{
		PlateNumber: req.PlateNumber,
		Brand:       req.Brand,
		Model:       req.Model,
		TypeID:      req.TypeID,
		Color:       req.Color,
		Seats:       req.Seats,
		RentalPrice: req.RentalPrice,
		Image:       req.Image,
		Status:      req.Status,
		Description: req.Description,
	}

	if car.Status == "" {
		car.Status = "available"
	}

	if err := config.DB.Create(&car).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建汽车失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "创建成功", "car_id": car.ID})
}

func UpdateCar(c *gin.Context) {
	carID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的汽车ID"})
		return
	}

	var car models.Car
	if err := config.DB.First(&car, carID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "汽车不存在"})
		return
	}

	var req struct {
		PlateNumber string  `json:"plate_number"`
		Brand       string  `json:"brand"`
		Model       string  `json:"model"`
		TypeID      uint    `json:"type_id"`
		Color       string  `json:"color"`
		Seats       int     `json:"seats"`
		RentalPrice float64 `json:"rental_price"`
		Image       string  `json:"image"`
		Status      string  `json:"status"`
		Description string  `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	if req.PlateNumber != "" && req.PlateNumber != car.PlateNumber {
		var existingCar models.Car
		if err := config.DB.Where("plate_number = ? AND id != ?", req.PlateNumber, car.ID).First(&existingCar).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "车牌号已存在"})
			return
		}
		car.PlateNumber = req.PlateNumber
	}

	if req.Brand != "" {
		car.Brand = req.Brand
	}
	if req.Model != "" {
		car.Model = req.Model
	}
	if req.TypeID != 0 {
		car.TypeID = req.TypeID
	}
	if req.Color != "" {
		car.Color = req.Color
	}
	if req.Seats != 0 {
		car.Seats = req.Seats
	}
	if req.RentalPrice != 0 {
		car.RentalPrice = req.RentalPrice
	}
	if req.Image != "" {
		car.Image = req.Image
	}
	if req.Status != "" {
		car.Status = req.Status
	}
	car.Description = req.Description

	if err := config.DB.Save(&car).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新汽车失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "更新成功"})
}

func DeleteCar(c *gin.Context) {
	carID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的汽车ID"})
		return
	}

	var activeOrders []models.Order
	config.DB.Where("car_id = ? AND status IN (?, ?)", carID, "pending", "rented").Find(&activeOrders)
	if len(activeOrders) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "该汽车有正在进行的订单，无法删除"})
		return
	}

	if err := config.DB.Delete(&models.Car{}, carID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除汽车失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

func UploadCarImage(c *gin.Context) {
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请选择图片文件"})
		return
	}
	defer file.Close()

	ext := filepath.Ext(header.Filename)
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "只支持jpg、jpeg、png、gif格式的图片"})
		return
	}

	uploadDir := "./uploads/cars/"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建目录失败"})
		return
	}

	fileName := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	filePath := filepath.Join(uploadDir, fileName)

	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
		return
	}
	defer dst.Close()

	_, err = dst.ReadFrom(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
		return
	}

	fileURL := fmt.Sprintf("/uploads/cars/%s", fileName)
	c.JSON(http.StatusOK, gin.H{
		"message": "上传成功",
		"url":     fileURL,
	})
}
