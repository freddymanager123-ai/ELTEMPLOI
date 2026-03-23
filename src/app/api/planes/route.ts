import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT * FROM plans ORDER BY id ASC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Error fetching plans' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, duration_type, duration_days, fixed_end_date } = body;
    
    // Check if color or features exist in the table (App uses 'color' and 'features')
    // Let's add them dynamically if missing.
    try {
        await pool.query('ALTER TABLE plans ADD COLUMN IF NOT EXISTS color VARCHAR(50)');
        await pool.query('ALTER TABLE plans ADD COLUMN IF NOT EXISTS features TEXT');
    } catch(e) {}

    const query = `
      INSERT INTO plans (name, price, duration_type, duration_days, fixed_end_date, color, features) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *;
    `;
    
    const values = [name, price, duration_type, duration_days, fixed_end_date, body.color, JSON.stringify(body.features || [])];
    const { rows } = await pool.query(query, values);
    
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Error creating plan' }, { status: 500 });
  }
}
