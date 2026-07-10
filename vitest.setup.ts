import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string | { src: string }; alt: string }) => (
    createElement("img", {
      src: typeof src === "string" ? src : src.src,
      alt,
      ...props,
    })
  ),
}));
