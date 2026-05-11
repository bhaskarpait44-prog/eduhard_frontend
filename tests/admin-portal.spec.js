import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Summary tracking
const results = [];

test.describe.serial('Admin Portal Comprehensive Test', () => {
  const screenshotDir = 'test-screenshots';

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir);
    }
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = path.join(screenshotDir, `${testInfo.title.replace(/\s+/g, '_')}-failure.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      results.push({ name: testInfo.title, status: 'FAILED', screenshot: screenshotPath });
    } else {
      results.push({ name: testInfo.title, status: 'PASSED' });
    }
  });

  test.afterAll(async () => {
    console.log('\n--- Test Summary Report ---');
    results.forEach(res => {
      console.log(`${res.status === 'PASSED' ? '✅' : '❌'} ${res.name}: ${res.status}`);
      if (res.screenshot) console.log(`   Screenshot: ${res.screenshot}`);
    });
    console.log('---------------------------\n');
  });

  test.beforeEach(async ({ page }) => {
    // Login fresh for each test group
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('#identifier');
    await page.fill('#identifier', 'admin@greenwoodacademy.edu.in');
    await page.fill('#password', 'Admin@1234');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
  });

  test('Dashboard page validation', async ({ page }) => {
    await page.waitForSelector('.grid'); // KPI cards container
    await expect(page.locator('text=Total Students')).toBeVisible();
    await expect(page.locator('text=Today\'s Attendance')).toBeVisible();
    
    // Confirm charts render
    await expect(page.locator('text=Attendance Analytics')).toBeVisible();
    
    // Sidebar links clickable
    const sidebarLinks = page.locator('nav a');
    const count = await sidebarLinks.count();
    for (let i = 0; i < count; i++) {
      await expect(sidebarLinks.nth(i)).toBeEnabled();
    }
  });

  test('Sessions page - Create and Activate', async ({ page }) => {
    const sessionName = '2025-2026';
    const startDate = '2025-04-01';
    const endDate = '2026-03-31';
    
    console.log(`>>> Starting Sessions test: ${sessionName}`);
    await page.goto('http://localhost:3000/sessions');
    await page.waitForSelector('text=Create Session');
    
    const existing = page.locator(`table >> text=${sessionName}`);
    if (await existing.isVisible()) {
      console.log('--- Session already exists, opening it.');
      await existing.click();
    } else {
      console.log('--- Creating new session...');
      await page.locator('button:has-text("Create Session")').first().click();
      await page.waitForSelector('input[name="name"]');
      await page.fill('input[name="name"]', sessionName);
      await page.fill('input[name="start_date"]', startDate);
      await page.fill('input[name="end_date"]', endDate);
      await page.click('button:has-text("Sat")');
      await page.click('button[type="submit"]:has-text("Create Session")');
      await page.waitForSelector(`table >> text=${sessionName}`, { timeout: 15000 });
      await page.click(`table >> text=${sessionName}`);
    }

    await page.waitForSelector('text=Session Details');
    console.log('--- On Session Detail page.');

    console.log('--- Adding Independence Day holiday...');
    await page.click('button:has-text("Holidays")');
    await page.click('text=Add Holiday');
    await page.waitForSelector('input[name="holiday_date"]');
    await page.fill('input[name="holiday_date"]', '2025-08-15');
    await page.fill('input[name="name"]', 'Independence Day');
    await page.selectOption('select[name="type"]', 'national');
    await page.click('button:has-text("Save Holiday")');
    await expect(page.locator('text=Independence Day').first()).toBeVisible();

    console.log('--- Adding Gandhi Jayanti holiday...');
    await page.click('text=Add Holiday');
    await page.waitForSelector('input[name="holiday_date"]');
    await page.fill('input[name="holiday_date"]', '2025-10-02');
    await page.fill('input[name="name"]', 'Gandhi Jayanti');
    await page.selectOption('select[name="type"]', 'national');
    await page.click('button:has-text("Save Holiday")');
    await expect(page.locator('text=Gandhi Jayanti').first()).toBeVisible();

    const activateBtn = page.locator('button:has-text("Activate Session")');
    if (await activateBtn.isVisible()) {
      console.log('--- Activating session...');
      await activateBtn.click();
      await page.waitForSelector('button:has-text("Yes, Activate")');
      await page.click('button:has-text("Yes, Activate")'); 
      await page.waitForSelector('text=Active', { timeout: 10000 });
      await expect(page.locator('text=Active').first()).toBeVisible();
    }
    console.log('>>> Sessions test complete.');
  });

  test('Classes page - Create Class, Section, and Subject', async ({ page }) => {
    console.log('Starting Classes test...');
    await page.goto('http://localhost:3000/classes');
    await page.waitForSelector('text=Add New Class');
    await page.click('text=Add New Class');

    console.log('Filling Class form...');
    await page.waitForSelector('input[name="name"]');
    await page.fill('input[name="name"]', 'Class 1');
    await page.fill('input[name="order_number"]', '1');
    await page.click('button:has-text("Save Class")');
    await page.waitForSelector('text=Class 1');
    await expect(page.locator('text=Class 1').first()).toBeVisible();

    // Detail page
    console.log('Opening Class detail...');
    await page.click('text=Class 1 >> nth=0');
    await page.waitForSelector('text=Add Section');

    // Add Section A
    console.log('Adding Section A...');
    await page.click('text=Add Section');
    await page.waitForSelector('input[name="name"]');
    await page.fill('input[name="name"]', 'A');
    await page.fill('input[name="capacity"]', '20');
    await page.click('button:has-text("Add Section")');
    await expect(page.locator('text=Section A')).toBeVisible();

    // Add Section B
    console.log('Adding Section B...');
    await page.click('text=Add Section');
    await page.waitForSelector('input[name="name"]');
    await page.fill('input[name="name"]', 'B');
    await page.fill('input[name="capacity"]', '20');
    await page.click('button:has-text("Add Section")');
    await expect(page.locator('text=Section B')).toBeVisible();

    // Add Subject
    console.log('Adding Subject...');
    await page.click('text=Add Subject');
    await page.waitForSelector('input[name="name"]');
    await page.fill('input[name="name"]', 'Mathematics');
    await page.fill('input[name="code"]', 'MATH101');
    await page.fill('input[name="theory_total_marks"]', '100');
    await page.fill('input[name="theory_passing_marks"]', '33');
    await page.click('button:has-text("Save Subject")');
    await expect(page.locator('text=Mathematics')).toBeVisible();

    // Edit Class
    console.log('Editing Class...');
    await page.goto('http://localhost:3000/classes');
    await page.click('button[title="Edit"]');
    await page.fill('input[name="name"]', 'Class 1 Edited');
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Class 1 Edited')).toBeVisible();

    // Delete Subject
    console.log('Deleting Subject...');
    await page.click('text=Class 1 Edited');
    await page.click('button[title="Delete"]');
    await page.click('button:has-text("Delete")');
    await expect(page.locator('text=Mathematics')).not.toBeVisible();
    console.log('Classes test finished.');
  });

  test('Students page - Admission and Profile', async ({ page }) => {
    console.log('Starting Students test...');
    await page.goto('http://localhost:3000/students');
    await page.waitForSelector('text=Admit Student');
    await page.click('text=Admit Student');

    // Step 1: Identity
    console.log('Step 1: Identity');
    await page.waitForSelector('input[name="admission_no"]');
    await page.fill('input[name="admission_no"]', 'GWA0001');
    await page.fill('input[name="first_name"]', 'Aarav');
    await page.fill('input[name="last_name"]', 'Sharma');
    await page.fill('input[name="date_of_birth"]', '2012-05-15');
    await page.selectOption('select[name="gender"]', 'male');
    await page.click('button[type="submit"]');

    // Step 2: Profile
    console.log('Step 2: Profile');
    await page.waitForSelector('input[name="email"]');
    await page.fill('input[name="email"]', 'aarav.sharma1@student.greenwood.edu.in');
    await page.fill('input[name="phone"]', '9876543210');
    await page.fill('input[name="father_name"]', 'Rajesh Sharma');
    await page.fill('input[name="father_phone"]', '9876543211');
    await page.click('button[type="submit"]');

    // Step 3: Enrollment
    console.log('Step 3: Enrollment');
    await page.waitForSelector('select[name="class_id"]');
    await page.selectOption('select[name="class_id"]', { label: 'Class 1 Edited' });
    await page.selectOption('select[name="section_id"]', { label: 'Section A' });
    await page.click('button[type="submit"]');

    // Step 4: Access
    console.log('Step 4: Access');
    await page.waitForSelector('input[name="password"]');
    await page.fill('input[name="password"]', 'Student@1234');
    await page.click('button[type="submit"]');

    // Step 5: Review
    console.log('Step 5: Review');
    await page.click('button:has-text("Confirm Admission")');

    // Success
    console.log('Admission complete, verifying profile tabs...');
    await page.waitForSelector('text=Admission Complete');
    await page.click('text=View Profile');

    // Confirm tabs load
    const tabs = ['Profile', 'Identity', 'Enrollment', 'Attendance', 'Fees', 'Results', 'Documents', 'Audit Log'];
    for (const tab of tabs) {
      console.log(`Checking tab: ${tab}`);
      const tabLoc = page.locator(`button:has-text("${tab}")`);
      await expect(tabLoc).toBeVisible();
      await tabLoc.click();
    }

    // Mark as Left
    console.log('Testing Mark as Left modal...');
    await page.click('button:has-text("Mark as Left")');
    await page.waitForSelector('text=Mark Student as Left');
    await page.click('button:has-text("Cancel")');
    console.log('Students test finished.');
  });

  test('Teachers page - Create Teacher', async ({ page }) => {
    await page.goto('http://localhost:3000/teachers');
    await page.waitForSelector('text=Admit Teacher');
    await page.click('text=Admit Teacher');

    // Step 1: Identity
    await page.waitForSelector('input[name="name"]');
    await page.fill('input[name="name"]', 'Priya Sharma');
    await page.fill('input[name="email"]', 'priya.sharma@greenwood.edu.in');
    await page.fill('input[name="phone"]', '9876543220');
    await page.fill('input[name="employee_id"]', 'TCH001');
    await page.fill('input[name="department"]', 'Science');
    await page.fill('input[name="designation"]', 'Teacher');
    await page.click('button:has-text("Next")');

    // Step 2: Education
    await page.waitForSelector('input[name="highest_qualification"]');
    await page.fill('input[name="highest_qualification"]', 'M.Sc, B.Ed');
    await page.fill('input[name="years_of_experience"]', '5');
    await page.click('button:has-text("Next")');

    // Step 3: Notes
    await page.click('button:has-text("Next")');

    // Step 4: Review
    await page.click('button:has-text("Create Teacher")');
    await page.waitForSelector('text=Teacher Created');
    await expect(page.locator('text=Teacher Created')).toBeVisible();
    await page.click('button:has-text("Back to List")');
    await expect(page.locator('text=Priya Sharma')).toBeVisible();
  });

  test('Teacher Control page - Assignment', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/teacher-control');
    await page.waitForSelector('text=New Assignment');
    await page.click('text=New Assignment');

    await page.selectOption('select[label="Teacher"]', { label: 'Priya Sharma' });
    await page.selectOption('select[label="Class"]', { label: 'Class 1 Edited' });
    await page.selectOption('select[label="Section"]', { label: 'A' });
    
    // Toggle Class Teacher
    await page.click('button:has-text("Subject Teacher")'); // It toggles to Class Teacher
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Assignment created')).toBeVisible();
  });

  test('User Management page - Create Accountant', async ({ page }) => {
    await page.goto('http://localhost:3000/users/create?role=accountant');
    await page.waitForSelector('input[name="name"]');
    await page.fill('input[name="name"]', 'Finance User');
    await page.fill('input[name="email"]', 'accountant@greenwood.edu.in');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=User Created Successfully')).toBeVisible();
    
    // Test Bulk Import
    await page.goto('http://localhost:3000/users?role=accountant');
    // Check if bulk import button exists
    const bulkBtn = page.locator('button:has-text("Bulk Import")');
    if (await bulkBtn.isVisible()) {
      await bulkBtn.click();
      await expect(page.locator('text=Upload CSV')).toBeVisible();
    }
  });

  test('Notices page - Post Notice', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/notices');
    await page.waitForSelector('button:has-text("Post Notice")');
    await page.click('button:has-text("Post Notice")');

    await page.waitForSelector('input[placeholder="e.g. Annual Sports Meet 2024"]');
    await page.fill('input[placeholder="e.g. Annual Sports Meet 2024"]', 'Important Notice');
    await page.selectOption('select[label="Target Audience"]', 'school_wide');
    await page.selectOption('select[label="Priority"]', 'urgent');
    await page.fill('textarea[placeholder="Write your announcement here..."]', 'This is a test notice body.');
    await page.click('button:has-text("Broadcast Notice")');
    
    await expect(page.locator('text=Important Notice')).toBeVisible();
  });

  test('Attendance page - Mark Attendance', async ({ page }) => {
    await page.goto('http://localhost:3000/attendance');
    await page.waitForSelector('button:has-text("Mark Attendance")');
    await page.click('button:has-text("Mark Attendance")');

    await page.selectOption('select[label="Class"]', { label: 'Class 1 Edited' });
    await page.selectOption('select[label="Section"]', { label: 'A' });
    
    await page.waitForSelector('text=Aarav Sharma');
    // Mark Aarav as Present
    await page.click('button:has-text("Present")');
    await page.click('button:has-text("Save Attendance")');
    await expect(page.locator('text=Attendance saved')).toBeVisible();
  });

  test('Exams page - Create and Mark', async ({ page }) => {
    await page.goto('http://localhost:3000/exams');
    await page.waitForSelector('button:has-text("Create Exam")');
    await page.click('button:has-text("Create Exam")');

    await page.fill('input[name="name"]', 'Unit Test 1');
    await page.selectOption('select[name="exam_type"]', 'term');
    await page.selectOption('select[name="class_id"]', { label: 'Class 1 Edited' });
    await page.fill('input[name="start_date"]', '2025-06-01');
    await page.fill('input[name="end_date"]', '2025-06-10');
    
    // Add subjects (check checkboxes)
    await page.click('input[type="checkbox"]'); 
    
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Unit Test 1')).toBeVisible();

    // Enter Marks
    await page.click('button:has-text("Enter Marks")');
    await page.selectOption('select[label="Select Exam"]', { label: 'Unit Test 1' });
    await page.waitForSelector('text=Aarav Sharma');
    await page.fill('input[type="number"]', '85');
    await page.click('button:has-text("Save Marks")');
    await expect(page.locator('text=Marks saved')).toBeVisible();
  });

  test('Fees page - Structure and Payment', async ({ page }) => {
    await page.goto('http://localhost:3000/fees/structure');
    await page.waitForSelector('button:has-text("Add Component")');
    await page.click('button:has-text("Add Component")');

    await page.fill('input[label="Component Name"]', 'Tuition Fee');
    await page.fill('input[label="Amount"]', '1500');
    await page.selectOption('select[label="Frequency"]', 'monthly');
    await page.fill('input[label="Due Day"]', '10');
    await page.click('button:has-text("Create Component")');
    await expect(page.locator('text=Tuition Fee')).toBeVisible();

    // Record Payment
    await page.goto('http://localhost:3000/fees/students');
    await page.fill('input[placeholder="Search student..."]', 'Aarav Sharma');
    await page.click('text=Aarav Sharma');
    await page.waitForSelector('button:has-text("Record Payment")');
    await page.click('button:has-text("Record Payment")');
    await page.fill('input[label="Payment Amount"]', '1500');
    await page.selectOption('select[label="Payment Mode"]', 'cash');
    await page.click('button:has-text("Save Payment")');
    await expect(page.locator('text=Payment recorded')).toBeVisible();
  });

  test('Audit Log and other managers', async ({ page }) => {
    // Audit Log
    await page.goto('http://localhost:3000/audit');
    await page.waitForSelector('text=Audit Logs');
    await expect(page.locator('tr').nth(1)).toBeVisible();
    await page.click('tr.cursor-pointer >> nth=0');
    await expect(page.locator('text=Log Details')).toBeVisible();
    await page.click('button:has-text("Close")');

    // Family Manager
    await page.goto('http://localhost:3000/admin/families');
    await page.click('button:has-text("Create Family")');
    await page.fill('input[label="Family Name"]', 'Sharma Family');
    await page.fill('input[label="Primary Contact Name"]', 'Rajesh Sharma');
    await page.fill('input[label="Phone"]', '9876543211');
    await page.click('button:has-text("Save Family")');
    await expect(page.locator('text=Sharma Family')).toBeVisible();

    // Transport
    await page.goto('http://localhost:3000/admin/transport');
    await page.click('button:has-text("Add Route")');
    await page.fill('input[label="Route Name"]', 'Route 1');
    await page.click('button:has-text("Save Route")');
    await expect(page.locator('text=Route 1')).toBeVisible();

    // Inventory
    await page.goto('http://localhost:3000/admin/inventory');
    await page.click('button:has-text("Add Item")');
    await page.fill('input[label="Item Name"]', 'Whiteboard Marker');
    await page.fill('input[label="Initial Quantity"]', '50');
    await page.fill('input[label="Unit Cost"]', '120');
    await page.click('button:has-text("Save Item")');
    await expect(page.locator('text=Whiteboard Marker')).toBeVisible();

    // Staff Attendance
    await page.goto('http://localhost:3000/staff/attendance');
    await page.waitForSelector('button:has-text("Save Attendance")');
    await page.click('button:has-text("Present") >> nth=0');
    await page.click('button:has-text("Save Attendance")');
    await expect(page.locator('text=Attendance saved')).toBeVisible();

    // Analytics
    await page.goto('http://localhost:3000/dashboard'); // Dashboard is analytics
    await expect(page.locator('text=Attendance Analytics')).toBeVisible();
  });
});
