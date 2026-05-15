import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@greenwoodacademy.edu.in'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234'
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api'

/**
 * Teacher Provisioning via UI
 * 
 * School Structure:
 * - Classes 1-10 (regular): 10 * 2 sections = 20 sections
 * - Classes 11-12 (science, commerce, arts): 2 * 3 * 2 sections = 12 sections
 * - Total Sections: 32
 * 
 * Plan:
 * 1. Login as Admin
 * 2. Fetch all classes/sections/subjects via API (for efficient iteration)
 * 3. For each section (32 total):
 *    a. Go to /teachers and "Admit Teacher"
 *    b. Fill Identity (Name, Email, Emp ID, Dept, Desig)
 *    c. Skip Education/Notes
 *    d. Confirm and get temporary password
 *    e. Go to /admin/teacher-control
 *    f. Assign teacher as "Class Teacher" for the section
 *    g. Assign teacher to teach all 5 subjects in that section
 */

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

test.describe.serial('Teacher UI Provisioning', () => {
  let token

  test.beforeAll(async ({ request }) => {
    const login = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
    })
    const body = await login.json()
    token = body.data.token
  })

  test('create and assign teachers for all 32 sections', async ({ page, request }) => {
    test.setTimeout(600000) // 10 minutes for 32 teachers

    // 1. Login to UI
    await page.goto(`${BASE_URL}/login`)
    await page.fill('#identifier', ADMIN_EMAIL)
    await page.fill('#password', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForSelector('text=Dashboard')

    // 2. Fetch data needed for iteration
    const { body: classListBody } = await apiFetch(request, '/classes', token)
    const classes = classListBody.data.classes || []

    const provisioningPlan = []
    for (const cls of classes) {
      const { body: sectionBody } = await apiFetch(request, `/classes/${cls.id}/sections`, token)
      const sections = sectionBody.data || []
      const { body: subjectBody } = await apiFetch(request, `/classes/${cls.id}/subjects`, token)
      const subjects = subjectBody.data || []
      
      for (const sec of sections) {
        provisioningPlan.push({
          classId: cls.id,
          className: cls.name,
          classStream: cls.stream,
          sectionId: sec.id,
          sectionName: sec.name,
          subjects: subjects.map(s => ({ id: s.id, name: s.name })),
          teacherName: `Teacher ${cls.name.replace(/\s+/g, '')} ${cls.stream ? cls.stream.charAt(0).toUpperCase() : ''}${sec.name}`,
          teacherEmail: `teacher.${cls.id}.${sec.id}@greenwood.edu.in`.toLowerCase(),
          employeeId: `TCH-${cls.id}-${sec.id}`
        })
      }
    }

    console.log(`Planned provisioning for ${provisioningPlan.length} sections.`)

    for (const plan of provisioningPlan) {
      console.log(`[PROGRESS] Starting: ${plan.teacherName}`)

      // 3a. Admit Teacher
      await page.goto(`${BASE_URL}/teachers`)
      await page.waitForLoadState('networkidle')
      
      const teacherRow = page.locator(`tr:has-text("${plan.teacherEmail}")`)
      if (await teacherRow.isVisible()) {
        console.log(`[INFO] Teacher ${plan.teacherEmail} already exists.`)
      } else {
        await page.click('button:has-text("Admit Teacher")')

        // Step 1: Identity
        await page.fill('input[name="name"]', plan.teacherName)
        await page.fill('input[name="email"]', plan.teacherEmail)
        await page.fill('input[name="employee_id"]', plan.employeeId)
        await page.fill('input[name="department"]', plan.classStream || 'General')
        await page.fill('input[name="designation"]', 'Class Teacher')
        await page.click('button:has-text("Next")')

        // Step 2: Education
        await page.waitForSelector('text=Highest Qualification')
        await page.click('button:has-text("Next")')

        // Step 3: Notes
        await page.waitForSelector('text=Address')
        await page.click('button:has-text("Next")')

        // Step 4: Review
        await page.click('button:has-text("Create Teacher")')

        // Success Modal
        await page.waitForSelector('text=Teacher Created', { timeout: 15000 })
        await page.click('button:has-text("Back to List")')
        console.log(`[INFO] Created teacher account for ${plan.teacherName}`)
      }

      // 3b. Assign Teacher
      await page.goto(`${BASE_URL}/admin/teacher-control`)
      await page.waitForSelector('button:has-text("New Assignment")')
      
      const groupText = `${plan.className}${plan.classStream ? ` (${plan.classStream.toUpperCase()})` : ''} — ${plan.sectionName}`
      console.log(`[INFO] Assigning ${plan.teacherName} to ${groupText}`)

      // Helper to fill assignment form
      const fillAssignment = async (isClassTeacher, subjectName = null) => {
        console.log(`[DEBUG] Opening assignment form (Class Teacher: ${isClassTeacher}${subjectName ? `, Subject: ${subjectName}` : ''})`)
        await page.click('button:has-text("New Assignment")')
        
        // Use a more specific selector by finding the label and then the select in its parent/sibling container
        const teacherSelect = page.locator('div:has(> label:text("Teacher")) select')
        await teacherSelect.waitFor()
        await teacherSelect.selectOption({ label: plan.teacherName })
        
        const classLabel = plan.classStream 
            ? `${plan.className} (${plan.classStream.charAt(0).toUpperCase() + plan.classStream.slice(1)})` 
            : plan.className
        await page.locator('div:has(> label:text("Class")) select').selectOption({ label: classLabel })
        await page.locator('div:has(> label:text("Section")) select').selectOption({ label: plan.sectionName })
        
        const typeBtn = page.locator('button:has-text("Subject Teacher"), button:has-text("Class Teacher")')
        const currentType = await typeBtn.innerText()
        
        if (isClassTeacher && currentType === 'Subject Teacher') {
          await typeBtn.click()
        } else if (!isClassTeacher && currentType === 'Class Teacher') {
          await typeBtn.click()
        }

        if (subjectName) {
           await page.locator('div:has(> label:text("Subject")) select').selectOption({ label: subjectName })
        }
        
        await page.click('button:has-text("Add")')
        
        // Wait for result
        await page.waitForTimeout(1000)
        if (await page.locator('button:has-text("Cancel")').isVisible()) {
            await page.click('button:has-text("Cancel")')
        }
        await page.waitForTimeout(500)
      }

      // Assign as Class Teacher
      await fillAssignment(true)
      console.log(`[INFO] Assigned as Class Teacher`)

      // Assign Subjects
      for (const subject of plan.subjects) {
        await fillAssignment(false, subject.name)
        console.log(`[INFO] Assigned subject: ${subject.name}`)
      }
      
      console.log(`[SUCCESS] Completed provisioning for ${plan.teacherName}`)
    }

    console.log('Teacher provisioning complete.')
  })
})
