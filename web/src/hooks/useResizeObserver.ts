import { useEffect, useState } from "react";

export function useResizeObserver<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!node) return;
    setRect(node.getBoundingClientRect());
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === node) setRect(entry.contentRect as DOMRect);
      }
    });
    obs.observe(node);
    return () => obs.disconnect();
  }, [node]);

  // expose the element on the setter for convenience in our chart wrapper
  const ref = (n: T | null) => {
    setNode(n);
  };

  return { ref, rect, node };
}
