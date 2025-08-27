import axios from "axios";
import type {
  OhlcvResponse,
  BackfillRequest,
  IncrementalRequest,
  JobStatus,
  BulkJobStatus,
} from "./types";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 20000,
});
API.interceptors.request.use((cfg) => {
  const tok = import.meta.env.VITE_API_TOKEN as string | undefined;
  if (tok) cfg.headers.Authorization = `Bearer ${tok}`;
  return cfg;
});

export async function fetchOhlcv(p: {
  symbol: string;
  interval: string;
  start: string;
  end: string;
  limit?: number;
  aggregate?: "none" | "minute" | "hour" | "day";
}): Promise<OhlcvResponse> {
  const { data } = await API.get("/v1/ohlcv", {
    params: { aggregate: "none", limit: 200000, ...p },
  });
  return data;
}

export async function fetchSymbols(p: { q?: string; limit?: number; interval?: string } = {}) {
  const { data } = await API.get("/v1/symbols", { params: p });
  return data as { symbols: string[] };
}
export async function postBackfill(body: BackfillRequest): Promise<BulkJobStatus> {
  const { data } = await API.post("/v1/etl/backfill", body);
  return data;
}
export async function postIncremental(body: IncrementalRequest): Promise<BulkJobStatus> {
  const { data } = await API.post("/v1/etl/incremental", body);
  return data;
}
export async function getJob(run_id: string): Promise<JobStatus> {
  const { data } = await API.get(`/v1/etl/runs/${run_id}`);
  return data;
}
