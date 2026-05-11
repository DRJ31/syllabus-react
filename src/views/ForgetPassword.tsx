import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Typography, App } from 'antd'
import axios from 'axios'

const { Title } = Typography

export default function ForgetPassword() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values: { email: string }) => {
    setLoading(true)
    const rsp = await axios.post('/api/password/mail', { email: values.email })
    if (rsp.data.status) {
      message.success('Successfully send email. Please go to your mailbox to check')
      navigate('/')
    } else {
      message.error('Wrong email address.')
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#fff', padding: 20 }}>
      <Title level={3}>Forget Password</Title>
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item name="email" label="Email" hasFeedback rules={[
          { type: 'email', message: 'The input is not valid E-mail!' },
          { required: true, message: 'Please input your email address!' },
        ]}>
          <Input />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>Send</Button>
        <Button onClick={() => window.history.back()} style={{ marginLeft: 20 }}>Cancel</Button>
      </Form>
    </div>
  )
}
