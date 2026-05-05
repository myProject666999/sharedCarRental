import React, { useState, useEffect } from 'react'
import { Layout, Menu, Dropdown, Avatar, Button } from 'antd'
import {
  CarOutlined,
  UserOutlined,
  ShoppingOutlined,
  LogoutOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { getUser, logout, isLoggedIn } from '../utils/auth'
import type { MenuProps } from 'antd'

const { Header, Content } = Layout

interface MenuItem {
  key: string
  icon: React.ReactNode
  label: string
  path: string
}

const userMenuItems: MenuItem[] = [
  { key: 'orders', icon: <ShoppingOutlined />, label: '我的订单', path: '/user/orders' },
  { key: 'profile', icon: <UserOutlined />, label: '个人信息', path: '/user/profile' },
]

const UserLayout: React.FC = () => {
  const [user, setUser] = useState<any>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login')
    } else {
      const currentUser = getUser()
      setUser(currentUser)
    }
  }, [navigate])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const dropdownMenuItems: MenuProps['items'] = [
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
        <a onClick={() => navigate('/user/orders')}>
          <ShoppingOutlined /> 我的订单
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
    const item = userMenuItems.find(m => m.path === path)
    return item ? [item.key] : []
  }

  return (
    <Layout className="layout">
      <Header style={{ padding: 0, background: '#001529' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 50px' }}>
          <div className="logo" style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
            <CarOutlined /> 汽车租赁系统
          </div>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={getSelectedKey()}
            style={{ lineHeight: '64px', borderBottom: 'none' }}
            items={[
              { key: 'home', label: '首页', onClick: () => navigate('/') },
              { key: 'orders', label: '我的订单', onClick: () => navigate('/user/orders') },
              { key: 'profile', label: '个人中心', onClick: () => navigate('/user/profile') },
            ]}
          />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Dropdown menu={{ items: dropdownMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#fff' }}>
                <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
                <span>{user?.username}</span>
              </div>
            </Dropdown>
          </div>
        </div>
      </Header>
      <Layout>
        <Content style={{ padding: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default UserLayout
