"use client";

import { useEffect, useRef, useState } from "react";
import { BurgerIllustration } from "@/components/loading/burger-illustration";

export const INTRO_STORAGE_KEY = "catering-intro-seen";
const INTRO_DURATION_MS = 1500;
const REDUCED_MOTION_DURATION_MS = 250;
const EXIT_DURATION_MS = 320;

function safelyReadIntroSeen(): boolean {
  try {
    return window.sessionStorage.getItem(INTRO_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function safelyWriteIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
  } catch {
    // The intro still completes normally if sessionStorage is unavailable.
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function InitialSiteLoader() {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const previousBodyOverflowRef = useRef<string | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (safelyReadIntroSeen()) {
      const hideTimer = window.setTimeout(() => {
        setIsVisible(false);
      }, 0);

      return () => window.clearTimeout(hideTimer);
    }

    safelyWriteIntroSeen();
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    previousBodyOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const introDuration = prefersReducedMotion() ? REDUCED_MOTION_DURATION_MS : INTRO_DURATION_MS;
    const exitTimer = window.setTimeout(() => {
      setIsExiting(true);
    }, introDuration);

    const removeTimer = window.setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = previousBodyOverflowRef.current ?? "";
      previousFocusRef.current?.focus({ preventScroll: true });
    }, introDuration + EXIT_DURATION_MS);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
      document.body.style.overflow = previousBodyOverflowRef.current ?? "";
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      id="initial-site-loader"
      className="initial-site-loader"
      data-exiting={isExiting ? "true" : "false"}
      role="status"
      aria-live="polite"
      aria-label="Učitavanje sadržaja"
    >
      <div className="intro-loader-panel">
        <div className="intro-burger-stage" aria-hidden="true">
          <div className="intro-burger-float">
            <BurgerIllustration />
          </div>
          <div className="intro-burger-shadow" />
        </div>
      </div>
    </div>
  );
}
