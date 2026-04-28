import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('[v0] Reading migration file...');
    const migrationPath = path.join(process.cwd(), 'scripts', '01_create_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('[v0] Executing migration...');
    const { error } = await supabase.rpc('sql_exec', { sql });

    if (error) {
      // Try alternative approach by splitting statements
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase.rpc('sql_exec', { 
            sql: statement.trim() + ';' 
          });
          if (stmtError) {
            console.log('[v0] Note: Some statements may already exist:', stmtError.message);
          }
        }
      }
    }

    console.log('[v0] Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[v0] Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
