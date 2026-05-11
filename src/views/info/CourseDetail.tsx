import { useState, useEffect } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { Typography, Button, Tooltip, Breadcrumb, Table, Skeleton, message } from 'antd'
import { LoadingOutlined, StarOutlined, StarFilled, CopyOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'
import axios from 'axios'
import { UserInfo } from '@/utils/auth'
import type { Syllabus, Pilo, Cilo, Assessment, TextBook } from '@/types'

const { Title, Paragraph, Text } = Typography

function copyToClipboard(text: string, msg: string) {
  navigator.clipboard.writeText(text).then(() => message.success(msg))
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const referrer = (location.state as { referrer?: string } | null)?.referrer

  const [data, setData] = useState<Syllabus>({ id: 0, title: '', school: { id: 0, name: '', location: '' } })
  const [favorite, setFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [favLoading, setFavLoading] = useState(false)

  const userInfo = new UserInfo()

  const getPiloById = (piloId: number) =>
    data.pilos?.find(p => p.id === piloId)?.pilo_id

  const getCiloById = (ciloId: number) =>
    data.cilos?.find(c => c.id === ciloId)?.cilo_id

  useEffect(() => {
    const session = userInfo.getUserInfo()
    axios.get('/api/syllabus', { params: { id } }).then(rsp => {
      setData(rsp.data.syllabus)
      if (session && session !== -1) {
        axios.post('/api/token', { token: session.token }).then(res => {
          axios.get('/api/favorite/syllabus', { params: { user_id: res.data.user.id } }).then(r => {
            setFavorite(r.data.syllabuses.some((s: { id: number }) => s.id === rsp.data.syllabus.id))
            setLoading(false)
          })
        })
      } else {
        setLoading(false)
      }
    })
  }, [id])

  const toggleFav = () => {
    const session = userInfo.getUserInfo()
    if (!session || session === -1) { message.warning('Please login to add to favorite!'); return }
    setFavLoading(true)
    axios.post('/api/favorite', { token: session.token, syllabus_id: data.id, school_id: 0 }).then(rsp => {
      setFavLoading(false)
      if (rsp.data.status) {
        setFavorite(true)
        message.success(`Added ${data.title}(${data.school.name}) to favorite!`)
      } else {
        axios.delete('/api/favorite', { data: { token: session.token, syllabus_id: data.id, school_id: 0 } }).then(() => {
          setFavorite(false)
          message.warning('You have removed this syllabus from favorite')
        })
      }
    })
  }

  const BreadcrumbMiddle = () => {
    if (!referrer) return null
    const path = referrer.split('/')[1]
    if (path === 'school') return (
      <Breadcrumb.Item>
        <Link to={`/school/detail/${data.school.id}`} state={{ referrer: location.pathname }}>{data.school.name}</Link>
      </Breadcrumb.Item>
    )
    if (path === 'profile') return <Breadcrumb.Item><Link to="/profile">Profile</Link></Breadcrumb.Item>
    if (path === 'management') return (
      <>
        <Breadcrumb.Item><Link to="/management">Management</Link></Breadcrumb.Item>
        <Breadcrumb.Item><Link to="/management/syllabus">Syllabus Management</Link></Breadcrumb.Item>
      </>
    )
    return <Breadcrumb.Item><Link to="/search">Search Syllabus</Link></Breadcrumb.Item>
  }

  const piloColumns: TableColumnsType<Pilo> = [
    { title: 'PILO', dataIndex: 'pilo_id', render: (t: number) => `PILO${t}` },
    { title: 'PILO Content', dataIndex: 'content' },
  ]

  const ciloColumns: TableColumnsType<Cilo> = [
    { title: 'CILO', dataIndex: 'cilo_id', render: (t: number) => `CILO${t}` },
    { title: 'Content', dataIndex: 'content' },
    {
      title: 'PILO(s) to be addressed',
      dataIndex: 'pilo_cilos',
      render: (arr: Array<{ pilo_id: number }>) =>
        arr.map(item => <Text key={getPiloById(item.pilo_id)}>PILO{getPiloById(item.pilo_id)} </Text>),
    },
  ]

  const tlaColumns: TableColumnsType<Cilo> = [
    { title: 'CILO No.', dataIndex: 'cilo_id', render: (t: number) => `CILO${t}` },
    { title: 'TLAs', dataIndex: ['tla', 'content'] },
  ]

  const assessmentColumns: TableColumnsType<Assessment> = [
    { title: 'Assessment Method', dataIndex: 'method' },
    { title: 'Weighting', dataIndex: 'weighting', render: (t: number) => `${t}%` },
    {
      title: 'CILOs to be addressed',
      dataIndex: 'assessment_cilos',
      render: (arr: Array<{ cilo_id: number }>) =>
        arr.map(item => <Text key={getCiloById(item.cilo_id)}>CILO{getCiloById(item.cilo_id)} </Text>),
    },
    { title: 'Description', dataIndex: 'description' },
  ]

  const textBookColumns: TableColumnsType<TextBook> = [
    { title: 'Title', dataIndex: 'title' },
    { title: 'Publish Year', dataIndex: 'year' },
    { title: 'Author(s)', dataIndex: 'author' },
  ]

  return (
    <div style={{ background: '#fff', padding: 20 }}>
      <Skeleton active loading={loading}>
        <Breadcrumb>
          <Breadcrumb.Item><Link to="/">Home</Link></Breadcrumb.Item>
          <BreadcrumbMiddle />
          <Breadcrumb.Item>{data.title}, {data.school.name}</Breadcrumb.Item>
        </Breadcrumb>
        <Title>
          {data.code} {data.title},{' '}
          <Link to={`/school/detail/${data.school.id}`} state={{ referrer: location.pathname }}>{data.school.name}</Link>
        </Title>
        <div style={{ float: 'right' }}>
          <Tooltip title={favorite ? 'Remove from favorite' : 'Add to favorite'}>
            <Button style={{ marginRight: 10 }} onClick={toggleFav}>
              {favLoading ? <LoadingOutlined /> : favorite ? <StarFilled /> : <StarOutlined />}
            </Button>
          </Tooltip>
          <Tooltip title="Copy Link">
            <Button onClick={() => copyToClipboard(`https://syllabus.drjchn.com/course/detail/${data.id}`, 'Course detail link has copied!')}>
              <CopyOutlined />
            </Button>
          </Tooltip>
        </div>
        <Title level={3}>Unit</Title><Paragraph>{data.unit}</Paragraph>
        <Title level={3}>Contact Hours</Title><Paragraph>{data.hours}</Paragraph>
        <Title level={3}>Offer Unit</Title><Paragraph>{data.offer_unit}</Paragraph>
        <Title level={3}>Pre-Requisition</Title><Paragraph>{data.pre_req}</Paragraph>
        <Title level={3}>Co-Requisition</Title><Paragraph>{data.co_req}</Paragraph>
        <Title level={3}>Prepared by</Title><Paragraph>{data.prepare}</Paragraph>
        <Title level={3}>Reviewed by</Title><Paragraph>{data.review}</Paragraph>
        <Title level={3}>Aims & Objectives</Title><Paragraph>{data.aim}</Paragraph>
        <Title level={3}>Course Contents</Title>
        {(data.contents ?? []).map(content => (
          <div key={content.content_id}>
            <Title level={4}>{content.content_id}. {content.title}</Title>
            <Text mark><ClockCircleOutlined /> {content.hours} hrs</Text>
            <Paragraph>{content.content}</Paragraph>
          </div>
        ))}
        <Title level={3}>Programme Intended Learning Outcomes (PILOs)</Title>
        <Table columns={piloColumns} dataSource={data.pilos ?? []} rowKey="pilo_id" />
        <Title level={3}>CILOs-PILOs Mapping Matrix</Title>
        <Table columns={ciloColumns} dataSource={data.cilos ?? []} rowKey="id" />
        <Title level={3}>Teaching & Learning Activities</Title>
        <Table columns={tlaColumns} dataSource={data.cilos ?? []} rowKey="id" />
        <Title level={3}>Assessment Methods</Title>
        <Table columns={assessmentColumns} dataSource={data.assessments ?? []} style={{ overflowX: 'auto' }} rowKey="method" />
        <Title level={3}>Textbooks/Recommended Readings</Title>
        <Table columns={textBookColumns} dataSource={data.textBooks ?? []} rowKey="id" />
      </Skeleton>
    </div>
  )
}
