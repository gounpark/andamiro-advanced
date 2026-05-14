import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, Lock, X, ImagePlus, Share2, Check } from "lucide-react";
import {
  createDiary,
  getMyName,
  setMyName,
  type ExchangeDiary,
} from "@/lib/exchangeStore";

export const Route = createFileRoute("/exchange/create")({
  head: () => ({
    meta: [
      { title: "교환일기 만들기 — 안다미로" },
      { name: "theme-color", content: "#ffffff" },
    ],
  }),
  component: ExchangeCreatePage,
});

interface DraftData {
  title?: string;
  body?: string;
  keywords?: string[];
}

function ExchangeCreatePage() {
  const navigate = useNavigate();
  const isComposingRef = useRef(false);

  // AI 초안 읽기 (SSR 안전: useEffect 내에서만)
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [kwInput, setKwInput] = useState("");
  const [password, setPassword] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [error, setError] = useState("");

  // 확인 팝업
  const [showConfirm, setShowConfirm] = useState(false);
  // 공유 완료 후 다이어리 (공유 팝업용)
  const [createdDiary, setCreatedDiary] = useState<ExchangeDiary | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 이름 불러오기
    const name = getMyName();
    if (name) setAuthorName(name);

    // sessionStorage에서 AI 초안 읽기
    try {
      const raw = sessionStorage.getItem("exchange_draft");
      if (raw) {
        const draft: DraftData = JSON.parse(raw);
        if (draft.title) setTitle(draft.title);
        if (draft.body) setBody(draft.body);
        if (draft.keywords?.length) setKeywords(draft.keywords);
        sessionStorage.removeItem("exchange_draft");
      }
    } catch {
      // 무시
    }
  }, []);

  // ── 이미지 선택 ──────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── 키워드 ───────────────────────────────────────────────────────────────
  const addKeyword = () => {
    const kw = kwInput.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
    }
    setKwInput("");
  };

  // ── 유효성 검사 → 확인 팝업 표시 ─────────────────────────────────────────
  const handleSubmitAttempt = () => {
    if (!title.trim()) { setError("제목을 입력해 주세요."); return; }
    if (!body.trim()) { setError("일기 내용을 입력해 주세요."); return; }
    if (!password.trim()) { setError("비밀번호를 입력해 주세요."); return; }
    setError("");
    setShowConfirm(true);
  };

  // ── 실제 생성 ─────────────────────────────────────────────────────────────
  const handleCreate = () => {
    if (authorName.trim()) setMyName(authorName.trim());
    const diary = createDiary({
      title: title.trim(),
      body: body.trim(),
      password: password.trim(),
      keywords,
      imageDataUrl,
    });
    setShowConfirm(false);
    setCreatedDiary(diary);
  };

  // ── 공유 ─────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!createdDiary) return;
    const url = `${window.location.origin}/exchange?invite=${createdDiary.inviteCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: createdDiary.title, url });
        return;
      } catch {
        // 취소 또는 미지원 → 클립보드 복사로 폴백
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      prompt("아래 링크를 복사해 주세요:", url);
    }
  };

  const handleDone = () => {
    navigate({ to: "/exchange", search: {} });
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

          <div className="px-4 pb-32 pt-5 flex flex-col gap-5">
            {/* 이미지 첨부 */}
            <div>
              <p className="text-[13px] font-medium text-[#666] tracking-tight mb-2">
                사진 첨부 <span className="text-[#bbb] font-normal">(선택)</span>
              </p>
              {imageDataUrl ? (
                <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <img src={imageDataUrl} alt="첨부 이미지" className="w-full h-full object-cover" />
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

            {/* 작성자 이름 */}
            <label className="block">
              <span className="text-[13px] font-medium text-[#666] tracking-tight mb-1.5 block">
                작성자 이름
              </span>
              <input
                type="text"
                placeholder="이름을 입력해 주세요"
                value={authorName}
                onChange={(e) => { if (!isComposingRef.current) setAuthorName(e.target.value); }}
                onCompositionStart={() => { isComposingRef.current = true; }}
                onCompositionEnd={(e) => { isComposingRef.current = false; setAuthorName(e.currentTarget.value); }}
                className="w-full rounded-xl bg-[#f4f6fa] px-4 py-3 text-base text-foreground placeholder:text-[#bbb] outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              />
            </label>

            {/* 제목 */}
            <label className="block">
              <span className="text-[13px] font-medium text-[#666] tracking-tight mb-1.5 block">
                제목
              </span>
              <input
                type="text"
                placeholder="일기 제목을 입력해 주세요"
                value={title}
                onChange={(e) => { if (!isComposingRef.current) { setTitle(e.target.value); setError(""); } }}
                onCompositionStart={() => { isComposingRef.current = true; }}
                onCompositionEnd={(e) => { isComposingRef.current = false; setTitle(e.currentTarget.value); setError(""); }}
                className="w-full rounded-xl bg-[#f4f6fa] px-4 py-3 text-base text-foreground placeholder:text-[#bbb] outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              />
            </label>

            {/* 본문 */}
            <label className="block">
              <span className="text-[13px] font-medium text-[#666] tracking-tight mb-1.5 block">
                내용
              </span>
              <textarea
                placeholder="일기 내용을 입력해 주세요"
                value={body}
                rows={8}
                onChange={(e) => { if (!isComposingRef.current) { setBody(e.target.value); setError(""); } }}
                onCompositionStart={() => { isComposingRef.current = true; }}
                onCompositionEnd={(e) => { isComposingRef.current = false; setBody(e.currentTarget.value); setError(""); }}
                className="w-full rounded-xl bg-[#f4f6fa] px-4 py-3 text-base text-foreground placeholder:text-[#bbb] outline-none focus:ring-2 focus:ring-[var(--primary)]/30 resize-none"
              />
            </label>

            {/* 키워드 */}
            <div>
              <span className="text-[13px] font-medium text-[#666] tracking-tight mb-1.5 block">
                키워드 <span className="text-[#bbb] font-normal">(선택)</span>
              </span>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {keywords.map((kw) => (
                    <span
                      key={kw}
                      className="flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[12px] font-medium text-[var(--primary)]"
                    >
                      #{kw}
                      <button
                        type="button"
                        onClick={() => setKeywords(keywords.filter((k) => k !== kw))}
                        className="ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="키워드 입력 후 추가"
                  value={kwInput}
                  onChange={(e) => { if (!isComposingRef.current) setKwInput(e.target.value); }}
                  onCompositionStart={() => { isComposingRef.current = true; }}
                  onCompositionEnd={(e) => { isComposingRef.current = false; setKwInput(e.currentTarget.value); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      addKeyword();
                    }
                  }}
                  className="flex-1 rounded-xl bg-[#f4f6fa] px-4 py-2.5 text-[14px] text-foreground placeholder:text-[#bbb] outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  className="rounded-xl bg-[var(--primary)]/10 px-4 py-2.5 text-[13px] font-semibold text-[var(--primary)]"
                >
                  추가
                </button>
              </div>
            </div>

            {/* 비밀번호 */}
            <label className="block">
              <span className="text-[13px] font-medium text-[#666] tracking-tight mb-1.5 block">
                비밀번호
              </span>
              <div className="flex items-center gap-2 rounded-xl bg-[#f4f6fa] px-4 py-3">
                <Lock className="h-4 w-4 text-[#aaa] shrink-0" />
                <input
                  type="text"
                  placeholder="초대받은 사람이 입력할 비밀번호"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="flex-1 bg-transparent text-base text-foreground placeholder:text-[#bbb] outline-none"
                />
              </div>
            </label>

            {error && (
              <p className="text-[12px] text-red-400 -mt-2 tracking-tight">{error}</p>
            )}
          </div>
        </div>

        {/* 하단 고정 버튼 */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#f0f0f0] px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleSubmitAttempt}
            className="w-full rounded-2xl py-3.5 font-bold text-white text-[15px] tracking-tight active:scale-[0.99] transition"
            style={{ background: "var(--primary)" }}
          >
            교환일기 만들기
          </button>
        </div>

        {/* 확인 팝업 */}
        {showConfirm && (
          <div
            className="absolute inset-0 z-50 flex items-end"
            style={{ background: "rgba(0,0,0,0.45)" }}
          >
            <div className="w-full rounded-t-[24px] bg-white px-5 pt-6 pb-10">
              <h3 className="font-bold text-foreground text-[18px] tracking-tight mb-2">
                이 일기를 공유하시겠어요?
              </h3>
              <p className="text-[13px] text-[#999] mb-6 tracking-tight leading-relaxed">
                초대 링크와 비밀번호를 통해 소중한 사람에게<br />
                공유할 수 있어요.
              </p>
              <button
                type="button"
                onClick={handleCreate}
                className="w-full rounded-2xl py-3.5 font-bold text-white text-[15px] tracking-tight active:scale-[0.99] transition mb-2"
                style={{ background: "var(--primary)" }}
              >
                만들기
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="w-full rounded-2xl py-2.5 text-[14px] text-[#999] tracking-tight"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 공유 팝업 */}
        {createdDiary && (
          <div
            className="absolute inset-0 z-50 flex items-end"
            style={{ background: "rgba(0,0,0,0.45)" }}
          >
            <div className="w-full rounded-t-[24px] bg-white px-5 pt-6 pb-10">
              <div className="flex items-center justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-green-100 grid place-items-center">
                  <Check className="h-7 w-7 text-green-500" strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="font-bold text-foreground text-[18px] tracking-tight mb-1 text-center">
                일기가 만들어졌어요!
              </h3>
              <p className="text-[13px] text-[#999] mb-6 tracking-tight text-center">
                초대 링크를 공유해서 소중한 사람을 초대해 보세요.
              </p>

              <div className="rounded-2xl bg-[#f4f6fa] px-4 py-3 mb-4">
                <p className="text-[11px] text-[#aaa] tracking-tight mb-1">비밀번호</p>
                <p className="text-[15px] font-semibold text-foreground tracking-tight">{createdDiary.password}</p>
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="w-full rounded-2xl py-3.5 font-bold text-white text-[15px] tracking-tight active:scale-[0.99] transition mb-2 flex items-center justify-center gap-2"
                style={{ background: "var(--primary)" }}
              >
                {copied ? (
                  <>
                    <Check className="h-5 w-5" strokeWidth={2.5} />
                    링크 복사됨!
                  </>
                ) : (
                  <>
                    <Share2 className="h-5 w-5" strokeWidth={2.5} />
                    초대 링크 공유하기
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDone}
                className="w-full rounded-2xl py-2.5 text-[14px] text-[#999] tracking-tight"
              >
                나중에 공유하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
