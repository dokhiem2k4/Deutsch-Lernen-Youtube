"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/Button";

const NAV = [
  { href: "/dashboard", label: "Tiến độ" },
  { href: "/tu-vung", label: "Từ vựng" },
  { href: "/hoc-tu-vung", label: "Học" },
  { href: "/kiem-tra-duc-viet", label: "Kiểm tra" },
];

export default function Header() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <nav className="flex items-center gap-1">
          <Link href="/dashboard" className="mr-2 font-bold">
            Deutsch Lernen
          </Link>
          {NAV.map((n) => {
            const active =
              pathname === n.href ||
              (n.href === "/kiem-tra-duc-viet" && pathname.startsWith("/kiem-tra"));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  active
                    ? "bg-gray-100 font-medium text-black"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-gray-500 sm:inline">{user?.email}</span>
          <Button variant="outline" onClick={() => supabase.auth.signOut()}>
            Đăng xuất
          </Button>
        </div>
      </div>
    </header>
  );
}
