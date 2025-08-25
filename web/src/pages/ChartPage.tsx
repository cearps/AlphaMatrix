import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Controls from "../components/Controls";
import D3Candles from "../components/D3Candles";
import { fetchOhlcv } from "../lib/api";
import Layout from "../components/Layout";
import { sma, ema, toPctSeries, toCsv, rsi, garchVol } from "../lib/indicators";

type Params = {
  symbol: string;
  interval: string;
  start: string;
  end: string;
  aggregateMode: "auto" | "manual";
  aggregate?: "none" | "minute" | "hour" | "day";
  smaOn: boolean;
  smaPeriod: number;
  emaOn: boolean;
  emaPeriod: number;
  compareSymbol?: string | null;
  rsiOn?: boolean;
  rsiPeriod?: number;
  garchOn?: boolean;
};

function recommendAggregate(
  interval: string,
  startISO: string,
  endISO: string
): "none" | "minute" | "hour" | "day" {
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  const spanDays = Math.max(
    1,
    Math.round((end - start) / (1000 * 60 * 60 * 24))
  );
  if (["1m", "5m", "15m", "30m"].includes(interval)) {
    if (spanDays <= 3) return "none";
    if (spanDays <= 30) return "minute";
    if (spanDays <= 180) return "hour";
    return "day";
  }
  if (interval === "1h") {
    if (spanDays <= 30) return "none";
    if (spanDays <= 180) return "hour";
    return "day";
  }
  return spanDays <= 5500 ? "none" : "day";
}

export default function ChartPage() {
  const [params, setParams] = useState<Params>({
    symbol: "AAPL",
    interval: "1d",
    start: "2024-01-01T00:00:00Z",
    end: new Date().toISOString(),
    aggregateMode: "auto",
    aggregate: "none",
    smaOn: true,
    smaPeriod: 20,
    emaOn: false,
    emaPeriod: 50,
    compareSymbol: null,
    rsiOn: false,
    rsiPeriod: 14,
    garchOn: false,
  });

  const aggregate = useMemo(() => {
    return params.aggregateMode === "manual"
      ? params.aggregate ?? "none"
      : recommendAggregate(params.interval, params.start, params.end);
  }, [params]);

  const baseQ = useQuery({
    queryKey: [
      "ohlcv",
      params.symbol,
      params.interval,
      params.start,
      params.end,
      aggregate,
    ],
    queryFn: () =>
      fetchOhlcv({
        symbol: params.symbol,
        interval: params.interval,
        start: params.start,
        end: params.end,
        limit: 200000,
        aggregate,
      }),
  });

  const compQ = useQuery({
    enabled: !!params.compareSymbol,
    queryKey: [
      "ohlcv-compare",
      params.compareSymbol,
      params.interval,
      params.start,
      params.end,
      aggregate,
    ],
    queryFn: () =>
      fetchOhlcv({
        symbol: params.compareSymbol!,
        interval: params.interval,
        start: params.start,
        end: params.end,
        limit: 200000,
        aggregate,
      }),
  });

  const maSMA = useMemo(() => {
    if (!params.smaOn || !baseQ.data) return [] as { t: Date; v: number }[];
    return sma(baseQ.data.data as any, Math.max(2, params.smaPeriod));
  }, [params.smaOn, params.smaPeriod, baseQ.data]);

  const maEMA = useMemo(() => {
    if (!params.emaOn || !baseQ.data) return [] as { t: Date; v: number }[];
    return ema(baseQ.data.data as any, Math.max(2, params.emaPeriod));
  }, [params.emaOn, params.emaPeriod, baseQ.data]);

  const comparePct = useMemo(() => {
    if (!params.compareSymbol || !baseQ.data || !compQ.data)
      return [] as { t: Date; v: number }[];
    return toPctSeries(baseQ.data.data as any, compQ.data.data as any);
  }, [params.compareSymbol, baseQ.data, compQ.data]);

  const rsiSeries = useMemo(() => {
    if (!params.rsiOn || !baseQ.data) return [] as { t: Date; v: number }[];
    return rsi(baseQ.data.data as any, Math.max(2, params.rsiPeriod ?? 14));
  }, [params.rsiOn, params.rsiPeriod, baseQ.data]);

  const garchSeries = useMemo(() => {
    if (!params.garchOn || !baseQ.data) return [] as { t: Date; v: number }[];
    return garchVol(baseQ.data.data as any);
  }, [params.garchOn, baseQ.data]);

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
        const same =
          Math.abs(prevStart - nextStart) < 1 &&
          Math.abs(prevEnd - nextEnd) < 1;
        if (same) return prev;
        return { ...prev, start: startISO, end: endISO };
      });
    }, 300);
  }, []);

  const onDownloadCsv = useCallback(() => {
    if (!baseQ.data) return;
    const csv = toCsv(baseQ.data.data as any);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${params.symbol}_${params.interval}_${
      params.start.split("T")[0]
    }_${params.end.split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [baseQ.data, params]);

  return (
    <Layout>
      <Controls
        onSubmit={setParams}
        onDownloadCsv={onDownloadCsv}
        defaults={params}
      />
      {baseQ.isLoading && <div>Loading…</div>}
      {baseQ.error && <div className="text-red-600">Error loading data</div>}
      {baseQ.data && baseQ.data.rows > 0 && (
        <D3Candles
          data={baseQ.data.data as any}
          height={560}
          onRangeChange={onRangeChange}
          maSMA={maSMA}
          maEMA={maEMA}
          comparePct={comparePct}
          rsi={rsiSeries}
          garchVol={garchSeries}
        />
      )}
    </Layout>
  );
}
