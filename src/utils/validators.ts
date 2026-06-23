import { z } from 'zod';

/**
 * Zod refinement equivalent of FuseValidators.mustMatch(controlName, matchingControlName).
 * Use on a z.object() schema with .superRefine().
 *
 * Example:
 *   const schema = z.object({ password: z.string(), confirmPassword: z.string() })
 *     .superRefine(mustMatch('password', 'confirmPassword'));
 */
export function mustMatch(field: string, matchField: string) {
  return (data: Record<string, unknown>, ctx: z.RefinementCtx) => {
    if (data[field] !== data[matchField]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [matchField],
        message: 'Passwords do not match',
      });
    }
  };
}

/** Base password schema — use as building block in auth forms */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long');
