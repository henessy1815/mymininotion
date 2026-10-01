# Data Model: 내용 글자 수 표시

**Feature**: [spec.md](./spec.md) · **Date**: 2026-10-01

## 저장 데이터 변경: 없음

`Page`(`lib/store.ts`) 타입과 localStorage에 저장되는 형태는 바뀌지 않는다(FR-012). 따라서
헌법 원칙 II의 마이그레이션·하위 호환 요구는 적용되지 않는다.

## 파생 값: CharCount

현재 화면의 내용 문자열에서 매번 계산하는 값이다. 저장하지 않고, 상태로 따로 들고 있지도 않는다.

| 필드 | 타입 | 의미 | 규칙 |
| --- | --- | --- | --- |
| `total` | 0 이상 정수 | 공백 포함 글자 수 | 내용의 grapheme cluster 개수 (research R1) |
| `nonSpace` | 0 이상 정수 | 공백 제외 글자 수 | 공백이 아닌 grapheme cluster 개수 (research R2) |

**불변 조건**

- `0 ≤ nonSpace ≤ total`
- 내용이 빈 문자열이면 `total = nonSpace = 0`
- 제목은 입력값이 아니다(FR-006). 계산 입력은 `Page.content`의 현재 편집값(화면에 보이는 값)뿐이다.

**출처와 생명주기**

```text
textarea 입력 ─▶ content 상태 (Editor) ─┬─▶ 자동 저장 (1초 debounce, 기존)
                                        └─▶ CharCount 계산 ─▶ 표기 문자열 ─▶ 화면 (즉시)
```

글자 수 계산은 저장 흐름과 분리되어 있다. 저장 중·저장 실패 상태와 관계없이 화면의 `content`를
기준으로 계산한다(Edge Case "저장 실패 상태").
