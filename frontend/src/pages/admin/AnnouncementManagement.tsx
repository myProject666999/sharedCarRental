import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, message, Space, Modal, Form, Input, Select, Switch, ExclamationCircleOutlined, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import api from '../../services/api'

const { confirm } = Modal
const { TextArea } = Input

interface Announcement {
  id: number
  title: string
  content: string
  is_top: boolean
  status: string
  created_at: string
  updated_at: string
}

const statusColors: Record<string, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  published: { color: 'green', text: '已发布' },
}

const AnnouncementManagement: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [modalVisible, setModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [form] = Form.useForm()

  const loadAnnouncements = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const response = await api.get(`/admin/announcements?page=${page}&page_size=${pageSize}`)
      setAnnouncements(response.data.data || [])
      setPagination({
        current: response.data.page || 1,
        pageSize: response.data.page_size || 10,
        total: response.data.total || 0,
      })
    } catch (error) {
      message.error('获取公告列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const handleView = (record: Announcement) => {
    setViewingAnnouncement(record)
    setDetailModalVisible(true)
  }

  const handleAdd = () => {
    setEditingAnnouncement(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Announcement) => {
    setEditingAnnouncement(record)
    form.setFieldsValue({
      title: record.title,
      content: record.content,
      is_top: record.is_top,
      status: record.status,
    })
    setModalVisible(true)
  }

  const handleDelete = (record: Announcement) => {
    confirm({
      title: '确认删除？',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除公告 "${record.title}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/admin/announcements/${record.id}`)
          message.success('删除成功')
          loadAnnouncements(pagination.current, pagination.pageSize)
        } catch (error: any) {
          message.error(error.response?.data?.error || '删除失败')
        }
      },
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingAnnouncement) {
        await api.put(`/admin/announcements/${editingAnnouncement.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/admin/announcements', values)
        message.success('创建成功')
      }
      
      setModalVisible(false)
      loadAnnouncements(pagination.current, pagination.pageSize)
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const columns: TableProps<Announcement>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Announcement) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {record.is_top && <Tag color="red">置顶</Tag>}
          <span>{title}</span>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const s = statusColors[status] || { color: 'default', text: status }
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => new Date(time).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
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
        <h2>公告管理</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => loadAnnouncements(pagination.current, pagination.pageSize)}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增公告
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={announcements}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, pageSize) => loadAnnouncements(page, pageSize),
        }}
      />

      <Modal
        title={editingAnnouncement ? '编辑公告' : '新增公告'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="公告标题" />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={8} placeholder="公告内容（支持HTML富文本）" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="is_top"
              label="置顶"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
              style={{ marginBottom: 0 }}
            >
              <Select placeholder="请选择状态" style={{ width: 150 }}>
                <Select.Option value="draft">草稿</Select.Option>
                <Select.Option value="published">发布</Select.Option>
              </Select>
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title="公告详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {viewingAnnouncement && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{viewingAnnouncement.title}</h3>
              {viewingAnnouncement.is_top && <Tag color="red">置顶</Tag>}
              {(() => {
                const s = statusColors[viewingAnnouncement.status]
                return <Tag color={s.color}>{s.text}</Tag>
              })()}
            </div>
            <div style={{ color: '#666', marginBottom: 16 }}>
              创建时间: {new Date(viewingAnnouncement.created_at).toLocaleString()}
            </div>
            <div
              style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}
              dangerouslySetInnerHTML={{ __html: viewingAnnouncement.content }}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AnnouncementManagement
