import * as React from "react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export function Checkbox({ className = "", ...props }: Props) {
  return (
    <input
      type="checkbox"
      className={`h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
}

export default Checkbox;
