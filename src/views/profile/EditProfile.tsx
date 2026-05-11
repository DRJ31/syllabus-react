import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Tooltip, Button, Typography, Skeleton, Select, Upload, message } from 'antd'
import { QuestionCircleOutlined, UploadOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import axios from 'axios'
import { UserInfo } from '@/utils/auth'
import type { School } from '@/types'

const { Title } = Typography

export default function EditProfile() {
  const [loading, setLoading] = useState(true)
  const [btnLoading, setBtnLoading] = useState(false)
  const [schools, setSchools] = useState<School[]>([])
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const userInfo = new UserInfo()

  useEffect(() => {
    const session = userInfo.getUserInfo()
    if (!session || session === -1) { navigate('/login'); return }
    axios.get('/api/schools').then(rsp => {
      setSchools(rsp.data.schools)
      axios.post('/api/token', { token: session.token }).then(r => {
        if (r.data.user) {
          form.setFieldsValue({
            username: r.data.user.name,
            email: r.data.user.email,
            school: r.data.user.school?.name ?? null,
          })
          setLoading(false)
        }
      })
    })
  }, [])

  const onFinish = async (values: { email: string }) => {
    const session = userInfo.getUserInfo()
    if (!session || session === -1) return
    setBtnLoading(true)
    const rsp = await axios.post('/api/user/update', { token: session.token, email: values.email })
    if (rsp.data.status) {
      message.success('User profile updated successfully!')
      navigate('/profile')
    } else {
      message.error('Error when updating user profile.')
      setBtnLoading(false)
    }
  }

  return (
    <div style={{ background: '#fff', padding: 20 }}>
      <Skeleton active loading={loading}>
        <Title level={3}>Edit Profile</Title>
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item label="Upload">
            <Upload
              name="logo"
              customRequest={options => {
                const { onSuccess, file, onProgress } = options
                const session = userInfo.getUserInfo()
                if (!session || session === -1) return
                const formData = new FormData()
                formData.append('file', file as File)
                formData.append('token', session.token)
                axios.post('/api/user/avatar/upload', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                  onUploadProgress: e => onProgress?.({ percent: (e.loaded / (e.total ?? 1)) * 100 }),
                }).then(rsp => onSuccess?.(rsp.data))
              }}
              fileList={fileList}
              listType="picture"
              onChange={info => setFileList(info.fileList.slice(-1))}
            >
              <Button icon={<UploadOutlined />}>Upload Avatar</Button>
            </Upload>
          </Form.Item>
          <Form.Item
            name="username"
            label={<span>Username&nbsp;<Tooltip title="What do you want others to call you?"><QuestionCircleOutlined /></Tooltip></span>}
            rules={[{ required: true, message: 'Please input your nickname!', whitespace: true }]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item name="email" label="E-mail" rules={[
            { type: 'email', message: 'The input is not valid E-mail!' },
            { required: true, message: 'Please input your E-mail!' },
          ]}>
            <Input />
          </Form.Item>
          <Form.Item name="school" label="School">
            <Select disabled options={schools.map(s => ({ value: s.name, label: s.name }))} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={btnLoading}>Update</Button>
          <Button onClick={() => window.history.back()} style={{ marginLeft: 20 }}>Cancel</Button>
        </Form>
      </Skeleton>
    </div>
  )
}
