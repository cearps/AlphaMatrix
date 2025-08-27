import type { Meta, StoryObj } from "@storybook/react";
import CandleChart from "./CandleChart";
import type { Bar } from "../../lib/types";

const meta: Meta<typeof CandleChart> = {
  title: "Charts/CandleChart",
  component: CandleChart,
  args: {
    height: 420,
    showVolume: true,
  },
};
export default meta;

type S = StoryObj<typeof CandleChart>;

function gen(n = 200): Bar[] {
  const res: Bar[] = [];
  let price = 100;
  for (let i = 0; i < n; i++) {
    const dt = new Date(Date.now() - (n - i) * 60_000);
    const open = price + (Math.random() - 0.5) * 2;
    const close = open + (Math.random() - 0.5) * 3;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    const volume = Math.floor(500 + Math.random() * 1500);
    res.push({ ts: dt.toISOString(), open, high, low, close, volume });
    price = close;
  }
  return res;
}

export const Default: S = {
  args: { data: gen(200) },
};

export const Dense: S = {
  args: { data: gen(2000), height: 560 },
};

export const WithHover: S = {
  args: { data: gen(400), height: 480, showVolume: true },
};
