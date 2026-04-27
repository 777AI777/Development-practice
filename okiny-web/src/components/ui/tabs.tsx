"use client";

import { type ReactNode, createContext, useContext, useState, useCallback } from "react";

// --- Context ---
interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue>({
  value: "",
  onValueChange: () => {},
});

// --- Tabs (root) ---
interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: ReactNode;
}

export function Tabs({ value: controlledValue, defaultValue = "", onValueChange, className = "", children }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = useCallback(
    (newValue: string) => {
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [controlledValue, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

// --- TabsList ---
interface TabsListProps {
  className?: string;
  children: ReactNode;
}

export function TabsList({ className = "", children }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}
    >
      {children}
    </div>
  );
}

// --- TabsTrigger ---
interface TabsTriggerProps {
  value: string;
  className?: string;
  children: ReactNode;
}

export function TabsTrigger({ value: tabValue, className = "", children }: TabsTriggerProps) {
  const { value, onValueChange } = useContext(TabsContext);
  const isActive = value === tabValue;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => onValueChange(tabValue)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        isActive ? "bg-background text-foreground shadow-sm" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

// --- TabsContent ---
interface TabsContentProps {
  value: string;
  className?: string;
  children: ReactNode;
}

export function TabsContent({ value: tabValue, className = "", children }: TabsContentProps) {
  const { value } = useContext(TabsContext);
  if (value !== tabValue) return null;

  return (
    <div role="tabpanel" className={`mt-2 ring-offset-background focus-visible:outline-none ${className}`}>
      {children}
    </div>
  );
}
