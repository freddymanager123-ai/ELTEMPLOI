import { NextResponse } from 'next/server';

// force-dynamic es importante para que NO guarde esto en caché en build-time
export const dynamic = 'force-dynamic';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const netlifyDbUrl = process.env.NETLIFY_DATABASE_URL;
  const unpooledUrl = process.env.NETLIFY_DATABASE_URL_UNPOOLED;
  
  return NextResponse.json({
    status: 'ok',
    has_database_url: !!dbUrl,
    database_url_length: dbUrl ? dbUrl.length : 0,
    has_netlify_url: !!netlifyDbUrl,
    netlify_url_length: netlifyDbUrl ? netlifyDbUrl.length : 0,
    has_unpooled_url: !!unpooledUrl,
    unpooled_url_length: unpooledUrl ? unpooledUrl.length : 0,
    node_env: process.env.NODE_ENV,
  });
}
