import { test, expect } from '@playwright/test'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api'

const adminUser = {
  email: process.env.ADMIN_EMAIL || 'admin@greenwoodacademy.edu.in',
  password: process.env.ADMIN_PASSWORD || 'Admin@1234',
}

const streamsByGrade = {
  11: ['science', 'commerce', 'arts'],
  12: ['science', 'commerce', 'arts'],
}

const subjectsByStream = {
  regular: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Studies'],
  science: ['English', 'Physics', 'Chemistry', 'Mathematics', 'Biology'],
  commerce: ['English', 'Accountancy', 'Business Studies', 'Economics', 'Mathematics'],
  arts: ['English', 'History', 'Political Science', 'Geography', 'Economics'],
}

const classPlans = Array.from({ length: 12 }, (_, index) => {
  const grade = index + 1
  const streams = streamsByGrade[grade] || ['regular']

  return streams.map((stream) => ({
    grade,
    name: `Class ${grade}`,
    order_number: grade,
    stream,
    sections: ['A', 'B'],
    subjects: subjectsByStream[stream],
  }))
}).flat()

async function apiFetch(request, path, token, options = {}) {
  const response = await request.fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const body = await response.json().catch(() => ({}))
  return { response, body }
}

function normalizeStream(stream) {
  return stream || 'regular'
}

function findMatchingClass(classes, plan) {
  return classes.find((item) =>
    item.name === plan.name &&
    Number(item.order_number) === plan.order_number &&
    normalizeStream(item.stream) === plan.stream
  ) || classes.find((item) =>
    Number(item.order_number) === plan.order_number &&
    normalizeStream(item.stream) === plan.stream
  )
}

test.describe.serial('Class provisioning', () => {
  test('create classes 1-12 with two sections and five subjects', async ({ request }) => {
    const login = await request.post(`${API_BASE_URL}/auth/login`, { data: adminUser })
    expect(login.ok(), await login.text()).toBeTruthy()

    const loginBody = await login.json()
    const token = loginBody.data.token
    expect(token).toBeTruthy()

    const listClasses = async () => {
      const { response, body } = await apiFetch(request, '/classes', token)
      expect(response.ok(), JSON.stringify(body)).toBeTruthy()
      return body.data.classes || []
    }

    let classes = await listClasses()

    for (const plan of classPlans) {
      let classRecord = findMatchingClass(classes, plan)

      if (!classRecord) {
        const create = await apiFetch(request, '/classes', token, {
          method: 'POST',
          data: {
            name: plan.name,
            order_number: plan.order_number,
            stream: plan.stream,
            description: `Provisioned by Playwright for Class ${plan.grade}`,
          },
        })

        if (!create.response.ok() && create.response.status() !== 409) {
          expect(create.response.ok(), JSON.stringify(create.body)).toBeTruthy()
        }

        classes = await listClasses()
        classRecord = findMatchingClass(classes, plan)
      }

      expect(classRecord, `Class ${plan.grade} ${plan.stream} should exist`).toBeTruthy()

      const sectionsResult = await apiFetch(request, `/classes/${classRecord.id}/sections`, token)
      expect(sectionsResult.response.ok(), JSON.stringify(sectionsResult.body)).toBeTruthy()
      const existingSections = sectionsResult.body.data || []

      for (const sectionName of plan.sections) {
        if (existingSections.some((section) => section.name === sectionName)) continue

        const createSection = await apiFetch(request, `/classes/${classRecord.id}/sections`, token, {
          method: 'POST',
          data: { name: sectionName, capacity: 40 },
        })
        expect(createSection.response.ok(), JSON.stringify(createSection.body)).toBeTruthy()
      }

      const subjectsResult = await apiFetch(request, `/classes/${classRecord.id}/subjects`, token)
      expect(subjectsResult.response.ok(), JSON.stringify(subjectsResult.body)).toBeTruthy()
      const existingSubjects = subjectsResult.body.data || []

      for (const [index, subjectName] of plan.subjects.entries()) {
        if (existingSubjects.some((subject) => subject.name === subjectName)) continue

        const codePrefix = subjectName
          .replace(/\s+/g, '')
          .substring(0, 3)
          .toUpperCase()

        const createSubject = await apiFetch(request, `/classes/${classRecord.id}/subjects`, token, {
          method: 'POST',
          data: {
            name: subjectName,
            code: `C${plan.grade}-${plan.stream.slice(0, 3).toUpperCase()}-${codePrefix}`,
            subject_type: 'theory',
            is_core: true,
            order_number: index + 1,
            theory_total_marks: 100,
            theory_passing_marks: 33,
          },
        })
        
        if (!createSubject.response.ok() && 
            (createSubject.response.status() === 409 || 
             createSubject.body.message?.toLowerCase().includes('already exists'))) {
          continue
        }

        expect(createSubject.response.ok(), JSON.stringify(createSubject.body)).toBeTruthy()
      }

      const finalSections = await apiFetch(request, `/classes/${classRecord.id}/sections`, token)
      const finalSubjects = await apiFetch(request, `/classes/${classRecord.id}/subjects`, token)

      expect((finalSections.body.data || []).filter((section) => ['A', 'B'].includes(section.name))).toHaveLength(2)
      expect(finalSubjects.body.data || []).toHaveLength(5)
    }
  })
})
