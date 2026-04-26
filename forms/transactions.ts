import { z } from "zod"

export const transactionFormSchema = z
  .object({
    name: z.string().max(128).optional(),
    merchant: z.string().max(128).optional(),
    description: z.string().max(256).optional(),
    type: z.string().optional(),
    total: z
      .string()
      .optional()
      .transform((val) => {
        if (!val || val.trim() === "") return null
        const num = parseFloat(val)
        if (isNaN(num)) {
          throw new z.ZodError([{ message: "Invalid total", path: ["total"], code: z.ZodIssueCode.custom }])
        }
        return Math.round(num * 100) // convert to cents
      }),
    currencyCode: z.string().max(5).optional(),
    convertedTotal: z
      .string()
      .optional()
      .transform((val) => {
        if (!val || val.trim() === "") return null
        const num = parseFloat(val)
        if (isNaN(num)) {
          throw new z.ZodError([
            { message: "Invalid converted total", path: ["convertedTotal"], code: z.ZodIssueCode.custom },
          ])
        }
        return Math.round(num * 100) // convert to cents
      }),
    convertedCurrencyCode: z.string().max(5).optional(),
    categoryCode: z.string().optional(),
    projectCode: z.string().optional(),
    issuedAt: z
      .union([
        z.date(),
        z
          .string()
          .refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid date format",
          })
          .transform((val) => new Date(val)),
      ])
      .optional(),
    text: z.string().optional(),
    note: z.string().optional(),
    // ✅ Accept either a JSON string (from FormData) or an already-parsed array
    // (when called programmatically). Both normalise to an array.
    items: z
      .preprocess((val) => {
        if (Array.isArray(val)) return val
        if (typeof val === "string" && val.trim() !== "") {
          try { return JSON.parse(val) } catch { return [] }
        }
        return []
      }, z.array(z.any()).default([])),
  })
  .catchall(z.string())