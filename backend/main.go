package main

import (
	"log"
	"os"
	"sharedCarRental/config"
	"sharedCarRental/models"
	"sharedCarRental/routes"

	"github.com/joho/godotenv"
)

func init() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}
}

func main() {
	config.InitDB()

	config.DB.AutoMigrate(
		&models.User{},
		&models.Role{},
		&models.Permission{},
		&models.CarType{},
		&models.Car{},
		&models.Order{},
		&models.Announcement{},
		&models.AboutUs{},
		&models.SiteIntro{},
	)

	seedData()

	r := routes.SetupRouter()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func seedData() {
	var adminRole models.Role
	if err := config.DB.Where("name = ?", "admin").First(&adminRole).Error; err != nil {
		adminRole = models.Role{
			Name:        "admin",
			Description: "超级管理员",
		}
		config.DB.Create(&adminRole)
	}

	var userRole models.Role
	if err := config.DB.Where("name = ?", "user").First(&userRole).Error; err != nil {
		userRole = models.Role{
			Name:        "user",
			Description: "普通用户",
		}
		config.DB.Create(&userRole)
	}

	var adminUser models.User
	if err := config.DB.Where("username = ?", "admin").First(&adminUser).Error; err != nil {
		adminUser = models.User{
			Username: "admin",
			RoleID:   adminRole.ID,
		}
		adminUser.SetPassword("admin123")
		config.DB.Create(&adminUser)
	}

	var economyType models.CarType
	if err := config.DB.Where("name = ?", "经济型").First(&economyType).Error; err != nil {
		economyType = models.CarType{
			Name:        "经济型",
			Description: "经济实惠的代步用车",
		}
		config.DB.Create(&economyType)
	}

	var comfortType models.CarType
	if err := config.DB.Where("name = ?", "舒适型").First(&comfortType).Error; err != nil {
		comfortType = models.CarType{
			Name:        "舒适型",
			Description: "舒适宽敞的家庭用车",
		}
		config.DB.Create(&comfortType)
	}

	var luxuryType models.CarType
	if err := config.DB.Where("name = ?", "豪华型").First(&luxuryType).Error; err != nil {
		luxuryType = models.CarType{
			Name:        "豪华型",
			Description: "高端商务用车",
		}
		config.DB.Create(&luxuryType)
	}

	var suvType models.CarType
	if err := config.DB.Where("name = ?", "SUV").First(&suvType).Error; err != nil {
		suvType = models.CarType{
			Name:        "SUV",
			Description: "运动型多用途汽车",
		}
		config.DB.Create(&suvType)
	}
}
