import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();
    const { first_name, last_name, birth_date, age, email, phone, photo_url } = body;
    
    // Construir actualización dinámica (por si no envían todos los campos)
    const query = `
      UPDATE clients 
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        birth_date = COALESCE($3, birth_date),
        age = COALESCE($4, age),
        email = COALESCE($5, email),
        phone = COALESCE($6, phone),
        photo_url = COALESCE($7, photo_url)
      WHERE id = $8
      RETURNING *;
    `;
    
    const values = [first_name, last_name, birth_date, age, email, phone, photo_url, id];
    
    const { rows } = await pool.query(query, values);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Error al actualizar el cliente' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    // Primero, si el cliente tiene registros relacionados (como enrollments, attendance, sales), fallará por Foreign Key.
    // Lo ideal en esos casos es un soft delete (status = 'INACTIVE'). 
    // Para no romper la integridad, intentaremos el DELETE físico o cambiaremos estado.
    
    const checkQuery = `SELECT * FROM clients WHERE id = $1`;
    const { rows: clientRows } = await pool.query(checkQuery, [id]);
    
    if (clientRows.length === 0) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    try {
      await pool.query('DELETE FROM clients WHERE id = $1', [id]);
      return NextResponse.json({ success: true, message: 'Cliente eliminado correctamente' }, { status: 200 });
    } catch (fkError: any) {
      // Si hay error de foreign key (23503), hacemos soft-delete
      if (fkError.code === '23503') {
        const softDeleteQuery = `UPDATE clients SET status = 'DELETED' WHERE id = $1 RETURNING *`;
        const { rows } = await pool.query(softDeleteQuery, [id]);
        return NextResponse.json({ success: true, message: 'Cliente desactivado correctamente debido a registros existentes', data: rows[0] }, { status: 200 });
      }
      throw fkError;
    }
    
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Error interno al intentar eliminar el cliente' }, { status: 500 });
  }
}
