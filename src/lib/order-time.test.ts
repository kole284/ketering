import { describe, expect, it } from "vitest";
import {
  isTimeWithinRestaurantHours,
  validateRestaurantOrderTime,
} from "@/lib/order-time";
import type { RestaurantWorkingHour } from "@/lib/types/restaurant";

const workingHours: RestaurantWorkingHour[] = [
  { dayOfWeek: 0, opensAt: null, closesAt: null, isClosed: true },
  { dayOfWeek: 1, opensAt: "09:00", closesAt: "17:00", isClosed: false },
  { dayOfWeek: 2, opensAt: "22:00", closesAt: "02:00", isClosed: false },
  { dayOfWeek: 3, opensAt: "09:00", closesAt: "17:00", isClosed: false },
  { dayOfWeek: 4, opensAt: "09:00", closesAt: "17:00", isClosed: false },
  { dayOfWeek: 5, opensAt: "09:00", closesAt: "17:00", isClosed: false },
  { dayOfWeek: 6, opensAt: "10:00", closesAt: "14:00", isClosed: false },
];

const restaurant = {
  workingHours,
  leadTimeMinutes: 60,
  timezone: "Europe/Belgrade",
};

describe("restaurant order time", () => {
  it("rejects a closed day", () => {
    expect(validateRestaurantOrderTime(restaurant, "2026-07-12", "12:00", new Date("2026-07-10T08:00:00"))).toEqual({
      valid: false,
      reason: "closed",
    });
  });

  it("rejects time before opening", () => {
    expect(validateRestaurantOrderTime(restaurant, "2026-07-13", "08:30", new Date("2026-07-13T06:00:00"))).toEqual({
      valid: false,
      reason: "before_opening",
    });
  });

  it("rejects time after closing", () => {
    expect(validateRestaurantOrderTime(restaurant, "2026-07-13", "18:00", new Date("2026-07-13T06:00:00"))).toEqual({
      valid: false,
      reason: "after_closing",
    });
  });

  it("rejects today's time in the past", () => {
    expect(validateRestaurantOrderTime(restaurant, "2026-07-13", "10:00", new Date("2026-07-13T11:00:00"))).toEqual({
      valid: false,
      reason: "past",
    });
  });

  it("accepts a valid future time", () => {
    expect(validateRestaurantOrderTime(restaurant, "2026-07-13", "12:00", new Date("2026-07-13T09:30:00"))).toEqual({
      valid: true,
    });
  });

  it("supports working intervals that cross midnight", () => {
    expect(isTimeWithinRestaurantHours(restaurant, "2026-07-14", "23:30")).toBe(true);
    expect(isTimeWithinRestaurantHours(restaurant, "2026-07-14", "01:30")).toBe(true);
    expect(isTimeWithinRestaurantHours(restaurant, "2026-07-14", "12:00")).toBe(false);
  });

  it("uses the restaurant timezone for past and lead-time checks", () => {
    expect(validateRestaurantOrderTime(restaurant, "2026-07-13", "12:00", new Date("2026-07-13T08:30:00.000Z"))).toEqual({
      valid: true,
    });
  });

  it("rejects an invalid IANA timezone", () => {
    expect(validateRestaurantOrderTime({ ...restaurant, timezone: "Not/AZone" }, "2026-07-13", "12:00", new Date("2026-07-13T06:00:00.000Z"))).toEqual({
      valid: false,
      reason: "invalid",
    });
  });
});
