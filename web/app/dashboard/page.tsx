"use client";
import AuthGuard from "@/components/AuthGuard";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";

// Placeholder tối thiểu để callback không 404 + minh hoạ AuthGuard. Nội dung thật ở F05.
export default function DashboardPage() {
  const { user } = useUser();
  return (
    <AuthGuard>
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Đăng nhập: {user?.email}</p>
        <p className="text-sm text-gray-400">(Nội dung thật sẽ làm ở F05)</p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-lg border px-4 py-2 hover:bg-gray-50"
        >
          Đăng xuất
        </button>
      </main>
    </AuthGuard>
  );
}
