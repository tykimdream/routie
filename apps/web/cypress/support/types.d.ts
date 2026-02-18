/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * API를 통해 로그인하고 localStorage에 토큰 저장.
     * 계정이 없으면 자동으로 회원가입 후 로그인.
     */
    apiLogin(
      email?: string,
      password?: string,
    ): Chainable<{
      accessToken: string;
      user: { id: string; email: string; name: string | null };
    }>;

    /**
     * API를 통해 여행 생성, trip 객체 반환.
     */
    seedTrip(overrides?: Record<string, unknown>): Chainable<{
      id: string;
      title: string;
      city: string;
      [key: string]: unknown;
    }>;

    /**
     * 여행 생성 + 장소 추가 (Google Place ID 기반).
     */
    seedTripWithPlaces(
      googlePlaceIds: string[],
      tripOverrides?: Record<string, unknown>,
    ): Chainable<{
      trip: { id: string; title: string; city: string; [key: string]: unknown };
      tripPlaces: Array<{ id: string; [key: string]: unknown }>;
    }>;

    /**
     * 현재 로그인 유저의 모든 여행 삭제.
     */
    cleanupTrips(): Chainable<void>;
  }
}
