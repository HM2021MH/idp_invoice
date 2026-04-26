import { prisma } from "@/lib/db"

export const DEFAULT_PROMPT_ANALYSE_NEW_FILE = `You are a document parser specialized in invoices and receipts. Your job is to extract structured data from any invoice or receipt — regardless of country, language, currency, layout, or format (scanned paper, PDF, photo, digital).

Extract the following fields:

{fields}

Also extract "items": an array of every line item on the document. Each item must have:
- description (string, required)
- quantity (number, omit if absent)
- unit_price (number, omit if absent)
- total (number, omit if absent)
- vat_rate (number as percentage 0–100, omit if absent)

RULES:
- Only extract data that is visibly present — never guess, infer, or invent
- Omit any field entirely if it is not present — do not use null or empty strings
- Dates: YYYY-MM-DD format only
- Amounts: plain numbers, no currency symbols, no separators (e.g. 1234.56)
- currencyCode: ISO 4217 (USD, EUR, MAD, GBP…) or crypto ticker (BTC, ETH…)
- document_type: one of — invoice, receipt
- payment_method: one of — cash, credit_card, debit_card, bank_transfer, check, paypal, cryptocurrency, mobile_wallet, other
- payment_status: one of — paid, pending, overdue, partial, cancelled, refunded
- type: one of — expense, income, refund, reimbursement, credit
- Always produce at least one entry in items[], even for single-line receipts
- If multiple VAT rates exist, record the blended/dominant rate in vat_rate and the per-item rate in items[].vat_rate
- Preserve merchant names in their original language and spelling
- confidence: "high" if all required fields are clearly readable, "medium" if some fields required inference, "low" if the document is unclear or partially legible

Return only one valid JSON object. No markdown, no explanation, no wrapper.`

export const DEFAULT_SETTINGS = [
  {
    code: "default_currency",
    name: "Default Currency",
    description: "Don't change this if you already have multi-currency transactions. Existing amounts won't be recalculated.",
    value: "EUR",
  },
  {
    code: "default_category",
    name: "Default Category",
    description: "",
    value: "other",
  },
  {
    code: "default_project",
    name: "Default Project",
    description: "",
    value: "personal",
  },
  {
    code: "default_type",
    name: "Default Type",
    description: "",
    value: "expense",
  },
  {
    code: "prompt_analyse_new_file",
    name: "Prompt for Analyze Transaction",
    description: "Allowed variables: {fields}, {categories}, {categories.code}, {projects}, {projects.code}",
    value: DEFAULT_PROMPT_ANALYSE_NEW_FILE,
  },
  {
    code: "is_welcome_message_hidden",
    name: "Do not show welcome message on dashboard",
    description: "",
    value: "false",
  },
]

export const DEFAULT_CATEGORIES = [
  { code: "ads",           name: "Advertisement",        color: "#882727", llm_prompt: "ads, promos, online ads, marketing" },
  { code: "swag",          name: "Swag and Goods",        color: "#882727", llm_prompt: "swag, stickers, branded goods, merchandise" },
  { code: "donations",     name: "Gifts and Donations",   color: "#1e6359", llm_prompt: "donations, gifts, charity, sponsorship" },
  { code: "tools",         name: "Equipment and Tools",   color: "#c69713", llm_prompt: "equipment, tools, hardware, devices" },
  { code: "events",        name: "Events and Conferences",color: "#ff8b32", llm_prompt: "events, conferences, seminars, workshops" },
  { code: "food",          name: "Food and Drinks",       color: "#d40e70", llm_prompt: "food, drinks, restaurant, business meals, cafeteria" },
  { code: "insurance",     name: "Insurance",             color: "#050942", llm_prompt: "insurance, health, life, vehicle insurance" },
  { code: "communication", name: "Mobile and Internet",   color: "#0e7d86", llm_prompt: "mobile, internet, phone, telecom, data plan" },
  { code: "office",        name: "Office Supplies",       color: "#59b0b9", llm_prompt: "office, supplies, stationery, printer, paper" },
  { code: "online",        name: "Online Services",       color: "#8753fb", llm_prompt: "online services, saas, subscriptions, cloud" },
  { code: "rental",        name: "Rental",                color: "#050942", llm_prompt: "rental, lease, coworking, workspace" },
  { code: "education",     name: "Education",             color: "#ee5d6c", llm_prompt: "education, courses, books, training" },
  { code: "salary",        name: "Salary",                color: "#ce4993", llm_prompt: "salary, wages, payroll, contractor payment" },
  { code: "fees",          name: "Fees",                  color: "#6a0d83", llm_prompt: "fees, charges, penalties, bank fees" },
  { code: "travel",        name: "Travel Expenses",       color: "#fb9062", llm_prompt: "travel, hotel, flight, airbnb, transport" },
  { code: "utility_bills", name: "Utility Bills",         color: "#af7e2e", llm_prompt: "bills, electricity, water, gas, utilities" },
  { code: "transport",     name: "Transport",             color: "#800000", llm_prompt: "fuel, taxi, uber, car rental, parking, toll" },
  { code: "software",      name: "Software",              color: "#2b5a1d", llm_prompt: "software, licenses, apps, digital tools" },
  { code: "healthcare",    name: "Healthcare",            color: "#c0392b", llm_prompt: "medical, doctor, pharmacy, hospital" },
  { code: "other",         name: "Other",                 color: "#121216", llm_prompt: "other, miscellaneous, unclassified" },
]

export const DEFAULT_PROJECTS = [
  { code: "personal", name: "Personal", llm_prompt: "personal expense", color: "#1e202b" },
]

export const DEFAULT_CURRENCIES = [
  { code: "USD",  name: "$"    },
  { code: "EUR",  name: "€"    },
  { code: "GBP",  name: "£"    },
  { code: "MAD",  name: "د.م." },
  { code: "INR",  name: "₹"    },
  { code: "AUD",  name: "$"    },
  { code: "CAD",  name: "$"    },
  { code: "SGD",  name: "$"    },
  { code: "CHF",  name: "Fr"   },
  { code: "MYR",  name: "RM"   },
  { code: "JPY",  name: "¥"    },
  { code: "CNY",  name: "¥"    },
  { code: "NZD",  name: "$"    },
  { code: "THB",  name: "฿"    },
  { code: "HUF",  name: "Ft"   },
  { code: "AED",  name: "د.إ"  },
  { code: "HKD",  name: "$"    },
  { code: "MXN",  name: "$"    },
  { code: "ZAR",  name: "R"    },
  { code: "PHP",  name: "₱"    },
  { code: "SEK",  name: "kr"   },
  { code: "IDR",  name: "Rp"   },
  { code: "BRL",  name: "R$"   },
  { code: "SAR",  name: "﷼"    },
  { code: "TRY",  name: "₺"    },
  { code: "KES",  name: "KSh"  },
  { code: "KRW",  name: "₩"    },
  { code: "EGP",  name: "£"    },
  { code: "IQD",  name: "ع.د"  },
  { code: "NOK",  name: "kr"   },
  { code: "KWD",  name: "د.ك"  },
  { code: "DKK",  name: "kr"   },
  { code: "PKR",  name: "₨"    },
  { code: "ILS",  name: "₪"    },
  { code: "PLN",  name: "zł"   },
  { code: "QAR",  name: "﷼"    },
  { code: "UAH",  name: "₴"    },
  { code: "NGN",  name: "₦"    },
  { code: "RON",  name: "lei"  },
  { code: "BDT",  name: "৳"    },
  { code: "PEN",  name: "S/"   },
  { code: "GEL",  name: "₾"    },
  { code: "KZT",  name: "₸"    },
  { code: "BTC",  name: "Crypto" },
  { code: "ETH",  name: "Crypto" },
  { code: "USDT", name: "Crypto" },
]

export const DEFAULT_FIELDS = [
  // ── Core identity ────────────────────────────────────────────────────────
  {
    code: "name",
    name: "Name",
    type: "string",
    llm_prompt: "short human-readable name summarizing what was purchased or paid for",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: true,
    isExtra: false,
  },
  {
    code: "document_type",
    name: "Document Type",
    type: "string",
    llm_prompt: "one of: invoice, receipt",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: true,
    isExtra: false,
  },
  {
    code: "invoice_number",
    name: "Invoice / Receipt Number",
    type: "string",
    llm_prompt: "invoice number, receipt number, or document reference ID as printed",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },

  // ── Dates ────────────────────────────────────────────────────────────────
  {
    code: "issuedAt",
    name: "Issued At",
    type: "string",
    llm_prompt: "document issue or transaction date in YYYY-MM-DD format",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: true,
    isExtra: false,
  },
  {
    code: "due_date",
    name: "Due Date",
    type: "string",
    llm_prompt: "payment due date in YYYY-MM-DD format — invoices only, omit for receipts",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },

  // ── Parties ──────────────────────────────────────────────────────────────
  {
    code: "merchant",
    name: "Merchant / Vendor",
    type: "string",
    llm_prompt: "merchant, vendor, or service provider name in original language and spelling",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: true,
    isExtra: false,
  },
  {
    code: "merchant_address",
    name: "Merchant Address",
    type: "string",
    llm_prompt: "full address of the merchant or vendor as printed",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "merchant_tax_id",
    name: "Merchant Tax ID",
    type: "string",
    llm_prompt: "tax ID, VAT number, SIRET, ICE, CIF, or business registration number of the merchant",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "client_name",
    name: "Client / Buyer Name",
    type: "string",
    llm_prompt: "name of the client, buyer, or person being billed",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "client_tax_id",
    name: "Client Tax ID",
    type: "string",
    llm_prompt: "tax ID, VAT number, or business registration number of the client",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },

  // ── Amounts ──────────────────────────────────────────────────────────────
  {
    code: "subtotal",
    name: "Subtotal",
    type: "number",
    llm_prompt: "amount before taxes, VAT, or discounts",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "discount_amount",
    name: "Discount Amount",
    type: "number",
    llm_prompt: "total discount applied as a plain number",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "shipping_amount",
    name: "Shipping Cost",
    type: "number",
    llm_prompt: "shipping or delivery fee as a plain number",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "vat_rate",
    name: "VAT Rate (%)",
    type: "number",
    llm_prompt: "VAT or sales tax rate as a percentage (0–100); if multiple rates exist, use the dominant or blended rate",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "vat",
    name: "VAT / Tax Amount",
    type: "number",
    llm_prompt: "total VAT or tax amount as a plain number",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "total",
    name: "Total",
    type: "number",
    llm_prompt: "final total amount including all taxes and fees",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: true,
    isExtra: false,
  },
  {
    code: "currencyCode",
    name: "Currency",
    type: "string",
    llm_prompt: "ISO 4217 three-letter currency code (USD, EUR, MAD…) or crypto ticker (BTC, ETH…)",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: true,
    isExtra: false,
  },

  // ── Line Items ───────────────────────────────────────────────────────────
  {
    code: "items",
    name: "Line Items",
    type: "json",
    llm_prompt: "array of all line items — each with: description (string, required), quantity (number), unit_price (number), total (number), vat_rate (number as %); always include at least one item",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: true,
    isExtra: false,
  },

  // ── Payment ──────────────────────────────────────────────────────────────
  {
    code: "payment_method",
    name: "Payment Method",
    type: "string",
    llm_prompt: "one of: cash, credit_card, debit_card, bank_transfer, check, paypal, cryptocurrency, mobile_wallet, other",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "payment_status",
    name: "Payment Status",
    type: "string",
    llm_prompt: "one of: paid, pending, overdue, partial, cancelled, refunded",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "iban",
    name: "IBAN",
    type: "string",
    llm_prompt: "IBAN or bank account number if printed on the document",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },

  // ── Classification ───────────────────────────────────────────────────────
  {
    code: "type",
    name: "Type",
    type: "string",
    llm_prompt: "one of: expense, income, refund, reimbursement, credit",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "categoryCode",
    name: "Category",
    type: "string",
    llm_prompt: "category code, one of: {categories.code}",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "projectCode",
    name: "Project",
    type: "string",
    llm_prompt: "project code, one of: {projects.code}",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },

  // ── Meta ─────────────────────────────────────────────────────────────────
  {
    code: "confidence",
    name: "Extraction Confidence",
    type: "string",
    llm_prompt: "high if all required fields are clearly readable, medium if some inference was needed, low if the document is unclear or partial",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "text",
    name: "Extracted Text",
    type: "string",
    llm_prompt: "all raw text visible in the document exactly as written",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "note",
    name: "Note",
    type: "string",
    llm_prompt: "user notes or comments about the transaction",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
]

export async function createUserDefaults(userId: string) {
  for (const project of DEFAULT_PROJECTS) {
    await prisma.project.upsert({
      where: { userId_code: { code: project.code, userId } },
      update: { name: project.name, color: project.color, llm_prompt: project.llm_prompt },
      create: { ...project, userId },
    })
  }

  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_code: { code: category.code, userId } },
      update: { name: category.name, color: category.color, llm_prompt: category.llm_prompt },
      create: { ...category, userId },
    })
  }

  for (const currency of DEFAULT_CURRENCIES) {
    await prisma.currency.upsert({
      where: { userId_code: { code: currency.code, userId } },
      update: { name: currency.name },
      create: { ...currency, userId },
    })
  }

  for (const field of DEFAULT_FIELDS) {
    await prisma.field.upsert({
      where: { userId_code: { code: field.code, userId } },
      update: {
        name: field.name,
        type: field.type,
        llm_prompt: field.llm_prompt,
        isVisibleInList: field.isVisibleInList,
        isVisibleInAnalysis: field.isVisibleInAnalysis,
        isRequired: field.isRequired,
        isExtra: field.isExtra,
      },
      create: { ...field, userId },
    })
  }

  for (const setting of DEFAULT_SETTINGS) {
    await prisma.setting.upsert({
      where: { userId_code: { code: setting.code, userId } },
      update: { name: setting.name, description: setting.description, value: setting.value },
      create: { ...setting, userId },
    })
  }
}

export async function isDatabaseEmpty(userId: string) {
  const fieldsCount = await prisma.field.count({ where: { userId } })
  return fieldsCount === 0
}