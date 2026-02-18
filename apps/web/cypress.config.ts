import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    viewportWidth: 390,
    viewportHeight: 844,
    defaultCommandTimeout: 10000,
    responseTimeout: 60000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    env: {
      API_BASE: 'http://localhost:4000/api',
    },
  },
});
