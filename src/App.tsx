import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation, Routes } from 'react-router-dom'
import {
  Layout,
  Menu,
  Avatar,
  Badge,
  Dropdown,
  message,
  type MenuProps,
} from 'antd'
import {
  HomeOutlined,
  SearchOutlined,
  BlockOutlined,
  UserOutlined,
  SettingOutlined,
  LoginOutlined,
  FormOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import axios from 'axios'
import { UserInfo } from '@/utils/auth'
import type { User } from '@/types'

const { Content, Sider, Header } = Layout

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [avatar, setAvatar] = useState('')
  const [dot, setDot] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const userInfo = new UserInfo()

  const fetchDot = useCallback(async (roleId: number, token: string) => {
    if (roleId === 1) {
      const res = await axios.get('/api/audits')
      setDot(res.data.audits.length > 0)
    } else if (roleId === 2) {
      const res = await axios.post('/api/audit/teachers', { token })
      setDot(res.data.audits.length > 0)
    }
  }, [])

  const validateSession = useCallback(async () => {
    const session = userInfo.getUserInfo()
    if (!session) {
      setUser(null)
      return
    }
    if (session === -1) {
      message.error('User session expired')
      setUser(null)
      setAvatar('')
      setDot(false)
      return
    }

    try {
      const res = await axios.post('/api/token', { token: session.token })
      if (res.data.user) {
        const u: User = { username: res.data.user.name, role_id: res.data.user.role.id }
        setUser(u)
        const avatarRes = await axios.post('/api/user/avatar', { token: session.token })
        if (avatarRes.data) setAvatar('/static/img/avatar/' + avatarRes.data)
        await fetchDot(u.role_id, session.token)
      } else {
        message.error('User authentication failed')
        window.localStorage.removeItem('userEncrypted')
        setUser(null)
        setAvatar('')
        setDot(false)
        navigate('/')
      }
    } catch {
      // network error — keep current state
    }
  }, [fetchDot, navigate])

  useEffect(() => {
    validateSession()
  }, [location.pathname])

  const handleLogout = async () => {
    const session = userInfo.getUserInfo()
    if (!session || session === -1) return
    const res = await axios.post('/api/logout', { token: session.token })
    if (res.data) {
      window.localStorage.removeItem('userEncrypted')
      setUser(null)
      setAvatar('')
      message.success('Logout succeeded')
      setTimeout(() => navigate('/'), 500)
    }
  }

  const avatarMenuItems: MenuProps['items'] = user
    ? [
        { key: 'name', label: <strong>{user.username}</strong>, disabled: true },
        { key: 'profile', label: <Link to="/profile"><UserOutlined /> Profile</Link> },
        { key: 'logout', label: <span onClick={handleLogout}><LogoutOutlined /> Logout</span> },
      ]
    : [
        { key: 'login', label: <Link to="/login"><LoginOutlined /> Login</Link> },
        { key: 'register', label: <Link to="/register"><FormOutlined /> Register</Link> },
      ]

  const sideMenuItems: MenuProps['items'] = [
    { key: '/', label: <Link to="/">Home</Link>, icon: <HomeOutlined /> },
    { key: '/search', label: <Link to="/search">Search</Link>, icon: <SearchOutlined /> },
    { key: '/compare', label: <Link to="/compare">Compare</Link>, icon: <BlockOutlined /> },
    ...(user ? [{ key: '/profile', label: <Link to="/profile">Profile</Link>, icon: <UserOutlined /> }] : []),
    ...(user && user.role_id < 4
      ? [{
          key: '/management',
          label: <Link to="/management"><Badge dot={dot}>Management</Badge></Link>,
          icon: <SettingOutlined />,
        }]
      : []),
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <Link to="/" style={{ color: '#000', fontWeight: 600, fontSize: 18 }}>
          CS Syllabus Repo
        </Link>
        <Dropdown menu={{ items: avatarMenuItems }} trigger={['click', 'hover']}>
          <Avatar icon={<UserOutlined />} src={avatar} style={{ cursor: 'pointer' }} />
        </Dropdown>
      </Header>

      <Layout>
        <Sider
          breakpoint="lg"
          collapsedWidth={0}
          theme="light"
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{ zIndex: 100 }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={sideMenuItems}
          />
        </Sider>

        <Layout>
          <Content style={{ padding: 24, overflowX: 'hidden' }}>
            <Routes>
              {/* Routes will be added here as pages are migrated */}
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}
