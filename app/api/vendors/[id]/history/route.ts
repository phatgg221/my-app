import { NextRequest, NextResponse } from 'next/server';
import { getVendorStageHistory } from '@/services/server/vendorServerService';
import { VendorIdParamSchema, formatZodError } from '@/lib/validations';

/**
 * Controller: GET /api/vendors/[id]/history
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params;
    const paramValidation = VendorIdParamSchema.safeParse(rawParams);

    if (!paramValidation.success) {
      return NextResponse.json(
        { error: 'Validation failed', message: formatZodError(paramValidation.error) },
        { status: 400 }
      );
    }

    const { id } = paramValidation.data;
    const history = await getVendorStageHistory(id);
    return NextResponse.json(history);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch vendor stage history';
    console.error('[API GET /api/vendors/[id]/history] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
