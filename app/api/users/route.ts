import { NextResponse } from 'next/server';
import { getAllOpsCoordinators } from '@/services/server/vendorServerService';

/**
 * Controller: GET /api/users
 */
export async function GET() {
  try {
    const users = await getAllOpsCoordinators();
    return NextResponse.json(users);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve coordinators';
    console.error('[API GET /api/users] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
