import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, message, Space, Modal, Form, Input, Select, ExclamationCircleOutlined, InputNumber, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import api from '../../services/api'

const { confirm } = Modal

interface User {
  id: number
  username: string
  email: string
  phone: string
  real_name: string
  role_id: number
  role: {
    id: number
    name: string
  }
  created_at: string
}

interface Role {
  id: number
  name: string
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [searchText, setSearchText] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form] = Form.useForm()

  const loadRoles = async () => {
    try {
      const response = await api.get('/admin/roles')
      setRoles(response.data.data || [])
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }

  const loadUsers = async (page = 1, pageSize = 10, search = '') => {
    setLoading(true)
    try {
      let url = `/admin/users?page=${page}&page_size=${pageSize}`
      if (search) {
        url += `&search=${encodeURIComponent(search)}`
      }
      const response = await api.get(url)
      setUsers(response.data.data || [])
      setPagination({
        current: response.data.page || 1,
        pageSize: response.data.page_size || 10,
        total: response.data.total || 0,
      })
    } catch (error) {
      message.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoles()
    loadUsers()
  }, [])

  const handleSearch = () => {
    loadUsers(1, pagination.pageSize, searchText)
  }

  const handleAdd = () => {
    setEditingUser(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: User) => {
    setEditingUser(record)
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      phone: record.phone,
      real_name: record.real_name,
      role_id: record.role_id,
    })
    setModalVisible(true)
  }

  const handleDelete = (record: User) => {
    confirm({
      title: '确认删除？',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除用户 "${record.username}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/admin/users/${record.id}`)
          message.success('删除成功')
          loadUsers(pagination.current, pagination.pageSize, searchText)
        } catch (error: any) {
          message.error(error.response?.data?.error || '删除失败')
        }
      },
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/admin/users', values)
        message.success('创建成功')
      }
      
      setModalVisible(false)
      loadUsers(pagination.current, pagination.pageSize, searchText)
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const columns: TableProps<User>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '真实姓名',
      dataIndex: 'real_name',
      key: 'real_name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '角色',
      dataIndex: ['role', 'name'],
      key: 'role',
      render: (name: string) => <Tag color="blue">{name}</Tag>,
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除？"
            onConfirm={() => handleDelete(record)}
            okText="删除"
            okType="danger"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>用户管理</h2>
        <Space>
          <Input
            placeholder="搜索用户名/姓名/邮箱"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => loadUsers(pagination.current, pagination.pageSize, searchText)}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增用户
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, pageSize) => loadUsers(page, pageSize, searchText),
        }}
      />

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: !editingUser, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
            ]}
          >
            <Input placeholder="用户名" disabled={!!editingUser} />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password placeholder="密码" />
            </Form.Item>
          )}
          <Form.Item
            name="real_name"
            label="真实姓名"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input placeholder="真实姓名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入正确的邮箱格式' },
            ]}
          >
            <Input placeholder="邮箱" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input placeholder="手机号" />
          </Form.Item>
          <Form.Item
            name="role_id"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              {roles.map((role) => (
                <Select.Option key={role.id} value={role.id}>
                  {role.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserManagement
