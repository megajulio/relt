import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/control/sandbox/retry
 * 
 * Proxy a POST /control/v1/sandbox/retry del backend.
 */
export async function POST(request: NextRequest) {
  const orgId = request.headers.get('X-Org-Id');
  const authCookie = request.cookies.get('relt_session');

  if (!authCookie || !orgId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/control/v1/sandbox/retry`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authCookie.value}`,
        'X-Org-Id': orgId,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to retry sandbox provisioning' },
      { status: 500 }
    );
  }
}
