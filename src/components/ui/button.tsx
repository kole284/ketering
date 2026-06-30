import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";

const variantClassName: Record<ButtonVariant, string> = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  outline: "btn btn-outline",
  ghost: "btn btn-ghost",
  destructive: "btn btn-destructive",
  link: "btn btn-link",
};

type BaseProps = {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
  isLoading?: boolean;
};

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;

type LinkButtonProps = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export function Button({
  variant = "primary",
  className,
  children,
  isLoading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(variantClassName[variant], className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({ variant = "primary", className, children, href, ...props }: LinkButtonProps) {
  return (
    <Link href={href} className={cn(variantClassName[variant], className)} {...props}>
      {children}
    </Link>
  );
}
