import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Descriptions, DatePicker, Form, Input, message, Tag, Divider } from 'antd'
import { ArrowLeftOutlined, CarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import api from '../services/api'
import { isLoggedIn } from '../utils/auth'

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
  description: string
  car_type: {
    id: number
    name: string
  }
}

const { RangePicker } = DatePicker
const { TextArea } = Input

const CarDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [car, setCar] = useState<Car | null>(null)
  const [loading, setLoading] = useState(false)
  const [orderLoading, setOrderLoading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadCarDetail()
  }, [id])

  const loadCarDetail = async () => {
    if (!id) return
    setLoading(true)
    try {
      const response = await api.get(`/public/cars/${id}`)
      setCar(response.data)
    } catch (error) {
      message.error('获取汽车详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleOrder = async (values: any) => {
    if (!isLoggedIn()) {
      message.warning('请先登录')
      navigate('/login')
      return
    }

    if (!car) return

    if (car.status !== 'available') {
      message.error('该汽车当前不可租赁')
      return
    }

    setOrderLoading(true)
    try {
      const [start, end] = values.rental_dates
      const rentalStart = start.format('YYYY-MM-DD HH:mm:ss')
      const rentalEnd = end.format('YYYY-MM-DD HH:mm:ss')

      const response = await api.post('/orders', {
        car_id: car.id,
        rental_start: rentalStart,
        rental_end: rentalEnd,
        description: values.description,
      })

      message.success(`订单创建成功！订单号: ${response.data.order_no}`)
      navigate('/user/orders')
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建订单失败')
    } finally {
      setOrderLoading(false)
    }
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      available: { color: 'green', text: '可租赁' },
      rented: { color: 'red', text: '已租赁' },
    }
    const s = statusMap[status] || { color: 'default', text: status }
    return <Tag color={s.color}>{s.text}</Tag>
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        加载中...
      </div>
    )
  }

  if (!car) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h3>汽车不存在</h3>
        <Button type="primary" onClick={() => navigate('/')}>
          返回首页
        </Button>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
        返回首页
      </Button>

      <Card>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <img
              alt={`${car.brand} ${car.model}`}
              src={car.image || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20car%20rental%20vehicle%20in%20showroom%20professional%20photo&image_size=square_hd'}
              style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 8 }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <h1 style={{ margin: 0 }}>{car.brand} {car.model}</h1>
              {getStatusTag(car.status)}
            </div>
            
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="车牌号">{car.plate_number}</Descriptions.Item>
              <Descriptions.Item label="车型">{car.car_type?.name}</Descriptions.Item>
              <Descriptions.Item label="颜色">{car.color}</Descriptions.Item>
              <Descriptions.Item label="座位数">{car.seats}座</Descriptions.Item>
              <Descriptions.Item label="租赁价格">
                <span style={{ color: '#1890ff', fontSize: 24, fontWeight: 'bold' }}>
                  ¥{car.rental_price}
                </span>
                <span style={{ color: '#666' }}>/天</span>
              </Descriptions.Item>
            </Descriptions>

            {car.description && (
              <>
                <Divider />
                <div>
                  <h4>车辆描述</h4>
                  <div>{car.description}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {car.status === 'available' && (
        <Card title="我要租赁" style={{ marginTop: 24 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleOrder}
            style={{ maxWidth: 500 }}
          >
            <Form.Item
              name="rental_dates"
              label="租赁日期时间"
              rules={[{ required: true, message: '请选择租赁日期时间' }]}
            >
              <RangePicker
                showTime={{ format: 'HH:mm' }}
                format="YYYY-MM-DD HH:mm"
                style={{ width: '100%' }}
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>
            <Form.Item
              name="description"
              label="备注"
            >
              <TextArea rows={3} placeholder="请输入备注信息（可选）" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={orderLoading}
                icon={<CarOutlined />}
              >
                确认租赁
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  )
}

export default CarDetail
