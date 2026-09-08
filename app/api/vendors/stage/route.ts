import { NextRequest, NextResponse } from 'next/server';
import { Stage } from '@prisma/client';
import { updateVendorStageTransaction } from '@/services/server/vendorServerService';

const VALID_STAGES = Object.values(Stage);

/**
 * Controller: PATCH /api/vendors/stage
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, newStage, userId } = body;

    // Strict validation
    if (!vendorId || typeof vendorId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "vendorId" parameter.' },
        { status: 400 }
      );
    }

    if (!newStage || !VALID_STAGES.includes(newStage as Stage)) {
      return NextResponse.json(
        { error: `Invalid "newStage". Must be one of: ${VALID_STAGES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "userId" (Ops Coordinator required for audit attribution).' },
        { status: 400 }
      );
    }

    // Call Server Service
    const result = await updateVendorStageTransaction(vendorId, newStage as Stage, userId);

    return NextResponse.json({
      success: true,
      message: `Vendor successfully moved to stage ${newStage}`,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update vendor stage';
    console.error('[API PATCH /api/vendors/stage] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
