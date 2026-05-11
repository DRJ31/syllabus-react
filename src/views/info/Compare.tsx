import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Table, Breadcrumb, Skeleton, Input, Button, Typography, List,
  Row, Tooltip, Collapse, Col, Divider, Tag, App, Drawer, Badge,
} from 'antd'
import { PlusOutlined, MinusOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { TableColumnsType, CollapseProps } from 'antd'
import axios from 'axios'
import type { Syllabus, Pilo, Cilo, Assessment, TextBook } from '@/types'

const { Title, Paragraph, Text } = Typography

const panelStyle: React.CSSProperties = {
  background: '#f7f7f7',
  borderRadius: 8,
  marginBottom: 12,
  border: '1px solid #e8e8e8',
  overflow: 'hidden',
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
      arr.map(item => <Text key={item.pilo_id}>PILO{item.pilo_id} </Text>),
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
      arr.map(item => <Text key={item.cilo_id}>CILO{item.cilo_id} </Text>),
  },
  { title: 'Description', dataIndex: 'description' },
]

const textBookColumns: TableColumnsType<TextBook> = [
  { title: 'Title', dataIndex: 'title' },
  { title: 'Publish Year', dataIndex: 'year' },
  { title: 'Author(s)', dataIndex: 'author' },
]

const courseColumns: TableColumnsType<Syllabus> = [
  { title: 'Course Title', dataIndex: 'title' },
  { title: 'School', dataIndex: ['school', 'name'] },
]

const defaultActiveKeys = Array.from({ length: 15 }, (_, i) => String(i + 1))

const searchWord = (keyword: string, origin: string) =>
  origin.toLowerCase().includes(keyword.toLowerCase())

function CompareTablePanel(cols: TableColumnsType<never>, field: keyof Syllabus, rowKey: string, compare: Syllabus[]) {
  return (
    <>
      <Title level={4}>{compare[0].title}, {compare[0].school.name}</Title>
      <Table columns={cols} dataSource={(compare[0][field] as never[]) ?? []} style={{ background: '#fff', marginBottom: 10 }} rowKey={rowKey} />
      <Divider />
      <Title level={4}>{compare[1].title}, {compare[1].school.name}</Title>
      <Table columns={cols} dataSource={(compare[1][field] as never[]) ?? []} style={{ background: '#fff' }} rowKey={rowKey} />
    </>
  )
}

export default function Compare() {
  const { message } = App.useApp()
  const [data, setData] = useState<Syllabus[]>([])
  const [results, setResults] = useState<Syllabus[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingBtn, setLoadingBtn] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [realCompare, setRealCompare] = useState<number[]>([])
  const [compare, setCompare] = useState<Syllabus[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [courseKeyword, setCourseKeyword] = useState('')
  const [schoolKeyword, setSchoolKeyword] = useState('')

  useEffect(() => {
    axios.get('/api/syllabuses').then(rsp => {
      setData(rsp.data.syllabuses)
      setResults(rsp.data.syllabuses)
      setLoading(false)
    })
  }, [])

  const handleSearch = () => {
    if (!courseKeyword && !schoolKeyword) return
    setResults(data.filter(item => {
      const matchCourse = !courseKeyword || searchWord(courseKeyword, item.title)
      const matchSchool = !schoolKeyword || searchWord(schoolKeyword, item.school.name)
      return matchCourse && matchSchool
    }))
  }

  const handleClear = () => {
    setCourseKeyword('')
    setSchoolKeyword('')
    setResults(data)
  }

  const handleCompare = async () => {
    if (realCompare.length !== 2) return
    setLoadingBtn(true)
    const [rsp1, rsp2] = await Promise.all([
      axios.get('/api/syllabus', { params: { id: realCompare[0] } }),
      axios.get('/api/syllabus', { params: { id: realCompare[1] } }),
    ])
    setCompare([rsp1.data.syllabus, rsp2.data.syllabus])
    setCompareOpen(true)
    setLoadingBtn(false)
  }

  const onSelectChange = (keys: number[]) => {
    setSelectedRowKeys(keys)
    setRealCompare(prev => prev.filter(id => keys.includes(id)))
  }

  const toggleRealCompare = (id: number) => {
    setRealCompare(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length === 2) { message.warning('You can only choose 2 syllabuses to compare.'); return prev }
      return [...prev, id]
    })
  }

  const removeFromSelected = (id: number) => {
    setSelectedRowKeys(prev => prev.filter(x => x !== id))
    setRealCompare(prev => prev.filter(x => x !== id))
  }

  const findItem = (id: number) => data.find(item => item.id === id)

  const collapseItems: CollapseProps['items'] = compare.length !== 2 ? [] : [
    {
      key: '1', label: 'School Name', style: panelStyle,
      children: <Row><Col span={12}>{compare[0].school.name}</Col><Col span={12}>{compare[1].school.name}</Col></Row>,
    },
    {
      key: '2', label: 'Course Code', style: panelStyle,
      children: <Row><Col span={12}>{compare[0].code}</Col><Col span={12}>{compare[1].code}</Col></Row>,
    },
    {
      key: '3', label: 'Course Title', style: panelStyle,
      children: <Row><Col span={12}>{compare[0].title}</Col><Col span={12}>{compare[1].title}</Col></Row>,
    },
    {
      key: '4', label: 'Course Unit', style: panelStyle,
      children: <Row><Col span={12}>{compare[0].unit}</Col><Col span={12}>{compare[1].unit}</Col></Row>,
    },
    {
      key: '5', label: 'Contact hours', style: panelStyle,
      children: <Row><Col span={12}>{compare[0].hours}</Col><Col span={12}>{compare[1].hours}</Col></Row>,
    },
    {
      key: '6', label: 'Offer Unit', style: panelStyle,
      children: <Row><Col span={12}>{compare[0].offer_unit}</Col><Col span={12}>{compare[1].offer_unit}</Col></Row>,
    },
    {
      key: '7', label: 'Prepared by', style: panelStyle,
      children: <Row><Col span={12}>{compare[0].prepare}</Col><Col span={12}>{compare[1].prepare}</Col></Row>,
    },
    {
      key: '8', label: 'Reviewed by', style: panelStyle,
      children: <Row><Col span={12}>{compare[0].review}</Col><Col span={12}>{compare[1].review}</Col></Row>,
    },
    {
      key: '9', label: 'Aims & Objectives', style: panelStyle,
      children: <Row><Col span={12}>{compare[0].aim}</Col><Col span={12}>{compare[1].aim}</Col></Row>,
    },
    {
      key: '10', label: 'Course Contents', style: panelStyle,
      children: (
        <>
          {[0, 1].map(i => (
            <div key={i}>
              {i === 1 && <Divider />}
              <Title level={3}>{compare[i].title}, {compare[i].school.name}</Title>
              {(compare[i].contents ?? []).map(content => (
                <div key={content.content_id}>
                  <Title level={4}>{content.content_id}. {content.title}</Title>
                  <Text mark><ClockCircleOutlined /> {content.hours} hrs</Text>
                  <Paragraph>{content.content}</Paragraph>
                </div>
              ))}
            </div>
          ))}
        </>
      ),
    },
    {
      key: '11', label: 'Programme Intended Learning Outcomes(PILOs)', style: panelStyle,
      children: CompareTablePanel(piloColumns as TableColumnsType<never>, 'pilos', 'pilo_id', compare),
    },
    {
      key: '12', label: 'CILOs-PILOs Mapping Matrix', style: panelStyle,
      children: CompareTablePanel(ciloColumns as TableColumnsType<never>, 'cilos', 'id', compare),
    },
    {
      key: '13', label: 'Teaching & Learning Activities', style: panelStyle,
      children: CompareTablePanel(tlaColumns as TableColumnsType<never>, 'cilos', 'id', compare),
    },
    {
      key: '14', label: 'Assessment Methods', style: panelStyle,
      children: CompareTablePanel(assessmentColumns as TableColumnsType<never>, 'assessments', 'method', compare),
    },
    {
      key: '15', label: 'Textbooks/Recommended Readings', style: panelStyle,
      children: CompareTablePanel(textBookColumns as TableColumnsType<never>, 'textBooks', 'id', compare),
    },
  ]

  return (
    <div style={{ padding: 20 }}>
      <Skeleton active loading={loading}>
        <Breadcrumb items={[
          { title: <Link to="/">Home</Link> },
          { title: 'Compare' },
        ]} />
        <Input
          placeholder="Course" allowClear value={courseKeyword}
          onChange={e => setCourseKeyword(e.target.value)}
          style={{ marginTop: 10 }}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
        />
        <Input
          placeholder="School" allowClear value={schoolKeyword}
          onChange={e => setSchoolKeyword(e.target.value)}
          style={{ marginTop: 10 }}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
        />
        <Row style={{ marginTop: 10, gap: 8 }}>
          <Button type="primary" onClick={handleSearch}>Search</Button>
          <Button onClick={handleClear}>Clear</Button>
        </Row>
        <Row style={{ marginTop: 10 }}>
          <Badge count={selectedRowKeys.length}>
            <Button onClick={() => setDrawerOpen(true)} type="primary">Selected</Button>
          </Badge>
        </Row>

        <Drawer
          title="Selected Syllabuses"
          size={window.screen.width > 500 ? 360 : window.screen.width - 20}
          closable={false}
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
        >
          <Drawer
            title="Compare"
            size={window.screen.width > 500 ? 500 : window.screen.width - 20}
            closable={false}
            onClose={() => setCompareOpen(false)}
            open={compareOpen}
          >
            {compare.length === 2 && (
              <Collapse bordered={false} defaultActiveKey={defaultActiveKeys} items={collapseItems} style={{ background: 'transparent' }} />
            )}
          </Drawer>

          <Row style={{ marginBottom: 20, gap: 8, flexWrap: 'wrap' }}>
            {realCompare.map(id => {
              const item = findItem(id)
              if (!item) return null
              return (
                <Tag key={id} closable onClose={e => { e.preventDefault(); setRealCompare(prev => prev.filter(x => x !== id)) }} style={{ whiteSpace: 'normal', maxWidth: '100%' }}>
                  {item.title}, {item.school.name}
                </Tag>
              )
            })}
          </Row>
          <Row style={{ marginBottom: 20 }}>
            <Tooltip title="Select 2 syllabuses to compare">
              <Button type="primary" loading={loadingBtn} onClick={handleCompare} disabled={realCompare.length !== 2}>
                Compare
              </Button>
            </Tooltip>
            <Tooltip title="Clear your selections">
              <Button style={{ marginLeft: 10 }} onClick={() => { setSelectedRowKeys([]); setRealCompare([]) }}>Clear</Button>
            </Tooltip>
          </Row>
          <List
            itemLayout="horizontal"
            dataSource={selectedRowKeys}
            renderItem={id => {
              const item = findItem(id)
              if (!item) return null
              return (
                <List.Item actions={[
                  <a key="toggle" onClick={() => toggleRealCompare(id)}>
                    {realCompare.includes(id) ? <MinusOutlined /> : <PlusOutlined />}
                  </a>,
                  <a key="remove" onClick={() => removeFromSelected(id)}><DeleteOutlined /></a>,
                ]}>
                  <List.Item.Meta title={item.title} description={item.school.name} />
                </List.Item>
              )
            }}
          />
        </Drawer>

        <Table
          columns={courseColumns}
          dataSource={results}
          rowKey="id"
          style={{ marginTop: 20, background: '#fff' }}
          rowSelection={{
            selectedRowKeys,
            onChange: keys => onSelectChange(keys as number[]),
          }}
        />
      </Skeleton>
    </div>
  )
}
