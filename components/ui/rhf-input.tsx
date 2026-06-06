"use client";

import React from "react";
import { get, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface RhfInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
}

export function RhfInput({ name, label, ...props }: RhfInputProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = get(errors, name)?.message as string | undefined;

  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        {...register(name)}
        {...props}
        className={cn(error && "border-red-500 focus-visible:ring-red-500", props.className)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
