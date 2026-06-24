function parseToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

function formatHHMM(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(h)}:${pad(m)}`
}

export function formatWorkingHoursLabel(restaurant: RestaurantWithWorkingHours): string {
  const w = restaurant?.workingHours
  if (!w || !w.start || !w.end) return "Radno vreme nije određeno"
  return `${w.start} - ${w.end}`
}

export function getRestaurantOrderTimeBounds(restaurant: RestaurantWithWorkingHours): { min: string; max: string } {
  const w = restaurant?.workingHours

  if (!w || !w.start || !w.end) {
    return { min: "00:00", max: "23:59" }
  }

  const startM = parseToMinutes(w.start)
  const endM = parseToMinutes(w.end)

  // business rule: earliest order time is 60 minutes after opening
  const minAllowed = Math.min(Math.max(startM + 60, startM), 24 * 60 - 1)
  const maxAllowed = Math.min(endM, 24 * 60 - 1)

  if (minAllowed > maxAllowed) {
    // no valid window
    return { min: formatHHMM(maxAllowed), max: formatHHMM(maxAllowed) }
  }

  return { min: formatHHMM(minAllowed), max: formatHHMM(maxAllowed) }
}

export function isTimeWithinRestaurantHours(restaurant: RestaurantWithWorkingHours, time: string): boolean {
  const bounds = getRestaurantOrderTimeBounds(restaurant)
  const t = parseToMinutes(time)
  return t >= parseToMinutes(bounds.min) && t <= parseToMinutes(bounds.max)
}
import type { Restaurant } from "@/lib/types/restaurant"

type RestaurantWithWorkingHours = Restaurant & {
  workingHours?: {
    start?: string
    end?: string
  }
}
