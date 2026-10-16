"use client";

import { useI18n } from "@/i18n/provider";
import { formatQuantity, type MenuItem } from "@/lib/menu";

export function QuantityStepper({
  item,
  value,
  onChange,
  allowZero = false,
}: {
  item: MenuItem;
  value: number;
  onChange: (quantity: number) => void;
  /** In the cart, stepping below the minimum removes the line. */
  allowZero?: boolean;
}) {
  const { locale, t } = useI18n();
  const floor = allowZero ? 0 : item.min;
  const down = () => {
    const next = Math.round((value - item.step) * 10) / 10;
    onChange(next < item.min ? floor : next);
  };
  const up = () => onChange(Math.round((value + item.step) * 10) / 10);

  return (
    <div className="flex h-12 items-center rounded-full border border-line">
      <button
        type="button"
        onClick={down}
        disabled={value <= floor}
        className="flex size-12 items-center justify-center rounded-full text-xl disabled:text-line"
      >
        –<span className="sr-only">{t.menu.decrease}</span>
      </button>
      <span className="min-w-24 text-center text-[15px] font-medium tabular-nums" aria-live="polite">
        {formatQuantity(item, value, locale, t)}
      </span>
      <button
        type="button"
        onClick={up}
        className="flex size-12 items-center justify-center rounded-full text-xl"
      >
        +<span className="sr-only">{t.menu.increase}</span>
      </button>
    </div>
  );
}
