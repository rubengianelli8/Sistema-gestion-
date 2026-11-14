import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";
import ts from "typescript";
import { z } from "zod";

// Same dependency-free verification approach as verify-mysql-baseline.cjs.
// Compile existing TS in memory. Every runtime import must be explicitly mocked;
// the real auth/Prisma/S3 modules are never loaded and no database is contacted.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function load(file, dependencies) {
  const source = readFileSync(resolve(root, file), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  const sandboxModule = { exports: {} };
  const mockedRequire = name => {
    assert.ok(Object.hasOwn(dependencies, name), `Unmocked import in ${file}: ${name}`);
    return dependencies[name];
  };
  runInThisContext(`(function(require, module, exports) {${outputText}\n})`, { filename: file })(mockedRequire, sandboxModule, sandboxModule.exports);
  return sandboxModule.exports;
}
const defaultModule = value => ({ __esModule: true, default: value });
let checks = 0;
async function check(label, run) {
  await run();
  console.log(`OK ${++checks}: ${label}`);
}

function fixture() {
  const session = { user: { id: "9", name: "Nombre anterior de sesión", businessId: 23, branchId: 47, rol: "SUPERADMIN" } };
  const user = { id: 9, name: "Nombre vigente en base", estado: true, businessId: 23, rol: "ADMIN", business: { id: 23 } };
  const branch = { id: 47, businessId: 23 };
  const state = { session, user, branch, authReads: 0, userReads: 0 };
  const auth = async () => { state.authReads++; return state.session; };
  const db = {
    user: { findUnique: async ({ select }) => {
      state.userReads++;
      assert.equal(select.name, true, "User.name must be selected from the database");
      return state.user;
    } },
    branch: { findFirst: async ({ where }) => state.branch && state.branch.id === where.id &&
      (where.businessId === undefined || state.branch.businessId === where.businessId) ? { id: state.branch.id } : null },
  };
  const tenant = load("lib/tenant-context.ts", {
    "server-only": {}, "@/app/api/auth/[...nextauth]/route": { auth },
    "@/lib/prisma": defaultModule(db),
  });
  return { state, db, tenant, auth };
}

for (const [label, change] of [
  ["missing session", f => { f.state.session = null; }],
  ["missing user", f => { f.state.user = null; }],
  ["inactive user", f => { f.state.user.estado = false; }],
  ["SUPERADMIN without business", f => { f.state.session.user.businessId = null; f.state.user.businessId = null; }],
  ["business changed since login", f => { f.state.user.businessId = 88; }],
  ["missing business", f => { f.state.user.business = null; }],
  ["malformed identity", f => { f.state.session.user.id = "9invalid"; }],
]) await check(label, async () => {
  const f = fixture(); change(f);
  await assert.rejects(f.tenant.requireBusinessContext, /No autorizado/);
});

await check("context uses current database name and role, not stale session values", async () => {
  const { tenant } = fixture();
  assert.deepEqual(await tenant.requireBusinessContext(), { userId: 9, userName: "Nombre vigente en base", businessId: 23, rol: "ADMIN" });
});
for (const [label, change] of [
  ["missing branch", f => { f.state.session.user.branchId = null; }],
  ["deleted branch", f => { f.state.branch = null; }],
  ["branch belonging to another business", f => { f.state.branch.businessId = 88; }],
]) await check(label, async () => {
  const f = fixture(); change(f);
  await assert.rejects(f.tenant.requireBranchContext, /No autorizado/);
});

function matches(row, where) {
  return Object.entries(where).every(([key, value]) => {
    assert.notEqual(value, undefined, `Undefined filter: ${key}`);
    if (key === "OR") return value.some(part => matches(row, part));
    if (value && typeof value === "object") {
      if (Object.hasOwn(value, "not")) return row[key] !== value.not;
      if (Object.hasOwn(value, "contains")) return String(row[key] ?? "").includes(value.contains);
      if (Object.hasOwn(value, "gt")) return row[key] > value.gt;
      if (Object.hasOwn(value, "in")) return value.in.includes(row[key]);
      return !!row[key] && matches(row[key], value);
    }
    return row[key] === value;
  });
}
function table(rows, writes) {
  return {
    findFirst: async ({ where }) => rows.find(row => matches(row, where)) ?? null,
    findMany: async ({ where }) => rows.filter(row => matches(row, where)),
    count: async ({ where }) => rows.filter(row => matches(row, where)).length,
    create: async ({ data }) => { writes.push(data); return { id: 900, ...data }; },
    update: async ({ where, data }) => {
      const row = rows.find(row => matches(row, where));
      if (!row) throw new Error("ORM row unavailable");
      writes.push(data); return { ...row, ...data };
    },
    delete: async ({ where }) => {
      const row = rows.find(row => matches(row, where));
      if (!row) throw new Error("ORM row unavailable");
      writes.push({ deleted: row.id }); return row;
    },
  };
}
const f = fixture();
const context = await f.tenant.requireBranchContext();
const writes = [];
const categories = [{ id: 101, businessId: 23, nombre: "Propia" }, { id: 102, businessId: 88, nombre: "Ajena" }];
const clients = [{ id: 201, businessId: 23, dni: "a", email: "a@example.test", activo: true },
  { id: 202, businessId: 88, dni: "b", email: "b@example.test", activo: true }];
const products = [
  { id: 301, businessId: 23, branchId: 47, Branch: { businessId: 23 }, categoriaId: 101, nombre: "Producto", codigoBarras: "a", stock: 4 },
  { id: 302, businessId: 88, branchId: 99, Branch: { businessId: 88 }, nombre: "Producto ajeno", codigoBarras: "b", stock: 4 },
  { id: 303, businessId: 23, branchId: 48, Branch: { businessId: 23 }, nombre: "Otra sucursal", codigoBarras: "c", stock: 4 },
];
const suppliers = [{ id: 401, businessId: 23, nombre: "Propio", cuit: "20123456786", activo: true },
  { id: 402, businessId: 88, nombre: "Ajeno", cuit: "30987654321", activo: true }];
const priceWrites = [];
Object.assign(f.db, { category: table(categories, writes), client: table(clients, writes), product: table(products, writes), supplier: table(suppliers, writes),
  supplierPrice: { deleteMany: async () => { writes.push("supplier price delete"); }, upsert: async args => { priceWrites.push(args); writes.push("supplier price upsert"); return args.create; } } });
const values = load("lib/catalog-values.ts", { "server-only": {} });
const dependencies = { "@/lib/prisma": defaultModule(f.db), "@/lib/tenant-context": f.tenant, "@/lib/catalog-values": values };
const categoryModule = load("repositories/category.repository.ts", dependencies);
const customerModule = load("repositories/customer.repository.ts", dependencies);
const productModule = load("repositories/product.repository.ts", dependencies);
const supplierModule = load("repositories/supplier.repository.ts", dependencies);
const category = new categoryModule.CategoryRepository();
const customer = new customerModule.CustomerRepository();
const product = new productModule.ProductRepository();
const supplier = new supplierModule.SupplierRepository();
const categoryService = new (load("services/category.service.ts", { ...dependencies, "@/repositories/category.repository": categoryModule }).CategoryService)(category);
const customerService = new (load("services/customer.service.ts", { ...dependencies, "@/repositories/customer.repository": customerModule }).CustomerService)(customer);
const productService = new (load("services/product.service.ts", { ...dependencies, "@/repositories/product.repository": productModule }).ProductService)(product);
const supplierService = new (load("services/supplier.service.ts", { ...dependencies, "@/repositories/supplier.repository": supplierModule }).SupplierService)(supplier);

await check("category list, detail and name checks stay in business", async () => {
  assert.deepEqual((await category.findAll(context)).map(row => row.id), [101]);
  assert.equal(await category.findById(context, 102), null);
  assert.equal(await category.findByName(context, "Ajena"), null);
  assert.equal(await category.nameExists(context, "Ajena"), false);
  await assert.rejects(() => categoryService.getCategoryById(context, 102), /Categoría no encontrada/);
  await assert.rejects(() => categoryService.updateCategory(context, 102, { nombre: "changed" }), /Categoría no encontrada/);
  await assert.rejects(() => categoryService.deleteCategory(context, 102), /Categoría no encontrada/);
});
await check("client detail, DNI, email and inactive-inclusive list stay in business", async () => {
  assert.deepEqual((await customer.findAll(context, true)).map(row => row.id), [201]);
  assert.equal(await customer.findByDni(context, "b"), null);
  assert.equal(await customer.findByEmail(context, "b@example.test"), null);
  await assert.rejects(() => customerService.getCustomerById(context, 202), /Cliente no encontrado/);
  await assert.rejects(() => customerService.updateCustomer(context, 202, { nombre: "changed" }), /Cliente no encontrado/);
  await assert.rejects(() => customerService.deleteCustomer(context, 202), /Cliente no encontrado/);
});
await check("all product reads, barcode and pagination exclude other businesses and branches", async () => {
  assert.deepEqual((await product.findAll(context)).map(row => row.id), [301]);
  assert.equal(await product.findById(context, 302), null);
  assert.equal(await product.findById(context, 303), null);
  assert.equal(await product.findByBarcode(context, "b"), null);
  assert.deepEqual((await product.search(context, "Producto")).map(row => row.id), [301]);
  assert.deepEqual((await product.searchForSale(context, "Producto")).map(row => row.id), [301]);
  assert.equal((await product.findPaginated(context, { skip: 0, take: 20 })).total, 1);
  await assert.rejects(() => productService.updateProduct(context, 302, { nombre: "changed" }), /Producto no encontrado/);
  await assert.rejects(() => productService.deleteProduct(context, 302), /Producto no encontrado/);
});
await check("foreign category rejected before product creation or modification", async () => {
  const before = writes.length;
  await assert.rejects(() => productService.createProduct(context, { nombre: "new", categoriaId: 102 }), /Categoría no encontrada/);
  await assert.rejects(() => productService.updateProduct(context, 301, { categoriaId: 102 }), /Categoría no encontrada/);
  assert.equal(writes.length, before);
});
await check("mutations use scoped where clauses and reject bypassing service checks", async () => {
  for (const [repo, id] of [[category, 102], [customer, 202], [product, 302]]) {
    await assert.rejects(() => repo.update(context, id, { nombre: "changed" }));
    await assert.rejects(() => repo.delete(context, id));
  }
});
await check("creation ignores injected tenant IDs and never falls back to 1", async () => {
  const a = await category.create(context, { nombre: "new", businessId: 88 });
  const b = await customer.create(context, { nombre: "new", dni: "new", telefono: "", direccion: "", businessId: 88 });
  const c = await product.create(context, { nombre: "new", branchId: 99 });
  assert.equal(a.businessId, 23); assert.equal(b.businessId, 23); assert.equal(c.branchId, 47); assert.equal(c.businessId, 23);
  await assert.rejects(() => category.create(undefined, { nombre: "new" }), /No autorizado/);
  await assert.rejects(() => product.create({ ...context, branchId: undefined }, { nombre: "new" }), /No autorizado/);
});

const permissionChecks = [];
const actionDeps = { ...dependencies, "@/services": { categoryService, customerService, productService, supplierService },
  "@/lib/permissions": { requirePermission: role => permissionChecks.push(role), Permission: {} },
  "next/cache": { revalidatePath: () => {} }, "@/lib/s3": { deleteFileFromS3ByUrl: async () => {} } };
const validation = load("lib/validations/category.schema.ts", { zod: { z } });
const categoryActions = load("app/actions/category.actions.ts", { ...actionDeps, "@/lib/validations/category.schema": validation });
const productActions = load("app/actions/product.actions.ts", actionDeps);
await check("server action ignores form business/role and authorizes with current role", async () => {
  const result = await categoryActions.createCategoryAction({ nombre: "Nueva", businessId: 88, rol: "SUPERADMIN" });
  assert.equal(result.success, true);
  assert.equal(result.data.businessId, 23);
  assert.equal(permissionChecks.at(-1), "ADMIN");
});
await check("foreign product action cannot update supplier prices or images", async () => {
  const before = writes.length;
  const result = await productActions.updateProductAction("302", { nombre: "changed", supplierPrices: [] });
  assert.equal(result.success, false);
  assert.equal(result.error, "Producto no encontrado");
  assert.equal(writes.length, before);
});
await check("supplier CRUD and product-price lookup are tenant scoped", async () => {
  assert.deepEqual((await supplier.findAll(context, true)).map(row => row.id), [401]);
  assert.equal(await supplier.findByCuit(context, "30-98765432-1"), null);
  assert.equal((await supplier.findByCuit(context, "20-12345678-6")).id, 401);
  await assert.rejects(() => supplierService.getSupplierById(context, 402), /Proveedor no encontrado/);
  await assert.rejects(() => supplierService.updateSupplier(context, 402, { nombre: "changed" }), /Proveedor no encontrado/);
  await assert.rejects(() => supplierService.deleteSupplier(context, 402), /Proveedor no encontrado/);
  await assert.rejects(() => supplierService.getSuppliersByProduct(context, 302), /Producto no encontrado/);
  await assert.rejects(() => supplierService.createSupplier(context, { nombre: "Duplicado", cuit: "20-12345678-6" }), /Ya existe un proveedor/);
});
await check("optional barcode, supplier CUIT and email are normalized on server", async () => {
  const created = await supplier.create(context, { nombre: "Nuevo", cuit: "   ", email: "   ", businessId: 88 });
  assert.equal(created.businessId, 23); assert.equal(created.cuit, null); assert.equal(created.email, null);
  const edited = await supplier.update(context, 401, { cuit: "", email: "" });
  assert.equal(edited.cuit, null); assert.equal(edited.email, null);
  assert.equal(values.optionalCuit("20-12345678-6"), "20123456786");
  assert.equal((await product.create(context, { nombre: "Sin código", codigoBarras: "   " })).codigoBarras, null);
  assert.equal((await product.update(context, 301, { codigoBarras: "" })).codigoBarras, null);
  assert.equal((await product.update(context, 301, { nombre: "Sin cambio de código" })).codigoBarras, undefined);
});
await check("foreign suppliers cannot cause partial product creation or updates", async () => {
  const before = writes.length;
  const prices = [{ proveedorId: 402, precio: 12 }];
  assert.equal((await productActions.createProductAction({ nombre: "Nuevo", supplierPrices: prices })).success, false);
  assert.equal((await productActions.updateProductAction("301", { nombre: "changed", supplierPrices: prices })).success, false);
  assert.equal(writes.length, before);
});
await check("product price writer takes tenant from context, ignoring injected business", async () => {
  const result = await productActions.createProductAction({ nombre: "Nuevo", supplierPrices: [{ proveedorId: 401, precio: 12, businessId: 88 }] });
  assert.equal(result.success, true);
  const price = priceWrites.at(-1);
  assert.equal(price.create.businessId, 23);
  assert.deepEqual(price.where.businessId_productoId_proveedorId, { businessId: 23, productoId: result.data.id, proveedorId: 401 });
});
await check("purchase validates suppliers and writes prices using the same business", async () => {
  f.db.$transaction = async run => run(f.db);
  const PurchaseService = load("services/purchase.service.ts", { ...dependencies, "@/repositories/purchase.repository": {}, "@prisma/client": { PurchaseStatus: { CANCELADA: "CANCELADA" } } }).PurchaseService;
  const service = new PurchaseService({ create: async data => ({ id: 901, ...data }) });
  const purchase = { proveedorId: 402, items: [{ productoId: 301, cantidad: 2, precioUnitario: 12 }] };
  const before = writes.length;
  await assert.rejects(() => service.createPurchase(purchase, context), /Proveedor no encontrado/);
  assert.equal(writes.length, before);
  await service.createPurchase({ ...purchase, proveedorId: 401 }, context);
  assert.equal(priceWrites.at(-1).create.businessId, 23);
  assert.deepEqual(priceWrites.at(-1).where.businessId_productoId_proveedorId, { businessId: 23, productoId: 301, proveedorId: 401 });
});
await check("ORM and cross-business uniqueness details are not returned", async () => {
  const message = f.tenant.tenantActionError(new Error("P2002 private database record"));
  assert.ok(!message.includes("private"));
  assert.ok(!message.includes("P2002"));
});

for (const operation of ["Sale", "Quote"]) await check(`${operation} creation uses revalidated identity with exactly one session read`, async () => {
  const identity = fixture();
  identity.state.session.user.id = "29";
  identity.state.user.id = 29;
  const calls = [];
  const permissions = [];
  const lookups = [];
  const serviceName = operation.toLowerCase() + "Service";
  const createName = "create" + operation;
  const validationName = operation.toLowerCase();
  const validationDependencies = { zod: { z } };
  if (operation === "Sale") validationDependencies["@prisma/client"] = {
    PaymentMethod: { EFECTIVO: "EFECTIVO", TARJETA: "TARJETA", TRANSFERENCIA: "TRANSFERENCIA" },
  };
  const schemas = load(`lib/validations/${validationName}.schema.ts`, validationDependencies);
  const actions = load(`app/actions/${validationName}.actions.ts`, {
    "@/app/api/auth/[...nextauth]/route": { auth: identity.auth },
    "@/lib/tenant-context": identity.tenant,
    "@/services": {
      [serviceName]: { [createName]: async (...args) => { calls.push(args); return { id: 501 }; } },
      productService: { getProductById: async (scope, id) => {
        lookups.push(scope);
        return { id, nombre: "Producto", precio: 10, stock: 5 };
      } },
    },
    "@/lib/permissions": {
      Permission: { VENTAS_CREAR: "VENTAS_CREAR", PRESUPUESTOS_CREAR: "PRESUPUESTOS_CREAR" },
      requirePermission: (role, permission) => permissions.push({ role, permission }),
    },
    [`@/lib/validations/${validationName}.schema`]: schemas,
    "next/cache": { revalidatePath: () => {} },
  });
  const result = await actions[createName + "Action"]({
    clienteId: 201, metodoPago: "EFECTIVO", validezDias: 15,
    items: [{ productoId: 301, cantidad: 1 }],
    vendedorId: 999, vendedorNombre: "Nombre enviado por navegador",
  });
  assert.equal(result.success, true);
  assert.equal(calls.length, 1);
  const [data, actorId, actorName] = calls[0];
  assert.equal(data.vendedorId, identity.state.user.id);
  assert.equal(data.vendedorNombre, identity.state.user.name);
  assert.equal(actorId, identity.state.user.id);
  assert.equal(actorName, identity.state.user.name);
  assert.notEqual(actorName, identity.state.session.user.name);
  assert.equal(permissions[0].role, identity.state.user.rol);
  assert.equal(permissions[0].permission, operation === "Sale" ? "VENTAS_CREAR" : "PRESUPUESTOS_CREAR");
  assert.equal(lookups[0].userId, identity.state.user.id);
  assert.equal(lookups[0].userName, identity.state.user.name);
  assert.equal(lookups[0].businessId, identity.state.user.businessId);
  if (operation === "Sale") assert.equal(data.branchId, identity.state.branch.id);
  assert.equal(identity.state.authReads, 1, "Creation must not call auth() independently of the context helper");
  assert.equal(identity.state.userReads, 1, "Creation must use a single revalidated identity");
});

await check("actions using tenant context do not mix direct session identity or extra auth calls", () => {
  let inspected = 0;
  for (const file of readdirSync(resolve(root, "app/actions")).filter(name => name.endsWith(".ts"))) {
    const source = ts.createSourceFile(file, readFileSync(resolve(root, "app/actions", file), "utf8"), ts.ScriptTarget.Latest, true);
    for (const statement of source.statements) {
      if (!ts.isFunctionDeclaration(statement) || !statement.body) continue;
      let contextCalls = 0;
      let authCalls = 0;
      let sessionIdentityReads = 0;
      function inspect(node) {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
          if (["requireBusinessContext", "requireBranchContext"].includes(node.expression.text)) contextCalls++;
          if (node.expression.text === "auth") authCalls++;
        }
        if (ts.isPropertyAccessExpression(node) && ["id", "name", "rol"].includes(node.name.text) &&
          ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "user" &&
          ts.isIdentifier(node.expression.expression) && node.expression.expression.text === "session") sessionIdentityReads++;
        ts.forEachChild(node, inspect);
      }
      inspect(statement.body);
      if (!contextCalls) continue;
      const label = `${file}:${statement.name.text}`;
      assert.equal(authCalls, 0, label + " must obtain its session only through the context helper");
      assert.equal(sessionIdentityReads, 0, label + " must use revalidated identity and role");
      inspected++;
    }
  }
  assert.ok(inspected > 0, "No context-adopting actions inspected");
});
console.log(`${checks} checks passed; no database connection or writes performed.`);
