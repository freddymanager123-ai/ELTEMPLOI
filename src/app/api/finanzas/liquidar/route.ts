import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  try {
    const { ticketId, metodo } = await request.json();
    
    if (!ticketId) {
      return NextResponse.json({ error: 'Falta el ID del ticket' }, { status: 400 });
    }

    const dateNow = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const methodValue = metodo || 'CASH';

    // Only update JSONB metadata to avoid column ENUM constraints
    const { rows } = await pool.query(
      `UPDATE payments 
       SET metadata = metadata || jsonb_build_object(
         'estadoCredito', 'PAGADO', 
         'metodo', $1::text, 
         'fechaLiquidacion', $2::text
       )
       WHERE metadata->>'id' = $3
       RETURNING metadata`,
      [methodValue, dateNow, ticketId]
    );
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, metadata: rows[0].metadata });
  } catch (error) {
    console.error('Liquidar Error:', error);
    return NextResponse.json({ error: 'Error al liquidar deuda' }, { status: 500 });
  }
}
