export interface User {
  username: string
  role_id: number
}

export interface SessionData {
  time: number
  token: string
}

export interface School {
  id: number
  name: string
  location: string
  introduction?: string
  syllabuses: Syllabus[]
}

export interface Syllabus {
  id: number
  title: string
  code?: string
  unit?: string
  hours?: number
  offer_unit?: string
  pre_req?: string
  co_req?: string
  prepare?: string
  review?: string
  aim?: string
  school: Pick<School, 'id' | 'name' | 'location'>
  contents?: CourseContent[]
  pilos?: Pilo[]
  cilos?: Cilo[]
  assessments?: Assessment[]
  textBooks?: TextBook[]
}

export interface CourseContent {
  content_id: number
  title: string
  content: string
  hours: number
}

export interface Pilo {
  id: number
  pilo_id: number
  content: string
}

export interface Cilo {
  id: number
  cilo_id: number
  content: string
  pilo_cilos: Array<{ pilo_id: number }>
  tla?: { content: string }
}

export interface Assessment {
  method: string
  weighting: number
  description: string
  assessment_cilos: Array<{ cilo_id: number }>
}

export interface TextBook {
  id: number
  title: string
  year: number
  author: string
}

export interface ApiUser {
  id: number
  name: string
  email: string
  role: { id: number }
  school?: { id: number; name: string }
}

export interface ProfileUser {
  id: number | null
  username: string | null
  email: string | null
  role_id: number
  school: { id: number; name: string } | null
}

export interface Audit {
  id: number
  school_name: string
  location?: string
  user_name?: string
  user?: { name: string }
  description?: string
  introduction?: string
}

export interface FavoriteItem {
  id: number
  loading?: boolean
  favorite?: boolean
}
