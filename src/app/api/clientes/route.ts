import { NextResponse } from 'next/server';
import pool from '@/lib/db';

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
    const { first_name, last_name, curp, email, phone } = body;
    
    // Validación básica
    if (!first_name || !last_name) {
      return NextResponse.json({ error: 'El nombre y apellido son obligatorios' }, { status: 400 });
    }

    const query = `
      INSERT INTO clients (first_name, last_name, curp, email, phone) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *;
    `;
    const values = [first_name, last_name, curp, email, phone];
    
    // Ejecutamos la consulta y retornamos el cliente insertado
    const { rows } = await pool.query(query, values);
    return NextResponse.json(rows[0], { status: 201 });
    
  } catch (error: any) {
    console.error('Database Error:', error);
    // Manejo de error de CURP duplicada u otros errores de integridad
    if (error.code === '23505') {
       return NextResponse.json({ error: 'El CURP ya está registrado en el sistema' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al crear el cliente' }, { status: 500 });
  }
}
