import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();
    const { name, price, duration_type, duration_days, fixed_end_date, color, features } = body;
    
    try {
        await pool.query('ALTER TABLE plans ADD COLUMN IF NOT EXISTS color VARCHAR(50)');
        await pool.query('ALTER TABLE plans ADD COLUMN IF NOT EXISTS features TEXT');
    } catch(e) {}

    const query = `
      UPDATE plans 
      SET 
        name = COALESCE($1, name),
        price = COALESCE($2, price),
        duration_type = COALESCE($3, duration_type),
        duration_days = COALESCE($4, duration_days),
        fixed_end_date = COALESCE($5, fixed_end_date),
        color = COALESCE($6, color),
        features = COALESCE($7, features)
      WHERE id = $8
      RETURNING *;
    `;
    
    const values = [name, price, duration_type, duration_days, fixed_end_date, color, JSON.stringify(features || []), id];
    const { rows } = await pool.query(query, values);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Error actualizando plan' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const { rows } = await pool.query('DELETE FROM plans WHERE id = $1 RETURNING *', [id]);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Database Error:', error);
    if (error.code === '23503') {
        return NextResponse.json({ error: 'No se puede eliminar porque hay socios usando este plan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al eliminar plan' }, { status: 500 });
  }
}
