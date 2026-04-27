import {
  type ReactNode,
  type SelectHTMLAttributes,
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";

// --- Context ---
interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextValue>({
  value: "",
  onValueChange: () => {},
  open: false,
  setOpen: () => {},
});

// --- Select (root) ---
interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

export function Select({ value: controlledValue, defaultValue = "", onValueChange, children }: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const handleValueChange = useCallback(
    (newValue: string) => {
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
      setOpen(false);
    },
    [controlledValue, onValueChange]
  );

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

// --- SelectTrigger ---
interface SelectTriggerProps {
  id?: string;
  className?: string;
  children: ReactNode;
}

export function SelectTrigger({ id, className = "", children }: SelectTriggerProps) {
  const { open, setOpen } = useContext(SelectContext);

  return (
    <button
      type="button"
      id={id}
      onClick={() => setOpen(!open)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
      <span className="ml-2 text-xs opacity-50">▼</span>
    </button>
  );
}

// --- SelectValue ---
interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const { value } = useContext(SelectContext);
  return <span className={value ? "text-foreground" : "text-muted-foreground"}>{value || placeholder}</span>;
}

// --- SelectContent ---
interface SelectContentProps {
  children: ReactNode;
  className?: string;
}

export function SelectContent({ children, className = "" }: SelectContentProps) {
  const { open, setOpen } = useContext(SelectContext);
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

  return (
    <div
      ref={ref}
      className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md ${className}`}
    >
      {children}
    </div>
  );
}

// --- SelectItem ---
interface SelectItemProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function SelectItem({ value: itemValue, children, className = "" }: SelectItemProps) {
  const { value, onValueChange } = useContext(SelectContext);
  const isSelected = value === itemValue;

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={() => onValueChange(itemValue)}
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${isSelected ? "bg-accent text-accent-foreground" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
