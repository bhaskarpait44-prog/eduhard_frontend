import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@greenwoodacademy.edu.in'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234'
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api'

/**
 * Timetable Provisioning via UI
 * 
 * Logic:
 * - 32 Sections
 * - 6 Days (Mon-Sat)
 * - 7 Periods per day
 * - 5 Subjects assigned per section
 * 
 * Distribution:
 * Cycle through the 5 subjects for the 7 periods.
 */

const PERIOD_CONFIG = {
  1: { start: '08:00', end: '08:45' },
  2: { start: '08:45', end: '09:30' },
  3: { start: '09:30', end: '10:15' },
  4: { start: '10:30', end: '11:15' },
  5: { start: '11:15', end: '12:00' },
  6: { start: '12:30', end: '13:15' },
  7: { start: '13:15', end: '14:00' },
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

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

test.describe.serial('Timetable UI Provisioning', () => {
  let token

  test.beforeAll(async ({ request }) => {
    const login = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
    })
    const body = await login.json()
    token = body.data.token
  })

  test('create timetable slots for all sections', async ({ page, request }) => {
    test.setTimeout(1200000) // 20 minutes

    // 1. Login to UI
    await page.goto(`${BASE_URL}/login`)
    await page.fill('#identifier', ADMIN_EMAIL)
    await page.fill('#password', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForSelector('text=Dashboard')

    // 2. Fetch data needed for iteration (classes, sections, assignments)
    const { body: classListBody } = await apiFetch(request, '/classes', token)
    const classes = classListBody.data.classes || []

    const { body: assignmentBody } = await apiFetch(request, '/admin/teacher-control/assignments', token)
    const assignments = assignmentBody.data.assignments || []

    const provisioningPlan = []
    for (const cls of classes) {
      const { body: sectionBody } = await apiFetch(request, `/classes/${cls.id}/sections`, token)
      const sections = sectionBody.data || []
      
      for (const sec of sections) {
        // Find subject assignments for this section
        const sectionAssignments = assignments.filter(a => 
          a.class_id === cls.id && 
          a.section_id === sec.id && 
          !a.is_class_teacher && 
          a.is_active
        )

        if (sectionAssignments.length === 0) continue

        provisioningPlan.push({
          classId: cls.id,
          className: cls.name,
          classStream: cls.stream,
          sectionId: sec.id,
          sectionName: sec.name,
          assignments: sectionAssignments // These contain teacher_name and subject_name
        })
      }
    }

    console.log(`Planned timetable provisioning for ${provisioningPlan.length} sections.`)

    await page.goto(`${BASE_URL}/admin/teacher-control`)
    await page.click('button:has-text("Timetable")')
    await page.waitForSelector('button:has-text("New Slot")')

    for (const plan of provisioningPlan) {
      const groupText = `${plan.className}${plan.classStream ? ` (${plan.classStream.toUpperCase()})` : ''} — ${plan.sectionName}`
      console.log(`[PROGRESS] Filling timetable for: ${groupText}`)

      for (const day of DAYS) {
        for (let period = 1; period <= 7; period++) {
          const assignment = plan.assignments[(period - 1) % plan.assignments.length]
          
          await page.click('button:has-text("New Slot")')
          
          // Fill form
          await page.locator('div:has(> label:text("Teacher")) select').selectOption({ label: assignment.teacher_name })
          
          const classLabel = plan.classStream 
            ? `${plan.className} (${plan.classStream.charAt(0).toUpperCase() + plan.classStream.slice(1)})` 
            : plan.className
          await page.locator('div:has(> label:text("Class")) select').selectOption({ label: classLabel })
          await page.locator('div:has(> label:text("Section")) select').selectOption({ label: plan.sectionName })
          
          // Wait for subjects to load in dropdown
          await page.waitForTimeout(300)
          await page.locator('div:has(> label:text("Subject")) select').selectOption({ label: assignment.subject_name })
          
          await page.locator('div:has(> label:text("Day")) select').selectOption({ value: day })
          await page.fill('input[name="period_number"]', period.toString())
          await page.fill('input[name="start_time"]', PERIOD_CONFIG[period].start)
          await page.fill('input[name="end_time"]', PERIOD_CONFIG[period].end)
          
          await page.click('button:has-text("Add Slot")')

          try {
            await expect(page.locator('text=Slot created')).toBeVisible({ timeout: 5000 })
            // Wait for toast to disappear or just continue
            await page.waitForTimeout(500)
          } catch (e) {
             console.log(`[WARN] Slot creation for P${period} on ${day} might have failed or already exists.`)
             if (await page.locator('button:has-text("Cancel")').isVisible()) {
                await page.click('button:has-text("Cancel")')
             }
          }
        }
        console.log(`[INFO] Completed ${day} for ${groupText}`)
      }
      console.log(`[SUCCESS] Fully provisioned timetable for ${groupText}`)
    }

    console.log('Timetable provisioning complete.')
  })
})
