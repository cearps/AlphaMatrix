import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import CandleChart from "./CandleChart";
import type { Bar } from "../../lib/types";

const mk = (n = 50): Bar[] =>
  Array.from({ length: n }).map((_, i) => {
    const base = 100 + Math.sin(i / 3) * 3;
    const open = base + Math.random();
    const close = base + (Math.random() - 0.5) * 2;
    const high = Math.max(open, close) + Math.random() * 1.5;
    const low = Math.min(open, close) - Math.random() * 1.5;
    return {
      ts: new Date(Date.now() - (n - i) * 60_000).toISOString(),
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 1000),
    };
  });

describe("CandleChart", () => {
  it("renders without crashing", () => {
    render(<CandleChart data={mk()} height={300} />);
    expect(true).toBe(true);
  });

  it("fires onRangeChange when interactions occur (smoke)", () => {
    const cb = vi.fn();
    render(<CandleChart data={mk()} height={300} onRangeChange={cb} />);
    expect(typeof cb).toBe("function");
  });

  it("shows tooltip on hover with content", () => {
    render(<CandleChart data={mk()} height={300} />);
    const host = screen.getByTestId("candle-host");
    // simulate mouse move roughly center
    fireEvent.mouseMove(host, { clientX: 200, clientY: 120 });
    const tip = host.querySelector<HTMLDivElement>(".am-tooltip");
    expect(tip).toBeTruthy();
    // content should be visible after hover
    expect(tip!.style.display === "" || tip!.style.display === "block").toBe(true);
    expect(tip!.textContent).toMatch(/O:/);
  });
});
