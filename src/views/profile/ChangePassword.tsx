import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Typography, App } from 'antd'
import axios from 'axios'
import { UserInfo } from '@/utils/auth'

const { Title } = Typography

export default function ChangePassword() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const onFinish = async (values: { old: string; password: string }) => {
    if (values.old === values.password) { message.warning('Please use a different password!'); return }
    setLoading(true)
    const session = new UserInfo().getUserInfo()
    if (!session || session === -1) { setLoading(false); return }
    const rsp = await axios.post('/api/password', { token: session.token, old_pass: values.old, new_pass: values.password })
    if (rsp.data.status) {
      message.success('Successfully changed password!')
      navigate('/profile')
    } else {
      message.error('Please input right old password.')
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#fff', padding: 20 }}>
      <Title level={3}>Change Password</Title>
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item name="old" label="Old Password" hasFeedback rules={[
          { required: true, message: 'Please input your old password!' },
        ]}>
          <Input.Password />
        </Form.Item>
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
        <Button type="primary" htmlType="submit" loading={loading}>Change</Button>
        <Button onClick={() => window.history.back()} style={{ marginLeft: 20 }}>Cancel</Button>
      </Form>
    </div>
  )
}
