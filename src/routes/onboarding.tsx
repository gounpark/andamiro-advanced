import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getCachedUser, isOnboardingComplete, saveOnboardingData } from "@/lib/auth";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "시작하기 — 안다미로" }, { name: "theme-color", content: "#ffffff" }],
  }),
  component: OnboardingPage,
});

const AGE_GROUPS = ["10대", "20대", "30대", "40대", "50대", "60대 이상"] as const;

function OnboardingPage() {
  const navigate = useNavigate();
  const user = getCachedUser();

  const [step, setStep] = useState(1); // 1 = nickname, 2 = age, 3 = gender, 4 = complete
  const [nickname, setNickname] = useState(
    (user?.user_metadata?.full_name as string | undefined) ?? ""
  );
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"남성" | "여성" | "">("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 이미 온보딩 완료한 유저는 홈으로
  useEffect(() => {
    if (!user) { navigate({ to: "/login" }); return; }
    if (isOnboardingComplete()) { navigate({ to: "/" }); }
  }, [user, navigate]);

  useEffect(() => {
    if (step === 1) inputRef.current?.focus();
  }, [step]);

  const handleComplete = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveOnboardingData({ display_name: nickname.trim(), age_group: age, gender });
      navigate({ to: "/" });
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-frame bg-white flex flex-col relative overflow-hidden">
        {/* 진행 바 (step 1-3만 표시) */}
        {step <= 3 && (
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#E6E6E6] z-10">
            <div
              className="h-full bg-[var(--primary)] transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        )}

        {step === 1 && (
          <NicknameStep
            nickname={nickname}
            onChange={setNickname}
            inputRef={inputRef}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <AgeStep age={age} onSelect={setAge} onNext={() => setStep(3)} />
        )}
        {step === 3 && (
          <GenderStep gender={gender} onSelect={setGender} onNext={() => setStep(4)} />
        )}
        {step === 4 && (
          <CompleteStep nickname={nickname.trim()} onStart={handleComplete} saving={saving} />
        )}
      </div>
    </div>
  );
}

// ── Step 1: 닉네임 ──────────────────────────────────────────────────────────

function NicknameStep({
  nickname,
  onChange,
  inputRef,
  onNext,
}: {
  nickname: string;
  onChange: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onNext: () => void;
}) {
  const trimmed = nickname.trim();
  const valid = trimmed.length > 0 && trimmed.length <= 20;

  return (
    <div className="flex flex-col flex-1 px-6 pt-16 pb-8">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-[26px] font-bold text-foreground leading-[1.5]">
          {"닉네임을\n입력해 주세요".split("\n").map((line, i) => (
            <span key={i} className="block">{line}</span>
          ))}
        </h1>
        <p className="text-[16px] text-[#757575]">안다미로가 부를 이름이에요.</p>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={nickname}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && valid) onNext(); }}
        placeholder="입력해주세요."
        maxLength={20}
        className="w-full h-[53px] px-[13px] rounded-[10px] border border-[#E6E6E6] text-[16px] text-foreground placeholder:text-[#757575] outline-none focus:border-[var(--primary)] transition-colors"
      />
      {nickname.trim().length > 20 && (
        <p className="mt-1 text-[12px] text-red-500">닉네임은 20자 이하로 입력해주세요.</p>
      )}

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={onNext}
          disabled={!valid}
          className="w-full h-[52px] rounded-[12px] font-medium text-[18px] text-white transition-colors disabled:bg-[#E6E6E6] disabled:text-[#ABABAB] bg-[var(--primary)]"
        >
          다음
        </button>
      </div>
    </div>
  );
}

// ── Step 2: 연령대 ──────────────────────────────────────────────────────────

function AgeStep({
  age,
  onSelect,
  onNext,
}: {
  age: string;
  onSelect: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col flex-1 px-6 pt-10 pb-8">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-[26px] font-bold text-foreground leading-[1.5]">
          {"연령대를\n선택해 주세요".split("\n").map((line, i) => (
            <span key={i} className="block">{line}</span>
          ))}
        </h1>
        <p className="text-[16px] text-[#757575]">맞춤 기록을 준비하는데 사용돼요.</p>
      </div>

      <div className="grid grid-cols-2 gap-[10px]">
        {AGE_GROUPS.map((group) => {
          const selected = age === group;
          return (
            <button
              key={group}
              type="button"
              onClick={() => onSelect(group)}
              className={`py-[26px] rounded-[10px] text-[16px] font-medium border transition-colors ${
                selected
                  ? "border-[var(--primary)] bg-[#F9FBFE] text-[var(--primary)] font-bold"
                  : "border-[#E6E6E6] bg-white text-[#757575]"
              }`}
            >
              {group}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={onNext}
          disabled={!age}
          className="w-full h-[52px] rounded-[12px] font-medium text-[18px] text-white transition-colors disabled:bg-[#E6E6E6] bg-[var(--primary)]"
        >
          다음
        </button>
      </div>
    </div>
  );
}

// ── Step 3: 성별 ────────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function GenderStep({
  gender,
  onSelect,
  onNext,
}: {
  gender: "남성" | "여성" | "";
  onSelect: (v: "남성" | "여성") => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col flex-1 px-6 pt-10 pb-8">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-[26px] font-bold text-foreground leading-[1.5]">
          {"성별을\n선택해 주세요".split("\n").map((line, i) => (
            <span key={i} className="block">{line}</span>
          ))}
        </h1>
        <p className="text-[16px] text-[#757575]">맞춤 기록을 준비하는데 사용돼요.</p>
      </div>

      <div className="flex gap-[10px]">
        {(["남성", "여성"] as const).map((g) => {
          const selected = gender === g;
          const img = g === "남성"
            ? `${BASE}/onboarding/gender-male.png`
            : `${BASE}/onboarding/gender-female.png`;
          return (
            <button
              key={g}
              type="button"
              onClick={() => onSelect(g)}
              className={`flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-[10px] border transition-colors ${
                selected
                  ? "border-[var(--primary)] bg-[#F9FBFE]"
                  : "border-[#E6E6E6] bg-white"
              }`}
            >
              <img
                src={img}
                alt={g}
                className="w-[100px] h-[100px] object-contain pointer-events-none"
              />
              <span
                className={`text-[16px] font-medium ${
                  selected ? "text-[var(--primary)] font-bold" : "text-[#757575]"
                }`}
              >
                {g}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={onNext}
          disabled={!gender}
          className="w-full h-[52px] rounded-[12px] font-medium text-[18px] text-white transition-colors disabled:bg-[#E6E6E6] bg-[var(--primary)]"
        >
          다음
        </button>
      </div>
    </div>
  );
}

// ── Step 4: 가입완료 ────────────────────────────────────────────────────────

function CompleteStep({
  nickname,
  onStart,
  saving,
}: {
  nickname: string;
  onStart: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex flex-col flex-1 px-6 pt-10 pb-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-[26px] font-bold text-foreground leading-[1.5]">
          <span className="block">만나서 반가워요</span>
          <span className="block">
            <span className="text-[var(--primary)]">{nickname} </span>
            <span>님!</span>
          </span>
        </h1>
        <p className="text-[16px] text-[#757575]">안다미로와 함께 기록을 시작해요.</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <img
          src={`${BASE}/onboarding/welcome-characters.gif`}
          alt="환영"
          className="w-[327px] h-[327px] object-cover"
        />
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={saving}
        className="w-full h-[52px] rounded-[12px] font-medium text-[18px] text-white bg-[var(--primary)] disabled:opacity-60 transition-opacity"
      >
        {saving ? "저장 중..." : "시작하기"}
      </button>
    </div>
  );
}
