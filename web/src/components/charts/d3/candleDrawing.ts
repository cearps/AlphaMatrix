import * as d3 from "d3";
import type { Bar, ChartMargins } from "../../../lib/types";

export type CandleDrawingProps = {
  data: Bar[];
  width: number;
  height: number;
  margin: ChartMargins;
  showVolume: boolean;
  onRangeChange?: (s: string, e: string) => void;
};

type Scene = {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  root: d3.Selection<SVGGElement, unknown, null, undefined>;
  gx: d3.Selection<SVGGElement, unknown, null, undefined>;
  x: d3.ScaleTime<number, number>;
  y: d3.ScaleLinear<number, number>;
  yVol: d3.ScaleLinear<number, number>;
  zoom: d3.ZoomBehavior<Element, unknown>;
  candleWidth: number;
  brushY: number;
  brushHeight: number;
  cleanup: (() => void)[];
};

const fmtDay = d3.timeFormat("%Y-%m-%d");
const fmtMonth = d3.timeFormat("%Y-%m");

function computeCandleWidth(x: d3.ScaleTime<number, number>, times: Date[]) {
  if (times.length < 2) return 4;
  const first = times[0].getTime();
  const last = times[times.length - 1].getTime();
  const avgGap = Math.max(1, Math.round((last - first) / Math.max(1, times.length - 1)));
  return Math.max(2, Math.min(16, (x(new Date(first + avgGap))! - x(new Date(first))!) * 0.7));
}

function colors() {
  const get = (v: string, fb: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb;
  return {
    up: get("--color-success-600", "#16a34a"),
    down: get("--color-danger-600", "#dc2626"),
    wick: get("--color-muted-600", "#555"),
    vol: get("--color-muted-400", "#9ca3af"),
  };
}

export function createCandleChart(el: HTMLDivElement, props: CandleDrawingProps) {
  const { width, height, data, margin, showVolume, onRangeChange } = props;
  el.innerHTML = "";

  const times = data.map((d) => new Date(d.ts));
  const brushHeight = 60;
  const chartH = height - margin.top - margin.bottom - brushHeight - 16;
  const brushY = margin.top + chartH + 28;

  const svg = d3.select(el).append("svg").attr("width", width).attr("height", height);
  const root = svg.append("g");

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
    .domain([0, Math.max(1, d3.max(data, (d) => d.volume) || 0)])
    .range([margin.top + chartH, margin.top + chartH - Math.max(60, chartH * 0.2)]);

  // axes
  const gx = svg.append("g").attr("transform", `translate(0,${margin.top + chartH})`);
  const gy = svg.append("g").attr("transform", `translate(${margin.left},0)`);
  const axisBottom = d3
    .axisBottom<Date>(x)
    .ticks(8)
    .tickFormat(fmtDay as any);
  const axisLeft = d3.axisLeft(y).ticks(6);

  gx.call(axisBottom);
  gy.call(axisLeft).call((g) => g.select(".domain").remove());

  // volume (rendered first so it appears behind candles)
  const c = colors();
  const candleWidth = computeCandleWidth(x, times);
  let vols: d3.Selection<SVGRectElement, Bar, SVGGElement, unknown> | null = null;
  if (showVolume) {
    vols = root
      .append("g")
      .selectAll<SVGRectElement, Bar>("rect.vol")
      .data(data)
      .join("rect")
      .attr("class", "vol")
      .attr("x", (d) => x(new Date(d.ts))! - Math.max(1, candleWidth * 0.8) / 2)
      .attr("y", (d) => yVol!(d.volume))
      .attr("width", Math.max(1, candleWidth * 0.8))
      .attr("height", (d) => margin.top + chartH - yVol!(d.volume))
      .attr("fill", c.vol)
      .attr("opacity", 0.5);
  }

  // candles & wicks (rendered after volume)
  const wick = root
    .append("g")
    .selectAll<SVGLineElement, Bar>("line")
    .data(data)
    .join("line")
    .attr("x1", (d) => x(new Date(d.ts))!)
    .attr("x2", (d) => x(new Date(d.ts))!)
    .attr("y1", (d) => y(d.high))
    .attr("y2", (d) => y(d.low))
    .attr("stroke", c.wick);

  const bodies = root
    .append("g")
    .selectAll<SVGRectElement, Bar>("rect")
    .data(data)
    .join("rect")
    .attr("x", (d) => x(new Date(d.ts))! - candleWidth / 2)
    .attr("y", (d) => y(Math.max(d.open, d.close)))
    .attr("width", candleWidth)
    .attr("height", (d) => Math.max(1, Math.abs(y(d.open) - y(d.close))))
    .attr("fill", (d) => (d.close >= d.open ? c.up : c.down));

  // zoom
  let xz: d3.ScaleTime<number, number> = x.copy();
  const onZoom = (event: d3.D3ZoomEvent<Element, unknown>) => {
    const zx = event.transform.rescaleX(x);
    xz = zx;
    gx.call(
      d3
        .axisBottom<Date>(zx)
        .ticks(8)
        .tickFormat(fmtDay as any),
    );

    wick.attr("x1", (d) => zx(new Date(d.ts))!).attr("x2", (d) => zx(new Date(d.ts))!);
    bodies.attr("x", (d) => zx(new Date(d.ts))! - candleWidth / 2);
    vols?.attr("x", (d) => zx(new Date(d.ts))! - Math.max(1, candleWidth * 0.8) / 2);
  };

  const onZoomEnd = (event: d3.D3ZoomEvent<Element, unknown>) => {
    if (!onRangeChange || !event?.sourceEvent) return;
    const zx = event.transform.rescaleX(x);
    const [s, e] = zx.domain();
    onRangeChange(s.toISOString(), e.toISOString());
  };

  const zoom = d3
    .zoom<Element, unknown>()
    .scaleExtent([1, 40])
    .translateExtent([
      [margin.left, 0],
      [width - margin.right, height],
    ])
    .on("zoom", onZoom)
    .on("end", onZoomEnd);

  const zoomRect = svg
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", chartH)
    .attr("data-interactive", "zoom-rect")
    .style("fill", "transparent")
    .style("cursor", "grab")
    .call(zoom as any);

  // Hover: crosshair and tooltip
  const hoverLayer = root.append("g").attr("pointer-events", "none");
  const vLine = hoverLayer
    .append("line")
    .attr("stroke", "#9ca3af")
    .attr("stroke-dasharray", "3 3")
    .style("display", "none");
  const hLine = hoverLayer
    .append("line")
    .attr("stroke", "#9ca3af")
    .attr("stroke-dasharray", "3 3")
    .style("display", "none");

  if (getComputedStyle(el).position === "static") {
    el.style.position = "relative";
  }
  const tooltip = document.createElement("div");
  tooltip.className =
    "am-tooltip pointer-events-none absolute bg-gray-800 text-white text-xs px-2 py-1 rounded shadow";
  tooltip.style.display = "none";
  el.appendChild(tooltip);

  const bisectDate = d3.bisector<Bar, number>((d) => new Date(d.ts).getTime()).center;

  function updateHover(mouseX: number, mouseY: number) {
    const px = Math.max(margin.left, Math.min(width - margin.right, mouseX));
    const py = Math.max(margin.top, Math.min(margin.top + chartH, mouseY));
    const at = xz.invert(px).getTime();
    const idx = bisectDate(data, at);
    const d = data[Math.max(0, Math.min(data.length - 1, idx))];
    const cx = xz(new Date(d.ts))!;
    const cy = y(d.close);

    vLine
      .attr("x1", cx)
      .attr("x2", cx)
      .attr("y1", margin.top)
      .attr("y2", margin.top + chartH)
      .style("display", null);
    hLine
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", cy)
      .attr("y2", cy)
      .style("display", null);

    const fmtTs = d3.timeFormat("%Y-%m-%d %H:%M");
    const t = new Date(d.ts);
    tooltip.innerHTML = `${fmtTs(t)}<br/>O: ${d.open.toFixed(2)} H: ${d.high.toFixed(
      2,
    )} L: ${d.low.toFixed(2)} C: ${d.close.toFixed(2)}<br/>V: ${d.volume.toLocaleString()}`;

    const pad = 8;
    const estW = 160;
    const estH = 56;
    let left = px + pad;
    let top = py - estH - pad;
    if (left + estW > width - margin.right) left = px - estW - pad;
    if (top < margin.top) top = py + pad;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.display = "block";
  }

  function hideHover() {
    vLine.style("display", "none");
    hLine.style("display", "none");
    tooltip.style.display = "none";
  }

  zoomRect
    .on("mousemove", (event: MouseEvent) => {
      const pt = d3.pointer(event, svg.node() as SVGSVGElement);
      updateHover(pt[0], pt[1]);
    })
    .on("mouseleave", () => hideHover());

  // brush overview
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
        .axisBottom<Date>(xb)
        .ticks(6)
        .tickFormat(fmtMonth as any),
    );

  const line = d3
    .line<Bar>()
    .x((d) => xb(new Date(d.ts))!)
    .y((d) => yb(d.close));

  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#6b7280")
    .attr("stroke-width", 1)
    .attr("d", line as any);

  const brush = d3
    .brushX()
    .extent([
      [margin.left, brushY],
      [width - margin.right, brushY + brushHeight],
    ])
    .on("end", (event: d3.D3BrushEvent<unknown>) => {
      if (!event.selection || !event.sourceEvent || !onRangeChange) return;
      const [x0, x1] = event.selection as [number, number];
      onRangeChange(xb.invert(x0).toISOString(), xb.invert(x1).toISOString());
    });

  const gBrush = svg.append("g").call(brush as any);
  gBrush.call(brush.move as any, [xb.range()[0], xb.range()[1]]);

  const cleanup: (() => void)[] = [];
  return {
    update(next: CandleDrawingProps) {
      if (next.width !== width || next.height !== height || next.data !== data) {
        createCandleChart(el, next);
      }
    },
    destroy() {
      cleanup.forEach((fn) => fn());
      tooltip.remove();
      svg.remove();
    },
    _scene: { svg, root, gx, x, y, yVol, zoom, candleWidth, brushY, brushHeight, cleanup } as Scene,
  };
}
