package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"sharedCarRental/config"
	"sharedCarRental/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/now"
	"gorm.io/gorm"
)

func GetOrders(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	status := c.Query("status")
	userID := c.Query("user_id")

	offset := (page - 1) * pageSize

	var orders []models.Order
	var total int64

	query := config.DB.Model(&models.Order{}).
		Preload("User").
		Preload("Car").
		Preload("Car.CarType")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}

	query.Count(&total)
	query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&orders)

	c.JSON(http.StatusOK, gin.H{
		"data":      orders,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func GetMyOrders(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权访问"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	status := c.Query("status")

	offset := (page - 1) * pageSize

	var orders []models.Order
	var total int64

	query := config.DB.Model(&models.Order{}).
		Preload("Car").
		Preload("Car.CarType").
		Where("user_id = ?", userID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)
	query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&orders)

	c.JSON(http.StatusOK, gin.H{
		"data":      orders,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func GetOrderByID(c *gin.Context) {
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的订单ID"})
		return
	}

	var order models.Order
	if err := config.DB.
		Preload("User").
		Preload("Car").
		Preload("Car.CarType").
		First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "订单不存在"})
		return
	}

	c.JSON(http.StatusOK, order)
}

type CreateOrderRequest struct {
	CarID       uint   `json:"car_id" binding:"required"`
	RentalStart string `json:"rental_start" binding:"required"`
	RentalEnd   string `json:"rental_end" binding:"required"`
	Description string `json:"description"`
}

func CreateOrder(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权访问"})
		return
	}

	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	var car models.Car
	if err := config.DB.First(&car, req.CarID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "汽车不存在"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "查询汽车失败"})
		}
		return
	}

	if car.Status != "available" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "该汽车当前不可租赁"})
		return
	}

	rentalStart, err := time.ParseInLocation("2006-01-02 15:04:05", req.RentalStart, time.Local)
	if err != nil {
		rentalStart, err = time.ParseInLocation("2006-01-02", req.RentalStart, time.Local)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "起始时间格式错误"})
			return
		}
	}

	rentalEnd, err := time.ParseInLocation("2006-01-02 15:04:05", req.RentalEnd, time.Local)
	if err != nil {
		rentalEnd, err = time.ParseInLocation("2006-01-02", req.RentalEnd, time.Local)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "结束时间格式错误"})
			return
		}
		rentalEnd = now.With(rentalEnd).EndOfDay()
	}

	if rentalEnd.Before(rentalStart) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "结束时间不能早于起始时间"})
		return
	}

	duration := rentalEnd.Sub(rentalStart)
	hours := duration.Hours()
	if hours < 1 {
		hours = 1
	}

	days := int(hours / 24)
	if hours-float64(days*24) > 0 {
		days++
	}
	if days < 1 {
		days = 1
	}

	totalAmount := float64(days) * car.RentalPrice

	orderNo := fmt.Sprintf("ORD%s%d", time.Now().Format("20060102150405"), userID)

	order := models.Order{
		OrderNo:     orderNo,
		UserID:      userID.(uint),
		CarID:       req.CarID,
		RentalStart: rentalStart,
		RentalEnd:   rentalEnd,
		TotalAmount: totalAmount,
		Status:      "pending",
		Description: req.Description,
	}

	tx := config.DB.Begin()

	if err := tx.Create(&order).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建订单失败"})
		return
	}

	if err := tx.Model(&car).Update("status", "rented").Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新汽车状态失败"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message":   "订单创建成功",
		"order_id":  order.ID,
		"order_no":  order.OrderNo,
		"total_amount": totalAmount,
	})
}

func ReturnCar(c *gin.Context) {
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的订单ID"})
		return
	}

	var order models.Order
	if err := config.DB.First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "订单不存在"})
		return
	}

	if order.Status != "pending" && order.Status != "rented" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "该订单无法进行归还操作"})
		return
	}

	actualEnd := time.Now()

	tx := config.DB.Begin()

	if err := tx.Model(&order).Updates(map[string]interface{}{
		"status":     "completed",
		"actual_end": actualEnd,
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新订单状态失败"})
		return
	}

	if err := tx.Model(&models.Car{}).Where("id = ?", order.CarID).Update("status", "available").Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新汽车状态失败"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "归还成功"})
}

func DeleteOrder(c *gin.Context) {
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的订单ID"})
		return
	}

	var order models.Order
	if err := config.DB.First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "订单不存在"})
		return
	}

	tx := config.DB.Begin()

	if err := tx.Delete(&order).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除订单失败"})
		return
	}

	if order.Status == "pending" || order.Status == "rented" {
		if err := tx.Model(&models.Car{}).Where("id = ?", order.CarID).Update("status", "available").Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "更新汽车状态失败"})
			return
		}
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}
