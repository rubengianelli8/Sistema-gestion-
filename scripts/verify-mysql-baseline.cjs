'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const mariadb = require('mariadb');
const root = path.resolve(__dirname, '..');
const database = 'corralon_baseline_test';
const cli = path.join(root, 'node_modules/prisma/build/index.js');
async function main() {
  // Never load .env: callers must explicitly supply the disposable target.
  const target = new URL(process.env.DATABASE_URL || '');
  if (target.protocol !== 'mysql:') throw new Error('Only MySQL is supported');
  if (target.pathname !== '/' + database) throw new Error('Refusing any database except corralon_baseline_test');
  if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) throw new Error('Only a local disposable server is supported');
  if (target.search) throw new Error('URL query options are not supported');
  const sensitive = [target.href, target.username, target.password, decodeURIComponent(target.username), decodeURIComponent(target.password)].filter(Boolean).sort((a, b) => b.length - a.length);
  const redact = value => sensitive.reduce((text, secret) => text.split(secret).join('[redacted]'), String(value)).replace(/mysql:\/\/[^\s]+/g, '[redacted URL]');
  const command = args => new Promise((resolve, reject) => {
    console.log('prisma ' + args.join(' '));
    const child = spawn(process.execPath, [cli, ...args], {cwd: root, env: {...process.env, DATABASE_URL: target.href}, stdio: ['ignore', 'pipe', 'pipe']});
    let output = '';
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { output += data; });
    child.on('error', reject);
    child.on('close', code => {
      console.log(redact(output).trim());
      console.log('EXIT=' + code);
      if (code === 0) resolve();
      else reject(new Error('Prisma verification failed (exit ' + code + ')'));
    });
  });
  const connection = await mariadb.createConnection({
    host: target.hostname.replace(/^\[|\]$/g, ''), port: Number(target.port || 3306),
    user: decodeURIComponent(target.username), password: decodeURIComponent(target.password),
    database: 'information_schema', allowPublicKeyRetrieval: true, connectTimeout: 10000,
  });
  let created = false;
  try {
    const existing = await connection.query('SELECT SCHEMA_NAME FROM SCHEMATA WHERE SCHEMA_NAME = ?', [database]);
    if (existing.length) throw new Error('Test database already exists; refusing to change or delete it');
    console.log('Preflight: test database absent; EXIT=0');
    await command(['validate']);
    const [server] = await connection.query('SELECT VERSION() AS version, @@lower_case_table_names AS casing');
    console.log('Server: ' + server.version + '; lower_case_table_names=' + server.casing);
    assert.match(server.version, /^8\./, 'MySQL 8 is required');
    await connection.query('CREATE DATABASE `corralon_baseline_test` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    created = true;
    console.log('CREATE DATABASE corralon_baseline_test; EXIT=0');
    await command(['migrate', 'deploy']);
    await command(['migrate', 'status']);
    await command(['migrate', 'diff', '--from-config-datasource', '--to-schema', 'prisma/schema.prisma', '--exit-code']);
    const tables = await connection.query('SELECT TABLE_NAME AS name, ENGINE AS engine, TABLE_COLLATION AS collation FROM TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME', [database]);
    const models = [...fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8').matchAll(/^model\s+(\w+)\s*\{/gm)].map(match => match[1]);
    assert.equal(models.length, 16);
    const expected = models.map(name => Number(server.casing) === 0 ? name : name.toLowerCase()).concat('_prisma_migrations').sort();
    assert.deepEqual(tables.map(table => table.name).sort(), expected);
    for (const table of tables) {
      assert.equal(table.engine, 'InnoDB');
      if (table.name !== '_prisma_migrations') assert.equal(table.collation, 'utf8mb4_unicode_ci');
    }
    console.log('Tables: ' + tables.map(table => table.name).join(', '));
    const columns = await connection.query('SELECT TABLE_NAME AS tableName, COLUMN_NAME AS name, COLUMN_TYPE AS type, IS_NULLABLE AS nullable, COLUMN_DEFAULT AS defaultValue FROM COLUMNS WHERE TABLE_SCHEMA = ?', [database]);
    const column = (table, name) => columns.find(value => value.tableName.toLowerCase() === table.toLowerCase() && value.name === name);
    assert.equal(column('Product', 'precio').type, 'double');
    assert.equal(Number(column('Product', 'precio').defaultValue), 0);
    assert.equal(column('User', 'businessId').nullable, 'YES');
    assert.ok(column('User', 'rol').type.includes("'SUPERADMIN'"));
    const indexes = await connection.query('SELECT INDEX_NAME AS name, NON_UNIQUE AS nonUnique FROM STATISTICS WHERE TABLE_SCHEMA = ?', [database]);
    assert.ok(indexes.some(index => index.name === 'User_email_key' && Number(index.nonUnique) === 0));
    const foreignKeys = await connection.query('SELECT CONSTRAINT_NAME AS name FROM REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = ?', [database]);
    const migrationSql = fs.readFileSync(path.join(root, 'prisma/migrations/20261029000000_mysql_baseline/migration.sql'), 'utf8');
    assert.equal(foreignKeys.length, (migrationSql.match(/ADD CONSTRAINT/g) || []).length);
    console.log('Metadata verified: 16 domain tables, ' + foreignKeys.length + ' foreign keys; EXIT=0');
  } finally {
    try {
      // Only a database created successfully by this run may be dropped.
      if (created) {
        await connection.query('DROP DATABASE `corralon_baseline_test`');
        const remaining = await connection.query('SELECT SCHEMA_NAME FROM SCHEMATA WHERE SCHEMA_NAME = ?', [database]);
        assert.equal(remaining.length, 0);
        console.log('DROP DATABASE corralon_baseline_test; absence confirmed; EXIT=0');
      }
    } finally { await connection.end(); }
  }
}
main().catch(error => {
  // Driver errors can include credentials; report only their safe code.
  console.error(error.code ? 'Verification failed: ' + error.code : error.name + ': ' + error.message.replace(/mysql:\/\/[^\s]+/g, '[redacted URL]'));
  process.exitCode = 1;
});
