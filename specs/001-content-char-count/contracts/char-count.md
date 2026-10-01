# Contract: 글자 수 계산 · 표기 · 화면

**Feature**: [spec.md](../spec.md) · **Data model**: [data-model.md](../data-model.md)

이 기능이 외부에 드러내는 경계는 두 모듈 함수와 글 상세 화면의 UI 계약이다. 테스트는 이 계약을
기준으로 쓴다.

## 1. `countCharacters` — `lib/text.ts` (새 파일)

```ts
export type CharCount = { total: number; nonSpace: number };
export function countCharacters(text: string): CharCount;
```

| 입력 | `total` | `nonSpace` | 근거 |
| --- | --- | --- | --- |
| `''` | 0 | 0 | 빈 내용 |
| `'안녕하세요'` | 5 | 5 | 한글 음절 1자씩 |
| `'가 나'` | 3 | 2 | 스페이스 |
| `'가\n나'` | 3 | 2 | 줄바꿈 = 공백 |
| `'가\t나'` | 3 | 2 | 탭 = 공백 |
| `'가　나'` | 3 | 2 | 전각 공백 |
| `'   '` | 3 | 0 | 공백만 |
| `'abc 123'` | 7 | 6 | 영문·숫자 |
| `'👍'` | 1 | 1 | 이모지 |
| `'👍🏽'` | 1 | 1 | 피부색 수식 |
| `'👨‍👩‍👧'` | 1 | 1 | ZWJ 결합 |
| `'가\r\n나'` | 3 | 2 | CRLF는 한 글자 |

- 순수 함수다. 부수 효과가 없고, 같은 입력이면 항상 같은 결과를 낸다.
- 표기(숫자 형식·단위)는 다루지 않는다.

## 2. `formatCharCount` — `lib/format.ts` (기존 파일에 추가)

```ts
export function formatCharCount(count: CharCount): string;
```

| 입력 | 출력 |
| --- | --- |
| `{ total: 0, nonSpace: 0 }` | `공백 포함 0자 · 공백 제외 0자` |
| `{ total: 999, nonSpace: 998 }` | `공백 포함 999자 · 공백 제외 998자` |
| `{ total: 1000, nonSpace: 1000 }` | `공백 포함 1,000자 · 공백 제외 1,000자` |
| `{ total: 12345, nonSpace: 10000 }` | `공백 포함 12,345자 · 공백 제외 10,000자` |

- 천 단위 구분 기호는 사용자 브라우저 로캘과 관계없이 항상 `,`이다.
- 구분 기호는 가운뎃점 앞뒤에 공백이 하나씩 있는 ` · `이다.

## 3. UI 계약 — 글 상세 화면 `app/(app)/pages/[id]/page.tsx`

| # | 계약 | 관련 요구 |
| --- | --- | --- |
| U1 | 내용 `textarea`(접근 이름 "내용") 바로 다음 형제 위치에 글자 수 요소가 하나 있다. 글자 수 요소는 `.editor` 안, 내용 입력칸 아래에 있다. | FR-001 |
| U2 | 글자 수 요소의 텍스트는 `formatCharCount(countCharacters(현재 내용))`와 같다. | FR-003~007 |
| U3 | 글을 열면 첫 렌더에서 저장된 내용 기준 값을 보여 준다. | FR-008 |
| U4 | 내용이 바뀌면(입력, 삭제, 붙여넣기, 잘라내기) 같은 렌더에서 값이 갱신된다. 자동 저장 타이머를 기다리지 않는다. | FR-002 |
| U5 | 제목을 바꿔도 값이 바뀌지 않는다. | FR-006 |
| U6 | `textarea`의 `aria-describedby`가 글자 수 요소의 `id`를 가리킨다. 글자 수 요소에는 `aria-live`·`role="status"`·`role="alert"`가 없다. | FR-011 |
| U7 | 글자 수 요소는 포커스를 받지 않는다(탭 순서에 없음). 입력 중 포커스·커서를 옮기지 않는다. | FR-010 |
| U8 | 저장 실패 상태에서도 U2를 지킨다. | Edge Case |
| U9 | 시각: `.meta` + `.editor-count` 클래스. 색·글자·간격은 토큰만 쓴다(`--type-meta`, `--text-tertiary`, `--space-*`). 데스크톱·모바일 공통 요소. | FR-009, FR-010, 원칙 III |

테스트 시 기대값은 위 표의 리터럴로 쓰고, `countCharacters`·`formatCharCount`를 호출해 계산하지
않는다(원칙 VI "좋은 테스트").
