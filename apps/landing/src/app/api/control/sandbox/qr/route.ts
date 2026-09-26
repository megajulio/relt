import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/control/sandbox/qr
 *
 * Proxy a GET /control/v1/sandbox/qr del backend.
 * La sesión permanece en la cookie relt_session del navegador.
 */
export async function GET(request: NextRequest) {
  const orgId = request.headers.get('X-Org-Id');
  const authCookie = request.cookies.get('relt_session');

  if (!authCookie || !orgId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  try {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const response = await fetch(
      `${backendUrl}/control/v1/sandbox/qr`,
      {
        headers: {
          Authorization: `Bearer ${authCookie.value}`,
          'X-Org-Id': orgId,
        },
        cache: 'no-store',
      },
    );

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch sandbox QR' },
      { status: 500 },
    );
  }
}
