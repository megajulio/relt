import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/control/sandbox/status
 * 
 * Proxy a GET /control/v1/sandbox/status del backend.
 * Forward headers: Authorization (de cookie), X-Org-Id.
 */
export async function GET(request: NextRequest) {
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
    const response = await fetch(`${backendUrl}/control/v1/sandbox/status`, {
      headers: {
        'Authorization': `Bearer ${authCookie.value}`,
        'X-Org-Id': orgId,
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
      { error: 'Failed to fetch sandbox status' },
      { status: 500 }
    );
  }
}
