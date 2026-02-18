/// <reference path="./types.d.ts" />
import './commands';

// Clear localStorage before each test to ensure clean state
beforeEach(() => {
  cy.window().then((win) => {
    win.localStorage.clear();
  });
});

// Ignore known third-party errors (ResizeObserver from vaul/dnd-kit)
Cypress.on('uncaught:exception', (err) => {
  if (
    err.message.includes('ResizeObserver loop') ||
    err.message.includes('ResizeObserver loop completed with undelivered')
  ) {
    return false;
  }
  // Let other errors fail the test
  return true;
});

// Auto-confirm window.confirm dialogs (e.g. trip deletion)
Cypress.on('window:confirm', () => true);
