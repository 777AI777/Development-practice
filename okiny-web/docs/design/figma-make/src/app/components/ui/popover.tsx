import { type ReactNode, createContext, useContext, useState, useRef, useEffect } from "react";

// --- Context ---
interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PopoverContext = createContext<PopoverContextValue>({
  open: false,
  setOpen: () => {},
});

// --- Popover (root) ---
interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function Popover({ open: controlledOpen, onOpenChange, children }: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setOpen = (value: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(value);
    }
    onOpenChange?.(value);
  };

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  );
}

// --- PopoverTrigger ---
interface PopoverTriggerProps {
  asChild?: boolean;
  children: ReactNode;
  className?: string;
}

export function PopoverTrigger({ children, className = "" }: PopoverTriggerProps) {
  const { open, setOpen } = useContext(PopoverContext);

  return (
    <button type="button" onClick={() => setOpen(!open)} className={className}>
      {children}
    </button>
  );
}

// --- PopoverContent ---
interface PopoverContentProps {
  children: ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

export function PopoverContent({ children, className = "", align = "center" }: PopoverContentProps) {
  const { open, setOpen } = useContext(PopoverContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  if (!open) return null;

  const alignClass =
    align === "start" ? "left-0" : align === "end" ? "right-0" : "left-1/2 -translate-x-1/2";

  return (
    <div
      ref={ref}
      className={`absolute z-50 mt-2 w-72 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none ${alignClass} ${className}`}
    >
      {children}
    </div>
  );
}
