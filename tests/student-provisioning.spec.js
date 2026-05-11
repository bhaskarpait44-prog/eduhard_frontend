import { test, expect } from '@playwright/test'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api'

const adminUser = {
  email: process.env.ADMIN_EMAIL || 'admin@greenwoodacademy.edu.in',
  password: process.env.ADMIN_PASSWORD || 'Admin@1234',
}

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

test.describe.serial('Student provisioning', () => {
  test('create 5 students for each class and section', async ({ request }) => {
    test.setTimeout(300000) // 5 minutes
    const login = await request.post(`${API_BASE_URL}/auth/login`, { data: adminUser })
    expect(login.ok(), await login.text()).toBeTruthy()

    const loginBody = await login.json()
    const token = loginBody.data.token
    expect(token).toBeTruthy()

    // Get current session
    let sessionsRes = await apiFetch(request, '/sessions', token)
    let sessions = sessionsRes.body.data || []
    let activeSession = sessions.find(s => s.is_active)

    if (!activeSession) {
      console.log('No active session found. Creating "2024-25" session...')
      const createSessionRes = await apiFetch(request, '/sessions', token, {
        method: 'POST',
        data: {
          name: '2024-25',
          start_date: '2024-04-01',
          end_date: '2025-03-31',
          working_days: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            sunday: false
          }
        }
      })

      if (createSessionRes.response.ok()) {
        const newSession = createSessionRes.body.data
        console.log(`Created session: ${newSession.name}. Activating...`)
        await apiFetch(request, `/sessions/${newSession.id}/activate`, token, { method: 'PATCH' })
        
        // Refresh session info
        sessionsRes = await apiFetch(request, '/sessions', token)
        sessions = sessionsRes.body.data || []
        activeSession = sessions.find(s => s.is_active) || sessions[0]
      } else {
        console.error('Failed to create session:', JSON.stringify(createSessionRes.body))
        activeSession = sessions[0]
      }
    }

    expect(activeSession, 'Active session not found').toBeTruthy()

    // Get all classes
    const classesRes = await apiFetch(request, '/classes', token)
    const classes = classesRes.body.data.classes || []
    expect(classes.length).toBeGreaterThan(0)

    for (const cls of classes) {
      // Get sections for this class
      const sectionsRes = await apiFetch(request, `/classes/${cls.id}/sections`, token)
      const sections = sectionsRes.body.data || []
      
      for (const section of sections) {
        // Check current enrollment count
        const enrollmentRes = await apiFetch(request, `/enrollments?class_id=${cls.id}&section_id=${section.id}&session_id=${activeSession.id}`, token)
        const currentCount = (enrollmentRes.body.data || []).length
        
        const studentsToCreate = 5 - currentCount
        if (studentsToCreate <= 0) {
          console.log(`Class ${cls.name} ${cls.stream || ''} Section ${section.name} already has ${currentCount} students.`)
          continue
        }

        console.log(`Creating ${studentsToCreate} students for Class ${cls.name} ${cls.stream || ''} Section ${section.name}`)

        for (let i = 1; i <= studentsToCreate; i++) {
          const studentNum = currentCount + i
          const rollNumber = `${cls.order_number}${section.name}${studentNum}`
          const admissionNo = `ADM${activeSession.id}${cls.id}${section.id}${studentNum}`
          const email = `student.${admissionNo.toLowerCase()}@example.com`
          
          const studentData = {
            // Student Profile
            admission_no: admissionNo,
            first_name: `Student`,
            last_name: `${cls.order_number}${section.name}${studentNum}`,
            date_of_birth: '2015-01-01',
            gender: i % 2 === 0 ? 'male' : 'female',
            blood_group: 'O+',
            aadhaar_number: `12345678${cls.id.toString().padStart(2, '0')}${section.id.toString().padStart(2, '0')}`,
            religion: 'General',
            category: 'General',
            nationality: 'Indian',
            address: '123 School Lane, City',
            city: 'Sample City',
            state: 'Sample State',
            pincode: '123456',
            
            // Enrollment Data
            admission_date: new Date().toISOString().split('T')[0],
            roll_number: rollNumber,
            class_id: cls.id,
            section_id: section.id,
            session_id: activeSession.id,
            
            // Parent/Guardian Info
            father_name: `Father of ${rollNumber}`,
            father_phone: `98765432${studentNum.toString().padStart(2, '0')}`,
            father_occupation: 'Professional',
            mother_name: `Mother of ${rollNumber}`,
            mother_phone: `98765431${studentNum.toString().padStart(2, '0')}`,
            guardian_name: `Guardian of ${rollNumber}`,
            guardian_relation: 'Parent',
            guardian_phone: `98765433${studentNum.toString().padStart(2, '0')}`,
            emergency_contact_name: `Father of ${rollNumber}`,
            emergency_contact_phone: `98765432${studentNum.toString().padStart(2, '0')}`,

            // Profile Object for email
            profile: {
              email: email
            }
          }

          const createRes = await apiFetch(request, '/students', token, {
            method: 'POST',
            data: studentData
          })

          let studentId = createRes.body.data?.id

          if (!createRes.response.ok()) {
            if (createRes.response.status() === 409 || createRes.body.message?.toLowerCase().includes('already exists')) {
              // Try to find the existing student by admission_no
              const listRes = await apiFetch(request, `/students?search=${admissionNo}`, token)
              const existing = (listRes.body.data.students || []).find(s => s.admission_no === admissionNo)
              if (existing) {
                studentId = existing.id
              } else {
                console.error(`Failed to find existing student ${admissionNo}`)
                continue
              }
            } else {
              console.error(`Failed to admit student ${rollNumber}:`, JSON.stringify(createRes.body))
              continue
            }
          }

          // Enroll the student
          const enrollmentData = {
            student_id: studentId,
            session_id: activeSession.id,
            class_id: cls.id,
            section_id: section.id,
            stream: cls.stream || 'regular',
            joining_type: 'fresh',
            joined_date: studentData.admission_date,
            roll_number: rollNumber
          }

          const enrollRes = await apiFetch(request, '/enrollments', token, {
            method: 'POST',
            data: enrollmentData
          })

          if (!enrollRes.response.ok()) {
             if (enrollRes.response.status() === 409 || enrollRes.body.message?.toLowerCase().includes('already exists')) {
               console.log(`Student ${rollNumber} already enrolled.`)
             } else {
               console.error(`Failed to enroll student ${rollNumber}:`, JSON.stringify(enrollRes.body))
             }
          } else {
            console.log(`Admitted and Enrolled student: ${studentData.first_name} ${studentData.last_name} (${rollNumber})`)
          }
        }
      }
    }
  })
})
