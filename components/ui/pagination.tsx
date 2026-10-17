"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
}

export function Pagination({ page, pageSize, total }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const navigateTo = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    params.set("pageSize", String(pageSize));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mt-4 flex flex-col items-center gap-3 px-2 py-3 sm:flex-row sm:justify-between">
      <span className="text-center text-sm text-gray-600 sm:text-left">
        Página {page} de {totalPages}
        <span className="ml-2 text-gray-400">({total} registros)</span>
      </span>
      <div className="flex w-full gap-2 sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateTo(page - 1)}
          disabled={page <= 1}
          className="min-w-0 flex-1 sm:flex-none"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateTo(page + 1)}
          disabled={page >= totalPages}
          className="min-w-0 flex-1 sm:flex-none"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
