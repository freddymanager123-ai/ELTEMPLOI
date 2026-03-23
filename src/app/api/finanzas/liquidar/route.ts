import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const { ticketId, metodo } = await request.json();
    
    if (!ticketId) {
      return NextResponse.json({ error: 'Falta el ID del ticket (TKT)' }, { status: 400 });
    }

    const dateNow = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const methodValue = metodo || 'CASH';

    const query = `
      UPDATE payments 
      SET 
        method = $1, 
        status = 'COMPLETED',
        metadata = metadata || jsonb_build_object(
          'estadoCredito', 'PAGADO', 
          'metodo', $1::text, 
          'fechaLiquidacion', $2::text
        )
      WHERE metadata->>'id' = $3
      RETURNING metadata
    `;
    
    const { rows } = await pool.query(query, [methodValue, dateNow, ticketId]);
    
    if (rows.length === 0) {
       return NextResponse.json({ error: 'Ticket no encontrado o sin metadatos' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, metadata: rows[0].metadata });
  } catch (error) {
    console.error('Liquidar Error:', error);
    return NextResponse.json({ error: 'Error al liquidar deuda' }, { status: 500 });
  }
}
