import { useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import SymbolCombobox from "./SymbolCombobox";

type Props = {
  onSubmit: (p: {
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
  }) => void;
  onDownloadCsv?: () => void;
  defaults?: Partial<{
    symbol: string;
    interval: string;
    start: string;
    end: string;
    aggregateMode: "auto" | "" | "manual";
    aggregate: "none" | "minute" | "hour" | "day";
    smaOn: boolean;
    smaPeriod: number;
    emaOn: boolean;
    emaPeriod: number;
    compareSymbol: string | null;
    rsiOn: boolean;
    rsiPeriod: number;
    garchOn: boolean;
  }>;
};

const presets = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "YTD", ytd: true },
  { label: "1Y", days: 365 },
  { label: "Max", max: true },
];

function ytdRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  return { start: start.toISOString(), end: now.toISOString() };
}

export default function Controls({ onSubmit, onDownloadCsv, defaults }: Props) {
  const [symbol, setSymbol] = useState(defaults?.symbol ?? "AAPL");
  const [interval, setInterval] = useState(defaults?.interval ?? "1d");
  const [start, setStart] = useState(defaults?.start ?? "2024-01-01T00:00:00Z");
  const [end, setEnd] = useState(defaults?.end ?? new Date().toISOString());
  const [aggregateMode, setAggregateMode] = useState<"auto" | "manual">(
    (defaults as any)?.aggregateMode ?? "auto"
  );
  const [aggregate, setAggregate] = useState<
    "none" | "minute" | "hour" | "day"
  >((defaults as any)?.aggregate ?? "none");

  const [smaOn, setSmaOn] = useState((defaults as any)?.smaOn ?? true);
  const [smaPeriod, setSmaPeriod] = useState(
    (defaults as any)?.smaPeriod ?? 20
  );
  const [emaOn, setEmaOn] = useState((defaults as any)?.emaOn ?? false);
  const [emaPeriod, setEmaPeriod] = useState(
    (defaults as any)?.emaPeriod ?? 50
  );
  const [compareSymbol, setCompareSymbol] = useState<string | null>(
    (defaults as any)?.compareSymbol ?? null
  );
  const [rsiOn, setRsiOn] = useState((defaults as any)?.rsiOn ?? false);
  const [rsiPeriod, setRsiPeriod] = useState(
    (defaults as any)?.rsiPeriod ?? 14
  );
  const [garchOn, setGarchOn] = useState((defaults as any)?.garchOn ?? false);

  const submit = () =>
    onSubmit({
      symbol,
      interval,
      start,
      end,
      aggregateMode,
      aggregate,
      smaOn,
      smaPeriod,
      emaOn,
      emaPeriod,
      compareSymbol,
      rsiOn,
      rsiPeriod,
      garchOn,
    });

  return (
    <Card className="p-4 space-y-4">
      <div className="grid lg:grid-cols-6 gap-4 items-end">
        <div>
          <Label>Symbol</Label>
          <SymbolCombobox value={symbol} onChange={setSymbol} />
        </div>
        <div>
          <Label>Interval</Label>
          <Select value={interval} onValueChange={setInterval}>
            <SelectTrigger>
              <SelectValue placeholder="Interval" />
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
          <Label>Start (ISO)</Label>
          <Input value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <Label>End (ISO)</Label>
          <Input value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="flex-1 min-w-[120px]" onClick={submit}>
            Load
          </Button>
          <Button
            className="shrink-0"
            variant="secondary"
            type="button"
            onClick={onDownloadCsv}
          >
            Download CSV
          </Button>
        </div>
        <div className="min-w-[220px]">
          <Label>Compare</Label>
          <SymbolCombobox
            value={compareSymbol ?? ""}
            onChange={(v) => setCompareSymbol(v)}
            placeholder="(optional)"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <Button
            key={p.label}
            variant="outline"
            size="sm"
            onClick={() => {
              const now = new Date();
              if (p.ytd) {
                const r = ytdRange();
                setStart(r.start);
                setEnd(r.end);
              } else if (p.max) {
                setStart("1970-01-01T00:00:00Z");
                setEnd(now.toISOString());
              } else if (p.days) {
                const s = new Date(now);
                s.setUTCDate(now.getUTCDate() - p.days);
                setStart(s.toISOString());
                setEnd(now.toISOString());
              }
              setTimeout(submit, 0);
            }}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Label>Aggregation</Label>
        <Tabs
          value={aggregateMode}
          onValueChange={(v) => setAggregateMode(v as any)}
        >
          <TabsList>
            <TabsTrigger value="auto">Auto</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>
        </Tabs>
        {aggregateMode === "manual" && (
          <Select
            value={aggregate}
            onValueChange={(v) => setAggregate(v as any)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["none", "minute", "hour", "day"].map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center gap-2">
          <Switch checked={smaOn} onCheckedChange={setSmaOn} />
          <Label>SMA</Label>
          <Input
            className="w-20"
            type="number"
            value={smaPeriod}
            onChange={(e) => setSmaPeriod(parseInt(e.target.value || "0"))}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={emaOn} onCheckedChange={setEmaOn} />
          <Label>EMA</Label>
          <Input
            className="w-20"
            type="number"
            value={emaPeriod}
            onChange={(e) => setEmaPeriod(parseInt(e.target.value || "0"))}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={rsiOn} onCheckedChange={setRsiOn} />
          <Label>RSI</Label>
          <Input
            className="w-20"
            type="number"
            value={rsiPeriod}
            onChange={(e) => setRsiPeriod(parseInt(e.target.value || "0"))}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={garchOn} onCheckedChange={setGarchOn} />
          <Label>GARCH</Label>
        </div>
      </div>
    </Card>
  );
}
