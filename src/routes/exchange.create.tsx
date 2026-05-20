import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Folder, X, ChevronLeft } from "lucide-react";
import { createDiary } from "@/lib/exchangeStore";
import { compressImageToDataUrl } from "@/lib/image";
import { PageHeader } from "@/components/PageHeader";

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
  const [hasAiDraft, setHasAiDraft] = useState(false);

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
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file);
      setImageDataUrl(compressed);
    } catch (err) {
      console.error("[exchange.create] image compress failed", err);
      const msg = err instanceof Error ? err.message : "이미지 처리에 실패했어요.";
      setError(msg);
    } finally {
      input.value = "";
    }
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
      sessionStorage.setItem("exchange_just_created", diary.id);
      navigate({ to: "/exchange/$roomId", params: { roomId: diary.id }, search: { invite: undefined } });
    } catch (err) {
      console.error("[exchange.create] save failed", err);
      const detail = err instanceof Error ? err.message : "";
      setError(
        detail
          ? `일기 저장 실패: ${detail}`
          : "일기 저장에 실패했어요. 잠시 후 다시 시도해 주세요.",
      );
    }
  };

  return (
    <div className="app-shell">
      <div className="app-frame flex flex-col bg-white">
        <PageHeader
          title="공유일기 만들기"
          left={
            <Link to="/exchange" search={{ invite: undefined }} className="grid h-11 w-11 place-items-center active:opacity-60 transition" aria-label="뒤로가기">
              <ChevronLeft className="h-7 w-7 text-[#222]" strokeWidth={2.2} />
            </Link>
          }
        />

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

      </div>
    </div>
  );
}
