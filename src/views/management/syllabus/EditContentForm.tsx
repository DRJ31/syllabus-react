import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Breadcrumb, Input, InputNumber, Form, Button, Select, Typography, message } from 'antd'
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import axios from 'axios'
import type { Syllabus, Pilo, Cilo, Assessment } from '@/types'

const { TextArea } = Input
const { Text } = Typography

interface CiloFormItem {
  content: string
  pilo_ids: number[]
  tla_content: string
}

interface AssessmentFormItem {
  method: string
  weighting: number
  cilo_ids: number[]
  description: string
}

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
  cilos: CiloFormItem[]
  assessments: AssessmentFormItem[]
  textBooks: Array<{ title: string; year: number; author: string }>
}

const getInitialPiloIds = (cilo: Cilo, pilos: Pilo[]): number[] =>
  cilo.pilo_cilos.map(pc => {
    const p = pilos.find(x => x.id === pc.pilo_id)
    return p ? p.pilo_id - 1 : -1
  }).filter(i => i >= 0)

const getInitialCiloIds = (assessment: Assessment, cilos: Cilo[]): number[] =>
  assessment.assessment_cilos.map(ac => {
    const c = cilos.find(x => x.id === ac.cilo_id)
    return c ? c.cilo_id - 1 : -1
  }).filter(i => i >= 0)

const Bread = () => (
  <Breadcrumb items={[
    { title: <Link to="/">Home</Link> },
    { title: <Link to="/management">Management</Link> },
    { title: <Link to="/management/syllabus">Syllabus Management</Link> },
    { title: 'Edit' },
  ]} />
)

export default function EditContentForm() {
  const location = useLocation()
  const navigate = useNavigate()
  const data = (location.state as { data: Syllabus } | null)?.data
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm<FormValues>()

  if (!data) return null

  const origContents = data.contents ?? []
  const origPilos = data.pilos ?? []
  const origCilos = data.cilos ?? []
  const origAssessments = data.assessments ?? []
  const origTextBooks = data.textBooks ?? []

  const piloList: Array<{ content: string }> = Form.useWatch('pilos', form) ?? []
  const ciloList: CiloFormItem[] = Form.useWatch('cilos', form) ?? []
  const piloOptions = piloList.map((_, i) => ({ value: i, label: `PILO${i + 1}` }))
  const ciloOptions = ciloList.map((_, i) => ({ value: i, label: `CILO${i + 1}` }))

  const initialValues: Partial<FormValues> = {
    title: data.title,
    code: data.code,
    pre_req: data.pre_req,
    co_req: data.co_req,
    unit: data.unit,
    hours: data.hours,
    offer_unit: data.offer_unit,
    prepare: data.prepare,
    review: data.review,
    aim: data.aim,
    contents: origContents.map(c => ({ title: c.title, hours: c.hours, content: c.content })),
    pilos: origPilos.length > 0 ? origPilos.map(p => ({ content: p.content })) : [{ content: '' }],
    cilos: origCilos.length > 0
      ? origCilos.map(c => ({
          content: c.content,
          pilo_ids: getInitialPiloIds(c, origPilos),
          tla_content: c.tla?.content ?? '',
        }))
      : [{ content: '', pilo_ids: [], tla_content: '' }],
    assessments: origAssessments.length > 0
      ? origAssessments.map(a => ({
          method: a.method,
          weighting: a.weighting,
          description: a.description,
          cilo_ids: getInitialCiloIds(a, origCilos),
        }))
      : [{ method: '', weighting: 0, cilo_ids: [], description: '' }],
    textBooks: origTextBooks.map(tb => ({ title: tb.title, year: tb.year, author: tb.author })),
  }

  const onFinish = async (values: FormValues) => {
    setLoading(true)

    const rsp = await axios.post('/api/syllabus/update', {
      id: data.id, school_id: data.school.id,
      code: values.code, title: values.title,
      prepare: values.prepare, review: values.review,
      unit: values.unit, hours: values.hours,
      pre_req: values.pre_req, co_req: values.co_req,
      offer_unit: values.offer_unit, aim: values.aim,
    })
    if (!rsp.data.status) { setLoading(false); return }

    // Contents: update existing, add new, delete removed
    for (let i = 0; i < values.contents.length; i++) {
      if (i < origContents.length) {
        axios.post('/api/content/update', {
          id: origContents[i].id, content_id: i + 1, syllabus_id: data.id,
          title: values.contents[i].title, hours: values.contents[i].hours, content: values.contents[i].content,
        })
      } else {
        axios.post('/api/content', {
          contents: values.contents.slice(origContents.length).map((c, j) => ({
            ...c, content_id: origContents.length + j + 1, syllabus_id: data.id,
          })),
        })
        break
      }
    }
    for (let i = values.contents.length; i < origContents.length; i++) {
      axios.delete('/api/content', { params: { id: origContents[i].id } })
    }

    // TextBooks: update existing, add new, delete removed
    for (let i = 0; i < values.textBooks.length; i++) {
      if (i < origTextBooks.length) {
        axios.post('/api/textBook/update', {
          id: origTextBooks[i].id, syllabus_id: data.id,
          year: values.textBooks[i].year, author: values.textBooks[i].author, title: values.textBooks[i].title,
        })
      } else {
        axios.post('/api/textBook', {
          textBooks: values.textBooks.slice(origTextBooks.length).map(tb => ({ ...tb, syllabus_id: data.id })),
        })
        break
      }
    }
    for (let i = values.textBooks.length; i < origTextBooks.length; i++) {
      axios.delete('/api/textBook', { params: { id: origTextBooks[i].id } })
    }

    // PILOs: update existing, add new, collect IDs
    const pilo_ids: number[] = []
    for (let i = 0; i < values.pilos.length; i++) {
      if (i < origPilos.length) {
        pilo_ids.push(origPilos[i].id)
        axios.post('/api/pilo/update', {
          id: origPilos[i].id, syllabus_id: data.id, pilo_id: i + 1, content: values.pilos[i].content,
        })
      } else {
        const newRsp = await axios.post('/api/pilo', {
          pilos: values.pilos.slice(origPilos.length).map((p, j) => ({
            content: p.content, pilo_id: origPilos.length + j + 1, syllabus_id: data.id,
          })),
        })
        for (const id of newRsp.data.ID) pilo_ids.push(id)
        break
      }
    }

    // CILOs: update existing, add new, collect IDs
    const cilo_ids: number[] = []
    for (let i = 0; i < values.cilos.length; i++) {
      if (i < origCilos.length) {
        cilo_ids.push(origCilos[i].id)
        axios.post('/api/cilo/update', {
          id: origCilos[i].id, syllabus_id: data.id, cilo_id: i + 1, content: values.cilos[i].content,
        })
      } else {
        const newRsp = await axios.post('/api/cilo', {
          cilos: values.cilos.slice(origCilos.length).map((c, j) => ({
            content: c.content, cilo_id: origCilos.length + j + 1, syllabus_id: data.id,
          })),
        })
        for (const id of newRsp.data.ID) cilo_ids.push(id)
        break
      }
    }

    // TLAs: update existing, add new for new CILOs, delete removed CILOs' TLAs
    for (let i = 0; i < values.cilos.length; i++) {
      if (i < origCilos.length) {
        axios.post('/api/tla/update', {
          id: origCilos[i].tla?.id, cilo_id: cilo_ids[i], content: values.cilos[i].tla_content,
        })
      } else {
        axios.post('/api/tla', {
          tlas: values.cilos.slice(origCilos.length).map((c, j) => ({
            content: c.tla_content, cilo_id: cilo_ids[origCilos.length + j],
          })),
        })
        break
      }
    }
    for (let i = values.cilos.length; i < origCilos.length; i++) {
      axios.delete('/api/tla', { params: { id: origCilos[i].tla?.id } })
    }

    // Assessments: update existing, add new, collect IDs
    const assessment_ids: number[] = []
    for (let i = 0; i < values.assessments.length; i++) {
      if (i < origAssessments.length) {
        assessment_ids.push(origAssessments[i].id!)
        axios.post('/api/assessment/update', {
          id: origAssessments[i].id, syllabus_id: data.id,
          method: values.assessments[i].method, weighting: values.assessments[i].weighting,
          description: values.assessments[i].description,
        })
      } else {
        const newRsp = await axios.post('/api/assessment', {
          assessments: values.assessments.slice(origAssessments.length).map(a => ({
            method: a.method, weighting: a.weighting, description: a.description, syllabus_id: data.id,
          })),
        })
        for (const id of newRsp.data.ID) assessment_ids.push(id)
        break
      }
    }

    // PILO-CILO mappings
    const old_pilo_cilos = origCilos.flatMap(c => c.pilo_cilos)
    const new_pilo_cilos: Array<{ id?: number; pilo_id: number; cilo_id: number }> = []
    values.cilos.forEach((cilo, ciloIdx) => {
      for (const piloIdx of cilo.pilo_ids) {
        if (new_pilo_cilos.length < old_pilo_cilos.length) {
          const oldPc = old_pilo_cilos[new_pilo_cilos.length]
          new_pilo_cilos.push({ id: oldPc.id, pilo_id: pilo_ids[piloIdx], cilo_id: oldPc.cilo_id! })
          axios.post('/api/pc/update', { id: oldPc.id, pilo_id: pilo_ids[piloIdx], cilo_id: oldPc.cilo_id })
        } else {
          new_pilo_cilos.push({ pilo_id: pilo_ids[piloIdx], cilo_id: cilo_ids[ciloIdx] })
        }
      }
    })
    if (new_pilo_cilos.length > old_pilo_cilos.length) {
      axios.post('/api/pc', { piloCilos: new_pilo_cilos.slice(old_pilo_cilos.length) })
    }

    // Assessment-CILO mappings
    const old_ass_cilos = origAssessments.flatMap(a => a.assessment_cilos)
    const new_ass_cilos: Array<{ id?: number; assessment_id: number; cilo_id: number }> = []
    values.assessments.forEach((assess, assessIdx) => {
      for (const ciloIdx of assess.cilo_ids) {
        if (new_ass_cilos.length < old_ass_cilos.length) {
          const oldAc = old_ass_cilos[new_ass_cilos.length]
          new_ass_cilos.push({ id: oldAc.id, assessment_id: oldAc.assessment_id!, cilo_id: cilo_ids[ciloIdx] })
          axios.post('/api/ac/update', { id: oldAc.id, assessment_id: oldAc.assessment_id, cilo_id: cilo_ids[ciloIdx] })
        } else {
          new_ass_cilos.push({ assessment_id: assessment_ids[assessIdx], cilo_id: cilo_ids[ciloIdx] })
        }
      }
    })
    if (new_ass_cilos.length > old_ass_cilos.length) {
      axios.post('/api/ac', { assessmentCilos: new_ass_cilos.slice(old_ass_cilos.length) })
    }

    // Delete removed PILOs, CILOs, Assessments
    for (let i = values.pilos.length; i < origPilos.length; i++) {
      axios.delete('/api/pilo', { params: { id: origPilos[i].id } })
    }
    for (let i = values.cilos.length; i < origCilos.length; i++) {
      axios.delete('/api/cilo', { params: { id: origCilos[i].id } })
    }
    for (let i = values.assessments.length; i < origAssessments.length; i++) {
      axios.delete('/api/assessment', { params: { id: origAssessments[i].id } })
    }

    message.success('Update syllabus information successfully.')
    navigate('/management/syllabus')
  }

  return (
    <div>
      <Bread />
      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        initialValues={initialValues}
        style={{ background: '#fff', margin: 10, padding: 20 }}
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
              {fields.map(({ key, name }) => (
                <Form.Item key={key} required={false} style={{ marginTop: 8 }}>
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
          <Button type="primary" htmlType="submit" style={{ width: 100, marginRight: 10 }} loading={loading}>Update</Button>
          <Button style={{ width: 100 }} onClick={() => window.history.go(-1)}>Cancel</Button>
        </Form.Item>
      </Form>
    </div>
  )
}
