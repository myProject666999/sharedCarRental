-- 共享汽车租赁管理系统数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS shared_car_rental DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE shared_car_rental;

-- 说明：
-- 本系统使用 GORM 的 AutoMigrate 功能自动创建表结构
-- 以下为各个表的结构说明（供参考）

-- 角色表 roles
-- id: 主键
-- name: 角色名称（唯一）
-- description: 角色描述
-- created_at: 创建时间
-- updated_at: 更新时间
-- deleted_at: 删除时间（软删除）

-- 权限表 permissions
-- id: 主键
-- name: 权限名称
-- url: 访问URL
-- method: HTTP方法（GET/POST/PUT/DELETE）
-- description: 权限描述
-- created_at: 创建时间
-- updated_at: 更新时间
-- deleted_at: 删除时间（软删除）

-- 角色权限关联表 role_permissions
-- 自动创建的中间表

-- 用户表 users
-- id: 主键
-- username: 用户名（唯一）
-- password: 密码（加密）
-- email: 邮箱
-- phone: 手机号
-- real_name: 真实姓名
-- id_card: 身份证号
-- role_id: 角色ID
-- created_at: 创建时间
-- updated_at: 更新时间
-- deleted_at: 删除时间（软删除）

-- 汽车类型表 car_types
-- id: 主键
-- name: 类型名称（唯一）
-- description: 类型描述
-- created_at: 创建时间
-- updated_at: 更新时间
-- deleted_at: 删除时间（软删除）

-- 汽车表 cars
-- id: 主键
-- plate_number: 车牌号（唯一）
-- brand: 品牌
-- model: 型号
-- type_id: 类型ID
-- color: 颜色
-- seats: 座位数
-- rental_price: 日租金
-- image: 图片路径
-- status: 状态（available/rented）
-- description: 描述
-- created_at: 创建时间
-- updated_at: 更新时间
-- deleted_at: 删除时间（软删除）

-- 订单表 orders
-- id: 主键
-- order_no: 订单号（唯一）
-- user_id: 用户ID
-- car_id: 汽车ID
-- rental_start: 租赁开始时间
-- rental_end: 租赁结束时间
-- actual_end: 实际归还时间
-- total_amount: 总金额
-- status: 状态（pending/rented/completed/cancelled）
-- description: 备注
-- created_at: 创建时间
-- updated_at: 更新时间
-- deleted_at: 删除时间（软删除）

-- 公告表 announcements
-- id: 主键
-- title: 标题
-- content: 内容
-- is_top: 是否置顶
-- status: 状态（draft/published）
-- created_at: 创建时间
-- updated_at: 更新时间
-- deleted_at: 删除时间（软删除）

-- 关于我们表 about_us
-- id: 主键
-- content: 内容
-- created_at: 创建时间
-- updated_at: 更新时间

-- 网站简介表 site_intros
-- id: 主键
-- content: 内容
-- created_at: 创建时间
-- updated_at: 更新时间

-- 默认数据（系统会自动初始化）
-- 角色: admin（超级管理员）、user（普通用户）
-- 管理员账号: admin / admin123
-- 汽车类型: 经济型、舒适型、豪华型、SUV
