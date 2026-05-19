import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });

const MIGRATION_FILES = [
  '01_create_schema.sql',
  '02_add_geospatial.sql',
  '03_add_payment_verification.sql',
  '04_add_contract_templates.sql',
  '05_add_multi_cluster_support.sql',
];

const PLACEHOLDER_PATTERNS = [
  'your_supabase_url_here',
  'your_service_role_key_here',
  'your_postgres_url_here',
  'MY_',
];

function isPlaceholder(value) {
  if (!value) return true;
  return PLACEHOLDER_PATTERNS.some((p) => value.includes(p));
}

function getProjectRef() {
  return (
    process.env.SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ||
    process.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ||
    null
  );
}

/** Verify Supabase API hostname resolves (catches DNS/firewall issues early). */
async function checkSupabaseReachable() {
  const base = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!base || isPlaceholder(base)) return;

  const host = new URL(base).hostname;
  try {
    const res = await fetch(`${base}/rest/v1/`, {
      method: 'HEAD',
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || '' },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok || res.status === 401 || res.status === 404) return;
  } catch (error) {
    const cause = error.cause?.code || error.code || '';
    if (cause === 'ENOTFOUND' || error.message.includes('fetch failed')) {
      console.error(`[migrate] Cannot reach Supabase at ${host}`);
      console.error('[migrate] DNS lookup failed — your network cannot resolve *.supabase.co');
      console.error('[migrate] Fixes:');
      console.error('  • Confirm the project exists: https://supabase.com/dashboard');
      console.error('  • Try another network or DNS (e.g. 8.8.8.8 / 1.1.1.1)');
      console.error('  • Disable VPN/firewall blocking supabase.co');
      console.error('  • Apply schema in Supabase Dashboard → SQL Editor (works in browser)\n');
      buildFullSchemaFile();
      console.error('[migrate] Use scripts/00_full_schema.sql in the SQL Editor.');
      process.exit(1);
    }
  }
}

function sanitizeUrlForLog(url) {
  try {
    const u = new URL(url);
    if (u.password) u.password = '****';
    return u.toString();
  } catch {
    return '(invalid url)';
  }
}

/** Build candidate Postgres URLs for DDL (migrations). */
function buildConnectionCandidates() {
  const candidates = [];
  const ref = getProjectRef();

  if (process.env.MIGRATE_DATABASE_URL && !isPlaceholder(process.env.MIGRATE_DATABASE_URL)) {
    candidates.push({ label: 'MIGRATE_DATABASE_URL', url: process.env.MIGRATE_DATABASE_URL });
  }

  const base = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (base && !isPlaceholder(base)) {
    try {
      const parsed = new URL(base);
      const password = parsed.password;
      const host = parsed.hostname;

      if (password && host.includes('pooler.supabase.com')) {
        // Session pooler (recommended for DDL on Supabase)
        const session = new URL(base);
        session.port = '5432';
        session.searchParams.delete('pgbouncer');
        if (ref && !session.username.includes('.')) {
          session.username = `postgres.${ref}`;
        }
        candidates.push({ label: 'Session pooler (:5432)', url: session.toString() });

        // Direct connection
        if (ref) {
          candidates.push({
            label: 'Direct (db.<project>.supabase.co)',
            url: `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`,
          });
        }
      } else {
        candidates.push({ label: 'POSTGRES_URL', url: base });
      }
    } catch {
      candidates.push({ label: 'POSTGRES_URL', url: base });
    }
  }

  if (ref && process.env.SUPABASE_DB_PASSWORD && !isPlaceholder(process.env.SUPABASE_DB_PASSWORD)) {
    candidates.push({
      label: 'SUPABASE_DB_PASSWORD + direct host',
      url: `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@db.${ref}.supabase.co:5432/postgres`,
    });
  }

  return candidates;
}

function isBenignError(message) {
  const benign = ['already exists', 'duplicate key', 'multiple primary keys'];
  return benign.some((s) => message.toLowerCase().includes(s));
}

async function connectWithCandidates(candidates) {
  const errors = [];

  for (const { label, url } of candidates) {
    const cleanUrl = url
      .replace(/[?&]pgbouncer=true/g, '')
      .replace(/[?&]sslmode=[^&]+/g, '')
      .replace(/\?$/, '');

    console.log(`[migrate] Trying ${label}: ${sanitizeUrlForLog(cleanUrl)}`);

    const client = new pg.Client({
      connectionString: cleanUrl,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      console.log(`[migrate] Connected via ${label}.\n`);
      return client;
    } catch (error) {
      const msg = error.message || String(error);
      errors.push(`${label}: ${msg}`);
      if (msg.includes('tenant/user') && msg.includes('not found')) {
        errors.push(
          '  → Often wrong database password in POSTGRES_URL (use Database password, not service_role JWT)'
        );
      }
      await client.end().catch(() => {});
    }
  }

  throw new Error(errors.join('\n'));
}

async function runSqlFile(client, filePath, fileName) {
  const sql = fs.readFileSync(filePath, 'utf-8');
  console.log(`[migrate] Running ${fileName}...`);

  try {
    await client.query(sql);
    console.log(`[migrate] ✓ ${fileName}`);
    return;
  } catch (error) {
    if (isBenignError(error.message)) {
      console.log(`[migrate] ~ ${fileName} (${error.message.split('\n')[0]})`);
      return;
    }
    throw error;
  }
}

function buildFullSchemaFile() {
  const buildScript = path.join(__dirname, 'build-full-schema.js');
  execSync(`node "${buildScript}"`, { stdio: 'inherit', cwd: projectRoot });
}

function printManualInstructions() {
  buildFullSchemaFile();
  console.log('\n[migrate] Automatic connection failed. Apply schema manually:');
  console.log('  1. Open Supabase Dashboard → SQL Editor');
  console.log('  2. Paste contents of scripts/00_full_schema.sql');
  console.log('  3. Run the query');
  console.log('\nOr set MIGRATE_DATABASE_URL in .env to the "Direct connection" URI from:');
  console.log('  Project Settings → Database → Connection string → Direct');
}

async function runMigration() {
  await checkSupabaseReachable();

  const candidates = buildConnectionCandidates();

  if (candidates.length === 0) {
    console.error('[migrate] No database URL configured.');
    console.error('Set POSTGRES_URL or MIGRATE_DATABASE_URL in .env');
    printManualInstructions();
    process.exit(1);
  }

  let client;

  try {
    client = await connectWithCandidates(candidates);
  } catch (error) {
    console.error('[migrate] Could not connect to Postgres:\n');
    console.error(error.message);
    console.error('\n[migrate] The old runner used supabase.rpc("sql_exec") which does not exist — that caused "TypeError: fetch failed".');
    printManualInstructions();
    process.exit(1);
  }

  try {
    let failed = 0;

    for (const file of MIGRATION_FILES) {
      const migrationPath = path.join(projectRoot, 'scripts', file);
      if (!fs.existsSync(migrationPath)) continue;

      try {
        await runSqlFile(client, migrationPath, file);
      } catch (error) {
        failed++;
        console.error(`[migrate] ✗ ${file}: ${error.message}`);
      }
    }

    if (failed > 0) {
      printManualInstructions();
      process.exit(1);
    }

    console.log('\n[migrate] All migrations applied successfully.');
    process.exit(0);
  } finally {
    await client.end().catch(() => {});
  }
}

runMigration();
