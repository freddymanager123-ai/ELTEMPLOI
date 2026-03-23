import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Verifica si existe el token
if (!process.env.MP_ACCESS_TOKEN) {
  console.warn("Mercado Pago Access Token is missing in .env.local");
}

// Inicializa el cliente oficial de Mercado Pago
export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  // Configurarlo en modo de prueba, luego cambiar o quitar params para producción
  options: { timeout: 5000 /* ms */ } 
});

// Exportar clases que interactúan directamente con la API:
export const preferenceClient = new Preference(mpClient);
export const paymentClient = new Payment(mpClient);
