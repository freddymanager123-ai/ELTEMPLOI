import { NextResponse } from 'next/server';
import { preferenceClient } from '@/lib/mercadopago';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, planId, description, price, quantity = 1 } = body;

    // 1. Validar cuerpo de la petición
    if (!description || !price) {
      return NextResponse.json({ error: 'Faltan detalles del artículo a cobrar' }, { status: 400 });
    }

    // 2. Comunicarse con API de Mercado Pago para generar "Preferencia de Pago"
    // Esto es equivalente a armar "tu checkout link" o "tu carrito" para MP.
    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: planId ? String(planId) : "custom_product",
            title: description,
            quantity: quantity,
            unit_price: Number(price),
            currency_id: 'MXN',
          }
        ],
        // Metadatos internos que usaremos en el Webhook para conciliar el pago
        external_reference: JSON.stringify({
          client_id: clientId,
          plan_id: planId,
          type: planId ? 'ENROLLMENT' : 'SALE'
        })
      }
    });

    // 3. Devuelve la ID de la preferencia y el link de pago que visitará el cliente
    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point, // Link para redirección estándar
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error al generar checkout de Mercado Pago:', error);
    // Extraer detalles de Mercado Pago si existen
    const errorMessage = error.cause?.response?.message || error.message || 'Error desconocido';
    const errorData = error.cause?.response?.data || null;
    
    return NextResponse.json({ 
      error: 'Error de MercadoPago', 
      details: errorMessage,
      mpData: errorData
    }, { status: 500 });
  }
}
