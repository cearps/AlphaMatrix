import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { postBackfill, postIncremental, getJob } from "../lib/api";
import type { JobStatus } from "../lib/types";

export default function JobPanel() {
  const [symbol, setSymbol] = useState("AAPL");
  const [interval, setInterval] = useState("1d");
  const [start, setStart] = useState("2024-01-01T00:00:00Z");
  const [end, setEnd] = useState(new Date().toISOString());
  const [lookback, setLookback] = useState(7);
  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);

  useEffect(() => {
    if (!runId) return;
    const t = setInterval(async () => {
      const s = await getJob(runId);
      setStatus(s);
      if (["succeeded", "failed", "not_found"].includes(s.status))
        clearInterval(t);
    }, 1200);
    return () => clearInterval(t);
  }, [runId]);

  return (
    <Card className="p-4 grid md:grid-cols-6 gap-4 items-end">
      <div>
        <Label>Symbol</Label>
        <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} />
      </div>
      <div>
        <Label>Interval</Label>
        <Select value={interval} onValueChange={setInterval}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["1m", "5m", "15m", "30m", "1h", "1d", "1wk", "1mo"].map((i) => (
              <SelectItem key={i} value={i}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Start</Label>
        <Input value={start} onChange={(e) => setStart(e.target.value)} />
      </div>
      <div>
        <Label>End</Label>
        <Input value={end} onChange={(e) => setEnd(e.target.value)} />
      </div>
      <div>
        <Label>Lookback (days)</Label>
        <Input
          type="number"
          value={lookback}
          onChange={(e) => setLookback(parseInt(e.target.value || "0"))}
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={async () => {
            const r = await postBackfill({
              symbol,
              interval,
              start,
              end,
              dry_run: false,
            });
            setRunId(r.run_id);
            setStatus(r);
          }}
        >
          Backfill
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            const r = await postIncremental({
              symbol,
              interval,
              lookback_days: lookback,
              dry_run: false,
            });
            setRunId(r.run_id);
            setStatus(r);
          }}
        >
          Incremental
        </Button>
      </div>
      {runId && (
        <div className="md:col-span-6 text-sm">
          run_id: <code>{runId}</code>
        </div>
      )}
      {status && (
        <div className="md:col-span-6 text-sm">
          status: <b>{status.status}</b>
          {status.rows_processed != null && (
            <> • rows: {status.rows_processed}</>
          )}
        </div>
      )}
    </Card>
  );
}
