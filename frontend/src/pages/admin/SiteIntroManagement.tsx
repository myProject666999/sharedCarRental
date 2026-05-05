import React, { useEffect, useState } from 'react'
import { Card, Button, Form, message, Spin, Space } from 'antd'
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import api from '../../services/api'

const { TextArea } = Form

const SiteIntroManagement: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadContent = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/site-intro')
      form.setFieldsValue({
        content: response.data.content || '',
      })
    } catch (error: any) {
      if (error.response?.status !== 404) {
        message.error('获取内容失败')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContent()
  }, [])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      
      await api.put('/admin/site-intro', values)
      message.success('保存成功')
    } catch (error: any) {
      message.error(error.response?.data?.error || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>网站简介</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadContent}>
            刷新
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
            保存
          </Button>
        </Space>
      </div>

      <Card title="编辑内容">
        <Spin spinning={loading}>
          <Form form={form} layout="vertical">
            <Form.Item
              name="content"
              label="内容（支持HTML富文本）"
              rules={[{ required: true, message: '请输入内容' }]}
            >
              <TextArea
                rows={10}
                placeholder="请输入网站简介内容，支持HTML标签"
              />
            </Form.Item>
          </Form>
        </Spin>
      </Card>

      <Card title="预览" style={{ marginTop: 16 }}>
        <Form.Item noStyle>
          <Form.Item noStyle name="content">
            {({ value }) => (
              <div dangerouslySetInnerHTML={{ __html: value || '' }} />
            )}
          </Form.Item>
        </Form.Item>
      </Card>
    </div>
  )
}

export default SiteIntroManagement
