describe('Route Optimization', () => {
  // Verified Google Place IDs for Tokyo landmarks (New Places API format)
  const TOKYO_PLACES = {
    sensoji: 'ChIJ8T1GpMGOGGARDYGSgpooDWw',
    tokyoTower: 'ChIJCewJkL2LGGAR3Qmk0vCTGkg',
    meijiShrine: 'ChIJ5SZMmreMGGARcz8QSTiJyo8',
  };

  beforeEach(() => {
    cy.apiLogin();
  });

  afterEach(() => {
    cy.cleanupTrips();
  });

  describe('Place Search & Add (UI)', () => {
    it('searches and adds a place from the detail page', () => {
      cy.seedTrip().then((trip) => {
        cy.visit(`/trips/${trip.id}`);
        cy.contains('아직 장소가 없습니다', { timeout: 10000 }).should(
          'be.visible',
        );

        // Type in the place search box
        cy.get('input[placeholder="장소를 검색하세요..."]').type('도쿄타워');

        // Wait for results and click the add (+) button on the first result
        cy.get('.absolute.z-30', { timeout: 15000 }).should('be.visible');
        cy.get('.absolute.z-30 button').first().click();

        // A place should now appear in the list
        cy.contains('아직 장소가 없습니다', { timeout: 10000 }).should(
          'not.exist',
        );
      });
    });
  });

  describe('Route Generation', () => {
    it('generates routes after seeding 3 places', () => {
      cy.seedTripWithPlaces(Object.values(TOKYO_PLACES)).then(({ trip }) => {
        cy.visit(`/trips/${trip.id}`);

        // Wait for places to load
        cy.contains('장소', { timeout: 10000 }).should('be.visible');

        // Click "경로 생성하기"
        cy.contains('button', '경로 생성하기', { timeout: 10000 }).click();

        // Wait for optimization (LLM call, up to 60s)
        cy.contains('경로', { timeout: 60000 }).should('be.visible');

        // Should auto-switch to routes tab or we click it
        cy.contains('경로').click();

        // Should see route types
        cy.contains('효율', { timeout: 30000 }).should('be.visible');
      });
    });

    it('shows AI reasoning for the generated route', () => {
      cy.seedTripWithPlaces(Object.values(TOKYO_PLACES)).then(({ trip }) => {
        cy.visit(`/trips/${trip.id}`);

        cy.contains('button', '경로 생성하기', { timeout: 10000 }).click();

        // Wait for routes to appear
        cy.contains('경로').click();
        cy.contains('효율', { timeout: 60000 }).should('be.visible');

        // AI reasoning should be visible (gradient card with reasoning text)
        cy.get('[class*="from-primary-50"]', { timeout: 10000 }).should(
          'exist',
        );
      });
    });

    it('shows route summary with place count, duration, and distance', () => {
      cy.seedTripWithPlaces(Object.values(TOKYO_PLACES)).then(({ trip }) => {
        cy.visit(`/trips/${trip.id}`);

        cy.contains('button', '경로 생성하기', { timeout: 10000 }).click();
        cy.contains('경로').click();
        cy.contains('효율', { timeout: 60000 }).should('be.visible');

        // Route summary grid
        cy.contains('방문 장소').should('be.visible');
        cy.contains('총 소요').should('be.visible');
        cy.contains('이동 거리').should('be.visible');
      });
    });

    it('allows switching between route types', () => {
      cy.seedTripWithPlaces(Object.values(TOKYO_PLACES)).then(({ trip }) => {
        cy.visit(`/trips/${trip.id}`);

        cy.contains('button', '경로 생성하기', { timeout: 10000 }).click();
        cy.contains('경로').click();

        // Wait for routes
        cy.contains('효율', { timeout: 60000 }).should('be.visible');

        // Click "여유" route type
        cy.contains('여유').click();
        cy.contains('방문 장소').should('be.visible');

        // Click "맞춤" route type
        cy.contains('맞춤').click();
        cy.contains('방문 장소').should('be.visible');
      });
    });

    it('confirms a route', () => {
      cy.seedTripWithPlaces(Object.values(TOKYO_PLACES)).then(({ trip }) => {
        cy.visit(`/trips/${trip.id}`);

        cy.contains('button', '경로 생성하기', { timeout: 10000 }).click();
        cy.contains('경로').click();
        cy.contains('효율', { timeout: 60000 }).should('be.visible');

        // Click confirm button
        cy.contains('button', '이 경로로 확정하기').click();

        // Should show confirmed state
        cy.contains('이 경로가 확정되었습니다', { timeout: 10000 }).should(
          'be.visible',
        );
      });
    });
  });

  describe('Empty Route State', () => {
    it('shows empty state when no routes exist', () => {
      cy.seedTrip().then((trip) => {
        cy.visit(`/trips/${trip.id}`);
        cy.contains('경로', { timeout: 10000 }).click();
        cy.contains('아직 경로가 없습니다').should('be.visible');
      });
    });

    it('shows optimize button in routes tab when 2+ places exist', () => {
      cy.seedTripWithPlaces([
        TOKYO_PLACES.sensoji,
        TOKYO_PLACES.tokyoTower,
      ]).then(({ trip }) => {
        cy.visit(`/trips/${trip.id}`);
        cy.contains('경로', { timeout: 10000 }).click();
        cy.contains('경로 생성하기', { timeout: 10000 }).should('be.visible');
      });
    });
  });
});
