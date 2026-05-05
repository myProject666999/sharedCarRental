package models

import (
	"time"

	"gorm.io/gorm"
)

type CarType struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"unique;not null"`
	Description string         `json:"description"`
	Cars        []Car          `json:"cars" gorm:"foreignKey:TypeID"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}
