import { describe, expect, it } from "vitest";
import { formatRsd } from "@/lib/utils/money";

describe("money utilities", () => {
  it("formats numeric RSD values only at display boundary", () => {
    expect(formatRsd(1200)).toBe("1.200 RSD");
  });
});
