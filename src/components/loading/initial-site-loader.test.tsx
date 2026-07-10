import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InitialSiteLoader, INTRO_STORAGE_KEY } from "@/components/loading/initial-site-loader";

function mockReducedMotion(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("InitialSiteLoader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
    document.body.style.overflow = "";
    document.documentElement.removeAttribute("data-intro-seen");
    mockReducedMotion(false);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.sessionStorage.clear();
    document.body.style.overflow = "";
  });

  it("shows on first entry and writes to sessionStorage", () => {
    render(<InitialSiteLoader />);

    expect(screen.getByRole("status", { name: /učitavanje sadržaja/i })).toBeInTheDocument();
    expect(window.sessionStorage.getItem(INTRO_STORAGE_KEY)).toBe("true");
  });

  it("does not show when already seen in the current session", async () => {
    window.sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
    render(<InitialSiteLoader />);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.queryByRole("status", { name: /učitavanje sadržaja/i })).not.toBeInTheDocument();
  });

  it("finishes the animation and removes itself from the DOM", async () => {
    render(<InitialSiteLoader />);

    act(() => {
      vi.advanceTimersByTime(2120);
    });

    expect(screen.queryByRole("status", { name: /učitavanje sadržaja/i })).not.toBeInTheDocument();
  });

  it("locks scroll while active and restores it after closing", async () => {
    document.body.style.overflow = "auto";
    render(<InitialSiteLoader />);

    expect(document.body.style.overflow).toBe("hidden");

    act(() => {
      vi.advanceTimersByTime(2120);
    });

    expect(screen.queryByRole("status", { name: /učitavanje sadržaja/i })).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("uses a shorter duration when reduced motion is enabled", async () => {
    mockReducedMotion(true);
    render(<InitialSiteLoader />);

    act(() => {
      vi.advanceTimersByTime(570);
    });

    expect(screen.queryByRole("status", { name: /učitavanje sadržaja/i })).not.toBeInTheDocument();
  });

  it("continues normally when sessionStorage throws", async () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });

    render(<InitialSiteLoader />);

    expect(screen.getByRole("status", { name: /učitavanje sadržaja/i })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2120);
    });

    expect(screen.queryByRole("status", { name: /učitavanje sadržaja/i })).not.toBeInTheDocument();

    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });
});
