import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'
const API_BASE_URL = 'http://localhost:5000/api'

async function getEnrollmentCount(request, token, classId, sectionId, sessionId) {
  const response = await request.get(`${API_BASE_URL}/enrollments?class_id=${classId}&section_id=${sectionId}&session_id=${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const body = await response.json()
  return body.data?.length || 0
}

test.describe('Bulk Student Admission via UI', () => {
  test('admit 5 students for each class and section', async ({ page, request }) => {
    test.setTimeout(7200000) // 2 hours

    console.log('1. Logging in...')
    await page.goto(`${BASE_URL}/login`)
    await page.waitForSelector('#identifier')
    await page.fill('#identifier', 'admin@greenwoodacademy.edu.in')
    await page.fill('#password', 'Admin@1234')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*dashboard/)
    console.log('   Login successful.')

    const token = await page.evaluate(() => localStorage.getItem('educore_token'))
    if (!token) throw new Error('No token found in localStorage after login')
    
    const sessionsRes = await request.get(`${API_BASE_URL}/sessions`, { headers: { Authorization: `Bearer ${token}` } })
    const sessions = (await sessionsRes.json()).data || []
    const activeSession = sessions.find(s => s.is_active || s.is_current) || sessions[0]

    const classesRes = await request.get(`${API_BASE_URL}/classes`, { headers: { Authorization: `Bearer ${token}` } })
    const dbClasses = (await classesRes.json()).data.classes || []

    console.log(`Starting bulk admission for Session: ${activeSession.name}`)

    for (const cls of dbClasses) {
      const sectionsRes = await request.get(`${API_BASE_URL}/classes/${cls.id}/sections`, { headers: { Authorization: `Bearer ${token}` } })
      const dbSections = (await sectionsRes.json()).data || []

      for (const sec of dbSections) {
        const currentCount = await getEnrollmentCount(request, token, cls.id, sec.id, activeSession.id)
        const target = 5
        
        if (currentCount >= target) {
          console.log(`Class ${cls.name} ${cls.stream || ''} Section ${sec.name} already has ${currentCount} students. Skipping.`)
          continue
        }

        console.log(`Admitting ${target - currentCount} students for Class ${cls.name} ${cls.stream || ''} Section ${sec.name}...`)

        for (let i = currentCount + 1; i <= target; i++) {
          const timestamp = Date.now()
          const streamSuffix = cls.stream !== 'regular' ? `-${cls.stream[0].toUpperCase()}` : ''
          const lastName = `${cls.name.replace(' ', '')}${streamSuffix}${sec.name}${i}`
          const email = `std.${cls.name.replace(' ', '')}.${cls.stream}.${sec.name}.${i}.${timestamp}@example.com`

          await page.goto(`${BASE_URL}/students/new`)
          
          // Step 1: Identity
          await page.waitForSelector('input[name="first_name"]')
          await page.fill('input[name="first_name"]', `Student`)
          await page.fill('input[name="last_name"]', lastName)
          await page.fill('input[name="date_of_birth"]', '2015-05-15')
          await page.selectOption('select[name="gender"]', i % 2 === 0 ? 'female' : 'male')
          await page.click('button:has-text("Continue to Profile")')

          // Step 2: Profile
          await page.waitForSelector('input[name="email"]')
          await page.fill('input[name="email"]', email)
          await page.fill('textarea[name="address"]', '123 School Road')
          await page.fill('input[name="city"]', 'Academic City')
          await page.fill('input[name="state"]', 'Knowledge State')
          await page.fill('input[name="pincode"]', '123456')
          await page.fill('input[name="phone"]', `98765${Math.floor(Math.random() * 90000 + 10000)}`)
          await page.fill('input[name="father_name"]', `Father of ${lastName}`)
          await page.fill('input[name="mother_name"]', `Mother of ${lastName}`)
          await page.click('button:has-text("Continue to Enrollment")')

          // Step 3: Enrollment
          // Wait for session to be recognized by frontend
          await expect(page.locator('text=Enrolling in current session')).toBeVisible({ timeout: 15000 })
          
          await page.waitForSelector('select[name="class_id"] option:not([value=""])')
          await page.selectOption('select[name="class_id"]', String(cls.id))
          
          // Wait for sections to reload
          await page.waitForResponse(r => r.url().includes(`/api/classes/${cls.id}/sections`) && r.status() === 200)
          await page.waitForSelector(`select[name="section_id"] option[value="${sec.id}"]`)
          await page.selectOption('select[name="section_id"]', String(sec.id))
          
          await page.selectOption('select[name="joining_type"]', 'fresh')
          await page.fill('input[name="joined_date"]', new Date().toISOString().split('T')[0])
          await page.click('button:has-text("Continue to Access")')

          // Step 4: Access
          await page.waitForSelector('button:has-text("Review Details")')
          await page.click('button:has-text("Review Details")')

          // Step 5: Preview
          await page.waitForSelector('button:has-text("Confirm & Admit Student")')
          await page.click('button:has-text("Confirm & Admit Student")')

          // Step 6: Success
          await expect(page.locator('h2')).toContainText('Student Admitted!', { timeout: 60000 })
          
          console.log(`ADMISSION DONE: ${i} for ${cls.name} ${cls.stream || ''} Section ${sec.name}`)
        }
      }
    }
    console.log('All admissions completed successfully.')
  })
})
