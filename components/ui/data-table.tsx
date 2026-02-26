"use client";

import React from "react";
import { Pagination } from "@/components/ui/pagination";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  emptyMessage?: string;
  actions?: (row: T) => React.ReactNode;
  page: number;
  pageSize: number;
  total: number;
}

export function DataTable<T extends { id: number | string }>({
  columns,
  data,
  emptyMessage = "No hay registros",
  actions,
  page,
  pageSize,
  total,
}: DataTableProps<T>) {
  const colSpan = columns.length + (actions ? 1 : 0);

  return (
    <div>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="border border-gray-300 px-4 py-2 text-left"
                >
                  {col.header}
                </th>
              ))}
              {actions && (
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="border border-gray-300 px-4 py-2"
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "-")}
                    </td>
                  ))}
                  {actions && (
                    <td className="border border-gray-300 px-4 py-2">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
