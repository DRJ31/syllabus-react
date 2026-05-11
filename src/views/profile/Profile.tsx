import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Typography, Card, Tabs, Tooltip, Divider, Table, Breadcrumb, Tag, message, Skeleton, Avatar } from 'antd'
import { UserOutlined, StarFilled, CopyOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'
import axios from 'axios'
import Swal from 'sweetalert2'
import { UserInfo } from '@/utils/auth'
import type { ProfileUser, School, Syllabus } from '@/types'

const { Title } = Typography

const roles = [
  { name: 'Admin', color: 'red' },
  { name: 'School', color: 'gold' },
  { name: 'Teacher', color: 'blue' },
  { name: 'User', color: 'green' },
]

const nullUser: ProfileUser = { id: null, username: null, email: null, role_id: 4, school: null }

function copyToClipboard(text: string, msg: string) {
  navigator.clipboard.writeText(text).then(() => message.success(msg))
}

export default function Profile() {
  const location = useLocation()
  const [user, setUser] = useState<ProfileUser>(nullUser)
  const [courses, setCourses] = useState<Syllabus[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [school, setSchool] = useState<School | null>(null)
  const [avatar, setAvatar] = useState('')

  const userInfo = new UserInfo()

  useEffect(() => {
    const session = userInfo.getUserInfo()
    if (!session) { setUser(nullUser); return }
    if (session === -1) { message.error('User session expired'); setUser(nullUser); return }

    axios.post('/api/token', { token: session.token }).then(rsp => {
      if (!rsp.data.user) {
        message.error('User Authentication failed')
        window.localStorage.removeItem('userEncrypted')
        setUser(nullUser)
        return
      }
      const u: ProfileUser = {
        id: rsp.data.user.id,
        email: rsp.data.user.email,
        username: rsp.data.user.name,
        role_id: rsp.data.user.role.id,
        school: rsp.data.user.school,
      }
      setUser(u)

      axios.post('/api/user/avatar', { token: session.token }).then(res => {
        if (res.data) setAvatar('/static/img/avatar/' + res.data)
      })

      if (u.role_id === 2 && u.school) {
        axios.get('/api/school', { params: { id: u.school.id } }).then(r => setSchool(r.data.school))
      }

      axios.get('/api/favorite/syllabus', { params: { user_id: u.id } }).then(r => {
        setCourses(r.data.syllabuses)
        setLoading(false)
      })
      axios.get('/api/favorite/school', { params: { user_id: u.id } }).then(r => {
        setSchools(r.data.schools)
      })
    })
  }, [])

  const removeFavCourse = (id: number) => {
    const item = courses.find(c => c.id === id)
    if (!item) return
    Swal.fire({
      title: 'Are you sure?',
      text: `You are removing ${item.title}(${item.school.name})`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Remove',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        const session = userInfo.getUserInfo()
        if (!session || session === -1) return
        return axios.delete('/api/favorite', { data: { token: session.token, syllabus_id: id, school_id: 0 } })
      },
    }).then(result => {
      if (result.isConfirmed) {
        setCourses(prev => prev.filter(c => c.id !== id))
        message.success(`Removed ${item.title}(${item.school.name}) from favorite!`)
      }
    })
  }

  const removeFavSchool = (id: number) => {
    const item = schools.find(s => s.id === id)
    if (!item) return
    Swal.fire({
      title: 'Are you sure?',
      text: `You are removing ${item.name}(${item.location})`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Remove',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        const session = userInfo.getUserInfo()
        if (!session || session === -1) return
        return axios.delete('/api/favorite', { data: { token: session.token, syllabus_id: 0, school_id: id } })
      },
    }).then(result => {
      if (result.isConfirmed) {
        setSchools(prev => prev.filter(s => s.id !== id))
        message.success(`Removed ${item.name}(${item.location}) from favorite!`)
      }
    })
  }

  const courseColumns: TableColumnsType<Syllabus> = [
    {
      title: 'Name', dataIndex: 'title',
      render: (text: string, record) => (
        <Link to={`/course/detail/${record.id}`} state={{ referrer: location.pathname }}>{text}</Link>
      ),
    },
    { title: 'School', dataIndex: ['school', 'name'] },
    {
      title: 'Action',
      render: (_, record) => (
        <span>
          <Tooltip title="Remove from favorite">
            <a onClick={() => removeFavCourse(record.id)}><StarFilled /></a>
          </Tooltip>
          <Divider type="vertical" />
          <Tooltip title="Copy Link">
            <a onClick={() => copyToClipboard(`https://syllabus.drjchn.com/course/detail/${record.id}`, 'Course detail link has copied!')}>
              <CopyOutlined />
            </a>
          </Tooltip>
        </span>
      ),
    },
  ]

  const schoolColumns: TableColumnsType<School> = [
    {
      title: 'Name', dataIndex: 'name',
      render: (text: string, record) => (
        <Link to={`/school/detail/${record.id}`} state={{ referrer: location.pathname }}>{text}</Link>
      ),
    },
    { title: 'Location', dataIndex: 'location' },
    {
      title: 'Action',
      render: (_, record) => (
        <span>
          <Tooltip title="Remove from favorite">
            <a onClick={() => removeFavSchool(record.id)}><StarFilled /></a>
          </Tooltip>
          <Divider type="vertical" />
          <Tooltip title="Copy Link">
            <a onClick={() => copyToClipboard(`https://syllabus.drjchn.com/school/detail/${record.id}`, 'School detail link has copied!')}>
              <CopyOutlined />
            </a>
          </Tooltip>
        </span>
      ),
    },
  ]

  const tabItems = [
    { key: '1', label: 'Course', children: <Table columns={courseColumns} dataSource={courses} rowKey="id" style={{ background: '#fff', marginTop: 20 }} /> },
    { key: '2', label: 'School', children: <Table columns={schoolColumns} dataSource={schools} rowKey="id" style={{ background: '#fff', marginTop: 20 }} /> },
  ]

  return (
    <div style={{ background: '#fff', padding: 20 }}>
      <Skeleton active loading={loading}>
        <Breadcrumb items={[
          { title: <Link to="/">Home</Link> },
          { title: 'Profile' },
        ]} />
        <Card title="User Details" extra={<Link to="/profile/edit">Edit Profile</Link>} style={{ marginTop: 20 }}>
          <Avatar icon={<UserOutlined />} src={avatar} size={100} style={{ marginBottom: 20 }} />
          <Title level={4}>Role</Title>
          <Tag color={roles[user.role_id - 1]?.color} style={{ marginBottom: 10 }}>
            {roles[user.role_id - 1]?.name}
          </Tag>
          <Title level={4}>Email</Title>
          <p>{user.email}</p>
          <Title level={4}>Username</Title>
          <p>{user.username}</p>
          <Title level={4}>School</Title>
          <p>{user.school ? user.school.name : 'None'}</p>
          <p><Link to="/profile/change_password"><strong>Change Password</strong></Link></p>
          {user.role_id === 2 && (
            <p><Link to="/profile/update_school" state={{ data: school }}><strong>Update School Profile</strong></Link></p>
          )}
          {user.role_id === 4 && (
            <p>
              Apply for <Link to="/profile/school">School Administrator</Link> / <Link to="/profile/teacher"> Teacher</Link>
            </p>
          )}
        </Card>
        <br />
        <Title level={3}>My Favorites</Title>
        <Tabs defaultActiveKey="1" items={tabItems} />
      </Skeleton>
    </div>
  )
}
