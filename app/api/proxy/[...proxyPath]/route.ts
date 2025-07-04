import { NextRequest, NextResponse } from 'next/server';

function devOnly() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Proxy is only available in development' }, { status: 403 });
  }
  return null;
}

export async function GET(request: NextRequest, { params }: { params: { proxyPath: string[] } }) {
  const devCheck = devOnly();
  if (devCheck) return devCheck;
  const targetUrl = 'https://micro.baaten.in';
  const path = '/' + params.proxyPath.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${targetUrl}${path}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const response = await fetch(url, {
      headers: {
        ...Object.fromEntries(request.headers),
        host: new URL(targetUrl).host,
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
      { error: 'Failed to fetch from target server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { proxyPath: string[] } }) {
  const devCheck = devOnly();
  if (devCheck) return devCheck;
  const targetUrl = 'https://micro.baaten.in';
  const path = '/' + params.proxyPath.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${targetUrl}${path}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const body = await request.json();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...Object.fromEntries(request.headers),
        host: new URL(targetUrl).host,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
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
      { error: 'Failed to fetch from target server' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { proxyPath: string[] } }) {
  const devCheck = devOnly();
  if (devCheck) return devCheck;
  const targetUrl = 'https://micro.baaten.in';
  const path = '/' + params.proxyPath.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${targetUrl}${path}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const body = await request.json();
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        ...Object.fromEntries(request.headers),
        host: new URL(targetUrl).host,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
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
      { error: 'Failed to fetch from target server' },
      { status: 500 }
    );
  }
} 