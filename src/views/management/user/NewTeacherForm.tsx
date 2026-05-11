import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Form, Button, Upload, Typography, Breadcrumb, Select, App } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import axios from 'axios'
import { UserInfo } from '@/utils/auth'
import type { School } from '@/types'

const { Title } = Typography

export default function NewTeacherForm() {
  const { message } = App.useApp()
  const [schools, setSchools] = useState<School[]>([])
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [filename, setFilename] = useState('')
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const userInfo = new UserInfo()

  useEffect(() => {
    const session = userInfo.getUserInfo()
    if (!session || session === -1) { navigate('/login'); return }
    axios.get('/api/schools').then(rsp => setSchools(rsp.data.schools))
    axios.post('/api/token', { token: session.token }).then(rsp => setUserName(rsp.data.user?.name ?? ''))
  }, [])

  const onFinish = async (values: { school: string }) => {
    setLoading(true)
    const session = userInfo.getUserInfo()
    if (!session || session === -1) { setLoading(false); return }
    const rsp = await axios.post('/api/audit/teacher', {
      token: session.token,
      description: filename,
      school_name: values.school,
    })
    if (rsp.data.status) {
      message.success('Successfully send application.')
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
        { title: 'Teacher' },
      ]} />
      <Title level={3}>Teacher Application Form</Title>
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item name="school" label="School" rules={[{ required: true, message: 'Please select school!' }]}>
          <Select showSearch options={schools.map(s => ({ value: s.name, label: s.name }))} />
        </Form.Item>
        <Form.Item label="Upload">
          <Upload
            name="logo"
            customRequest={options => {
              const { onSuccess, file, onProgress } = options
              const formData = new FormData()
              formData.append('file', file as File)
              formData.append('category', 'teacher')
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
