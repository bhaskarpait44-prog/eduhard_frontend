# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\timetable-ui-provisioning.spec.js >> Timetable UI Provisioning >> create timetable slots for all sections
- Location: tests\timetable-ui-provisioning.spec.js:57:3

# Error details

```
Error: page.fill: Page crashed
Call log:
  - waiting for locator('input[name="period_number"]')

```

# Test source

```ts
  31  | const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  32  | 
  33  | async function apiFetch(request, path, token, options = {}) {
  34  |   const response = await request.fetch(`${API_BASE_URL}${path}`, {
  35  |     ...options,
  36  |     headers: {
  37  |       Authorization: `Bearer ${token}`,
  38  |       'Content-Type': 'application/json',
  39  |       ...(options.headers || {}),
  40  |     },
  41  |   })
  42  |   const body = await response.json().catch(() => ({}))
  43  |   return { response, body }
  44  | }
  45  | 
  46  | test.describe.serial('Timetable UI Provisioning', () => {
  47  |   let token
  48  | 
  49  |   test.beforeAll(async ({ request }) => {
  50  |     const login = await request.post(`${API_BASE_URL}/auth/login`, {
  51  |       data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
  52  |     })
  53  |     const body = await login.json()
  54  |     token = body.data.token
  55  |   })
  56  | 
  57  |   test('create timetable slots for all sections', async ({ page, request }) => {
  58  |     test.setTimeout(1200000) // 20 minutes
  59  | 
  60  |     // 1. Login to UI
  61  |     await page.goto(`${BASE_URL}/login`)
  62  |     await page.fill('#identifier', ADMIN_EMAIL)
  63  |     await page.fill('#password', ADMIN_PASSWORD)
  64  |     await page.click('button[type="submit"]')
  65  |     await page.waitForSelector('text=Dashboard')
  66  | 
  67  |     // 2. Fetch data needed for iteration (classes, sections, assignments)
  68  |     const { body: classListBody } = await apiFetch(request, '/classes', token)
  69  |     const classes = classListBody.data.classes || []
  70  | 
  71  |     const { body: assignmentBody } = await apiFetch(request, '/admin/teacher-control/assignments', token)
  72  |     const assignments = assignmentBody.data.assignments || []
  73  | 
  74  |     const provisioningPlan = []
  75  |     for (const cls of classes) {
  76  |       const { body: sectionBody } = await apiFetch(request, `/classes/${cls.id}/sections`, token)
  77  |       const sections = sectionBody.data || []
  78  |       
  79  |       for (const sec of sections) {
  80  |         // Find subject assignments for this section
  81  |         const sectionAssignments = assignments.filter(a => 
  82  |           a.class_id === cls.id && 
  83  |           a.section_id === sec.id && 
  84  |           !a.is_class_teacher && 
  85  |           a.is_active
  86  |         )
  87  | 
  88  |         if (sectionAssignments.length === 0) continue
  89  | 
  90  |         provisioningPlan.push({
  91  |           classId: cls.id,
  92  |           className: cls.name,
  93  |           classStream: cls.stream,
  94  |           sectionId: sec.id,
  95  |           sectionName: sec.name,
  96  |           assignments: sectionAssignments // These contain teacher_name and subject_name
  97  |         })
  98  |       }
  99  |     }
  100 | 
  101 |     console.log(`Planned timetable provisioning for ${provisioningPlan.length} sections.`)
  102 | 
  103 |     await page.goto(`${BASE_URL}/admin/teacher-control`)
  104 |     await page.click('button:has-text("Timetable")')
  105 |     await page.waitForSelector('button:has-text("New Slot")')
  106 | 
  107 |     for (const plan of provisioningPlan) {
  108 |       const groupText = `${plan.className}${plan.classStream ? ` (${plan.classStream.toUpperCase()})` : ''} — ${plan.sectionName}`
  109 |       console.log(`[PROGRESS] Filling timetable for: ${groupText}`)
  110 | 
  111 |       for (const day of DAYS) {
  112 |         for (let period = 1; period <= 7; period++) {
  113 |           const assignment = plan.assignments[(period - 1) % plan.assignments.length]
  114 |           
  115 |           await page.click('button:has-text("New Slot")')
  116 |           
  117 |           // Fill form
  118 |           await page.locator('div:has(> label:text("Teacher")) select').selectOption({ label: assignment.teacher_name })
  119 |           
  120 |           const classLabel = plan.classStream 
  121 |             ? `${plan.className} (${plan.classStream.charAt(0).toUpperCase() + plan.classStream.slice(1)})` 
  122 |             : plan.className
  123 |           await page.locator('div:has(> label:text("Class")) select').selectOption({ label: classLabel })
  124 |           await page.locator('div:has(> label:text("Section")) select').selectOption({ label: plan.sectionName })
  125 |           
  126 |           // Wait for subjects to load in dropdown
  127 |           await page.waitForTimeout(300)
  128 |           await page.locator('div:has(> label:text("Subject")) select').selectOption({ label: assignment.subject_name })
  129 |           
  130 |           await page.locator('div:has(> label:text("Day")) select').selectOption({ value: day })
> 131 |           await page.fill('input[name="period_number"]', period.toString())
      |                      ^ Error: page.fill: Page crashed
  132 |           await page.fill('input[name="start_time"]', PERIOD_CONFIG[period].start)
  133 |           await page.fill('input[name="end_time"]', PERIOD_CONFIG[period].end)
  134 |           
  135 |           await page.click('button:has-text("Add Slot")')
  136 | 
  137 |           try {
  138 |             await expect(page.locator('text=Slot created')).toBeVisible({ timeout: 5000 })
  139 |             // Wait for toast to disappear or just continue
  140 |             await page.waitForTimeout(500)
  141 |           } catch (e) {
  142 |              console.log(`[WARN] Slot creation for P${period} on ${day} might have failed or already exists.`)
  143 |              if (await page.locator('button:has-text("Cancel")').isVisible()) {
  144 |                 await page.click('button:has-text("Cancel")')
  145 |              }
  146 |           }
  147 |         }
  148 |         console.log(`[INFO] Completed ${day} for ${groupText}`)
  149 |       }
  150 |       console.log(`[SUCCESS] Fully provisioned timetable for ${groupText}`)
  151 |     }
  152 | 
  153 |     console.log('Timetable provisioning complete.')
  154 |   })
  155 | })
  156 | 
```