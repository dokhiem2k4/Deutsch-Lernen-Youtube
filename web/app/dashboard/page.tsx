"use client";
import { useEffect, useState, type ReactNode } from "react";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { apiFetch } from "@/lib/apiClient";

type ChartPoint = { date: string; count: number };
type Dashboard = {
  total_learned: number;
  total_words: number;
  streak: number;
  today_active: boolean;
  chart: ChartPoint[];
};

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-3xl font-bold">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </Card>
  );
}

function Chart({ data }: { data: ChartPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <Card>
      <p className="mb-3 text-sm font-medium text-gray-700">Từ đã học 30 ngày qua</p>
      <div className="flex h-40 items-end gap-1">
        {data.map((d) => (
          <div
            key={d.date}
            className="flex flex-1 flex-col items-center justify-end"
            title={`${d.date}: ${d.count} từ`}
          >
            <div
              className="w-full rounded-t bg-gray-800/80"
              style={{
                height: `${(d.count / max) * 100}%`,
                minHeight: d.count > 0 ? "4px" : "0",
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-400">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let on = true;
    apiFetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => on && setData(d))
      .catch(() => on && setError(true));
    return () => {
      on = false;
    };
  }, []);

  return (
    <AuthGuard>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">Tiến độ học tập</h1>
        {error ? (
          <p className="text-center text-gray-500">Không tải được tiến độ. Thử lại sau.</p>
        ) : !data ? (
          <Spinner />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Stat
                label="Chuỗi ngày"
                value={`${data.streak} 🔥`}
                sub={data.today_active ? "Hôm nay đã học" : "Hôm nay chưa học"}
              />
              <Stat
                label="Đã học"
                value={data.total_learned}
                sub={`trên ${data.total_words} từ`}
              />
              <Stat label="Tổng từ" value={data.total_words} />
            </div>
            <Chart data={data.chart ?? []} />
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
