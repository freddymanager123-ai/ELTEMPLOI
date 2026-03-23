import { Pool } from 'pg';

// El pool administra las conexiones de forma eficiente
// Usa la variable de entorno DATABASE_URL configurada en .env.local
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Dependiendo del hosting (Ej. gold/Supabase), podrías necesitar ssl:
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default pool;
