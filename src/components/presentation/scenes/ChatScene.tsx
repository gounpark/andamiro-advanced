import { useEffect, useState } from "react";
import { ChevronLeft, Plus, Mic, ArrowUp } from "lucide-react";
import moodGoodWebp from "@/assets/moods/mood-good.webp";

interface Props {
  isActive: boolean;
}

type ScriptEntry =
  | { role: "bot"; text: string; delay: number }
  | { role: "user"; text: string; delay: number }
  | { role: "chip"; text: string; delay: number }
  | { role: "typing"; delay: number; duration: number };

const SCRIPT: ScriptEntry[] = [
  {
    role: "bot",
    text: "안녕하세요! 😊\n오늘 기분이 좋으셨군요.\n어떤 점이 특히 좋았나요?",
    delay: 600,
  },
  { role: "typing", delay: 2200, duration: 1400 },
  { role: "chip", text: "😊 기분이 아주 좋아요", delay: 2200 },
  { role: "bot", text: "그렇군요 💙\n오늘 어떤 일이 있었는지 조금 더 들려주실래요?", delay: 4200 },
  {
    role: "user",
    text: "오늘 오랜만에 친구를 만났어요. 밥도 먹고 카페도 갔는데 너무 좋았어요",
    delay: 6000,
  },
  { role: "typing", delay: 7200, duration: 1800 },
  {
    role: "bot",
    text: "소중한 사람과의 시간이었네요 🤍\n오랜만에 만난 만큼 더 특별하게 느껴졌을 것 같아요.\n그 자리에서 어떤 이야기를 나눴나요?",
    delay: 9000,
  },
  {
    role: "user",
    text: "근황 얘기도 하고, 옛날 얘기도 많이 했어요. 오래됐는데도 어색하지 않았어요",
    delay: 11000,
  },
  { role: "typing", delay: 12400, duration: 1600 },
  {
    role: "bot",
    text: "마음이 편한 관계라는 게 느껴져요 😊\n오늘 하루가 충전된 것 같네요.\n기록 잘 남겼어요 🍀",
    delay: 14000,
  },
];

type MsgItem =
  | { id: number; role: "bot"; text: string }
  | { id: number; role: "user"; text: string }
  | { id: number; role: "chip"; text: string }
  | { id: number; role: "typing" };

export function ChatScene({ isActive }: Props) {
  const [messages, setMessages] = useState<MsgItem[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setMessages([]);
      setIsTyping(false);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    SCRIPT.forEach((entry, i) => {
      if (entry.role === "typing") {
        timers.push(
          setTimeout(() => setIsTyping(true), entry.delay),
          setTimeout(() => setIsTyping(false), entry.delay + entry.duration),
        );
      } else {
        timers.push(
          setTimeout(() => {
            setMessages((prev) => [...prev, { ...entry, id: i } as MsgItem]);
          }, entry.delay),
        );
      }
    });

    return () => timers.forEach(clearTimeout);
  }, [isActive]);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Status bar */}
      <div className="flex items-center justify-between px-5" style={{ height: 44 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>9:41</span>
      </div>

      {/* Header */}
      <div
        className="flex items-center shrink-0 px-4 pb-3"
        style={{ borderBottom: "1px solid #f0f0f0" }}
      >
        <button
          type="button"
          className="flex items-center justify-center rounded-full"
          style={{ width: 36, height: 36, background: "#f2f3f7" }}
        >
          <ChevronLeft size={18} color="#444" />
        </button>
        <div className="flex-1 flex flex-col items-center" style={{ marginLeft: -36 }}>
          <div className="flex items-center gap-2">
            <img
              src={moodGoodWebp}
              alt=""
              style={{ width: 24, height: 24, objectFit: "contain" }}
            />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>안다미로</span>
          </div>
          <span style={{ fontSize: 11, color: "#888", marginTop: 1 }}>AI 감정 기록</span>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-hidden flex flex-col"
        style={{ padding: "12px 16px", gap: 10 }}
      >
        {messages.map((msg) => {
          if (msg.role === "chip") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div
                  className="rounded-full px-4 py-2"
                  style={{
                    background: "#eef4ff",
                    border: "1.5px solid #4B82F5",
                    fontSize: 13,
                    color: "#4B82F5",
                    fontWeight: 500,
                    animation: "fadeSlideIn 0.3s ease",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          }
          if (msg.role === "user") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div
                  className="rounded-2xl rounded-br-md px-4 py-2.5"
                  style={{
                    background: "#4B82F5",
                    color: "white",
                    fontSize: 13,
                    maxWidth: "75%",
                    lineHeight: 1.55,
                    whiteSpace: "pre-line",
                    animation: "fadeSlideIn 0.3s ease",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          }
          if (msg.role === "bot") {
            return (
              <div key={msg.id} className="flex justify-start">
                <div
                  className="rounded-2xl rounded-tl-md px-4 py-2.5"
                  style={{
                    background: "#f1f3f6",
                    color: "#222",
                    fontSize: 13,
                    maxWidth: "75%",
                    lineHeight: 1.55,
                    whiteSpace: "pre-line",
                    animation: "fadeSlideIn 0.3s ease",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          }
          return null;
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-md px-4 py-3" style={{ background: "#f1f3f6" }}>
              <div className="flex items-end gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: 6,
                      height: 6,
                      background: "#aaa",
                      animation: `bounce 0.9s ease infinite`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div
        className="shrink-0 flex items-center gap-1 px-3 py-2"
        style={{ borderTop: "1px solid #f0f0f0" }}
      >
        <button
          type="button"
          className="flex items-center justify-center rounded-full"
          style={{ width: 36, height: 36, color: "#888" }}
        >
          <Plus size={20} />
        </button>
        <div
          className="flex-1 rounded-full px-4 flex items-center"
          style={{ height: 36, background: "#f2f3f7", fontSize: 13, color: "#bbb" }}
        >
          질문을 입력해 보세요
        </div>
        <button
          type="button"
          className="flex items-center justify-center rounded-full"
          style={{ width: 36, height: 36, color: "#888" }}
        >
          <Mic size={18} />
        </button>
        <button
          type="button"
          className="flex items-center justify-center rounded-full"
          style={{ width: 36, height: 36, background: "#e8eaf0", color: "#bbb" }}
        >
          <ArrowUp size={18} />
        </button>
      </div>
    </div>
  );
}
