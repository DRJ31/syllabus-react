import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumb, Typography, Skeleton, Badge } from 'antd'
import axios from 'axios'
import { UserInfo } from '@/utils/auth'
import type { User } from '@/types'

const { Title } = Typography

export default function Management() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [teacherDot, setTeacherDot] = useState(false)
  const [schoolDot, setSchoolDot] = useState(false)

  useEffect(() => {
    const session = new UserInfo().getUserInfo()
    if (!session || session === -1) return

    axios.post('/api/token', { token: session.token }).then(rsp => {
      const roleId = rsp.data.user.role.id
      const u: User = { username: rsp.data.user.name, role_id: roleId }
      setUser(u)

      if (roleId === 1) {
        axios.get('/api/audits').then(res => {
          setSchoolDot(res.data.audits.length > 0)
          setLoading(false)
        })
      } else if (roleId === 2) {
        axios.post('/api/audit/teachers', { token: session.token }).then(res => {
          setTeacherDot(res.data.audits.length > 0)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })
  }, [])

  return (
    <div style={{ background: '#fff', padding: 20 }}>
      <Skeleton loading={loading} active>
        <Breadcrumb items={[
          { title: <Link to="/">Home</Link> },
          { title: 'Management' },
        ]} />
        <Title level={2}>Management</Title>
        <Title level={4}><Link to="/management/syllabus">Syllabus Management</Link></Title>
        {user && user.role_id < 3 && (
          <Badge dot={teacherDot}>
            <Title level={4}><Link to="/management/user">User Management</Link></Title>
          </Badge>
        )}
        <br />
        {user && user.role_id < 2 && (
          <Badge dot={schoolDot}>
            <Title level={4}><Link to="/management/school">School Management</Link></Title>
          </Badge>
        )}
      </Skeleton>
    </div>
  )
}
