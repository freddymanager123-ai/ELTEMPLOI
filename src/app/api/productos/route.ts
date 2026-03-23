import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY id DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, price, stock, image } = body;
    
    // Inyectamos la columna 'image' de forma dinámica si el server la soporta.
    // Cost no se maneja en el form de la UI, seteamos a 0.
    const query = `
      INSERT INTO products (name, category, price, cost, stock, barcode) 
      VALUES ($1, $2, $3, 0, $4, $5) 
      RETURNING *;
    `;
    
    // barcode se puede generar al azar temporalmente para cumplir el schema si requiere, o pasarlo null
    // como en tu schema.sql dice UNIQUE, si pasamos puros NULLs saltará error? No, NULL !== NULL en psql usualmente.
    // Usaremos algo unico si se requiere o null
    const barcode = "BC-" + Date.now() + Math.floor(Math.random() * 1000);
    
    const values = [name, category, price, stock, barcode];
    const { rows } = await pool.query(query, values);
    
    // Intentar guardar imagen si actualizamos la BD
    try {
      await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT');
      await pool.query('UPDATE products SET image = $1 WHERE id = $2', [image, rows[0].id]);
      rows[0].image = image;
    } catch(e) {}

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}
