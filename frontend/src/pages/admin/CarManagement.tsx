import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, message, Space, Modal, Form, Input, Select, InputNumber, Upload, Image, ExclamationCircleOutlined, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons'
import type { TableProps, UploadProps } from 'antd'
import api from '../../services/api'

const { confirm } = Modal
const { TextArea } = Input

interface Car {
  id: number
  plate_number: string
  brand: string
  model: string
  type_id: number
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

interface CarType {
  id: number
  name: string
}

const statusColors: Record<string, { color: string; text: string }> = {
  available: { color: 'green', text: '可租赁' },
  rented: { color: 'red', text: '已租赁' },
}

const CarManagement: React.FC = () => {
  const [cars, setCars] = useState<Car[]>([])
  const [carTypes, setCarTypes] = useState<CarType[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [searchText, setSearchText] = useState('')
  const [searchStatus, setSearchStatus] = useState<string>('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCar, setEditingCar] = useState<Car | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [form] = Form.useForm()

  const loadCarTypes = async () => {
    try {
      const response = await api.get('/admin/car-types')
      setCarTypes(response.data.data || [])
    } catch (error) {
      console.error('Failed to load car types:', error)
    }
  }

  const loadCars = async (page = 1, pageSize = 10, search = '', status = '') => {
    setLoading(true)
    try {
      let url = `/admin/cars?page=${page}&page_size=${pageSize}`
      if (search) {
        url += `&plate_number=${encodeURIComponent(search)}&brand=${encodeURIComponent(search)}`
      }
      if (status) {
        url += `&status=${status}`
      }
      const response = await api.get(url)
      setCars(response.data.data || [])
      setPagination({
        current: response.data.page || 1,
        pageSize: response.data.page_size || 10,
        total: response.data.total || 0,
      })
    } catch (error) {
      message.error('获取汽车列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCarTypes()
    loadCars()
  }, [])

  const handleSearch = () => {
    loadCars(1, pagination.pageSize, searchText, searchStatus)
  }

  const handleAdd = () => {
    setEditingCar(null)
    setImageUrl('')
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Car) => {
    setEditingCar(record)
    setImageUrl(record.image || '')
    form.setFieldsValue({
      plate_number: record.plate_number,
      brand: record.brand,
      model: record.model,
      type_id: record.type_id,
      color: record.color,
      seats: record.seats,
      rental_price: record.rental_price,
      status: record.status,
      description: record.description,
    })
    setModalVisible(true)
  }

  const handleDelete = (record: Car) => {
    confirm({
      title: '确认删除？',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除汽车 "${record.brand} ${record.model} (${record.plate_number})" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/admin/cars/${record.id}`)
          message.success('删除成功')
          loadCars(pagination.current, pagination.pageSize, searchText, searchStatus)
        } catch (error: any) {
          message.error(error.response?.data?.error || '删除失败')
        }
      },
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (imageUrl) {
        values.image = imageUrl
      }
      
      if (editingCar) {
        await api.put(`/admin/cars/${editingCar.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/admin/cars', values)
        message.success('创建成功')
      }
      
      setModalVisible(false)
      loadCars(pagination.current, pagination.pageSize, searchText, searchStatus)
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const uploadProps: UploadProps = {
    name: 'image',
    action: '/api/admin/cars/upload',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('car_rental_token')}`,
    },
    onChange(info) {
      if (info.file.status === 'done') {
        if (info.file.response?.url) {
          setImageUrl(info.file.response.url)
          message.success('图片上传成功')
        } else {
          message.error('上传失败')
        }
      } else if (info.file.status === 'error') {
        message.error('上传失败')
      }
    },
  }

  const columns: TableProps<Car>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '图片',
      dataIndex: 'image',
      key: 'image',
      width: 100,
      render: (image: string) => (
        image ? (
          <Image
            width={60}
            height={40}
            src={image}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <span style={{ color: '#999' }}>无</span>
        )
      ),
    },
    {
      title: '车牌号',
      dataIndex: 'plate_number',
      key: 'plate_number',
    },
    {
      title: '品牌型号',
      key: 'car',
      render: (_, record) => `${record.brand} ${record.model}`,
    },
    {
      title: '类型',
      dataIndex: ['car_type', 'name'],
      key: 'car_type',
      render: (name: string) => <Tag color="blue">{name}</Tag>,
    },
    {
      title: '颜色/座位',
      key: 'info',
      render: (_, record) => `${record.color} / ${record.seats}座`,
    },
    {
      title: '日租金',
      dataIndex: 'rental_price',
      key: 'rental_price',
      render: (price: number) => (
        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>¥{price}</span>
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
        <h2>汽车管理</h2>
        <Space>
          <Input
            placeholder="搜索车牌号/品牌"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
          />
          <Select
            placeholder="状态筛选"
            allowClear
            value={searchStatus || undefined}
            onChange={(value) => setSearchStatus(value || '')}
            style={{ width: 120 }}
          >
            <Select.Option value="available">可租赁</Select.Option>
            <Select.Option value="rented">已租赁</Select.Option>
          </Select>
          <Button icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => loadCars(pagination.current, pagination.pageSize, searchText, searchStatus)}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增汽车
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={cars}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, pageSize) => loadCars(page, pageSize, searchText, searchStatus),
        }}
      />

      <Modal
        title={editingCar ? '编辑汽车' : '新增汽车'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="plate_number"
            label="车牌号"
            rules={[{ required: true, message: '请输入车牌号' }]}
          >
            <Input placeholder="例如：京A12345" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="brand"
              label="品牌"
              rules={[{ required: true, message: '请输入品牌' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="例如：奔驰" />
            </Form.Item>
            <Form.Item
              name="model"
              label="型号"
              rules={[{ required: true, message: '请输入型号' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="例如：E300L" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="type_id"
              label="汽车类型"
              rules={[{ required: true, message: '请选择汽车类型' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择汽车类型">
                {carTypes.map((type) => (
                  <Select.Option key={type.id} value={type.id}>
                    {type.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="color"
              label="颜色"
              style={{ flex: 1 }}
            >
              <Input placeholder="例如：黑色" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="seats"
              label="座位数"
              style={{ flex: 1 }}
            >
              <InputNumber min={1} max={20} placeholder="座位数" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="rental_price"
              label="日租金(元)"
              rules={[{ required: true, message: '请输入日租金' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={0} precision={2} placeholder="日租金" style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Select.Option value="available">可租赁</Select.Option>
              <Select.Option value="rented">已租赁</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="汽车图片">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <Upload {...uploadProps} listType="picture" maxCount={1}>
                <Button icon={<UploadOutlined />}>上传图片</Button>
              </Upload>
              {imageUrl && (
                <Image
                  width={120}
                  height={80}
                  src={imageUrl}
                  style={{ objectFit: 'cover' }}
                />
              )}
            </div>
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="汽车描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CarManagement
