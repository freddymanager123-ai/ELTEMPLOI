import { NextResponse } from 'next/server';
import { paymentClient } from '@/lib/mercadopago';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    // 1. Mercado Pago envía la alerta IPN (Instant Payment Notification) o Webhook
    // obtenemos la query de la url para saber qué recurso se actualizó.
    const url = new URL(request.url);
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    const id = url.searchParams.get('id') || url.searchParams.get('data.id');

    if (topic === 'payment' && id) {
      // 2. Obtener el estado real del pago
      const payment = await paymentClient.get({ id: String(id) });
      
      console.log('Pago Recibido Notificación:', payment.id, payment.status);

      if (payment.status === 'approved') {
         // 3. "external_reference" es nuestra huella interna que pusimos en /api/checkout
         if (payment.external_reference) {
            const externalRef = JSON.parse(payment.external_reference);
            
            // 4. Guardamos en DB centralizada de pagos
            const insertPaymentQuery = `
              INSERT INTO payments (reference_type, reference_id, amount, method, status)
              VALUES ($1, $2, $3, $4, $5)
            `;
            // reference_type = 'ENROLLMENT' | 'SALE'
            await pool.query(insertPaymentQuery, [
              externalRef.type, 
              externalRef.client_id, // Usado temporalmente en este ejemplo 
              payment.transaction_amount,
              'MERCADO_PAGO',
              'COMPLETED'
            ]);

            // (Aquí podrías agregar lógica para actualizar la suscripción del cliente en `enrollments`)
            // updateEnrollmentStatus(externalRef.client_id, ...)
         }
      }
    }

    // Mercado Pago requiere una respuesta 200 OK rápida o seguirá intentando
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook Error', error);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 500 });
  }
}
