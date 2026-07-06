"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { apiFetch } from "@/lib/apiClient";
import { articleColor, type Vocab } from "@/lib/article";

type Direction = "de-vi" | "vi-de";
type Question = { prompt: Vocab; options: Vocab[]; answerId: string };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function germanLabel(v: Vocab) {
  return [v.article, v.word].filter(Boolean).join(" ");
}

// Text sẽ hiển thị trên nút đáp án theo chiều quiz.
function displayText(v: Vocab, direction: Direction) {
  return direction === "de-vi" ? v.meaning_vi ?? "" : germanLabel(v);
}

// Mỗi câu: 1 đáp án đúng + tối đa 3 distractor random từ chính vocab user (không AI).
// Distractor dedup theo TEXT HIỂN THỊ (không theo id) → tránh 2 nút trùng chữ khi có từ đồng nghĩa
// (vd "sehen"/"schauen" đều = "nhìn"): chỉ 1 đáp án đúng, các nút text unique.
function buildQuiz(pool: Vocab[], direction: Direction): Question[] {
  return shuffle(pool).map((prompt) => {
    const answerText = displayText(prompt, direction);
    const seen = new Set([answerText]);
    const distractors: Vocab[] = [];
    for (const v of shuffle(pool)) {
      if (distractors.length >= 3) break;
      const t = displayText(v, direction);
      if (v.id === prompt.id || seen.has(t)) continue;
      seen.add(t);
      distractors.push(v);
    }
    return {
      prompt,
      options: shuffle([prompt, ...distractors]),
      answerId: prompt.id,
    };
  });
}

export default function QuizGame({ direction }: { direction: Direction }) {
  const [pool, setPool] = useState<Vocab[] | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState(false);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    let on = true;
    apiFetch("/api/vocabulary")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Vocab[]) => {
        if (!on) return;
        // Cần word + meaning_vi để tạo đề 2 chiều.
        const valid = (Array.isArray(d) ? d : []).filter((v) => v.word && v.meaning_vi);
        setPool(valid);
        if (valid.length >= 4) setQuestions(buildQuiz(valid, direction));
      })
      .catch(() => on && setError(true));
    return () => {
      on = false;
    };
  }, [direction]);

  if (error)
    return <p className="text-center text-gray-500">Không tải được từ vựng.</p>;
  if (pool === null) return <Spinner />;
  if (pool.length < 4)
    return (
      <Card className="text-center text-gray-600">
        <p className="font-medium">
          Cần ít nhất 4 từ (có nghĩa) để làm bài kiểm tra.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Hiện có {pool.length} từ. Lưu thêm từ khi xem YouTube.
        </p>
        <Link href="/tu-vung" className="mt-2 inline-block text-sm underline">
          Về Từ vựng
        </Link>
      </Card>
    );

  if (i >= questions.length)
    return (
      <Card className="flex flex-col items-center gap-3 text-center">
        <p className="text-lg font-semibold">Hoàn thành!</p>
        <p className="text-3xl font-bold">
          {score} / {questions.length}
        </p>
        <Button
          onClick={() => {
            setQuestions(buildQuiz(pool, direction));
            setI(0);
            setPicked(null);
            setScore(0);
          }}
        >
          Làm lại
        </Button>
      </Card>
    );

  const q = questions[i];
  const optionText = (v: Vocab) =>
    direction === "de-vi" ? v.meaning_vi : germanLabel(v);

  function choose(id: string) {
    if (picked) return;
    setPicked(id);
    if (id === q.answerId) setScore((s) => s + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          Câu {i + 1} / {questions.length}
        </span>
        <span>Điểm: {score}</span>
      </div>

      <Card className="text-center">
        <p className="text-xs uppercase tracking-wide text-gray-400">
          {direction === "de-vi" ? "Nghĩa tiếng Việt của" : "Từ tiếng Đức của"}
        </p>
        <p className="mt-1 text-2xl font-bold">
          {direction === "de-vi" ? (
            <>
              {q.prompt.article && (
                <span
                  className={`mr-2 rounded-md border px-1.5 py-0.5 align-middle text-base ${articleColor(
                    q.prompt.article
                  )}`}
                >
                  {q.prompt.article}
                </span>
              )}
              {q.prompt.word}
            </>
          ) : (
            q.prompt.meaning_vi
          )}
        </p>
      </Card>

      <div className="grid gap-2 sm:grid-cols-2">
        {q.options.map((opt) => {
          const isAnswer = opt.id === q.answerId;
          const isPicked = opt.id === picked;
          let cls = "border-gray-300 hover:bg-gray-50";
          if (picked) {
            if (isAnswer) cls = "border-green-400 bg-green-50 text-green-800";
            else if (isPicked) cls = "border-red-300 bg-red-50 text-red-700";
            else cls = "border-gray-200 text-gray-400";
          }
          return (
            <button
              key={opt.id}
              disabled={!!picked}
              onClick={() => choose(opt.id)}
              className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${cls}`}
            >
              {optionText(opt)}
            </button>
          );
        })}
      </div>

      {picked && (
        <div className="flex justify-end">
          <Button onClick={() => { setPicked(null); setI((n) => n + 1); }}>
            {i + 1 === questions.length ? "Xem kết quả" : "Câu tiếp →"}
          </Button>
        </div>
      )}
    </div>
  );
}
