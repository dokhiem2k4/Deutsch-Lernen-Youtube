"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { apiFetch } from "@/lib/apiClient";
import { articleColor, type Vocab } from "@/lib/article";

// Đọc từ Đức qua Web Speech API (de-DE). Lỗi/không hỗ trợ → im lặng.
function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    // trình duyệt không hỗ trợ → bỏ qua
  }
}

function Flashcards({ initial }: { initial: Vocab[] }) {
  const [cards, setCards] = useState<Vocab[]>(initial);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[i];

  async function reveal() {
    if (flipped) return;
    setFlipped(true);
    if (!card.learned_at) {
      const id = card.id;
      // optimistic: đánh dấu đã học ngay
      setCards((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, learned_at: new Date().toISOString() } : c
        )
      );
      try {
        await apiFetch("/api/vocabulary/mark-learned", {
          method: "POST",
          body: JSON.stringify({ ids: [id] }),
        });
      } catch {
        // lỗi mạng → vẫn hiển thị mặt sau, mark-learned idempotent lần sau
      }
    }
  }

  function go(delta: number) {
    const next = i + delta;
    if (next < 0 || next >= cards.length) return;
    setI(next);
    setFlipped(false);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-gray-400">
        {i + 1} / {cards.length}
      </p>
      <Card
        onClick={reveal}
        className="flex min-h-[220px] w-full max-w-md cursor-pointer select-none flex-col items-center justify-center gap-3 text-center"
      >
        {!flipped ? (
          <>
            {card.article && (
              <span
                className={`rounded-md border px-2 py-0.5 text-sm font-medium ${articleColor(
                  card.article
                )}`}
              >
                {card.article}
              </span>
            )}
            <span className="text-3xl font-bold">{card.word}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                speak([card.article, card.word].filter(Boolean).join(" "));
              }}
              className="rounded-full border px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
              aria-label="Phát âm"
            >
              🔊 Nghe
            </button>
            <span className="text-xs text-gray-400">Bấm vào thẻ để xem nghĩa</span>
          </>
        ) : (
          <>
            <span className="text-xl font-semibold text-gray-800">
              {card.meaning_vi || "(chưa có nghĩa)"}
            </span>
            {card.example && (
              <p className="text-sm italic text-gray-400">{card.example}</p>
            )}
            <span className="mt-1 text-xs text-green-600">✓ Đã học</span>
          </>
        )}
      </Card>
      <div className="flex gap-3">
        <Button variant="outline" disabled={i === 0} onClick={() => go(-1)}>
          ← Trước
        </Button>
        <Button
          variant="outline"
          disabled={i === cards.length - 1}
          onClick={() => go(1)}
        >
          Sau →
        </Button>
      </div>
    </div>
  );
}

export default function HocTuVungPage() {
  const [items, setItems] = useState<Vocab[] | null>(null);
  const [error, setError] = useState(false);

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

  return (
    <AuthGuard>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">Học Flashcard</h1>
        {error ? (
          <p className="text-center text-gray-500">Không tải được từ vựng.</p>
        ) : items === null ? (
          <Spinner />
        ) : items.length === 0 ? (
          <Card className="text-center text-gray-500">
            <p>Chưa có từ để học.</p>
            <Link href="/tu-vung" className="mt-2 inline-block text-sm underline">
              Về Từ vựng
            </Link>
          </Card>
        ) : (
          <Flashcards initial={items} />
        )}
      </main>
    </AuthGuard>
  );
}
