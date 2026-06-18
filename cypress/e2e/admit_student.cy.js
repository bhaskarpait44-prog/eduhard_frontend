// cypress/e2e/admit_student.cy.js
// ──────────────────────────────────────────────────────────────────────────────
// End-to-end test: Admit a New Student (6-step wizard)
// App: EduCore (eduhard_frontend)
// URL: http://localhost:3000
// ──────────────────────────────────────────────────────────────────────────────

describe('Admit New Student', () => {

  // ─── Run before every test: login as admin ────────────────────────────────
  beforeEach(() => {
    cy.visit('/login')

    // Fill login form
    cy.get('input[name="identifier"]').type('admin@greenwoodacademy.edu.in')
    cy.get('input[name="password"]').type('Admin@1234')
    cy.get('button[type="submit"]').click()

    // Wait until dashboard loads (login is complete)
    cy.url().should('include', '/dashboard', { timeout: 20000 })
  })

  // ─── Main Test ────────────────────────────────────────────────────────────
  it('should admit a new student through all 6 steps', () => {

    // ── Navigate to Admit Student page ──────────────────────────────────────
    cy.visit('/students/new')
    cy.contains('Admit New Student').should('be.visible')

    // ════════════════════════════════════════════════════════════════════════
    // STEP 1 — Identity
    // ════════════════════════════════════════════════════════════════════════
    cy.log('STEP 1: Identity')

    // First Name
    cy.get('input[name="first_name"]').clear().type('Riya')

    // Last Name
    cy.get('input[name="last_name"]').clear().type('Sharma')

    // Date of Birth
    cy.get('input[name="date_of_birth"]').type('2010-06-15')

    // Gender — select "Female"
    cy.get('select[name="gender"]').select('female')

    // Admission Number — auto-generated, but we override with a unique one
    cy.get('input[name="admission_no"]')
      .clear()
      .type('ADM-2025-' + Date.now().toString().slice(-4))

    // Click Continue
    cy.contains('button', 'Continue to Profile').click()

    // Confirm we moved to Step 2
    cy.contains(/identity details/i).should('be.visible')

    // ════════════════════════════════════════════════════════════════════════
    // STEP 2 — Profile (Contact & Family)
    // ════════════════════════════════════════════════════════════════════════
    cy.log('STEP 2: Profile')

    cy.get('input[name="nationality"]').clear().type('Indian')
    cy.get('select[name="religion"]').select('Hindu')
    cy.get('select[name="caste"]').select('Gen')
    cy.get('input[name="mother_tongue"]').clear().type('Assamese')

    // Address
    cy.get('textarea[name="address"]').clear().type('House No. 5, MG Road')
    cy.get('input[name="village"]').clear().type('Noonmati')
    cy.get('input[name="police_station"]').clear().type('Noonmati PS')
    cy.get('input[name="post_office"]').clear().type('Noonmati PO')
    cy.get('input[name="district"]').clear().type('Kamrup')
    cy.get('input[name="city"]').clear().type('Guwahati')
    cy.get('input[name="state"]').clear().type('Assam')
    cy.get('input[name="pincode"]').clear().type('781020')

    // Contact
    cy.get('input[name="phone"]').clear().type('9876543210')
    cy.get('input[name="email"]').clear().type('riya.sharma@example.com')

    // Father's Info
    cy.get('input[name="father_name"]').clear().type('Rajesh Sharma')
    cy.get('input[name="father_phone"]').clear().type('9876543211')
    cy.get('input[name="father_email"]').clear().type('rajesh.sharma@example.com')

    // Mother's Info
    cy.get('input[name="mother_name"]').clear().type('Sunita Sharma')

    // Medical & Emergency
    cy.get('input[name="emergency_contact"]').clear().type('9876543213')
    cy.get('select[name="blood_group"]').select('O+')

    // Permanent address same as current (check the checkbox)
    cy.get('input[name="is_permanent_same"]').check()

    // Click Continue to Enrollment
    cy.contains('button', /continue|enrollment/i).click()

    // Confirm Step 3
    cy.contains(/enrollment/i).should('be.visible')

    // ════════════════════════════════════════════════════════════════════════
    // STEP 3 — Enrollment (Class Assignment)
    // ════════════════════════════════════════════════════════════════════════
    cy.log('STEP 3: Enrollment')

    // Wait for session to load
    cy.contains(/enrolling in current session/i, { timeout: 10000 }).should('be.visible')

    // Select Class (wait for it to load from API)
    cy.get('select[name="class_id"]', { timeout: 10000 })
      .should('not.be.disabled')
      .select(1) // Select the first class (after placeholder)

    // Select Section (wait for it to load after class selection)
    cy.get('select[name="section_id"]', { timeout: 10000 })
      .should('not.be.disabled')
      .find('option')
      .should('have.length.gt', 1) // Ensure there's at least one section besides the placeholder
    
    cy.get('select[name="section_id"]').select(1)

    // Joining Type
    cy.get('select[name="joining_type"]').select('fresh')

    // Joining Date
    cy.get('input[name="joined_date"]').clear().type('2025-06-17')

    // Roll Number (optional)
    cy.get('input[name="roll_number"]').clear().type('101')

    // Verify session_id is not empty (it's hidden)
    cy.get('input[name="session_id"]').should('not.have.value', '')

    // Continue to Documents
    cy.contains('button', /continue to documents/i).click()

    // Wait for the next step's heading (Digital Documents)
    cy.contains('h3', /digital documents/i, { timeout: 15000 }).should('be.visible')

    // ════════════════════════════════════════════════════════════════════════
    // STEP 4 — Documents (Upload Scans)
    // Skipping file uploads — handling the "Skip for now" confirmation
    // ════════════════════════════════════════════════════════════════════════
    cy.log('STEP 4: Documents (skip uploads)')

    // Stub window:confirm to accept the skip
    cy.on('window:confirm', () => true)

    // Click "Skip for now" button
    cy.contains('button', /skip for now/i).click()

    // Confirm Step 5
    cy.contains(/access details/i).should('be.visible')

    // ════════════════════════════════════════════════════════════════════════
    // STEP 5 — Access (Review Login Info)
    // This step only shows info — no input needed. Just click Continue.
    // ════════════════════════════════════════════════════════════════════════
    cy.log('STEP 5: Access (review info)')

    cy.contains('riya.sharma@example.com').should('be.visible')
    cy.contains('button', /continue|review/i).click()

    // Confirm Step 6
    cy.contains(/review admission details/i).should('be.visible')

    // ════════════════════════════════════════════════════════════════════════
    // STEP 6 — Review & Submit
    // ════════════════════════════════════════════════════════════════════════
    cy.log('STEP 6: Review and Submit')

    // Verify student name appears in the preview
    cy.contains('Riya').should('be.visible')
    cy.contains('Sharma').should('be.visible')

    // Click the final submit/confirm button
    cy.contains('button', /confirm|admit|submit/i).click()

    // ════════════════════════════════════════════════════════════════════════
    // STEP 7 — Success
    // ════════════════════════════════════════════════════════════════════════
    cy.log('STEP 7: Success')

    // The success screen should appear
    cy.contains(/student admitted!|admission complete|successfully admitted/i, { timeout: 15000 })
      .should('be.visible')

    // Optionally verify "View Profile" button is present
    cy.contains('button', /view profile/i).should('be.visible')
  })


  // ─── Test: Validation on Step 1 ──────────────────────────────────────────
  it('should show validation errors if Step 1 is submitted empty', () => {
    cy.visit('/students/new')

    // Clear the auto-generated admission number and try submitting
    cy.get('input[name="first_name"]').clear()
    cy.get('input[name="last_name"]').clear()
    cy.get('input[name="admission_no"]').clear()

    cy.contains('button', 'Continue to Profile').click()

    // Error messages should appear
    cy.contains(/required|first name|last name/i).should('be.visible')
  })

})
