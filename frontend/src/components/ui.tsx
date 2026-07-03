import { ReactNode } from "react";

export function Card({ children, className = "bg-white" }: { children: ReactNode; className?: string }) {
  // `className` fully controls the background (defaults to bg-white) so a caller passing e.g.
  // "bg-brand-600 text-white" never ends up with two conflicting bg-* utilities in the same
  // string, which Tailwind resolves non-deterministically rather than by source order.
  return (
    <div className={`rounded-2xl border border-gray-200 p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function ProgressBar({ value, colorClass = "bg-brand-600" }: { value: number; colorClass?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full ${colorClass}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Badge({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "gray" }) {
  const tones = {
    blue: "bg-brand-50 text-brand-700",
    green: "bg-green-50 text-green-700",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
