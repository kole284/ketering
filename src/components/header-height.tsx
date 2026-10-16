"use client";

import { useEffect } from "react";

/** Publishes the sticky header's height as --header-h so other sticky bars can sit below it. */
export function HeaderHeight() {
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const update = () =>
      document.documentElement.style.setProperty("--header-h", `${header.getBoundingClientRect().height}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  return null;
}
