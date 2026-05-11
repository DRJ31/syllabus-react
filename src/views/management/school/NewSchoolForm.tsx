import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Form, Input, Button, Upload, Typography, Breadcrumb, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import axios from 'axios'
import { UserInfo } from '@/utils/auth'

const { Title } = Typography
const { TextArea } = Input

export default function NewSchoolForm() {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [filename, setFilename] = useState('')
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const userInfo = new UserInfo()

  useEffect(() => {
    const session = userInfo.getUserInfo()
    if (!session || session === -1) { navigate('/login'); return }
    axios.post('/api/token', { token: session.token }).then(rsp => setUserName(rsp.data.user?.name ?? ''))
  }, [])

  const onFinish = async (values: { school_name: string; location: string; introduction: string }) => {
    setLoading(true)
    const session = userInfo.getUserInfo()
    if (!session || session === -1) { setLoading(false); return }
    const rsp = await axios.post('/api/audit', {
      school_name: values.school_name,
      introduction: values.introduction,
      description: filename,
      location: values.location,
      token: session.token,
    })
    if (rsp.data.status) {
      message.success('You have successfully submitted application for school!')
      navigate('/profile')
    } else {
      message.error('Do not submit application twice!')
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#fff', padding: 20 }}>
      <Breadcrumb items={[
        { title: <Link to="/">Home</Link> },
        { title: <Link to="/profile">Profile</Link> },
        { title: 'School' },
      ]} />
      <Title level={3}>New School</Title>
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item name="school_name" label="School Name" rules={[{ required: true, message: 'Please input school name' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="location" label="Location" hasFeedback rules={[{ required: true, message: 'Please input the country of the school' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="introduction" label="Introduction" rules={[{ required: true, message: 'Please input introduction of school', whitespace: true }]}>
          <TextArea autoSize placeholder="Introduction of your school" />
        </Form.Item>
        <Form.Item label="Upload">
          <Upload
            name="logo"
            customRequest={options => {
              const { onSuccess, file, onProgress } = options
              const formData = new FormData()
              formData.append('file', file as File)
              formData.append('category', 'school')
              formData.append('user', userName)
              axios.post('/api/school/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: e => onProgress?.({ percent: (e.loaded / (e.total ?? 1)) * 100 }),
              }).then(rsp => {
                setFilename(rsp.data.name)
                onSuccess?.(rsp.data)
              })
            }}
            fileList={fileList}
            onChange={info => setFileList(info.fileList.slice(-1))}
          >
            <Button icon={<UploadOutlined />}>Click to upload</Button>
          </Upload>
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>Apply</Button>
        <Button onClick={() => window.history.back()} style={{ marginLeft: 20 }}>Cancel</Button>
      </Form>
    </div>
  )
}
