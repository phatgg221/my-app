import { NextRequest, NextResponse } from 'next/server';
import { DocumentType } from '@prisma/client';
import { s3Client, bucketName } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getVendorDocuments, attachVendorDocument } from '@/services/server/vendorServerService';

const VALID_DOC_TYPES = Object.values(DocumentType);

/**
 * Controller: GET /api/vendors/[id]/documents
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || DocumentType.OTHER;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    if (!VALID_DOC_TYPES.includes(type as DocumentType)) {
      return NextResponse.json(
        { error: `Invalid document type. Allowed types: ${VALID_DOC_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // 1. Upload to MinIO S3 Simulation
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileKey = `vendors/${id}/${Date.now()}_${sanitizedName}`;

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

    // 2. Record in database via Server Service
    const document = await attachVendorDocument(
      id,
      file.name,
      fileKey,
      fileUrl,
      type as DocumentType
    );

    return NextResponse.json(document, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to upload document';
    console.error('[API POST /api/vendors/[id]/documents] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
