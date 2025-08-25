import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { Bar } from "../lib/types";

type Props = { data: Bar[]; height?: number };

export default function D3Candles({ data, height = 520 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !data?.length) return;

    // clear
    ref.current.innerHTML = "";

    const margin = { top: 16, right: 24, bottom: 24, left: 48 };
    const width = ref.current.clientWidth || 960;
    const hCandle = Math.floor(height * 0.78);
    const hVolume = height - hCandle - margin.top - margin.bottom - 12;

    const svg = d3
      .select(ref.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const parseT = (d: Bar) => new Date(d.ts);
    const x = d3
      .scaleBand<Date>()
      .domain(data.map(parseT))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([d3.min(data, (d) => d.low)!, d3.max(data, (d) => d.high)!])
      .range([margin.top + hCandle, margin.top])
      .nice();

    const yVol = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.volume)!])
      .range([margin.top + hCandle + 12 + hVolume, margin.top + hCandle + 12]);

    // axes
    const xAxis = (g: any) =>
      g.attr("transform", `translate(0,${margin.top + hCandle})`).call(
        d3
          .axisBottom(x)
          .tickValues(
            x.domain().filter((_, i) => i % Math.ceil(data.length / 8) === 0)
          )
          .tickFormat((d: any) => d3.timeFormat("%Y-%m-%d")(d))
      );

    const yAxis = (g: any) =>
      g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(6))
        .call((g: any) => g.select(".domain").remove());

    svg.append("g").call(xAxis);
    svg.append("g").call(yAxis);

    // wick
    svg
      .append("g")
      .selectAll("line")
      .data(data)
      .join("line")
      .attr("x1", (d) => x(parseT(d))! + x.bandwidth() / 2)
      .attr("x2", (d) => x(parseT(d))! + x.bandwidth() / 2)
      .attr("y1", (d) => y(d.high))
      .attr("y2", (d) => y(d.low))
      .attr("stroke", "#555");

    // candles
    svg
      .append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(parseT(d))!)
      .attr("y", (d) => y(Math.max(d.open, d.close)))
      .attr("width", x.bandwidth())
      .attr("height", (d) => Math.max(1, Math.abs(y(d.open) - y(d.close))))
      .attr("fill", (d) => (d.close >= d.open ? "#16a34a" : "#dc2626"));

    // volume bars
    svg
      .append("g")
      .selectAll("rect.vol")
      .data(data)
      .join("rect")
      .attr("class", "vol")
      .attr("x", (d) => x(parseT(d))!)
      .attr("y", (d) => yVol(d.volume))
      .attr("width", x.bandwidth())
      .attr(
        "height",
        (d) => margin.top + hCandle + 12 + hVolume - yVol(d.volume)
      )
      .attr("fill", "#9ca3af");

    // zoom/pan: scale x on zoom and redraw candles/axes
    const zoomed = (event: d3.D3ZoomEvent<Element, unknown>) => {
      const t = event.transform;
      const zx = t.rescaleX(
        d3
          .scaleLinear()
          .domain([0, data.length])
          .range([margin.left, width - margin.right])
      );
      // map index back to positions
      const bandwidth = x.bandwidth();
      svg.selectAll("g").remove();

      const x2 = d3
        .scaleBand<Date>()
        .domain(data.map(parseT))
        .range([t.applyX(margin.left), t.applyX(width - margin.right)])
        .padding(0.3);

      const xAxis2 = (g: any) =>
        g.attr("transform", `translate(0,${margin.top + hCandle})`).call(
          d3
            .axisBottom(x2)
            .tickValues(
              x2.domain().filter((_, i) => i % Math.ceil(data.length / 8) === 0)
            )
            .tickFormat((d: any) => d3.timeFormat("%Y-%m-%d")(d))
        );

      svg.append("g").call(xAxis2);
      svg.append("g").call(yAxis);

      svg
        .append("g")
        .selectAll("line")
        .data(data)
        .join("line")
        .attr("x1", (d) => x2(parseT(d))! + x2.bandwidth() / 2)
        .attr("x2", (d) => x2(parseT(d))! + x2.bandwidth() / 2)
        .attr("y1", (d) => y(d.high))
        .attr("y2", (d) => y(d.low))
        .attr("stroke", "#555");

      svg
        .append("g")
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", (d) => x2(parseT(d))!)
        .attr("y", (d) => y(Math.max(d.open, d.close)))
        .attr("width", x2.bandwidth())
        .attr("height", (d) => Math.max(1, Math.abs(y(d.open) - y(d.close))))
        .attr("fill", (d) => (d.close >= d.open ? "#16a34a" : "#dc2626"));

      svg
        .append("g")
        .selectAll("rect.vol")
        .data(data)
        .join("rect")
        .attr("class", "vol")
        .attr("x", (d) => x2(parseT(d))!)
        .attr("y", (d) => yVol(d.volume))
        .attr("width", x2.bandwidth())
        .attr(
          "height",
          (d) => margin.top + hCandle + 12 + hVolume - yVol(d.volume)
        )
        .attr("fill", "#9ca3af");
    };

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 20])
      .translateExtent([
        [margin.left, 0],
        [width - margin.right, height],
      ])
      .on("zoom", zoomed);
    svg.call(zoom as any);

    const onResize = () => {
      if (!ref.current) return;
      const newW = ref.current.clientWidth;
      if (newW && newW !== width) {
        ref.current.innerHTML = "";
        // simple re-render trigger: rely on parent state changes elsewhere
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [data, height]);

  return <div ref={ref} className="w-full" />;
}
