import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { vi } from "vitest";

Element.prototype.scrollIntoView = vi.fn();

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    priority,
    unoptimized,
    fill,
    ...props
  }: {
    src: string | { src: string };
    alt: string;
    priority?: boolean;
    unoptimized?: boolean;
    fill?: boolean;
  }) => {
    void priority;
    void unoptimized;
    void fill;

    return createElement("img", {
      src: typeof src === "string" ? src : src.src,
      alt,
      ...props,
    });
  },
}));
