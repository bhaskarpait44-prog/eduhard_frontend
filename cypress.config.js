import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'pu5dpk',
  e2e: {
    baseUrl: 'http://localhost:3000',   // Vite dev server URL
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx}',
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 10000,      // 10s wait for elements (API calls can be slow)
    requestTimeout: 15000,
    responseTimeout: 15000,
    video: false,                      // Set true to record videos
    screenshotOnRunFailure: true,
    supportFile: false,
    setupNodeEvents(on, config) {
      // Add any plugins here if needed
    },
  },
})
