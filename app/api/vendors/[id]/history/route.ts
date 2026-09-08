import { NextRequest, NextResponse } from 'next/server';
import { getVendorStageHistory } from '@/services/server/vendorServerService';

/**
 * Controller: GET /api/vendors/[id]/history
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const history = await getVendorStageHistory(id);
    return NextResponse.json(history);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch vendor stage history';
    console.error('[API GET /api/vendors/[id]/history] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
