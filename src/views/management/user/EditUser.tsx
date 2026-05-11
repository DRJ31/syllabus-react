import { useLocation, Link } from 'react-router-dom'
import { Form, Input, Tooltip, Select, Button, Typography, Breadcrumb, App } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'

const { Title } = Typography

interface EditUserData {
  username: string
  email: string
  role_id: number
}

export default function EditUser() {
  const { message } = App.useApp()
  const location = useLocation()
  const initialData = (location.state as { data: EditUserData } | null)?.data

  if (!initialData) return null

  const fakeSubmit = () => {
    message.success('User updated successfully')
    window.history.back()
  }

  return (
    <div style={{ background: '#fff', padding: 20 }}>
      <Breadcrumb items={[
        { title: <Link to="/">Home</Link> },
        { title: <Link to="/management">Management</Link> },
        { title: <Link to="/management/user">User Management</Link> },
        { title: 'Edit' },
      ]} />
      <Title level={3}>Edit User</Title>
      <Form layout="vertical" initialValues={initialData}>
        <Form.Item name="email" label="E-mail" rules={[
          { type: 'email', message: 'The input is not valid E-mail!' },
          { required: true, message: 'Please input your E-mail!' },
        ]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="username"
          label={<span>Username&nbsp;<Tooltip title="What do you want others to call you?"><QuestionCircleOutlined /></Tooltip></span>}
          rules={[{ required: true, message: 'Please input your nickname!', whitespace: true }]}
        >
          <Input disabled />
        </Form.Item>
        <Form.Item name="role_id" label="Role" rules={[{ required: true, message: "Please select user's role!" }]}>
          <Select options={[
            { value: 1, label: 'admin' },
            { value: 2, label: 'school' },
            { value: 3, label: 'teacher' },
            { value: 4, label: 'user' },
          ]} />
        </Form.Item>
        <Button type="primary" onClick={fakeSubmit}>Update</Button>
        <Button onClick={() => window.history.back()} style={{ marginLeft: 20 }}>Cancel</Button>
      </Form>
    </div>
  )
}
