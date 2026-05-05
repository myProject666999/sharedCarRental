import React, { useEffect, useState } from 'react'
import { Layout, Menu, Card, Row, Col, Input, Button, Tag, message, Carousel, Avatar, Dropdown } from 'antd'
import { CarOutlined, UserOutlined, SearchOutlined, LoginOutlined, LogoutOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { isLoggedIn, getUser, logout } from '../utils/auth'
import type { MenuProps } from 'antd'

const { Header, Content, Footer } = Layout
const { Search } = Input

interface Car {
  id: number
  plate_number: string
  brand: string
  model: string
  color: string
  seats: number
  rental_price: number
  image: string
  status: string
  car_type: {
    id: number
    name: string
  }
}

interface Announcement {
  id: number
  title: string
  content: string
  is_top: boolean
  created_at: string
}

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [cars, setCars] = useState<Car[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [aboutUs, setAboutUs] = useState<any>(null)
  const [siteIntro, setSiteIntro] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    setLoggedIn(isLoggedIn())
    setCurrentUser(getUser())
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [carsRes, announcementsRes, aboutUsRes, siteIntroRes] = await Promise.all([
        api.get('/public/cars?page_size=12'),
        api.get('/public/announcements?page_size=5'),
        api.get('/public/about-us'),
        api.get('/public/site-intro'),
      ])
      setCars(carsRes.data.data || [])
      setAnnouncements(announcementsRes.data.data || [])
      setAboutUs(aboutUsRes.data)
      setSiteIntro(siteIntroRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      loadData()
      return
    }
    setLoading(true)
    try {
      const response = await api.get(`/public/cars?page_size=12&plate_number=${encodeURIComponent(value)}&brand=${encodeURIComponent(value)}`)
      setCars(response.data.data || [])
    } catch (error) {
      message.error('搜索失败')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    setLoggedIn(false)
    setCurrentUser(null)
    message.success('已退出登录')
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
        <a onClick={() => navigate('/user/orders')}>
          <CarOutlined /> 我的订单
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

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      available: { color: 'green', text: '可租赁' },
      rented: { color: 'red', text: '已租赁' },
    }
    const s = statusMap[status] || { color: 'default', text: status }
    return <Tag color={s.color}>{s.text}</Tag>
  }

  return (
    <Layout className="layout">
      <Header className="home-header" style={{ position: 'fixed', zIndex: 1, width: '100%' }}>
        <div className="logo">
          <CarOutlined /> 共享汽车租赁
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['home']}
          style={{ lineHeight: '64px', float: 'left', marginLeft: 20 }}
          items={[
            { key: 'home', label: '首页' },
          ]}
        />
        <div style={{ float: 'right', lineHeight: '64px' }}>
          {loggedIn ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#fff' }}>
                <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
                <span>{currentUser?.username}</span>
                {currentUser?.role_name === 'admin' && (
                  <Button
                    type="link"
                    style={{ color: '#fff', marginLeft: 16 }}
                    onClick={() => navigate('/admin')}
                  >
                    管理后台
                  </Button>
                )}
              </div>
            </Dropdown>
          ) : (
            <Button type="primary" icon={<LoginOutlined />} onClick={() => navigate('/login')}>
              登录
            </Button>
          )}
        </div>
      </Header>

      <Content style={{ marginTop: 64 }}>
        <div className="home-hero">
          <h1>共享汽车租赁系统</h1>
          <p>{siteIntro?.content || '便捷、高效、安全的汽车租赁服务'}</p>
          <Search
            placeholder="搜索车牌号、品牌..."
            allowClear
            enterButton={<Button type="primary" icon={<SearchOutlined />}>搜索</Button>}
            size="large"
            style={{ maxWidth: 600 }}
            onSearch={handleSearch}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="cars-section">
          <div className="section-title">
            <h2>热门车辆</h2>
            <p>选择您心仪的车型，开启美好旅程</p>
          </div>
          <Row gutter={[16, 16]}>
            {cars.map((car) => (
              <Col xs={24} sm={12} md={8} lg={6} key={car.id}>
                <Card
                  hoverable
                  className="car-card"
                  cover={
                    <img
                      alt={`${car.brand} ${car.model}`}
                      src={car.image || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20car%20rental%20vehicle%20in%20showroom%20professional%20photo&image_size=square_hd'}
                      style={{ height: 180, objectFit: 'cover' }}
                    />
                  }
                  actions={[
                    <Button
                      type="primary"
                      onClick={() => navigate(`/cars/${car.id}`)}
                    >
                      查看详情
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={`${car.brand} ${car.model}`}
                    description={
                      <div>
                        <div>车牌号: {car.plate_number}</div>
                        <div>座位数: {car.seats}座</div>
                        <div style={{ color: '#1890ff', fontSize: 16, fontWeight: 'bold', marginTop: 8 }}>
                          ¥{car.rental_price}/天
                        </div>
                        <div style={{ marginTop: 8 }}>
                          {getStatusTag(car.status)}
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
          {cars.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              暂无车辆信息
            </div>
          )}
        </div>

        <div className="announcements-section">
          <div className="section-title">
            <h2>网站公告</h2>
            <p>了解最新的租赁资讯</p>
          </div>
          <Row gutter={[16, 16]}>
            {announcements.map((announcement) => (
              <Col xs={24} sm={12} md={8} key={announcement.id}>
                <Card
                  hoverable
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {announcement.is_top && <Tag color="red">置顶</Tag>}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {announcement.title}
                      </span>
                    </div>
                  }
                >
                  <div
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      color: '#666',
                    }}
                    dangerouslySetInnerHTML={{ __html: announcement.content }}
                  />
                  <div style={{ marginTop: 12, color: '#999', fontSize: 12 }}>
                    {new Date(announcement.created_at).toLocaleString()}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {aboutUs && (
          <div className="about-section">
            <div className="section-title">
              <h2>关于我们</h2>
            </div>
            <div
              style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}
              dangerouslySetInnerHTML={{ __html: aboutUs.content }}
            />
          </div>
        )}
      </Content>

      <Footer style={{ textAlign: 'center' }}>
        共享汽车租赁系统 ©{new Date().getFullYear()} Created with Trae IDE
      </Footer>
    </Layout>
  )
}

export default Home
