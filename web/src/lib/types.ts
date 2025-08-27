export type Bar = {
  ts: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
export type ChartMargins = { top: number; right: number; bottom: number; left: number };
export type OhlcvResponse = {
  symbol: string;
  interval: string;
  rows: number;
  data: Bar[];
};
export type BackfillRequest = {
  symbol?: string;
  symbols?: string[];
  interval: string;
  start: string;
  end: string;
  exchange?: string;
  dry_run?: boolean;
};
export type IncrementalRequest = {
  symbol?: string;
  symbols?: string[];
  interval: string;
  lookback_days: number;
  exchange?: string;
  dry_run?: boolean;
};
export type JobStatus = {
  run_id: string;
  status: "queued" | "running" | "succeeded" | "failed" | "not_found";
  detail?: string;
  rows_processed?: number;
};
export type BulkJobStatus = { run_ids: string[]; status: "queued" };
