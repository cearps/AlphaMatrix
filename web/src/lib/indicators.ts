export type Bar = {
  ts: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export function sma(data: Bar[], period: number): { t: Date; v: number }[] {
  const out: { t: Date; v: number }[] = [];
  let sum = 0;
  const q: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const c = data[i].close;
    sum += c;
    q.push(c);
    if (q.length > period) sum -= q.shift()!;
    if (q.length === period)
      out.push({ t: new Date(data[i].ts), v: sum / period });
  }
  return out;
}

export function ema(data: Bar[], period: number): { t: Date; v: number }[] {
  if (data.length === 0) return [];
  const k = 2 / (period + 1);
  const out: { t: Date; v: number }[] = [];
  let prev = data[0].close;
  out.push({ t: new Date(data[0].ts), v: prev });
  for (let i = 1; i < data.length; i++) {
    const v = data[i].close * k + prev * (1 - k);
    prev = v;
    out.push({ t: new Date(data[i].ts), v });
  }
  return out;
}

export function rsi(data: Bar[], period = 14): { t: Date; v: number }[] {
  if (data.length <= period) return [];
  const out: { t: Date; v: number }[] = [];
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  const firstIdx = period;
  const rs0 = avgLoss === 0 ? 100 : avgGain / avgLoss;
  out.push({ t: new Date(data[firstIdx].ts), v: 100 - 100 / (1 + rs0) });
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const val = 100 - 100 / (1 + rs);
    out.push({ t: new Date(data[i].ts), v: val });
  }
  return out;
}

export function garchVol(
  data: Bar[],
  opts?: { alpha?: number; beta?: number; useLog?: boolean }
): { t: Date; v: number }[] {
  if (data.length < 2) return [];
  const alpha = opts?.alpha ?? 0.05;
  const beta = opts?.beta ?? 0.9;
  const useLog = opts?.useLog ?? true;
  const rets: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const c0 = data[i - 1].close;
    const c1 = data[i].close;
    const r = useLog ? Math.log(c1 / c0) : (c1 - c0) / c0;
    rets.push(r);
  }
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const uncondVar =
    rets.reduce((a, b) => a + (b - mean) * (b - mean), 0) /
    Math.max(1, rets.length - 1);
  const omega = Math.max(1e-10, uncondVar * (1 - alpha - beta));
  let prevVar = uncondVar;
  const out: { t: Date; v: number }[] = [];
  for (let i = 1; i < data.length; i++) {
    const e2 = rets[i - 1] * rets[i - 1];
    const v = omega + alpha * e2 + beta * prevVar;
    prevVar = v;
    out.push({ t: new Date(data[i].ts), v: Math.sqrt(v) * 100 }); // % volatility
  }
  return out;
}

export function toPctSeries(
  base: Bar[],
  comp: Bar[]
): { t: Date; v: number }[] {
  if (!base.length || !comp.length) return [];
  const baseMap = new Map(
    base.map((b) => [new Date(b.ts).getTime(), b] as const)
  );
  const compSorted = comp
    .map((c) => ({ t: new Date(c.ts), c }))
    .filter((x) => baseMap.has(x.t.getTime()));
  if (!compSorted.length) return [];
  const b0 = base[0].close;
  const c0 = compSorted[0].c.close;
  return compSorted.map(({ t, c }) => ({
    t,
    v: (c.close / c0 / (baseMap.get(t.getTime())!.close / b0) - 1) * 100,
  }));
}

export function toCsv(data: Bar[]): string {
  const header = "ts,open,high,low,close,volume";
  const rows = data.map((d) =>
    [d.ts, d.open, d.high, d.low, d.close, d.volume].join(",")
  );
  return [header, ...rows].join("\n");
}
