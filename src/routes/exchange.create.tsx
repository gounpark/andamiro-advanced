import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, X, ImagePlus } from "lucide-react";
import { createDiary, type ExchangeDiary } from "@/lib/exchangeStore";
import { InviteLinkButton } from "./exchange";

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
  const navigate = useNavigate();

  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [createdDiary, setCreatedDiary] = useState<ExchangeDiary | null>(null);

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
      <div className="app-frame flex flex-col" style={{ background: "#f5f6f8" }}>
        <div className="absolute inset-0 overflow-y-auto scrollbar-hide">
          {/* 헤더 */}
          <header className="sticky top-0 z-10 bg-white flex items-center gap-2 px-4 pt-[52px] pb-3 border-b border-[#f0f0f0]">
            <button
              type="button"
              onClick={() => navigate({ to: "/exchange", search: {} })}
              className="p-1 -ml-1"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <h1 className="flex-1 font-bold text-foreground text-[18px] tracking-tight">
              교환일기 만들기
            </h1>
          </header>

          <div className="px-6 pb-32 pt-5 flex flex-col gap-7">
            {/* 이미지 첨부 */}
            <div>
              <p className="text-[15px] font-bold text-[#222] tracking-tight mb-2">이미지</p>
              {imageDataUrl ? (
                <div
                  className="relative w-full rounded-2xl overflow-hidden"
                  style={{ aspectRatio: "16/9" }}
                >
                  <img
                    src={imageDataUrl}
                    alt="첨부 이미지"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageDataUrl(undefined)}
                    className="absolute top-2 right-2 bg-black/50 rounded-full p-1"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 w-full h-[120px] rounded-2xl bg-[#f4f6fa] border-2 border-dashed border-[#ddd] text-[#bbb] active:bg-[#eef0f5] transition"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-[14px] tracking-tight">사진 추가</span>
                </button>
              )}
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
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-white border-t border-[#f0f0f0] px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
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
        {createdDiary && (
          <div className="absolute inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.45)" }}>
            <div className="w-full rounded-t-[24px] bg-white px-5 pt-6 pb-10">
              <div className="flex items-center justify-center mb-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl text-white font-bold text-[26px]" style={{ background: "var(--primary)" }}>
                  🎉
                </div>
              </div>
              <h3 className="font-bold text-foreground text-[18px] tracking-tight mb-1 text-center">
                일기가 만들어졌어요!
              </h3>
              <p className="text-[13px] text-[#aaa] tracking-tight text-center mb-5">
                초대 링크를 복사해서 친구에게 공유해 보세요.
              </p>

              <div className="rounded-2xl bg-[#f4f6fa] px-4 py-3 mb-4">
                <p className="text-[12px] text-[#999] tracking-tight mb-2">초대 링크</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] text-[#555] font-mono truncate flex-1">
                    /exchange?invite={createdDiary.inviteCode}
                  </p>
                  <InviteLinkButton diary={createdDiary} />
                </div>
                <p className="text-[11px] text-[#bbb] mt-2 tracking-tight">
                  비밀번호: <span className="font-semibold text-[#888]">{createdDiary.password}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate({ to: "/exchange/$roomId", params: { roomId: createdDiary.id } })}
                className="w-full rounded-2xl py-3.5 font-bold text-white text-[15px] tracking-tight active:scale-[0.99] transition"
                style={{ background: "var(--primary)" }}
              >
                일기 보러가기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
