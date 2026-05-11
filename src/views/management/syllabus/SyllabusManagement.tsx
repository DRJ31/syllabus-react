import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Input, Table, Divider, Tooltip, Button, Row, Breadcrumb, message, Skeleton } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'
import axios from 'axios'
import Swal from 'sweetalert2'
import { UserInfo } from '@/utils/auth'
import type { Syllabus } from '@/types'

const searchWord = (keyword: string, origin: string) =>
  origin.toLowerCase().includes(keyword.toLowerCase())

export default function SyllabusManagement() {
  const location = useLocation()
  const [data, setData] = useState<Syllabus[]>([])
  const [results, setResults] = useState<Syllabus[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState({ course: '', school: '' })
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [roleId, setRoleId] = useState(4)

  const userInfo = new UserInfo()

  useEffect(() => {
    const session = userInfo.getUserInfo()
    if (!session || session === -1) return
    axios.post('/api/token', { token: session.token }).then(rsp => {
      setRoleId(rsp.data.user.role.id)
      axios.post('/api/syllabuses', { token: session.token }).then(r => {
        setData(r.data.syllabuses)
        setResults(r.data.syllabuses)
        setLoading(false)
      })
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

  const removeFromList = (ids: number[]) => {
    setData(prev => prev.filter(item => !ids.includes(item.id)))
    setResults(prev => prev.filter(item => !ids.includes(item.id)))
    setSelectedRowKeys([])
  }

  const deleteItem = (id: number) => {
    const item = data.find(s => s.id === id)
    if (!item) return
    Swal.fire({
      title: 'Are you sure?', text: `You are deleting ${item.title}(${item.school.name})`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Delete', showLoaderOnConfirm: true,
      preConfirm: () => axios.delete('/api/syllabus', { params: { id: item.id } }),
    }).then(result => {
      if (result.isConfirmed) {
        removeFromList([id])
        message.success(`Successfully deleted ${item.title}(${item.school.name})`)
      }
    })
  }

  const deleteItems = () =>
    Promise.all(selectedRowKeys.map(id => axios.delete('/api/syllabus', { params: { id } })))

  const deleteWords = () =>
    data.filter(item => selectedRowKeys.includes(item.id)).map(item => `${item.title}(${item.school.name})`).join(', ')

  const columns: TableColumnsType<Syllabus> = [
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
          {(roleId === 2 || roleId === 3) && (
            <>
              <Tooltip title="Edit">
                <Link to="/management/syllabus/edit" state={{ data: record }}><EditOutlined /></Link>
              </Tooltip>
              <Divider type="vertical" />
            </>
          )}
          <Tooltip title="Delete">
            <a onClick={() => deleteItem(record.id)}><DeleteOutlined /></a>
          </Tooltip>
        </span>
      ),
    },
  ]

  return (
    <Skeleton active loading={loading}>
      <Breadcrumb items={[
        { title: <Link to="/">Home</Link> },
        { title: <Link to="/management">Management</Link> },
        { title: 'Syllabus Management' },
      ]} />
      <Input
        placeholder="Course" allowClear value={keyword.course}
        onChange={e => setKeyword(k => ({ ...k, course: e.target.value }))}
        style={{ marginTop: 10 }} onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
      />
      <Input
        placeholder="School" allowClear value={keyword.school}
        onChange={e => setKeyword(k => ({ ...k, school: e.target.value }))}
        style={{ marginTop: 10 }} onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
      />
      <Row style={{ marginTop: 10, marginRight: 10 }}>
        <Button type="primary" style={{ float: 'right' }} onClick={handleSearch}>Search</Button>
        <Button style={{ float: 'right', marginRight: 20 }} onClick={handleClear}>Clear</Button>
      </Row>
      <Row style={{ marginTop: 10, gap: 8 }}>
        {(roleId === 2 || roleId === 3) && (
          <Link to="/management/syllabus/add"><Button type="primary">New Syllabus</Button></Link>
        )}
        <Button danger disabled={selectedRowKeys.length === 0} onClick={() => {
          Swal.fire({
            title: 'Are you sure?', text: `You are deleting ${deleteWords()}`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Delete', showLoaderOnConfirm: true,
            preConfirm: () => deleteItems(),
          }).then(result => {
            if (result.isConfirmed) {
              removeFromList(selectedRowKeys)
              message.success('Successfully deleted', 2)
            }
          })
        }}>Delete</Button>
      </Row>
      <Table
        columns={columns} dataSource={results}
        rowSelection={{ selectedRowKeys, onChange: keys => setSelectedRowKeys(keys as number[]) }}
        rowKey="id" style={{ background: '#fff', marginTop: 20 }}
      />
    </Skeleton>
  )
}
