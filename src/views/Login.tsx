import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Form, Input, Button, Checkbox, Card, App } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import axios from 'axios'
import { UserInfo } from '@/utils/auth'

export default function Login() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  useEffect(() => {
    const saved = window.localStorage.getItem('username')
    if (saved) form.setFieldsValue({ username: saved, remember: true })
  }, [form])

  const onFinish = async (values: { username: string; password: string; remember: boolean }) => {
    setLoading(true)
    if (values.remember) {
      window.localStorage.setItem('username', values.username)
    } else {
      window.localStorage.removeItem('username')
    }
    const rsp = await axios.post('/api/user', { name: values.username, password: values.password })
    if (rsp.data.token) {
      new UserInfo().setUserInfo(rsp.data.token)
      message.success('Login succeeded')
      navigate('/')
    } else {
      message.error('Username or password error')
      setLoading(false)
    }
  }

  return (
    <Card title="Login" style={{ background: '#fff', padding: 10 }}>
      <Form form={form} onFinish={onFinish}>
        <Form.Item name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
          <Input prefix={<UserOutlined />} placeholder="Username" />
        </Form.Item>
        <Form.Item name="password" rules={[{ required: true, message: 'Please input your Password!' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="Password" />
        </Form.Item>
        <Form.Item name="remember" valuePropName="checked">
          <Checkbox>Remember me</Checkbox>
        </Form.Item>
        <Link style={{ float: 'right' }} to="/forget">Forgot password</Link>
        <Button type="primary" htmlType="submit" style={{ marginRight: 10 }} loading={loading}>
          Login
        </Button>
        <br />
        Or <Link to="/register">Register now!</Link>
      </Form>
    </Card>
  )
}
