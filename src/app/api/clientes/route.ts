import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/clientes -> Obtiene todos los clientes
export async function GET() {
  try {
    const { rows } = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor al obtener clientes' }, { status: 500 });
  }
}

// POST /api/clientes -> Crea un nuevo cliente
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { first_name, last_name, birth_date, age, email, phone, photo_url } = body;
    
    // Validación básica
    if (!first_name || !last_name) {
      return NextResponse.json({ error: 'El nombre y apellido son obligatorios' }, { status: 400 });
    }

    // Try multiple columns since we might not have photo_url depending on DB updates
    const query = `
      INSERT INTO clients (first_name, last_name, email, phone, birth_date, age, photo_url) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *;
    `;
    const values = [first_name, last_name, email, phone, birth_date || null, age || null, photo_url || null];
    
    // Ejecutamos la consulta y retornamos el cliente insertado
    const { rows } = await pool.query(query, values);
    return NextResponse.json(rows[0], { status: 201 });
    
  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: error.message || 'Error al crear el cliente' }, { status: 500 });
  }
}
