describe('Trip CRUD', () => {
  beforeEach(() => {
    cy.apiLogin();
  });

  afterEach(() => {
    cy.cleanupTrips();
  });

  describe('Trip List', () => {
    it('shows empty state when no trips exist', () => {
      cy.cleanupTrips();
      cy.visit('/trips');
      cy.contains('첫 여행을 계획해볼까요?', { timeout: 10000 }).should(
        'be.visible',
      );
    });

    it('shows trip cards after seeding', () => {
      cy.seedTrip({ title: '도쿄 여행' });
      cy.visit('/trips');
      cy.contains('도쿄 여행', { timeout: 10000 }).should('be.visible');
    });

    it('navigates to trip detail on card click', () => {
      cy.seedTrip({ title: '클릭 테스트 여행' }).then((trip) => {
        cy.visit('/trips');
        cy.contains('클릭 테스트 여행', { timeout: 10000 }).click();
        cy.url().should('include', `/trips/${trip.id}`);
      });
    });
  });

  describe('Trip Creation Wizard', () => {
    it('completes 3-step wizard and creates trip', () => {
      cy.visit('/trips/new');
      cy.contains('어디로 떠나시나요?').should('be.visible');

      // Step 1: Focus search input to show popular cities, then pick one
      cy.get('input[placeholder*="도시를 검색하세요"]').click();
      cy.contains('인기 여행지', { timeout: 5000 }).should('be.visible');
      cy.contains('button', '도쿄').click();
      cy.contains('button', '다음').click();

      // Step 2: Dates
      cy.contains('언제 떠나시나요?').should('be.visible');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 3);

      const formatDate = (d: Date) => d.toISOString().split('T')[0]!;
      cy.get('input[type="date"]').first().type(formatDate(tomorrow));
      cy.get('input[type="date"]').last().type(formatDate(dayAfter));
      cy.contains('button', '다음').click();

      // Step 3: Transport
      cy.contains('여행 스타일을 알려주세요').should('be.visible');
      cy.contains('대중교통').click();
      cy.contains('button', '여행 만들기').click();

      // Should redirect to trip detail page
      cy.url({ timeout: 15000 }).should('match', /\/trips\/[a-zA-Z0-9-]+$/);
    });
  });

  describe('Trip Detail', () => {
    it('shows trip header info and tabs', () => {
      cy.seedTrip({ title: '상세 테스트 여행', city: '도쿄' }).then((trip) => {
        cy.visit(`/trips/${trip.id}`);
        cy.contains('상세 테스트 여행', { timeout: 10000 }).should(
          'be.visible',
        );
        cy.contains('도쿄').should('be.visible');
        cy.contains('장소').should('be.visible');
        cy.contains('경로').should('be.visible');
      });
    });

    it('shows empty state in places tab', () => {
      cy.seedTrip().then((trip) => {
        cy.visit(`/trips/${trip.id}`);
        cy.contains('아직 장소가 없습니다', { timeout: 10000 }).should(
          'be.visible',
        );
      });
    });
  });

  describe('Trip Deletion', () => {
    it('deletes a trip and redirects to list', () => {
      cy.seedTrip({ title: '삭제할 여행' }).then((trip) => {
        cy.visit(`/trips/${trip.id}`);
        cy.contains('삭제할 여행', { timeout: 10000 }).should('be.visible');

        // Click the delete button (trash icon)
        cy.get('svg path[d="M3 6h18"]').parent().click();

        // window.confirm is auto-accepted by support/e2e.ts
        cy.url({ timeout: 10000 }).should('match', /\/trips$/);
      });
    });

    it('deleted trip no longer appears in list', () => {
      cy.seedTrip({ title: '사라질 여행' }).then((trip) => {
        // Delete via API
        const token = window.localStorage.getItem('accessToken');
        cy.request({
          method: 'DELETE',
          url: `${Cypress.env('API_BASE')}/trips/${trip.id}`,
          headers: { Authorization: `Bearer ${token}` },
        });

        cy.visit('/trips');
        cy.contains('사라질 여행').should('not.exist');
      });
    });
  });
});
