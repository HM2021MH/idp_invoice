import { Field } from "@/prisma/client"

// Required at top level: only fields every document must have
const REQUIRED_TOP_LEVEL: string[] = []

export const fieldsToJsonSchema = (fields: Field[]) => {
  const fieldsWithPrompt = fields.filter((field) => field.llm_prompt)

  // All DB fields → top-level transaction properties
  const topLevelProperties = fieldsWithPrompt.reduce(
    (acc, field) => {
      acc[field.code] = { type: field.type, description: field.llm_prompt || "" }
      return acc
    },
    {} as Record<string, { type: string; description: string }>
  )

  // Fixed item line schema — only what belongs on a single line item
  const itemProperties: Record<string, { type: string; description: string }> = {
    description: {
      type: "string",
      description: "line item description or product name",
    },
    quantity: {
      type: "number",
      description: "quantity or units purchased",
    },
    unit_price: {
      type: "number",
      description: "price per unit before tax",
    },
    total: {
      type: "number",
      description: "line item total (quantity × unit_price, after any discount)",
    },
    vat_rate: {
      type: "number",
      description: "VAT or tax rate applied to this line item as a percentage (0–100)",
    },
  }

  // Deduplicated required array — only include codes that exist in topLevelProperties
  const topLevelRequired = [
    ...REQUIRED_TOP_LEVEL.filter((code) => code in topLevelProperties),
    "items",
  ].filter((v, i, a) => a.indexOf(v) === i)

  return {
    type: "object",
    properties: {
      ...topLevelProperties,
      items: {
        type: "array",
        description:
          "All line items / products in the document. Each entry is one product or service line. Return [] if none.",
        items: {
          type: "object",
          properties: itemProperties,
          required: ["description", "total"],
          additionalProperties: false,
        },
      },
    },
    required: topLevelRequired,
    additionalProperties: false,
  }
}