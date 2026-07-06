"use client";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import QuizGame from "@/components/QuizGame";

export default function KiemTraDucVietPage() {
  return (
    <AuthGuard>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">Kiểm tra: Đức → Việt</h1>
        <QuizGame direction="de-vi" />
      </main>
    </AuthGuard>
  );
}
