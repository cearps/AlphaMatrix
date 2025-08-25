import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { Bar } from "../lib/types";

type LV = { t: Date; v: number };
type Props = {
  data: Bar[];
  height?: number;
  onRangeChange?: (startISO: string, endISO: string) => void;
  maSMA?: LV[];
  maEMA?: LV[];
  comparePct?: LV[]; // percentage vs base (e.g., +5.2)
  rsi?: LV[]; // 0..100
  garchVol?: LV[]; // % volatility on right axis
};

export default function D3Candles({
  data,
  height = 560,
  onRangeChange,
  maSMA,
  maEMA,
  comparePct,
  rsi,
  garchVol,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !data?.length) return;
    const el = ref.current;
    el.innerHTML = "";

    const parseT = (d: Bar) => new Date(d.ts);
    const times = data.map(parseT);

    const margin = { top: 16, right: 64, bottom: 120, left: 56 };
    const brushHeight = 60;
    const width = el.clientWidth || 960;
    const chartH = height - margin.top - margin.bottom - brushHeight - 16;

    const svg = d3
      .select(el)
      .append("svg")
      .attr("width", width)
      .attr("height", height);
    const g = svg.append("g");

    const x = d3
      .scaleTime()
      .domain(d3.extent(times) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([d3.min(data, (d) => d.low)!, d3.max(data, (d) => d.high)!])
      .nice()
      .range([margin.top + chartH, margin.top]);

    const yVol = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.volume)!])
      .range([
        margin.top + chartH,
        margin.top + chartH - Math.max(60, chartH * 0.2),
      ]);

    const yRight = d3
      .scaleLinear() // for compare % line
      .domain(
        d3.extent(comparePct ?? [{ v: 0, t: new Date() }], (d) => d.v) as [
          number,
          number
        ]
      )
      .nice()
      .range([margin.top + chartH, margin.top]);

    const rsiHeight = 40; // extra panel for RSI at bottom
    const yRSI = d3
      .scaleLinear()
      .domain([0, 100])
      .range([margin.top + chartH + 16 + rsiHeight, margin.top + chartH + 16]);

    const xAxis = (g: any, scale: any) =>
      g.attr("transform", `translate(0,${margin.top + chartH})`).call(
        d3
          .axisBottom(scale)
          .ticks(8)
          .tickFormat(d3.timeFormat("%Y-%m-%d") as any)
      );

    const yAxisLeft = (g: any) =>
      g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(6))
        .call((g: any) => g.select(".domain").remove());

    const yAxisRight = (g: any) =>
      g
        .attr("transform", `translate(${width - margin.right},0)`)
        .call(
          d3
            .axisRight(yRight)
            .ticks(5)
            .tickFormat((d: any) => `${d}%`)
        )
        .call((g: any) => g.select(".domain").remove());

    const gx = svg.append("g");
    gx.call(xAxis, x);
    svg.append("g").call(yAxisLeft);
    if (comparePct && comparePct.length) svg.append("g").call(yAxisRight);
    if (rsi && rsi.length) {
      svg
        .append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yRSI).ticks(3))
        .call((g: any) => g.select(".domain").remove());
      svg
        .append("g")
        .attr(
          "transform",
          `translate(0,${margin.top + chartH + 16 + rsiHeight})`
        )
        .call(
          d3
            .axisBottom(x)
            .ticks(8)
            .tickFormat(d3.timeFormat("%Y-%m-%d") as any)
        );
    }

    const first = times[0].getTime();
    const last = times[times.length - 1].getTime();
    const avgGap = Math.max(
      1,
      Math.round((last - first) / Math.max(1, times.length - 1))
    );
    const candleWidth = Math.max(
      2,
      Math.min(16, (x(new Date(first + avgGap))! - x(new Date(first))!) * 0.7)
    );

    const wick = g
      .append("g")
      .selectAll("line")
      .data(data)
      .join("line")
      .attr("x1", (d: Bar) => x(parseT(d))!)
      .attr("x2", (d: Bar) => x(parseT(d))!)
      .attr("y1", (d: Bar) => y(d.high))
      .attr("y2", (d: Bar) => y(d.low))
      .attr("stroke", "#555");

    const bodies = g
      .append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d: Bar) => x(parseT(d))! - candleWidth / 2)
      .attr("y", (d: Bar) => y(Math.max(d.open, d.close)))
      .attr("width", candleWidth)
      .attr("height", (d: Bar) => Math.max(1, Math.abs(y(d.open) - y(d.close))))
      .attr("fill", (d: Bar) => (d.close >= d.open ? "#16a34a" : "#dc2626"));

    g.append("g")
      .selectAll("rect.vol")
      .data(data)
      .join("rect")
      .attr("class", "vol")
      .attr("x", (d: Bar) => x(parseT(d))! - Math.max(1, candleWidth * 0.8) / 2)
      .attr("y", (d: Bar) => yVol(d.volume))
      .attr("width", Math.max(1, candleWidth * 0.8))
      .attr("height", (d: Bar) => margin.top + chartH - yVol(d.volume))
      .attr("fill", "#9ca3af")
      .attr("opacity", 0.8);

    // overlays: MA lines
    const lineY = d3
      .line<LV>()
      .x((d) => x(d.t)!)
      .y((d) => y(d.v));
    if (maSMA?.length)
      svg
        .append("path")
        .datum(maSMA)
        .attr("fill", "none")
        .attr("stroke", "#0ea5e9")
        .attr("stroke-width", 1.5)
        .attr("d", lineY as any);
    if (maEMA?.length)
      svg
        .append("path")
        .datum(maEMA)
        .attr("fill", "none")
        .attr("stroke", "#a855f7")
        .attr("stroke-width", 1.5)
        .attr("d", lineY as any);

    // overlay: compare line (right axis)
    if (comparePct?.length) {
      const lineR = d3
        .line<LV>()
        .x((d) => x(d.t)!)
        .y((d) => yRight(d.v)!);
      svg
        .append("path")
        .datum(comparePct)
        .attr("fill", "none")
        .attr("stroke", "#0f766e")
        .attr("stroke-width", 1.2)
        .attr("stroke-dasharray", "4 3")
        .attr("d", lineR as any);
    }

    if (garchVol?.length) {
      const lineVol = d3
        .line<LV>()
        .x((d) => x(d.t)!)
        .y((d) => yRight(d.v)!);
      svg
        .append("path")
        .datum(garchVol)
        .attr("fill", "none")
        .attr("stroke", "#ef4444")
        .attr("stroke-width", 1.2)
        .attr("d", lineVol as any);
    }

    if (rsi?.length) {
      const lineRSI = d3
        .line<LV>()
        .x((d) => x(d.t)!)
        .y((d) => yRSI(d.v)!);
      svg
        .append("path")
        .datum(rsi)
        .attr("fill", "none")
        .attr("stroke", "#f59e0b")
        .attr("stroke-width", 1.2)
        .attr("d", lineRSI as any);
      svg
        .append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", yRSI(70))
        .attr("y2", yRSI(70))
        .attr("stroke", "#6b7280")
        .attr("stroke-dasharray", "4 3")
        .attr("opacity", 0.6);
      svg
        .append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", yRSI(30))
        .attr("y2", yRSI(30))
        .attr("stroke", "#6b7280")
        .attr("stroke-dasharray", "4 3")
        .attr("opacity", 0.6);
    }

    // tooltip
    const tip = d3
      .select(el)
      .append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "#111")
      .style("color", "#fff")
      .style("padding", "6px 8px")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("opacity", 0);

    const vline = svg
      .append("line")
      .attr("y1", margin.top)
      .attr("y2", margin.top + chartH)
      .attr("stroke", "#666")
      .attr("stroke-dasharray", "3 3")
      .style("opacity", 0);

    const bisect = d3.bisector((d: Bar) => new Date(d.ts).getTime()).center;

    const onMove = (event: MouseEvent) => {
      const [mx, my] = d3.pointer(event, svg.node());
      if (
        mx < margin.left ||
        mx > width - margin.right ||
        my < margin.top ||
        my > margin.top + chartH
      ) {
        vline.style("opacity", 0);
        tip.style("opacity", 0);
        return;
      }
      const t = x.invert(mx);
      const idx = bisect(data, t.getTime());
      const d = data[Math.min(Math.max(0, idx), data.length - 1)];
      const tx = x(new Date(d.ts))!;
      vline.attr("x1", tx).attr("x2", tx).style("opacity", 1);
      tip
        .style("opacity", 0.95)
        .style("left", `${Math.min(tx + 12, width - 160)}px`)
        .style("top", `${margin.top + 8}px`).html(`
          <div>${new Date(d.ts)
            .toISOString()
            .slice(0, 19)
            .replace("T", " ")}</div>
          <div>O: ${d.open.toFixed(2)} H: ${d.high.toFixed(2)}</div>
          <div>L: ${d.low.toFixed(2)} C: ${d.close.toFixed(2)} V: ${
        d.volume
      }</div>
        `);
    };
    const onLeave = () => {
      vline.style("opacity", 0);
      tip.style("opacity", 0);
    };

    svg.on("mousemove", onMove as any).on("mouseleave", onLeave as any);

    const zoomed = (event: any) => {
      const zx = event.transform.rescaleX(x);
      gx.call(xAxis, zx);
      wick
        .attr("x1", (d: Bar) => zx(parseT(d))!)
        .attr("x2", (d: Bar) => zx(parseT(d))!);
      bodies.attr("x", (d: Bar) => zx(parseT(d))! - candleWidth / 2);
    };

    const zoomEnded = (event: any) => {
      if (!onRangeChange || !event.sourceEvent) return; // ignore programmatic
      const zx = event.transform.rescaleX(x);
      const domain = zx.domain() as [Date, Date];
      onRangeChange(domain[0].toISOString(), domain[1].toISOString());
    };

    const zoom = d3
      .zoom()
      .scaleExtent([1, 40])
      .translateExtent([
        [margin.left, 0],
        [width - margin.right, height],
      ])
      .on("zoom", zoomed)
      .on("end", zoomEnded);
    svg
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", chartH)
      .style("fill", "transparent")
      .style("cursor", "grab")
      .call(zoom as any);

    const brushY = margin.top + chartH + 28;
    const brush = d3
      .brushX()
      .extent([
        [margin.left, brushY],
        [width - margin.right, brushY + brushHeight],
      ])
      .on("end", (event: any) => {
        if (!event.selection || !event.sourceEvent) return;
        const [x0, x1] = event.selection;
        const s0 = x.invert(x0).toISOString();
        const s1 = x.invert(x1).toISOString();
        if (onRangeChange) onRangeChange(s0, s1);
      });

    const xb = d3
      .scaleTime()
      .domain(x.domain())
      .range([margin.left, width - margin.right]);
    const yb = d3
      .scaleLinear()
      .domain([d3.min(data, (d) => d.low)!, d3.max(data, (d) => d.high)!])
      .nice()
      .range([brushY + brushHeight, brushY]);

    svg
      .append("g")
      .attr("transform", `translate(0,${brushY + brushHeight})`)
      .call(
        d3
          .axisBottom(xb)
          .ticks(6)
          .tickFormat(d3.timeFormat("%Y-%m") as any)
      );

    const lineOverview = d3
      .line<Bar>()
      .x((d: Bar) => xb(parseT(d))!)
      .y((d: Bar) => yb(d.close));
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#6b7280")
      .attr("stroke-width", 1)
      .attr("d", lineOverview as any);

    const gBrush = svg.append("g").call(brush as any);
    gBrush.call((brush as any).move, [xb.range()[0], xb.range()[1]]);

    // cleanup
    return () => {
      svg.on(".zoom", null);
    };
  }, [data, height, onRangeChange, maSMA, maEMA, comparePct, rsi, garchVol]);

  return <div ref={ref} className="w-full relative" />;
}
