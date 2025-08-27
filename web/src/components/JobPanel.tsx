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
  const [symbolsText, setSymbolsText] = useState("AAPL\nMSFT");
  const [interval, setInterval] = useState("1d");
  const [start, setStart] = useState("2024-01-01T00:00:00Z");
  const [end, setEnd] = useState(new Date().toISOString());
  const [lookback, setLookback] = useState(7);
  const [runIds, setRunIds] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, JobStatus>>({});

  useEffect(() => {
    if (!runIds.length) return;
    const t: number = window.setInterval(async () => {
      const updates: Record<string, JobStatus> = {};
      for (const id of runIds) {
        const s = await getJob(id);
        updates[id] = s;
      }
      setStatuses((prev) => ({ ...prev, ...updates }));
      const done = runIds.every((id) =>
        ["succeeded", "failed", "not_found"].includes(
          (updates[id] || statuses[id])?.status as string,
        ),
      );
      if (done) window.clearInterval(t);
    }, 1400);
    return () => window.clearInterval(t);
  }, [runIds]);

  return (
    <Card className="p-4 grid md:grid-cols-6 gap-4 items-end">
      <div className="md:col-span-2">
        <Label>Symbols (comma or newline)</Label>
        <textarea
          value={symbolsText}
          onChange={(e) => setSymbolsText(e.target.value)}
          rows={4}
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={"AAPL, MSFT\nGOOGL"}
        />
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
            const symbols = symbolsText
              .split(/[\n,]/)
              .map((s) => s.trim())
              .filter(Boolean);
            const r = await postBackfill({
              symbols,
              interval,
              start,
              end,
              dry_run: false,
            });
            setRunIds(r.run_ids);
          }}
        >
          Backfill
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            const symbols = symbolsText
              .split(/[\n,]/)
              .map((s) => s.trim())
              .filter(Boolean);
            const r = await postIncremental({
              symbols,
              interval,
              lookback_days: lookback,
              dry_run: false,
            });
            setRunIds(r.run_ids);
          }}
        >
          Incremental
        </Button>
      </div>
      {runIds.length > 0 && (
        <div className="md:col-span-6 text-sm">
          <div className="font-medium mb-1">Jobs</div>
          <div className="grid md:grid-cols-2 gap-2">
            {runIds.map((id) => {
              const st = statuses[id];
              return (
                <div key={id} className="rounded border p-2">
                  <div className="truncate">
                    run_id: <code>{id}</code>
                  </div>
                  <div>
                    status: <b>{st?.status ?? "queued"}</b>
                    {st?.rows_processed != null && <> • rows: {st.rows_processed}</>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
