import { NextResponse } from 'next/server';
import { getAllVendors } from '@/services/server/vendorServerService';

/**
 * Controller: GET /api/vendors
 */
export async function GET() {
  try {
    const vendors = await getAllVendors();
    return NextResponse.json(vendors);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve vendors';
    console.error('[API GET /api/vendors] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
