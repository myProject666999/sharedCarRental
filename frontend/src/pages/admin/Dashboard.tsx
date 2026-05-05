import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, message } from 'antd'
import {
  CarOutlined,
  UserOutlined,
  ShoppingOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import api from '../../services/api'

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    carsTotal: 0,
    usersTotal: 0,
    ordersTotal: 0,
    announcementsTotal: 0,
    carsAvailable: 0,
    carsRented: 0,
  })
  const [loading, setLoading] = useState(false)

  const loadStats = async () => {
    setLoading(true)
    try {
      const [carsRes, usersRes, ordersRes, announcementsRes] = await Promise.all([
        api.get('/admin/cars?page_size=1000'),
        api.get('/admin/users?page_size=1000'),
        api.get('/admin/orders?page_size=1000'),
        api.get('/admin/announcements?page_size=1000'),
      ])

      const cars = carsRes.data.data || []
      const carsAvailable = cars.filter((car: any) => car.status === 'available').length
      const carsRented = cars.filter((car: any) => car.status === 'rented').length

      setStats({
        carsTotal: carsRes.data.total || 0,
        usersTotal: usersRes.data.total || 0,
        ordersTotal: ordersRes.data.total || 0,
        announcementsTotal: announcementsRes.data.total || 0,
        carsAvailable,
        carsRented,
      })
    } catch (error) {
      message.error('获取统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  return (
    <div>
      <h2>仪表盘</h2>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="汽车总数"
              value={stats.carsTotal}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="可租赁车辆"
              value={stats.carsAvailable}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="租赁中车辆"
              value={stats.carsRented}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="用户总数"
              value={stats.usersTotal}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="订单总数"
              value={stats.ordersTotal}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="公告总数"
              value={stats.announcementsTotal}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AdminDashboard
