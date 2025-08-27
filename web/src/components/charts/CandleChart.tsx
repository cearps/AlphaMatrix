import { useEffect } from "react";
import { createCandleChart } from "./d3/candleDrawing";
import type { Bar, ChartMargins } from "../../lib/types";
import { useResizeObserver } from "../../hooks/useResizeObserver";

export type CandleChartProps = {
  data: Bar[];
  height?: number;
  margin?: ChartMargins;
  showVolume?: boolean;
  onRangeChange?: (startISO: string, endISO: string) => void;
  className?: string;
};

const DEFAULT_MARGIN: ChartMargins = { top: 16, right: 24, bottom: 80, left: 56 };

export default function CandleChart({
  data,
  height = 560,
  margin = DEFAULT_MARGIN,
  showVolume = true,
  onRangeChange,
  className = "w-full",
}: CandleChartProps) {
  const { ref, rect, node } = useResizeObserver<HTMLDivElement>();
  const width = rect?.width ? Math.floor(rect.width) : 960;

  useEffect(() => {
    const el = node;
    if (!el || !data?.length || !width || !height) return;

    const instance = createCandleChart(el, {
      data,
      width,
      height,
      margin,
      showVolume,
      onRangeChange,
    });

    return () => instance.destroy();
  }, [data, width, height, margin, showVolume, onRangeChange, node]);

  return (
    <div
      ref={ref}
      data-testid="candle-host"
      data-candle-root
      className={className}
      style={{ height }}
    />
  );
}
