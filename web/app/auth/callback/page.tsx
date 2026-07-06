"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Xử lý quay về sau OAuth. detectSessionInUrl tự set session; fallback exchangeCodeForSession.
export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      router.replace("/dashboard");
    };

    async function finish() {
      const { data } = await supabase.auth.getSession();
      if (data.session) return go();

      const code = new URL(window.location.href).searchParams.get("code");
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (!exErr) return go();
        setError("Đăng nhập thất bại, thử lại.");
      }
    }

    finish().catch(() => setError("Đăng nhập thất bại, thử lại."));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go();
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center text-gray-500">
      {error ? (
        <div className="flex flex-col items-center gap-3">
          <p>{error}</p>
          <Link href="/" className="underline">
            Về trang đăng nhập
          </Link>
        </div>
      ) : (
        <p>Đang đăng nhập…</p>
      )}
    </main>
  );
}
