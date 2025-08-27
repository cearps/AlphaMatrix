import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Controls from "../components/Controls";
import CandleChart from "../components/charts/CandleChart";
import { fetchOhlcv } from "../lib/api";
import Layout from "../components/Layout";
import type { OhlcvResponse } from "../lib/types";

type Params = { symbol: string; interval: string; start: string; end: string };

export default function ChartPage() {
  const initial = useMemo(() => {
    try {
      const saved = localStorage.getItem("chart_params");
      if (saved) return JSON.parse(saved);
    } catch {
      void 0;
    }
    return {
      symbol: "AAPL",
      interval: "1d",
      start: "2024-01-01T00:00:00Z",
      end: new Date().toISOString(),
    };
  }, []);
  const [params, setParams] = useState<Params>(initial);
  useEffect(() => {
    try {
      localStorage.setItem("chart_params", JSON.stringify(params));
    } catch {
      void 0;
    }
  }, [params]);
  const q = useQuery<OhlcvResponse>({
    queryKey: ["ohlcv", params],
    queryFn: () =>
      fetchOhlcv({
        symbol: params.symbol,
        interval: params.interval,
        start: params.start,
        end: params.end,
        limit: 200000,
        aggregate: "none",
      }),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    // If you want to keep the previous series during refetch, use placeholderData
    // placeholderData: (prev) => prev,
  });
  const onRangeChange = useCallback((startISO: string, endISO: string) => {
    // Debounce updates to avoid hammering the API during interactive changes
    let t = (onRangeChange as any)._t as number | undefined;
    if (t) window.clearTimeout(t);
    (onRangeChange as any)._t = window.setTimeout(() => {
      setParams((prev) => {
        const prevStart = new Date(prev.start).getTime();
        const prevEnd = new Date(prev.end).getTime();
        const nextStart = new Date(startISO).getTime();
        const nextEnd = new Date(endISO).getTime();
        const same = Math.abs(prevStart - nextStart) < 1 && Math.abs(prevEnd - nextEnd) < 1;
        if (same) return prev;
        return { ...prev, start: startISO, end: endISO };
      });
    }, 300);
  }, []);

  return (
    <Layout>
      <Controls onSubmit={setParams} defaults={params} />
      {q.isLoading && (
        <div className="mt-4 rounded-md border border-border bg-card p-4 text-sm">Loading…</div>
      )}
      {q.error && (
        <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-4 text-red-700 text-sm">
          Error loading data
        </div>
      )}
      {q.data && q.data.rows > 0 && (
        <CandleChart data={q.data.data} height={560} onRangeChange={onRangeChange} />
      )}
    </Layout>
  );
}
