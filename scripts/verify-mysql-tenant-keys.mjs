import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import baseline from "./verify-mysql-baseline.cjs";

let checks = 0;
async function rejected(label, execute, expectedCodes) {
  let rejected = false;
  try { await execute(); }
  catch (error) {
    assert.ok(expectedCodes.includes(error.errno), `${label}: unexpected database error code ${error.errno}`);
    rejected = true;
  }
  assert.ok(rejected, `${label}: constraint accepted invalid data`);
  console.log(`OK ${++checks}: ${label}`);
}
function passed(label) { console.log(`OK ${++checks}: ${label}`); }
async function insert(db, table, fields) {
  const keys = Object.keys(fields);
  const result = await db.query(`INSERT INTO \`${table}\` (${keys.map(key => `\`${key}\``).join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`, Object.values(fields));
  return Number(result.insertId);
}

async function beforeUpgrade(db) {
  const id = await insert(db, "Supplier", { nombre: "Proveedor heredado sin negocio", updatedAt: new Date() });
  const migration = readFileSync(fileURLToPath(new URL("../prisma/migrations/20261112000000_add_tenant_keys_catalogs/migration.sql", import.meta.url)), "utf8");
  const guard = migration.slice(0, migration.indexOf("-- DropForeignKey"));
  assert.ok(guard.includes("tenant_keys_require_empty_catalogs"));
  try {
    await rejected("migration stops on ambiguous legacy supplier before DDL", async () => {
      for (const statement of guard.split(";").map(sql => sql.trim()).filter(Boolean)) await db.query(statement);
    }, [1062]);
  } finally {
    await db.query("DROP TEMPORARY TABLE IF EXISTS `_tenant_keys_empty_guard`");
    await db.query("DELETE FROM `Supplier` WHERE `id` = ?", [id]);
  }
}

async function verifyData(db) {
  const now = new Date();
  const a = await insert(db, "Business", { nombre: "Negocio A de prueba", updatedAt: now });
  const b = await insert(db, "Business", { nombre: "Negocio B de prueba", updatedAt: now });
  const a1 = await insert(db, "Branch", { businessId: a, number: 1, updatedAt: now });
  const a2 = await insert(db, "Branch", { businessId: a, number: 2, updatedAt: now });
  const b1 = await insert(db, "Branch", { businessId: b, number: 1, updatedAt: now });
  const ca = await insert(db, "Category", { businessId: a, nombre: "Catálogo" });
  const cb = await insert(db, "Category", { businessId: b, nombre: "Catálogo" });
  passed("same category name allowed across businesses using returned IDs");
  await rejected("category name unique within business and collation", () => insert(db, "Category", { businessId: a, nombre: "catalogo" }), [1062]);

  const customer = { nombre: "Cliente", dni: "documento-compartido", email: "shared@example.test", telefono: "", direccion: "", updatedAt: now };
  await insert(db, "Client", { ...customer, businessId: a });
  await insert(db, "Client", { ...customer, businessId: b });
  passed("same client DNI and email allowed across businesses");
  await rejected("client DNI unique within business", () => insert(db, "Client", { ...customer, businessId: a, email: "other@example.test" }), [1062]);
  await rejected("client email unique within business", () => insert(db, "Client", { ...customer, businessId: a, dni: "otro-documento" }), [1062]);
  for (const suffix of ["one", "two"]) await insert(db, "Client", { ...customer, businessId: a, dni: "sin-email-" + suffix, email: null });
  passed("multiple client NULL emails allowed within business");

  const supplier = { nombre: "Proveedor", cuit: "20123456786", updatedAt: now };
  const sa = await insert(db, "Supplier", { ...supplier, businessId: a });
  const sb = await insert(db, "Supplier", { ...supplier, businessId: b });
  passed("same supplier CUIT allowed across businesses");
  await rejected("supplier CUIT unique within business", () => insert(db, "Supplier", { ...supplier, businessId: a }), [1062]);
  for (const name of ["Sin CUIT A", "Sin CUIT B"]) await insert(db, "Supplier", { nombre: name, businessId: a, cuit: null, email: null, updatedAt: now });
  passed("multiple supplier NULL CUIT and email values allowed");

  const product = { nombre: "Producto", businessId: a, branchId: a1, categoriaId: ca, codigoBarras: "BARCODE-COMPARTIDO", updatedAt: now };
  const pa = await insert(db, "Product", product);
  await insert(db, "Product", { ...product, branchId: a2 });
  const pb = await insert(db, "Product", { ...product, businessId: b, branchId: b1, categoriaId: cb });
  passed("barcode allowed in different branches and businesses");
  await rejected("barcode unique within the same business and branch", () => insert(db, "Product", product), [1062]);
  await rejected("Product rejects a branch from another business", () => insert(db, "Product", { ...product, branchId: b1, codigoBarras: null }), [1452]);
  await rejected("Product rejects a category from another business", () => insert(db, "Product", { ...product, categoriaId: cb, codigoBarras: null }), [1452]);
  await rejected("Product update cannot cross category boundary", () => db.query("UPDATE `Product` SET `categoriaId` = ? WHERE `id` = ?", [cb, pa]), [1452]);
  await rejected("Product update cannot cross branch boundary", () => db.query("UPDATE `Product` SET `branchId` = ? WHERE `id` = ?", [b1, pa]), [1452]);
  for (const name of ["Sin barcode A", "Sin barcode B"]) await insert(db, "Product", { ...product, nombre: name, codigoBarras: null, categoriaId: null });
  passed("multiple NULL barcodes and optional categories allowed");
  await rejected("Category deletion is restrictive while used", () => db.query("DELETE FROM `Category` WHERE `id` = ?", [ca]), [1451]);

  await insert(db, "SupplierPrice", { businessId: a, productoId: pa, proveedorId: sa, precio: 12 });
  await insert(db, "SupplierPrice", { businessId: b, productoId: pb, proveedorId: sb, precio: 12 });
  passed("tenant-consistent supplier prices accepted");
  await rejected("supplier price triple unique", () => insert(db, "SupplierPrice", { businessId: a, productoId: pa, proveedorId: sa, precio: 13 }), [1062]);
  await rejected("SupplierPrice rejects foreign product", () => insert(db, "SupplierPrice", { businessId: a, productoId: pb, proveedorId: sa, precio: 12 }), [1452]);
  await rejected("SupplierPrice rejects foreign supplier", () => insert(db, "SupplierPrice", { businessId: a, productoId: pa, proveedorId: sb, precio: 12 }), [1452]);
  await rejected("SupplierPrice tenant cannot be reassigned inconsistently", () => db.query("UPDATE `SupplierPrice` SET `businessId` = ? WHERE `businessId` = ? AND `productoId` = ? AND `proveedorId` = ?", [b, a, pa, sa]), [1452]);

  for (const [table, fields] of [
    ["Product", { nombre: "Sin negocio", branchId: a1, updatedAt: now }],
    ["Supplier", { nombre: "Sin negocio", updatedAt: now }],
    ["SupplierPrice", { productoId: pa, proveedorId: sa, precio: 12 }],
  ]) {
    await rejected(`${table}.businessId must be supplied`, () => insert(db, table, fields), [1364, 1048]);
    await rejected(`${table}.businessId cannot be NULL`, () => insert(db, table, { ...fields, businessId: null }), [1048]);
  }
  const user = { email: "identity@example.test", name: "Usuario de prueba", password: "fixture-only", rol: "ADMIN", updatedAt: now };
  await insert(db, "User", { ...user, businessId: a });
  await rejected("User.email remains globally unique", () => insert(db, "User", { ...user, businessId: b }), [1062]);
  const [unitColumns] = await db.query("SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'unit' AND COLUMN_NAME = 'businessId'");
  assert.equal(Number(unitColumns.n), 0);
  passed("Unit remains global without schema or data changes");
  console.log(`${checks} tenant-key database checks passed; EXIT=0`);
}

baseline.runVerification({ beforeUpgrade, verifyData }).catch(error => {
  console.error("Tenant-key verification failed: " + (error.code || "safe verification failure"));
  if (error.code === "ERR_ASSERTION" || /^(Only the explicit|Test database already exists|Prisma command failed|Unexpected temporary project path)/.test(error.message)) console.error(error.message);
  if (!error.code) console.error(error.name + " at " + (error.stack?.split("\n")[1]?.trim() || "verification"));
  process.exitCode = 1;
});
