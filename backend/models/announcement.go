package models

import (
	"time"

	"gorm.io/gorm"
)

type Announcement struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Title     string         `json:"title" gorm:"not null"`
	Content   string         `json:"content" gorm:"type:text;not null"`
	IsTop     bool           `json:"is_top" gorm:"default:false"`
	Status    string         `json:"status" gorm:"default:draft"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}
