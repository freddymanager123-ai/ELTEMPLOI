import { Pool } from 'pg';

// El pool administra las conexiones de forma eficiente
// Usa la variable de entorno DATABASE_URL configurada en .env.local
const connectionString = process.env.DATABASE_URL || '';

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('neon') || connectionString.includes('supabase') || connectionString.includes('render')
    ? { rejectUnauthorized: false }
    : undefined
});

export default pool;
