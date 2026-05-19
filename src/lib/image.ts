// 이미지 압축 유틸 — Supabase에 base64로 저장하기 위한 사이즈 축소

export interface CompressOptions {
  maxEdge?: number;
  quality?: number;
  maxBytes?: number;
}

// 400px: 썸네일 + 상세 모두 쾌적, JPEG 약 20~40KB
const DEFAULT_MAX_EDGE = 400;
const DEFAULT_QUALITY = 0.75;
const DEFAULT_MAX_BYTES = 300_000;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지 로드 실패"));
    img.src = src;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("파일 읽기 실패"));
    reader.readAsDataURL(file);
  });
}

function approxBytesOfDataUrl(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(",");
  const b64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  return Math.floor(b64.length * 0.75);
}

export async function compressImageToDataUrl(
  file: File,
  opts: CompressOptions = {},
): Promise<string> {
  const maxEdge = opts.maxEdge ?? DEFAULT_MAX_EDGE;
  const quality = opts.quality ?? DEFAULT_QUALITY;
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;

  const srcDataUrl = await fileToDataUrl(file);
  const img = await loadImage(srcDataUrl);

  const ratio = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const targetW = Math.max(1, Math.round(img.width * ratio));
  const targetH = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D 컨텍스트 생성 실패");
  // PNG 투명 배경 → 흰색으로 채워야 JPEG 변환 시 색 왜곡 없음
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  let out = canvas.toDataURL("image/jpeg", quality);
  if (approxBytesOfDataUrl(out) > maxBytes) {
    out = canvas.toDataURL("image/jpeg", 0.55);
  }
  if (approxBytesOfDataUrl(out) > maxBytes) {
    throw new Error("이미지가 너무 커요. 더 작은 이미지를 선택해 주세요.");
  }
  return out;
}
