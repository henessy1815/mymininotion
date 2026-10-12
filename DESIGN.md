# DESIGN.md — 미니 노션 디자인 가이드

> 현재 코드에 구현된 디자인 결정을 추출한 문서입니다. 새 화면·기능을 만들 때 사람과 AI 에이전트가 같은 결과물을 내는 것이 목표입니다.
> 기준 시점: 2026-10-12 · Next.js 16.3 · React 19.2 · lucide-react 1.x

---

## 0. 이 문서를 쓰는 법

| 항목 | 내용 |
| --- | --- |
| 대상 독자 | 이 저장소에서 UI를 만드는 사람, 그리고 코드를 생성하는 AI 에이전트 |
| 진실의 원천 | **코드가 우선**. 이 문서와 코드가 다르면 코드를 따르고 이 문서를 고친다 |
| 토큰 | `app/styles/tokens.css` (색·타이포·간격·radius·레이아웃·그림자·모션) |
| 컴포넌트 스타일 | `app/globals.css` (DS 클래스 + 화면별 스타일, 한 파일) |
| 컴포넌트 API | `components/ds.tsx` (DS 원자 컴포넌트), `components/shell.tsx` (앱 셸·검색·삭제 다이얼로그) |
| 표기 규칙 | 값은 토큰명으로 먼저 쓰고 실제 값은 괄호로 병기. 코드에 명시되지 않고 반복으로만 확인된 규칙은 `(관찰된 패턴)`으로 표시 |

**갱신 규칙**

1. 새 토큰·컴포넌트를 추가하면 같은 커밋에서 이 문서의 해당 섹션과 부록을 갱신한다.
2. 불일치를 고치면 [알려진 불일치](#알려진-불일치) 목록에서 해당 항목을 지운다.
3. 이 문서에 새 규칙을 먼저 쓰고 코드를 나중에 맞추지 않는다. 코드가 먼저다.

**출처 메모** — 토큰과 DS 컴포넌트는 "Teamchat design system"(Claude Design 프로젝트)에서 복사해 왔다 (`tokens.css:1-5`, `ds.tsx:3-7`). 미니 노션에서 달라진 점:

| Teamchat 원본 | 미니 노션 |
| --- | --- |
| `fonts.css`로 폰트 로드 | `next/font/local`로 대체 (`app/layout.tsx`) |
| hover 상태를 JS state로 처리 | CSS `:hover`로 이동 (`globals.css`) |
| `lucide-static`을 CDN에서 로드 | `lucide-react` 패키지 사용 |
| rail(`--rail-w`), 상세 패널(`--detail-w`), 공지 배너(`--notice-h`, `--bg-notice`) | 해당 UI 없음 → 토큰만 남아 있고 **미사용** |
| 봇 아바타·AI 라이터(`--purple-500`, `--pink-300`), 온라인 상태(`--green-500`) | 봇·AI·협업 기능 없음 → 보라는 사용자 아바타·빈 상태에만, 초록·분홍·민트는 **미사용** |

---

## 1. 디자인 원칙 & 톤앤매너

**한 문장 요약** — 미니 노션은 **회색 종이 위에 흰 시트를 올려놓은 것처럼 조용하게 보이고, 키보드 하나로 바로 기록을 시작할 수 있을 만큼 가볍게 느껴져야 한다.**

| # | 원칙 | Do | Don't |
| --- | --- | --- | --- |
| 1 | **무채색이 기본, 색은 의미가 있을 때만** | 텍스트·배경·보더는 `--text-*`, `--bg-*`, `--border-*` 회색 계열로 구성 | 장식 목적으로 보라·빨강을 쓰거나 새 브랜드 컬러를 추가 |
| 2 | **깊이는 톤과 1px 보더로** | `--bg-app` 위에 `--bg-surface` 시트, 구분선은 `1px solid var(--border-subtle)` | 고정 레이아웃 요소에 `--shadow-md` 이상 사용 (떠 있는 레이어 전용) |
| 3 | **둥글고 부드러운 형태** | 버튼·검색·상단 pill은 `--radius-pill`, 리스트 항목·아이콘 버튼은 `--radius-8`, 시트·카드·다이얼로그는 `--radius-12` | 각진 모서리(`0`)를 데스크톱 UI에 사용 (모바일 전체폭 시트만 예외) |
| 4 | **키보드 우선, 기록이 먼저** | `/page` 명령어, Enter/Esc/↑↓ 조작, 조작 방법은 `Kbd`로 화면에 노출 | 새 글 만들기를 위해 모달·폼을 거치게 만들기 |
| 5 | **한국어 우선의 담백한 해요체** | Pretendard + `word-break: keep-all`, "~어요/~해 주세요" 문장 | 느낌표·이모지·과장된 문구, 영어 UI 라벨 |

**가설 검증 결과 요약**

| 가설 | 결과 | 근거 |
| --- | --- | --- |
| 차분한 무채색 중심 | ✅ 확인 | 모든 화면 배경·텍스트가 `--gray-*` 기반 semantic 토큰 |
| 보라는 봇/AI·강조에만 | ✏️ 수정 | 봇·AI 없음. 보라는 **사용자 아바타 기본 배경**(`--accent`), **빈 상태 일러스트**, **링크 hover**에만 사용 |
| 빨강=위험/알림, 초록=온라인, 민트=공지 | ✏️ 수정 | 빨강은 삭제·오류·저장 실패에 사용. **초록·민트는 미사용** (해당 UI 없음) |
| Primary는 검정에 가까운 pill | ✅ 확인 (사용처 1곳) | `.btn-primary` = `--bg-inverse`(#2D2D2D) + `--radius-pill`. 실제 사용은 마이 페이지 "저장" 버튼뿐 |
| pill / radius-8 | ✅ 확인 + 보완 | 시트·카드·다이얼로그·명령 입력창은 `--radius-12` |
| 얕은 깊이감 | ✅ 확인 + 보완 | 고정 요소는 `--shadow-xs`/`--shadow-panel`. 드롭다운은 `--shadow-md`, 다이얼로그는 `--shadow-lg`. `--shadow-sm`은 미사용 |
| 본문 14/1.6, 행 32, 컨트롤 28/36/40 | ✅ 확인 + 보완 | 에디터 본문은 15px/1.75로 더 여유. 목록 행은 52px, 모바일 터치 타깃 44px |
| 100–240ms, `--ease-standard` | ✏️ 부분 수정 | 실사용은 100ms(`--dur-fast`)·160ms(`--dur-base`)뿐. `--dur-slow`(240ms) 미사용. easing은 `.btn`에만 명시 |
| 한국어 우선 타이포 | ✅ 확인 | `lang="ko"`, Pretendard Variable, `body { word-break: keep-all }` |
| 담백한 존댓말 | ✅ 확인 (예외 1곳) | 해요체 중심. 삭제 다이얼로그 설명만 합니다체 |

---

## 2. 컬러

출처: `app/styles/tokens.css:7-67`

### 2.1 Primitive 팔레트

> 새 코드에서는 primitive를 직접 참조하지 않는다. 아래 "코드 주석의 용도"는 Teamchat 원본 기준이다.

| 토큰 | 값 | 코드 주석의 용도 | 미니 노션 사용 |
| --- | --- | --- | --- |
| `--gray-0` | `#FFFFFF` | — | `--bg-surface`, `--text-inverse` |
| `--gray-25` | `#F8F8F8` | sidebar | `--bg-sidebar`, `--bg-surface-hover` |
| `--gray-50` | `#EFEFEF` | app chrome | `--bg-app` |
| `--gray-100` | `#EBEBEB` | selected row | `--bg-selected` |
| `--gray-150` | `#E4E4E4` | dividers, segmented thumb | `--border-subtle` |
| `--gray-200` | `#D9D9D9` | input borders | `--border-default` |
| `--gray-300` | `#C4C4C4` | — | `--border-emphasis` |
| `--gray-400` | `#A3A3A3` | placeholder | `--text-placeholder`, `--bg-switch-track` |
| `--gray-500` | `#8A8A8A` | tertiary text | `--text-tertiary` |
| `--gray-600` | `#6B6B6B` | secondary text | `--text-secondary` |
| `--gray-700` | `#48484A` | kbd on dark | 미사용 |
| `--gray-800` | `#313133` | tooltip | `--bg-tooltip` (미사용) |
| `--gray-850` | `#2D2D2D` | primary button | `--bg-inverse` |
| `--gray-900` | `#1F1F1F` | primary text | `--text-primary`, `--border-strong`, 다크 테마 `--text-inverse` |
| `--mint-100` / `--mint-200` | `#DCE9E9` / `#C9DCDC` | notice banner | 미사용 |
| `--purple-50` | `#F1EEFF` | — | `--bg-accent-soft` |
| `--purple-100` | `#E4DEFF` | — | 미사용 |
| `--purple-300` | `#B3A3FE` | — | 다크 테마 `--text-accent` |
| `--purple-500` | `#8065FE` | bot avatar, illustration | `--accent` |
| `--purple-600` | `#6A4FF0` | — | `--text-accent` |
| `--red-500` | `#E5485F` | new-message divider, notice dot | `--text-danger`, `--status-alert`, `--bg-danger` |
| `--red-100` | `#FBE3E7` | — | `--bg-danger-soft` |
| `--green-500` | `#2EAB59` | online status, support | `--status-online` (미사용) |
| `--pink-300` | `#E8B6EA` | AI writer glyph tint | 미사용 |

### 2.2 Semantic 토큰 — 새 코드는 이것만 사용

**배경**

| 토큰 | 값 | 사용처 |
| --- | --- | --- |
| `--bg-app` | `--gray-50` | `body`, `.app`, `.login-screen` — 가장 바깥 회색 바탕 |
| `--bg-sidebar` | `--gray-25` | `.sidebar` |
| `--bg-surface` | `--gray-0` | `.sheet`, 카드, 다이얼로그, 드롭다운, pill, 입력창 |
| `--bg-surface-hover` | `--gray-25` | 흰 배경(`--bg-surface`) 요소의 hover (`.btn-secondary`, pill, `.google-btn`, 목록 행) |
| `--bg-hover` | `rgba(0,0,0,.04)` | 투명 배경 요소의 hover (`.btn-ghost`, `.icon-btn`, `.sb-item`) |
| `--bg-pressed` | `rgba(0,0,0,.07)` | 정의만 있음 (미사용) |
| `--bg-selected` | `--gray-100` | 선택 상태 (`.sb-item.is-selected`, `.icon-btn.is-active`, 검색·명령 결과의 활성 항목) |
| `--bg-inverse` | `--gray-850` | Primary 버튼, 로고 마크, 켜진 스위치 트랙 |
| `--bg-inverse-hover` | `#000000` | Primary 버튼 hover |
| `--bg-danger` / `--bg-danger-hover` | `--red-500` / `#D23A51` | Danger 버튼 / hover |
| `--bg-danger-soft` | `--red-100` | 오류 `.alert` 배경 |
| `--bg-overlay` | `rgba(0,0,0,.28)` | 다이얼로그 딤 |
| `--bg-switch-track` | `--gray-400` | 꺼진 스위치 트랙 (`SidebarSwitch`) |
| `--bg-accent-soft` | `--purple-50` | 보라 톤 배경 (빈 상태 일러스트, 글 커버 기본 바탕·실패 대체) |
| `--bg-skeleton` | `--gray-100` | 스켈레톤 자리표시 바탕 (`.skeleton`) |
| `--bg-skeleton-shine` | `rgba(255,255,255,.6)` | 스켈레톤 시머의 빛 띠 (그라디언트 중앙색) |
| `--bg-rail-selected`, `--bg-notice`, `--bg-tooltip`, `--bg-badge` | — | Teamchat 잔재, 미사용 |

**텍스트**

| 토큰 | 값 | 사용처 |
| --- | --- | --- |
| `--text-primary` | `#1F1F1F` | 본문·제목·라벨 기본 |
| `--text-secondary` | `#6B6B6B` | 설명문, 섹션 헤더, breadcrumb 부모, 개수(`.sheet-count`) |
| `--text-tertiary` | `#8A8A8A` | 메타 정보(날짜), 빈 상태 보조 문구, 아이콘 보조색, 저장 상태 |
| `--text-placeholder` | `#A3A3A3` | placeholder, breadcrumb 구분자 `/`, 제목 없는 글 아이콘 |
| `--text-inverse` | `#FFFFFF` | `--bg-inverse` 위 텍스트 (Primary 버튼, 로고 마크). 다크 테마에서는 어두운 색으로 뒤집힌다 |
| `--text-on-color` | `#FFFFFF` | 컬러 면 위 텍스트 (Danger 버튼, 아바타 이니셜). 테마와 무관하게 흰색 |
| `--text-danger` | `#E5485F` | 오류 문구 (`.command-error`, `.mp-field-hint.is-error`) |
| `--text-accent` | `#6A4FF0` | 링크 hover, 빈 상태 일러스트 아이콘 |

**보더**

| 토큰 | 값 | 사용처 |
| --- | --- | --- |
| `--border-subtle` | `#E4E4E4` | 구분선 (`.sheet-header` 하단, 목록 행, `.editor-divider`, `.mp-section` 사이) |
| `--border-default` | `#D9D9D9` | 입력창·Secondary 버튼·`Kbd` 테두리 |
| `--border-strong` | `#1F1F1F` | 입력창 focus (`:focus-within`) |
| `--border-emphasis` | `--gray-300` | `.google-mark` 점선 보더 |

**상태**

| 토큰 | 값 | 사용처 |
| --- | --- | --- |
| `--accent` | `--purple-500` | 사용자 아바타 기본 배경 (`UserAvatar`) |
| `--status-alert` | `--red-500` | 정의만 있음 |
| `--status-online` | `--green-500` | 미사용 (온라인 상태 UI 없음) |

### 2.3 포인트 컬러 사용 규칙

| 색 | 언제 쓰는가 | 실제 사용처 |
| --- | --- | --- |
| **보라** | 사용자 정체성과 "비어 있음"을 부드럽게 채울 때 | `UserAvatar` 기본 배경(`--accent`), `.empty-illust` 배경·아이콘(`--bg-accent-soft`, `--text-accent`), `a:hover` |
| **빨강** | 되돌릴 수 없는 행동, 실패, 입력 오류 | `.btn-danger`(삭제 확정), `.save-state.is-failed`, `.alert`(로그인·이미지 오류), `.command-error`, `.mp-field-hint.is-error` |
| **초록 / 민트 / 분홍** | 현재 쓰지 않는다 | 온라인 상태·공지 배너·AI 기능이 Non-Goal이므로 새로 쓰지 않는다 |

- 빨강 배경 면(`.alert`)은 연한 `--red-100` + 본문은 `--text-primary`, 아이콘만 빨강으로 쓴다. 문장 전체를 빨강으로 칠하지 않는다. `(관찰된 패턴)`
- 짧은 인라인 오류(한 줄 힌트)는 배경 없이 `--text-danger` 텍스트만 쓴다.

### 2.4 금지 사항

- ❌ hex·rgba 하드코딩 (`#000`, `#fff` 등) — semantic 토큰이 없으면 `tokens.css`에 먼저 추가한다.
- ❌ primitive 직접 참조 (`var(--gray-25)`, `var(--red-500)`) — semantic으로 매핑된 토큰을 쓴다.
- ❌ 새 브랜드 컬러·그라디언트 추가. 예외: `.skeleton`의 시머 빛 띠(`transparent → --bg-skeleton-shine → transparent`)만 허용한다.
- ❌ 색만으로 상태 전달 — 저장 실패처럼 아이콘(`CircleAlert`)과 텍스트를 함께 둔다.

### 2.5 다크 테마

출처: `app/styles/tokens.css` (`:root[data-theme="dark"]`), `lib/theme.ts`, `app/layout.tsx`

| 항목 | 규칙 |
| --- | --- |
| 전환 방식 | `<html data-theme="light\|dark">`. 다크 블록은 **semantic 토큰과 그림자만** 덮어쓴다. primitive는 그대로 |
| 저장 | localStorage `mini-notion:theme`. 저장값이 없으면 OS 설정(`prefers-color-scheme`)을 따른다 |
| 깜빡임 방지 | `app/layout.tsx` `<head>`의 인라인 스크립트가 첫 페인트 전에 `data-theme`을 넣는다 (`<html suppressHydrationWarning>`). 개발 모드 Strict Mode 재마운트가 속성을 지우면 `ThemeSync`가 다시 넣는다 |
| 상태 읽기·변경 | `useTheme()` → `'light' \| 'dark'`, `setTheme(theme)` (`lib/theme.ts`). 다른 탭 변경도 `storage` 이벤트로 반영 |
| 네이티브 UI | `color-scheme: light \| dark`로 스크롤바·폼 컨트롤도 함께 바뀐다 |
| 진입점 | 사이드바 하단 "다크 모드" 스위치 (§7.12). 모바일은 사이드바가 없어 OS 설정을 따른다 |

**다크 값** (밝은 테마 대비 바뀌는 것만)

| 토큰 | 값 | 토큰 | 값 |
| --- | --- | --- | --- |
| `--bg-app` | `#141414` | `--text-primary` | `#EDEDED` |
| `--bg-sidebar` | `#1B1B1B` | `--text-secondary` | `#ABABAB` |
| `--bg-surface` | `#202020` | `--text-tertiary` | `#8F8F8F` |
| `--bg-surface-hover` | `#272727` | `--text-placeholder` | `#666666` |
| `--bg-hover` / `--bg-pressed` | `rgba(255,255,255,.06)` / `.1` | `--text-inverse` | `--gray-900` |
| `--bg-selected` | `#2E2E2E` | `--text-danger` | `#FF6B80` |
| `--bg-inverse` / `-hover` | `#EDEDED` / `#FFFFFF` | `--text-accent` | `--purple-300` |
| `--bg-accent-soft` | `#2A2640` | `--border-subtle` | `#2E2E2E` |
| `--bg-skeleton` / `-shine` | `#2A2A2A` / `rgba(255,255,255,.06)` | `--border-default` | `#3D3D3D` |
| `--bg-danger-hover` | `#EE5C71` | `--border-strong` | `#EDEDED` |
| `--bg-danger-soft` | `#3B1F25` | `--border-emphasis` | `#555555` |
| `--bg-overlay` | `rgba(0,0,0,.6)` | `--shadow-*` | 검정 그림자를 진하게 + 흰 1px 링 |
| `--bg-switch-track` | `#5A5A5A` | | |

- 깊이 규칙은 그대로: `--bg-app`(가장 어두움) → `--bg-sidebar` → `--bg-surface`(가장 밝음). hover는 한 톤 **밝게**.
- 다크에서도 바뀌지 않는 것: `--bg-danger`(`--red-500`), `--accent`(`--purple-500`), `--text-on-color`(흰색).
- ✅ 새 UI가 semantic 토큰만 쓰면 다크 테마는 자동으로 맞는다. primitive·hex를 쓰면 다크에서 깨진다.

---

## 3. 타이포그래피

출처: `app/layout.tsx`, `app/styles/tokens.css:69-94`, `app/globals.css:8`

### 3.1 폰트 패밀리와 로딩

| 항목 | 값 |
| --- | --- |
| 본문 폰트 | Pretendard Variable — `app/fonts/PretendardVariable.woff2` |
| 로딩 | `next/font/local` · `weight: '45 920'` · `display: 'swap'` · CSS 변수 `--font-pretendard`를 `<html>`에 주입 |
| 스택 | `--font-sans`: `var(--font-pretendard)`, "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif |
| 고정폭 | `--font-mono`: ui-monospace, "SF Mono", Menlo, monospace (미사용 — `Kbd`도 sans 사용) |
| 문서 언어 | `<html lang="ko">` |
| 렌더링 | `-webkit-font-smoothing: antialiased` |

### 3.2 역할별 타입 스케일

| 토큰 | 굵기 / 크기 / 행간 | 사용처 |
| --- | --- | --- |
| `--type-title-lg` | 700 / 24px / 1.3 | 빈 상태 제목, 로그인 서비스명, 에디터 제목의 기반(28px로 덮어씀) |
| `--type-title` | 700 / 18px / 1.3 | 시트 헤더 제목(`.sheet-title`), 다이얼로그 제목, NotFound 제목 |
| `--type-heading` | 600 / 14px / 1.4 | 마이 페이지 섹션 제목, breadcrumb 현재 글 |
| `--type-body` | 400 / 14px / 1.6 | 설명 문단 (빈 상태, 다이얼로그, 로그인 부제) |
| `--type-label` | 500 / 14px / 1.4 | breadcrumb 부모·구분자 |
| `--type-caption` | 400 / 13px / 1.45 | 알림(`.alert`), 오류·힌트, 섹션 설명 |
| `--type-meta` | 400 / 12px / 1.4 | `.meta` — 날짜, 개수, 정렬 기준, 사이드바 빈 상태·힌트 |
| `--type-micro` | 600 / 11px / 1.2 | 정의만 있음 (미사용) |

**스케일 밖의 컴포넌트 전용 값** `(관찰된 패턴)`

| 용도 | 값 | 위치 |
| --- | --- | --- |
| 버튼 라벨 | 600 14px/1 (sm: 12px) | `.btn` |
| 목록·검색 결과 제목 | 600 14px/1.4 (= `--type-heading`과 동일 값) | `.page-link-title`, `.search-result-title` |
| pill·검색 입력 | 500 13px/1 | `.search-pill`, `.search-input-wrap input`, `.save-state` |
| 명령 입력창 | 500 15px/1 | `.command-box input` |
| 에디터 제목 | 700 28px/1.3 (모바일 700 22px/1.35) | `.editor-title` |
| 에디터 본문 | 400 15px/1.75 | `.editor-body` |

> 새 UI는 먼저 8개 역할 토큰(`font: var(--type-*)`)으로 해결한다. 에디터처럼 긴 글을 읽고 쓰는 영역만 15px·1.75 행간 예외를 허용한다.

### 3.3 한국어 조판 규칙

- `body { word-break: keep-all; }` — 단어(어절) 단위 줄바꿈. 전역 적용이므로 따로 지정하지 않는다.
- 여러 줄 설명문은 `text-wrap: pretty`를 쓴다 (`.dialog-desc`, 로그인 하단 안내). `(관찰된 패턴)`
- 자간은 `--ls-normal`(0) 고정. `--ls-tight`(-0.01em)은 정의만 있고 쓰지 않는다.
- 한 줄 제목·라벨은 `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` + 부모 `min-width: 0` 조합으로 말줄임한다 (`.sb-item-label`, `.page-link-title`, `.crumb-current`).

---

## 4. 간격 · 레이아웃 · 그리드

출처: `app/styles/tokens.css:96-111`, `app/globals.css`

### 4.1 Spacing 스케일

`--space-0` · `2` · `4` · `6` · `8` · `10` · `12` · `14` · `16` · `20` · `24` · `32` · `40` · `48` (단위 px, 토큰명 숫자 = px)

> ⚠️ 현재 `globals.css`는 spacing 토큰을 거의 쓰지 않고(`.editor-count`, 커버 아래 `.editor-wrap` 상단 여백만 사용) px를 직접 적는다. 값 자체는 대부분 스케일 안에 있다. 새 코드는 `var(--space-*)`를 쓴다.

**자주 쓰는 조합** `(관찰된 패턴)`

| 상황 | 값 |
| --- | --- |
| 아이콘–텍스트 gap | 6px (버튼·pill·검색), 8px (사이드바 항목), 10px (명령/검색 결과), 12px (목록 행) |
| 리스트 항목 사이 | 2px (`.sidebar-nav`, `.sb-section`) |
| 버튼 그룹 사이 | 8px (`.dialog-actions`, `.mp-avatar-actions`, `.mp-field-row`) |
| 시트 헤더 좌우 패딩 | 24px (compact 12px, 모바일 16px/8px) |
| 콘텐츠 영역 패딩 | 업무 `28px 24px 24px`, 에디터 `56px 24px 80px`, 마이 `40px 24px` |
| 섹션 간격 | 28px 상하 + 1px 구분선 (`.mp-section`) |
| 앱 셸 여백 | 시트와 사이드바 사이 8px, 바깥 8px |

### 4.2 Radius 스케일과 요소별 매핑

| 토큰 | 값 | 요소 |
| --- | --- | --- |
| `--radius-4` | 4px | `Kbd` |
| `--radius-6` | 6px | 로고 마크(22px), 명령 항목 아이콘 박스 |
| `--radius-8` | 8px | `IconButton`, `SidebarItem`, 검색·명령 드롭다운과 그 항목, 목록 행 hover, `.alert`, `.mp-field` |
| `--radius-12` | 12px | `.sidebar`, `.sheet`, `.login-card`, `.dialog`, `.command-box`, `.empty-illust`, 로그인 로고(48px) |
| `--radius-pill` | 999px | `Button`, `SearchPill`, 검색 입력, `.brand-pill`, `.user-pill`, `.google-btn` |
| `50%` | — | `Avatar`, `.google-mark` |
| `--radius-10` / `16` / `20` | — | 미사용 |

### 4.3 레이아웃 치수

| 토큰 | 값 | 사용 |
| --- | --- | --- |
| `--topbar-h` | 56px | `.topbar` |
| `--sidebar-w` | 232px | `.sidebar` |
| `--header-h` | 52px | `.sheet-header` |
| `--row-h` | 32px | `.sb-item` |
| `--control-sm` / `md` / `lg` | 28 / 36 / 40px | `Button` size `sm` / `md` / `lg` |
| `--cover-h` / `--cover-h-sm` | 200 / 140px | 글 상세 커버 높이 (데스크톱 / 767px 이하) |
| `--rail-w` 56px, `--detail-w` 296px, `--notice-h` 40px | — | 미사용 (Teamchat 잔재) |

**토큰 밖의 고정 치수** `(관찰된 패턴)`: pill·검색 입력 높이 32px, 목록 행 52px, 명령 입력창 48px, 명령 항목 44px, 검색 결과 행 40px, 마이 페이지 입력 40px(= `--control-lg`), Google 버튼 44px, 콘텐츠 최대폭 760px(업무) / 720px(에디터) / 600px(마이) / 400px(로그인 카드) / 380px(다이얼로그) / 320px(드롭다운).

### 4.4 앱 셸 구조

출처: `components/shell.tsx` `AppShell`

```
.app (100dvh, --bg-app)
├─ header.topbar (--topbar-h 56)
│   [.brand-pill  N 미니 노션]  ······spacer······  [SearchBox]  [.user-pill ◯ 별명]
└─ .app-body (flex, gap 8, padding 0 8 8)
    ├─ nav.sidebar (--sidebar-w 232, --bg-sidebar, --radius-12)
    │   ├─ .sidebar-nav   SidebarItem ×2 (업무 페이지 / 마이 페이지)
    │   ├─ SidebarSection "최근 글"  → SidebarItem ×최대 5 (제목 있는 글만)
    │   └─ .sidebar-foot  (margin-top: auto → 하단 고정, gap 2)
    │       ├─ SidebarSwitch "다크 모드" (ThemeToggle)
    │       └─ .sidebar-hint  [/page]로 새 글 만들기
    └─ main.sheet (flex 1, --bg-surface, --radius-12)
        ├─ .sheet-header (--header-h 52, 하단 1px --border-subtle)
        └─ .sheet-scroll (overflow-y: auto)
            └─ 화면별 콘텐츠 (가운데 정렬 + max-width)
```

- 로그인(`/login`)은 셸 밖이다. `.login-screen`이 카드 하나를 화면 중앙에 둔다.
- 화면 헤더 구성: `[제목 or 뒤로가기+breadcrumb]` → `.spacer` → `[메타·상태]` → `.divider-v` → `[IconButton]`.

### 4.5 반응형 / 모바일

출처: `globals.css:275-301` — 브레이크포인트는 **`max-width: 767px` 하나**. PRD 기준 최소 지원 폭 360px.

| 유틸리티 | 데스크톱 | 모바일 |
| --- | --- | --- |
| `.d-only` | 보임 | `display: none !important` |
| `.m-only` | `display: none !important` | `display: flex !important` |

**모바일 변화 규칙**

| 요소 | 변화 |
| --- | --- |
| `.topbar`, `.sidebar` | 숨김. 로고·검색·아바타는 `.sheet-header` 안의 `.m-only` 요소로 이동 |
| `.app` / `.sheet` | 배경 `--bg-surface`, 시트 radius 0, 바깥 여백 0 (전체폭) |
| 터치 타깃 | 헤더의 `IconButton`·링크는 `size={44}` (데스크톱 32) |
| 검색 | 헤더 검색 아이콘 → 헤더 아래 `.m-search` 줄에 `SearchBox expanded` 전체폭 (그림자 대신 1px 보더) |
| 목록 행 | 아이콘·삭제 버튼 숨김, 제목과 날짜를 세로로 쌓음, 제목 15px, 최소 높이 60px, hover 배경 없음 |
| 에디터 | 패딩 `24px 20px 64px`, 제목 22px. 커버 높이 `--cover-h-sm`, 커버 아래 상단 패딩 `--space-24` |
| 삭제 | 목록에서는 삭제 불가, 글 상세 헤더의 삭제 버튼으로만 |

---

## 5. 깊이 · 모션

출처: `tokens.css:113-127`

### 5.1 그림자

| 토큰 | 사용처 | 규칙 |
| --- | --- | --- |
| `--shadow-none` | — | 기본은 그림자 없음 |
| `--shadow-panel` | `.login-card` | 1px 링만 있는 가장 약한 윤곽. 배경 위 독립 카드 |
| `--shadow-xs` | `.search-pill`, `.brand-pill`, `.user-pill`, `.search-input-wrap` | `--bg-app` 위에 떠 있는 작은 흰 pill |
| `--shadow-sm` | — | 미사용 |
| `--shadow-md` | `.search-results`, `.command-menu` | 콘텐츠 위에 뜨는 드롭다운 |
| `--shadow-lg` | `.dialog` | 모달 다이얼로그 (배경 딤 `--bg-overlay`와 함께) |

- 시트·사이드바는 그림자 없이 **배경 톤 차이**(`--bg-app` vs `--bg-surface`/`--bg-sidebar`)로 분리한다.
- 선택 상태의 pill은 그림자를 없앤다 (`.user-pill.is-selected { box-shadow: none }`).

### 5.2 모션

| 토큰 | 값 | 사용처 |
| --- | --- | --- |
| `--dur-fast` | 100ms | 배경색 전환 (`.btn`, `.icon-btn`) |
| `--dur-base` | 160ms | 사이드바 섹션 chevron 회전, 스위치 thumb 이동 |
| `--dur-slow` | 240ms | 미사용 — 패널 등장처럼 큰 이동에 예약 |
| `--ease-standard` | `cubic-bezier(.2,0,0,1)` | `.btn`, `.switch` transition |
| `--ease-out` | `cubic-bezier(0,0,.2,1)` | 미사용 |
| `.spin` | `spin 1s linear infinite` | 로딩 아이콘(`LoaderCircle`) |
| `--dur-shimmer` | 1400ms | `.skeleton::after` 시머(`shimmer` 키프레임, `transform: translateX` -100% → 100%, `--ease-standard`, 무한 반복). `prefers-reduced-motion: reduce`에서는 빛 띠를 숨겨 정적 자리표시만 남긴다 |

**규칙**: transition은 `background`·`transform`에만 건다. 새 transition은 `var(--dur-*) var(--ease-standard)`를 함께 쓴다. 등장/퇴장 애니메이션은 현재 없다 (드롭다운·다이얼로그는 즉시 표시).

### 5.3 상호작용 상태 표현

| 상태 | 표현 | 예 |
| --- | --- | --- |
| hover (투명 배경 요소) | `--bg-hover` | `.btn-ghost`, `.icon-btn`, `.sb-item` |
| hover (흰 배경 요소) | `--bg-surface-hover` (라이트는 한 톤 어둡게, 다크는 한 톤 밝게) | `.btn-secondary`, `.search-pill`, `.brand-pill`, `.google-btn`, 목록 행 |
| hover (inverse·컬러 배경) | `--bg-inverse-hover`, `--bg-danger-hover` | `.btn-primary`, `.btn-danger` |
| on / off (스위치) | 트랙 `--bg-switch-track` → `--bg-inverse`, thumb `translateX(--space-12)` | `SidebarSwitch` (`aria-checked`) |
| pressed | 별도 스타일 없음 (`--bg-pressed` 미사용) | — |
| selected / active | `--bg-selected` + (사이드바는) `font-weight: 600` | `.sb-item.is-selected`, `.icon-btn.is-active`, `.search-result.is-active` |
| focus (입력) | 보더 → `--border-strong` | `.command-box:focus-within`, `.mp-field:focus-within` |
| disabled | `opacity: .4` + `cursor: default` (Google 버튼은 .6) | `.btn:disabled` |
| hover 시에만 노출 | `opacity: 0 → 1`, `:focus-visible`에서도 노출 | `.page-row-delete` |

---

## 6. 아이콘

출처: `components/ds.tsx`, 각 `page.tsx`

- 라이브러리는 **`lucide-react`만** 사용한다. 컴포넌트 prop 타입은 `LucideIcon`.
- 색은 `currentColor` 상속이 기본. 보조 아이콘은 부모 색(`--text-tertiary`)이나 `color="var(--text-tertiary)"`로 지정한다.
- `strokeWidth`는 lucide 기본값(2). **40px 이상 일러스트 아이콘만 `strokeWidth={1.5}`** (`FileText`, `FileX`).

| 맥락 | 크기 |
| --- | --- |
| `Button` 내부 (md / lg) | 18 |
| `Button` 내부 (sm) | 14 |
| `IconButton` 기본 | `Math.round(size * 0.56)` → 32px 버튼에 18 |
| `IconButton` 명시값 | 30→16, 32→17, 44→19~20 |
| `SidebarItem`, `SidebarSwitch` | 18 (20×20 박스 안) |
| 검색 pill·입력, 저장 상태 | 15 |
| 검색 결과, 명령 항목, `.alert` | 16 |
| 목록 행, 명령 입력창 | 18 |
| 섹션 chevron | 14 |
| 모바일 뒤로가기 | 22 |
| 빈 상태·NotFound 일러스트 | 40 (`strokeWidth={1.5}`) |

**사용 중인 아이콘과 의미**: `LayoutList`(업무 페이지) · `CircleUserRound`(마이 페이지) · `FileText`(제목 있는 글) · `File`(제목 없는 글) · `FilePlus`(`/page` 명령) · `SquarePen`(명령 입력창) · `Search` · `Trash2`(삭제) · `ChevronLeft`(뒤로) · `ChevronDown`(섹션 접기) · `Check`(저장됨) · `LoaderCircle`(저장 중·로그인 중) · `CircleAlert`(오류) · `FileX`(글 없음) · `LogOut` · `Moon`(다크 모드)

---

## 7. 컴포넌트

출처: `components/ds.tsx`, `components/shell.tsx`, `app/globals.css:16-81`

import 경로: `@/components/ds` (원자), `@/components/shell` (조합)

### 7.1 Button

용도: 텍스트 라벨이 있는 모든 행동.

| prop | 값 | 기본 |
| --- | --- | --- |
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` |
| `size` | `'sm'`(28) `\| 'md'`(36) `\| 'lg'`(40) | `'md'` |
| `icon` | `LucideIcon` (왼쪽, 좌측 패딩 줄어듦) | — |
| 그 외 | `ButtonHTMLAttributes` 전부 (`type` 기본 `"button"`) | — |

| variant | 배경 / 글자 / 보더 | 사용처 |
| --- | --- | --- |
| `primary` | `--bg-inverse` / `--text-inverse` | 폼 제출 (마이 페이지 별명 "저장") |
| `secondary` | `--bg-surface` / `--text-primary` / `--border-default` | 일반 행동 ("로그아웃", "취소", "다시 시도") |
| `ghost` | 투명 / `--text-primary` | 보조·되돌리기 행동 (현재 사용처 없음) |
| `danger` | `--red-500` / `--text-inverse` | 삭제 확정 ("삭제") |

```tsx
import { Button } from '@/components/ds';
import { LogOut } from 'lucide-react';

<Button variant="secondary" icon={LogOut} onClick={signOut}>로그아웃</Button>
<Button type="submit" size="lg" disabled={invalid || unchanged}>저장</Button>
```

- ✅ 한 영역에 Primary는 하나만. 입력 필드 옆 제출 버튼은 입력 높이에 맞춰 `size="lg"`(40px).
- ✅ 변경 사항이 없거나 유효하지 않으면 `disabled`로 막는다.
- ❌ `<button className="btn ...">`를 직접 쓰지 않는다 (링크 형태만 예외, [알려진 불일치](#알려진-불일치) 참고).

### 7.2 IconButton

용도: 라벨 없이 아이콘만 있는 행동. **`label`은 필수**이며 `aria-label`과 `title`에 동시에 들어간다.

| prop | 타입 | 기본 |
| --- | --- | --- |
| `icon` | `LucideIcon` (필수) | — |
| `label` | `string` (필수) | — |
| `size` | 버튼 한 변 px | 32 |
| `iconSize` | 아이콘 px | `round(size × 0.56)` |
| `active` | `boolean` → `.is-active` (`--bg-selected`) | — |

상태: hover `--bg-hover` · active `--bg-selected` · radius `--radius-8`

```tsx
<IconButton icon={Trash2} label="삭제" size={32} iconSize={17} active={confirmDelete} className="d-only" onClick={open} />
<IconButton icon={Trash2} label="삭제" size={44} iconSize={19} className="m-only" onClick={open} />
```

- ✅ 데스크톱 32, 목록 행 안 30, 모바일 44.
- ✅ 연결된 다이얼로그가 열려 있는 동안 `active`로 눌린 상태를 보여준다.
- ❌ 링크가 필요할 때 `IconButton`을 `<Link>`로 감싸지 않는다 — 현재는 `<Link className="icon-btn">` + `aria-label`을 쓴다.

### 7.3 Kbd

용도: 키·명령어를 화면에 표시. 20px 높이, `--radius-4`, `--border-default`, 500 11px, `--text-secondary`.

```tsx
<Kbd>/page</Kbd>로 새 글 만들기
<Kbd>Enter</Kbd>   <Kbd>↵</Kbd>
```

- ✅ 조작법을 안내하는 문장 안에서 명령어·키 이름을 감쌀 때 사용.
- ❌ 일반 태그·배지 용도로 쓰지 않는다.

### 7.4 SearchPill

용도: 접힌 검색 진입점. `label` 기본값 `'검색'`, `onClick`. 높이 32px, pill, `--shadow-xs`, `--text-tertiary`, hover `--gray-25`.

```tsx
<SearchPill label="글 제목 검색" onClick={() => setOpen(true)} />
```

직접 쓰기보다 `SearchBox`를 쓴다 (SearchBox가 내부에서 사용).

### 7.5 SidebarItem

용도: 사이드바 내비게이션 링크 (`next/link`).

| prop | 타입 |
| --- | --- |
| `href` | `string` |
| `icon` | `LucideIcon` (18px) |
| `label` | `string` (넘치면 말줄임) |
| `selected` | `boolean` → `.is-selected` + `aria-current="page"` |

상태: 높이 `--row-h`(32), hover `--bg-hover`, selected `--bg-selected` + 600.

```tsx
<SidebarItem href="/" icon={LayoutList} label="업무 페이지" selected={pathname === '/'} />
```

### 7.6 SidebarSection

용도: 접을 수 있는 사이드바 그룹. `title`, `children`. 기본 펼침, 제목 버튼에 `aria-expanded`, 접히면 chevron이 -90° 회전(`--dur-base`). 제목 600 13px `--text-secondary`.

```tsx
<SidebarSection title="최근 글">
  {recent.length === 0 ? <div className="sidebar-empty">아직 작성한 글이 없어요</div> : recent.map(...)}
</SidebarSection>
```

- ✅ 비었을 때는 `.sidebar-empty`(`--type-meta`, `--text-tertiary`) 한 줄로 안내.

### 7.7 Avatar / UserAvatar

`Avatar`: `size`(기본 24), `src`, `initials`, `bg`(기본 `var(--bg-selected)`). 원형, 이니셜은 `--text-on-color` 600, 글자 크기 `size × 0.4`. 이미지는 `object-fit: cover`, `alt=""`.

`UserAvatar`(shell): `user`, `size` — 이미지가 없으면 별명 첫 글자 + `--accent` 배경.

| 위치 | size |
| --- | --- |
| 상단 `.user-pill` | 24 |
| 모바일 헤더 | 28 |
| 마이 페이지 프로필 | 80 |

```tsx
import { UserAvatar } from '@/components/shell';
<UserAvatar user={user} size={24} />
```

- ✅ 사용자를 표시할 때는 항상 `UserAvatar`를 쓴다 (기본 색·이니셜 규칙 통일).

### 7.8 SearchBox

용도: 글 제목 검색 (PRD #11). props: `expanded`(모바일, 입력창을 바로 펼침), `onClose`.

| 동작 | 내용 |
| --- | --- |
| 접힘 | `SearchPill label="글 제목 검색"` |
| 펼침 | 240px pill 입력 + `autoFocus`, 결과는 오른쪽 정렬 320px 드롭다운(`--shadow-md`) |
| 결과 | 최대 8개, `FileText` + 제목 + `.meta` 작성 일시, 40px 행 |
| 빈 결과 | `‘{검색어}’와 일치하는 글이 없어요` |
| 키보드 | ↑/↓ 이동, Enter 이동, Esc 닫기, 바깥 클릭 닫기(데스크톱) |
| 접근성 | `role="listbox"` / `role="option"` + `aria-selected` |

### 7.9 DeleteDialog

용도: 글 삭제 확인 (PRD #8). props: `title`, `onCancel`, `onConfirm`, `pending?`(요청 중 "삭제" disabled), `error?`(실패 문구 — 다이얼로그를 닫지 않고 설명 아래 `.alert`로 표시).

| 요소 | 규칙 |
| --- | --- |
| 컨테이너 | `.dialog` 380px, `--radius-12`, `--shadow-lg`, 딤 `--bg-overlay` |
| 제목 | 질문형 — "이 글을 삭제할까요?" (`--type-title`) |
| 설명 | 대상 + 결과 — "‘{title}’ 글이 삭제됩니다. 삭제한 글은 복구할 수 없습니다." (`--type-body`, `--text-secondary`) |
| 버튼 | 오른쪽 정렬, `secondary` "취소" → `danger` "삭제" (최소 폭 72px) |
| 실패 | `error`가 있으면 설명 아래 `.alert.dialog-alert`(`margin-top: var(--space-16)`, `role="alert"`). 문구: "글을 삭제하지 못했어요. 다시 시도해 주세요." "삭제"를 다시 눌러 재시도 |
| 닫기 | Esc, 배경 클릭 → `onCancel` |
| 접근성 | `role="alertdialog"`, `aria-modal`, `aria-labelledby`, 확정 버튼에 `autoFocus` |

```tsx
{pendingDelete && (
  <DeleteDialog
    title={displayTitle(pendingDelete.title)}
    pending={deleting}
    error={deleteFailed ? '글을 삭제하지 못했어요. 다시 시도해 주세요.' : undefined}
    onCancel={closeDelete}
    onConfirm={async () => { /* await actions.deletePage → 성공 시 닫기, 실패 시 deleteFailed */ }}
  />
)}
```

- ✅ 되돌릴 수 없는 행동은 이 패턴(질문 제목 + 결과 설명 + 취소/위험 버튼)을 따른다.

### 7.10 화면 전용 패턴 클래스 (컴포넌트화되지 않음)

| 클래스 | 용도 |
| --- | --- |
| `.command-box` / `.command-menu` / `.command-item` | `/page` 명령 입력창과 명령 제안 드롭다운 |
| `.page-row` / `.page-link` / `.page-row-delete` | 업무 목록 행 (hover 시 삭제 버튼 노출) |
| `.alert` | 연빨강 배경 오류 박스 (로그인·글 목록 불러오기·삭제 실패). 문구는 `.alert-text`(flex 1), 오른쪽에 sm secondary 버튼을 둘 수 있다. 위치 변형: `.list-alert`(업무 목록 자리, 가운데 정렬), `.dialog-alert`(다이얼로그 안) |
| `.mp-field` + `.mp-field-hint` | 테두리 입력 필드 + 글자 수 `.meta` + 힌트/오류 |
| `.save-state` | 저장 중/저장됨/저장 실패 인디케이터 |
| `.page-cover` | 글 상세 상단 커버. `data-state="loading\|loaded\|failed"`에 따라 `Skeleton` → 사진(`object-fit: cover`) → `--bg-accent-soft` 단색. 높이 고정이라 상태가 바뀌어도 레이아웃 이동 없음 |
| `.editor-count` | 에디터 본문 아래 글자 수 (`.meta`와 함께 사용, `margin-top: var(--space-12)`, `tabular-nums`) |
| `.empty`, `.notfound` | 빈 상태, 찾을 수 없음 |
| `.google-btn`, `.google-mark` | Google 로그인 버튼, 계정 표시 |

### 7.11 Skeleton

`<Skeleton className? />` — `components/ds.tsx`. `--bg-skeleton` 바탕에 시머 빛 띠가 좌→우로 지나가는 로딩 자리표시. 크기는 부모가 정한다(`position: absolute; inset: 0` 등). `aria-hidden="true"`.

- 실제 콘텐츠와 **같은 크기**로 놓아 로딩이 끝나도 레이아웃이 움직이지 않게 한다.
- 영역(이미지·카드)을 채우는 로딩에 쓴다. 버튼·상태 표시처럼 짧은 라벨이 있는 곳은 기존대로 `LoaderCircle .spin`.
- 현재 사용처: 글 상세 커버(`.page-cover`).

### 7.12 SidebarSwitch / ThemeToggle

`SidebarSwitch`(`ds.tsx`): 사이드바에서 켜고 끄는 설정 한 줄. `SidebarItem`과 같은 `.sb-item` 모양(높이 `--row-h`, hover `--bg-hover`)에 오른쪽 스위치가 붙는다.

| prop | 타입 |
| --- | --- |
| `icon` | `LucideIcon` (18px) |
| `label` | `string` — 설정 이름(명사). 상태에 따라 바꾸지 않는다 |
| `checked` | `boolean` → `aria-checked` |
| `onChange` | `(checked: boolean) => void` |

스위치(`.switch`): 트랙 `--control-sm`(28)×`--space-16`, `--radius-pill`, off `--bg-switch-track` / on `--bg-inverse`. thumb `--space-12` 원, `--bg-surface` + `--shadow-xs`, on에서 `--space-12`만큼 이동(`--dur-base` `--ease-standard`). 스위치는 `aria-hidden`, 상태는 버튼의 `role="switch"` + `aria-checked`로 전달.

`ThemeToggle`(`shell.tsx`, 내부용): `SidebarSwitch icon={Moon} label="다크 모드"` + `useTheme`/`setTheme`. `.sidebar-foot` 맨 위에 둔다.

```tsx
<SidebarSwitch icon={Moon} label="다크 모드" checked={theme === 'dark'} onChange={(on) => setTheme(on ? 'dark' : 'light')} />
```

- ✅ 바로 적용되는 on/off 설정에만 쓴다 (저장 버튼 없음).
- ❌ 페이지 이동에는 쓰지 않는다 — `SidebarItem`을 쓴다.

---

## 8. 화면 패턴

화면 ID는 코드 주석 기준 (`1a`–`1i`).

### 8.1 Login — 1a / 1b (`app/login/page.tsx`)

- 셸 없음. `--bg-app` 중앙에 400px `.login-card` (`--shadow-panel`, 패딩 48/40/36).
- 위→아래: 48px 로고 마크 "N" → "미니 노션" (`--type-title-lg`) → "나에게 맞춘 개인 업무 기록 공간" (`--type-body`, secondary) → [오류 `.alert`] → `.google-btn` "Google로 로그인" → 하단 안내 (`--type-meta`, tertiary).
- 1b: `?error=cancelled|failed`일 때 버튼 위에 `.alert`. 버튼 간격이 36px → 12px로 줄어든다.
- 버튼을 누르면 Google로 이동하는 동안 disabled. 이동을 시작하지 못하면 `failed` 문구를 같은 `.alert`로 보여 준다.
- 로그인 상태면 `/`로 `replace`. 세션이 localStorage에 있어 서버 리다이렉트는 없고, 비로그인 차단도 `AppShell`이 클라이언트에서 한다.
- OAuth 콜백 `/auth/callback`(`app/auth/callback/page.tsx`): `.login-screen` 중앙에 `.auth-pending`(`LoaderCircle` 15 spin + "로그인 중…", `--type-label`, secondary, `role="status"`) → 성공 시 `/`, 취소 `?error=cancelled`, 실패 `?error=failed`로 `/login` `replace`.

### 8.2 Workspace — 1c / 1d / 1h (`app/(app)/page.tsx`)

- 헤더: "업무"(`.sheet-title`) + 글 수(`.sheet-count`, d-only) · spacer · "최근 작성순"(`.meta`, d-only). 모바일은 로고 마크 + 검색 `IconButton` + 아바타 링크.
- 본문 최대폭 760px: `CommandInput`(`.command-box`, `SquarePen` + 입력 + `Kbd Enter`) → 글 목록.
- 목록 행: 아이콘(`FileText`/제목 없으면 `File` + placeholder 색) + 제목(600 14px, 없으면 "제목 없음" 500 + tertiary) + `.meta` 작성 일시 + hover 시 `Trash2`. 정렬은 작성 시각 내림차순 (`page` 테이블에 수정 시각 컬럼이 없다).
- 목록은 Supabase에서 불러온다. 준비 전에는 목록 자리를 비워 두고(빈 상태가 깜빡이지 않게), 실패하면 `.alert.list-alert` "글 목록을 불러오지 못했어요. 다시 시도해 주세요." + sm secondary "다시 시도".
- `/page` 실행 중에는 Enter를 다시 받지 않는다(중복 생성 방지). 만들지 못하면 `.command-error` "새 글을 만들지 못했어요. 다시 시도해 주세요.". 실행할 때 입력값을 비워 명령 메뉴를 닫는다(메뉴가 오류 문구를 덮지 않게).
- 1d 빈 상태: 보라 일러스트 박스(128×104) → "첫 글을 만들어 보세요" → `Kbd`가 섞인 안내문.

### 8.3 Page detail — 1e / 1f / 1i (`app/(app)/pages/[id]/page.tsx`)

- 헤더(`.is-compact`): 뒤로(`ChevronLeft`) · breadcrumb `업무 / {제목}` (d-only) · spacer · `SaveState` · `.divider-v` · 삭제 `IconButton`.
- `.sheet-scroll` 맨 위 전체폭 커버(`.page-cover`, `--cover-h` 200px): 열 때마다 `https://cataas.com/cat/cute?t={시각}`로 새 랜덤 고양이를 요청하고 글에 저장하지 않는다. 받는 동안 `Skeleton`, 실패하거나 10초 안에 못 받으면 사진 없이 `--bg-accent-soft` 단색(문구·재시도 없음). 커버 아래 에디터 상단 패딩은 `--space-32`.
- 에디터 최대폭 720px, 테두리 없는 입력: 제목 `input`(28px, placeholder "제목 없음") → `.meta` "{일시} 작성" → 1px 구분선 → 본문 `textarea`(15px/1.75, `field-sizing: content`, placeholder "내용을 입력하세요").
- 본문 `textarea` 바로 아래 `.meta .editor-count` 글자 수 `공백 포함 N자 · 공백 제외 M자`. 입력마다 즉시 갱신(자동 저장과 무관), 제목은 세지 않음, `aria-describedby`로 본문에 연결.
- 새 글(제목·내용 모두 빈 값)이면 제목에 `autoFocus`. 제목에서 Enter → 본문으로 포커스.
- 자동 저장: 입력 멈춘 뒤 1000ms debounce, 페이지를 떠날 때 미저장분 flush. 저장 요청은 순서대로 하나씩 보내고, 마지막 요청의 결과만 `SaveState`에 반영한다.
- 1f: `DeleteDialog` → 삭제 성공 후 `/`로 `replace`. 실패하면 다이얼로그 안에 오류를 보여 주고 머문다.
- 글이 없으면 `NotFound`: `FileX` 40 → "글을 찾을 수 없어요" → 설명 → secondary "업무 페이지로".

### 8.4 My page — 1g (`app/(app)/mypage/page.tsx`)

- 헤더: "마이 페이지". 본문 최대폭 600px, `.mp-section` 3개를 1px 구분선으로 분리.
- 섹션 머리: `.mp-head-title`(`--type-heading`) + `.mp-head-desc`(`--type-caption`, secondary).

| 섹션 | 구성 |
| --- | --- |
| 프로필 이미지 | `UserAvatar` 80만 표시 (Google 프로필 사진, 없으면 이니셜). 변경 기능 없음 — `profile`에 이미지 컬럼이 없다 |
| 별명 | `.mp-field`(글자 수 `n/20` `.meta`) + primary lg "저장" + 힌트/오류 |
| 계정 | `.google-mark-lg` + 이메일 + "Google 계정으로 로그인됨" + secondary "로그아웃"(`LogOut`) |

### 8.5 Mobile — 1h / 1i

§4.5 참고. 핵심: 탑바·사이드바 제거 → 시트 헤더가 내비게이션 역할, 44px 터치 타깃, 목록 삭제 제거.

### 8.6 공통 패턴

| 패턴 | 규칙 |
| --- | --- |
| 빈 상태 (화면) | `.empty`: 일러스트(`--bg-accent-soft` + 40px 아이콘) → `--type-title-lg` 제목(권유형) → `--type-body` secondary 설명(방법 안내) |
| 빈 상태 (목록·드롭다운) | 한 줄 `--type-meta`/`--type-caption` + `--text-tertiary` |
| 로딩 | 영역을 채우는 콘텐츠(이미지 등)는 같은 크기의 `Skeleton`(§7.11). 그 외에는 `LoaderCircle size={15} className="spin"` + 짧은 라벨. 초기 데이터 준비 전에는 빈 셸(`<div className="app" />`)이나 `null`을 렌더 |
| 저장 상태 | `저장 중…`(spin) → `저장됨`(`Check`) / `저장 실패`(`CircleAlert`, 빨강 600) + sm secondary "다시 시도" |
| 삭제 확인 | `DeleteDialog` (§7.9) |
| 오류 (폼·화면) | `.alert` + `role="alert"` |
| 오류 (한 줄) | `--text-danger` 텍스트 (`.command-error`, `.mp-field-hint.is-error`) |
| 제목 없음 | `displayTitle()`로 "제목 없음" 표시 + `--text-tertiary`/`--text-placeholder` + 굵기 낮춤 |

---

## 9. UX 라이팅

출처: 각 `page.tsx`, `components/shell.tsx`, `lib/commands.ts`, `lib/format.ts`

### 9.1 말투

- **해요체**가 기본이다: "~어요", "~예요", "~해 주세요", "~해 보세요".
- 문장은 짧게, 한 메시지에 1~2문장. 느낌표·이모지 없음.
- 사용자를 부르는 호칭(당신, 회원님) 없이 쓴다.
- 사용자 입력값을 인용할 때는 **곡선 작은따옴표 `‘ ’`**를 쓴다: `‘{query}’와 일치하는 글이 없어요`.
- 말줄임은 한 글자 `…`를 쓴다: `저장 중…`.

### 9.2 라벨 규칙

| 종류 | 규칙 | 실제 예 |
| --- | --- | --- |
| 버튼 | 2~6자, 동사 명사형 또는 "~로" 목적지형 | 저장 · 삭제 · 취소 · 다시 시도 · 로그아웃 · 업무 페이지로 · Google로 로그인 |
| 상태 | 명사형, 마침표 없음 | 저장 중… · 저장됨 · 저장 실패 · 로그인 중… · Google 계정으로 로그인됨 |
| 확인 질문 | "~할까요?" | 이 글을 삭제할까요? |
| 빈 상태 제목 | 권유형 "~해 보세요" | 첫 글을 만들어 보세요 |
| placeholder | 행동 안내 또는 기본값 | /page를 입력하고 Enter를 눌러 새 글 만들기 · 제목 없음 · 내용을 입력하세요 · 글 제목 검색 |
| 메타 | 명사구 | 최근 작성순 · {일시} 작성 |
| 화면명 | 사이드바 "업무 페이지" / 시트 제목 "업무" / "마이 페이지" | |

### 9.3 오류·확인 메시지 공식

**[무슨 일이 일어났는지] + [다음에 할 행동]** — 둘 다 해요체.

| 상황 | 문구 |
| --- | --- |
| 알 수 없는 명령어 | 알 수 없는 명령어예요. /page를 입력해 새 글을 만들어 보세요. |
| 로그인 취소 | 로그인이 취소되었어요. 다시 시도해 주세요. |
| 로그인 실패 | 로그인에 실패했어요. 잠시 후 다시 시도해 주세요. |
| 별명 빈 값 | 별명을 입력해 주세요. 공백만으로는 저장할 수 없어요. |
| 별명 저장 성공 | 별명을 저장했어요. |
| 별명 저장 실패 | 별명을 저장하지 못했어요. 다시 시도해 주세요. |
| 글 없음 | 글을 찾을 수 없어요 / 삭제되었거나 접근할 수 없는 글이에요. |
| 글 목록 불러오기 실패 | 글 목록을 불러오지 못했어요. 다시 시도해 주세요. |
| 새 글 만들기 실패 | 새 글을 만들지 못했어요. 다시 시도해 주세요. |
| 글 삭제 실패 | 글을 삭제하지 못했어요. 다시 시도해 주세요. |
| 삭제 확인 설명 | ‘{title}’ 글이 삭제됩니다. 삭제한 글은 복구할 수 없습니다. ← 유일한 합니다체 (불일치 참고) |

### 9.4 날짜·숫자 표기 (`lib/format.ts`)

| 함수 | 형식 | 예 | 사용처 |
| --- | --- | --- | --- |
| `formatDate(ts)` | `M/D(요일)` | `9/28(월)` | `formatDateTime`의 날짜 부분 |
| `formatDateTime(ts)` | `M/D(요일) 오전\|오후 h:mm` | `9/28(월) 오후 3:12` | 목록·검색 결과·에디터 "작성" 일시 |
| `displayTitle(title)` | 공백 제거 후 빈 값이면 `제목 없음` | — | 제목을 표시하는 모든 곳 |
| `formatCharCount(count)` | `공백 포함 {n}자 · 공백 제외 {m}자` (`ko-KR` 천 단위 `,`) | `공백 포함 1,234자 · 공백 제외 1,050자` | 에디터 본문 글자 수 (`countCharacters` 결과) |

- 연도는 표시하지 않는다. 월·일은 0을 채우지 않고, 분만 두 자리로 채운다. 12시간제 + 오전/오후.
- 새 날짜 표기는 직접 만들지 말고 이 두 함수를 쓴다. 상대 시간("3분 전")은 현재 쓰지 않는다.
- 숫자: 글자 수 `{n}/{max}`(별명), 글 내용 글자 수 `공백 포함 1,234자 · 공백 제외 1,050자`(grapheme 단위, `lib/text.ts`), 용량 `{n.n}MB`(소수 1자리), 파일 형식은 대문자 `JPG · PNG · WEBP`.

---

## 10. 접근성

### 10.1 현재 구현된 것

| 항목 | 구현 |
| --- | --- |
| 언어 | `<html lang="ko">` |
| 아이콘 버튼 이름 | `IconButton`의 `label` 필수 → `aria-label` + `title` |
| 현재 위치 | `SidebarItem` `aria-current="page"` |
| 펼침 상태 | `SidebarSection` `aria-expanded` |
| 켜짐 상태 | `SidebarSwitch` `role="switch"` + `aria-checked` |
| 랜드마크 | `header.topbar`, `nav.sidebar aria-label="사이드바"`, `main.sheet` |
| 입력 이름 | 모든 입력에 `aria-label` (명령어 입력, 글 제목 검색, 제목, 내용, 별명) |
| 상태 알림 | `SaveState` `role="status"` / 실패 `role="alert"`, `.alert` `role="alert"` |
| 보조 설명 | 내용 `textarea`의 `aria-describedby` → 글자 수 (라이브 영역 아님, 입력마다 낭독하지 않음) |
| 장식 이미지 | 글 커버는 `aria-hidden="true"` + `alt=""`, 포커스를 받지 않음 |
| 동작 줄이기 | `prefers-reduced-motion: reduce`에서 스켈레톤 시머 정지 |
| 다이얼로그 | `role="alertdialog"`, `aria-modal`, `aria-labelledby`, Esc 닫기, 확정 버튼 `autoFocus` |
| 검색 결과 | `role="listbox"`/`option` + `aria-selected`, ↑↓/Enter/Esc |
| 한글 조합 | Enter 처리 시 `e.nativeEvent.isComposing` 확인 (IME 조합 중 제출 방지) |
| 숨은 버튼 | `.page-row-delete:focus-visible`에서 노출 |

### 10.2 대비 (WCAG 2.x, 흰 배경 기준 계산값)

> 다크 테마(`--bg-surface` `#202020` 기준): `--text-primary` 14.6:1, `--text-secondary` 7.1:1, `--text-tertiary` 5.0:1, `--text-danger` 5.9:1, `--text-accent` 7.4:1 — 모두 AA 통과. `--text-placeholder` 2.8:1(장식 전용). `--text-on-color` on `--bg-danger`는 라이트와 같은 3.9:1.


| 전경 | 대비 | 판정 |
| --- | --- | --- |
| `--text-primary` | 16.5:1 | AA/AAA 통과 |
| `--text-secondary` | 5.3:1 (`--bg-selected` 위 4.5:1) | AA 통과 |
| `--text-accent` | 5.3:1 | AA 통과 |
| `--text-inverse` on `--bg-inverse` | 13.8:1 | 통과 |
| `--text-tertiary` | 3.5:1 | ⚠️ 본문 AA 미달 (12~13px 메타에 사용 중) |
| `--text-danger` | 3.9:1 | ⚠️ 본문 AA 미달 (13px 오류 문구) |
| `--text-on-color` on `--bg-danger` | 3.9:1 | ⚠️ 14px/600 버튼 라벨 AA 미달 |
| `--text-placeholder` | 2.5:1 | placeholder·장식 전용 (정보 전달에 쓰지 않는다) |

**규칙**: 읽어야 하는 정보(오류 원인, 날짜)는 `--text-secondary` 이상을 우선 고려한다. `--text-tertiary`는 없어도 이해에 지장 없는 보조 정보에만 쓴다.

### 10.3 키보드 조작

| 위치 | 키 |
| --- | --- |
| 명령 입력창 | Enter 실행, Esc 입력 지우기 |
| 검색 | ↑/↓ 이동, Enter 열기, Esc 닫기 |
| 에디터 제목 | Enter → 본문으로 이동 |
| 삭제 다이얼로그 | Esc 취소, 포커스는 "삭제" 버튼에서 시작 |

키 안내는 `Kbd`로 화면에 표시한다 (`Enter`, `↵`, `/page`).

### 10.4 개선 필요

- **포커스 표시**: 버튼·링크에 커스텀 `:focus-visible` 스타일이 없어 브라우저 기본 outline에 의존한다. 검색 입력(`.search-input-wrap input`)은 `outline: 0`인데 대체 표시가 없다.
- **명령 메뉴**: `.command-menu`에 `role="listbox"`가 있지만 항목이 `<button>`이고 `role="option"`·↑↓ 이동이 없다. 활성 항목이 항상 첫 번째로 고정된다.
- **다이얼로그 포커스 트랩**: Tab 순환·닫은 뒤 포커스 복귀가 없다.
- **대비**: 위 ⚠️ 항목 (tertiary 메타, danger 텍스트, danger 버튼).
- **모바일 목록 삭제**: 모바일에서는 목록에서 삭제할 수 없다 (hover 의존 UI를 숨긴 결과).

---

## 11. 새 UI를 만들 때 체크리스트

- [ ] 기존 DS 컴포넌트(`Button`, `IconButton`, `Kbd`, `SidebarItem`, `SidebarSwitch`, `UserAvatar`, `SearchBox`, `DeleteDialog`)로 해결 가능한지 먼저 확인했다.
- [ ] 색은 semantic 토큰(`--bg-*`, `--text-*`, `--border-*`)만 썼다. hex·rgba·primitive 직접 참조가 없다.
- [ ] 글자는 `font: var(--type-*)` 역할 토큰으로 지정했다. 스케일 밖 크기가 필요하면 이유가 있다.
- [ ] 간격은 `var(--space-*)`, 모서리는 `var(--radius-*)`, 높이는 `--control-*`/`--row-h`를 썼다.
- [ ] 새 토큰·컴포넌트가 필요하면 `tokens.css`·`ds.tsx`에 먼저 추가하고 DESIGN.md를 갱신했다.
- [ ] 다크 테마(`data-theme="dark"`)에서도 확인했다. 새 색 토큰을 추가했다면 다크 블록에도 값을 넣었다.
- [ ] 그림자는 역할(고정 pill `xs` / 드롭다운 `md` / 다이얼로그 `lg`)에 맞췄다.
- [ ] 아이콘은 `lucide-react`, 크기는 §6 표를 따랐다. 아이콘만 있는 버튼에 `label`을 넣었다.
- [ ] 767px 이하에서 확인했다: `.d-only`/`.m-only` 처리, 터치 타깃 44px, 360px 폭에서 깨짐 없음.
- [ ] hover·selected·disabled·focus 상태를 §5.3 규칙대로 넣었다.
- [ ] 빈 상태·로딩·오류 상태를 §8.6 패턴으로 만들었다.
- [ ] 문구는 해요체, 오류는 "원인 + 다음 행동", 날짜는 `formatDate`/`formatDateTime`, 제목은 `displayTitle`을 썼다.
- [ ] Enter로 제출하는 입력에 `isComposing` 검사를 넣었다.
- [ ] 되돌릴 수 없는 행동에는 확인 다이얼로그를 붙였다.
- [ ] Non-Goal(협업, 블록 에디터, 하위 페이지 트리 등)에 해당하는 UI를 만들고 있지 않다.

---

## 부록 A. 토큰 빠른 참조표

| 분류 | 자주 쓰는 토큰 |
| --- | --- |
| 배경 | `--bg-app` · `--bg-sidebar` · `--bg-surface` · `--bg-surface-hover` · `--bg-hover` · `--bg-selected` · `--bg-inverse` · `--bg-inverse-hover` · `--bg-danger` · `--bg-danger-hover` · `--bg-danger-soft` · `--bg-overlay` · `--bg-accent-soft` · `--bg-skeleton` · `--bg-skeleton-shine` · `--bg-switch-track` |
| 텍스트 | `--text-primary` · `--text-secondary` · `--text-tertiary` · `--text-placeholder` · `--text-inverse` · `--text-on-color` · `--text-danger` · `--text-accent` |
| 보더 | `--border-subtle` · `--border-default` · `--border-strong` · `--border-emphasis` |
| 타이포 | `--type-title-lg` · `--type-title` · `--type-heading` · `--type-body` · `--type-label` · `--type-caption` · `--type-meta` |
| 간격 | `--space-{0,2,4,6,8,10,12,14,16,20,24,32,40,48}` |
| radius | `--radius-4` · `--radius-6` · `--radius-8` · `--radius-12` · `--radius-pill` |
| 치수 | `--topbar-h` 56 · `--sidebar-w` 232 · `--header-h` 52 · `--row-h` 32 · `--control-sm/md/lg` 28/36/40 · `--cover-h` 200 · `--cover-h-sm` 140 |
| 그림자 | `--shadow-panel` · `--shadow-xs` · `--shadow-md` · `--shadow-lg` |
| 모션 | `--dur-fast` 100 · `--dur-base` 160 · `--dur-shimmer` 1400 · `--ease-standard` |

**정의만 있고 쓰지 않는 토큰 (Teamchat 잔재)**: `--gray-700`, `--mint-*`, `--purple-100`, `--green-500`, `--pink-300`, `--bg-pressed`(다크 값만 정의), `--bg-rail-selected`, `--bg-notice`, `--bg-tooltip`, `--bg-badge`, `--text-inverse-muted`, `--status-online`, `--status-alert`, `--font-mono`, `--fs-*`, `--fw-*`, `--lh-*`, `--ls-tight`, `--type-micro`, `--space-*`(`--space-2`·`12`·`16`·`24`·`32` 제외), `--radius-10/16/20`, `--rail-w`, `--detail-w`, `--notice-h`, `--shadow-none`, `--shadow-sm`, `--dur-slow`, `--ease-out`. 삭제하지 말고, 새 UI가 해당 역할을 필요로 할 때 이 토큰부터 쓴다.

## 부록 B. 파일 맵

| 파일 | 역할 |
| --- | --- |
| `app/styles/tokens.css` | 디자인 토큰 (colors / typography / spacing / effects / base) |
| `app/globals.css` | 리셋, DS 클래스, 화면별 스타일, 모바일 미디어 쿼리 |
| `app/layout.tsx` | Pretendard 로딩, `lang="ko"`, 메타데이터(title "미니 노션"), 테마 인라인 스크립트 + `ThemeSync` |
| `app/fonts/PretendardVariable.woff2` | 폰트 파일 |
| `components/ds.tsx` | `Avatar`, `Button`, `IconButton`, `Kbd`, `SearchPill`, `SidebarItem`, `SidebarSection`, `SidebarSwitch`, `Skeleton` |
| `components/shell.tsx` | `AppShell`(+ 내부 `ThemeToggle`), `SearchBox`, `DeleteDialog`, `UserAvatar` |
| `app/(app)/layout.tsx` | 인증 화면을 `AppShell`로 감쌈 |
| `app/(app)/page.tsx` | 업무 페이지 + `CommandInput` (1c/1d/1h) |
| `app/(app)/pages/[id]/page.tsx` | 글 상세 + `Cover` + `SaveState` + `CharCount` + `NotFound` (1e/1f/1i) |
| `app/(app)/mypage/page.tsx` | 마이 페이지 (1g) |
| `app/login/page.tsx` | 로그인 (1a/1b) |
| `lib/commands.ts` | 슬래시 명령어 레지스트리 (`COMMANDS`, `matchCommands`) — 새 명령어는 여기에 항목 추가 |
| `lib/format.ts` | 날짜·제목·글자 수 표기 |
| `lib/text.ts` | 글자 수 계산 (`countCharacters`, grapheme 단위) |
| `lib/store.ts` | 글 데이터 레이어 — Supabase `page` 테이블, 로그인 사용자의 글만 (RLS: `supabase/migrations/20261012000000_page_rls.sql`) |
| `lib/theme.ts` | 라이트/다크 테마 (`useTheme`, `setTheme`, `ThemeSync`) — localStorage `mini-notion:theme` |
| `lib/auth.ts` | 로그인 사용자 (`useAuth`, `authActions`) — Supabase Auth(Google) + `profile` 테이블(`name`) |
| `lib/supabase/client.ts` | 브라우저 전용 Supabase 클라이언트 — 세션을 localStorage에 저장 (PKCE). 앱 전체가 `getClient()` 하나를 공유 |
| `app/auth/callback/page.tsx` | OAuth 콜백: 브라우저에서 code 교환 (`?error=cancelled` · `failed`) |

---

## 알려진 불일치

> 코드는 수정하지 않았다. 고친 항목은 이 목록에서 지운다. 라인 번호는 2026-09-29 기준.

| # | 분류 | 내용 | 위치 |
| --- | --- | --- | --- |
| 1 | 간격 토큰 미사용 | `--space-*`가 `.editor-count` 1곳 외에는 쓰이지 않음. 나머지 padding·gap·margin이 px 하드코딩 | `app/globals.css` 전반 (예: 18, 85, 104, 107, 170, 225, 251), 인라인 `marginTop` (`app/login/page.tsx:35,36,49,58`) |
| 6 | 타입 토큰 우회 | `--type-*` 대신 `font:` 단축 속성 하드코딩. 이 중 `600 14px/1.4`(= `--type-heading`), `500 14px/1.4`(= `--type-label`)는 토큰과 값이 같음 | `app/globals.css:140, 202, 272` 외 21, 52, 60, 68, 78, 89, 99, 117, 131, 155, 178, 184, 222, 236, 267 |
| 7 | 스케일 밖 폰트 크기 | 15px, 22px, 28px, 행간 1.75·1.35 — 역할 토큰 없음 | `app/globals.css:150, 178, 229, 236, 289, 293` |
| 8 | 인라인 스타일 | 21곳. 클래스로 옮길 수 있는 레이아웃·타이포가 대부분 (로그인 제목·부제·안내, NotFound 문구, 명령 항목 텍스트, `.alert` 정렬 덮어쓰기 등) | `app/login/page.tsx:35-61`; `app/(app)/pages/[id]/page.tsx:82, 85, 121, 176-178`; `app/(app)/page.tsx:29, 56, 60, 143-145`; `app/(app)/mypage/page.tsx:100-101` |
| 9 | DS 우회 (링크 형태) | `Button`/`IconButton`이 `href`를 지원하지 않아 `<Link className="btn btn-secondary">`, `<Link className="icon-btn">` + 인라인 크기로 직접 조합 | `app/(app)/pages/[id]/page.tsx:82, 85, 178`; `app/(app)/page.tsx:29` |
| 10 | 별도 버튼 스타일 | `.google-btn`이 `.btn`과 별개: 높이 44px(`--control-*` 밖), disabled `opacity .6`(`.btn`은 .4) | `app/globals.css:152-158` |
| 11 | easing 누락 | `.icon-btn`, `.sb-section-toggle svg` transition에 `--ease-standard` 없음 | `app/globals.css:43, 80` |
| 12 | 말투 혼용 | 삭제 다이얼로그 설명만 합니다체("삭제됩니다… 없습니다"), 나머지는 해요체 | `components/shell.tsx:184` |
| 13 | z-index 토큰 없음 | 드롭다운 `20`/`2`, 다이얼로그 `50`이 제각각 | `app/globals.css:134, 181, 243` |
| 14 | 포커스 표시 누락 | 검색 입력 `outline: 0`에 대체 focus 스타일 없음 (명령 입력·별명 입력은 `:focus-within` 보더 있음) | `app/globals.css:131` |
