package models

import (
	"time"

	"gorm.io/gorm"
)

type Order struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	OrderNo      string         `json:"order_no" gorm:"unique;not null"`
	UserID       uint           `json:"user_id"`
	User         User           `json:"user" gorm:"foreignKey:UserID"`
	CarID        uint           `json:"car_id"`
	Car          Car            `json:"car" gorm:"foreignKey:CarID"`
	RentalStart  time.Time      `json:"rental_start"`
	RentalEnd    time.Time      `json:"rental_end"`
	ActualEnd    *time.Time     `json:"actual_end"`
	TotalAmount  float64        `json:"total_amount" gorm:"type:decimal(10,2);not null"`
	Status       string         `json:"status" gorm:"default:pending"`
	Description  string         `json:"description"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}
