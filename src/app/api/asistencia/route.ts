import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT a.id, a.check_in, c.first_name, c.last_name, c.status as client_status
      FROM attendance a
      JOIN clients c ON a.client_id = c.id
      ORDER BY a.check_in DESC
      LIMIT 100
    `);
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Error fetching attendance' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { client_id } = body;
    
    if (!client_id) {
        return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
    }

    const query = `
      INSERT INTO attendance (client_id) 
      VALUES ($1) 
      RETURNING *;
    `;
    
    const { rows } = await pool.query(query, [parseInt(client_id, 10)]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Error logging attendance' }, { status: 500 });
  }
}
