package models

import (
	"time"

	"gorm.io/gorm"
)

type Car struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	PlateNumber  string         `json:"plate_number" gorm:"unique;not null"`
	Brand        string         `json:"brand" gorm:"not null"`
	Model        string         `json:"model" gorm:"not null"`
	TypeID       uint           `json:"type_id"`
	CarType      CarType        `json:"car_type" gorm:"foreignKey:TypeID"`
	Color        string         `json:"color"`
	Seats        int            `json:"seats"`
	RentalPrice  float64        `json:"rental_price" gorm:"type:decimal(10,2);not null"`
	Image        string         `json:"image"`
	Status       string         `json:"status" gorm:"default:available"`
	Description  string         `json:"description"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}
