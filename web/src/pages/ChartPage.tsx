import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Controls from "../components/Controls";
import D3Candles from "../components/D3Candles";
import { fetchOhlcv } from "../lib/api";
import Layout from "../components/Layout";

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
  const [params, setParams] = useState(initial);
  useEffect(() => {
    try {
      localStorage.setItem("chart_params", JSON.stringify(params));
    } catch {
      void 0;
    }
  }, [params]);
  const q = useQuery({
    queryKey: ["ohlcv", params],
    queryFn: () => fetchOhlcv({ ...params, limit: 200000, aggregate: "none" }),
  });

  return (
    <Layout>
      <Controls onSubmit={setParams} defaults={params} />
      {q.isLoading && (
        <div className="mt-4 rounded-md border border-border bg-card p-4 text-sm">
          Loading…
        </div>
      )}
      {q.error && (
        <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-4 text-red-700 text-sm">
          Error loading data
        </div>
      )}
      {q.data && q.data.rows > 0 && <D3Candles data={q.data.data} />}
    </Layout>
  );
}
