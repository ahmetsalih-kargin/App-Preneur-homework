import { NextRequest, NextResponse } from 'next/server';

function getBackendUrl() {
  return process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:8000';
}

export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  try {
    const slug = params.slug.join('/');
    const targetUrl = `${getBackendUrl()}/api/${slug}`;
    
    const body = await req.json();

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[API Proxy] POST error:', error.message, '→', getBackendUrl());
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  try {
    const slug = params.slug.join('/');
    const searchParams = req.nextUrl.searchParams.toString();
    const query = searchParams ? `?${searchParams}` : '';
    const targetUrl = `${getBackendUrl()}/api/${slug}${query}`;
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[API Proxy] GET error:', error.message, '→', getBackendUrl());
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
