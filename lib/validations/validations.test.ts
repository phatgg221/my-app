import { describe, it, expect } from 'vitest';
import {
  UpdateVendorStageSchema,
  VendorIdParamSchema,
  GoogleAuthSchema,
  DocumentTypeEnum,
  DocumentFileMetaSchema,
  MAX_FILE_SIZE_BYTES,
  formatZodError,
} from './index';

describe('Zod Validation Schemas', () => {
  const VALID_UUID = 'd12d7c14-4faf-423f-9a70-85ad9fab953a';
  const VALID_UUID_2 = '98b7731e-f6bd-40d8-b957-acbb70be2cc8';

  /* -------------------------------------------------------------------------
   * UpdateVendorStageSchema
   * ----------------------------------------------------------------------- */
  describe('UpdateVendorStageSchema', () => {
    it('should validate a correct stage update payload', () => {
      const payload = {
        vendorId: VALID_UUID,
        newStage: 'KYC_VERIFIED',
        userId: VALID_UUID_2,
      };

      const result = UpdateVendorStageSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.newStage).toBe('KYC_VERIFIED');
      }
    });

    it('should reject invalid vendorId format', () => {
      const payload = {
        vendorId: 'not-a-valid-uuid',
        newStage: 'ACTIVE',
        userId: VALID_UUID_2,
      };

      const result = UpdateVendorStageSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(formatZodError(result.error)).toContain('must be a valid UUID');
      }
    });

    it('should reject illegal stage enum values', () => {
      const payload = {
        vendorId: VALID_UUID,
        newStage: 'NON_EXISTENT_STAGE',
        userId: VALID_UUID_2,
      };

      const result = UpdateVendorStageSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(formatZodError(result.error)).toContain('Stage must be one of');
      }
    });

    it('should reject invalid userId format', () => {
      const payload = {
        vendorId: VALID_UUID,
        newStage: 'CONTRACT_SIGNED',
        userId: '12345',
      };

      const result = UpdateVendorStageSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(formatZodError(result.error)).toContain('active Ops Coordinator ID must be a valid UUID');
      }
    });
  });

  /* -------------------------------------------------------------------------
   * VendorIdParamSchema
   * ----------------------------------------------------------------------- */
  describe('VendorIdParamSchema', () => {
    it('should accept valid UUID route params', () => {
      const result = VendorIdParamSchema.safeParse({ id: VALID_UUID });
      expect(result.success).toBe(true);
    });

    it('should reject non-UUID route params', () => {
      const result = VendorIdParamSchema.safeParse({ id: 'abc-xyz' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(formatZodError(result.error)).toContain('Vendor ID must be a valid UUID string');
      }
    });
  });

  /* -------------------------------------------------------------------------
   * GoogleAuthSchema
   * ----------------------------------------------------------------------- */
  describe('GoogleAuthSchema', () => {
    it('should validate a complete Google profile', () => {
      const payload = {
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@shopee.com',
        avatar: 'https://images.unsplash.com/photo-1494790108377?w=150',
        role: 'Compliance Lead',
      };

      const result = GoogleAuthSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('sarah.jenkins@shopee.com');
      }
    });

    it('should reject empty or whitespace name', () => {
      const payload = {
        name: '   ',
        email: 'test@shopee.com',
      };

      const result = GoogleAuthSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(formatZodError(result.error)).toContain('Name is required');
      }
    });

    it('should reject invalid email syntax', () => {
      const payload = {
        name: 'Alex Chen',
        email: 'not-an-email',
      };

      const result = GoogleAuthSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(formatZodError(result.error)).toContain('Must be a valid email address');
      }
    });

    it('should reject malformed avatar URLs', () => {
      const payload = {
        name: 'Alex Chen',
        email: 'alex@shopee.com',
        avatar: 'htt//invalid-url',
      };

      const result = GoogleAuthSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(formatZodError(result.error)).toContain('Avatar must be a valid URL string');
      }
    });

    it('should allow optional or null avatar and role', () => {
      const payload = {
        name: 'David Nguyen',
        email: 'david@shopee.com',
        avatar: null,
        role: null,
      };

      const result = GoogleAuthSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  /* -------------------------------------------------------------------------
   * DocumentTypeEnum
   * ----------------------------------------------------------------------- */
  describe('DocumentTypeEnum', () => {
    it('should accept valid DocumentType enum values', () => {
      expect(DocumentTypeEnum.safeParse('BUSINESS_LICENSE').success).toBe(true);
      expect(DocumentTypeEnum.safeParse('IDENTITY_DOCUMENT').success).toBe(true);
      expect(DocumentTypeEnum.safeParse('OTHER').success).toBe(true);
    });

    it('should reject unknown document types', () => {
      const result = DocumentTypeEnum.safeParse('UNKNOWN_TYPE');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(formatZodError(result.error)).toContain('Document type must be one of');
      }
    });
  });

  /* -------------------------------------------------------------------------
   * DocumentFileMetaSchema
   * ----------------------------------------------------------------------- */
  describe('DocumentFileMetaSchema', () => {
    it('should accept valid PDF within size limit', () => {
      const result = DocumentFileMetaSchema.safeParse({
        size: 5 * 1024 * 1024, // 5 MB
        type: 'application/pdf',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid image types (PNG, JPEG, WEBP)', () => {
      expect(DocumentFileMetaSchema.safeParse({ size: 1024, type: 'image/png' }).success).toBe(true);
      expect(DocumentFileMetaSchema.safeParse({ size: 1024, type: 'image/jpeg' }).success).toBe(true);
      expect(DocumentFileMetaSchema.safeParse({ size: 1024, type: 'image/webp' }).success).toBe(true);
    });

    it('should reject files exceeding 15MB', () => {
      const result = DocumentFileMetaSchema.safeParse({
        size: MAX_FILE_SIZE_BYTES + 1,
        type: 'application/pdf',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(formatZodError(result.error)).toContain('File size exceeds the 15MB limit');
      }
    });

    it('should reject unsupported file mime types', () => {
      const result = DocumentFileMetaSchema.safeParse({
        size: 1024,
        type: 'application/x-msdownload',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(formatZodError(result.error)).toContain('Allowed file types are PDF, PNG, JPG, and WEBP');
      }
    });
  });
});
