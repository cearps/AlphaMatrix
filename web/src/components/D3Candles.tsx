import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { Bar } from "../lib/types";

type Props = {
  data: Bar[];
  height?: number;
  onRangeChange?: (startISO: string, endISO: string) => void;
};

export default function D3Candles({
  data,
  height = 560,
  onRangeChange,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !data?.length) return;
    const el = ref.current;
    el.innerHTML = "";

    const parseT = (d: Bar) => new Date(d.ts);
    const times = data.map(parseT);

    const margin = { top: 16, right: 24, bottom: 80, left: 56 };
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

    const xAxis = (g: any, scale: any) =>
      g.attr("transform", `translate(0,${margin.top + chartH})`).call(
        d3
          .axisBottom(scale)
          .ticks(8)
          .tickFormat(d3.timeFormat("%Y-%m-%d") as any)
      );

    const yAxis = (g: any) =>
      g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(6))
        .call((g: any) => g.select(".domain").remove());

    const gx = svg.append("g");
    gx.call(xAxis, x);
    svg.append("g").call(yAxis);

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
      .selectAll<SVGLineElement, Bar>("line")
      .data(data)
      .join("line")
      .attr("x1", (d: Bar) => x(parseT(d))!)
      .attr("x2", (d: Bar) => x(parseT(d))!)
      .attr("y1", (d: Bar) => y(d.high))
      .attr("y2", (d: Bar) => y(d.low))
      .attr("stroke", "#555");

    const bodies = g
      .append("g")
      .selectAll<SVGRectElement, Bar>("rect")
      .data(data)
      .join("rect")
      .attr("x", (d: Bar) => x(parseT(d))! - candleWidth / 2)
      .attr("y", (d: Bar) => y(Math.max(d.open, d.close)))
      .attr("width", candleWidth)
      .attr("height", (d: Bar) => Math.max(1, Math.abs(y(d.open) - y(d.close))))
      .attr("fill", (d: Bar) => (d.close >= d.open ? "#16a34a" : "#dc2626"));

    const vols = g
      .append("g")
      .selectAll<SVGRectElement, Bar>("rect.vol")
      .data(data)
      .join("rect")
      .attr("class", "vol")
      .attr("x", (d: Bar) => x(parseT(d))! - Math.max(1, candleWidth * 0.8) / 2)
      .attr("y", (d: Bar) => yVol(d.volume))
      .attr("width", Math.max(1, candleWidth * 0.8))
      .attr("height", (d: Bar) => margin.top + chartH - yVol(d.volume))
      .attr("fill", "#9ca3af")
      .attr("opacity", 0.8);

    const zoomed = (event: any) => {
      const zx = event.transform.rescaleX(x);
      gx.call(xAxis, zx);
      wick
        .attr("x1", (d: Bar) => zx(parseT(d))!)
        .attr("x2", (d: Bar) => zx(parseT(d))!);
      bodies.attr("x", (d: Bar) => zx(parseT(d))! - candleWidth / 2);
      vols.attr(
        "x",
        (d: Bar) => zx(parseT(d))! - Math.max(1, candleWidth * 0.8) / 2
      );
    };
    const zoomEnded = (event: any) => {
      if (!onRangeChange) return;
      if (!event || !event.sourceEvent) return; // ignore programmatic
      const zx = event.transform.rescaleX(x);
      const domain = zx.domain() as [Date, Date];
      onRangeChange(domain[0].toISOString(), domain[1].toISOString());
    };

    const zoom: d3.ZoomBehavior<SVGRectElement, unknown> = d3
      .zoom<SVGRectElement, unknown>()
      .scaleExtent([1, 40])
      .translateExtent([
        [margin.left, 0],
        [width - margin.right, height],
      ])
      .on("zoom", zoomed as any)
      .on("end", zoomEnded as any);
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
      .on("end", (event: d3.D3BrushEvent<unknown>) => {
        if (!event.selection || !event.sourceEvent) return;
        const [x0, x1] = event.selection as [number, number];
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

    const line = d3
      .line<Bar>()
      .x((d: Bar) => xb(parseT(d))!)
      .y((d: Bar) => yb(d.close));
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#6b7280")
      .attr("stroke-width", 1)
      .attr("d", line as any);

    const gBrush = svg.append("g").call(brush);
    gBrush.call(brush.move as any, [xb.range()[0], xb.range()[1]]);

    const onResize = () => {
      const newW = el.clientWidth || width;
      if (newW !== width) {
        el.innerHTML = "";
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [data, height, onRangeChange]);

  return <div ref={ref} className="w-full" />;
}
