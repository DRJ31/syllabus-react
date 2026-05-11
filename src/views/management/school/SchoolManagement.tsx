import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Input, Table, Divider, Tooltip, Button, Row, Badge, Breadcrumb, App, Skeleton } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'
import axios from 'axios'
import Swal from 'sweetalert2'
import type { School } from '@/types'

const { Search } = Input

const searchWord = (keyword: string, origin: string) =>
  origin.toLowerCase().includes(keyword.toLowerCase())

export default function SchoolManagement() {
  const { message } = App.useApp()
  const [data, setData] = useState<School[]>([])
  const [results, setResults] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [audits, setAudits] = useState(0)

  useEffect(() => {
    axios.get('/api/audits').then(rsp => {
      setAudits(rsp.data.audits.length)
      axios.get('/api/schools').then(r => {
        setData(r.data.schools)
        setResults(r.data.schools)
        setLoading(false)
      })
    })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setKeyword(val)
    if (!val) setResults(data)
  }

  const handleSearch = () => {
    if (!keyword) return
    setResults(data.filter(item => searchWord(keyword, item.name)))
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
      title: 'Are you sure?', text: `You are deleting ${item.name}(${item.location})`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Delete', showLoaderOnConfirm: true,
      preConfirm: () => axios.delete('/api/school', { params: { id: item.id } }).then(r => r.data.status).catch(() => {
        message.error('There are still users in the school, delete failed.')
      }),
    }).then(result => {
      if (result.isConfirmed && result.value) {
        removeFromList([id])
        message.success(`Successfully deleted ${item.name}(${item.location})`)
      }
    })
  }

  const deleteItems = () =>
    Promise.all(selectedRowKeys.map(id =>
      axios.delete('/api/school', { params: { id } }).catch(() => {
        message.error('There are still users in the school, delete failed.')
      })
    ))

  const selectedWords = () =>
    data.filter(item => selectedRowKeys.includes(item.id)).map(item => `${item.name}(${item.location})`).join(', ')

  const columns: TableColumnsType<School> = [
    {
      title: 'Name', dataIndex: 'name',
      render: (text: string, record) => <Link to={`/school/detail/${record.id}`} state={{ referrer: '/management/school' }}>{text}</Link>,
    },
    { title: 'Location', dataIndex: 'location' },
    {
      title: 'Action',
      render: (_, record) => (
        <span>
          <Divider type="vertical" />
          <Tooltip title="Delete"><a onClick={() => deleteItem(record.id)}><DeleteOutlined /></a></Tooltip>
        </span>
      ),
    },
  ]

  return (
    <Skeleton active loading={loading}>
      <Breadcrumb items={[
        { title: <Link to="/">Home</Link> },
        { title: <Link to="/management">Management</Link> },
        { title: 'School Management' },
      ]} />
      <Search placeholder="Search" onSearch={handleSearch} onChange={handleChange} allowClear style={{ marginTop: 10 }} />
      <Row style={{ marginTop: 10, gap: 8 }}>
        <Link to="/management/school/audit">
          <Badge count={audits} overflowCount={99}>
            <Button type="primary">Audit</Button>
          </Badge>
        </Link>
        <Button danger disabled={selectedRowKeys.length === 0} onClick={() => {
          Swal.fire({
            title: 'Are you sure?', text: `You are deleting ${selectedWords()}`,
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
        rowKey="id" style={{ background: '#fff', marginTop: 20, overflowX: 'auto' }}
      />
    </Skeleton>
  )
}
