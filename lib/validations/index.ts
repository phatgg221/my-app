import { z } from 'zod';

/**
 * Stage Enum definitions matching Prisma schema
 */
export const StageEnum = z.enum(
  ['CONTRACT_SENT', 'CONTRACT_SIGNED', 'KYC_DOCS_RECEIVED', 'KYC_VERIFIED', 'ACTIVE'],
  {
    message: 'Stage must be one of: CONTRACT_SENT, CONTRACT_SIGNED, KYC_DOCS_RECEIVED, KYC_VERIFIED, ACTIVE',
  }
);
export type StageEnumType = z.infer<typeof StageEnum>;

/**
 * DocumentType Enum definitions matching Prisma schema
 */
export const DocumentTypeEnum = z.enum(
  ['BUSINESS_LICENSE', 'IDENTITY_DOCUMENT', 'OTHER'],
  {
    message: 'Document type must be one of: BUSINESS_LICENSE, IDENTITY_DOCUMENT, OTHER',
  }
);
export type DocumentTypeEnumType = z.infer<typeof DocumentTypeEnum>;

/**
 * Schema: Vendor ID URL parameter validation
 */
export const VendorIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Vendor ID must be a valid UUID string.' }),
});
export type VendorIdParam = z.infer<typeof VendorIdParamSchema>;

/**
 * Filter modes supported for vendor list
 */
export const VendorFilterEnum = z.enum(['ALL', 'STUCK', 'ACTIVE', 'ONBOARDING'], {
  message: 'Filter mode must be one of: ALL, STUCK, ACTIVE, ONBOARDING',
});
export type VendorFilterEnumType = z.infer<typeof VendorFilterEnum>;

/**
 * Schema: GET /api/vendors Query Parameters
 */
export const VendorQuerySchema = z.object({
  search: z.string().trim().optional(),
  filter: VendorFilterEnum.default('ALL'),
  page: z.coerce.number().int().positive({ message: 'Page must be a positive integer.' }).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive({ message: 'Page size must be a positive integer.' })
    .max(100, { message: 'Page size cannot exceed 100.' })
    .default(5),
});
export type VendorQueryParams = z.infer<typeof VendorQuerySchema>;

/**
 * Schema: Update Vendor Stage payload (Frontend & Backend)
 */
export const UpdateVendorStageSchema = z.object({
  vendorId: z
    .string()
    .uuid({ message: 'Invalid vendorId: must be a valid UUID string.' }),
  newStage: StageEnum,
  userId: z
    .string()
    .uuid({ message: 'Invalid userId: active Ops Coordinator ID must be a valid UUID string.' }),
});
export type UpdateVendorStageInput = z.infer<typeof UpdateVendorStageSchema>;

/**
 * Schema: Google OAuth Login / Registration payload
 */
export const GoogleAuthSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Name is required.' })
    .max(100, { message: 'Name cannot exceed 100 characters.' }),
  email: z
    .string()
    .trim()
    .email({ message: 'Must be a valid email address.' }),
  avatar: z
    .string()
    .url({ message: 'Avatar must be a valid URL string.' })
    .optional()
    .nullable(),
  role: z
    .string()
    .trim()
    .max(60, { message: 'Role cannot exceed 60 characters.' })
    .optional()
    .nullable(),
});
export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;

/**
 * Document Upload Constraints
 */
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export const DocumentFileMetaSchema = z.object({
  size: z.number().max(MAX_FILE_SIZE_BYTES, {
    message: `File size exceeds the 15MB limit. Please choose a smaller file.`,
  }),
  type: z.string().refine(
    (mime) => !mime || (ALLOWED_MIME_TYPES as readonly string[]).includes(mime),
    {
      message: 'Invalid file format. Allowed file types are PDF, PNG, JPG, and WEBP.',
    }
  ),
});

/**
 * Helper to format Zod errors into user-friendly single strings
 */
export function formatZodError(error: z.ZodError): string {
  const messages = error.issues.map((i) => i.message);
  return messages.join('; ');
}
