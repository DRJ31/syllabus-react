import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Input, Table, Divider, Tooltip, Button, Row, Skeleton, Breadcrumb, message } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'
import axios from 'axios'
import Swal from 'sweetalert2'
import { UserInfo } from '@/utils/auth'
import type { Audit } from '@/types'

const { Search } = Input

const searchWord = (keyword: string, origin: string) =>
  origin.toLowerCase().includes(keyword.toLowerCase())

export default function AuditTeacher() {
  const [data, setData] = useState<Audit[]>([])
  const [results, setResults] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])

  useEffect(() => {
    const session = new UserInfo().getUserInfo()
    if (!session || session === -1) return
    axios.post('/api/audit/teachers', { token: session.token }).then(rsp => {
      setData(rsp.data.audits)
      setResults(rsp.data.audits)
      setLoading(false)
    })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setKeyword(val)
    if (!val) setResults(data)
  }

  const handleSearch = () => {
    if (!keyword) return
    setResults(data.filter(item => searchWord(keyword, item.school_name)))
  }

  const removeFromList = (ids: number[]) => {
    setData(prev => prev.filter(item => !ids.includes(item.id)))
    setResults(prev => prev.filter(item => !ids.includes(item.id)))
    setSelectedRowKeys([])
  }

  const approveOne = (id: number) => {
    const item = data.find(d => d.id === id)
    if (!item) return
    Swal.fire({
      title: 'Are you sure?',
      text: `You are trying to approve ${item.user?.name}(${item.school_name})`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Approve',
      showLoaderOnConfirm: true,
      preConfirm: () => axios.put('/api/audit/teacher', null, { params: { id } }),
    }).then(result => {
      if (result.isConfirmed) {
        removeFromList([id])
        message.success(`Successfully approved ${item.user?.name}(${item.school_name})`)
        if (data.length === 1) setTimeout(() => window.location.reload(), 1000)
      }
    })
  }

  const declineOne = (id: number) => {
    const item = data.find(d => d.id === id)
    if (!item) return
    Swal.fire({
      title: 'Are you sure?',
      text: `You are trying to decline ${item.user?.name}(${item.school_name})`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Decline',
      showLoaderOnConfirm: true,
      preConfirm: () => axios.delete('/api/audit/teacher', { params: { id } }),
    }).then(result => {
      if (result.isConfirmed) {
        removeFromList([id])
        message.success(`Successfully declined ${item.user?.name}(${item.school_name})`)
        if (data.length === 1) setTimeout(() => window.location.reload(), 1000)
      }
    })
  }

  const selectedWords = () =>
    data.filter(item => selectedRowKeys.includes(item.id)).map(item => `${item.user?.name}(${item.school_name})`).join(', ')

  const columns: TableColumnsType<Audit> = [
    {
      title: 'Name', dataIndex: ['user', 'name'],
      render: (text: string, record) => (
        <a onClick={() => Swal.fire({
          icon: 'info', title: text,
          html: `<p>School: ${record.school_name}</p>`,
          footer: `<a href="/static/application/${record.description}">Download description file</a>`,
        })}>{text}</a>
      ),
    },
    { title: 'School', dataIndex: 'school_name' },
    {
      title: 'Action',
      render: (_, record) => (
        <span>
          <Tooltip title="Approve"><a onClick={() => approveOne(record.id)}><CheckCircleOutlined /></a></Tooltip>
          <Divider type="vertical" />
          <Tooltip title="Decline"><a onClick={() => declineOne(record.id)}><CloseCircleOutlined /></a></Tooltip>
        </span>
      ),
    },
  ]

  return (
    <Skeleton active loading={loading}>
      <Breadcrumb items={[
        { title: <Link to="/">Home</Link> },
        { title: <Link to="/management">Management</Link> },
        { title: <Link to="/management/user">Teacher Management</Link> },
        { title: 'Teacher Audit' },
      ]} />
      <Search placeholder="Search" onSearch={handleSearch} onChange={handleChange} allowClear style={{ marginTop: 10 }} />
      <Row style={{ marginTop: 10, gap: 8 }}>
        <Button type="primary" disabled={selectedRowKeys.length === 0} onClick={() => {
          Swal.fire({
            title: 'Are you sure?', text: `You are approving ${selectedWords()}`,
            icon: 'warning', showCancelButton: true, confirmButtonText: 'Approve', showLoaderOnConfirm: true,
            preConfirm: () => Promise.all(selectedRowKeys.map(id => axios.put('/api/audit/teacher', null, { params: { id } }))),
          }).then(result => {
            if (result.isConfirmed) {
              removeFromList(selectedRowKeys)
              message.success('Successfully approved selected teachers', 2)
              if (data.length <= selectedRowKeys.length) setTimeout(() => window.location.reload(), 1000)
            }
          })
        }}>Approve</Button>
        <Button danger disabled={selectedRowKeys.length === 0} onClick={() => {
          Swal.fire({
            title: 'Are you sure?', text: `You are declining ${selectedWords()}`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Decline', showLoaderOnConfirm: true,
            preConfirm: () => Promise.all(selectedRowKeys.map(id => axios.delete('/api/audit/teacher', { params: { id } }))),
          }).then(result => {
            if (result.isConfirmed) {
              removeFromList(selectedRowKeys)
              message.success('Successfully declined selected teachers', 2)
              if (data.length <= selectedRowKeys.length) setTimeout(() => window.location.reload(), 1000)
            }
          })
        }}>Decline</Button>
      </Row>
      <Table
        columns={columns} dataSource={results}
        rowSelection={{ selectedRowKeys, onChange: keys => setSelectedRowKeys(keys as number[]) }}
        rowKey="id" style={{ background: '#fff', marginTop: 20, overflowX: 'auto' }}
      />
    </Skeleton>
  )
}
