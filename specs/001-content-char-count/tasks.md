---

description: "Task list for 내용 글자 수 표시 (001-content-char-count)"
---

# Tasks: 내용 글자 수 표시

**Input**: Design documents from `specs/001-content-char-count/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/char-count.md](./contracts/char-count.md), [quickstart.md](./quickstart.md)

**Tests**: 포함한다. 헌법 원칙 VI(TDD, NON-NEGOTIABLE)에 따라 모든 동작은 **실패하는 테스트 작성 → 실패 확인 → 최소 구현 → 전체 스위트 통과** 순서로 진행한다. 테스트 태스크(RED)는 반드시 대응하는 구현 태스크(GREEN)보다 먼저 끝나야 한다.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- 경로는 저장소 루트 기준이다 (단일 Next.js 프로젝트: `app/`, `lib/`, `test/`)

## 모든 테스트 태스크에 공통으로 적용하는 규칙

- 테스트 본문을 쓰기 전에 "어떤 프로덕션 변경이 이 테스트를 실패시키는가"를 한 줄 주석 없이도 말할 수 있어야 한다.
- 기대값은 [contracts/char-count.md](./contracts/char-count.md) 표의 **리터럴**로 쓴다. `countCharacters`·`formatCharCount`를 호출해 기대값을 계산하지 않는다.
- 모킹은 `next/navigation` 하나뿐이다 (`vi.mock('next/navigation', () => import('@/test/navigation'))`). `localStorage`는 jsdom 실제 구현을 쓰고, `setItem` 등을 spy/mock 하지 않는다.
- RED 확인: `npm run test:run -- <파일>` 실행 결과가 **기능이 없어서 생기는 단언 실패**여야 한다(오타·문법 에러 아님).
- GREEN 확인: 대상 파일 통과 후 `npm run test:run` 전체 스위트를 실행해 출력에 에러·경고가 없는지 확인한다.
- **가드 테스트**(바로 통과하는 회귀 방지 테스트)는 통과를 확인한 뒤 프로덕션 코드를 일부러 잘못 바꿔(mutation) 실패하는지 직접 확인하고 원래대로 되돌린다.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 작업 환경과 기준선 확인

- [X] T001 `/superpowers:test-driven-development` 스킬과 그 `writing-good-tests.md`를 불러온다. 그다음 `npm run test:run`·`npm run lint`를 실행해 기준선을 기록한다. 기존 실패가 있으면 이 파일 맨 아래 Notes에 이름을 적는다(`specs/001-content-char-count/tasks.md`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 없음. 이 기능은 새 인프라·저장 데이터 변경·공유 컴포넌트가 필요 없다(plan.md Technical Context, data-model.md "저장 데이터 변경: 없음"). 계산 모듈 `lib/text.ts`는 US1에서 TDD로 처음 만든다.

**Checkpoint**: Setup만 끝나면 바로 US1을 시작한다.

---

## Phase 3: User Story 1 - 입력하는 동안 글자 수 확인 (Priority: P1) 🎯 MVP

**Goal**: 글 상세 화면의 내용 입력칸 바로 아래에 공백 포함 글자 수(`공백 포함 N자`)를 보여 주고, 내용이 바뀌면 즉시 갱신한다.

**Independent Test**: 글 상세 화면에서 내용 입력칸에 글자를 입력·삭제·붙여넣기하고, 입력칸 바로 다음 요소가 매번 정확한 `공백 포함 N자`를 보여 주는지 확인한다(spec US1 Acceptance 1~5, 계약 U1~U5·U8).

> US1 단계의 화면·표기 테스트는 문구 **앞부분**(`공백 포함 N자`)만 단언한다(`toHaveTextContent`의 부분 일치 또는 `/^공백 포함 N자/`). 그래야 US2에서 ` · 공백 제외 M자`가 붙어도 US1 테스트를 고칠 필요가 없다.

### 계산: `countCharacters` 공백 포함 수 (`lib/text.ts`)

- [X] T002 [US1] RED — `lib/text.test.ts`를 만들고 `countCharacters(text).total` 표 테스트(`it.each`)를 쓴다. 기대값 리터럴: `'안녕하세요'`→5, `'abc 123'`→7, `'가 나'`→3, `'가\n나'`→3, `'가\t나'`→3, `'   '`→3, `''`→0. 실행하면 `@/lib/text` 모듈이 없어 실패한다.
- [X] T003 [US1] `lib/text.ts`에 시그니처만 만든다: `export type CharCount = { total: number; nonSpace: number };`, `export function countCharacters(text: string): CharCount { return { total: 0, nonSpace: 0 }; }`. `npm run test:run -- lib/text`를 다시 실행해 실패가 import 에러가 아니라 단언 실패(예: expected 5, received 0)인지 확인한다. 이것이 T002의 진짜 RED다.
- [X] T004 [US1] GREEN — T002를 통과시키는 가장 단순한 구현을 `lib/text.ts`에 쓴다. `total: text.length`이면 충분하고, grapheme 처리는 T006에서 한다. `nonSpace`는 계속 `0`으로 둔다. 대상 파일과 전체 스위트를 실행한다.
- [X] T005 [US1] RED — `lib/text.test.ts`의 `total` 표에 화면상 한 글자 케이스를 추가한다: `'👍'`→1, `'👍🏽'`→1, `'👨‍👩‍👧'`→1, `'가\r\n나'`→3. 실행해 `text.length` 구현에서 실패하는지 확인한다(예: `👨‍👩‍👧` received 8).
- [X] T006 [US1] GREEN — `lib/text.ts`에서 모듈 범위 `const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' });` 하나로 grapheme 개수를 센다(research R1). 새 의존성은 추가하지 않는다. 대상 파일과 전체 스위트를 실행한다.

### 표기: `formatCharCount` 공백 포함 부분 (`lib/format.ts`)

- [X] T007 [P] [US1] RED — `lib/format.test.ts`를 만들고 `formatCharCount` 표 테스트를 쓴다. 각 출력이 다음 정규식과 일치해야 한다: `{ total: 0, nonSpace: 0 }`→`/^공백 포함 0자/`, `{ total: 999, nonSpace: 998 }`→`/^공백 포함 999자/`, `{ total: 1000, nonSpace: 1000 }`→`/^공백 포함 1,000자/`, `{ total: 12345, nonSpace: 10000 }`→`/^공백 포함 12,345자/`. 실행하면 export가 없어 실패한다. `CharCount` 타입은 `@/lib/text`에서 import하므로 T003 이후에 시작한다(T004~T006과는 병렬 가능).
- [X] T008 [US1] `lib/format.ts`에 `export function formatCharCount(count: CharCount): string`을 만든다. 처음에는 `return ''`로 두고, 실패가 단언 실패인지 확인한다. 그다음 GREEN으로 `공백 포함 ${count.total.toLocaleString('ko-KR')}자`를 반환한다(research R4: 로캘을 `ko-KR`로 고정). 대상 파일과 전체 스위트를 실행한다.

### 화면: 글 상세 (`app/(app)/pages/[id]/page.tsx`)

- [X] T009 [US1] RED — `app/(app)/pages/[id]/page.test.tsx`를 만든다. 준비 단계는 다음 순서를 따른다.
  1. 파일 맨 위에서 `vi.mock('next/navigation', () => import('@/test/navigation'))`.
  2. 테스트 파일 안의 헬퍼로 `localStorage.setItem('mini-notion:v1', JSON.stringify({ user: { email: 'me@example.com', nickname: '나', avatarUrl: null }, pages: [{ id: 'p1', title: '', content: <내용>, createdAt: 1, updatedAt: 1 }] }))`.
  3. `await loadStore()`(`@/test/store`).
  4. `nav.params = { id: 'p1' }`.
  5. `loadStore()`가 모듈을 리셋하므로 화면 모듈은 그 뒤에 `const { default: PageDetail } = await import('./page')`로 불러와 렌더한다.

  테스트(U1·U3): 내용이 `'안녕하세요'`인 글을 렌더하면 `screen.getByRole('textbox', { name: '내용' })`의 `nextElementSibling`이 `공백 포함 5자`를 포함한다. 내용이 `''`인 글은 `공백 포함 0자`를 포함한다. 실행해 단언 실패(다음 형제 요소 없음)를 확인한다.
- [X] T010 [US1] GREEN — `app/(app)/pages/[id]/page.tsx`에 `SaveState`와 같은 방식의 지역 컴포넌트 `CharCount({ text })`를 만든다. 이 컴포넌트는 `<div className="meta editor-count">{formatCharCount(countCharacters(text))}</div>`를 렌더하고, `Editor`의 내용 `textarea` 바로 다음 형제로 둔다. 최소 구현으로 `page.content`를 넘겨도 된다(즉시 갱신은 T011~T012). 대상 파일과 전체 스위트를 실행한다.
- [X] T011 [US1] RED — `page.test.tsx`에 즉시 갱신 테스트(U4)를 추가한다. 빈 글에서 `userEvent.setup()`으로 내용 입력칸에 `안녕하세요`를 입력하면 자동 저장 1초를 기다리지 않고 바로 `공백 포함 5자`, `{Backspace}` 후 `공백 포함 4자`가 된다. 입력칸을 비우고 `user.paste('가 나')` 하면 `공백 포함 3자`가 된다. 실행해 `page.content` 구현에서 실패하는지 확인한다.
- [X] T012 [US1] GREEN — `app/(app)/pages/[id]/page.tsx`에서 `CharCount`에 `Editor`의 `content` 상태를 넘긴다. 저장 흐름(`edit`, `save`, 타이머)은 수정하지 않는다. 대상 파일과 전체 스위트를 실행한다.
- [X] T013 [US1] 가드 — `page.test.tsx`에 제목 무관 테스트(U5, FR-006)를 추가한다. 내용 `'가나'`인 글에서 제목 입력칸(`name: '제목'`)에 `제목입니다`를 입력해도 `공백 포함 2자`가 유지된다. 통과를 확인한 뒤 mutation 확인으로 `CharCount`에 일시적으로 `title + content`를 넘겨 실패하는지 보고 되돌린다.
- [X] T014 [US1] 가드 — `page.test.tsx`에 저장 실패 중 정확성 테스트(U8)를 추가한다. `vi.useFakeTimers({ shouldAdvanceTime: true })` 상태에서 진행한다.
  1. 글을 심은 뒤 같은 `localStorage`에 `'filler'` 키로 큰 문자열을 넣어 jsdom 실제 용량(5,000,000 code unit)을 거의 채운다. 다음 저장이 `QuotaExceededError`로 실패할 만큼만 남기고, `setItem`은 모킹하지 않는다.
  2. 내용에 `안녕`을 입력하고 1000ms 이상 진행시켜 `저장 실패`가 보이는지 확인한다.
  3. 그때 글자 수가 `공백 포함 2자`인지 단언한다.

  통과를 확인한 뒤 mutation 확인으로 `CharCount`에 `page.content`를 넘겨 실패하는지 보고 되돌린다.
- [X] T015 [US1] RED — `page.test.tsx`에 접근성 테스트(U6, FR-011)를 추가한다.
  - 내용 입력칸의 `aria-describedby` 값이 글자 수 요소의 `id`와 같고, 그 `id`가 비어 있지 않아야 한다.
  - 글자 수 요소에는 `aria-live` 속성이 없고 `role`이 `status`·`alert`가 아니어야 한다.

  실행해 실패(`aria-describedby` 없음)를 확인한다.
- [X] T016 [US1] GREEN — `app/(app)/pages/[id]/page.tsx`에서 React `useId()`로 id를 만들어 `CharCount`의 `id`에 넣고, `textarea`에 `aria-describedby`로 연결한다. `aria-live`·`role`은 붙이지 않는다(research R5). 대상 파일과 전체 스위트를 실행한다.

### 스타일 (테스트할 동작 없는 순수 CSS — 원칙 VI 예외 조항, 브라우저로 검증)

- [X] T017 [P] [US1] `app/globals.css`의 에디터 규칙(`.editor-body::placeholder` 다음 줄)에 `.editor-count { margin-top: var(--space-12); font-variant-numeric: tabular-nums; }`를 추가한다. 글자·색은 `.meta`(`--type-meta`, `--text-tertiary`)에 맡기고 hex·px를 쓰지 않는다. 767px 이하 미디어 쿼리 블록에는 추가하지 않는다(데스크톱·모바일 공통, research R6).

**Checkpoint**: US1 완료. `npm run test:run`이 통과하고, 브라우저에서 quickstart 1~3·6~8번이 동작한다. 이 시점에 화면은 `공백 포함 N자`만 보여 주는 MVP다.

---

## Phase 4: User Story 2 - 공백 제외 글자 수 함께 확인 (Priority: P2)

**Goal**: 같은 줄에 공백 제외 글자 수를 붙여 `공백 포함 N자 · 공백 제외 M자`를 보여 준다.

**Independent Test**: 공백·줄바꿈·탭이 섞인 내용을 열거나 입력했을 때 두 값이 정확하고, 표기가 정확히 `공백 포함 N자 · 공백 제외 M자`인지 확인한다(spec US2 Acceptance 1~3, 계약 표 1·2의 `nonSpace`와 전체 문구).

- [X] T018 [US2] RED — `app/(app)/pages/[id]/page.test.tsx`에 전체 문구 테스트를 추가한다(T009의 준비 헬퍼 재사용).
  - 내용 `'가 나'`인 글에서 글자 수 요소의 `textContent`가 정확히 `'공백 포함 3자 · 공백 제외 2자'`이다.
  - 빈 글에서 `user.type`으로 `가{Enter}나`를 입력하면 정확히 `'공백 포함 3자 · 공백 제외 2자'`가 된다.
  - 빈 글은 정확히 `'공백 포함 0자 · 공백 제외 0자'`이다.

  실행해 실패(공백 제외 부분 없음)를 확인한다. 이 테스트가 US2의 바깥 경계이며 T023에서 초록이 된다.
- [X] T019 [US2] RED — `lib/text.test.ts`에 `countCharacters(text).nonSpace` 표 테스트를 추가한다. 기대값 리터럴: `'가 나'`→2, `'가\n나'`→2, `'가\t나'`→2, `'가　나'`→2, `'   '`→0, `'abc 123'`→6, `'안녕하세요'`→5, `'👨‍👩‍👧'`→1, `'가\r\n나'`→2, `''`→0. 실행해 `nonSpace: 0` 구현에서 실패하는지 확인한다.
- [X] T020 [US2] GREEN — `lib/text.ts`에서 같은 grapheme 순회 한 번으로 `segment.trim() !== ''`인 개수를 `nonSpace`로 센다(research R2, data-model 불변 조건 "`0 ≤ nonSpace ≤ total`"). 대상 파일과 전체 스위트를 실행한다.
- [X] T021 [P] [US2] RED — `lib/format.test.ts`에 전체 문구 표 테스트(`toBe`, 정확 일치)를 추가한다. `{0,0}`→`'공백 포함 0자 · 공백 제외 0자'`, `{999,998}`→`'공백 포함 999자 · 공백 제외 998자'`, `{1000,1000}`→`'공백 포함 1,000자 · 공백 제외 1,000자'`, `{12345,10000}`→`'공백 포함 12,345자 · 공백 제외 10,000자'`. 실행해 실패를 확인한다. `lib/text.ts`와 다른 파일이라 T019~T020과 병렬로 할 수 있다.
- [X] T022 [US2] GREEN — `lib/format.ts`의 `formatCharCount`가 `공백 포함 ${total}자 · 공백 제외 ${nonSpace}자`(두 숫자 모두 `toLocaleString('ko-KR')`, 구분 기호는 앞뒤 공백 하나씩인 ` · `)를 반환하게 한다. 대상 파일과 전체 스위트를 실행한다.
- [X] T023 [US2] 확인 — `npm run test:run -- "app/(app)/pages"`로 T018이 화면 코드 변경 없이 초록이 되었는지 확인한다. 초록이 아니면 화면이 `formatCharCount(countCharacters(content))`를 쓰는지 점검한다. US1 테스트(T009~T016)도 수정 없이 통과해야 한다.

**Checkpoint**: US1·US2 모두 동작한다. 브라우저에서 quickstart 4·5번까지 확인한다.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 문서 갱신, 디자인 점검, 완료 게이트

- [X] T024 [P] `DESIGN.md`를 갱신한다(0장 갱신 규칙, 원칙 III — 코드와 같은 커밋).
  - 7.10 패턴 클래스 표에 `.editor-count`(에디터 내용 아래 글자 수, `.meta`와 함께 사용)를 추가한다.
  - 8.3 Page detail에 "본문 `textarea` 아래 `.meta` 글자 수 `공백 포함 N자 · 공백 제외 M자`, 즉시 갱신, `aria-describedby`로 연결"을 추가한다.
  - 9.4 표에 `formatCharCount(count)` 행을 추가하고, 숫자 항목에 "글자 수 `공백 포함 1,234자 · 공백 제외 1,050자`"를 추가한다.
  - 10.1 표에 "보조 설명: 내용 `textarea`의 `aria-describedby` → 글자 수 (라이브 영역 아님)"를 추가한다.
  - 부록 B 파일 맵에 `lib/text.ts`(글자 수 계산)를 추가하고 `lib/format.ts` 설명에 "글자 수"를 덧붙인다.
- [X] T025 리팩터 — 초록 상태를 유지하면서 `lib/text.ts`, `lib/format.ts`, `app/(app)/pages/[id]/page.tsx`, `page.test.tsx`의 중복과 이름을 정리한다(예: 테스트 준비 헬퍼). 동작은 추가하지 않는다. 다른 테스트 파일에서도 쓰게 될 때만 헬퍼를 `test/`로 옮긴다(YAGNI). 각 변경 뒤 `npm run test:run`.
- [X] T026 Mutation Check(원칙 VI 완료 전 점검) — 아래 변경을 하나씩 일시 적용해 각각 최소 하나의 테스트가 실패하는지 확인하고 되돌린다.
  - `lib/text.ts`: `Intl.Segmenter` 대신 `text.length`, `trim()` 판정 반전, `nonSpace`를 `total`로 반환
  - `lib/format.ts`: `toLocaleString` 제거, 구분 기호 변경
  - `page.tsx`: `content` 대신 `page.content`, `aria-describedby` 제거

  하나라도 살아남으면 그 변경을 잡는 테스트를 추가한다.
- [X] T027 DESIGN.md 11장 체크리스트를 `app/globals.css`·`app/(app)/pages/[id]/page.tsx` 변경분에 대해 한 줄씩 점검하고, 통과하지 못한 항목은 고친다. hex·px·primitive 토큰·인라인 스타일을 새로 넣지 않았는지도 확인한다.
- [X] T028 완료 게이트(`package.json` 스크립트) — `npm run test:run`, `npm run lint`, `npm run build`가 모두 통과하는지 확인한다. 내가 만들지 않은 실패도 이름을 들어 기록한다.
- [X] T029 `specs/001-content-char-count/quickstart.md` 3장 브라우저 수동 확인 1~10번을 `npm run dev`로 실행한다. 데스크톱과 360px·767px 폭, 한글 IME 조합, 5만 자 붙여넣기, VoiceOver를 포함하며, 결과를 완료 보고에 적는다. 보고에는 "참고한 DESIGN.md 섹션"을 한 줄로 적는다.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 바로 시작한다.
- **Foundational (Phase 2)**: 태스크가 없다.
- **US1 (Phase 3)**: T001 이후 시작한다.
- **US2 (Phase 4)**: US1 완료 후 시작한다. US2는 US1의 `lib/text.ts`·`lib/format.ts`·`CharCount` 화면 요소를 확장하므로 같은 파일을 수정한다. 테스트로는 US2 단독으로 검증할 수 있지만 구현 순서는 US1 → US2다.
- **Polish (Phase 5)**: US1(최소 MVP) 또는 US1+US2 완료 후 시작한다.

### Within Each User Story (TDD 순서 — 건너뛰기 금지)

- 각 RED 태스크 → 실패 확인 → 대응 GREEN 태스크 → 전체 스위트 순서다.
- 태스크 체인은 다음과 같다.
  - US1: T002 → T003 → T004 → T005 → T006 → (T007 → T008) → T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016
  - US2: T018 → T019 → T020 → (T021 → T022) → T023
- T017(CSS)은 T010 이후 언제든 할 수 있다.

### Parallel Opportunities

- **T007/T008** (`lib/format.*`): T003 이후 T004~T006 (`lib/text.*`)과 병렬로 할 수 있다.
- **T017** (`app/globals.css`): T010 이후 T011~T016 (`page.*`)과 병렬로 할 수 있다.
- **T021/T022** (`lib/format.*`): T019~T020 (`lib/text.*`)과 병렬로 할 수 있다.
- **T024** (`DESIGN.md`): T025~T026과 병렬로 할 수 있다.
- `page.test.tsx`·`page.tsx`를 건드리는 태스크(T009~T016, T018)는 같은 파일이라 순차로 진행한다.

---

## Parallel Example: User Story 1

```bash
# T003 이후 — 계산과 표기를 나눠 진행
Task: "T004~T006 countCharacters total (lib/text.ts, lib/text.test.ts)"
Task: "T007~T008 formatCharCount 공백 포함 부분 (lib/format.ts, lib/format.test.ts)"

# T010 이후 — 화면 동작과 스타일을 나눠 진행
Task: "T011~T016 즉시 갱신·제목 무관·저장 실패·접근성 (app/(app)/pages/[id]/page.*)"
Task: "T017 .editor-count 스타일 (app/globals.css)"
```

## Parallel Example: User Story 2

```bash
# T018 이후
Task: "T019~T020 countCharacters nonSpace (lib/text.ts)"
Task: "T021~T022 formatCharCount 전체 문구 (lib/format.ts)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001 Setup을 끝낸다.
2. Phase 3(T002~T017)을 끝내면 `공백 포함 N자`가 표시되고 즉시 갱신된다.
3. **STOP and VALIDATE**: `npm run test:run`을 실행하고 quickstart 1~3·6~8번을 확인한다.
4. 필요하면 이 시점에 T024(DESIGN.md를 US1 범위로 갱신)·T027·T028을 하고 커밋한다.

### Incremental Delivery

1. US1이 끝나면 MVP(공백 포함 글자 수)를 커밋한다.
2. US2가 끝나면 공백 제외 글자 수까지 같은 줄에 표시된다. DESIGN.md 문구 예시를 최종 형식으로 갱신하고 커밋한다.
3. Polish로 mutation check, 완료 게이트, 브라우저 확인을 마친다.

### 커밋 단위 제안 (헌법: 하나의 커밋 = 하나의 의도)

- `feat: 글 상세 내용 아래 공백 포함 글자 수 표시` (US1 + `.editor-count` + 해당 DESIGN.md 갱신)
- `feat: 공백 제외 글자 수 함께 표시` (US2 + DESIGN.md 문구 갱신)

---

## Notes

- [P] tasks = 다른 파일, 미완료 태스크에 대한 의존 없음
- [Story] 라벨은 spec.md의 User Story와 대응한다.
- RED에서 실패를 직접 보지 못한 테스트는 완료로 체크하지 않는다.
- 테스트 전용 코드는 테스트 파일이나 `test/` 유틸에만 둔다. 프로덕션 모듈에 테스트용 export·리셋 함수를 추가하지 않는다.
- 기준선(T001) 기존 실패: 실패 테스트 없음. 테스트 파일이 하나도 없어 `npm run test:run`이 "No test files found"로 exit 1. `npm run lint` 통과. vitest가 `vite-tsconfig-paths` 플러그인 대체 안내를 출력한다(기존 경고).
- T029: headless Chrome(CDP)으로 quickstart 3장 1~10번을 `npm run dev`에서 실행해 모두 통과했다.
  - 2번 한글 조합: CDP `Input.imeSetComposition`으로 흉내 냈다. 조합 중 1→2→3→4→5로 바뀌었고 커서·포커스는 유지됐다.
  - 8번 5만 자: 키 입력부터 화면 갱신까지 평균 20.7ms, 최대 42.9ms였다.
  - 9번 360px·767px: `공백 포함 12,345자 · 공백 제외 10,000자`가 한 줄(높이 16.8px)에 들어가고 가로로 넘치지 않았다.
  - 10번: 접근성 트리에서 내용 입력칸 설명이 글자 수이고, 글자 수가 라이브 영역 밖인 것을 확인했다. 실제 VoiceOver 낭독과 실제 macOS 한글 IME 입력은 사람이 확인하지 않았다.
