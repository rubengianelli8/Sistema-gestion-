import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import prisma from "@/lib/prisma";

import { UserRole } from "@prisma/client";
import { verifyPassword } from "@/lib/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        // Verificar si el usuario está activo
        if (!user.estado) {
          throw new Error("Usuario inactivo");
        }

        // Verificar contraseña
        const isValid = await verifyPassword(
          credentials.password as string,
          user.password,
        );

        if (!isValid) {
          return null;
        }

        // Actualizar último login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });
const firtsBranchBusiness = await prisma.branch.findFirst({
  where: {
    businessId: user.businessId,
  },
});
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          rol: user.rol,
          businessId: user.businessId,
          branchId: firtsBranchBusiness?.id ?? 0,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = user.rol;
        token.businessId = user.businessId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as UserRole;
        session.user.businessId = token.businessId as number;
      }
      return session;
    },
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;

// Especificar Node.js runtime para soportar bcryptjs
export const runtime = "nodejs";
