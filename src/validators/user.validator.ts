import { z } from "zod";
import { isValidCurrencyCode } from "../utils/currency.constants";

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  baseCurrency: z
    .string()
    .trim()
    .length(3, "Currency code must be exactly 3 characters")
    .toUpperCase()
    .refine(isValidCurrencyCode, "Unsupported currency code")
    .optional(),
});

export type UpdateUserType = z.infer<typeof updateUserSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export type ChangePasswordType = z.infer<typeof changePasswordSchema>;
