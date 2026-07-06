// Giống danh từ Đức + kiểu dữ liệu vocabulary dùng chung cho các trang F05.

export type Article = "der" | "die" | "das" | null;

export type Vocab = {
  id: string;
  word: string;
  lemma: string | null;
  article: Article;
  meaning_vi: string | null;
  example: string | null;
  learned_at: string | null;
  created_at: string;
};

// Tô màu theo giống: der=xanh dương, die=hồng, das=xanh lá, null=xám.
// Trả class Tailwind cho pill (đi kèm `border`).
export function articleColor(article: Article): string {
  switch (article) {
    case "der":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "die":
      return "bg-pink-100 text-pink-700 border-pink-200";
    case "das":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}
