import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation, Routes, Route } from 'react-router-dom'
import {
  Layout,
  Menu,
  Avatar,
  Badge,
  Dropdown,
  Drawer,
  Button,
  Grid,
  App as AntdApp,
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
  MenuOutlined,
} from '@ant-design/icons'
import axios from 'axios'
import { UserInfo } from '@/utils/auth'
import type { User } from '@/types'

import Home from '@/views/Home'
import NotFound from '@/views/NotFound'
import All from '@/views/info/All'
import SearchPage from '@/views/info/SearchPage'
import SchoolDetail from '@/views/info/SchoolDetail'
import CourseDetail from '@/views/info/CourseDetail'
import Profile from '@/views/profile/Profile'
import Management from '@/views/management/Management'
import AuditTeacher from '@/views/management/user/AuditTeacher'
import AuditSchool from '@/views/management/school/AuditSchool'
import SchoolManagement from '@/views/management/school/SchoolManagement'
import UserManagement from '@/views/management/user/UserManagement'
import SyllabusManagement from '@/views/management/syllabus/SyllabusManagement'
import Login from '@/views/Login'
import Register from '@/views/Register'
import ForgetPassword from '@/views/ForgetPassword'
import ResetPassword from '@/views/ResetPassword'
import EditProfile from '@/views/profile/EditProfile'
import ChangePassword from '@/views/profile/ChangePassword'
import AddUser from '@/views/management/user/AddUser'
import NewTeacherForm from '@/views/management/user/NewTeacherForm'
import EditUser from '@/views/management/user/EditUser'
import NewSchoolForm from '@/views/management/school/NewSchoolForm'
import EditSchoolForm from '@/views/management/school/EditSchoolForm'
import Compare from '@/views/info/Compare'
import NewContentForm from '@/views/management/syllabus/NewContentForm'
import EditContentForm from '@/views/management/syllabus/EditContentForm'

const { Content, Sider, Header } = Layout

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [avatar, setAvatar] = useState('')
  const [dot, setDot] = useState(false)
  const [collapsed, setCollapsed] = useState(true)

  const navigate = useNavigate()
  const location = useLocation()
  const userInfo = new UserInfo()
  const { message } = AntdApp.useApp()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.lg

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

  const menuNode = (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      items={sideMenuItems}
      onClick={() => isMobile && setCollapsed(true)}
    />
  )

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setCollapsed(c => !c)}
          />
          <Link to="/" style={{ color: '#000', fontWeight: 600, fontSize: 18 }}>
            CS Syllabus Repo
          </Link>
        </div>
        <Dropdown menu={{ items: avatarMenuItems }} trigger={['click', 'hover']}>
          <Avatar icon={<UserOutlined />} src={avatar || undefined} style={{ cursor: 'pointer' }} />
        </Dropdown>
      </Header>

      <Layout style={{ overflow: 'hidden' }}>
        {isMobile ? (
          <Drawer
            placement="left"
            open={!collapsed}
            onClose={() => setCollapsed(true)}
            title="CS Syllabus Repo"
            styles={{ body: { padding: 0 } }}
            size={220}
          >
            {menuNode}
          </Drawer>
        ) : (
          <Sider
            theme="light"
            collapsed={collapsed}
            style={{ zIndex: 100, overflow: 'hidden' }}
          >
            {menuNode}
          </Sider>
        )}

        <Layout>
          <Content style={{ padding: 24, overflowY: 'auto', overflowX: 'hidden' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/school" element={<All />} />
              <Route path="/school/detail/:id" element={<SchoolDetail />} />
              <Route path="/course/detail/:id" element={<CourseDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/management" element={<Management />} />
              <Route path="/management/syllabus" element={<SyllabusManagement />} />
              <Route path="/management/user" element={<UserManagement />} />
              <Route path="/management/user/audit" element={<AuditTeacher />} />
              <Route path="/management/school" element={<SchoolManagement />} />
              <Route path="/management/school/audit" element={<AuditSchool />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forget" element={<ForgetPassword />} />
              <Route path="/reset/:token" element={<ResetPassword />} />
              <Route path="/profile/edit" element={<EditProfile />} />
              <Route path="/profile/password" element={<ChangePassword />} />
              <Route path="/management/user/add" element={<AddUser />} />
              <Route path="/management/user/new-teacher" element={<NewTeacherForm />} />
              <Route path="/management/user/edit" element={<EditUser />} />
              <Route path="/management/school/new" element={<NewSchoolForm />} />
              <Route path="/management/school/edit" element={<EditSchoolForm />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/management/syllabus/add" element={<NewContentForm />} />
              <Route path="/management/syllabus/edit" element={<EditContentForm />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}
