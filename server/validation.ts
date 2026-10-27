import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
] as const;

export const extractQuoteSchema = z.object({
  rawText: z.string().max(30000, 'Text exceeds 30,000 characters limit').optional(),
  fileBase64: z.string().max(8 * 1024 * 1024, 'File payload exceeds 8MB limit').optional(),
  mimeType: z.enum(allowedMimeTypes, {
    message: 'Unsupported MIME type. Allowed formats: PDF, JPEG, PNG, WebP.'
  }).optional(),
  vendorNameHint: z.string().max(120, 'Vendor name hint exceeds 120 characters').optional()
}).refine(data => data.rawText || data.fileBase64, {
  message: 'Either quotation text or a valid document payload must be provided'
}).refine(data => {
  if (data.fileBase64 && !data.mimeType) return false;
  return true;
}, {
  message: 'MIME type is required when a file payload is provided'
});

export const vendorQuestionsSchema = z.object({
  vendorName: z.string().min(1, 'Vendor name is required').max(150, 'Vendor name too long'),
  category: z.string().min(1, 'Category is required').max(100, 'Category name too long'),
  missingFields: z.array(z.string().max(300)).max(50, 'Too many missing fields specified'),
  language: z.enum(['English', 'Hindi', 'Gujarati']).default('English'),
  context: z.string().max(2000, 'Context is too long').optional()
});

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(8000)
});

export const aiChatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(3000, 'Message exceeds 3,000 characters'),
  history: z.array(chatMessageSchema).max(60, 'History exceeds maximum permitted length').optional(),
  budget: z.number().positive('Budget must be positive').max(1000000000, 'Budget exceeds allowable threshold').optional(),
  eventDetails: z.object({
    id: z.string().optional(),
    name: z.string().max(200).optional(),
    totalBudget: z.number().positive().max(1000000000).optional(),
    location: z.string().max(200).optional(),
    guestCount: z.number().int().min(1).max(50000).optional(),
    occasion: z.string().max(200).optional()
  }).optional()
});

export const recommendVendorsSchema = z.object({
  budget: z.number().positive('Budget must be positive').max(1000000000).optional(),
  location: z.string().max(200).optional(),
  guestCount: z.number().int().min(1).max(50000).optional(),
  category: z.enum(['all', 'venue', 'catering', 'photography', 'decor']).optional(),
  occasion: z.string().max(200).optional()
});

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errorDetails = result.error.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message
      }));
      return res.status(400).json({
        success: false,
        error: 'Validation failed: Invalid request parameters',
        details: errorDetails
      });
    }
    req.body = result.data;
    next();
  };
}
