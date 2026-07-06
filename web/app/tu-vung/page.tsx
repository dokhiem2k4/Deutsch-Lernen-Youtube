"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { apiFetch } from "@/lib/apiClient";
import { articleColor, type Vocab } from "@/lib/article";

function VocabList() {
  const [items, setItems] = useState<Vocab[] | null>(null);
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    apiFetch("/api/vocabulary")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => on && setItems(Array.isArray(d) ? d : []))
      .catch(() => on && setError(true));
    return () => {
      on = false;
    };
  }, []);

  async function remove(id: string) {
    setDeleting(id);
    try {
      const res = await apiFetch(`/api/vocabulary?id=${id}`, { method: "DELETE" });
      if (res.ok) setItems((prev) => (prev ? prev.filter((v) => v.id !== id) : prev));
    } catch {
      // lỗi mạng → giữ nguyên danh sách, không vỡ UI
    } finally {
      setDeleting(null);
    }
  }

  if (error)
    return <p className="text-center text-gray-500">Không tải được từ vựng. Thử lại sau.</p>;
  if (items === null) return <Spinner />;
  if (items.length === 0)
    return (
      <Card className="text-center text-gray-500">
        <p>Chưa có từ nào.</p>
        <p className="mt-1 text-sm">
          Xem video trên YouTube với extension và bấm vào từ tiếng Đức để lưu.
        </p>
      </Card>
    );

  return (
    <div className="flex flex-col gap-3">
      {items.map((v) => (
        <Card key={v.id} className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {v.article && (
                <span
                  className={`rounded-md border px-1.5 py-0.5 text-xs font-medium ${articleColor(
                    v.article
                  )}`}
                >
                  {v.article}
                </span>
              )}
              <span className="text-lg font-semibold">{v.word}</span>
              <Badge
                className={
                  v.learned_at
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }
              >
                {v.learned_at ? "Đã học" : "Từ mới"}
              </Badge>
            </div>
            {v.meaning_vi && <p className="mt-1 text-gray-700">{v.meaning_vi}</p>}
            {v.example && (
              <p className="mt-1 text-sm italic text-gray-400">{v.example}</p>
            )}
          </div>
          <Button
            variant="danger"
            disabled={deleting === v.id}
            onClick={() => remove(v.id)}
          >
            {deleting === v.id ? "…" : "Xoá"}
          </Button>
        </Card>
      ))}
    </div>
  );
}

export default function TuVungPage() {
  return (
    <AuthGuard>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold">Từ vựng của tôi</h1>
          <div className="flex gap-2">
            <Link
              href="/hoc-tu-vung"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Học Flashcard
            </Link>
            <Link
              href="/kiem-tra-duc-viet"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Kiểm tra
            </Link>
          </div>
        </div>
        <VocabList />
      </main>
    </AuthGuard>
  );
}
