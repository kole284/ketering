"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { getOrderDateRange, formatOrderDateLabel } from "@/lib/order-date";

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
};

function isValidDateValue(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function DatePicker({ value, onChange, className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value || "");
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const options = useMemo(() => getOrderDateRange(), []);

  const displayValue = useMemo(() => {
    if (!isValidDateValue(value)) {
      return "Izaberi datum";
    }

    return formatOrderDateLabel(value);
  }, [value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    const previousHtmlOverflow = htmlElement.style.overflow;
    const previousBodyOverflow = bodyElement.style.overflow;
    const previousBodyOverscrollBehavior = bodyElement.style.overscrollBehavior;

    htmlElement.style.overflow = "hidden";
    bodyElement.style.overflow = "hidden";
    bodyElement.style.overscrollBehavior = "none";

    const scrollTarget = window.setTimeout(() => {
      dialogRef.current?.focus({ preventScroll: true });
      optionRefs.current[draftValue]?.scrollIntoView({ block: "center" });
    }, 0);

    return () => {
      window.clearTimeout(scrollTarget);
      htmlElement.style.overflow = previousHtmlOverflow;
      bodyElement.style.overflow = previousBodyOverflow;
      bodyElement.style.overscrollBehavior = previousBodyOverscrollBehavior;
    };
  }, [draftValue, open, value]);

  const openPicker = () => {
    const fallbackValue = options[0]?.value ?? value;
    setDraftValue(isValidDateValue(value) ? value : fallbackValue);
    setOpen(true);
  };

  const closePicker = () => setOpen(false);

  const confirmPicker = () => {
    if (draftValue) {
      onChange(draftValue);
    }
    setOpen(false);
  };

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        className={[
          "mt-2 flex w-full items-center justify-between rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--input)] px-4 py-3 text-left text-base font-medium text-[color:var(--foreground)] shadow-sm outline-none transition focus:border-[color:var(--primary)]",
          className ?? "",
        ].join(" ")}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={isValidDateValue(value) ? "text-[color:var(--foreground)]" : "text-[color:var(--muted-foreground)]"}>
          {displayValue}
        </span>
      </button>

      {open && portalTarget ? createPortal(
        <div className="date-picker-overlay fixed inset-0 z-1000 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Izbor datuma"
            tabIndex={-1}
            className="date-picker-dialog w-full max-w-md overflow-hidden outline-none"
          >
            <div className="date-picker-header border-b px-5 py-4">
              <p className="date-picker-kicker text-xs font-bold uppercase tracking-[0.22em]">Datum</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="date-picker-title text-3xl font-semibold leading-none">
                  {draftValue ? formatOrderDateLabel(draftValue) : "Izaberi datum"}
                </span>
              </div>
            </div>

            <div className="px-4 py-4 sm:px-5">
              <p className="date-picker-column-label mb-2 text-xs font-bold uppercase tracking-[0.18em]">Dani</p>
              <div className="date-picker-list max-h-80 overflow-y-auto rounded-[var(--radius-lg)] border p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {options.map((option) => {
                  const selected = option.value === draftValue;

                  return (
                    <button
                      key={option.value}
                      ref={(element) => {
                        optionRefs.current[option.value] = element;
                      }}
                      type="button"
                      onClick={() => setDraftValue(option.value)}
                      className={[
                        "date-picker-option flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-base font-semibold transition",
                        selected ? "date-picker-option-selected" : "date-picker-option-unselected",
                      ].join(" ")}
                      aria-pressed={selected}
                    >
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-4 sm:px-5">
              <button
                type="button"
                onClick={closePicker}
                className="date-picker-secondary-action rounded-full px-4 py-2.5 text-sm font-semibold transition"
              >
                Otkaži
              </button>
              <button
                type="button"
                onClick={confirmPicker}
                className="date-picker-primary-action rounded-full px-5 py-2.5 text-sm font-bold transition"
              >
                Potvrdi datum
              </button>
            </div>
          </div>
        </div>,
        portalTarget,
      ) : null}
    </>
  );
}
