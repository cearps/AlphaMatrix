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

type Props = {
  onSubmit: (p: {
    symbol: string;
    interval: string;
    start: string;
    end: string;
  }) => void;
  defaults?: Partial<{
    symbol: string;
    interval: string;
    start: string;
    end: string;
  }>;
};

export default function Controls({ onSubmit, defaults }: Props) {
  const [symbol, setSymbol] = useState(defaults?.symbol ?? "AAPL");
  const [interval, setInterval] = useState(defaults?.interval ?? "1d");
  const [start, setStart] = useState(defaults?.start ?? "2024-01-01T00:00:00Z");
  const [end, setEnd] = useState(defaults?.end ?? new Date().toISOString());

  return (
    <Card className="p-4 grid md:grid-cols-5 gap-4 items-end">
      <div>
        <Label>Symbol</Label>
        <Input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="AAPL"
        />
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
      <div className="flex gap-2">
        <Button
          className="w-full"
          onClick={() => onSubmit({ symbol, interval, start, end })}
        >
          Load
        </Button>
      </div>
    </Card>
  );
}
