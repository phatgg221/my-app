import { NextRequest, NextResponse } from 'next/server';
import { s3Client, bucketName } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getVendorDocuments, attachVendorDocument } from '@/services/server/vendorServerService';
import {
  VendorIdParamSchema,
  DocumentTypeEnum,
  DocumentFileMetaSchema,
  formatZodError,
} from '@/lib/validations';

/**
 * Controller: GET /api/vendors/[id]/documents
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
    const documents = await getVendorDocuments(id);
    return NextResponse.json(documents);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch vendor documents';
    console.error('[API GET /api/vendors/[id]/documents] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Controller: POST /api/vendors/[id]/documents
 * Authentication is enforced upstream by Next.js Proxy/Middleware (proxy.ts).
 */
export async function POST(
  request: NextRequest,
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

    const { id: vendorId } = paramValidation.data;
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawType = (formData.get('type') as string) || 'OTHER';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // 1. Zod Document Type Validation
    const typeValidation = DocumentTypeEnum.safeParse(rawType);
    if (!typeValidation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: formatZodError(typeValidation.error),
          details: typeValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const documentType = typeValidation.data;

    // 2. Zod File Size & Format Validation
    const fileMetaValidation = DocumentFileMetaSchema.safeParse({
      size: file.size,
      type: file.type,
    });
    if (!fileMetaValidation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: formatZodError(fileMetaValidation.error),
          details: fileMetaValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 3. Upload to MinIO S3 Simulation
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileKey = `vendors/${vendorId}/${Date.now()}_${sanitizedName}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream',
      })
    );

    // Direct endpoint URL for viewing
    const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9002';
    const fileUrl = `${endpoint}/${bucketName}/${fileKey}`;

    // 4. Record in database via Server Service
    const document = await attachVendorDocument(
      vendorId,
      file.name,
      fileKey,
      fileUrl,
      documentType
    );

    return NextResponse.json(document, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to upload document';
    console.error('[API POST /api/vendors/[id]/documents] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
