// cypress/e2e/admit_10_students.cy.js
// ──────────────────────────────────────────────────────────────────────────────
// End-to-end test: Admit 10 New Students in LKG (filling mandatory and non-mandatory fields)
// App: EduCore (eduhard_frontend)
// URL: http://localhost:3000
// ──────────────────────────────────────────────────────────────────────────────

describe('Admit 10 Students in LKG', () => {

  // ─── Run before every test: login as admin ────────────────────────────────
  beforeEach(() => {
    cy.visit('/login')

    // Fill login form
    cy.get('input[name="identifier"]').type('admin@greenwoodacademy.edu.in')
    cy.get('input[name="password"]').type('Admin@1234')
    cy.get('button[type="submit"]').click()

    // Wait until dashboard loads
    cy.url().should('include', '/dashboard', { timeout: 20000 })
  })

  const students = [
    { first: 'Aarav', last: 'Sharma' },
    { first: 'Vivaan', last: 'Patel' },
    { first: 'Aditya', last: 'Verma' },
    { first: 'Kabir', last: 'Singh' },
    { first: 'Diya', last: 'Sen' },
    { first: 'Ira', last: 'Das' },
    { first: 'Ananya', last: 'Joshi' },
    { first: 'Rohan', last: 'Mehta' },
    { first: 'Siddharth', last: 'Rao' },
    { first: 'Avani', last: 'Nair' }
  ];

  students.forEach((student, index) => {
    it(`should admit student ${index + 1}: ${student.first} ${student.last} in LKG`, () => {
      // ── Navigate to Admit Student page ──────────────────────────────────────
      cy.visit('/students/new')
      cy.contains('Admit New Student').should('be.visible')

      // ════════════════════════════════════════════════════════════════════════
      // STEP 1 — Identity (Mandatory & Non-Mandatory)
      // ════════════════════════════════════════════════════════════════════════
      cy.log('STEP 1: Identity')

      // First Name
      cy.get('input[name="first_name"]').clear().type(student.first)

      // Last Name
      cy.get('input[name="last_name"]').clear().type(student.last)

      // Date of Birth
      cy.get('.ant-picker input').click().type('{selectall}{backspace}10-05-2021{esc}')

      // Gender
      cy.get('select[name="gender"]').select(index % 2 === 0 ? 'male' : 'female')

      // Aadhar No. (Non-mandatory)
      const uniqueAadhar = '12345678901' + index;
      cy.get('input[name="aadhar_no"]').clear().type(uniqueAadhar)

      // Admission Number (Mandatory)
      const uniqueAdmissionNo = 'ADM-LKG-' + Date.now().toString().slice(-4) + index;
      cy.get('input[name="admission_no"]').clear().type(uniqueAdmissionNo)

      // Click Continue
      cy.contains('button', 'Continue to Profile').click()

      // Confirm we moved to Step 2
      cy.contains(/identity details/i).should('be.visible')

      // ════════════════════════════════════════════════════════════════════════
      // STEP 2 — Profile (Contact & Family) (Mandatory & Non-Mandatory)
      // ════════════════════════════════════════════════════════════════════════
      cy.log('STEP 2: Profile')

      cy.get('input[name="nationality"]').clear().type('Indian')
      cy.get('select[name="religion"]').select('Hinduism')
      cy.get('select[name="caste"]').select('Gen')
      cy.get('input[name="mother_tongue"]').clear().type('Hindi')

      // Non-mandatory govt IDs
      cy.get('input[name="pen_no"]').clear().type('PEN' + Date.now().toString().slice(-6) + index)
      cy.get('input[name="apaar_id"]').clear().type('APAAR' + Date.now().toString().slice(-6) + index)
      cy.get('input[name="identification_marks"]').clear().type('Mole on right hand')

      // Current Address
      cy.get('textarea[name="address"]').clear().type('123 Green Street')
      cy.get('input[name="village"]').clear().type('Guwahati')
      cy.get('input[name="police_station"]').clear().type('Guwahati PS')
      cy.get('input[name="post_office"]').clear().type('Guwahati PO')
      cy.get('input[name="district"]').clear().type('Kamrup')
      cy.get('input[name="city"]').clear().type('Guwahati')
      cy.get('input[name="state"]').clear().type('Assam')
      cy.get('input[name="pincode"]').clear().type('781001')

      // Contact
      const uniquePhone = '9876543' + String(100 + index);
      cy.get('input[name="phone"]').clear().type(uniquePhone)
      
      const uniqueEmail = `${student.first.toLowerCase()}.${student.last.toLowerCase()}${index}@example.com`;
      cy.get('input[name="email"]').clear().type(uniqueEmail)

      // Mother's Info (Non-mandatory)
      cy.get('input[name="mother_name"]').clear().type('Sunita Sharma')
      cy.get('input[name="mother_qualification"]').clear().type('M.A.')
      const uniqueMPhone = '9876542' + String(100 + index);
      cy.get('input[name="mother_phone"]').clear().type(uniqueMPhone)
      
      const uniqueMEmail = `mother.${student.first.toLowerCase()}${index}@example.com`;
      cy.get('input[name="mother_email"]').clear().type(uniqueMEmail)
      cy.get('input[name="mother_occupation"]').clear().type('Homemaker')
      const uniqueMAadhar = '23456789012' + index;
      cy.get('input[name="mother_aadhar"]').clear().type(uniqueMAadhar)
      cy.get('input[name="mother_annual_income"]').clear().type('300000')

      // Father's Info (Mandatory as per schema)
      cy.get('input[name="father_name"]').clear().type('Rajesh Sharma')
      cy.get('input[name="father_occupation"]').clear().type('Engineer')
      cy.get('input[name="father_qualification"]').clear().type('B.Tech')
      const uniqueFPhone = '9876541' + String(100 + index);
      cy.get('input[name="father_phone"]').clear().type(uniqueFPhone)
      
      const uniqueFEmail = `father.${student.first.toLowerCase()}${index}@example.com`;
      cy.get('input[name="parent_email"]').clear().type(uniqueFEmail)
      const uniqueFAadhar = '34567890123' + index;
      cy.get('input[name="father_aadhar"]').clear().type(uniqueFAadhar)
      cy.get('input[name="father_annual_income"]').clear().type('500000')

      // Guardian's Info (Non-mandatory)
      cy.get('input[name="guardian_name"]').clear().type('Uncle Sam')
      cy.get('input[name="guardian_relation"]').clear().type('Uncle')
      const uniqueGPhone = '9876540' + String(100 + index);
      cy.get('input[name="guardian_phone"]').clear().type(uniqueGPhone)
      cy.get('input[name="guardian_qualification"]').clear().type('Graduate')
      cy.get('input[name="guardian_occupation"]').clear().type('Business')
      const uniqueGAadhar = '45678901234' + index;
      cy.get('input[name="guardian_aadhar"]').clear().type(uniqueGAadhar)
      
      const uniqueGEmail = `guardian.${student.first.toLowerCase()}${index}@example.com`;
      cy.get('input[name="guardian_email"]').clear().type(uniqueGEmail)

      // Medical & Emergency (Mandatory / Non-mandatory)
      cy.get('input[name="emergency_contact"]').clear().type('9876543213')
      cy.get('select[name="blood_group"]').select('O+')
      cy.get('textarea[name="medical_notes"]').clear().type('Allergic to pollen')

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

      // Select LKG Class
      cy.contains('label', 'Class').parent().find('select', { timeout: 15000 })
        .should('not.be.disabled')
        .find('option')
        .contains('LKG')
        .then(($option) => {
          cy.contains('label', 'Class').parent().find('select').select($option.val())
        })

      // Select Section
      cy.contains('label', 'Section').parent().find('select', { timeout: 15000 })
        .should('not.be.disabled')
        .find('option')
        .should('have.length.gt', 1)
      
      cy.contains('label', 'Section').parent().find('select').select(1)

      // Stream, Medium, Joining Type (Non-mandatory and mandatory)
      cy.contains('label', 'Stream').parent().find('select').then(($select) => {
        if (!$select.is(':disabled')) {
          cy.wrap($select).select('regular')
        }
      })
      cy.contains('label', 'Medium').parent().find('select').select('English')
      cy.contains('label', 'Joining Type').parent().find('select').select('fresh')
      cy.contains('label', 'Joining Date').parent().find('.ant-picker input').click().type('{selectall}{backspace}01-04-2026{esc}')
      cy.contains('label', 'Hostel Required').parent().find('select').select('No')
      cy.contains('label', 'Distance from School').parent().find('input').clear().type('1.5')
      cy.contains('label', 'Prev. Year Attendance').parent().find('input').clear().type('180')
      cy.contains('label', 'Roll Number').parent().find('input').clear().type(String(200 + index))

      // Continue to Documents
      cy.contains('button', /continue to documents/i).click()

      // ════════════════════════════════════════════════════════════════════════
      // STEP 4 — Documents (Upload Scans)
      // ════════════════════════════════════════════════════════════════════════
      cy.log('STEP 4: Documents (skip uploads)')

      // Wait for the next step's heading (Digital Documents)
      cy.contains('h3', /digital documents/i, { timeout: 15000 }).should('be.visible')

      // Click "Continue to Access" button
      cy.contains('button', /continue|access/i).click()

      // Confirm Step 5
      cy.contains(/access details/i).should('be.visible')

      // ════════════════════════════════════════════════════════════════════════
      // STEP 5 — Access (Review Login Info)
      // ════════════════════════════════════════════════════════════════════════
      cy.log('STEP 5: Access (review info)')

      cy.contains('button', /continue|review/i).click()

      // Confirm Step 6
      cy.contains(/review admission details/i).should('be.visible')

      // ════════════════════════════════════════════════════════════════════════
      // STEP 6 — Review & Submit
      // ════════════════════════════════════════════════════════════════════════
      cy.log('STEP 6: Review and Submit')

      // Verify student name appears in the preview
      cy.contains(student.first).should('be.visible')
      cy.contains(student.last).should('be.visible')

      // Click the final submit/confirm button
      cy.contains('button', /confirm|admit|submit/i).click()

      // ════════════════════════════════════════════════════════════════════════
      // STEP 7 — Success
      // ════════════════════════════════════════════════════════════════════════
      cy.log('STEP 7: Success')

      // The success screen should appear
      cy.contains(/student admitted!|admission complete|successfully admitted/i, { timeout: 20000 })
        .should('be.visible')
    })
  })

})
