import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Controls from "../components/Controls";
import D3Candles from "../components/D3Candles";
import { fetchOhlcv } from "../lib/api";
import Layout from "../components/Layout";

export default function ChartPage() {
  const [params, setParams] = useState({
    symbol: "AAPL",
    interval: "1d",
    start: "2024-01-01T00:00:00Z",
    end: new Date().toISOString(),
  });
  const q = useQuery({
    queryKey: ["ohlcv", params],
    queryFn: () => fetchOhlcv({ ...params, limit: 200000, aggregate: "none" }),
  });

  return (
    <Layout>
      <Controls onSubmit={setParams} defaults={params} />
      {q.isLoading && <div>Loading…</div>}
      {q.error && <div className="text-red-600">Error loading data</div>}
      {q.data && q.data.rows > 0 && <D3Candles data={q.data.data} />}
    </Layout>
  );
}
