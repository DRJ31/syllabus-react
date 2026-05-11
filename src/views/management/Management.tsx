import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumb, Typography, Skeleton, Card, Row, Col, Statistic, Divider } from 'antd'
import { FileTextOutlined, TeamOutlined, BankOutlined, RightOutlined, ClockCircleOutlined } from '@ant-design/icons'
import axios from 'axios'
import { UserInfo } from '@/utils/auth'
import type { User } from '@/types'

const { Title, Text } = Typography

export default function Management() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [teacherAudits, setTeacherAudits] = useState(0)
  const [schoolAudits, setSchoolAudits] = useState(0)

  useEffect(() => {
    const session = new UserInfo().getUserInfo()
    if (!session || session === -1) return

    axios.post('/api/token', { token: session.token }).then(rsp => {
      const roleId = rsp.data.user.role.id
      setUser({ username: rsp.data.user.name, role_id: roleId })

      if (roleId === 1) {
        axios.get('/api/audits').then(res => {
          setSchoolAudits(res.data.audits.length)
          setLoading(false)
        })
      } else if (roleId === 2) {
        axios.post('/api/audit/teachers', { token: session.token }).then(res => {
          setTeacherAudits(res.data.audits.length)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })
  }, [])

  const hasPending = teacherAudits > 0 || schoolAudits > 0

  return (
    <Skeleton loading={loading} active>
      <Breadcrumb items={[
        { title: <Link to="/">Home</Link> },
        { title: 'Management' },
      ]} />
      <Title level={2} style={{ marginTop: 16 }}>Management</Title>

      {user && hasPending && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 8 }}>
            {teacherAudits > 0 && (
              <Col xs={24} sm={12} md={8}>
                <Card>
                  <Statistic
                    title="Pending Teacher Audits"
                    value={teacherAudits}
                    prefix={<ClockCircleOutlined />}
                    styles={{ content: { color: '#faad14' } }}
                  />
                </Card>
              </Col>
            )}
            {schoolAudits > 0 && (
              <Col xs={24} sm={12} md={8}>
                <Card>
                  <Statistic
                    title="Pending School Audits"
                    value={schoolAudits}
                    prefix={<ClockCircleOutlined />}
                    styles={{ content: { color: '#faad14' } }}
                  />
                </Card>
              </Col>
            )}
          </Row>
          <Divider />
        </>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Link to="/management/syllabus">
            <Card hoverable>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <FileTextOutlined style={{ fontSize: 28, color: '#1677ff' }} />
                <div style={{ flex: 1 }}>
                  <Text strong>Syllabus Management</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Manage course syllabuses</Text>
                </div>
                <RightOutlined style={{ color: '#bfbfbf' }} />
              </div>
            </Card>
          </Link>
        </Col>
        {user && user.role_id < 3 && (
          <Col xs={24} sm={12} md={8}>
            <Link to="/management/user">
              <Card hoverable>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <TeamOutlined style={{ fontSize: 28, color: '#1677ff' }} />
                  <div style={{ flex: 1 }}>
                    <Text strong>User Management</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>Manage users and teacher audits</Text>
                  </div>
                  <RightOutlined style={{ color: '#bfbfbf' }} />
                </div>
              </Card>
            </Link>
          </Col>
        )}
        {user && user.role_id < 2 && (
          <Col xs={24} sm={12} md={8}>
            <Link to="/management/school">
              <Card hoverable>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <BankOutlined style={{ fontSize: 28, color: '#1677ff' }} />
                  <div style={{ flex: 1 }}>
                    <Text strong>School Management</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>Manage school applications</Text>
                  </div>
                  <RightOutlined style={{ color: '#bfbfbf' }} />
                </div>
              </Card>
            </Link>
          </Col>
        )}
      </Row>
    </Skeleton>
  )
}
