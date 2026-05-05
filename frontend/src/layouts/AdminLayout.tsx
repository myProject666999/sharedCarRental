import React, { useState, useEffect } from 'react'
import { Layout, Menu, Dropdown, Avatar, Button } from 'antd'
import {
  CarOutlined,
  UserOutlined,
  ShoppingOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DashboardOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  CarFilled,
  FileTextOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { getUser, logout } from '../utils/auth'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout

interface MenuItem {
  key: string
  icon: React.ReactNode
  label: string
  path: string
}

const adminMenuItems: MenuItem[] = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: '仪表盘', path: '/admin/dashboard' },
  { key: 'users', icon: <TeamOutlined />, label: '用户管理', path: '/admin/users' },
  { key: 'roles', icon: <SafetyCertificateOutlined />, label: '角色管理', path: '/admin/roles' },
  { key: 'permissions', icon: <LockOutlined />, label: '权限管理', path: '/admin/permissions' },
  { key: 'car-types', icon: <CarFilled />, label: '汽车类型管理', path: '/admin/car-types' },
  { key: 'cars', icon: <CarOutlined />, label: '汽车管理', path: '/admin/cars' },
  { key: 'orders', icon: <ShoppingOutlined />, label: '订单管理', path: '/admin/orders' },
  { key: 'announcements', icon: <FileTextOutlined />, label: '公告管理', path: '/admin/announcements' },
  { key: 'about-us', icon: <InfoCircleOutlined />, label: '关于我们', path: '/admin/about-us' },
  { key: 'site-intro', icon: <InfoCircleOutlined />, label: '网站简介', path: '/admin/site-intro' },
]

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<any>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser || currentUser.role_name !== 'admin') {
      navigate('/login')
    } else {
      setUser(currentUser)
    }
  }, [navigate])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <a onClick={() => navigate('/user/profile')}>
          <UserOutlined /> 个人中心
        </a>
      ),
    },
    {
      key: '2',
      label: (
        <a onClick={() => navigate('/')}>
          <CarOutlined /> 返回前台
        </a>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: '3',
      label: (
        <a onClick={handleLogout}>
          <LogoutOutlined /> 退出登录
        </a>
      ),
    },
  ]

  const getSelectedKey = () => {
    const path = location.pathname
    const item = adminMenuItems.find(m => m.path === path)
    return item ? [item.key] : []
  }

  return (
    <Layout className="layout admin-layout">
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div className="logo">
          {collapsed ? '租车' : '汽车租赁管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKey()}
          items={adminMenuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            onClick: () => navigate(item.path),
          }))}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 16 }}>欢迎, {user?.username}</span>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Avatar size="large" icon={<UserOutlined />} />
              </Dropdown>
            </div>
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
