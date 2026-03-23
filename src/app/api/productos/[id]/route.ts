import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();
    const { name, category, price, stock, image } = body;
    
    const query = `
      UPDATE products 
      SET 
        name = COALESCE($1, name),
        category = COALESCE($2, category),
        price = COALESCE($3, price),
        stock = COALESCE($4, stock)
      WHERE id = $5
      RETURNING *;
    `;
    
    const values = [name, category, price, stock, id];
    const { rows } = await pool.query(query, values);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    try {
      await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT');
      await pool.query('UPDATE products SET image = $1 WHERE id = $2', [image, id]);
      rows[0].image = image;
    } catch(e) {}

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const { rows } = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Producto eliminado' }, { status: 200 });
  } catch (error: any) {
    console.error('Database Error:', error);
    // Error 23503 foreign key constraint
    if (error.code === '23503') {
        return NextResponse.json({ error: 'No se puede eliminar el producto porque está en una venta. Cambia su stock a 0 en su lugar.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 });
  }
}
