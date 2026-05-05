import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, message, Space, Modal, Form, Input, ExclamationCircleOutlined, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import api from '../../services/api'

const { confirm } = Modal
const { TextArea } = Input

interface CarType {
  id: number
  name: string
  description: string
  cars: any[]
  created_at: string
}

const CarTypeManagement: React.FC = () => {
  const [carTypes, setCarTypes] = useState<CarType[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCarType, setEditingCarType] = useState<CarType | null>(null)
  const [form] = Form.useForm()

  const loadCarTypes = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/car-types')
      setCarTypes(response.data.data || [])
    } catch (error) {
      message.error('获取汽车类型列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCarTypes()
  }, [])

  const handleAdd = () => {
    setEditingCarType(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: CarType) => {
    setEditingCarType(record)
    form.setFieldsValue({
      name: record.name,
      description: record.description,
    })
    setModalVisible(true)
  }

  const handleDelete = (record: CarType) => {
    if (record.cars && record.cars.length > 0) {
      message.error('该类型下有汽车，无法删除')
      return
    }

    confirm({
      title: '确认删除？',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除汽车类型 "${record.name}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/admin/car-types/${record.id}`)
          message.success('删除成功')
          loadCarTypes()
        } catch (error: any) {
          message.error(error.response?.data?.error || '删除失败')
        }
      },
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingCarType) {
        await api.put(`/admin/car-types/${editingCarType.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/admin/car-types', values)
        message.success('创建成功')
      }
      
      setModalVisible(false)
      loadCarTypes()
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const columns: TableProps<CarType>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '类型名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '关联汽车数量',
      key: 'cars_count',
      render: (_, record) => (
        <Tag color="blue">{record.cars?.length || 0} 辆</Tag>
      ),
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
              disabled={record.cars && record.cars.length > 0}
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
        <h2>汽车类型管理</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadCarTypes}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增类型
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={carTypes}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingCarType ? '编辑汽车类型' : '新增汽车类型'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="类型名称"
            rules={[{ required: true, message: '请输入类型名称' }]}
          >
            <Input placeholder="例如：经济型、舒适型、豪华型" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="类型描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CarTypeManagement
