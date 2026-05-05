import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, message, Space, Modal, Descriptions } from 'antd'
import { CarOutlined, ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
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
  car: {
    id: number
    plate_number: string
    brand: string
    model: string
    image: string
    car_type: {
      name: string
    }
  }
}

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  const loadOrders = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const response = await api.get(`/my-orders?page=${page}&page_size=${pageSize}`)
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

  const handleReturnCar = (record: Order) => {
    confirm({
      title: '确认归还汽车？',
      icon: <ExclamationCircleOutlined />,
      content: `订单号: ${record.order_no}`,
      onOk: async () => {
        try {
          await api.put(`/orders/${record.id}/return`)
          message.success('归还成功')
          loadOrders(pagination.current, pagination.pageSize)
        } catch (error: any) {
          message.error(error.response?.data?.error || '归还失败')
        }
      },
    })
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'blue', text: '待确认' },
      rented: { color: 'orange', text: '租赁中' },
      completed: { color: 'green', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' },
    }
    const s = statusMap[status] || { color: 'default', text: status }
    return <Tag color={s.color}>{s.text}</Tag>
  }

  const columns: TableProps<Order>['columns'] = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
    },
    {
      title: '车辆信息',
      key: 'car',
      render: (_, record) => (
        <div>
          <div>{record.car?.brand} {record.car?.model}</div>
          <div style={{ color: '#666', fontSize: 12 }}>
            车牌号: {record.car?.plate_number}
          </div>
        </div>
      ),
    },
    {
      title: '租赁时间',
      key: 'time',
      render: (_, record) => (
        <div>
          <div>开始: {new Date(record.rental_start).toLocaleString()}</div>
          <div>结束: {new Date(record.rental_end).toLocaleString()}</div>
          {record.actual_end && (
            <div style={{ color: '#666', fontSize: 12 }}>
              实际归还: {new Date(record.actual_end).toLocaleString()}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (value) => <span style={{ color: '#1890ff', fontWeight: 'bold' }}>¥{value}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
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
          {(record.status === 'pending' || record.status === 'rented') && (
            <Button
              type="primary"
              size="small"
              icon={<CarOutlined />}
              onClick={() => handleReturnCar(record)}
            >
              归还汽车
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>我的订单</h2>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => loadOrders(pagination.current, pagination.pageSize)}
        >
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
    </div>
  )
}

export default MyOrders
