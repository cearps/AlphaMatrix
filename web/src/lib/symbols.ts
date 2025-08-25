export const COMMON_SYMBOLS = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "META",
  "TSLA",
  "NVDA",
  "NFLX",
  "AMD",
  "INTC",
  "BHP.AX",
  "CBA.AX",
  "NAB.AX",
  "WBC.AX",
  "TLS.AX",
  "NDQ.AX",
];

export function filterSymbols(
  q: string,
  list: string[] = COMMON_SYMBOLS
): string[] {
  const s = q.trim().toUpperCase();
  if (!s) return list.slice(0, 20);
  return list.filter((x) => x.toUpperCase().includes(s)).slice(0, 20);
}
