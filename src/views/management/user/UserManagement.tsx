import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Input, Table, Tooltip, Button, Row, Typography, Breadcrumb, App, Skeleton, Badge } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'
import axios from 'axios'
import Swal from 'sweetalert2'
import { UserInfo } from '@/utils/auth'
import type { ApiUser } from '@/types'

const { Search } = Input
const { Text } = Typography

const roles = ['admin', 'school', 'teacher', 'user']

const searchWord = (keyword: string, origin: string) =>
  origin.toLowerCase().includes(keyword.toLowerCase())

export default function UserManagement() {
  const { message } = App.useApp()
  const [data, setData] = useState<ApiUser[]>([])
  const [results, setResults] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [roleId, setRoleId] = useState(4)
  const [audits, setAudits] = useState(0)

  const userInfo = new UserInfo()

  useEffect(() => {
    const session = userInfo.getUserInfo()
    if (!session || session === -1) return

    axios.post('/api/users', { token: session.token }).then(rsp => {
      setData(rsp.data.users)
      setResults(rsp.data.users)
      axios.post('/api/audit/teachers', { token: session.token }).then(r => {
        setAudits(r.data.audits.length)
        axios.post('/api/token', { token: session.token }).then(r2 => {
          if (r2.data.user) { setRoleId(r2.data.user.role.id); setLoading(false) }
        })
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
    setResults(data.filter(item => searchWord(keyword, item.name) || searchWord(keyword, item.email)))
  }

  const removeFromList = (ids: number[]) => {
    setData(prev => prev.filter(item => !ids.includes(item.id)))
    setResults(prev => prev.filter(item => !ids.includes(item.id)))
    setSelectedRowKeys([])
  }

  const deleteItem = (id: number) => {
    const item = data.find(u => u.id === id)
    if (!item) return
    Swal.fire({
      title: 'Are you sure?', text: `You are deleting ${item.name}(${item.email})`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Delete', showLoaderOnConfirm: true,
      preConfirm: () => axios.delete('/api/user', { params: { id: item.id } }).then(r => r.data.status).catch(() => {
        message.error('Error deleting user.')
      }),
    }).then(result => {
      if (result.isConfirmed && result.value) {
        removeFromList([id])
        message.success(`Successfully deleted ${item.name}(${item.email})`)
      }
    })
  }

  const changeItem = (id: number) => {
    const item = data.find(u => u.id === id)
    if (!item) return
    Swal.fire({
      title: 'Are you sure?', text: `You are removing ${item.name}(${item.email})`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Remove', showLoaderOnConfirm: true,
      preConfirm: () => axios.post('/api/user/update/teacher', { id: item.id, role_id: 4, email: item.email }).then(r => r.data.status),
    }).then(result => {
      if (result.isConfirmed && result.value) {
        removeFromList([id])
        message.success(`Successfully removed ${item.name}(${item.email})`)
      }
    })
  }

  const deleteItems = () =>
    Promise.all(selectedRowKeys.map(id => axios.delete('/api/user', { params: { id } }).catch(() => message.error('Error deleting user.'))))

  const changeItems = () =>
    Promise.all(selectedRowKeys.map(id => {
      const item = data.find(u => u.id === id)
      if (!item) return Promise.resolve()
      return axios.post('/api/user/update/teacher', { id: item.id, role_id: 4, email: item.email })
    }))

  const selectedWords = () =>
    data.filter(item => selectedRowKeys.includes(item.id)).map(item => `${item.name}(${item.email})`).join(', ')

  const columns: TableColumnsType<ApiUser> = [
    { title: 'Username', dataIndex: 'name' },
    { title: 'Role', dataIndex: ['role', 'id'], render: (id: number) => <Text>{roles[id - 1]}</Text> },
    { title: 'Email', dataIndex: 'email' },
    { title: 'School', dataIndex: ['school', 'name'], render: (txt: string) => txt || 'None' },
    {
      title: 'Action',
      render: (_, record) => (
        <Tooltip title="Delete">
          <a onClick={() => roleId === 2 ? changeItem(record.id) : deleteItem(record.id)}><DeleteOutlined /></a>
        </Tooltip>
      ),
    },
  ]

  return (
    <Skeleton loading={loading} active>
      <Breadcrumb items={[
        { title: <Link to="/">Home</Link> },
        { title: <Link to="/management">Management</Link> },
        { title: 'User Management' },
      ]} />
      <Search placeholder="Search" onSearch={handleSearch} onChange={handleChange} allowClear style={{ marginTop: 10 }} />
      <Row style={{ marginTop: 10, gap: 8 }}>
        {roleId === 2 && (
          <Link to="/management/user/audit">
            <Badge count={audits} overflowCount={99}><Button type="primary">Audit</Button></Badge>
          </Link>
        )}
        {roleId < 2 && <Link to="/management/user/add"><Button type="primary">Add User</Button></Link>}
        <Button danger disabled={selectedRowKeys.length === 0} onClick={() => {
          Swal.fire({
            title: 'Are you sure?', text: `You are ${roleId === 1 ? 'deleting' : 'removing'} ${selectedWords()}`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
            confirmButtonText: roleId === 1 ? 'Delete' : 'Remove', showLoaderOnConfirm: true,
            preConfirm: () => roleId === 1 ? deleteItems() : changeItems(),
          }).then(result => {
            if (result.isConfirmed) {
              removeFromList(selectedRowKeys)
              message.success(roleId === 1 ? 'Successfully deleted' : 'Successfully removed', 2)
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
