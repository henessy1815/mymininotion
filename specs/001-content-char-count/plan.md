# Implementation Plan: 내용 글자 수 표시

**Branch**: `001-content-char-count` | **Date**: 2026-10-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-content-char-count/spec.md`

## Summary

글 상세 화면의 내용 입력칸 바로 아래 한 줄에 `공백 포함 N자 · 공백 제외 M자`를 표시한다. 글자를
입력하거나 지우면 숫자가 즉시 바뀐다.

- **계산**: 순수 함수 `countCharacters`(새 파일 `lib/text.ts`)가 맡는다. 내장 `Intl.Segmenter`로
  사용자가 보는 글자(grapheme) 단위로 세고, `trim()` 기준으로 공백을 판정한다.
- **표기**: `formatCharCount`(`lib/format.ts`)가 맡는다.
- **화면**: `Editor`의 기존 `content` 상태로 렌더할 때마다 계산해 기존 `.meta` 스타일로 보여 준다.
  저장 데이터는 바뀌지 않는다.
- **접근성**: `aria-describedby`로 연결해 화면 낭독기가 입력할 때마다 낭독하지 않게 한다.

자세한 근거는 [research.md](./research.md)에 있다.

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19.2, Next.js 16.3 App Router (`'use client'` 화면)

**Primary Dependencies**: 새 런타임 의존성 없음. 내장 `Intl.Segmenter`(ES2022 Intl)를 쓰고, 기존 `lucide-react`는 이 기능에서 쓰지 않는다.

**Storage**: 변경 없음 (localStorage `Page` 형태 그대로, 글자 수는 저장하지 않음)

**Testing**: Vitest + React Testing Library + `@testing-library/user-event` + jest-dom + jsdom (`test/setup.ts`, `test/store.ts`, `test/navigation.ts`)

**Target Platform**: 최신 데스크톱·모바일 브라우저 (Chrome/Edge 87+, Safari 14.1+, Firefox 125+), 최소 폭 360px

**Project Type**: Next.js 웹 앱 (단일 프로젝트)

**Performance Goals**: 글자 수 갱신 0.1초 이내(SC-001). 6만 자 계산 실측 평균 4.7ms라서 한 프레임(16ms) 안에 끝난다.

**Constraints**: 토큰만 사용(원칙 III), 저장 흐름(1초 debounce)과 독립, 입력 포커스·IME 조합 방해 금지

**Scale/Scope**: 화면 1개(글 상세), 새 파일 1개(`lib/text.ts`), 수정 파일 4개(`lib/format.ts`, `app/(app)/pages/[id]/page.tsx`, `app/globals.css`, `DESIGN.md`), 테스트 파일 3개

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 판정 | 근거 |
| --- | --- | --- |
| I. 개인용 · 0원 · 범위 규율 | ✅ 통과 | 기록 흐름(분량 확인)을 직접 개선한다. 비용 0, 외부 서비스 없음. PRD Non-Goals(리치 에디터 등)에 해당하지 않는다. 글자 수 제한·다른 지표는 spec에서 범위 밖으로 명시했다. |
| II. 데이터 무손실 · 계정 격리 | ✅ 통과 | `Page` 형태와 저장 흐름은 그대로다. 글자 수는 파생 값이라 저장하지 않으므로 마이그레이션이 필요 없다. 자동 저장·저장 상태 표시 코드는 건드리지 않는다. |
| III. 코드가 진실 · DS 준수 | ✅ 통과 | 기존 `.meta`(`--type-meta`, `--text-tertiary`)를 재사용한다. 새 클래스 `.editor-count`는 `var(--space-12)`만 쓰고 새 토큰·DS 컴포넌트는 없다. 같은 변경에서 DESIGN.md 7.10·8.3·9.4·10.1·부록 B를 갱신하고, 11장 체크리스트로 점검한다. |
| IV. 키보드 · 한국어 우선 | ✅ 통과 | 포커스를 받지 않는 정적 텍스트라서 키보드 흐름을 바꾸지 않는다. Enter 제출 입력을 새로 만들지 않는다. 문구는 한국어 명사구(DESIGN.md 9.2 "메타" 규칙)를 쓴다. 360px 한 줄 수용을 확인했다(research R6). |
| V. 구조 분리 · 단순함 | ✅ 통과 | 계산은 `lib/text.ts`, 표기는 `lib/format.ts`, 화면은 `app/`에 둔다. 화면은 store 구현을 직접 알지 않는다. 새 의존성·추상화·메모이제이션이 없다. 표시 요소는 `SaveState`처럼 화면 파일 안의 지역 컴포넌트로 둔다. |
| VI. TDD (NON-NEGOTIABLE) | ✅ 통과 (계획) | 구현은 `/superpowers:test-driven-development`로 시작한다. 계약서의 리터럴 표를 테스트 케이스로 쓰고, 동작마다 실패 테스트 → 실패 확인 → 최소 구현 → `npm run test:run` 순서로 진행한다. 모킹은 `next/navigation` 하나뿐이고 `localStorage`는 실제 jsdom 구현을 쓴다. CSS 스타일만 브라우저 확인으로 검증한다(원칙 VI 예외 조항). |

**Post-design 재점검 (Phase 1 이후)**: data-model·contracts·quickstart 작성 후 다시 점검했다. 저장
형태 변경 없음(II), 새 토큰·컴포넌트 없음(III), `aria-live` 미사용으로 입력 방해 없음(IV), 새 모듈 1개는
계산 책임 하나만 가짐(V), 계약서가 테스트 가능한 리터럴 표로 정의됨(VI). **위반 없음.**

## Project Structure

### Documentation (this feature)

```text
specs/001-content-char-count/
├── plan.md              # 이 파일
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── char-count.md    # Phase 1 — 함수·UI 계약
├── checklists/
│   └── requirements.md  # /speckit-specify 품질 체크리스트
└── tasks.md             # Phase 2 (/speckit-tasks에서 생성)
```

### Source Code (repository root)

```text
lib/
├── text.ts                    # 새 파일: countCharacters, CharCount 타입
├── text.test.ts               # 새 파일: 계산 단위 테스트
├── format.ts                  # 수정: formatCharCount 추가
└── format.test.ts             # 새 파일: 표기 단위 테스트

app/
├── (app)/pages/[id]/
│   ├── page.tsx               # 수정: Editor에 CharCount 지역 컴포넌트, textarea aria-describedby
│   └── page.test.tsx          # 새 파일: UI 계약 U1~U8 컴포넌트 테스트
└── globals.css                # 수정: .editor-count (에디터 영역 규칙 옆)

DESIGN.md                      # 수정: 7.10, 8.3, 9.4, 10.1, 부록 B
```

**Structure Decision**: 기존 단일 Next.js 프로젝트의 `app/` · `lib/` 분리를 그대로 따른다. 테스트는 헌법
기술 제약대로 대상 파일 옆에 `*.test.ts(x)`로 둔다.

## 구현 순서 (tasks 생성 참고)

1. `countCharacters` — 계약서 표 1을 한 줄씩 실패 테스트 → 구현 (US1·US2의 기반)
2. `formatCharCount` — 계약서 표 2
3. 화면 P1 — U1·U3·U4·U5 (표시 위치, 첫 렌더 값, 즉시 갱신, 제목 무관). 공백 제외 값이 포함된 최종 문구로 단언한다.
4. 화면 접근성 — U6·U7
5. 화면 엣지 — U8 (저장 실패 시에도 정확)
6. 스타일 — `.editor-count` 추가, 360px·767px 브라우저 확인
7. DESIGN.md 갱신 → 11장 체크리스트 → `npm run test:run` · `lint` · `build` → quickstart 수동 확인

## Complexity Tracking

Constitution Check 위반이 없어 해당 없음.
