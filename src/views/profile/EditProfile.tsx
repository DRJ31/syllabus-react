import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Tooltip, Button, Typography, Skeleton, Select, Upload, App } from 'antd'
import { QuestionCircleOutlined, UploadOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import ImgCrop from 'antd-img-crop'
import axios from 'axios'
import { UserInfo } from '@/utils/auth'
import type { School } from '@/types'

const { Title } = Typography
const MAX_AVATAR_SIZE_MB = 10

export default function EditProfile() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(true)
  const [btnLoading, setBtnLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
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
    if (avatarUploading || fileList.some(file => file.status === 'uploading')) {
      message.warning('Please wait until avatar upload finishes.')
      return
    }
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

  const validateAvatarFile = (file: File) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('Avatar must be an image file.')
      return false
    }
    const isSmallEnough = file.size / 1024 / 1024 <= MAX_AVATAR_SIZE_MB
    if (!isSmallEnough) {
      message.error(`Avatar must be smaller than ${MAX_AVATAR_SIZE_MB}MB.`)
      return false
    }
    return true
  }

  const beforeAvatarCrop: UploadProps['beforeUpload'] = file => validateAvatarFile(file)

  const beforeAvatarUpload: UploadProps['beforeUpload'] = file => (
    validateAvatarFile(file) ? true : Upload.LIST_IGNORE
  )

  const onAvatarChange: UploadProps['onChange'] = info => {
    const nextFileList = info.fileList.slice(-1).map(file => {
      if (file.response?.url) {
        file.url = file.response.url
      }
      return file
    })
    setFileList(nextFileList)
  }

  const uploadAvatar: UploadProps['customRequest'] = options => {
    const { onSuccess, onError, file, onProgress } = options
    const session = userInfo.getUserInfo()
    if (!session || session === -1) {
      onError?.(new Error('User session expired'))
      return
    }
    const formData = new FormData()
    formData.append('file', file as File)
    formData.append('token', session.token)
    setAvatarUploading(true)
    axios.post('/api/user/avatar/upload', formData, {
      onUploadProgress: e => onProgress?.({ percent: e.total ? (e.loaded / e.total) * 100 : 0 }),
    }).then(rsp => {
      message.success('Avatar uploaded successfully.')
      onSuccess?.(rsp.data)
    }).catch(error => {
      message.error('Avatar upload failed.')
      onError?.(error)
    }).finally(() => {
      setAvatarUploading(false)
    })
  }

  return (
    <div style={{ background: '#fff', padding: 20 }}>
      <Skeleton active loading={loading}>
        <Title level={3}>Edit Profile</Title>
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item label="Upload">
            <ImgCrop
              aspect={1}
              beforeCrop={beforeAvatarCrop}
              cropShape="round"
              showGrid
              modalTitle="Crop Avatar"
              modalOk="OK"
              modalCancel="Cancel"
            >
              <Upload
                name="logo"
                beforeUpload={beforeAvatarUpload}
                customRequest={uploadAvatar}
                fileList={fileList}
                listType="picture"
                onChange={onAvatarChange}
              >
                <Button icon={<UploadOutlined />} loading={avatarUploading}>Upload Avatar</Button>
              </Upload>
            </ImgCrop>
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
          <Button type="primary" htmlType="submit" loading={btnLoading} disabled={avatarUploading}>Update</Button>
          <Button onClick={() => window.history.back()} disabled={avatarUploading} style={{ marginLeft: 20 }}>Cancel</Button>
        </Form>
      </Skeleton>
    </div>
  )
}
