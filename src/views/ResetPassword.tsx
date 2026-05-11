import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Form, Input, Button, Typography, Alert, App } from 'antd'
import axios from 'axios'

const { Title, Text } = Typography

export default function ResetPassword() {
  const { message } = App.useApp()
  const { token } = useParams<{ token: string }>()
  const [valid, setValid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  useEffect(() => {
    axios.post('/api/password/check', { token }).then(rsp => setValid(rsp.data.status))
  }, [token])

  const onFinish = async (values: { password: string }) => {
    setLoading(true)
    const rsp = await axios.post('/api/password/reset', { token, old_pass: 'old', new_pass: values.password })
    if (rsp.data.status) {
      message.success('Successfully reset password!')
      navigate('/login')
    } else {
      message.error('Reset password failed')
      setLoading(false)
    }
  }

  if (!valid) return (
    <Alert
      message="Wrong token or link expired"
      type="warning"
      description={
        <Text>Your reset token is invalid or expired. Click <Link to="/">here</Link> to go back to homepage.</Text>
      }
    />
  )

  return (
    <div style={{ background: '#fff', padding: 20 }}>
      <Title level={3}>Reset Password</Title>
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item name="password" label="Password" hasFeedback rules={[
          { required: true, message: 'Please input your new password!' },
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
        <Button type="primary" htmlType="submit" loading={loading}>Reset</Button>
        <Button onClick={() => window.history.back()} style={{ marginLeft: 20 }}>Cancel</Button>
      </Form>
    </div>
  )
}
