import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Folder, Share2, Copy, Check, X } from "lucide-react";
import { createDiary, type ExchangeDiary } from "@/lib/exchangeStore";
import { getAppOrigin } from "@/lib/navigate";
import { AppHeader } from "@/components/AppHeader";
import exchangeCharacters from "@/assets/exchange-created-characters.webp";

export const Route = createFileRoute("/exchange/create")({
  head: () => ({
    meta: [{ title: "교환일기 만들기 — 안다미로" }, { name: "theme-color", content: "#ffffff" }],
  }),
  component: ExchangeCreatePage,
});

interface DraftData {
  title?: string;
  body?: string;
}

function ExchangeCreatePage() {
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [createdDiary, setCreatedDiary] = useState<ExchangeDiary | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasAiDraft, setHasAiDraft] = useState(false);

  const buildShareText = (diary: ExchangeDiary) => {
    const url = `${getAppOrigin()}/exchange?invite=${diary.inviteCode}`;
    return { url, text: `내 일기 보러올래? 🌱\n비밀번호: ${diary.password}\n${url}` };
  };

  const handleShare = async (diary: ExchangeDiary) => {
    const { text } = buildShareText(diary);
    if (navigator.share) {
      try { await navigator.share({ text }); } catch { /* dismissed */ }
    } else {
      await handleCopy(diary);
    }
  };

  const handleCopy = async (diary: ExchangeDiary) => {
    const { text } = buildShareText(diary);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* 무시 */ }
  };

  const focusField = (field: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>) => {
    field.current?.focus();
    field.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    // sessionStorage에서 AI 초안 읽기
    try {
      const raw = sessionStorage.getItem("exchange_draft");
      if (raw) {
        const draft: DraftData = JSON.parse(raw);
        if (draft.title && titleRef.current) titleRef.current.value = draft.title;
        if (draft.body && bodyRef.current) bodyRef.current.value = draft.body;
        if (draft.title || draft.body) setHasAiDraft(true);
        sessionStorage.removeItem("exchange_draft");
      }
    } catch {
      // 무시
    }
  }, []);

  // ── 이미지 선택 ──────────────────────────────────────────────────────────
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── 유효성 검사 → 생성 ──────────────────────────────────────────────────
  const handleSubmitAttempt = () => {
    const title = titleRef.current?.value ?? "";
    const body = bodyRef.current?.value ?? "";
    const password = passwordRef.current?.value ?? "";

    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      focusField(titleRef);
      return;
    }
    if (!body.trim()) {
      setError("일기 내용을 입력해 주세요.");
      focusField(bodyRef);
      return;
    }
    if (!password.trim()) {
      setError("비밀번호를 입력해 주세요.");
      focusField(passwordRef);
      return;
    }
    if (password.trim().length < 6 || password.trim().length > 12) {
      setError("비밀번호는 6~12자로 입력해 주세요.");
      focusField(passwordRef);
      return;
    }
    setError("");
    handleCreate();
  };

  // ── 실제 생성 ─────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    const title = titleRef.current?.value ?? "";
    const body = bodyRef.current?.value ?? "";
    const password = passwordRef.current?.value ?? "";

    try {
      const diary = await createDiary({
        title: title.trim(),
        body: body.trim(),
        password: password.trim(),
        keywords: [],
        imageDataUrl,
      });
      setCreatedDiary(diary);
    } catch {
      setError("일기 저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <div className="app-shell">
      <div className="app-frame flex flex-col bg-white">
        <AppHeader title="공유일기 만들기" backTo="/exchange" />

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-6 pb-32 pt-[7px] flex flex-col gap-6">
            {hasAiDraft && (
              <div className="w-fit rounded-full bg-[#ecf1fe] px-2 py-1.5 text-center text-[12px] font-medium text-[#4a75f7] tracking-[-0.36px]">
                ✦ AI가 오늘의 일기를 작성했어요
              </div>
            )}

            {/* 이미지 첨부 */}
            <div>
              <p className="text-[15px] font-bold text-[#222] tracking-tight mb-2">이미지</p>
              <div className="flex items-center gap-3">
                {imageDataUrl && (
                  <div className="relative h-[98px] w-[98px] shrink-0 overflow-hidden rounded-[12px]">
                    <img
                      src={imageDataUrl}
                      alt="첨부 이미지"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageDataUrl(undefined)}
                      className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/45"
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-[98px] w-[98px] shrink-0 flex-col items-center justify-center rounded-[12px] border border-dashed border-[#ddd] bg-[#fafafa] text-[#999] active:bg-[#f4f4f4] transition"
                >
                  <Folder className="h-5 w-5" strokeWidth={1.7} />
                  <span className="text-[15px] font-light leading-3 tracking-[-0.375px]">+</span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>

            {/* 제목 */}
            <label className="block">
              <span className="text-[15px] font-bold text-[#222] tracking-tight mb-3 block">
                제목
              </span>
              <input
                ref={titleRef}
                type="text"
                placeholder="입력해주세요."
                className="h-[53px] w-full rounded-[10px] border border-[#e6e6e6] bg-white px-[13px] text-[16px] leading-[1.5] text-[#222] placeholder:text-[#999] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
              />
            </label>

            {/* 본문 */}
            <label className="block">
              <span className="text-[15px] font-bold text-[#222] tracking-tight mb-2 block">
                내용
              </span>
              <textarea
                ref={bodyRef}
                placeholder="일기 내용을 입력해 주세요"
                rows={8}
                className="min-h-[244px] w-full resize-none rounded-[10px] border border-[#e6e6e6] bg-white p-[14px] text-[16px] leading-[1.5] text-[#454545] placeholder:text-[#999] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
              />
            </label>

            {/* 비밀번호 */}
            <label className="block">
              <span className="text-[15px] font-bold text-[#222] tracking-tight mb-2 block">
                비밀번호
              </span>
              <input
                ref={passwordRef}
                type="text"
                placeholder="패스워드 입력시 작성이 가능합니다.(6~12자)"
                className="h-[53px] w-full rounded-[10px] border border-[#e6e6e6] bg-white px-[13px] text-[16px] leading-[1.5] text-[#222] placeholder:text-[#999] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
              />
            </label>

            {error && <p className="text-[12px] text-red-400 -mt-2 tracking-tight">{error}</p>}
          </div>
        </div>

        {/* 하단 고정 버튼 */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-white px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3">
          <button
            type="button"
            onClick={handleSubmitAttempt}
            className="w-full rounded-[12px] py-3 font-medium text-white text-[18px] leading-[28px] tracking-tight shadow-[0_4px_2px_rgba(221,221,221,0.2)] active:scale-[0.99] transition"
            style={{ background: "#4283f3" }}
          >
            완료
          </button>
        </div>

        {/* 초대 링크 바텀시트 */}
        {createdDiary && (() => {
          return (
            <div className="absolute inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.45)" }}>
              <div className="relative h-[396px] w-full rounded-t-[20px] bg-white px-6 pt-[38px] pb-[calc(2rem+env(safe-area-inset-bottom))]">
                <h3 className="text-center text-[22px] font-bold leading-[26px] tracking-tight text-[#222]">
                  공유 일기가 만들어졌어요!
                </h3>
                <p className="mt-2 text-center text-[14px] leading-[21px] tracking-tight text-[#999]">
                  초대 링크를 보내서 친구에게 공유해 보세요.
                </p>

                <div className="mt-5 flex h-[162px] items-end justify-center overflow-hidden">
                  <img
                    src={exchangeCharacters}
                    alt=""
                    className="w-[280px] object-contain"
                  />
                </div>

                <div className="absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] left-6 right-6 flex gap-[10px]">
                  <button
                    type="button"
                    onClick={() => handleCopy(createdDiary)}
                    className="flex h-[52px] flex-1 items-center justify-center gap-1.5 rounded-[12px] border border-[#4283f3] bg-white text-[16px] font-medium tracking-[-0.48px] text-[#4283f3] active:scale-[0.99] transition"
                  >
                    {copied ? <Check className="h-4 w-4" /> : null}
                    {copied ? "복사됨" : "링크 복사"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare(createdDiary)}
                    className="flex h-[52px] w-[198px] shrink-0 items-center justify-center rounded-[12px] bg-[#4283f3] text-[16px] font-medium tracking-[-0.48px] text-white active:scale-[0.99] transition"
                  >
                    친구에게 공유
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
