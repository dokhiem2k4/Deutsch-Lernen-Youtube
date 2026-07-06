"use client";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function Home() {
  const { user, loading } = useUser();

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${APP_URL}/auth/callback` },
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-bold">Deutsch Lernen</h1>
      <p className="text-gray-500">Người Việt học tiếng Đức qua YouTube.</p>
      {loading ? null : user ? (
        <Link
          href="/dashboard"
          className="rounded-lg bg-black px-5 py-2.5 font-medium text-white hover:bg-gray-800"
        >
          Vào học →
        </Link>
      ) : (
        <button
          onClick={signInWithGoogle}
          className="rounded-lg border px-5 py-2.5 font-medium hover:bg-gray-50"
        >
          Đăng nhập với Google
        </button>
      )}
    </main>
  );
}
