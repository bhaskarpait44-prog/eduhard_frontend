// cypress/e2e/create_holidays.cy.js
// ──────────────────────────────────────────────────────────────────────────────
// Automated setup: Create Indian Holidays for the 2027-2028 session
// Session Range: 01 Apr 2027 — 31 Mar 2028
// ──────────────────────────────────────────────────────────────────────────────

describe('Create Indian Holidays (2027-2028)', () => {

  const holidays = [
    // 2027
    { date: '2027-04-14', name: 'Ambedkar Jayanti / Bohag Bihu', type: 'national' },
    { date: '2027-04-15', name: 'Ram Navami', type: 'national' },
    { date: '2027-04-19', name: 'Mahavir Jayanti', type: 'national' },
    { date: '2027-05-17', name: 'Bakrid (Eid-ul-Adha)', type: 'national' },
    { date: '2027-05-20', name: 'Buddha Purnima', type: 'national' },
    { date: '2027-06-16', name: 'Muharram', type: 'national' },
    { date: '2027-08-15', name: 'Independence Day', type: 'national' },
    { date: '2027-08-16', name: 'Milad-un-Nabi', type: 'national' },
    { date: '2027-08-17', name: 'Raksha Bandhan', type: 'national' },
    { date: '2027-08-25', name: 'Janmashtami', type: 'national' },
    { date: '2027-10-02', name: 'Gandhi Jayanti', type: 'national' },
    { date: '2027-10-09', name: 'Dussehra', type: 'national' },
    { date: '2027-10-29', name: 'Diwali', type: 'national' },
    { date: '2027-11-14', name: 'Guru Nanak Jayanti', type: 'national' },
    { date: '2027-12-25', name: 'Christmas', type: 'national' },

    // 2028
    { date: '2028-01-26', name: 'Republic Day', type: 'national' },
    { date: '2028-02-23', name: 'Maha Shivaratri', type: 'national' },
    { date: '2028-02-27', name: 'Eid-ul-Fitr', type: 'national' },
    { date: '2028-03-11', name: 'Holi', type: 'national' },

    // Regional (Assam)
    { date: '2027-06-22', name: 'Ambubachi Mela', type: 'regional' },
    { date: '2027-10-18', name: 'Kati Bihu', type: 'regional' },
    { date: '2028-01-15', name: 'Magh Bihu', type: 'regional' },
  ];

  beforeEach(() => {
    // 1. Login as admin
    cy.visit('/login')
    cy.get('input[name="identifier"]').type('admin@greenwoodacademy.edu.in')
    cy.get('input[name="password"]').type('Admin@1234')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/dashboard', { timeout: 20000 })

    // 2. Navigate to Sessions and find the 2027-2028 session
    cy.visit('/sessions')
    
    // Use the search bar to ensure it's found even if on another page
    cy.get('input[placeholder*="Search sessions"]').clear().type('2027-2028{enter}')
    
    // Wait for the session and click the 'View' button
    cy.contains(/2027-2028/i, { timeout: 15000 }).should('be.visible')
    cy.contains('button', /view/i).first().click()

    // 3. Confirm we are on the session detail page
    cy.url().should('include', '/sessions/')
  })

  it('should add all Indian holidays for 2027-2028', () => {
    // Switch to Holidays tab
    cy.contains('button', /holidays/i).click()

    holidays.forEach((holiday) => {
      cy.get('body').then(($body) => {
        if ($body.text().includes(holiday.name)) {
          cy.log(`Skipping existing holiday: ${holiday.name}`)
        } else {
          cy.log(`Adding holiday: ${holiday.name}`)
          
          // Click Add Holiday button
          cy.contains('button', /add holiday/i).click()

          // Fill the modal
          cy.get('input[name="holiday_date"]').type(holiday.date)
          cy.get('input[name="name"]').type(holiday.name)
          cy.get('select[name="type"]').select(holiday.type)

          // Save
          cy.contains('button', /save holiday/i).then(($btn) => {
            if ($btn.is(':disabled')) {
              cy.log(`Skipping ${holiday.name} - Button is disabled (likely date conflict)`)
              cy.contains('button', /cancel/i).click()
            } else {
              cy.wrap($btn).click()
              // Success toast check
              cy.contains(`Holiday "${holiday.name}" added`).should('be.visible')
            }
          })
        }
      })
    })
  })
})
