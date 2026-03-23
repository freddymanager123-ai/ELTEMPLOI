import { Pool } from 'pg';

// El pool administra las conexiones de forma eficiente
// Usa la variable de entorno configurada nativamente o por la extensión de Netlify
const connectionString = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || '';

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('neon') || connectionString.includes('supabase') || connectionString.includes('render')
    ? { rejectUnauthorized: false }
    : undefined
});

export default pool;
