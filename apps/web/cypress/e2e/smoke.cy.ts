describe('Smoke Tests', () => {
  it('loads the landing page', () => {
    cy.visit('/');
    cy.contains('Routie').should('be.visible');
    cy.contains('여행 경로 최적화').should('be.visible');
  });

  it('authenticated user can access /trips', () => {
    cy.apiLogin();
    cy.visit('/trips');
    cy.url().should('include', '/trips');
    // Should see either the trip list or the empty state
    cy.get('body').should('be.visible');
  });

  it('unauthenticated user is redirected to /login', () => {
    cy.visit('/trips');
    cy.url().should('include', '/login');
  });
});
