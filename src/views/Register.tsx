import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Form, Input, Tooltip, Button, Typography, Breadcrumb, message } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Title } = Typography

export default function Register() {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const onFinish = async (values: { name: string; email: string; password: string }) => {
    setLoading(true)
    const rsp = await axios.post('/api/register', {
      name: values.name,
      password: values.password,
      email: values.email,
      role_id: 4,
    })
    if (rsp.data.status) {
      message.success('You have successfully registered!')
      navigate('/login')
    } else {
      message.error('Your username or email have been registered!', 5)
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#fff', padding: 20 }}>
      <Breadcrumb items={[
        { title: <Link to="/">Home</Link> },
        { title: 'Register' },
      ]} />
      <Title level={3}>Register</Title>
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item
          name="name"
          label={<span>Username&nbsp;<Tooltip title="What do you want others to call you?"><QuestionCircleOutlined /></Tooltip></span>}
          rules={[{ required: true, message: 'Please input your nickname!', whitespace: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="email" label="E-mail" rules={[
          { type: 'email', message: 'The input is not valid E-mail!' },
          { required: true, message: 'Please input your E-mail!' },
        ]}>
          <Input />
        </Form.Item>
        <Form.Item name="password" label="Password" hasFeedback rules={[
          { required: true, message: 'Please input your password!' },
        ]}>
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="confirm"
          label="Confirm Password"
          hasFeedback
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) return Promise.resolve()
                return Promise.reject(new Error('Two passwords that you enter is inconsistent!'))
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>Register</Button>
        </Form.Item>
      </Form>
    </div>
  )
}
