import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Plus, Mic, ArrowUp } from "lucide-react";
import { DemoCursor } from "@/components/DemoCursor";

type MoodKey = "best" | "good" | "okay" | "bad" | "worst";

type Search = {
  mood?: MoodKey;
  demo?: string;
};

export const Route = createFileRoute("/chat")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    mood: (search.mood as MoodKey) ?? "good",
    demo: search.demo != null ? String(search.demo) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "오늘의 일기 — 안다미로" },
      { name: "description", content: "오늘의 감정을 대화로 풀어내는 감정톡." },
      { name: "theme-color", content: "#ffffff" },
    ],
  }),
  component: ChatPage,
});

type Msg =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "bot"; text: string; canEnd?: boolean };

const MOOD_GREETING: Record<MoodKey, { title: string; sub: string; chips: string[] }> = {
  best: {
    title: "안녕하세요!\n오늘 정말 최고의 하루였군요!",
    sub: "선택하신 감정의 세부 감정을 선택해주세요",
    chips: ["⚡ 에너지가 넘쳐요", "😊 기분이 아주 좋아요", "✨ 오늘 잘될 것 같아요", "💪 활기차고 자신 있어요"],
  },
  good: {
    title: "안녕하세요!\n오늘의 하루가 좋으셨군요!",
    sub: "선택하신 감정의 세부 감정을 선택해주세요",
    chips: ["⚡ 에너지가 넘쳐요", "😊 기분이 아주 좋아요", "✨ 오늘 잘될 것 같아요", "💪 활기차고 자신 있어요"],
  },
  okay: {
    title: "안녕하세요!\n평범한 하루를 보내셨군요.",
    sub: "선택하신 감정의 세부 감정을 선택해주세요",
    chips: ["😌 차분해요", "🤔 무덤덤해요", "🌤 그럭저럭이에요", "💭 생각이 많아요"],
  },
  bad: {
    title: "안녕하세요.\n오늘 조금 별로였군요.",
    sub: "선택하신 감정의 세부 감정을 선택해주세요",
    chips: ["😞 기운이 없어요", "😣 답답해요", "😔 속상해요", "😤 짜증이 나요"],
  },
  worst: {
    title: "안녕하세요.\n많이 힘드셨군요.",
    sub: "선택하신 감정의 세부 감정을 선택해주세요",
    chips: ["😢 너무 슬퍼요", "😩 지쳤어요", "😡 화가 나요", "💔 마음이 아파요"],
  },
};

const BOT_REPLY: Record<string, string> = {
  default: "그러셨군요. 그 감정에 대해 조금 더 들려주실래요? 🙂",
  "⚡ 에너지가 넘쳐요": "정말 잘됐네요 🎉\n어떤 점이 특히 좋았나요?",
  "😊 기분이 아주 좋아요": "기분 좋은 하루였군요 😊\n무엇이 그렇게 좋게 느껴졌어요?",
  "✨ 오늘 잘될 것 같아요": "좋은 예감이 드는 하루네요 ✨\n어떤 일이 기대되세요?",
  "💪 활기차고 자신 있어요": "에너지가 느껴져요 💪\n오늘 하루 어떻게 보내셨어요?",
};

/**
 * 사용자 입력에서 키워드를 인식해 자연스러운 답변을 생성.
 * 정확한 칩 매칭 → 키워드 카테고리 매칭 → 길이 기반 fallback 순.
 */
const KEYWORD_REPLIES: { keywords: string[]; replies: string[] }[] = [
  {
    keywords: ["일", "회사", "업무", "프로젝트", "출근", "야근", "미팅", "회의"],
    replies: [
      "일과 관련된 이야기네요 💼\n오늘 가장 인상 깊었던 순간은 어떤 거였어요?",
      "업무가 마음에 영향을 많이 줬군요.\n그 상황에서 어떤 기분이 들었어요?",
    ],
  },
  {
    keywords: ["친구", "가족", "엄마", "아빠", "동료", "사람", "연인", "남친", "여친"],
    replies: [
      "사람과의 관계는 늘 마음을 크게 움직이죠 🤍\n그 사람과는 어떤 일이 있었어요?",
      "관계 속에서 느낀 감정이 오늘 하루를 색칠한 것 같네요.\n조금 더 들려주실래요?",
    ],
  },
  {
    keywords: ["피곤", "지치", "힘들", "지쳤", "졸려", "쉬고", "쉼"],
    replies: [
      "많이 지치셨군요 🥲\n오늘 가장 에너지를 많이 쓴 순간은 언제였어요?",
      "몸도 마음도 쉴 시간이 필요해 보여요.\n오늘 자신을 위해 한 가지 해주고 싶은 게 있다면요?",
    ],
  },
  {
    keywords: ["행복", "좋", "신나", "재밌", "즐거", "웃", "기쁘"],
    replies: [
      "그 순간이 오늘의 작은 빛이 되었겠어요 ✨\n무엇이 그렇게 좋게 다가왔어요?",
      "듣는 저까지 기분 좋아지네요 😊\n그 기분을 한 단어로 표현한다면요?",
    ],
  },
  {
    keywords: ["슬프", "우울", "외로", "눈물", "울었", "허전"],
    replies: [
      "그 마음, 충분히 그럴 수 있어요 🤍\n어떤 순간에 그런 감정이 가장 짙어졌어요?",
      "조용히 옆에 있어 드리고 싶네요.\n혹시 그 마음을 떠오르게 한 일이 있었나요?",
    ],
  },
  {
    keywords: ["화", "짜증", "답답", "열받", "스트레스"],
    replies: [
      "그럴 만했겠어요 😤\n무엇이 가장 답답하게 느껴졌어요?",
      "그 감정도 충분히 자연스러워요.\n혹시 그 상황을 다시 떠올리면 어떤 부분이 가장 마음에 걸려요?",
    ],
  },
  {
    keywords: ["걱정", "불안", "두려", "긴장", "초조"],
    replies: [
      "마음 한쪽이 무거우셨겠어요.\n그 걱정이 어떤 모양으로 다가오나요?",
      "혼자 안고 있기엔 무거운 감정이에요.\n조금만 더 들려주실래요?",
    ],
  },
  {
    keywords: ["산책", "운동", "요가", "달리기", "걷기", "헬스"],
    replies: [
      "몸을 움직이며 마음도 정리되는 시간이었나 봐요 🌿\n그 시간 동안 어떤 생각이 스쳤어요?",
      "스스로를 잘 돌보고 계시네요.\n오늘 그 순간이 어떻게 마음을 바꿔놨어요?",
    ],
  },
  {
    keywords: ["커피", "차", "음식", "밥", "먹", "맛있"],
    replies: [
      "맛있는 한 끼는 작지만 큰 위로가 되죠 ☕\n그 순간을 가장 풍요롭게 만든 건 무엇이었어요?",
      "오늘 그 시간이 작은 행복이 되었겠네요 🍽️\n다른 좋았던 순간도 있었어요?",
    ],
  },
];

const GENERIC_REPLIES = [
  "그러셨군요. 그 순간 마음속에서 가장 크게 떠오른 감정은 뭐였어요?",
  "이야기해 주셔서 고마워요 🤍\n조금 더 자세히 들려주실 수 있어요?",
  "들으니 마음이 와닿네요.\n그 감정에 이름을 붙인다면 어떤 단어일까요?",
  "오늘의 그 순간을 한 컷으로 남긴다면 어떤 장면일 것 같아요?",
  "그 감정이 지금까지도 남아 있나요?",
];

function pickReply(text: string): string {
  // 1) 정확한 칩 매칭
  if (BOT_REPLY[text]) return BOT_REPLY[text];
  // 2) 키워드 카테고리 매칭
  const lower = text.toLowerCase();
  for (const cat of KEYWORD_REPLIES) {
    if (cat.keywords.some((k) => lower.includes(k))) {
      return cat.replies[Math.floor(Math.random() * cat.replies.length)];
    }
  }
  // 3) 일반 답변
  return GENERIC_REPLIES[Math.floor(Math.random() * GENERIC_REPLIES.length)];
}

function ChatPage() {
  const { mood = "good", demo: demoParam } = Route.useSearch();
  const demo1 = demoParam === "1"; // 주요기능02: 칩선택→대화 애니메이션 → 대화종료에 커서만 (화면전환 없음)
  const demo2 = demoParam === "2"; // 주요기능03: 정적 완료 화면 → 대화종료 클릭 → 분석 이동
  const navigate = useNavigate();
  const greeting = MOOD_GREETING[mood] ?? MOOD_GREETING.good;

  // demo=2: 정적 완료 메시지 미리 세팅
  const [messages, setMessages] = useState<Msg[]>(() => {
    if (!demo2) return [];
    const msg1 = greeting.chips[1];
    const msg2 = "오늘 기분 좋은 일이 있었어요";
    const msg3 = "친구랑 오랜만에 만났거든요";
    return [
      { id: "d1", role: "user", text: msg1 },
      { id: "d2", role: "bot", text: pickReply(msg1), canEnd: true },
      { id: "d3", role: "user", text: msg2 },
      { id: "d4", role: "bot", text: pickReply(msg2), canEnd: true },
      { id: "d5", role: "user", text: msg3 },
      { id: "d6", role: "bot", text: pickReply(msg3), canEnd: true },
    ];
  });
  const [showChips, setShowChips] = useState(!demo2);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const isComposingRef = useRef(false); // IME 조합 중 여부 (iOS Korean 대응)
  const scrollRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState({ x: 50, y: 700, tapping: false, visible: false });
  const frameRef = useRef<HTMLDivElement>(null);
  const endBtnRef = useRef<HTMLButtonElement>(null);
  const chip1Ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  // ── demo=1 (주요기능02): 칩 선택 → 대화 애니메이션 → 대화종료 커서 hover (화면 전환 없음) ──
  useEffect(() => {
    if (!demo1) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const track = (fn: () => void, delay: number) => {
      const t = setTimeout(() => { if (!cancelled) fn(); }, delay);
      timers.push(t);
    };
    const addUser = (text: string) => {
      setMessages(m => [...m, { id: crypto.randomUUID(), role: "user", text }]);
      setShowChips(false);
      setIsTyping(true);
    };
    const addBot = (replyTo: string) => {
      setIsTyping(false);
      setMessages(m => [...m, { id: crypto.randomUUID(), role: "bot", text: pickReply(replyTo), canEnd: true }]);
    };

    const msg1 = greeting.chips[1]; // "😊 기분이 아주 좋아요"
    const msg2 = "오늘 기분 좋은 일이 있었어요";
    const msg3 = "친구랑 오랜만에 만났거든요";

    // rAF로 칩 위치 읽어 커서 배치
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      const chip = chip1Ref.current;
      const frame = frameRef.current;
      if (chip && frame) {
        const cr = chip.getBoundingClientRect();
        const fr = frame.getBoundingClientRect();
        const cx = cr.left - fr.left + cr.width / 2;
        const cy = cr.top - fr.top + cr.height / 2;
        setCursor({ x: cx, y: cy + 60, tapping: false, visible: false });
        track(() => setCursor({ x: cx, y: cy + 60, tapping: false, visible: true }), 400);
        track(() => setCursor({ x: cx, y: cy, tapping: false, visible: true }), 800);
        track(() => setCursor(c => ({ ...c, tapping: true })), 1200);
        track(() => { setCursor(c => ({ ...c, tapping: false })); addUser(msg1); }, 1500);
      } else {
        track(() => addUser(msg1), 900);
      }
    });

    track(() => addBot(msg1), 2900);
    track(() => addUser(msg2), 4600);
    track(() => addBot(msg2), 6000);
    track(() => addUser(msg3), 7700);
    track(() => addBot(msg3), 9100);

    // 대화종료 버튼으로 커서 이동 (hover만, 화면 전환 없음)
    track(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;
        const btn = endBtnRef.current;
        const frame = frameRef.current;
        if (btn && frame) {
          const br = btn.getBoundingClientRect();
          const fr = frame.getBoundingClientRect();
          setCursor({ x: br.left-fr.left+br.width/2, y: br.top-fr.top+br.height/2, tapping: false, visible: true });
        }
      });
    }, 10400);
    track(() => setCursor(c => ({ ...c, tapping: true })), 11100);
    track(() => setCursor(c => ({ ...c, tapping: false, visible: false })), 11400); // 멈춤

    return () => { cancelled = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo1]);

  // ── demo=2 (주요기능03): 정적 완료 화면 → 대화종료 클릭 → 분석 이동 ──
  useEffect(() => {
    if (!demo2) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const track = (fn: () => void, delay: number) => {
      const t = setTimeout(() => { if (!cancelled) fn(); }, delay);
      timers.push(t);
    };
    // 1s: 커서 등장 (대화종료 버튼 위치 측정)
    track(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;
        const btn = endBtnRef.current;
        const frame = frameRef.current;
        if (btn && frame) {
          const br = btn.getBoundingClientRect();
          const fr = frame.getBoundingClientRect();
          setCursor({ x: br.left-fr.left+br.width/2, y: br.top-fr.top+br.height/2, tapping: false, visible: true });
        }
      });
    }, 1000);
    track(() => setCursor(c => ({ ...c, tapping: true })), 1700);
    track(() => { setCursor(c => ({ ...c, tapping: false })); navigate({ to: "/analysis", search: { day: 21 } }); }, 2000);

    return () => { cancelled = true; timers.forEach(clearTimeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo2]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setShowChips(false);
    setInput("");

    // 타이핑 인디케이터: 길이에 따라 800~1800ms 정도 사고하는 척
    setIsTyping(true);
    const thinkMs = Math.min(1800, 700 + trimmed.length * 35);
    setTimeout(() => {
      const replyText = pickReply(trimmed);
      setIsTyping(false);
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "bot", text: replyText, canEnd: true },
      ]);
    }, thinkMs);
  };

  const endConversation = () => {
    navigate({ to: "/analysis", search: { day: undefined } });
  };

  return (
    <div className="app-shell">
      <div ref={frameRef} className="app-frame flex flex-col" style={{ position: "relative" }}>
        {(demo1 || demo2) && <DemoCursor {...cursor} />}
        {/* 헤더 */}
        <header className="relative flex shrink-0 items-center justify-center px-4 pt-[52px] pb-3 border-b border-black/5">
          <Link
            to="/record"
            aria-label="뒤로"
            className="absolute left-3 top-[50px] grid h-9 w-9 place-items-center rounded-full text-foreground/70 hover:text-foreground"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.2} />
          </Link>
          <h1 className="font-semibold text-foreground text-[16px] tracking-tight">오늘의 일기</h1>
        </header>

        {/* 대화 영역 */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-5 scrollbar-hide">
          {/* 인사말 */}
          <div className="mb-3">
            <h2 className="font-bold text-foreground text-[20px] leading-[1.35] tracking-tight whitespace-pre-line">
              {greeting.title}
            </h2>
            <p className="mt-2 text-[13px] text-[#8a8d96] tracking-tight">{greeting.sub}</p>
          </div>

          {/* 추천 칩 */}
          {showChips && (
            <div className="flex flex-wrap gap-2 mb-5 animate-in fade-in slide-in-from-top-1 duration-300">
              {greeting.chips.map((c, chipIdx) => (
                <button
                  key={c}
                  ref={chipIdx === 1 ? chip1Ref : undefined}
                  type="button"
                  onClick={() => send(c)}
                  className="rounded-full border border-[var(--primary)]/40 bg-white px-3.5 py-2 text-[13px] font-medium text-[var(--primary)] hover:bg-[var(--primary)]/5 active:scale-[0.98] transition"
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* 메시지 */}
          <div className="flex flex-col gap-3">
            {(() => {
              // 마지막 canEnd 봇 메시지 id만 찾아서 그 위에만 "대화 종료" 버튼 표시
              const lastCanEndId = [...messages].reverse().find(m => m.role === "bot" && m.canEnd)?.id;
              return messages.map((m) => (
                <div key={m.id}>
                  {m.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="max-w-[78%] rounded-2xl rounded-tr-md bg-[var(--primary)] px-4 py-2.5 text-white text-[14px] leading-snug shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
                        {m.text}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-2">
                      <div className="max-w-[80%] rounded-2xl rounded-tl-md bg-[#f1f3f6] px-4 py-2.5 text-foreground text-[14px] leading-snug whitespace-pre-line animate-in fade-in slide-in-from-bottom-1 duration-300">
                        {m.text}
                      </div>
                      {m.canEnd && m.id === lastCanEndId && (
                        <button
                          ref={endBtnRef}
                          type="button"
                          onClick={endConversation}
                          className="rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-[12px] font-medium text-[var(--primary)] hover:bg-[var(--primary)]/15 transition"
                        >
                          대화 종료
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ));
            })()}
            {isTyping && (
              <div className="flex items-start animate-in fade-in duration-200">
                <div className="rounded-2xl rounded-tl-md bg-[#f1f3f6] px-4 py-3">
                  <span className="flex items-end gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.25s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.12s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce" />
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 입력 바 */}
        <div className="shrink-0 border-t border-black/5 bg-white px-3 pt-2 pb-[44px]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="추가"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-foreground/60 hover:bg-black/5"
            >
              <Plus className="h-5 w-5" />
            </button>
            <input
              value={input}
              onChange={(e) => {
                // IME 조합 중에는 state 업데이트 스킵 → iOS Safari에서 한글 composition 중단 방지
                if (!isComposingRef.current) setInput(e.target.value);
              }}
              onCompositionStart={() => { isComposingRef.current = true; }}
              onCompositionEnd={(e) => {
                isComposingRef.current = false;
                setInput((e.target as HTMLInputElement).value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) send(input);
              }}
              placeholder="질문을 입력해 보세요"
              className="min-w-0 flex-1 bg-transparent px-2 text-[14px] text-foreground placeholder:text-[#b8bac2] outline-none tracking-tight"
            />
            <button
              type="button"
              aria-label="음성 입력"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-foreground/60 hover:bg-black/5"
            >
              <Mic className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="보내기"
              onClick={() => send(input)}
              disabled={!input.trim()}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
                input.trim()
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[#e8e8ec] text-[#b8bac2] cursor-not-allowed"
              }`}
            >
              <ArrowUp className="h-5 w-5" strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}