import { test, expect } from '@playwright/test'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api'

const adminUser = {
  email: process.env.ADMIN_EMAIL || 'admin@greenwoodacademy.edu.in',
  password: process.env.ADMIN_PASSWORD || 'Admin@1234',
}

const SESSION_NAME = '2024-25'

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

test.describe.serial('Unified System Provisioning', () => {
  test('Create session and students for all classes', async ({ request }) => {
    test.setTimeout(600000) // 10 minutes

    const login = await request.post(`${API_BASE_URL}/auth/login`, { data: adminUser })
    expect(login.ok(), await login.text()).toBeTruthy()
    const token = (await login.json()).data.token

    // 1. Ensure Session Exists
    let sessionsRes = await apiFetch(request, '/sessions', token)
    let sessions = sessionsRes.body.data || []
    let activeSession = sessions.find(s => s.name === SESSION_NAME)

    if (!activeSession) {
      console.log(`Creating session "${SESSION_NAME}"...`)
      const createSessionRes = await apiFetch(request, '/sessions', token, {
        method: 'POST',
        data: {
          name: SESSION_NAME,
          start_date: '2024-04-01',
          end_date: '2025-03-31',
          working_days: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: false }
        }
      })
      activeSession = createSessionRes.body.data
      console.log(`Created session: ${activeSession.name}. Activating...`)
      await apiFetch(request, `/sessions/${activeSession.id}/activate`, token, { method: 'PATCH' })
    } else if (!activeSession.is_active) {
       console.log(`Session "${SESSION_NAME}" exists but is not active. Activating...`)
       await apiFetch(request, `/sessions/${activeSession.id}/activate`, token, { method: 'PATCH' })
    }

    // 2. Get Classes
    const classesRes = await apiFetch(request, '/classes', token)
    const classes = classesRes.body.data.classes || []
    expect(classes.length).toBeGreaterThan(0)

    // 3. Provision Students
    for (const cls of classes) {
      const sectionsRes = await apiFetch(request, `/classes/${cls.id}/sections`, token)
      const sections = sectionsRes.body.data || []
      
      for (const section of sections) {
        const enrollmentRes = await apiFetch(request, `/enrollments?class_id=${cls.id}&section_id=${section.id}&session_id=${activeSession.id}`, token)
        const currentCount = (enrollmentRes.body.data || []).length
        
        const studentsToCreate = 5 - currentCount
        if (studentsToCreate <= 0) continue

        console.log(`Provisioning ${studentsToCreate} students for Class ${cls.name} ${cls.stream || ''} Section ${section.name}`)

        for (let i = 1; i <= studentsToCreate; i++) {
          const studentNum = currentCount + i
          const rollNumber = `${cls.order_number}${section.name}${studentNum}`
          const admissionNo = `ADM${activeSession.id}${cls.id}${section.id}${studentNum}`
          const email = `student.${admissionNo.toLowerCase()}@example.com`
          
          const studentData = {
            admission_no: admissionNo,
            first_name: `Student`,
            last_name: `${cls.order_number}${section.name}${studentNum}`,
            date_of_birth: '2015-01-01',
            gender: i % 2 === 0 ? 'male' : 'female',
            profile: { email: email },
            // Add some full details
            blood_group: 'A+',
            father_name: 'Father Name',
            mother_name: 'Mother Name',
            address: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456'
          }

          const admitRes = await apiFetch(request, '/students', token, { method: 'POST', data: studentData })
          let studentId = admitRes.body.data?.id

          if (!admitRes.response.ok()) {
            if (admitRes.response.status() === 409) {
              const listRes = await apiFetch(request, `/students?search=${admissionNo}`, token)
              studentId = (listRes.body.data.students || []).find(s => s.admission_no === admissionNo)?.id
            } else {
              console.error(`Admit failed for ${admissionNo}:`, admitRes.body.message)
              continue
            }
          }

          if (studentId) {
            const enrollRes = await apiFetch(request, '/enrollments', token, {
              method: 'POST',
              data: {
                student_id: studentId,
                session_id: activeSession.id,
                class_id: cls.id,
                section_id: section.id,
                stream: cls.stream || 'regular',
                joining_type: 'fresh',
                joined_date: '2024-04-01',
                roll_number: rollNumber
              }
            })
            if (enrollRes.response.ok()) {
              console.log(`Success: ${admissionNo} enrolled in ${cls.name} ${section.name}`)
            }
          }
        }
      }
    }
  })
})
