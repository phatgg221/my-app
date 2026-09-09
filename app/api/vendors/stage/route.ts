import { NextRequest, NextResponse } from 'next/server';
import { updateVendorStageTransaction } from '@/services/server/vendorServerService';
import { UpdateVendorStageSchema, formatZodError } from '@/lib/validations';

/**
 * Controller: PATCH /api/vendors/stage
 * Validates payload using Zod before delegating to Server Service.
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Zod Input Validation
    const validationResult = UpdateVendorStageSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: formatZodError(validationResult.error),
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { vendorId, newStage, userId } = validationResult.data;

    // 2. Call Server Service
    const result = await updateVendorStageTransaction(vendorId, newStage, userId);

    return NextResponse.json({
      success: true,
      message: `Vendor successfully moved to stage ${newStage}`,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update vendor stage';
    console.error('[API PATCH /api/vendors/stage] Error:', message);
    return NextResponse.json({ error: message, message }, { status: 400 });
  }
}
