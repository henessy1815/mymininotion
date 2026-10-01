<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0 (MINOR: 새 원칙 추가 + 테스트 지침의 실질적 확장)
- Modified principles:
  - II. 데이터 무손실과 계정 격리 — 데이터 형태 변경 시 마이그레이션 테스트를 TDD로 작성하도록 명시
- Added principles:
  - VI. 테스트 주도 개발 — superpowers:test-driven-development 필수 (NON-NEGOTIABLE)
- Modified sections:
  - 기술 제약 — 테스트 스택(Vitest + React Testing Library + jsdom)과 테스트 유틸 위치 추가
  - 개발 워크플로 · 품질 게이트 — "테스트" 항목을 TDD 게이트로 교체, 완료 게이트에 `npm run test:run` 추가
  - Governance — plan Constitution Check에 원칙 VI 포함
- Removed sections: 없음
- Templates: 본 명령은 템플릿을 수정하지 않음 (plan/spec/tasks 템플릿은 런타임에 헌법을 읽음)
- Deferred TODOs: 없음
-->

# 미니 노션 (Mini Notion) Constitution

## Core Principles

### I. 개인용 · 0원 운영 · 범위 규율

- 미니 노션은 단일 사용자(본인)를 위한 개인 업무 관리 도구다. 모든 기능은 이 사용자의 실제
  사용 흐름(기록 → 찾기 → 수정 → 삭제)을 개선해야 하며, 그렇지 않은 기능은 추가하지 않는다(MUST NOT).
- 월 운영 비용은 0원이어야 한다(MUST). 인증·DB·스토리지·호스팅은 무료 티어 안에서 해결하며,
  유료 플랜이 필요한 의존성을 도입하려면 헌법 개정 수준의 정당화가 필요하다.
- `02-prd.md`의 Non-Goals(협업·동시 편집·권한, 블록 기반 리치 에디터, 구글 외 로그인, 중첩 페이지
  트리, 네이티브 앱, 오프라인·버전 히스토리·휴지통)는 PRD가 개정되기 전까지 구현하지 않는다(MUST NOT).
- 우선순위는 P0 → P1 → P2 순서를 따른다. P2 항목은 실제 사용 후 불편이 확인된 경우에만 착수한다.

**Rationale**: 상용 도구의 과잉 기능과 요금제에서 벗어나는 것이 이 프로젝트의 존재 이유다.
범위가 새면 그 이유가 사라진다.

### II. 데이터 무손실과 계정 격리 (NON-NEGOTIABLE)

- 사용자가 입력한 제목·내용은 유실되어서는 안 된다(MUST). 편집은 자동 저장(입력 정지 후 약 1초
  debounce)되며, 저장 상태(저장 중 / 저장됨 / 실패)를 항상 화면에 표시한다.
- 저장 실패는 조용히 삼키지 않는다(MUST NOT). 실패는 사용자에게 보이고, 입력 내용은 재시도
  가능한 상태로 남아야 한다.
- 모든 글(`pages`) 조회·수정·삭제는 로그인한 사용자 소유 데이터로 제한한다(MUST). 백엔드 도입 시
  행 단위 접근 제어(예: Supabase RLS)로 서버 측에서 강제하며, 클라이언트 필터만으로 대체하지 않는다.
- 되돌릴 수 없는 행동(글 삭제 등)에는 반드시 확인 단계를 둔다(MUST).
- 데이터 형태(`Page`, `User` 타입)를 바꾸는 변경은 기존 저장 데이터의 마이그레이션 또는 하위 호환
  읽기를 함께 제공해야 한다(MUST). 마이그레이션은 이전 형태의 실제 저장 데이터를 픽스처로 하는
  실패하는 테스트로 먼저 작성한다(원칙 VI).

**Rationale**: 성공 지표의 "저장 실패율 0%"와 "개인 업무 기록의 80%를 여기서 작성"은 신뢰 없이는
달성할 수 없다. 기록 도구에서 데이터 유실은 단 한 번으로도 치명적이다.

### III. 코드가 진실의 원천 · 디자인 시스템 준수

- UI의 색·간격·폰트·radius·그림자·모션은 `app/styles/tokens.css`의 토큰(`var(--…)`)만 사용한다
  (MUST). hex·rgba·px 하드코딩과 primitive 토큰 직접 참조는 새 코드에서 금지한다.
  `DESIGN.md` "알려진 불일치"의 기존 하드코딩을 선례로 삼지 않는다.
- 새 UI는 기존 DS 컴포넌트(`components/ds.tsx`, `components/shell.tsx`)로 해결 가능한지 먼저
  확인한다(MUST). 새 토큰·컴포넌트가 필요하면 `tokens.css`·`ds.tsx`에 먼저 추가하고 같은 변경에서
  `DESIGN.md`를 갱신한다.
- `DESIGN.md`와 코드가 충돌하면 코드를 따르고, 문서를 고치며, 충돌 사실을 보고한다.
- 디자인 작업은 `DESIGN.md` 11장 체크리스트를 통과해야 완료로 간주한다(MUST).

**Rationale**: 사람과 AI 에이전트가 같은 화면을 만들려면 단일한 기준이 필요하다. 문서가 아닌
코드를 기준으로 삼아야 문서와 구현이 갈라지는 것을 막을 수 있다.

### IV. 키보드 우선 · 한국어 우선 UX

- 새 글 생성 등 핵심 기록 흐름은 키보드만으로 완료할 수 있어야 한다(MUST). 모달·폼을 거치게 만들지
  않으며, 조작 방법(Enter/Esc/↑↓ 등)은 `Kbd`로 화면에 노출한다.
- Enter로 제출하는 입력은 한글 IME 조합 중(`isComposing`) 제출을 막아야 한다(MUST).
- UI 문구는 한국어 해요체로 쓴다. 오류 메시지는 "원인 + 다음 행동" 형식이며, 느낌표·이모지·영어
  UI 라벨을 쓰지 않는다. 날짜·제목 표기는 `lib/format.ts`의 함수를 사용한다.
- 360px 폭 이상에서 모든 P0 기능이 레이아웃 깨짐 없이 동작해야 하며(SHOULD, P1에서 MUST로 승격),
  모바일 터치 타깃은 44px 이상이다.

**Rationale**: "키보드 하나로 바로 기록을 시작할 수 있을 만큼 가볍게"가 제품의 핵심 경험이며,
사용자는 한국어로 기록한다. IME 처리 누락은 한국어 사용자에게 곧바로 버그로 드러난다.

### V. 확장 가능한 구조와 단순함

- 화면(`app/`), UI 컴포넌트(`components/`), 데이터·도메인 로직(`lib/`)을 분리한다(MUST). 화면
  컴포넌트는 저장소 구현(localStorage, Supabase 등)을 직접 알지 않고 `lib/store.ts`의 `actions`와
  타입을 통해서만 데이터에 접근한다.
- 슬래시 명령어는 `lib/commands.ts`의 레지스트리에 항목을 추가하는 방식으로만 확장한다(MUST).
  새 명령어 추가가 입력 UI 코드 수정을 요구한다면 구조를 먼저 고친다.
- 지금 필요한 것만 만든다(YAGNI). 추상화·설정·의존성은 두 번째 실제 사용처가 생겼을 때 도입하며,
  새 런타임 의존성 추가는 plan 단계에서 이유를 명시한다.
- 소규모 기능 1개를 1일 이내에 추가할 수 있는 구조를 유지하는 것이 목표다. 이를 해치는 복잡도는
  plan의 Complexity Tracking에 정당화를 남겨야 한다.

**Rationale**: "나에게 최적화된 기능으로 계속 확장"하려면 기능 추가 비용이 낮아야 한다. 분리된
경계와 레지스트리 패턴이 그 비용을 낮추고, 과한 추상화는 다시 높인다.

### VI. 테스트 주도 개발 — superpowers TDD 필수 (NON-NEGOTIABLE)

- 모든 구현 작업(새 기능, 버그 수정, 리팩터링, 동작 변경)은 항상 superpowers의
  `/superpowers:test-driven-development` 스킬을 먼저 불러와 그 절차대로 진행한다(MUST). 사람이든
  AI 에이전트든, Spec Kit 흐름(`/speckit-implement`)이든 단독 작업이든 예외 없다.
- **철칙**: 실패하는 테스트 없이 프로덕션 코드를 쓰지 않는다(MUST NOT). 테스트보다 먼저 쓴 코드는
  삭제하고 테스트부터 다시 시작한다. "참고용으로 남겨두기"도 허용하지 않는다.
- **Red-Green-Refactor**: ① 한 가지 동작을 검증하는 최소 테스트를 쓴다 → ② 실행해서 *기능이 없어서*
  실패하는 것을 직접 확인한다(오타·에러가 아닌 기대한 실패) → ③ 통과시키는 최소 코드만 쓴다 →
  ④ 전체 스위트(`npm run test:run`)가 통과하고 출력에 에러·경고가 없는지 확인한다 → ⑤ 초록 상태를
  유지하며 리팩터링한다. ②와 ④는 건너뛸 수 없다.
- **좋은 테스트** (스킬의 `writing-good-tests.md`):
  - 테스트 본문을 쓰기 전에 "어떤 프로덕션 변경이 이 테스트를 실패시키는가"를 명시할 수 있어야 한다.
  - 기대값은 리터럴·손으로 확인한 픽스처로 쓰고, 테스트 대상 코드나 그 헬퍼로 계산하지 않는다.
  - 상수 값·문구·내부 구조만 확인하는 변경 감지 테스트, 소스 텍스트를 grep하는 테스트를 쓰지 않는다.
  - 프레임워크(Next.js, React)의 동작이 아니라 우리 코드의 경계 계약을 테스트한다.
- **모킹 규칙**:
  - 실제 코드를 우선한다. 모킹은 느리거나 외부에 있는 의존성에만, 불가피할 때만 쓴다.
    `localStorage`는 jsdom의 실제 구현을 쓰고 모킹하지 않는다.
  - 모킹 전에 실제 메서드의 부수 효과를 파악하고, 테스트가 의존하는 부수 효과는 실제로 남긴다.
  - 모킹 자체를 단언하지 않는다(`*-mock` test ID 등). 실제 컴포넌트의 동작을 단언한다.
  - 대역은 실제 구조를 빠짐없이 반영하고, 호출 인자·횟수·순서가 계약이면 그것을 단언한다.
  - 테스트에서만 쓰는 정리·초기화 코드는 `test/` 유틸에 두고 프로덕션 모듈에 추가하지 않는다.
- **완료 전 점검**: 스킬의 Verification Checklist(새 함수마다 테스트 존재, 각 테스트의 실패를 직접
  확인, 최소 구현, 전체 통과, 깨끗한 출력, 엣지·오류 케이스)와 Mutation Check(상수·분기·부수 효과·
  기본값 반환·검증 누락을 가정했을 때 최소 하나의 테스트가 실패)를 통과해야 완료로 본다.
- **버그 수정**: 버그를 재현하는 실패 테스트를 먼저 쓰고 고친다. 테스트 없는 버그 수정은 허용하지 않는다.
- **예외**: 버리는 프로토타입, 생성된 코드, 설정 파일만 예외 후보이며, 이 경우에도 사용자(본인)의
  명시적 승인을 받아 plan 또는 작업 기록에 남긴다. 테스트할 동작이 없는 순수 스타일 변경(토큰 값,
  CSS)은 원칙 III의 DESIGN.md 11장 체크리스트와 브라우저 확인으로 검증한다.

**Rationale**: 테스트를 먼저 쓰고 실패를 직접 봐야 그 테스트가 실제로 버그를 잡을 수 있다는 것이
증명된다. 나중에 쓴 테스트는 이미 쓴 코드에 맞춰져 통과할 뿐이다. 원칙 II의 "데이터 유실 0"과
원칙 V의 "기능 추가 1일 이내"는 회귀를 막아 주는 테스트 스위트 없이는 지킬 수 없다.

## 기술 제약 (Technical Constraints)

- **프레임워크**: Next.js 16 (App Router) + React 19 + TypeScript. 이 버전은 학습 데이터와 API·
  규약이 다를 수 있으므로, Next.js 코드를 작성하기 전에 `node_modules/next/dist/docs/`의 관련 가이드를
  읽고 deprecation 공지를 따른다(MUST, `AGENTS.md`).
- **아이콘·폰트**: 아이콘은 `lucide-react`, 폰트는 `next/font/local`로 로드하는 Pretendard Variable.
- **데이터 계층**: 현재는 `lib/store.ts`의 localStorage 기반 목업이다. 백엔드(PRD 권장: Supabase —
  Google OAuth, Postgres + RLS, Storage / Vercel 배포)로 전환할 때는 `actions`의 시그니처와 데이터
  형태를 유지한 채 구현만 교체한다.
- **인증**: Google 로그인만 지원한다. 비로그인 상태의 앱 화면 접근은 로그인 페이지로 리다이렉트한다.
- **업로드 제한**: 프로필 이미지는 jpg/png/webp, 최대 5MB. 검증은 업로드 전에 클라이언트에서 하고,
  백엔드 도입 후에는 서버(스토리지 정책)에서도 강제한다.
- **테스트 스택**: Vitest + React Testing Library + `@testing-library/user-event` +
  `@testing-library/jest-dom` + jsdom (`vitest.config.mts`, Next.js 번들 문서
  `01-app/02-guides/testing/vitest.md` 기준). 테스트 파일은 대상 옆에 `*.test.ts(x)`로 둔다.
  - `test/setup.ts`: 매 테스트 후 렌더 정리, `localStorage` 비우기, 라우터 대역 초기화.
  - `test/store.ts`의 `loadStore()`: 모듈 단위 캐시가 있는 `lib/store.ts`를 테스트마다 새로 불러온다.
  - `test/navigation.ts`: `next/navigation` 대역. App Router 컨텍스트는 Next 안에서만 존재하므로
    컴포넌트 테스트가 대체하는 유일한 경계다 (`vi.mock('next/navigation', () => import('@/test/navigation'))`).
  - `async` Server Component는 Vitest가 지원하지 않으므로, 도입 시 E2E 테스트 도구를 plan에서 정한다.
- **비밀 정보**: OAuth 클라이언트 시크릿·서비스 키 등은 저장소에 커밋하지 않는다(MUST NOT).
  클라이언트 번들에는 공개 가능한 키만 포함한다.

## 개발 워크플로 · 품질 게이트

- **Spec Kit 흐름**: 기능 작업은 `/speckit-specify` → (`/speckit-clarify`) → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-implement` 순서를 따른다. plan의 Constitution Check는 본 헌법의
  여섯 원칙 각각에 대해 통과/위반(정당화)을 명시해야 한다.
- **TDD 게이트**: tasks는 각 동작마다 "실패하는 테스트 작성 → 실패 확인 → 구현" 순서로 쪼갠다.
  `/speckit-implement`를 포함한 모든 구현은 `/superpowers:test-driven-development`를 불러온 뒤
  시작한다(원칙 VI). 감시 모드는 `npm test`, 단발 실행은 `npm run test:run`.
- **완료 게이트**: 변경을 완료로 보고하기 전에 `npm run test:run`, `npm run lint`, `npm run build`가
  모두 통과해야 한다(MUST). 내가 만들지 않은 실패도 이름을 들어 보고한다.
  UI 변경은 브라우저에서 데스크톱과 767px 이하 폭으로 직접 확인한다.
- **디자인 작업 보고**: 디자인 작업 완료 보고에는 "참고한 DESIGN.md 섹션"을 한 줄로 적는다
  (`CLAUDE.md` 디자인 작업 규칙).
- **커밋**: 하나의 커밋은 하나의 의도를 담는다. 토큰·컴포넌트 추가와 그에 따른 `DESIGN.md` 갱신은
  같은 커밋에 포함한다.

## Governance

- 본 헌법은 이 저장소의 다른 관행·가이드보다 우선한다. 단, 런타임 작업 지침은 `CLAUDE.md`,
  `AGENTS.md`, `DESIGN.md`를 따르며, 이들과 헌법이 충돌하면 헌법을 기준으로 해당 문서를 고친다.
- **개정 절차**: 개정은 `/speckit-constitution`으로 수행하고, 변경 이유·영향 범위를 Sync Impact Report에
  남긴다. 원칙을 완화하거나 제거하는 개정은 영향받는 기존 spec·plan을 함께 검토한다.
- **버전 정책 (Semantic Versioning)**:
  - MAJOR — 원칙의 제거 또는 하위 호환되지 않는 재정의
  - MINOR — 새 원칙·섹션 추가 또는 지침의 실질적 확장
  - PATCH — 문구 명확화, 오탈자, 의미 변화 없는 수정
- **준수 점검**: 모든 plan은 Constitution Check 게이트를 통과해야 하고, 위반은 Complexity Tracking에
  정당화가 있을 때만 허용된다. 단, 원칙 II와 VI(NON-NEGOTIABLE)는 정당화로 면제되지 않으며 원칙
  VI의 예외 조항만 적용된다. `/speckit-analyze`는 헌법 위반을 CRITICAL로 보고한다.
- PRD(`02-prd.md`)의 Goals·Non-Goals가 바뀌면 원칙 I을 재검토한다.

**Version**: 1.1.0 | **Ratified**: 2026-10-01 | **Last Amended**: 2026-10-01
