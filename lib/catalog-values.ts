import "server-only";

export function optionalText(value: string | null | undefined): string | null | undefined {
  return value === undefined ? undefined : value?.trim() || null;
}

export function optionalCuit(value: string | null | undefined): string | null | undefined {
  const text = optionalText(value);
  return text == null ? text : text.replace(/[.\s-]/g, "") || null;
}
