import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

test('Inspect Admission Form Dropdowns', async ({ page }) => {
    test.setTimeout(60000)
    // 1. Login
    console.log(`Navigating to ${BASE_URL}/login`)
    await page.goto(`${BASE_URL}/login`)
    console.log('Page loaded, waiting for email input')
    await page.waitForSelector('input[type="email"]', { timeout: 15000 })
    await page.fill('input[type="email"]', 'admin@greenwoodacademy.edu.in')
    await page.fill('input[type="password"]', 'Admin@1234')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*dashboard/)

    await page.goto(`${BASE_URL}/students/new`)
    
    // Fill first two steps quickly with dummy data to reach Step 3
    await page.fill('input[name="first_name"]', 'Probe')
    await page.fill('input[name="last_name"]', 'Student')
    await page.fill('input[name="date_of_birth"]', '2015-01-01')
    await page.selectOption('select[name="gender"]', 'male')
    await page.click('button:has-text("Continue to Profile")')

    await page.fill('textarea[name="address"]', 'Probe Address')
    await page.fill('input[name="city"]', 'Probe City')
    await page.fill('input[name="state"]', 'Probe State')
    await page.fill('input[name="pincode"]', '123456')
    await page.fill('input[name="phone"]', '9999999999')
    await page.fill('input[name="father_name"]', 'Probe Father')
    await page.fill('input[name="mother_name"]', 'Probe Mother')
    await page.click('button:has-text("Continue to Enrollment")')

    // Inspect classes
    await page.waitForSelector('select[name="class_id"] option:not([value=""])')
    const classOptions = await page.locator('select[name="class_id"] option').allInnerTexts()
    console.log('Class Options in UI:', JSON.stringify(classOptions))

    // Select first class to see sections
    await page.selectOption('select[name="class_id"]', { index: 1 })
    await page.waitForSelector('select[name="section_id"] option:not([value=""])')
    const sectionOptions = await page.locator('select[name="section_id"] option').allInnerTexts()
    console.log('Section Options in UI:', JSON.stringify(sectionOptions))
})
