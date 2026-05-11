import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Input, Table, Tooltip, Breadcrumb, Skeleton, message, Divider, Space } from 'antd'
import { LoadingOutlined, StarOutlined, StarFilled, CopyOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'
import axios from 'axios'
import { UserInfo } from '@/utils/auth'
import type { School } from '@/types'

const { Search } = Input

interface SchoolRow extends School {
  loading: boolean
  favorite: boolean
}

const searchWord = (keyword: string, origin: string) =>
  origin.toLowerCase().includes(keyword.toLowerCase())

function copyToClipboard(text: string, msg: string) {
  navigator.clipboard.writeText(text).then(() => message.success(msg))
}

export default function All() {
  const location = useLocation()
  const category = location.pathname.split('/')[1] === 'school' ? 'school' : 'course'

  const [data, setData] = useState<SchoolRow[]>([])
  const [results, setResults] = useState<SchoolRow[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [favIds, setFavIds] = useState<number[]>([])

  const userInfo = new UserInfo()

  useEffect(() => {
    const session = userInfo.getUserInfo()
    axios.get('/api/schools').then(rsp => {
      const rows: SchoolRow[] = rsp.data.schools.map((s: School) => ({ ...s, loading: false, favorite: false }))
      if (session && session !== -1) {
        axios.post('/api/token', { token: session.token }).then(res => {
          axios.get('/api/favorite/school', { params: { user_id: res.data.user.id } }).then(r => {
            const ids: number[] = r.data.schools.map((s: { id: number }) => s.id)
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
    if (!keyword) return
    setResults(data.filter(item => searchWord(keyword, item.name)))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setKeyword(val)
    if (!val) setResults(data)
  }

  const toggleFav = (record: SchoolRow) => {
    const session = userInfo.getUserInfo()
    if (!session || session === -1) { message.warning('Please login to add to favorite!'); return }
    setResults(prev => prev.map(r => r.id === record.id ? { ...r, loading: true } : r))
    axios.post('/api/favorite', { token: session.token, syllabus_id: 0, school_id: record.id }).then(rsp => {
      if (rsp.data.status) {
        setFavIds(prev => [...prev, record.id])
        message.success(`Added ${record.name}(${record.location}) to favorite!`)
      } else {
        axios.delete('/api/favorite', { data: { token: session.token, syllabus_id: 0, school_id: record.id } }).then(() => {
          setFavIds(prev => prev.filter(id => id !== record.id))
          message.success('You have removed this school from favorite')
        })
      }
      setResults(prev => prev.map(r => r.id === record.id ? { ...r, loading: false, favorite: !record.favorite } : r))
      setData(prev => prev.map(r => r.id === record.id ? { ...r, favorite: !record.favorite } : r))
    })
  }

  const columns: TableColumnsType<SchoolRow> = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (text: string, record) => (
        <Link to={`/school/detail/${record.id}`} state={{ referrer: location.pathname }}>{text}</Link>
      ),
    },
    { title: 'Location', dataIndex: 'location' },
    { title: 'Syllabuses', dataIndex: ['syllabuses', 'length'] },
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
            <a onClick={() => copyToClipboard(`https://syllabus.drjchn.com/school/detail/${record.id}`, 'School detail link has copied!')}>
              <CopyOutlined />
            </a>
          </Tooltip>
        </Space>
      ),
    },
  ]

  const label = category.charAt(0).toUpperCase() + category.slice(1)

  return (
    <Skeleton active loading={loading}>
      <Breadcrumb items={[
        { title: <Link to="/">Home</Link> },
        { title: `${label} List` },
      ]} />
      <Search
        placeholder="Search"
        onChange={handleChange}
        onSearch={handleSearch}
        allowClear
        style={{ marginTop: 10 }}
      />
      <Table columns={columns} dataSource={results} rowKey="id" style={{ background: '#fff', marginTop: 20, overflowX: 'auto' }} />
    </Skeleton>
  )
}
