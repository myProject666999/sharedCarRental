import React from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { setToken, setUser } from '../utils/auth'

interface LoginFormData {
  username: string
  password: string
}

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(false)

  const onFinish = async (values: LoginFormData) => {
    setLoading(true)
    try {
      const response = await api.post('/login', values)
      const { token, user } = response.data
      
      setToken(token)
      setUser(user)
      
      message.success('登录成功')
      
      if (user.role_name === 'admin') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card title="汽车租赁系统 - 登录" style={{ width: 400 }}>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              登录
            </Button>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link to="/register">还没有账号？立即注册</Link>
            </div>
            <div style={{ textAlign: 'center', marginTop: 8, color: '#999', fontSize: 12 }}>
              管理员账号: admin / admin123
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Login
