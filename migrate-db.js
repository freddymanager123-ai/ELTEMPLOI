const { Pool } = require('pg');
const fs = require('fs');

let dbUrl = process.env.DATABASE_URL;

try {
  if (fs.existsSync('.env.local')) {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const dbUrlMatch = envFile.match(/DATABASE_URL=(.*)/);
    if (dbUrlMatch) {
       dbUrl = dbUrlMatch[1].trim();
    }
  }
} catch(e) {}

if (!dbUrl) {
  console.error("No DATABASE_URL found");
  process.exit(1);
}

// Clean quotes if any
dbUrl = dbUrl.replace(/^["']|["']$/g, '');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl.includes('supabase') || dbUrl.includes('render') ? { rejectUnauthorized: false } : false
});

async function run() {
  try {
    await pool.query('ALTER TABLE clients ADD COLUMN IF NOT EXISTS photo_url TEXT;');
    console.log('Migración lista');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
