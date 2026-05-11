import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Input, Table, Tooltip, Breadcrumb, Button, Row, Skeleton, message, Divider, Space } from 'antd'
import { LoadingOutlined, StarOutlined, StarFilled, CopyOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'
import axios from 'axios'
import { UserInfo } from '@/utils/auth'
import type { Syllabus } from '@/types'

interface SyllabusRow extends Syllabus {
  loading: boolean
  favorite: boolean
}

const searchWord = (keyword: string, origin: string) =>
  origin.toLowerCase().includes(keyword.toLowerCase())

function copyToClipboard(text: string, msg: string) {
  navigator.clipboard.writeText(text).then(() => message.success(msg))
}

export default function SearchPage() {
  const location = useLocation()
  const [data, setData] = useState<SyllabusRow[]>([])
  const [results, setResults] = useState<SyllabusRow[]>([])
  const [keyword, setKeyword] = useState({ course: '', school: '' })
  const [loading, setLoading] = useState(true)
  const [favIds, setFavIds] = useState<number[]>([])

  const userInfo = new UserInfo()

  useEffect(() => {
    const session = userInfo.getUserInfo()
    axios.get('/api/syllabuses').then(rsp => {
      const rows: SyllabusRow[] = rsp.data.syllabuses.map((s: Syllabus) => ({ ...s, loading: false, favorite: false }))
      if (session && session !== -1) {
        axios.post('/api/token', { token: session.token }).then(res => {
          axios.get('/api/favorite/syllabus', { params: { user_id: res.data.user.id } }).then(r => {
            const ids: number[] = r.data.syllabuses.map((s: { id: number }) => s.id)
            setFavIds(ids)
            rows.forEach(row => { row.favorite = ids.includes(row.id) })
            setData(rows); setResults(rows); setLoading(false)
          })
        })
      } else {
        setData(rows); setResults(rows); setLoading(false)
      }
    })
  }, [])

  const handleSearch = () => {
    const { course, school } = keyword
    if (!course && !school) return
    setResults(data.filter(item => {
      const matchCourse = !course || searchWord(course, item.title)
      const matchSchool = !school || searchWord(school, item.school.name)
      return matchCourse && matchSchool
    }))
  }

  const handleClear = () => {
    setKeyword({ course: '', school: '' })
    setResults(data)
  }

  const toggleFav = (record: SyllabusRow) => {
    const session = userInfo.getUserInfo()
    if (!session || session === -1) { message.warning('Please login to add to favorite!'); return }
    setResults(prev => prev.map(r => r.id === record.id ? { ...r, loading: true } : r))
    axios.post('/api/favorite', { token: session.token, syllabus_id: record.id, school_id: 0 }).then(rsp => {
      if (rsp.data.status) {
        setFavIds(prev => [...prev, record.id])
        message.success(`Added ${record.title}(${record.school.name}) to favorite!`)
      } else {
        axios.delete('/api/favorite', { data: { token: session.token, syllabus_id: record.id, school_id: 0 } }).then(() => {
          setFavIds(prev => prev.filter(id => id !== record.id))
          message.success('You have removed this syllabus from favorite')
        })
      }
      setResults(prev => prev.map(r => r.id === record.id ? { ...r, loading: false, favorite: !record.favorite } : r))
      setData(prev => prev.map(r => r.id === record.id ? { ...r, favorite: !record.favorite } : r))
    })
  }

  const columns: TableColumnsType<SyllabusRow> = [
    {
      title: 'Name',
      dataIndex: 'title',
      render: (text: string, record) => (
        <Link to={`/course/detail/${record.id}`} state={{ referrer: location.pathname }}>{text}</Link>
      ),
    },
    { title: 'School', dataIndex: ['school', 'name'] },
    {
      title: 'Action',
      render: (_, record) => (
        <Space>
          <Tooltip title={favIds.includes(record.id) ? 'Remove from favorite' : 'Add to favorite'}>
            <a onClick={() => toggleFav(record)}>
              {record.loading ? <LoadingOutlined /> : favIds.includes(record.id) ? <StarFilled /> : <StarOutlined />}
            </a>
          </Tooltip>
          <Divider type="vertical" />
          <Tooltip title="Copy Link">
            <a onClick={() => copyToClipboard(`https://syllabus.drjchn.com/course/detail/${record.id}`, 'Course detail link has copied!')}>
              <CopyOutlined />
            </a>
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Skeleton active loading={loading}>
      <Breadcrumb items={[
        { title: <Link to="/">Home</Link> },
        { title: 'Search' },
      ]} />
      <Input
        placeholder="Course"
        allowClear
        style={{ marginTop: 10 }}
        value={keyword.course}
        onChange={e => setKeyword(k => ({ ...k, course: e.target.value }))}
        onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
      />
      <Input
        placeholder="School"
        allowClear
        style={{ marginTop: 10 }}
        value={keyword.school}
        onChange={e => setKeyword(k => ({ ...k, school: e.target.value }))}
        onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
      />
      <Row style={{ marginTop: 10, marginRight: 10 }}>
        <Button type="primary" style={{ float: 'right' }} onClick={handleSearch}>Search</Button>
        <Button style={{ float: 'right', marginRight: 20 }} onClick={handleClear}>Clear</Button>
      </Row>
      <Table columns={columns} dataSource={results} rowKey="id" style={{ background: '#fff', marginTop: 20 }} />
    </Skeleton>
  )
}
