package models

import (
	"time"
)

type AboutUs struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Content   string         `json:"content" gorm:"type:text;not null"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}

type SiteIntro struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Content   string         `json:"content" gorm:"type:text;not null"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}
