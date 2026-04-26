import * as React from "react";
import { cn } from "@/lib/utils";

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const FloatingInput = React.forwardRef<
  HTMLInputElement,
  FloatingInputProps
>(({ label, className, value, onChange, ...props }, ref) => {
  const hasValue = value !== undefined && value !== "";

  return (
    <div className="relative">
      <input
        ref={ref}
        value={value}
        onChange={onChange}
        placeholder=" "
        className={cn(
          "peer w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors",
          "focus:border-ring focus:ring-1 focus:ring-ring",
          className,
        )}
        {...props}
      />
      <label
        className={cn(
          "pointer-events-none absolute left-3 transition-all duration-150 bg-background px-1",
          "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground",
          "peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-muted-foreground",
          hasValue
            ? "-top-2 translate-y-0 text-xs text-muted-foreground"
            : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground",
        )}
      >
        {label}
      </label>
    </div>
  );
});

FloatingInput.displayName = "FloatingInput";
