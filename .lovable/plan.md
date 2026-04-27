

## 안다미로 1080×1920 시연 영상 — Remotion 자동 생성

Remotion으로 **세로 1080×1920, 약 25초, 30fps (총 750프레임)** 시연 영상을 만들어 `/mnt/documents/andamiro-demo-v1.mp4`에 저장합니다.

---

### 영상 구성 (총 25초)

| # | 씬 | 시간 | 길이 | 내용 |
|---|---|---|---|---|
| 1 | 스플래시 | 0:00–0:02.5 | 75f | `splash.gif` 첫 프레임 풀스크린 → 페이드 |
| 2 | 홈 인트로 | 0:02.5–0:06 | 105f | 클로버 캘린더 + "안다미로" 타이틀 등장 |
| 3 | 일기쓰기 | 0:06–0:09 | 90f | 무드 선택(5개 이모지) → 텍스트 타이핑 |
| 4 | 리포트 | 0:09–0:13 | 120f | 점수 카드 + 포춘쿠키 버튼 줌인 강조 |
| 5 | 포춘쿠키 ⭐ | 0:13–0:18 | 150f | 쿠키 흔들림 → 깨짐 → 메시지 등장 |
| 6 | 조언 | 0:18–0:21 | 90f | 80점 + 태그칩 + 채팅말풍선 |
| 7 | 분석 | 0:21–0:23 | 60f | 반원 게이지 차오름 |
| 8 | 엔딩 | 0:23–0:25 | 60f | 로고 + "오늘도 안다미로" 슬로건 |

(트랜지션 오버랩 포함, 합산 750프레임)

---

### 디자인/모션 시스템

- **컬러**: 흰 배경 #FFFFFF, 프라이머리 파랑 #3B6FFF (앱 토큰), 클로버 노랑 #F5C84A, 클로버 초록 #11A757
- **폰트**: Google Fonts `Gowun Dodum` (한글 손글씨 느낌, 안다미로 톤) + `Inter` (숫자/라틴)
- **모션 디렉션**: *Warm Editorial* — 부드러운 spring(damping 18-22), 짧은 거리 이동(20-30px), 페이드 + 살짝 위로
- **트랜지션**: `slide` (from-bottom) + `fade` 혼합, 각 24f
- **모티프**: 앱 캘린더 그리드, 클로버 4잎, 포춘쿠키
- **세로 9:16 레이아웃**: 앱 프레임을 1080×1920에 맞춰 풀스크린으로 채우고, 양옆은 #F7F7F9 패딩

### 자산 활용

`src/assets/` → `remotion/public/images/` 로 복사:
- `icons/logo.svg`, `icons/clover-active.svg`, `icons/clover-empty.svg`, `icons/bg-shape-large.svg`
- `splash.gif` (첫 프레임만 사용)
- `report/fortune-cookie-closed.png`, `fortune-cookie-cracked.png`, `fortune-cookie-result.png`, `fortune-paper.png`, `fortune-rays.png`
- `moods/mood-best-big.webp`, `mood-good-big.webp`, `mood-okay-big.webp`, `mood-bad-big.webp`, `mood-worst-big.webp`

실제 앱 화면을 그대로 녹화하는 게 아니라, **앱 UI를 Remotion 컴포넌트로 재현한 모션그래픽**입니다. 컬러/폰트/자산은 실제 앱과 100% 동일.

---

### 파일 구조 (`remotion/`)

```text
remotion/
├── package.json, tsconfig.json
├── scripts/render-remotion.mjs
├── public/images/  (위 자산 복사)
└── src/
    ├── index.ts
    ├── Root.tsx              (1080×1920, 30fps, 750f)
    ├── MainVideo.tsx         (TransitionSeries로 8씬 연결)
    └── scenes/
        ├── Scene1Splash.tsx
        ├── Scene2Home.tsx
        ├── Scene3Record.tsx
        ├── Scene4Report.tsx
        ├── Scene5Fortune.tsx     ⭐ 핵심 — 흔들림 spring + 광선 회전
        ├── Scene6Advice.tsx
        ├── Scene7Analysis.tsx
        └── Scene8Ending.tsx
```

### 실행 단계

1. `remotion/` 디렉터리 생성, `bun init`, Remotion 의존성 설치
2. compositor 바이너리 패치 (musl→gnu 복사) + ffmpeg/ffprobe 심볼릭링크
3. 자산 복사
4. 8개 씬 컴포넌트 작성 (모든 모션은 `useCurrentFrame()` + `interpolate`/`spring`)
5. `bunx remotion still`로 핵심 프레임 4-5장 스폿체크
6. `node scripts/render-remotion.mjs`로 1080×1920 mp4 렌더 (concurrency=1, muted)
7. 결과물 `/mnt/documents/andamiro-demo-v1.mp4` + `<lov-artifact>` 태그로 다운로드 제공
8. QA: ffmpeg로 5개 프레임 추출해서 시각 확인

### 사양

- 해상도: **1080×1920 (9:16 세로)**
- FPS: 30
- 길이: 약 25초
- 코덱: H.264, 무음(BGM 없음 — 사용자가 편집 시 추가)
- 예상 렌더 시간: 3–6분

### 이후 반복

- v1 확인 후 수정 요청(씬 길이, 컬러, 카피 등) 시 `andamiro-demo-v2.mp4`로 새 버전 저장
- BGM/나레이션은 Remotion에서도 추가 가능하지만 v1은 무음으로 먼저 시안 확인 권장

