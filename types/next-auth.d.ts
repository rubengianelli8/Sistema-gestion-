import { UserRole } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      rol: UserRole;
      businessId: number;
      branchId: number;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    rol: UserRole;
    businessId: number;
    branchId: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: UserRole;
    businessId: number;
    branchId: number;
  }
}

