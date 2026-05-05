package routes

import (
	"net/http"
	"sharedCarRental/controllers"
	"sharedCarRental/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	r.Static("/uploads", "./uploads")

	api := r.Group("/api")
	{
		api.POST("/login", controllers.Login)
		api.POST("/register", controllers.Register)

		api.GET("/public/announcements", controllers.GetPublicAnnouncements)
		api.GET("/public/about-us", controllers.GetPublicAboutUs)
		api.GET("/public/site-intro", controllers.GetPublicSiteIntro)
		api.GET("/public/cars", controllers.GetCars)
		api.GET("/public/cars/:id", controllers.GetCarByID)
		api.GET("/public/car-types", controllers.GetCarTypes)

		auth := api.Group("")
		auth.Use(middleware.JWTAuth())
		{
			auth.POST("/logout", controllers.Logout)
			auth.GET("/me", controllers.GetCurrentUser)
			auth.PUT("/me", controllers.UpdateCurrentUser)
			auth.PUT("/password", controllers.UpdatePassword)

			auth.GET("/my-orders", controllers.GetMyOrders)
			auth.POST("/orders", controllers.CreateOrder)
			auth.PUT("/orders/:id/return", controllers.ReturnCar)
			auth.GET("/orders/:id", controllers.GetOrderByID)

			auth.GET("/car-types", controllers.GetCarTypes)
			auth.GET("/cars", controllers.GetCars)
			auth.GET("/cars/:id", controllers.GetCarByID)
		}

		admin := api.Group("/admin")
		admin.Use(middleware.JWTAuth(), middleware.RequireRole("admin"))
		{
			admin.GET("/users", controllers.GetUsers)
			admin.POST("/users", controllers.CreateUser)
			admin.PUT("/users/:id", controllers.UpdateUser)
			admin.DELETE("/users/:id", controllers.DeleteUser)

			admin.GET("/roles", controllers.GetRoles)
			admin.GET("/roles/:id", controllers.GetRoleByID)
			admin.POST("/roles", controllers.CreateRole)
			admin.PUT("/roles/:id", controllers.UpdateRole)
			admin.DELETE("/roles/:id", controllers.DeleteRole)

			admin.GET("/permissions", controllers.GetPermissions)
			admin.GET("/permissions/:id", controllers.GetPermissionByID)
			admin.POST("/permissions", controllers.CreatePermission)
			admin.PUT("/permissions/:id", controllers.UpdatePermission)
			admin.DELETE("/permissions/:id", controllers.DeletePermission)

			admin.GET("/car-types", controllers.GetCarTypes)
			admin.GET("/car-types/:id", controllers.GetCarTypeByID)
			admin.POST("/car-types", controllers.CreateCarType)
			admin.PUT("/car-types/:id", controllers.UpdateCarType)
			admin.DELETE("/car-types/:id", controllers.DeleteCarType)

			admin.GET("/cars", controllers.GetCars)
			admin.GET("/cars/:id", controllers.GetCarByID)
			admin.POST("/cars", controllers.CreateCar)
			admin.POST("/cars/upload", controllers.UploadCarImage)
			admin.PUT("/cars/:id", controllers.UpdateCar)
			admin.DELETE("/cars/:id", controllers.DeleteCar)

			admin.GET("/orders", controllers.GetOrders)
			admin.GET("/orders/:id", controllers.GetOrderByID)
			admin.DELETE("/orders/:id", controllers.DeleteOrder)

			admin.GET("/announcements", controllers.GetAnnouncements)
			admin.GET("/announcements/:id", controllers.GetAnnouncementByID)
			admin.POST("/announcements", controllers.CreateAnnouncement)
			admin.PUT("/announcements/:id", controllers.UpdateAnnouncement)
			admin.DELETE("/announcements/:id", controllers.DeleteAnnouncement)

			admin.GET("/about-us", controllers.GetAboutUs)
			admin.PUT("/about-us", controllers.UpdateAboutUs)

			admin.GET("/site-intro", controllers.GetSiteIntro)
			admin.PUT("/site-intro", controllers.UpdateSiteIntro)
		}
	}

	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"error": "页面不存在"})
	})

	return r
}
