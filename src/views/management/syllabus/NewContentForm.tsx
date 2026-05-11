import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumb, Input, InputNumber, Form, Button, Select, Typography, App } from 'antd'
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import axios from 'axios'
import { UserInfo } from '@/utils/auth'

const { TextArea } = Input
const { Text } = Typography

interface FormValues {
  title: string
  code: string
  pre_req?: string
  co_req?: string
  unit: number
  hours: number
  offer_unit: string
  prepare: string
  review: string
  aim: string
  contents: Array<{ title: string; hours: number; content: string }>
  pilos: Array<{ content: string }>
  cilos: Array<{ content: string; pilo_ids: number[]; tla_content: string }>
  assessments: Array<{ method: string; weighting: number; cilo_ids: number[]; description: string }>
  textBooks: Array<{ title: string; year: number; author: string }>
}

const Bread = () => (
  <Breadcrumb items={[
    { title: <Link to="/">Home</Link> },
    { title: <Link to="/management">Management</Link> },
    { title: <Link to="/management/syllabus">Syllabus Management</Link> },
    { title: 'New' },
  ]} />
)

export default function NewContentForm() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [schoolId, setSchoolId] = useState(0)
  const [editorId, setEditorId] = useState(0)
  const [form] = Form.useForm<FormValues>()
  const navigate = useNavigate()
  const userInfo = new UserInfo()

  const piloList: Array<{ content: string }> = Form.useWatch('pilos', form) ?? []
  const ciloList: Array<{ content: string }> = Form.useWatch('cilos', form) ?? []

  useEffect(() => {
    const session = userInfo.getUserInfo()
    if (!session || session === -1) { navigate('/login'); return }
    axios.post('/api/token', { token: session.token }).then(rsp => {
      setSchoolId(rsp.data.user.school.id)
      setEditorId(rsp.data.user.id)
    })
  }, [])

  const onFinish = async (values: FormValues) => {
    setLoading(true)
    try {
      const syllabusRsp = await axios.post('/api/syllabus', {
        school_id: schoolId,
        code: values.code,
        title: values.title,
        prepare: values.prepare,
        review: values.review,
        unit: values.unit,
        hours: values.hours,
        pre_req: values.pre_req,
        co_req: values.co_req,
        offer_unit: values.offer_unit,
        aim: values.aim,
        editor_id: editorId,
      })
      const syllabusId: number = syllabusRsp.data.syllabus.id

      if (values.textBooks.length > 0) {
        axios.post('/api/textBook', {
          textBooks: values.textBooks.map(tb => ({ ...tb, syllabus_id: syllabusId })),
        })
      }

      if (values.contents.length > 0) {
        axios.post('/api/content', {
          contents: values.contents.map((c, i) => ({ ...c, content_id: i + 1, syllabus_id: syllabusId })),
        })
      }

      if (values.pilos.length > 0) {
        const piloRsp = await axios.post('/api/pilo', {
          pilos: values.pilos.map((p, i) => ({ content: p.content, pilo_id: i + 1, syllabus_id: syllabusId })),
        })
        const pilo_ids: number[] = piloRsp.data.ID

        const ciloRsp = await axios.post('/api/cilo', {
          cilos: values.cilos.map((c, i) => ({ content: c.content, cilo_id: i + 1, syllabus_id: syllabusId })),
        })
        const cilo_ids: number[] = ciloRsp.data.ID

        const piloCilos = values.cilos.flatMap((cilo, ciloIdx) =>
          cilo.pilo_ids.map(piloIdx => ({ pilo_id: pilo_ids[piloIdx], cilo_id: cilo_ids[ciloIdx] }))
        )
        axios.post('/api/pc', { piloCilos })

        const tlas = values.cilos.map((cilo, i) => ({ content: cilo.tla_content, cilo_id: cilo_ids[i] }))

        if (values.assessments.length > 0) {
          const assessRsp = await axios.post('/api/assessment', {
            assessments: values.assessments.map(a => ({
              method: a.method, weighting: a.weighting, description: a.description, syllabus_id: syllabusId,
            })),
          })
          const assessment_ids: number[] = assessRsp.data.ID
          const assessmentCilos = values.assessments.flatMap((assess, assessIdx) =>
            assess.cilo_ids.map(ciloIdx => ({ assessment_id: assessment_ids[assessIdx], cilo_id: cilo_ids[ciloIdx] }))
          )
          axios.post('/api/ac', { assessmentCilos })
        }

        await axios.post('/api/tla', { tlas })
      }

      message.success('New content added successfully!')
      navigate('/management/syllabus')
    } catch {
      message.error('Do not submit same syllabus twice.')
      setLoading(false)
    }
  }

  const piloOptions = piloList.map((_, i) => ({ value: i, label: `PILO${i + 1}` }))
  const ciloOptions = ciloList.map((_, i) => ({ value: i, label: `CILO${i + 1}` }))

  return (
    <div>
      <Bread />
      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        style={{ background: '#fff', margin: 10, padding: 20 }}
        initialValues={{ pre_req: 'Nil', co_req: 'Nil', contents: [{}], pilos: [{}], cilos: [{}], assessments: [{}], textBooks: [] }}
      >
        <Form.Item name="title" label="Course Title" rules={[{ required: true, message: 'Please input course title!' }]}>
          <Input placeholder="Course Title" />
        </Form.Item>
        <Form.Item name="code" label="Course Code" rules={[{ required: true, message: 'Please input course code!' }]}>
          <Input placeholder="Course Code" />
        </Form.Item>
        <Form.Item name="pre_req" label="Pre-Requisite">
          <Input placeholder="Pre-Requisite" />
        </Form.Item>
        <Form.Item name="co_req" label="Co-Requisite">
          <Input placeholder="Co-Requisite" />
        </Form.Item>
        <Form.Item name="unit" label="Number of Units" rules={[{ required: true, type: 'number', message: 'Please input unit of the course!' }]}>
          <InputNumber placeholder="Units" min={1} max={1000} />
        </Form.Item>
        <Form.Item name="hours" label="Contact Hours" rules={[{ required: true, type: 'number', message: 'Please input contact hours!' }]}>
          <InputNumber placeholder="Hours" min={1} max={10000} />
        </Form.Item>
        <Form.Item name="offer_unit" label="Offering Unit" rules={[{ required: true, message: 'Please input the department which provides the unit!' }]}>
          <Input placeholder="Offering Unit" />
        </Form.Item>
        <Form.Item name="prepare" label="Prepared by" rules={[{ required: true, message: 'Please input people who prepared the document!' }]}>
          <Input placeholder="Prepared by" />
        </Form.Item>
        <Form.Item name="review" label="Reviewed by" rules={[{ required: true, message: 'Please input people who reviewed the document!' }]}>
          <Input placeholder="Reviewed by" />
        </Form.Item>
        <Form.Item name="aim" label="Aims & Objectives" rules={[{ required: true, message: 'Please input aims and objectives of the course!' }]}>
          <TextArea autoSize placeholder="Aims & Objectives" />
        </Form.Item>

        {/* Course Contents */}
        <Form.List name="contents">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }, index) => (
                <Form.Item key={key} label={index === 0 ? 'Course Content' : ''} required={false}>
                  <Form.Item name={[name, 'title']} noStyle rules={[{ required: true, whitespace: true, message: 'Please input content title.' }]}>
                    <Input placeholder="Content Title" style={{ width: '70%', marginRight: 5 }} />
                  </Form.Item>
                  <Form.Item name={[name, 'hours']} noStyle rules={[{ required: true, type: 'number', message: 'Please input hours.' }]}>
                    <InputNumber placeholder="Hrs" style={{ width: '25%' }} min={1} max={10000} />
                  </Form.Item>
                  <Form.Item name={[name, 'content']} noStyle rules={[{ required: true, whitespace: true, message: 'Please input content.' }]}>
                    <TextArea autoSize placeholder="Content" style={{ width: '90%', marginRight: 10, marginTop: 8 }} />
                  </Form.Item>
                  {fields.length > 1 && <MinusCircleOutlined onClick={() => remove(name)} style={{ marginLeft: 8 }} />}
                </Form.Item>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} style={{ marginLeft: '10%', width: '80%' }}>
                  <PlusOutlined /> Add Course Content
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        {/* PILOs */}
        <Form.List name="pilos">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }, index) => (
                <Form.Item key={key} label={`PILO${index + 1}`} required={false}>
                  <Form.Item name={[name, 'content']} noStyle rules={[{ required: true, whitespace: true, message: 'Please input PILO content.' }]}>
                    <TextArea autoSize placeholder="PILO Content" style={{ width: '90%', marginRight: 10 }} />
                  </Form.Item>
                  {fields.length > 1 && <MinusCircleOutlined onClick={() => remove(name)} style={{ marginLeft: 8 }} />}
                </Form.Item>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} style={{ marginLeft: '10%', width: '80%' }}>
                  <PlusOutlined /> Add PILO Content
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        {/* CILOs + TLAs */}
        <Form.List name="cilos">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }, index) => (
                <div key={key}>
                  <Form.Item label={`CILO${index + 1}`} required={false}>
                    <Form.Item name={[name, 'content']} noStyle rules={[{ required: true, whitespace: true, message: 'Please input CILO content.' }]}>
                      <TextArea autoSize placeholder="CILO Content" style={{ width: '90%', marginRight: 10 }} />
                    </Form.Item>
                    <Form.Item name={[name, 'pilo_ids']} noStyle rules={[{ type: 'array', required: true, message: 'Please select corresponding PILOs.' }]}>
                      <Select mode="multiple" placeholder="Select corresponding PILOs" options={piloOptions} style={{ width: '90%', marginRight: 10, marginTop: 8 }} />
                    </Form.Item>
                    {fields.length > 1 && <MinusCircleOutlined onClick={() => remove(name)} style={{ marginLeft: 8 }} />}
                  </Form.Item>
                  <Form.Item label={`TLA for CILO${index + 1}`} required>
                    <Form.Item name={[name, 'tla_content']} noStyle rules={[{ required: true, whitespace: true, message: 'Please input TLA content.' }]}>
                      <TextArea autoSize placeholder="TLA Content" />
                    </Form.Item>
                  </Form.Item>
                </div>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} style={{ marginLeft: '10%', width: '80%' }}>
                  <PlusOutlined /> Add CILO Content
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        {/* Assessments */}
        <Text strong>Assessment Methods</Text>
        <Form.List name="assessments">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }, index) => (
                <Form.Item key={key} label={index === 0 ? '' : ''} required={false} style={{ marginTop: 8 }}>
                  <Form.Item name={[name, 'method']} noStyle rules={[{ required: true, whitespace: true, message: 'Please input assessment method.' }]}>
                    <Input placeholder="Assessment Method" style={{ marginBottom: 8 }} />
                  </Form.Item>
                  <Form.Item name={[name, 'weighting']} noStyle rules={[{ required: true, type: 'number', message: 'Please input weighting.' }]}>
                    <InputNumber placeholder="Weighting(%)" style={{ width: '48%', marginRight: 5 }} max={100} min={1} />
                  </Form.Item>
                  <Form.Item name={[name, 'cilo_ids']} noStyle rules={[{ type: 'array', required: true, message: 'Please select corresponding CILOs.' }]}>
                    <Select mode="multiple" placeholder="Select corresponding CILOs" options={ciloOptions} style={{ width: '48%', marginRight: 10 }} />
                  </Form.Item>
                  <Form.Item name={[name, 'description']} noStyle rules={[{ required: true, whitespace: true, message: 'Please input description.' }]}>
                    <TextArea autoSize placeholder="Description of assessment method" style={{ width: '90%', marginRight: 10, marginTop: 8 }} />
                  </Form.Item>
                  {fields.length > 1 && <MinusCircleOutlined onClick={() => remove(name)} style={{ marginLeft: 8 }} />}
                </Form.Item>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} style={{ marginLeft: '10%', width: '80%' }}>
                  <PlusOutlined /> Add Assessment Method
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        {/* Textbooks */}
        <Form.List name="textBooks">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }, index) => (
                <Form.Item key={key} label={index === 0 ? 'Textbook Information' : ''} required={false}>
                  <Form.Item name={[name, 'title']} noStyle rules={[{ required: true, whitespace: true, message: 'Please input book title.' }]}>
                    <Input placeholder="Book Title" style={{ width: '60%', marginRight: 5 }} />
                  </Form.Item>
                  <Form.Item name={[name, 'year']} noStyle rules={[{ required: true, type: 'number', message: 'Please input publish year.' }]}>
                    <InputNumber placeholder="Publish Year" style={{ width: '35%', marginRight: 5 }} min={1} max={new Date().getFullYear()} />
                  </Form.Item>
                  <Form.Item name={[name, 'author']} noStyle rules={[{ required: true, whitespace: true, message: 'Please input author name.' }]}>
                    <Input placeholder="Authors' Name" style={{ width: '90%', marginRight: 10, marginTop: 8 }} />
                  </Form.Item>
                  {fields.length > 1 && <MinusCircleOutlined onClick={() => remove(name)} style={{ marginLeft: 8 }} />}
                </Form.Item>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} style={{ marginLeft: '10%', width: '80%' }}>
                  <PlusOutlined /> Add Textbook Information
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: 100, marginRight: 10 }} loading={loading}>Submit</Button>
          <Button style={{ width: 100 }} onClick={() => window.history.go(-1)}>Cancel</Button>
        </Form.Item>
      </Form>
    </div>
  )
}
