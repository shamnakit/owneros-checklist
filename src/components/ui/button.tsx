import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline";
  size?: "sm" | "md";
};

export function Button({
  className = "",
  variant = "solid",
  size = "md",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-medium transition-colors";
  const v =
    variant === "outline"
      ? "border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
      : "bg-blue-600 text-white hover:bg-blue-500";
  const s = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2";
  return <button className={`${base} ${v} ${s} ${className}`} {...props} />;
}

export default Button;
