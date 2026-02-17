module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // 새 기능
        'fix', // 버그 수정
        'docs', // 문서
        'style', // 코드 스타일
        'refactor', // 리팩토링
        'test', // 테스트
        'chore', // 빌드, 설정
        'ci', // CI/CD
        'perf', // 성능
        'revert', // 되돌리기
      ],
    ],
    'scope-enum': [
      1, // warning (강제하지 않되 권장)
      'always',
      [
        'auth',
        'user',
        'trip',
        'place',
        'route',
        'map',
        'ui',
        'api',
        'db',
        'config',
        'deps',
      ],
    ],
    'subject-max-length': [2, 'always', 72],
  },
};
