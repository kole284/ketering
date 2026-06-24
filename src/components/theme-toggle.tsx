"use client";

import { useEffect, useRef, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "keteringgo-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("theme-dark", theme === "dark");
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const hasMountedRef = useRef(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const savedTheme = window.localStorage.getItem(STORAGE_KEY);
      hasMountedRef.current = true;

      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      return;
    }

    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <div
      className="theme-toggle"
      role="group"
      aria-label="Izbor teme"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className="theme-toggle-option"
        data-active={theme === "light" ? "true" : "false"}
      >
        Light
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className="theme-toggle-option"
        data-active={theme === "dark" ? "true" : "false"}
      >
        Dark
      </button>
    </div>
  );
}
