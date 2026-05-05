import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, message, Space, Modal, Form, Input, Select, ExclamationCircleOutlined, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import api from '../../services/api'

const { confirm } = Modal
const { TextArea } = Input

interface Permission {
  id: number
  name: string
  url: string
  method: string
  description: string
  created_at: string
}

const methodColors: Record<string, string> = {
  GET: 'green',
  POST: 'blue',
  PUT: 'orange',
  DELETE: 'red',
}

const PermissionManagement: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [form] = Form.useForm()

  const loadPermissions = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/permissions')
      setPermissions(response.data.data || [])
    } catch (error) {
      message.error('获取权限列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPermissions()
  }, [])

  const handleAdd = () => {
    setEditingPermission(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Permission) => {
    setEditingPermission(record)
    form.setFieldsValue({
      name: record.name,
      url: record.url,
      method: record.method.toUpperCase(),
      description: record.description,
    })
    setModalVisible(true)
  }

  const handleDelete = (record: Permission) => {
    confirm({
      title: '确认删除？',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除权限 "${record.name}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/admin/permissions/${record.id}`)
          message.success('删除成功')
          loadPermissions()
        } catch (error: any) {
          message.error(error.response?.data?.error || '删除失败')
        }
      },
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingPermission) {
        await api.put(`/admin/permissions/${editingPermission.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/admin/permissions', values)
        message.success('创建成功')
      }
      
      setModalVisible(false)
      loadPermissions()
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const columns: TableProps<Permission>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '权限名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      render: (url: string) => (
        <code style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>
          {url}
        </code>
      ),
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => (
        <Tag color={methodColors[method.toUpperCase()] || 'default'}>
          {method.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '创建时间',
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
        <h2>权限管理</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadPermissions}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增权限
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={permissions}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingPermission ? '编辑权限' : '新增权限'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="权限名称"
            rules={[{ required: true, message: '请输入权限名称' }]}
          >
            <Input placeholder="权限名称" />
          </Form.Item>
          <Form.Item
            name="url"
            label="访问URL"
            rules={[{ required: true, message: '请输入访问URL' }]}
          >
            <Input placeholder="例如: /api/admin/users" />
          </Form.Item>
          <Form.Item
            name="method"
            label="请求方法"
            rules={[{ required: true, message: '请选择请求方法' }]}
          >
            <Select placeholder="请选择请求方法">
              <Select.Option value="GET">GET</Select.Option>
              <Select.Option value="POST">POST</Select.Option>
              <Select.Option value="PUT">PUT</Select.Option>
              <Select.Option value="DELETE">DELETE</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="权限描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PermissionManagement
