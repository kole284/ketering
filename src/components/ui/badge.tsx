import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeTone = "neutral" | "primary" | "success" | "warning" | "destructive";

const toneClassName: Record<BadgeTone, string> = {
  neutral: "badge badge-neutral",
  primary: "badge badge-primary",
  success: "badge badge-success",
  warning: "badge badge-warning",
  destructive: "badge badge-destructive",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  children: ReactNode;
};

export function Badge({ tone = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span className={cn(toneClassName[tone], className)} {...props}>
      {children}
    </span>
  );
}
