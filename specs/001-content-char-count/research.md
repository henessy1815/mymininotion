# Research: 내용 글자 수 표시

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Date**: 2026-10-01

Technical Context에 NEEDS CLARIFICATION은 없었다. 아래는 구현 방식을 정하려고 확인한 항목이다.
측정은 이 저장소의 Node v24.21.0에서 직접 실행해 확인했다.

## R1. "화면에서 한 글자로 보이는 단위" 세기 (FR-005)

- **Decision**: `Intl.Segmenter('ko', { granularity: 'grapheme' })`로 문자열을 grapheme cluster(사용자가 보는 글자) 단위로 나눠 센다. Segmenter 인스턴스는 모듈 범위에서 한 번만 만든다.
- **Rationale**: 표준 내장 API라 런타임 의존성이 늘지 않는다(원칙 V). Node 24에서 직접 확인한 결과는 다음과 같다. `👍🏽` → 1, `👨‍👩‍👧` → 1, `\r\n` → 1, 조합 중인 `ㅎ`·`한` → 각각 1. 지원 브라우저는 Chrome/Edge 87+, Safari 14.1+, Firefox 125+이고 jsdom 테스트 환경(Node 내장 ICU)에서도 동작한다. `tsconfig`의 `lib: esnext`에 타입이 포함되어 있다.
- **Alternatives considered**:
  - `text.length` (UTF-16 코드 유닛): `👍`가 2, `👨‍👩‍👧`가 8로 세어져 FR-005 위반. 마이 페이지 별명 글자 수는 이 방식이지만 별명에는 이모지가 드물어 지금은 문제가 되지 않는다. 범위 밖이라 이번에 고치지 않는다.
  - `Array.from(text).length` (코드 포인트): `👍🏽`가 2, `👨‍👩‍👧`가 5. FR-005 위반.
  - `grapheme-splitter` 같은 외부 라이브러리: 내장 API로 해결되므로 의존성을 늘릴 이유가 없다.
  - Segmenter 미지원 브라우저용 대체 경로: 대상 브라우저가 모두 지원하므로 만들지 않는다(YAGNI).

## R2. 공백 판정 (FR-003, FR-004)

- **Decision**: grapheme 하나를 `segment.trim() === ''`이면 공백으로 본다. 공백 포함 수 = 전체 grapheme 수, 공백 제외 수 = 공백이 아닌 grapheme 수.
- **Rationale**: `String.prototype.trim`은 ECMAScript WhiteSpace + LineTerminator(스페이스, 탭, 줄바꿈, NBSP, 전각 공백 U+3000 등)를 모두 지운다. 그래서 "공백·탭·줄바꿈 등 모든 공백 문자"(FR-004)와 정확히 맞는다. `\r\n`은 grapheme 하나라서 공백 포함 수에서도 1로 세어진다.
- **확인값**: `가 나` → (3, 2), `가\n나` → (3, 2), 공백 3칸 → (3, 0), `a　b` → (3, 2).
- **Alternatives considered**: 원본 문자열에서 `/\s/g`를 지우고 다시 세는 방식은 결과는 같지만 문자열을 두 번 훑는다. 한 번 순회하며 두 값을 같이 세는 쪽이 더 단순하다.

## R3. 긴 글 성능 (SC-001, SC-003)

- **Decision**: 렌더할 때마다 현재 `content`로 바로 계산한다. 메모이제이션, `useDeferredValue`, debounce는 쓰지 않는다.
- **Rationale**: 6만 자 문자열에서 두 값을 한 번 계산하는 데 평균 4.7ms가 걸렸다(20회 평균). 한 프레임 예산(16ms)과 SC-001의 0.1초 안에 충분히 들어온다. `content` 상태는 입력할 때만 바뀌므로 다른 이유로 다시 렌더될 때의 비용도 무시할 만하다.
- **Alternatives considered**: `useMemo`는 측정상 필요가 없어서 쓰지 않는다. 자동 저장 debounce(1초)에 맞춰 갱신하는 방식은 FR-002("즉시 갱신")를 위반한다.

## R4. 숫자·문구 표기 (FR-007)

- **Decision**: `lib/format.ts`에 표기 함수를 추가한다. 출력 형식은 `공백 포함 {n}자 · 공백 제외 {m}자`이고, 숫자는 `toLocaleString('ko-KR')`로 천 단위 구분 기호를 붙인다.
- **Rationale**: DESIGN.md 9.4는 화면 표기를 `lib/format.ts` 함수로 모으는 규칙을 둔다. 구분 기호 `·`는 에디터 메타(`{일시} 수정 · {날짜} 생성`)와 같은 패턴이다. `ko-KR` 로캘을 고정하면 사용자 브라우저 로캘과 관계없이 `1,234`로 표기된다(Node에서 확인).
- **Alternatives considered**: 컴포넌트 안에서 바로 문자열 만들기 — 표기 규칙이 흩어지고 단위 테스트 경계가 사라진다.

## R5. 화면 낭독기 처리 (FR-011)

- **Decision**: 글자 수 요소에 `id`를 주고, 내용 `textarea`에 `aria-describedby`로 연결한다. `aria-live`·`role="status"`는 붙이지 않는다.
- **Rationale**: `aria-describedby`는 사용자가 내용 입력칸에 포커스할 때 설명으로 읽힌다. 라이브 영역이 아니라서 입력할 때마다 자동으로 낭독되지 않는다. 이것이 FR-011의 두 조건("읽을 수 있음", "입력마다 낭독 안 함")과 정확히 맞는다.
- **Alternatives considered**: `role="status"`(= `aria-live="polite"`)는 키 입력마다 낭독 대기열이 쌓여 입력을 방해한다.

## R6. 시각 표현 (FR-009, FR-010)

- **Decision**: 기존 `.meta` 클래스(`--type-meta`, `--text-tertiary`)를 재사용하고, 위치·간격용 화면 전용 클래스 `.editor-count`를 `globals.css`에 추가한다. 이 클래스에는 `margin-top: var(--space-12)`와 숫자 폭 고정용 `font-variant-numeric: tabular-nums`를 넣는다. 데스크톱과 모바일 모두 같은 요소를 보여 주며(`.d-only`/`.m-only` 없음), 줄바꿈은 `word-break: keep-all`(전역)을 따른다.
- **Rationale**: DESIGN.md 10.2 규칙에 따르면 `--text-tertiary`는 "없어도 이해에 지장 없는 보조 정보"용이고, 글자 수가 여기에 해당한다(FR-010의 "덜 두드러짐"). 마이 페이지 별명 글자 수도 `.meta`를 쓴다(DESIGN.md 7.10). 새 토큰과 DS 컴포넌트는 필요 없다. `tabular-nums`는 숫자가 바뀔 때 글자 폭이 흔들리지 않게 한다.
- **360px 폭 확인**: 가장 긴 예상 문구 `공백 포함 12,345자 · 공백 제외 10,000자`는 12px로 약 220px이다. 모바일 에디터 가용 폭은 360 − 40(좌우 패딩) = 320px라서 한 줄에 들어간다.
- **Alternatives considered**: `--text-secondary`는 본문과 대비가 비슷해져 FR-010과 어긋난다. 새 DS 컴포넌트(`<CharCount>`)는 사용처가 하나뿐이라 YAGNI에 걸린다. `SaveState`처럼 화면 파일 안의 지역 컴포넌트로 둔다.

## R7. 테스트 전략 (원칙 VI)

- **Decision**:
  - `lib/text.test.ts`: 세는 함수의 단위 테스트. 손으로 센 리터럴 기대값을 쓴다(한글, 영문, 공백, 줄바꿈, 탭, 전각 공백, 결합 이모지, 빈 문자열).
  - `lib/format.test.ts`: 표기 함수의 단위 테스트(`0`, `1,234`, 천 단위 경계 `999`/`1,000`).
  - `app/(app)/pages/[id]/page.test.tsx`: 컴포넌트 테스트. `localStorage`에 글을 심고 `loadStore()`로 새 store를 불러온다. `next/navigation`만 `test/navigation.ts`로 대체하고 `nav.params = { id }`를 설정한다. user-event로 입력·삭제·붙여넣기를 한 뒤 입력칸 아래 문구와 `aria-describedby` 연결을 단언한다.
- **Rationale**: 헌법 기술 제약의 테스트 스택·유틸을 그대로 쓴다. 모킹은 App Router 경계 하나뿐이다.
- **브라우저에서만 확인할 항목**: 실제 한글 IME 조합 중 표시, 360px·767px 이하 레이아웃은 jsdom으로 검증할 수 없다. quickstart의 수동 확인으로 검증한다.
