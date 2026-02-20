import "dotenv/config";
import { UserRole } from "@prisma/client";
import prisma from "../lib/prisma";
import { hashPassword } from "../lib/auth";

async function createAdminUser() {
  try {
    // Generar un email único con dominio @yopmail.com
    const timestamp = Date.now();
    const email = `admin-ferreteria@yopmail.com`;
    const password = "admin123"; // Puedes cambiar esta contraseña
    const name = "Usuario Administrador";

    console.log("🔐 Hasheando contraseña...");
    const hashedPassword = await hashPassword(password);

    console.log("👤 Creando usuario administrador...");
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        rol: UserRole.ADMIN,
        estado: true,
        businessId: 1, // Asumiendo que el negocio con ID 1 existe
      },
    });

    console.log("✅ Usuario creado exitosamente!");
    console.log("\n📋 Detalles del usuario:");
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Rol: ${user.rol}`);
    console.log(`   Contraseña: ${password}`);
    console.log(`   ID: ${user.id}`);
  } catch (error: any) {
    console.error("❌ Error al crear el usuario:", error.message);
    if (error.code === "P2002") {
      console.error("   El email ya existe en la base de datos.");
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createSuperAdminUser() {
  try {
    // Generar un email único con dominio @yopmail.com
    const timestamp = Date.now();
    const email = `super-admin-ferreteria@yopmail.com`;
    const password = "admin123"; // Puedes cambiar esta contraseña
    const name = "Usuario Administrador";

    console.log("🔐 Hasheando contraseña...");
    const hashedPassword = await hashPassword(password);

    console.log("👤 Creando usuario administrador...");
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        rol: UserRole.SUPERADMIN,
        estado: true,
      },
    });

    console.log("✅ Usuario creado exitosamente!");
    console.log("\n📋 Detalles del usuario:");
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Rol: ${user.rol}`);
    console.log(`   Contraseña: ${password}`);
    console.log(`   ID: ${user.id}`);
  } catch (error: any) {
    console.error("❌ Error al crear el usuario:", error.message);
    if (error.code === "P2002") {
      console.error("   El email ya existe en la base de datos.");
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
// Ejecutar el script
//createAdminUser();
createSuperAdminUser();
