'use strict';

// One guarded lifecycle, reused by the tenant-key regression verifier.
async function runVerification({ beforeUpgrade, verifyData } = {}) {
  const assert = (await import('node:assert/strict')).default;
  const fs = await import('node:fs');
  const path = await import('node:path');
  const os = await import('node:os');
  const crypto = await import('node:crypto');
  const { spawn } = await import('node:child_process');
  const mariadb = await import('mariadb');
  const root = path.resolve(__dirname, '..');
  const database = 'corralon_tenant_keys_test';
  const baselineName = '20261029000000_mysql_baseline';
  const target = new URL(process.env.DATABASE_URL || '');
  if (target.protocol !== 'mysql:' || target.pathname !== '/' + database || target.search || !['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) {
    throw new Error('Only the explicit local corralon_tenant_keys_test target is allowed');
  }
  const sensitive = [target.href, target.username, target.password, decodeURIComponent(target.username), decodeURIComponent(target.password)].filter(Boolean).sort((a, b) => b.length - a.length);
  const redact = value => sensitive.reduce((text, secret) => text.split(secret).join('[redacted]'), String(value)).replace(/mysql:\/\/[^\s]+/g, '[redacted URL]');
  const command = args => new Promise((resolve, reject) => {
    console.log('prisma ' + args.join(' '));
    const child = spawn(process.execPath, [path.join(root, 'node_modules/prisma/build/index.js'), ...args], {
      cwd: root, env: { ...process.env, DATABASE_URL: target.href }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { output += data; });
    child.on('error', reject);
    child.on('close', code => {
      console.log(redact(output).trim()); console.log('EXIT=' + code);
      if (code === 0) resolve(); else reject(new Error('Prisma command failed (exit ' + code + ')'));
    });
  });
  const options = { host: target.hostname.replace(/^\[|\]$/g, ''), port: Number(target.port || 3306),
    user: decodeURIComponent(target.username), password: decodeURIComponent(target.password),
    allowPublicKeyRetrieval: true, connectTimeout: 10000 };
  const admin = await mariadb.createConnection({ ...options, database: 'information_schema' });
  let created = false;
  let testConnection;
  let temporaryProject;
  try {
    const exists = await admin.query('SELECT SCHEMA_NAME FROM SCHEMATA WHERE SCHEMA_NAME = ?', [database]);
    if (exists.length) throw new Error('Test database already exists; refusing to modify or delete it');
    console.log('Preflight: disposable database absent; EXIT=0');
    const [server] = await admin.query('SELECT VERSION() AS version, @@lower_case_table_names AS casing');
    assert.match(server.version, /^8\./);
    console.log('MySQL ' + server.version + '; lower_case_table_names=' + server.casing);
    await command(['validate']);
    await admin.query('CREATE DATABASE `corralon_tenant_keys_test` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    created = true;
    console.log('CREATE DATABASE corralon_tenant_keys_test; EXIT=0');
    testConnection = await mariadb.createConnection({ ...options, database });
    const [selected] = await testConnection.query('SELECT DATABASE() AS name');
    assert.equal(selected.name, database);

    temporaryProject = fs.mkdtempSync(path.join(os.tmpdir(), 'corralon-tenant-baseline-'));
    const migrationRoot = path.join(temporaryProject, 'migrations');
    fs.mkdirSync(path.join(migrationRoot, baselineName), { recursive: true });
    fs.copyFileSync(path.join(root, 'scripts/fixtures/mysql-baseline.prisma'), path.join(temporaryProject, 'schema.prisma'));
    fs.copyFileSync(path.join(root, 'prisma/migrations/migration_lock.toml'), path.join(migrationRoot, 'migration_lock.toml'));
    fs.copyFileSync(path.join(root, 'prisma/migrations', baselineName, 'migration.sql'), path.join(migrationRoot, baselineName, 'migration.sql'));
    const baselineConfig = path.join(temporaryProject, 'prisma.config.ts');
    fs.writeFileSync(baselineConfig, 'export default { schema: ' + JSON.stringify(path.join(temporaryProject, 'schema.prisma')) + ', migrations: { path: ' + JSON.stringify(migrationRoot) + ' }, datasource: { url: process.env.DATABASE_URL } };\n');
    await command(['migrate', 'deploy', '--config', baselineConfig]);
    await command(['migrate', 'status', '--config', baselineConfig]);
    await command(['migrate', 'diff', '--from-config-datasource', '--to-schema', 'scripts/fixtures/mysql-baseline.prisma', '--exit-code']);
    const [baselineKeys] = await admin.query('SELECT COUNT(*) AS n FROM REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = ?', [database]);
    const baselineSql = fs.readFileSync(path.join(root, 'prisma/migrations', baselineName, 'migration.sql'), 'utf8');
    assert.equal(Number(baselineKeys.n), (baselineSql.match(/ADD CONSTRAINT/g) || []).length);
    const history = await testConnection.query('SELECT migration_name AS name, checksum, finished_at AS finished FROM `_prisma_migrations` WHERE rolled_back_at IS NULL');
    assert.equal(history.length, 1); assert.equal(history[0].name, baselineName); assert.ok(history[0].finished);
    const normalizedChecksums = [baselineSql, baselineSql.replace(/\r\n/g, '\n'), baselineSql.replace(/\r?\n/g, '\r\n')].map(sql => crypto.createHash('sha256').update(sql).digest('hex'));
    assert.ok(normalizedChecksums.includes(history[0].checksum));
    console.log('Original baseline verified independently, including schema equivalence and migration history; EXIT=0');
    if (beforeUpgrade) await beforeUpgrade(testConnection);

    await command(['migrate', 'deploy']);
    await command(['migrate', 'status']);
    await command(['migrate', 'diff', '--from-config-datasource', '--to-schema', 'prisma/schema.prisma', '--exit-code']);
    const models = [...fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8').matchAll(/^model\s+(\w+)\s*\{/gm)].map(match => match[1]);
    const tables = await admin.query('SELECT TABLE_NAME AS name, ENGINE AS engine, TABLE_COLLATION AS collation FROM TABLES WHERE TABLE_SCHEMA = ?', [database]);
    const expected = models.map(name => Number(server.casing) === 0 ? name : name.toLowerCase()).concat('_prisma_migrations').sort();
    assert.deepEqual(tables.map(table => table.name).sort(), expected);
    for (const table of tables) { assert.equal(table.engine, 'InnoDB'); if (table.name !== '_prisma_migrations') assert.equal(table.collation, 'utf8mb4_unicode_ci'); }
    const columns = await admin.query('SELECT TABLE_NAME AS tableName, COLUMN_NAME AS name, COLUMN_TYPE AS type, IS_NULLABLE AS nullable, COLUMN_DEFAULT AS defaultValue FROM COLUMNS WHERE TABLE_SCHEMA = ?', [database]);
    const column = (table, name) => columns.find(value => value.tableName.toLowerCase() === table.toLowerCase() && value.name === name);
    assert.equal(column('Product', 'precio').type, 'double'); assert.equal(Number(column('Product', 'precio').defaultValue), 0);
    assert.equal(column('User', 'businessId').nullable, 'YES'); assert.ok(column('User', 'rol').type.includes("'SUPERADMIN'"));
    const [emailIndex] = await admin.query("SELECT COUNT(*) AS n FROM STATISTICS WHERE TABLE_SCHEMA = ? AND INDEX_NAME = 'User_email_key' AND NON_UNIQUE = 0", [database]);
    assert.equal(Number(emailIndex.n), 1);
    const [finalKeys] = await admin.query('SELECT COUNT(*) AS n FROM REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = ?', [database]);
    console.log('Final metadata verified: ' + models.length + ' domain tables, ' + finalKeys.n + ' foreign keys; drift check preserved; EXIT=0');
    if (verifyData) await verifyData(testConnection);
  } finally {
    try { if (testConnection) await testConnection.end(); }
    finally {
      try {
        if (created) {
          await admin.query('DROP DATABASE `corralon_tenant_keys_test`');
          const remaining = await admin.query('SELECT SCHEMA_NAME FROM SCHEMATA WHERE SCHEMA_NAME = ?', [database]);
          assert.equal(remaining.length, 0);
          console.log('DROP DATABASE corralon_tenant_keys_test; absence confirmed; EXIT=0');
        }
      } finally {
        await admin.end();
        if (temporaryProject) {
          const resolved = path.resolve(temporaryProject);
          if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(resolved).startsWith('corralon-tenant-baseline-')) throw new Error('Unexpected temporary project path');
          fs.rmSync(resolved, { recursive: true, force: true });
        }
      }
    }
  }
}
module.exports = { runVerification };
if (require.main === module) runVerification().catch(error => {
  console.error('Verification failed: ' + (error.code || 'safe verification failure'));
  process.exitCode = 1;
});
