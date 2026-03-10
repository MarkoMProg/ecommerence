import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Styled native <select> that matches the dark admin Input appearance.
 * Replaces raw browser <select> elements in admin forms.
 */
function AdminSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          // Match Input: height, border, background, text, radius
          "h-9 w-full appearance-none rounded-md border border-white/20 bg-white/5",
          "px-3 py-1 pr-8 text-sm text-white [color-scheme:dark]",
          // Transition & focus ring matching the orange accent
          "outline-none transition-[color,box-shadow]",
          "focus-visible:border-[#FF4D00] focus-visible:ring-[3px] focus-visible:ring-[#FF4D00]/20",
          // Disabled state
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-white/40"
        strokeWidth={1.5}
      />
    </div>
  );
}

export { AdminSelect };
