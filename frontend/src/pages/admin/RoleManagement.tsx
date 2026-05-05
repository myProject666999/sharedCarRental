import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, message, Space, Modal, Form, Input, Select, ExclamationCircleOutlined, Checkbox, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import api from '../../services/api'

const { confirm } = Modal
const { TextArea } = Input
const { CheckboxGroup } = Checkbox

interface Role {
  id: number
  name: string
  description: string
  permissions: Permission[]
  created_at: string
}

interface Permission {
  id: number
  name: string
  url: string
  method: string
  description: string
}

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [viewingRole, setViewingRole] = useState<Role | null>(null)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [form] = Form.useForm()

  const loadRoles = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/roles')
      setRoles(response.data.data || [])
    } catch (error) {
      message.error('获取角色列表失败')
    } finally {
      setLoading(false)
    }
  }

  const loadPermissions = async () => {
    try {
      const response = await api.get('/admin/permissions')
      setPermissions(response.data.data || [])
    } catch (error) {
      console.error('Failed to load permissions:', error)
    }
  }

  useEffect(() => {
    loadRoles()
    loadPermissions()
  }, [])

  const handleView = (record: Role) => {
    setViewingRole(record)
    setDetailModalVisible(true)
  }

  const handleAdd = () => {
    setEditingRole(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Role) => {
    setEditingRole(record)
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      permission_ids: record.permissions?.map(p => p.id) || [],
    })
    setModalVisible(true)
  }

  const handleDelete = (record: Role) => {
    if (record.name === 'admin' || record.name === 'user') {
      message.error('系统内置角色不能删除')
      return
    }

    confirm({
      title: '确认删除？',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除角色 "${record.name}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/admin/roles/${record.id}`)
          message.success('删除成功')
          loadRoles()
        } catch (error: any) {
          message.error(error.response?.data?.error || '删除失败')
        }
      },
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingRole) {
        await api.put(`/admin/roles/${editingRole.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/admin/roles', values)
        message.success('创建成功')
      }
      
      setModalVisible(false)
      loadRoles()
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const columns: TableProps<Role>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Tag color={name === 'admin' ? 'red' : name === 'user' ? 'blue' : 'green'}>
          {name}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '权限数量',
      key: 'permissions_count',
      render: (_, record) => record.permissions?.length || 0,
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
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
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
              disabled={record.name === 'admin' || record.name === 'user'}
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
        <h2>角色管理</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadRoles}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增角色
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={roles}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="角色名称" disabled={!!editingRole} />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="角色描述" />
          </Form.Item>
          <Form.Item
            name="permission_ids"
            label="权限"
          >
            <CheckboxGroup>
              {permissions.map((perm) => (
                <div key={perm.id} style={{ marginBottom: 8 }}>
                  <Checkbox value={perm.id}>
                    {perm.name}
                    <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>
                      {perm.method.toUpperCase()} {perm.url}
                    </span>
                  </Checkbox>
                </div>
              ))}
            </CheckboxGroup>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="角色详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
      >
        {viewingRole && (
          <div>
            <p><strong>角色名称：</strong> {viewingRole.name}</p>
            <p><strong>描述：</strong> {viewingRole.description || '-'}</p>
            <p><strong>权限列表：</strong></p>
            <div style={{ marginTop: 8 }}>
              {viewingRole.permissions && viewingRole.permissions.length > 0 ? (
                viewingRole.permissions.map((perm) => (
                  <Tag key={perm.id} color="blue" style={{ margin: 4 }}>
                    {perm.name}
                  </Tag>
                ))
              ) : (
                <span style={{ color: '#999' }}>暂无权限</span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default RoleManagement
