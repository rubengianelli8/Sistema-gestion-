import "server-only";

import type { Session } from "next-auth";
import type { UserRole } from "@prisma/client";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export interface BusinessContext {
  readonly userId: number;
  readonly userName: string;
  readonly businessId: number;
  readonly rol: UserRole;
}

export interface BranchContext extends BusinessContext {
  readonly branchId: number;
}

export class TenantError extends Error {}

function isId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function assertBusinessContext(context: BusinessContext): void {
  if (!context || !isId(context.businessId) || !isId(context.userId)) {
    throw new TenantError("No autorizado");
  }
}

export function productScope(context: BranchContext) {
  assertBusinessContext(context);
  if (!isId(context.branchId)) throw new TenantError("No autorizado");
  return { branchId: context.branchId, Branch: { businessId: context.businessId } };
}

async function loadBusinessContext(session: Session | null): Promise<BusinessContext> {
  const identity = session?.user;
  const userId = Number(identity?.id);
  if (!identity || !/^[1-9]\d*$/.test(identity.id) || !isId(userId) || !isId(identity.businessId)) {
    throw new TenantError("No autorizado");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, estado: true, businessId: true, rol: true, business: { select: { id: true } } },
  });
  if (!user || !user.estado || !isId(user.businessId) || user.businessId !== identity.businessId || user.business?.id !== identity.businessId) {
    throw new TenantError("No autorizado");
  }
  return Object.freeze({ userId: user.id, userName: user.name, businessId: user.businessId, rol: user.rol });
}

export async function requireBusinessContext(): Promise<BusinessContext> {
  return loadBusinessContext(await auth());
}

export async function requireBranchContext(): Promise<BranchContext> {
  const session = await auth();
  const context = await loadBusinessContext(session);
  const branchId = session?.user.branchId;
  if (!isId(branchId)) throw new TenantError("No autorizado");
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId: context.businessId },
    select: { id: true },
  });
  if (!branch) throw new TenantError("No autorizado");
  return Object.freeze({ ...context, branchId: branch.id });
}

export function tenantActionError(error: unknown): string {
  if (error instanceof TenantError) return error.message;
  // Do not expose Prisma errors: global unique constraints still exist until the next migration.
  return "No se pudo completar la operación. Revisá los datos ingresados.";
}
