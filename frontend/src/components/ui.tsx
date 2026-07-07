import { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function Card({ children, className = "bg-white" }: { children: ReactNode; className?: string }) {
  // `className` fully controls the background (defaults to bg-white) so a caller passing e.g.
  // "bg-brand-600 text-white" never ends up with two conflicting bg-* utilities in the same
  // string, which Tailwind resolves non-deterministically rather than by source order.
  return (
    <div className={`rounded-2xl border border-gray-200/70 p-5 shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function ProgressBar({ value, colorClass = "bg-brand-600" }: { value: number; colorClass?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

type BadgeTone = "brand" | "success" | "neutral" | "accent";

const BADGE_TONES: Record<BadgeTone, string> = {
  brand: "bg-brand-50 text-brand-700",
  success: "bg-emerald-50 text-emerald-700",
  neutral: "bg-gray-100 text-gray-600",
  accent: "bg-accent-100 text-accent-700",
};

export function Badge({
  children,
  tone = "brand",
  icon: Icon,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: LucideIcon;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${BADGE_TONES[tone]}`}
    >
      {Icon && <Icon size={12} strokeWidth={2.5} />}
      {children}
    </span>
  );
}

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 disabled:hover:bg-brand-700",
  secondary: "bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 disabled:hover:bg-accent-500",
  outline: "border border-gray-300 bg-white text-gray-700 hover:border-brand-400 hover:text-brand-700",
  ghost: "text-gray-600 hover:bg-gray-100",
  danger: "border border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: "px-4 py-2.5 text-sm gap-1.5",
  lg: "px-5 py-3 text-base gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-lg font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {Icon && iconPosition === "left" && <Icon size={size === "lg" ? 18 : 16} strokeWidth={2.25} />}
      {children}
      {Icon && iconPosition === "right" && <Icon size={size === "lg" ? 18 : 16} strokeWidth={2.25} />}
    </button>
  );
}

export function IconBadge({
  icon: Icon,
  tone = "brand",
  size = 40,
}: {
  icon: LucideIcon;
  tone?: "brand" | "accent" | "neutral";
  size?: number;
}) {
  const tones = {
    brand: "bg-brand-700 text-white",
    accent: "bg-accent-500 text-white",
    neutral: "bg-gray-100 text-gray-600",
  };
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
      style={{ width: size, height: size }}
    >
      <Icon size={size * 0.5} strokeWidth={2} />
    </div>
  );
}
