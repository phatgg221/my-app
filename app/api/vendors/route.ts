import { NextRequest, NextResponse } from 'next/server';
import { getVendors } from '@/services/server/vendorServerService';
import { VendorQuerySchema, formatZodError } from '@/lib/validations';

/**
 * Controller: GET /api/vendors
 * Pure controller parsing and validating query parameters with Zod,
 * then delegating business logic and database access to vendorServerService.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validation = VendorQuerySchema.safeParse(searchParams);

    if (!validation.success) {
      return NextResponse.json(
        { error: `Validation Error: ${formatZodError(validation.error)}` },
        { status: 400 }
      );
    }

    const result = await getVendors(validation.data);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve vendors';
    console.error('[API GET /api/vendors] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
