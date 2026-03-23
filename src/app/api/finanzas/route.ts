import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // If the metadata column doesn't exist, we'll try to add it silently (fails gracefully if exists)
    try { await pool.query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB'); } catch(e){}

    const { rows } = await pool.query("SELECT metadata FROM payments WHERE metadata IS NOT NULL ORDER BY created_at DESC");
    const transacciones = rows.map(r => r.metadata);
    return NextResponse.json(transacciones);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Error al obtener finanzas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    try { await pool.query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB'); } catch(e){}

    const query = `
      INSERT INTO payments (amount, method, status, metadata) 
      VALUES ($1, $2, $3, $4) 
      RETURNING metadata
    `;
    
    // Fallbacks since some transactions are literal TICKETS with total, metodo
    const values = [
      body.total || 0, 
      body.metodo || 'CASH', 
      'COMPLETED', 
      body 
    ];
    
    const { rows } = await pool.query(query, values);
    return NextResponse.json(rows[0].metadata, { status: 201 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Error al guardar finanzas' }, { status: 500 });
  }
}
