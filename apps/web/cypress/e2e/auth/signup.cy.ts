describe('Signup', () => {
  beforeEach(() => {
    cy.visit('/signup');
  });

  it('displays all form fields', () => {
    cy.get('input[placeholder="이름을 입력하세요"]').should('be.visible');
    cy.get('input[placeholder="hello@example.com"]').should('be.visible');
    cy.get('input[placeholder="8자 이상, 대소문자 + 숫자"]').should(
      'be.visible',
    );
    cy.get('input[placeholder="비밀번호를 한 번 더 입력하세요"]').should(
      'be.visible',
    );
    cy.contains('button', '회원가입').should('be.visible');
  });

  it('successful signup redirects to /trips with token', () => {
    const suffix = Date.now();
    cy.get('input[placeholder="이름을 입력하세요"]').type('E2E 테스트');
    cy.get('input[placeholder="hello@example.com"]').type(
      `signup-${suffix}@test.com`,
    );
    cy.get('input[placeholder="8자 이상, 대소문자 + 숫자"]').type('TestPass1');
    cy.get('input[placeholder="비밀번호를 한 번 더 입력하세요"]').type(
      'TestPass1',
    );
    cy.contains('button', '회원가입').click();

    cy.url({ timeout: 15000 }).should('include', '/trips');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('accessToken')).to.be.a('string');
    });
  });

  it('shows error for invalid email format', () => {
    cy.get('input[placeholder="이름을 입력하세요"]').type('테스트');
    cy.get('input[placeholder="hello@example.com"]').type('not-an-email');
    // Trigger blur to show validation
    cy.get('input[placeholder="8자 이상, 대소문자 + 숫자"]').click();
    cy.contains('올바른 이메일 형식이 아닙니다').should('be.visible');
  });

  it('shows error for weak password', () => {
    cy.get('input[placeholder="8자 이상, 대소문자 + 숫자"]').type('short');
    // Trigger blur
    cy.get('input[placeholder="비밀번호를 한 번 더 입력하세요"]').click();
    cy.contains('8자 이상').should('be.visible');
  });

  it('shows error for password mismatch', () => {
    cy.get('input[placeholder="8자 이상, 대소문자 + 숫자"]').type('TestPass1');
    cy.get('input[placeholder="비밀번호를 한 번 더 입력하세요"]').type(
      'Different1',
    );
    cy.contains('button', '회원가입').click();
    cy.contains('비밀번호가 일치하지 않습니다').should('be.visible');
  });

  it('shows error for duplicate email', () => {
    // First, create the account via API
    const email = `dup-${Date.now()}@test.com`;
    cy.request({
      method: 'POST',
      url: `${Cypress.env('API_BASE')}/auth/signup`,
      body: { email, password: 'TestPass1', name: 'Dup' },
    });

    // Now try to signup via UI with the same email
    cy.get('input[placeholder="이름을 입력하세요"]').type('중복 테스트');
    cy.get('input[placeholder="hello@example.com"]').type(email);
    cy.get('input[placeholder="8자 이상, 대소문자 + 숫자"]').type('TestPass1');
    cy.get('input[placeholder="비밀번호를 한 번 더 입력하세요"]').type(
      'TestPass1',
    );
    cy.contains('button', '회원가입').click();

    // Should display a server error (exact message may vary)
    cy.get('.text-red-600', { timeout: 10000 }).should('be.visible');
  });
});
