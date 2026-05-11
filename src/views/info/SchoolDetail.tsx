import { useState, useEffect } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { Button, Tooltip, Typography, Breadcrumb, Table, Input, Skeleton, message } from 'antd'
import { LoadingOutlined, StarOutlined, StarFilled, CopyOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'
import axios from 'axios'
import { UserInfo } from '@/utils/auth'
import type { School, Syllabus } from '@/types'

const { Title, Paragraph } = Typography
const { Search } = Input

const searchWord = (keyword: string, origin: string) =>
  origin.toLowerCase().includes(keyword.toLowerCase())

function copyToClipboard(text: string, msg: string) {
  navigator.clipboard.writeText(text).then(() => message.success(msg))
}

function BreadcrumbMiddle({ referrer }: { referrer?: string }) {
  if (!referrer) return null
  const path = referrer.split('/')[1]
  if (path === 'profile') return <Breadcrumb.Item><Link to="/profile">Profile</Link></Breadcrumb.Item>
  if (path === 'management') return (
    <>
      <Breadcrumb.Item><Link to="/management">Management</Link></Breadcrumb.Item>
      <Breadcrumb.Item><Link to="/management/school">School Management</Link></Breadcrumb.Item>
    </>
  )
  return <Breadcrumb.Item><Link to="/school">School List</Link></Breadcrumb.Item>
}

export default function SchoolDetail() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const referrer = (location.state as { referrer?: string } | null)?.referrer

  const [data, setData] = useState<School>({ id: 0, name: '', location: '', syllabuses: [] })
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [favLoading, setFavLoading] = useState(false)
  const [favorite, setFavorite] = useState(false)

  const userInfo = new UserInfo()

  useEffect(() => {
    const session = userInfo.getUserInfo()
    axios.get('/api/school', { params: { id } }).then(rsp => {
      const school: School = rsp.data.school
      setData(school)
      setSyllabuses(school.syllabuses)
      if (session && session !== -1) {
        axios.post('/api/token', { token: session.token }).then(res => {
          axios.get('/api/favorite/school', { params: { user_id: res.data.user.id } }).then(r => {
            setFavorite(r.data.schools.some((s: { id: number }) => s.id === school.id))
            setLoading(false)
          })
        })
      } else {
        setLoading(false)
      }
    })
  }, [id])

  const handleSearch = () => {
    if (!keyword) return
    setSyllabuses(data.syllabuses.filter(s => searchWord(keyword, s.title)))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setKeyword(val)
    if (!val) setSyllabuses(data.syllabuses)
  }

  const toggleFav = () => {
    const session = userInfo.getUserInfo()
    if (!session || session === -1) { message.warning('Please login to add to favorite!'); return }
    setFavLoading(true)
    axios.post('/api/favorite', { token: session.token, syllabus_id: 0, school_id: data.id }).then(rsp => {
      setFavLoading(false)
      if (rsp.data.status) {
        setFavorite(true)
        message.success(`Added ${data.name}(${data.location}) to favorite!`)
      } else {
        axios.delete('/api/favorite', { data: { token: session.token, syllabus_id: 0, school_id: data.id } }).then(() => {
          setFavorite(false)
          message.warning('You have removed this school from favorite')
        })
      }
    })
  }

  const columns: TableColumnsType<Syllabus> = [
    {
      title: 'Syllabus',
      dataIndex: 'title',
      render: (text: string, record) => (
        <Link to={`/course/detail/${record.id}`} state={{ referrer: location.pathname }}>{text}</Link>
      ),
    },
  ]

  return (
    <Skeleton loading={loading} active>
      <div style={{ background: '#fff', padding: 20 }}>
        <Breadcrumb>
          <Breadcrumb.Item><Link to="/">Home</Link></Breadcrumb.Item>
          <BreadcrumbMiddle referrer={referrer} />
          <Breadcrumb.Item>{data.name}</Breadcrumb.Item>
        </Breadcrumb>
        <Title>{data.name}</Title>
        <div style={{ float: 'right' }}>
          <Tooltip title={favorite ? 'Remove from favorite' : 'Add to favorite'}>
            <Button style={{ marginRight: 10 }} onClick={toggleFav}>
              {favLoading ? <LoadingOutlined /> : favorite ? <StarFilled /> : <StarOutlined />}
            </Button>
          </Tooltip>
          <Tooltip title="Copy Link">
            <Button onClick={() => copyToClipboard(`https://syllabus.drjchn.com/school/detail/${data.id}`, 'School detail link has copied!')}>
              <CopyOutlined />
            </Button>
          </Tooltip>
        </div>
        <Title level={2}>Introduction</Title>
        <Paragraph>{data.introduction}</Paragraph>
        <Title level={2}>Course List</Title>
        <Search placeholder="Search" onChange={handleChange} onSearch={handleSearch} allowClear />
        <Table columns={columns} dataSource={syllabuses} rowKey="id" style={{ background: '#fff', marginTop: 20 }} />
      </div>
    </Skeleton>
  )
}
