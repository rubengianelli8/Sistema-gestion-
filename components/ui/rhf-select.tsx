"use client";

import { Controller, get, useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

type SelectValueAs = "string" | "number" | "nullableNumber";

interface RhfSelectProps {
  name: string;
  label: string;
  options: SelectOption[];
  className?: string;
  valueAs?: SelectValueAs;
}

function toSelectValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

function parseSelectChange(raw: string, valueAs: SelectValueAs) {
  if (raw === "") {
    if (valueAs === "nullableNumber") return null;
    if (valueAs === "number") return undefined;
    return "";
  }

  if (valueAs === "string") return raw;

  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    if (valueAs === "nullableNumber") return null;
    return undefined;
  }

  return parsed;
}

export function RhfSelect({
  name,
  label,
  options,
  className,
  valueAs = "string",
}: RhfSelectProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const error = get(errors, name)?.message as string | undefined;

  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <select
            id={name}
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            value={toSelectValue(field.value)}
            onChange={(event) => {
              field.onChange(parseSelectChange(event.target.value, valueAs));
            }}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500 focus-visible:ring-red-500",
              className,
            )}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
