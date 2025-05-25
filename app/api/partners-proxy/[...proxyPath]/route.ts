import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { proxyPath: string[] } }) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Proxy is only available in development' }, { status: 403 });
  }
  const targetUrl = 'https://battein-onboard-brown.vercel.app';
  const path = '/' + params.proxyPath.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${targetUrl}${path}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { error: errorData || 'Failed to fetch from target server' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from target server', details: String(error) },
      { status: 500 }
    );
  }
} 