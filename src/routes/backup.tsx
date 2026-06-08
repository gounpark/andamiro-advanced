import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, MessageCircle } from "lucide-react";
import { PageShell, PageHeader, BackButton, LoadingScreen } from "@/components";
import {
  getMyDiaries,
  getSharedDiaries,
  getComments,
  relativeTime,
  coverColorForId,
  type ExchangeDiary,
  type ExchangeComment,
} from "@/lib/exchangeStore";

export const Route = createFileRoute("/backup")({
  head: () => ({
    meta: [{ title: "데이터 백업 — 안다미로" }],
  }),
  component: BackupPage,
});

function BackupPage() {
  const navigate = useNavigate();
  const [diaries, setDiaries] = useState<ExchangeDiary[]>([]);
  const [commentMap, setCommentMap] = useState<Record<string, ExchangeComment[]>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      const [mine, shared] = await Promise.all([getMyDiaries(), getSharedDiaries()]);
      const all = [...mine, ...shared];
      setDiaries(all);

      // 댓글 수 로드
      const entries = await Promise.all(
        all.map(async (d) => {
          const comments = await getComments(d.id);
          return [d.id, comments] as [string, ExchangeComment[]];
        })
      );
      setCommentMap(Object.fromEntries(entries));
      setLoading(false);
    })();
  }, []);

  const allSelected = diaries.length > 0 && selected.size === diaries.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(diaries.map((d) => d.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDownload = async () => {
    if (selected.size === 0 || downloading) return;
    setDownloading(true);

    const selectedDiaries = diaries.filter((d) => selected.has(d.id));
    const payload = selectedDiaries.map((d) => ({
      id: d.id,
      title: d.title,
      body: d.body,
      authorName: d.authorName,
      keywords: d.keywords,
      viewerNames: d.viewerNames,
      comments: (commentMap[d.id] ?? []).map((c) => ({
        authorName: c.authorName,
        body: c.body,
        createdAt: c.createdAt,
      })),
      createdAt: d.createdAt,
    }));

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `안다미로_교환일기_백업_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
  };

  if (loading) return <LoadingScreen />;

  return (
    <PageShell>
        <PageHeader
          title="데이터 백업"
          left={<BackButton onClick={() => navigate({ to: "/my" })} />}
          right={
            <button
              type="button"
              onClick={toggleAll}
              disabled={diaries.length === 0}
              className="text-[14px] font-medium text-[#4B82F5] tracking-tight"
            >
              {allSelected ? "해제" : "전체선택"}
            </button>
          }
        />

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto">
          {diaries.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-[14px] text-[#999]">교환 일기가 없어요.</div>
          ) : (
            diaries.map((diary, i) => {
              const isSelected = selected.has(diary.id);
              const comments = commentMap[diary.id] ?? [];
              const isLast = i === diaries.length - 1;

              return (
                <button
                  key={diary.id}
                  type="button"
                  onClick={() => toggleOne(diary.id)}
                  className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-colors ${
                    isSelected ? "bg-[#F0F5FF]" : "bg-white"
                  } ${!isLast ? "border-b border-[#f0f0f0]" : ""}`}
                >
                  {/* 썸네일 — 공유일기 목록과 동일한 방식 */}
                  {diary.imageDataUrl ? (
                    <img
                      src={diary.imageDataUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-white font-bold text-[22px]"
                      style={{ background: coverColorForId(diary.id) }}
                    >
                      {diary.title.charAt(0)}
                    </div>
                  )}

                  {/* 텍스트 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-semibold text-foreground tracking-tight truncate">
                      {diary.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[12px] text-[#999]">
                      <span className="flex items-center gap-[3px]">
                        <Eye className="w-3 h-3" />
                        {diary.viewerIds.length}명이 읽었어요
                      </span>
                      <span>·</span>
                      <span>{relativeTime(diary.createdAt)}</span>
                    </div>
                    {comments.length > 0 && (
                      <div className="flex items-center gap-[3px] mt-0.5 text-[12px] text-[#999]">
                        <MessageCircle className="w-3 h-3" />
                        <span>댓글 {comments.length}개</span>
                      </div>
                    )}
                  </div>

                  {/* 체크박스 */}
                  <div
                    className={`w-6 h-6 rounded-[6px] border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? "bg-[#4B82F5] border-[#4B82F5]"
                        : "border-[#d0d0d0] bg-white"
                    }`}
                  >
                    {isSelected && (
                      <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                        <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* 다운로드 버튼 */}
        <div className="px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={selected.size === 0 || downloading}
            className="w-full h-[54px] rounded-[14px] bg-[#4B82F5] text-white text-[16px] font-semibold tracking-tight transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {downloading ? "다운로드 중..." : "다운로드 하기"}
          </button>
        </div>
    </PageShell>
  );
}
