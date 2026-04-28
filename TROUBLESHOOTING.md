# 안다미로 인터랙티브 데모 — 트러블슈팅 인수인계서

> 작성일: 2026-04-27  
> 이 문서는 개발 중 반복된 실수와 해결 과정을 기록한 실무 참고서입니다.

---

## 1. 프로젝트 개요

안다미로(AI 감정일기 앱)의 인터랙티브 PT 데모.  
**16:9 슬라이드 형식**으로 각 슬라이드 안에 실제 앱 화면을 **iframe**으로 임베딩해서 보여주는 방식.

| 항목 | 내용 |
|------|------|
| 프레임워크 | React 19 + TypeScript + TanStack Router |
| 빌드 도구 | Vite (정적 SPA 빌드) |
| 스타일 | Tailwind CSS v4 |
| 런타임 | Bun |

---

## 2. 배포 정보

| 항목 | 값 |
|------|----|
| 배포 URL | https://gounpark.github.io/andamiro-demo/presentation |
| GitHub 저장소 | https://github.com/gounpark/andamiro-demo |
| 브랜치 | `main` |
| 로컬 개발 | http://localhost:8080/presentation |
| Base Path (배포) | `/andamiro-demo/` |
| Base Path (로컬) | `/` |

---

## 3. GitHub Pages 배포 방식

### 빌드 명령어
```bash
npx vite build --config vite.static.config.ts
```
> ⚠️ `bun run build`는 Cloudflare Workers 형식으로 빌드돼서 GitHub Pages에서 쓸 수 없음.  
> 반드시 `vite.static.config.ts`를 사용할 것.

### 배포 흐름
```
git push → GitHub Actions → vite build → dist/index.html 생성 → GitHub Pages 배포
```

### SPA 라우팅 트릭 (중요!)
GitHub Pages는 정적 파일 서버라 `/presentation`, `/record` 같은 경로가 없으면 **404를 반환**한다.  
이걸 해결하기 위해 `public/404.html`이 중간에서 처리해 준다.

```
사용자가 /andamiro-demo/presentation 접속
  → GitHub Pages: 파일 없음 → 404.html 반환
  → 404.html: 현재 경로를 sessionStorage에 저장 후 루트(/)로 리다이렉트
  → index.html 로드 → pages-entry.tsx: sessionStorage 읽어서 경로 복구
  → TanStack Router가 /presentation을 렌더링
```

---

## 4. 로컬에서는 되는데 배포에서 안 됐던 이유들

### 문제 1: 스플래시 화면이 iframe 안에서 뜸

**증상**: 배포에서 각 슬라이드로 이동할 때 앱 데모가 시작 직후 멈추는 것처럼 보임  
**원인**: `sessionStorage`는 iframe마다 독립적이라 `splash_shown` 키가 없음 → 매번 4.8초 스플래시가 뜸 → 그 사이에 데모 애니메이션 타이머가 다 소진됨  
**해결**:
```tsx
// Splash.tsx
if (window !== window.top) {  // iframe 내부이면
  setVisible(false);
  return;
}
```
또한 모든 iframeRoute에 `&nosplash=1` 파라미터 추가.

---

### 문제 2: 여러 iframe 동시 로드 시 sessionStorage 충돌

**증상**: 배포에서 슬라이드들이 전혀 작동하지 않음 (모두 잘못된 경로 표시)  
**원인**: 처음엔 모든 슬라이드의 iframe을 한꺼번에 마운트하고 `display:none`으로 숨겼음.  
GitHub Pages에서 iframe이 동시에 여러 개 로드되면 각각 404.html을 트리거하고, 모두 같은 `sessionStorage`에 동시에 쓰게 됨 → 충돌 → 다 잘못된 경로로 이동.  
**해결**: 현재 슬라이드의 iframe만 DOM에 마운트 (lazy mounting)
```tsx
// 현재 슬라이드만 렌더링
if (!s.iframeRoute || slideIdx !== current) return null;
return <iframe key={`${slideIdx}-${visitCounts[slideIdx]}`} ... />;
```

---

### 문제 3: 파비콘/에셋 절대경로

**증상**: 배포에서 이미지가 안 보임  
**원인**: `/favicon.png`처럼 절대경로를 쓰면 `https://gounpark.github.io/favicon.png`가 돼버림  
**해결**:
```tsx
// 잘못된 방법
src="/favicon.png"

// 올바른 방법
src={`${import.meta.env.BASE_URL}favicon.png`}
```

---

### 문제 4: 오디오 겹침

**증상**: 슬라이드를 빠르게 전환하거나 🔊를 연속 클릭하면 오디오가 동시에 여러 개 재생됨  
**원인**: `generateAudio()`가 async라서 이전 요청이 완료되기 전에 새 요청이 시작됨  
**해결**: generation ID 방식으로 stale 응답 폐기
```tsx
const audioGenIdRef = useRef(0);

const playAudio = async (index) => {
  stopAudio(); // 이전 오디오 중단 + genId 증가
  const genId = ++audioGenIdRef.current;
  // ...
  const url = await generateAudio(narration);
  if (genId !== audioGenIdRef.current) return; // stale이면 재생 안 함
};
```

---

## 5. iframe 내부 페이지 이동 시 문제

### 원인 구조
```
iframe에서 gotoPath("/chat") 호출
  → window.location.href 변경 (전체 페이지 이동)
  → GitHub Pages에서 /chat은 존재하지 않음
  → 404.html 트리거 → sessionStorage 저장 → 루트로 리다이렉트
  → 이 과정이 2~3초 걸림
  → 그 동안 iframe은 빈 흰 화면 (사용자에겐 "멈춤"처럼 보임)
  → 페이지 로드 완료 후 데모 타이머가 다시 시작
```

### 로컬 vs 배포 차이
| 환경 | iframe 내 이동 속도 | 경험 |
|------|---------------------|------|
| 로컬 | 수십 ms | 자연스럽게 전환 |
| 배포 (GitHub Pages) | 2~3초 (404 리다이렉트) | 멈추는 것처럼 보임 |

### 해결: iframe 내 이동 자체를 없앰
각 슬라이드의 iframeRoute를 **최종 목적지 페이지로 직접** 연결.

---

## 6. 슬라이드별 잘못된 경로 → 수정된 경로

| 슬라이드 | 기능 | 이전 경로 (문제) | 수정된 경로 | 이유 |
|---------|------|-----------------|------------|------|
| 소개 | 홈 캘린더 | `/intro?nosplash=1` | (유지) | 직접 로드라 OK |
| 주요기능 01 | 감정 선택 | `/?demo=2&nosplash=1` | `/record?demo=3&nosplash=1` | 홈→감정선택 이동 제거 |
| 주요기능 02 | AI 채팅 | `/record?demo=1&nosplash=1` | `/chat?mood=good&demo=1&nosplash=1` | 감정선택→채팅 이동 제거 |
| 주요기능 03 | 오늘 분석 | `/analysis?day=21&demo=1&nosplash=1` | (유지) | 직접 로드라 OK |
| 주요기능 04 | 리포트 | `/report?demo=1&nosplash=1` | (유지) | 직접 로드라 OK |
| 주요기능 05 | 맞춤 조언 | `/advice?empty=false&nosplash=1` | (유지) | 직접 로드라 OK |
| 주요기능 06 | 포춘쿠키 | `/advice?empty=false&demo=1&nosplash=1` | `/fortune?demo=1&nosplash=1` | 조언→포춘쿠키 이동 제거 |
| 마무리 | 아웃트로 | (iframe 없음) | (변경 없음) | - |

### 핵심 원칙
> **iframeRoute는 반드시 최종 목적지 화면을 직접 가리켜야 한다.**  
> iframe 안에서 페이지를 이동시키는 방식은 GitHub Pages에서 작동하지 않는다.

---

## 7. 커서 위치 맞추기

### 문제
데모 커서(마우스 포인터)를 픽셀 값으로 하드코딩 → 레이아웃이 달라지면 엉뚱한 곳을 클릭

### 해결
DOM ref로 실제 요소 위치를 직접 측정
```tsx
const frameRef = useRef<HTMLDivElement>(null);
const targetRef = useRef<HTMLElement>(null);

useEffect(() => {
  const raf = requestAnimationFrame(() => {
    const frame = frameRef.current;
    const target = targetRef.current;
    if (!frame || !target) return;
    const fr = frame.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    setCursor({
      x: tr.left - fr.left + tr.width / 2,
      y: tr.top - fr.top + tr.height / 2,
      visible: false, tapping: false,
    });
  });
  return () => cancelAnimationFrame(raf);
}, [demo]);
```

---

## 8. 체크리스트 (다음 작업 전 반드시 확인)

### 배포 전
- [ ] 빌드 명령어가 `vite.static.config.ts`를 사용하는가?
- [ ] 새로 추가한 에셋 경로가 `import.meta.env.BASE_URL`을 사용하는가?
- [ ] 새 페이지/라우트에 `nosplash=1` 파라미터가 필요한가?

### iframe 관련
- [ ] 새 슬라이드의 iframeRoute가 **최종 목적지**를 직접 가리키는가?
- [ ] iframeRoute URL에 `&nosplash=1`이 포함되어 있는가?
- [ ] iframe 안에서 `gotoPath()`나 페이지 이동이 있는가? → **있으면 반드시 제거**

### 데모 커서
- [ ] 커서 위치가 하드코딩(숫자)으로 되어 있는가? → **DOM ref로 교체**
- [ ] `requestAnimationFrame` 안에서 위치를 읽고 있는가?

### 배포 후
- [ ] GitHub Actions가 성공했는가? (5~10분 대기 후 확인)
- [ ] 배포 URL에서 `/presentation` 직접 접속 시 정상 로드되는가?
- [ ] 각 슬라이드 iframe이 올바른 화면을 표시하는가?
- [ ] 오디오 연속 클릭 시 겹치지 않는가?

---

## 9. 파일 구조 참고

```
src/
├── routes/
│   ├── presentation.tsx   ← PT 슬라이드 메인 (SLIDES 배열, iframe 관리)
│   ├── index.tsx          ← 홈 (캘린더)
│   ├── record.tsx         ← 감정 선택
│   ├── chat.tsx           ← AI 채팅
│   ├── analysis.tsx       ← 오늘 분석
│   ├── report.tsx         ← 월간 리포트
│   ├── advice.tsx         ← 맞춤 조언
│   └── fortune.tsx        ← 포춘쿠키
├── components/
│   ├── Splash.tsx         ← 스플래시 (iframe/presentation 경로에서 자동 스킵)
│   ├── DemoCursor.tsx     ← 데모용 마우스 커서
│   └── presentation/
│       └── PhoneMockup.tsx ← 폰 프레임 (상태바 + 홈인디케이터 오버레이)
├── lib/
│   └── navigate.ts        ← gotoPath(), getAppOrigin() — base path 처리
├── pages-entry.tsx        ← GitHub Pages 전용 SPA 진입점
public/
└── 404.html               ← GitHub Pages SPA 라우팅 트릭
vite.static.config.ts      ← GitHub Pages 빌드 전용 설정
.github/workflows/
└── deploy.yml             ← GitHub Actions 자동 배포
```

---

## 10. 빠른 디버깅 가이드

| 증상 | 먼저 확인할 것 |
|------|---------------|
| 배포에서 이미지 안 보임 | 경로에 `BASE_URL` 사용했는지 |
| iframe이 빈 화면 | iframeRoute에 `nosplash=1` 있는지, iframe 내 이동 없는지 |
| 배포에서만 멈춤 | iframeRoute가 최종 목적지 직접 가리키는지 |
| 오디오 겹침 | stopAudio()가 genId를 올리는지 |
| 커서 위치 어긋남 | 하드코딩 px 대신 DOM ref 사용하는지 |
| 슬라이드 이동 안 됨 | JS 번들 에러 (콘솔 확인), 빌드 명령어 확인 |
| 로컬은 되는데 배포 안 됨 | iframe 내부 이동 or BASE_URL 문제 |
