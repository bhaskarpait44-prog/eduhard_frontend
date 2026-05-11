import { test } from '@playwright/test'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api'
const adminUser = {
  email: process.env.ADMIN_EMAIL || 'admin@greenwoodacademy.edu.in',
  password: process.env.ADMIN_PASSWORD || 'Admin@1234',
}

test('Show Admission Progress', async ({ request }) => {
  const login = await request.post(`${API_BASE_URL}/auth/login`, { data: adminUser })
  const token = (await login.json()).data.token

  const sessionsRes = await request.get(`${API_BASE_URL}/sessions`, { headers: { Authorization: `Bearer ${token}` } })
  const allSessions = (await sessionsRes.json()).data || []
  console.log('Available Sessions:', JSON.stringify(allSessions.map(s => ({ id: s.id, name: s.name, active: s.is_active }))))

  const activeSession = allSessions.find(s => s.is_active) || allSessions.find(s => s.name === '2024-25') || allSessions[0]

  const classesRes = await request.get(`${API_BASE_URL}/classes`, { headers: { Authorization: `Bearer ${token}` } })
  const classes = (await classesRes.json()).data.classes || []

  console.log(`\nADMISSION PROGRESS REPORT (Session: ${activeSession?.name || 'N/A'})\n`)
  console.log(''.padEnd(60, '-'))
  console.log(`${'Class'.padEnd(25)} | ${'Section'.padEnd(10)} | ${'Students'.padEnd(10)} | ${'Status'}`)
  console.log(''.padEnd(60, '-'))

  let totalStudents = 0
  let totalTarget = 0

  for (const cls of classes) {
    const sectionsRes = await request.get(`${API_BASE_URL}/classes/${cls.id}/sections`, { headers: { Authorization: `Bearer ${token}` } })
    const sections = (await sectionsRes.json()).data || []

    for (const sec of sections) {
      const enrollmentRes = await request.get(`${API_BASE_URL}/enrollments?class_id=${cls.id}&section_id=${sec.id}&session_id=${activeSession?.id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      const count = (await enrollmentRes.json()).data?.length || 0
      const className = `${cls.name} ${cls.stream || ''}`.trim()
      const status = count >= 5 ? '✅ Full' : '⏳ In Progress'
      
      console.log(`${className.padEnd(25)} | ${sec.name.padEnd(10)} | ${String(count).padEnd(10)} | ${status}`)
      
      totalStudents += count
      totalTarget += 5
    }
  }

  console.log(''.padEnd(60, '-'))
  console.log(`${'TOTAL'.padEnd(25)} | ${''.padEnd(10)} | ${String(totalStudents).padEnd(10)} / ${totalTarget}`)
  console.log(''.padEnd(60, '-'))
})
