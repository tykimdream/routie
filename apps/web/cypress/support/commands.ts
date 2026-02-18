/// <reference path="./types.d.ts" />

const API_BASE = Cypress.env('API_BASE') || 'http://localhost:4000/api';

// Unique suffix to avoid collisions between test runs
let userCounter = 0;

Cypress.Commands.add('apiLogin', (email?: string, password?: string) => {
  const suffix = `${Date.now()}-${userCounter++}`;
  const testEmail = email ?? `cypress-${suffix}@test.com`;
  const testPassword = password ?? 'TestPass1';
  const testName = 'Cypress User';

  // Try login first; if it fails (user doesn't exist), signup then login
  return cy
    .request({
      method: 'POST',
      url: `${API_BASE}/auth/login`,
      body: { email: testEmail, password: testPassword },
      failOnStatusCode: false,
    })
    .then((loginRes) => {
      if (loginRes.status === 200 || loginRes.status === 201) {
        return loginRes.body;
      }

      // Signup
      return cy
        .request({
          method: 'POST',
          url: `${API_BASE}/auth/signup`,
          body: { email: testEmail, password: testPassword, name: testName },
        })
        .then((signupRes) => signupRes.body);
    })
    .then(
      (body: {
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string; name: string | null };
      }) => {
        window.localStorage.setItem('accessToken', body.accessToken);
        window.localStorage.setItem('refreshToken', body.refreshToken);
        return { accessToken: body.accessToken, user: body.user };
      },
    );
});

Cypress.Commands.add('seedTrip', (overrides?: Record<string, unknown>) => {
  const token = window.localStorage.getItem('accessToken');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 3);

  const defaults = {
    title: 'Cypress 테스트 여행',
    city: '도쿄',
    country: 'Japan',
    startDate: tomorrow.toISOString().split('T')[0],
    endDate: dayAfter.toISOString().split('T')[0],
    dailyStart: '10:00',
    dailyEnd: '21:00',
    transport: 'PUBLIC_TRANSIT',
    latitude: 35.6762,
    longitude: 139.6503,
  };

  return cy
    .request({
      method: 'POST',
      url: `${API_BASE}/trips`,
      headers: { Authorization: `Bearer ${token}` },
      body: { ...defaults, ...overrides },
    })
    .then((res) => res.body);
});

Cypress.Commands.add(
  'seedTripWithPlaces',
  (googlePlaceIds: string[], tripOverrides?: Record<string, unknown>) => {
    const token = window.localStorage.getItem('accessToken');

    return cy.seedTrip(tripOverrides).then((trip) => {
      // Add places sequentially to avoid race conditions with Google API
      const tripPlaces: Array<{ id: string; [key: string]: unknown }> = [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let chain: Cypress.Chainable<any> = cy.wrap(null);
      googlePlaceIds.forEach((googlePlaceId) => {
        chain = chain.then(() =>
          cy
            .request({
              method: 'POST',
              url: `${API_BASE}/trips/${trip.id}/places`,
              headers: { Authorization: `Bearer ${token}` },
              body: { googlePlaceId },
            })
            .then((res) => {
              tripPlaces.push(res.body);
            }),
        );
      });

      return chain.then(() => ({ trip, tripPlaces }));
    });
  },
);

Cypress.Commands.add('cleanupTrips', () => {
  const token = window.localStorage.getItem('accessToken');
  if (!token) return;

  return cy
    .request({
      method: 'GET',
      url: `${API_BASE}/trips`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    })
    .then((res) => {
      if (res.status !== 200 || !Array.isArray(res.body)) return;
      const trips = res.body as Array<{ id: string }>;
      trips.forEach((trip) => {
        cy.request({
          method: 'DELETE',
          url: `${API_BASE}/trips/${trip.id}`,
          headers: { Authorization: `Bearer ${token}` },
          failOnStatusCode: false,
        });
      });
    });
});
