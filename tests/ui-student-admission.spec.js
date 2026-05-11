import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3001'

test.describe('Student Admission via UI', () => {
  test('should admit a new student through the multi-step form', async ({ page }) => {
    test.setTimeout(120000) // 2 minutes

    // 1. Login
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', 'admin@greenwoodacademy.edu.in')
    await page.fill('input[type="password"]', 'Admin@1234')
    await page.click('button[type="submit"]')

    // Wait for dashboard or navigation
    await expect(page).toHaveURL(/.*dashboard/)

    // 2. Navigate to Admit Student Page
    await page.goto(`${BASE_URL}/students/new`)
    await expect(page.locator('h1')).toContainText('Admit New Student')

    // Step 1: Identity
    const firstName = `UI-Student-${Date.now()}`
    const lastName = 'Test'
    await page.fill('input[name="first_name"]', firstName)
    await page.fill('input[name="last_name"]', lastName)
    await page.fill('input[name="date_of_birth"]', '2015-05-15')
    await page.selectOption('select[name="gender"]', 'male')
    // Admission number is auto-generated, let's keep it or regenerate
    const admissionNo = await page.inputValue('input[name="admission_no"]')
    console.log(`Using Admission No: ${admissionNo}`)
    
    await page.click('button:has-text("Continue to Profile")')

    // Step 2: Profile
    await page.fill('textarea[name="address"]', '123 UI Test Road')
    await page.fill('input[name="city"]', 'Testing City')
    await page.fill('input[name="state"]', 'Testing State')
    await page.fill('input[name="pincode"]', '123456')
    await page.fill('input[name="phone"]', '9876543210')
    await page.fill('input[name="email"]', `ui.student.${Date.now()}@example.com`)
    await page.fill('input[name="father_name"]', 'Father UI')
    await page.fill('input[name="mother_name"]', 'Mother UI')
    
    await page.click('button:has-text("Continue to Enrollment")')

    // Step 3: Enrollment
    // Select first class in the list
    await page.waitForSelector('select[name="class_id"] option:not([value=""])')
    const classOptions = await page.locator('select[name="class_id"] option').allInnerTexts()
    console.log(`Available classes: ${classOptions.join(', ')}`)
    await page.selectOption('select[name="class_id"]', { index: 1 }) // Select first real class

    // Wait for sections to load
    await page.waitForSelector('select[name="section_id"] option:not([value=""])')
    await page.selectOption('select[name="section_id"]', { index: 1 })

    await page.selectOption('select[name="joining_type"]', 'fresh')
    await page.fill('input[name="joined_date"]', new Date().toISOString().split('T')[0])
    
    await page.click('button:has-text("Continue to Access")')

    // Step 4: Access (Review only)
    await expect(page.locator('h3')).toContainText('Access Details')
    await page.click('button:has-text("Review Details")')

    // Step 5: Preview
    await expect(page.locator('h3')).toContainText('Review Admission Details')
    await page.click('button:has-text("Confirm & Admit Student")')

    // Step 6: Success
    await expect(page.locator('h2')).toContainText('Admission Successful')
    console.log(`Student ${firstName} ${lastName} admitted successfully through UI.`)
  })
})
