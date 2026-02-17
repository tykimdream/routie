# Routie — Git 브랜치 전략 & 커밋 컨벤션

## 1. 브랜치 전략 (Git Flow 변형)

```
main (production)
  │
  ├── 배포 가능한 안정 버전만 머지
  ├── 태그로 버전 관리 (v1.0.0, v1.1.0)
  └── 직접 커밋 금지

develop (development)
  │
  ├── 다음 릴리즈를 위한 개발 브랜치
  ├── feature 브랜치에서 PR로 머지
  └── CI 통과 필수

feature/* (기능 개발)
  │
  ├── develop에서 분기
  ├── 명명: feature/기능명 (예: feature/place-search)
  └── 완료 후 develop으로 PR

hotfix/* (긴급 수정)
  │
  ├── main에서 분기
  ├── 명명: hotfix/이슈명 (예: hotfix/login-crash)
  └── 완료 후 main + develop 모두에 머지

release/* (배포 준비)
  │
  ├── develop에서 분기
  ├── 명명: release/v1.0.0
  └── QA 후 main + develop에 머지 + 태그
```

### 브랜치 흐름도

```
main     ─────●─────────────────●──────────── (production)
              ↑                 ↑
release       └── release/v1.0 ─┘
              ↑
develop  ──●──●──●──●──●──●──●──●──────────── (development)
           ↑     ↑     ↑
feature    └─A───┘ └─B──┘ └─C──┘
```

---

## 2. 커밋 컨벤션 (Conventional Commits)

### 형식

```
<type>(<scope>): <subject>

<body>       (선택)

<footer>     (선택)
```

### Type

| Type       | 설명                    | 예시                                                 |
| ---------- | ----------------------- | ---------------------------------------------------- |
| `feat`     | 새로운 기능             | feat(place): add place search with Google Places API |
| `fix`      | 버그 수정               | fix(route): fix incorrect travel time calculation    |
| `docs`     | 문서 변경               | docs: update API documentation                       |
| `style`    | 코드 스타일 (포맷팅 등) | style: fix eslint warnings                           |
| `refactor` | 리팩토링                | refactor(optimizer): extract TSP solver              |
| `test`     | 테스트                  | test(route): add route optimization unit tests       |
| `chore`    | 빌드, 설정 변경         | chore: update dependencies                           |
| `ci`       | CI/CD 설정              | ci: add github actions workflow                      |
| `perf`     | 성능 개선               | perf(map): lazy load map component                   |

### Scope (선택)

```
auth, user, trip, place, route, map, ui, api, db, config
```

### 예시

```
feat(place): add Google Places autocomplete search

- Integrate Google Places API for place search
- Add debounced search input component
- Cache search results for 5 minutes

Closes #12
```

---

## 3. PR (Pull Request) 규칙

### PR 템플릿

```markdown
## Summary

<!-- 변경 사항 요약 -->

## Changes

- [ ] 변경 1
- [ ] 변경 2

## Screenshots (if UI)

<!-- 스크린샷 첨부 -->

## Test

- [ ] 테스트 통과 확인
- [ ] 수동 테스트 완료
```

### 머지 규칙

| 규칙         | 설명                                       |
| ------------ | ------------------------------------------ |
| Squash Merge | feature → develop (커밋 정리)              |
| Merge Commit | release → main (히스토리 보존)             |
| CI 통과      | 필수                                       |
| 셀프 머지    | MVP 단계에서는 허용 (팀 확장 시 리뷰 필수) |

---

## 4. 버전 관리 (Semantic Versioning)

```
v{MAJOR}.{MINOR}.{PATCH}

MAJOR: 호환되지 않는 변경 (v2.0.0)
MINOR: 기능 추가 (v1.1.0)
PATCH: 버그 수정 (v1.0.1)
```

### 태그

```bash
git tag -a v1.0.0 -m "Release v1.0.0: MVP launch"
git push origin v1.0.0
```

---

## 5. 환경 분리

| 환경       | 브랜치      | 배포           | URL                 |
| ---------- | ----------- | -------------- | ------------------- |
| Production | `main`      | 자동 (태그 시) | routie.app          |
| Staging    | `develop`   | 자동 (머지 시) | staging.routie.app  |
| Preview    | `feature/*` | PR 생성 시     | {branch}.routie.app |
| Local      | -           | 수동           | localhost           |
