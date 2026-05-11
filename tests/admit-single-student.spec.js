import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

test('Admit Single Student - Human-Like Flow', async ({ page }) => {
    test.setTimeout(120000)

    console.log('1. Navigating to Login...')
    await page.goto(`${BASE_URL}/login`)
    
    console.log('2. Logging in...')
    await page.waitForSelector('#identifier')
    await page.fill('#identifier', 'admin@greenwoodacademy.edu.in')
    await page.fill('#password', 'Admin@1234')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/.*dashboard/)
    console.log('   Login successful.')

    console.log('3. Navigating to Admit Student page...')
    await page.goto(`${BASE_URL}/students/new`)
    await page.waitForSelector('h1:has-text("Admit New Student")')

    const ts = Date.now()
    const firstName = 'Success'
    const lastName = `Student-${ts}`

    console.log('4. Step 1: Identity...')
    await page.waitForSelector('input[name="first_name"]')
    await page.type('input[name="first_name"]', firstName, { delay: 50 })
    await page.type('input[name="last_name"]', lastName, { delay: 50 })
    await page.fill('input[name="date_of_birth"]', '2015-05-15')
    await page.selectOption('select[name="gender"]', 'male')
    
    // Ensure Admission No is present
    const admNo = await page.inputValue('input[name="admission_no"]')
    console.log(`   Using Admission No: ${admNo}`)
    
    await page.click('button:has-text("Continue to Profile")')

    console.log('5. Step 2: Profile...')
    await page.waitForSelector('input[name="email"]')
    await page.type('input[name="email"]', `std.${ts}@example.com`, { delay: 30 })
    await page.fill('textarea[name="address"]', '123 Test Road')
    await page.fill('input[name="city"]', 'Test City')
    await page.fill('input[name="state"]', 'Test State')
    await page.fill('input[name="pincode"]', '123456')
    await page.fill('input[name="phone"]', '9876543210')
    await page.fill('input[name="father_name"]', 'Father Test')
    await page.click('button:has-text("Continue to Enrollment")')

    console.log('6. Step 3: Enrollment...')
    // WAIT for the session data to load - this is the critical fix
    console.log('   Waiting for Active Session indicator...')
    await expect(page.locator('text=Enrolling in current session')).toBeVisible({ timeout: 15000 })
    
    console.log('   Selecting Class...')
    await page.waitForSelector('select[name="class_id"] option:not([value=""])')
    await page.selectOption('select[name="class_id"]', { index: 1 })
    
    console.log('   Waiting for Sections to load...')
    await page.waitForResponse(r => r.url().includes('/api/classes/') && r.url().includes('/sections') && r.status() === 200)
    await page.waitForSelector('select[name="section_id"] option:not([value=""])')
    await page.selectOption('select[name="section_id"]', { index: 1 })

    await page.click('button:has-text("Continue to Access")')

    console.log('7. Step 4: Access...')
    await page.waitForSelector('button:has-text("Review Details")')
    await page.click('button:has-text("Review Details")')

    console.log('8. Step 5: Preview...')
    await page.waitForSelector('button:has-text("Confirm & Admit Student")')
    await page.click('button:has-text("Confirm & Admit Student")')

    console.log('9. Waiting for Success Message...')
    await expect(page.locator('h2')).toContainText('Student Admitted!', { timeout: 30000 })
    
    console.log(`SUCCESS: Student ${firstName} ${lastName} admitted!`)
})
