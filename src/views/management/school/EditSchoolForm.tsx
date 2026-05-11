import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Form, Input, Button, Typography, Breadcrumb, App } from 'antd'
import axios from 'axios'

const { Title } = Typography
const { TextArea } = Input

interface EditSchoolData {
  id: number
  name: string
  location: string
  introduction: string
}

export default function EditSchoolForm() {
  const { message } = App.useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const initialData = (location.state as { data: EditSchoolData } | null)?.data

  if (!initialData) return null

  const onFinish = async (values: { name: string; location: string; introduction: string }) => {
    setLoading(true)
    const rsp = await axios.post('/api/school/update', {
      name: values.name,
      location: values.location,
      introduction: values.introduction,
      id: initialData.id,
    })
    if (rsp.data.status) {
      message.success('School profile updated successfully!')
      navigate('/profile')
    } else {
      message.error('Error when updating school profile.')
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#fff', padding: 20 }}>
      <Breadcrumb items={[
        { title: <Link to="/">Home</Link> },
        { title: <Link to="/management">Management</Link> },
        { title: <Link to="/management/school">School Management</Link> },
        { title: 'Edit' },
      ]} />
      <Title level={3}>Edit School</Title>
      <Form onFinish={onFinish} layout="vertical" initialValues={initialData}>
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please input school name' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="location" label="Location" hasFeedback rules={[{ required: true, message: 'Please input the country of the school' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="introduction" label="Introduction" rules={[{ required: true, message: 'Please input introduction of school', whitespace: true }]}>
          <TextArea autoSize placeholder="Introduction" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>Update</Button>
        <Button onClick={() => window.history.back()} style={{ marginLeft: 20 }}>Cancel</Button>
      </Form>
    </div>
  )
}
