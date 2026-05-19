import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const files = [
  '01_create_schema.sql',
  '02_add_geospatial.sql',
  '03_add_payment_verification.sql',
  '04_add_contract_templates.sql',
  '05_add_multi_cluster_support.sql',
];

const parts = [
  '-- Farm Lease Platform – full schema\n',
  '-- Run in Supabase Dashboard → SQL Editor if npm run migrate fails\n\n',
];

for (const file of files) {
  const p = path.join(__dirname, file);
  if (fs.existsSync(p)) {
    parts.push(`-- ========== ${file} ==========\n\n`);
    parts.push(fs.readFileSync(p, 'utf-8'));
    parts.push('\n\n');
  }
}

const out = path.join(__dirname, '00_full_schema.sql');
fs.writeFileSync(out, parts.join(''));
console.log(`[build-schema] Wrote ${out}`);
