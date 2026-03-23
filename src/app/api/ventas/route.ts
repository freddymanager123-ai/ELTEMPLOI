import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const clientRef = await pool.connect();
  try {
    const body = await request.json();
    const { client_id, method, cart, total } = body;
    
    await clientRef.query('BEGIN');
    
    // 1. Insertar venta principal
    let clientId = client_id && client_id !== 'EXTERNO' ? parseInt(client_id, 10) : null;
    const { rows } = await clientRef.query(
      'INSERT INTO sales (client_id, total, user_id) VALUES ($1, $2, NULL) RETURNING id',
      [clientId, total]
    );
    const saleId = rows[0].id;
    
    // 2. Insertar elementos e ir descontando stock
    for (const item of cart) {
       const sub = item.price * item.quantity;
       await clientRef.query(
         'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5)',
         [saleId, parseInt(item.id, 10), item.quantity, item.price, sub]
       );
       
       await clientRef.query(
         'UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2',
         [item.quantity, parseInt(item.id, 10)]
       );
    }
    
    // 3. Insertar registro de pago
    const paymentStatus = method === 'CREDIT' ? 'PENDING' : 'COMPLETED';
    await clientRef.query(
      'INSERT INTO payments (reference_type, reference_id, amount, method, status) VALUES ($1, $2, $3, $4, $5)',
      ['SALE', saleId, total, method, paymentStatus]
    );
    
    await clientRef.query('COMMIT');
    return NextResponse.json({ success: true, saleId }, { status: 201 });
  } catch (error) {
    await clientRef.query('ROLLBACK');
    console.error('POS Error:', error);
    return NextResponse.json({ error: 'Error al procesar la venta en la Base de Datos.' }, { status: 500 });
  } finally {
    clientRef.release();
  }
}

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT s.*, c.first_name, c.last_name, 
             COALESCE(p.method, 'CASH') as method, COALESCE(p.status, 'COMPLETED') as payment_status
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN payments p ON p.reference_id = s.id AND p.reference_type = 'SALE'
      ORDER BY s.created_at DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Error al obtener historial de ventas' }, { status: 500 });
  }
}
