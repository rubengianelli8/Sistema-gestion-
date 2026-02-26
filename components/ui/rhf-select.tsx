"use client";

import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface RhfSelectProps {
  name: string;
  label: string;
  options: SelectOption[];
  className?: string;
}

export function RhfSelect({ name, label, options, className }: RhfSelectProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        {...register(name)}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
