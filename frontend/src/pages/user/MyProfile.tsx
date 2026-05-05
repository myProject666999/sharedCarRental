import React, { useEffect, useState } from 'react'
import { Form, Input, Button, Card, message, Divider, Descriptions } from 'antd'
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, IdcardOutlined } from '@ant-design/icons'
import api from '../../services/api'
import { getUser, setUser } from '../../utils/auth'

interface UserData {
  id: number
  username: string
  email: string
  phone: string
  real_name: string
  id_card: string
  role_id: number
  role_name: string
  created_at: string
}

const MyProfile: React.FC = () => {
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [user, setUserState] = useState<UserData | null>(null)

  const loadUserProfile = async () => {
    try {
      const response = await api.get('/me')
      const userData = response.data
      setUserState(userData)
      form.setFieldsValue({
        email: userData.email,
        phone: userData.phone,
        real_name: userData.real_name,
        id_card: userData.id_card,
      })
    } catch (error) {
      message.error('获取用户信息失败')
    }
  }

  useEffect(() => {
    loadUserProfile()
  }, [])

  const handleUpdateProfile = async (values: any) => {
    setLoading(true)
    try {
      await api.put('/me', values)
      message.success('个人信息更新成功')
      
      const currentUser = getUser()
      if (currentUser) {
        setUser({
          ...currentUser,
          real_name: values.real_name,
          email: values.email,
          phone: values.phone,
        })
      }
      loadUserProfile()
    } catch (error: any) {
      message.error(error.response?.data?.error || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (values: any) => {
    if (values.new_password !== values.confirm_password) {
      message.error('两次输入的新密码不一致')
      return
    }

    setPasswordLoading(true)
    try {
      await api.put('/password', {
        old_password: values.old_password,
        new_password: values.new_password,
      })
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error: any) {
      message.error(error.response?.data?.error || '密码修改失败')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div>
      <h2>个人中心</h2>
      
      <Card title="基本信息" style={{ marginBottom: 24 }}>
        {user && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
            <Descriptions.Item label="角色">{user.role_name}</Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {new Date(user.created_at).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title="编辑个人信息" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
          style={{ maxWidth: 500 }}
        >
          <Form.Item
            name="real_name"
            label="真实姓名"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="真实姓名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入正确的邮箱格式' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="手机号" />
          </Form.Item>
          <Form.Item
            name="id_card"
            label="身份证号"
          >
            <Input prefix={<IdcardOutlined />} placeholder="身份证号（选填）" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Divider />

      <Card title="修改密码">
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleUpdatePassword}
          style={{ maxWidth: 500 }}
        >
          <Form.Item
            name="old_password"
            label="原密码"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="原密码" />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="新密码" />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="确认新密码"
            dependencies={['new_password']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认新密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={passwordLoading}>
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default MyProfile
