# DESIGN.md 생성 프롬프트 (코드 메타데이터 기반)

> 아래 `---` 사이의 내용을 그대로 Claude Code에 붙여넣어 사용하세요.

---

## 역할

너는 이 프로젝트(미니 노션, Next.js 16 + React 19)의 디자인 시스템을 문서화하는 시니어 프로덕트 디자이너 겸 프론트엔드 엔지니어다.
목표는 **현재 코드에 이미 구현된 디자인 결정(토큰·컴포넌트·레이아웃·톤앤매너)을 추출해**, 앞으로 새 화면·기능을 만들 때 사람과 AI 에이전트가 동일한 결과물을 낼 수 있도록 프로젝트 루트에 `DESIGN.md`를 작성하는 것이다.

## 원칙

1. **코드가 진실의 원천이다.** 새로운 값을 발명하지 말고, 실제 파일에 있는 값만 기록한다. 코드와 문서가 충돌하면 코드를 따른다.
2. **추측 금지.** 근거가 없는 규칙은 쓰지 않는다. 코드에서 패턴이 보이지만 명시적이지 않은 것은 `(관찰된 패턴)`으로 표시한다.
3. **토큰 이름으로 말한다.** 문서의 모든 색·간격·폰트·그림자·모션은 hex/px 대신 CSS 변수명(`var(--text-secondary)` 등)을 1순위로 적고, 실제 값은 참고로 병기한다.
4. **실행 가능한 규칙으로 쓴다.** "깔끔하게" 같은 형용사 대신 "보조 텍스트는 `--text-secondary`, 13px 이하 메타 정보는 `--type-meta`"처럼 바로 적용 가능한 문장으로 쓴다.
5. 문서는 **한국어**로 작성하되, 토큰명·클래스명·컴포넌트명·코드는 원문 그대로 둔다.

## 먼저 읽을 파일 (분석 대상)

아래 파일을 모두 읽고 분석한 뒤 작성을 시작하라.

| 파일 | 추출할 내용 |
| --- | --- |
| `app/styles/tokens.css` | 색상(primitive → semantic), 타이포 스케일·역할, 간격, radius, 레이아웃 치수, 그림자, easing/duration |
| `app/globals.css` | DS 컴포넌트 클래스(`.btn`, `.icon-btn`, `.kbd`, `.search-pill`, `.sb-item` 등)와 화면별 스타일(App shell, Search, Login, Workspace, Page detail, My page, Mobile), 전역 규칙(`word-break: keep-all` 등) |
| `app/layout.tsx` | 폰트 로딩 방식(Pretendard Variable, `next/font/local`), `lang="ko"`, 메타데이터 |
| `components/ds.tsx` | 디자인 시스템 컴포넌트 API(`Avatar`, `Button`, `IconButton`, `Kbd`, `SearchPill`, `SidebarItem`, `SidebarSection`)의 props·variant·size |
| `components/shell.tsx` | 앱 셸 구조, `SearchBox`, `DeleteDialog`, `UserAvatar` 사용 패턴 |
| `app/(app)/**/page.tsx`, `app/login/page.tsx` | 실제 화면에서 토큰·컴포넌트가 조합되는 방식, UI 카피(문구)의 말투 |
| `lib/commands.ts`, `lib/format.ts` | `/page` 등 명령어 UX, 날짜·숫자 표기 규칙 |
| `02-prd.md` | 제품 목적·대상 사용자·Non-Goals (톤앤매너의 근거) |
| `uibowl.png` | 레퍼런스 UI 이미지 — 시각적 분위기 확인용 |

## 현재 톤앤매너 (분석 시 확인하고 구체화할 가설)

코드를 읽으며 아래 가설이 맞는지 검증하고, 맞는 것은 근거(토큰/클래스)와 함께 구체화하라. 틀린 것은 고쳐라.

- **차분한 무채색 중심**: 회색 스케일(`--gray-0` ~ `--gray-900`)이 화면 대부분을 구성하고, 색은 의미가 있을 때만 쓴다.
- **절제된 포인트 컬러**: 보라(`--accent`, `--purple-*`)는 봇/AI·강조에만, 빨강은 위험/알림, 초록은 온라인 상태, 민트는 공지 배너.
- **Primary는 검정에 가까운 버튼**: `--bg-inverse`(#2D2D2D) 배경의 pill 형태 버튼.
- **둥글고 부드러운 형태**: 버튼·검색은 `--radius-pill`, 리스트 아이템·아이콘 버튼은 `--radius-8`.
- **얕은 깊이감**: 그림자는 매우 약하게(`--shadow-xs`~`--shadow-sm`), 구분은 주로 배경 톤 차이와 1px 보더로.
- **조밀하지만 여유 있는 정보 밀도**: 본문 14px/1.6, 행 높이 32px, 컨트롤 28/36/40px.
- **빠르고 조용한 모션**: 100–240ms, `--ease-standard`.
- **한국어 우선 타이포**: Pretendard, `word-break: keep-all`.
- **개인용 도구의 담백한 말투**: 짧고 친절한 존댓말 UI 카피 (실제 문구로 확인할 것).

## DESIGN.md 목차 (이 구조를 따를 것)

```
# DESIGN.md — 미니 노션 디자인 가이드

0. 이 문서를 쓰는 법
   - 대상 독자(사람 + AI 에이전트), 코드 우선 원칙, 토큰 파일 위치, 문서 갱신 규칙

1. 디자인 원칙 & 톤앤매너
   - 3~5개의 핵심 원칙 (각 원칙마다 Do / Don't 1줄씩)
   - 한 문장 요약 ("이 제품은 ○○하게 보이고 ○○하게 느껴져야 한다")

2. 컬러
   - Primitive 팔레트 표 (토큰 / 값 / 코드 주석의 용도)
   - Semantic 토큰 표 (배경 / 텍스트 / 보더 / 상태) — 새 코드에서는 semantic만 사용
   - 포인트 컬러 사용 규칙 (언제 보라·빨강·초록·민트를 쓰는가)
   - 금지 사항 (예: hex 하드코딩, 새 브랜드 컬러 추가)

3. 타이포그래피
   - 폰트 패밀리와 로딩 방식
   - 역할별 타입 스케일 표 (`--type-title-lg` ~ `--type-micro`: 크기/굵기/행간/사용처)
   - 한국어 조판 규칙 (keep-all, letter-spacing 등)

4. 간격 · 레이아웃 · 그리드
   - spacing 스케일과 자주 쓰는 조합
   - radius 스케일과 요소별 매핑
   - 레이아웃 치수 (topbar, rail, sidebar, detail, header, row, control 높이)
   - 앱 셸 구조 다이어그램 (ASCII)
   - 반응형/모바일 브레이크포인트와 변화 규칙

5. 깊이 · 모션
   - 그림자 단계별 사용처
   - duration/easing 사용 규칙, hover/pressed/selected 상태 표현

6. 아이콘
   - lucide-react 사용, 크기·strokeWidth 규칙 (코드에서 확인된 값)

7. 컴포넌트
   - 각 DS 컴포넌트마다: 용도 / props·variant·size / 상태(hover, active, disabled, selected) / 사용 예시 코드 / Do·Don't
   - Button, IconButton, Kbd, SearchPill, SidebarItem, SidebarSection, Avatar, SearchBox, DeleteDialog

8. 화면 패턴
   - Login, Workspace(목록), Page detail(편집), My page, Mobile — 각 화면의 구성과 사용된 컴포넌트
   - 빈 상태, 로딩(.spin), 삭제 확인 등 공통 패턴

9. UX 라이팅
   - 말투(존댓말/반말, 문장 길이), 버튼 라벨 규칙, 에러·확인 메시지 예시 (실제 코드 문구 인용)
   - 날짜·숫자 표기 (lib/format.ts 기준)

10. 접근성
   - 대비, 포커스 표시, aria-label(IconButton의 label prop 등), 키보드 조작(Kbd, 단축키)
   - 현재 부족한 점은 "개선 필요"로 별도 표기

11. 새 UI를 만들 때 체크리스트
   - [ ] 기존 DS 컴포넌트로 해결 가능한지 먼저 확인
   - [ ] 색·간격·폰트는 모두 토큰 사용
   - [ ] 새 토큰/컴포넌트가 필요하면 tokens.css·ds.tsx에 먼저 추가하고 DESIGN.md 갱신
   - … (코드 분석 결과를 반영해 8~12개로 완성)

부록. 토큰 빠른 참조표 / 파일 맵
```

## 작성 규칙

- 각 섹션에 **근거 파일 경로**를 짧게 남긴다. (예: `출처: app/styles/tokens.css`)
- 표를 적극 사용하고, 긴 산문은 피한다. 전체 분량은 읽기 쉬운 선에서 400~700줄을 목표로 한다.
- 코드 예시는 이 프로젝트의 실제 import 경로·컴포넌트 API를 사용한다.
- 코드 주석(`/* sidebar */`, `/* primary button */` 등)에 적힌 용도는 반드시 반영한다.
- 토큰 파일 상단 주석에 따르면 토큰은 "Teamchat design system"에서 가져왔다. 이 출처와, 미니 노션에 맞게 달라진 점이 있다면 함께 기록한다.
- 일관성이 깨진 곳(하드코딩된 hex, 토큰 밖의 px 값, 중복 스타일 등)을 발견하면 본문에 섞지 말고 **맨 끝 "알려진 불일치" 섹션**에 파일:라인과 함께 목록으로 정리한다. 코드는 수정하지 않는다.
- Non-Goals(협업, 블록 에디터 등)에 해당하는 컴포넌트 가이드는 만들지 않는다.

## 산출물

1. 프로젝트 루트에 `DESIGN.md` 생성
2. `AGENTS.md`에 "UI 작업 전 `DESIGN.md`를 먼저 읽을 것" 한 줄을 추가할지 나에게 물어볼 것 (직접 수정하지 말 것)
3. 작업이 끝나면 다음을 짧게 보고:
   - 검증된/수정된 톤앤매너 가설
   - "알려진 불일치" 항목 수와 가장 중요한 3개
   - 문서화하면서 결정이 필요했던 애매한 지점

---
