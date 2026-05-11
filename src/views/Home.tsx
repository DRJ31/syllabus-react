import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, Row, Col, Typography, Skeleton, Divider, Tooltip, message } from 'antd'
import {
  BankOutlined, EnvironmentOutlined, FileTextOutlined,
  LoadingOutlined, StarOutlined, StarFilled, CopyOutlined,
} from '@ant-design/icons'
import axios from 'axios'
import { UserInfo } from '@/utils/auth'
import type { School, Syllabus } from '@/types'

const { Title } = Typography

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  const result: T[] = []
  for (let i = 0; i < Math.min(n, copy.length); i++) {
    const idx = Math.floor(Math.random() * copy.length)
    result.push(copy[idx])
    copy.splice(idx, 1)
  }
  return result
}

function copyToClipboard(text: string, successMsg: string) {
  navigator.clipboard.writeText(text).then(() => message.success(successMsg))
}

interface SectionTitleProps { title: string; href: string }
const SectionTitle = ({ title, href }: SectionTitleProps) => (
  <Row style={{ marginTop: 30 }}>
    <Col lg={3} md={5} xs={12} offset={1}>
      <Title level={2}>{title}</Title>
    </Col>
    <Col lg={{ span: 4, offset: 1 }} sm={3} xs={{ span: 12, offset: 1 }} style={{ paddingTop: 10, marginBottom: 20 }}>
      <Link to={href}>View All &gt;</Link>
    </Col>
  </Row>
)

interface InfoCardProps {
  title: string
  href: string
  info: React.ReactNode
  extra: React.ReactNode[]
}
const InfoCard = ({ title, href, info, extra }: InfoCardProps) => (
  <Col xs={24} md={12} lg={8} xxl={6}>
    <Card
      title={<Link to={href}>{title}</Link>}
      style={{ width: '80%', marginLeft: '10%', marginBottom: 20 }}
      extra={extra}
    >
      <Link to={href} style={{ color: '#000' }}>{info}</Link>
    </Card>
  </Col>
)

interface FavItem { id: number }

export default function Home() {
  const [courses, setCourses] = useState<Syllabus[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [favCourses, setFavCourses] = useState<FavItem[]>([])
  const [favSchools, setFavSchools] = useState<FavItem[]>([])
  const [courseLoading, setCourseLoading] = useState<boolean[]>(new Array(6).fill(false))
  const [schoolLoading, setSchoolLoading] = useState<boolean[]>(new Array(6).fill(false))

  const userInfo = new UserInfo()

  const isFav = (arr: FavItem[], id: number) => arr.some(f => f.id === id)

  useEffect(() => {
    const session = userInfo.getUserInfo()

    axios.get('/api/schools').then(rsp => {
      setSchools(pickRandom(rsp.data.schools, 6))
    })

    axios.get('/api/syllabuses').then(rsp => {
      setCourses(pickRandom(rsp.data.syllabuses, 6))
      if (session && session !== -1) {
        axios.post('/api/token', { token: session.token }).then(res => {
          const userId = res.data.user.id
          axios.get('/api/favorite/school', { params: { user_id: userId } }).then(r => setFavSchools(r.data.schools))
          axios.get('/api/favorite/syllabus', { params: { user_id: userId } }).then(r => {
            setFavCourses(r.data.syllabuses)
            setLoading(false)
          })
        })
      } else {
        setLoading(false)
      }
    })
  }, [])

  const toggleFavCourse = (c: Syllabus, index: number) => {
    const session = userInfo.getUserInfo()
    if (!session || session === -1) { message.warning('Please login to add to favorite!'); return }
    setCourseLoading(prev => { const n = [...prev]; n[index] = true; return n })
    axios.post('/api/favorite', { token: session.token, syllabus_id: c.id, school_id: 0 }).then(rsp => {
      if (rsp.data.status) {
        setFavCourses(prev => [...prev, c as FavItem])
        message.success(`Added ${c.title}(${c.school.name}) to favorite!`)
      } else {
        axios.delete('/api/favorite', { data: { token: session.token, syllabus_id: c.id, school_id: 0 } }).then(() => {
          setFavCourses(prev => prev.filter(f => f.id !== c.id))
          message.warning('You have removed this syllabus from favorite')
        })
      }
      setCourseLoading(prev => { const n = [...prev]; n[index] = false; return n })
    })
  }

  const toggleFavSchool = (s: School, index: number) => {
    const session = userInfo.getUserInfo()
    if (!session || session === -1) { message.warning('Please login to add to favorite!'); return }
    setSchoolLoading(prev => { const n = [...prev]; n[index] = true; return n })
    axios.post('/api/favorite', { token: session.token, syllabus_id: 0, school_id: s.id }).then(rsp => {
      if (rsp.data.status) {
        setFavSchools(prev => [...prev, s as unknown as FavItem])
        message.success(`Added ${s.name}(${s.location}) to favorite!`)
      } else {
        axios.delete('/api/favorite', { data: { token: session.token, syllabus_id: 0, school_id: s.id } }).then(() => {
          setFavSchools(prev => prev.filter(f => f.id !== s.id))
          message.warning('You have removed this school from favorite')
        })
      }
      setSchoolLoading(prev => { const n = [...prev]; n[index] = false; return n })
    })
  }

  return (
    <div>
      <Skeleton active loading={loading}>
        <SectionTitle href="/search" title="Course" />
        <Row>
          {courses.map((c, index) => (
            <InfoCard
              key={c.id}
              title={c.title}
              href={`/course/detail/${c.id}`}
              info={
                <div>
                  <p><BankOutlined /> {c.school.name}</p>
                  <p><EnvironmentOutlined /> {c.school.location}</p>
                </div>
              }
              extra={[
                <Tooltip key="fav" title={isFav(favCourses, c.id) ? 'Remove from favorite' : 'Add to favorite'}>
                  <a onClick={() => toggleFavCourse(c, index)}>
                    {courseLoading[index] ? <LoadingOutlined /> : isFav(favCourses, c.id) ? <StarFilled /> : <StarOutlined />}
                  </a>
                </Tooltip>,
                <Divider key="div" type="vertical" />,
                <Tooltip key="copy" title="Copy Link">
                  <a onClick={() => copyToClipboard(`https://syllabus.drjchn.com/course/detail/${c.id}`, 'Course detail link has copied!')}><CopyOutlined /></a>
                </Tooltip>,
              ]}
            />
          ))}
        </Row>
        <SectionTitle href="/school" title="School" />
        <Row>
          {schools.map((s, index) => (
            <InfoCard
              key={s.id}
              title={s.name}
              href={`/school/detail/${s.id}`}
              info={
                <div>
                  <p><FileTextOutlined /> {s.syllabuses.length} syllabuses</p>
                  <p><EnvironmentOutlined /> {s.location}</p>
                </div>
              }
              extra={[
                <Tooltip key="fav" title={isFav(favSchools, s.id) ? 'Remove from favorite' : 'Add to favorite'}>
                  <a onClick={() => toggleFavSchool(s, index)}>
                    {schoolLoading[index] ? <LoadingOutlined /> : isFav(favSchools, s.id) ? <StarFilled /> : <StarOutlined />}
                  </a>
                </Tooltip>,
                <Divider key="div" type="vertical" />,
                <Tooltip key="copy" title="Copy Link">
                  <a onClick={() => copyToClipboard(`https://syllabus.drjchn.com/school/detail/${s.id}`, 'School detail link has copied!')}><CopyOutlined /></a>
                </Tooltip>,
              ]}
            />
          ))}
        </Row>
      </Skeleton>
    </div>
  )
}
