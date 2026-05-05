import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, message, Space, Modal, Descriptions, ExclamationCircleOutlined, Popconfirm } from 'antd'
import { ReloadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import api from '../../services/api'

const { confirm } = Modal

interface Order {
  id: number
  order_no: string
  user_id: number
  car_id: number
  rental_start: string
  rental_end: string
  actual_end: string | null
  total_amount: number
  status: string
  description: string
  created_at: string
  user: {
    id: number
    username: string
    real_name: string
    phone: string
  }
  car: {
    id: number
    plate_number: string
    brand: string
    model: string
    car_type: {
      name: string
    }
  }
}

const statusColors: Record<string, { color: string; text: string }> = {
  pending: { color: 'blue', text: '待确认' },
  rented: { color: 'orange', text: '租赁中' },
  completed: { color: 'green', text: '已完成' },
  cancelled: { color: 'red', text: '已取消' },
}

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)

  const loadOrders = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const response = await api.get(`/admin/orders?page=${page}&page_size=${pageSize}`)
      setOrders(response.data.data || [])
      setPagination({
        current: response.data.page || 1,
        pageSize: response.data.page_size || 10,
        total: response.data.total || 0,
      })
    } catch (error) {
      message.error('获取订单列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleView = (record: Order) => {
    setViewingOrder(record)
    setDetailModalVisible(true)
  }

  const handleDelete = (record: Order) => {
    confirm({
      title: '确认删除？',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除订单 "${record.order_no}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/admin/orders/${record.id}`)
          message.success('删除成功')
          loadOrders(pagination.current, pagination.pageSize)
        } catch (error: any) {
          message.error(error.response?.data?.error || '删除失败')
        }
      },
    })
  }

  const columns: TableProps<Order>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
    },
    {
      title: '用户',
      key: 'user',
      render: (_, record) => (
        <div>
          <div>{record.user?.username}</div>
          <div style={{ color: '#666', fontSize: 12 }}>
            {record.user?.real_name} | {record.user?.phone}
          </div>
        </div>
      ),
    },
    {
      title: '车辆',
      key: 'car',
      render: (_, record) => (
        <div>
          <div>{record.car?.brand} {record.car?.model}</div>
          <div style={{ color: '#666', fontSize: 12 }}>
            {record.car?.plate_number} | {record.car?.car_type?.name}
          </div>
        </div>
      ),
    },
    {
      title: '金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (value: number) => (
        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>¥{value}</span>
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
        <h2>订单管理</h2>
        <Button icon={<ReloadOutlined />} onClick={() => loadOrders(pagination.current, pagination.pageSize)}>
          刷新
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, pageSize) => loadOrders(page, pageSize),
        }}
      />

      <Modal
        title="订单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {viewingOrder && (
          <div>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="订单号">{viewingOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => {
                  const s = statusColors[viewingOrder.status] || { color: 'default', text: viewingOrder.status }
                  return <Tag color={s.color}>{s.text}</Tag>
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="用户信息">
                <div>用户名: {viewingOrder.user?.username}</div>
                <div>真实姓名: {viewingOrder.user?.real_name}</div>
                <div>手机号: {viewingOrder.user?.phone}</div>
              </Descriptions.Item>
              <Descriptions.Item label="车辆信息">
                <div>品牌型号: {viewingOrder.car?.brand} {viewingOrder.car?.model}</div>
                <div>车牌号: {viewingOrder.car?.plate_number}</div>
                <div>车型: {viewingOrder.car?.car_type?.name}</div>
              </Descriptions.Item>
              <Descriptions.Item label="租赁时间">
                <div>开始时间: {new Date(viewingOrder.rental_start).toLocaleString()}</div>
                <div>预计结束: {new Date(viewingOrder.rental_end).toLocaleString()}</div>
                {viewingOrder.actual_end && (
                  <div>实际归还: {new Date(viewingOrder.actual_end).toLocaleString()}</div>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="订单金额">
                <span style={{ color: '#1890ff', fontSize: 18, fontWeight: 'bold' }}>
                  ¥{viewingOrder.total_amount}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="备注">
                {viewingOrder.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(viewingOrder.created_at).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default OrderManagement
