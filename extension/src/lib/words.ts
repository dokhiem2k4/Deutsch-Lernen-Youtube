// Pure — tách câu Đức thành từ click được. GIỮ chữ Đức (ä/ö/ü/ß…), bỏ dấu câu 2 đầu.
// Unit-test được bằng node (không DOM/chrome).

export type Token = { raw: string; clean: string };

// Bỏ ký tự không phải chữ/số ở đầu & cuối; giữ nguyên bên trong (geht's, U-Bahn).
// \p{L} (u flag) bao gồm ä ö ü ß Ä Ö Ü → không mất chữ Đức.
export function cleanWord(raw: string): string {
  return raw.replace(/^[^\p{L}\p{N}]+/u, "").replace(/[^\p{L}\p{N}]+$/u, "");
}

export function tokenize(sentence: string): Token[] {
  if (!sentence) return [];
  return sentence
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((raw) => ({ raw, clean: cleanWord(raw) }));
}
