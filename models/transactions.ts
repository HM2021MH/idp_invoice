import { prisma } from "@/lib/db"
import { Field, Prisma, Transaction } from "@/prisma/client"
import { cache } from "react"
import { getFields } from "./fields"
import { deleteFile } from "./files"

// ── Types ─────────────────────────────────────────────────────────────────────

export type TransactionData = {
  name?: string | null
  description?: string | null
  merchant?: string | null
  total?: number | null
  currencyCode?: string | null
  convertedTotal?: number | null
  convertedCurrencyCode?: string | null
  type?: string | null
  items?: TransactionData[]
  note?: string | null
  files?: string[]
  extra?: Record<string, unknown>
  categoryCode?: string | null
  projectCode?: string | null
  issuedAt?: Date | string | null
  text?: string | null
  data?: string | null
  [key: string]: unknown
}

export type TransactionFilters = {
  search?: string
  dateFrom?: string
  dateTo?: string
  ordering?: string
  categoryCode?: string
  projectCode?: string
  type?: string
  page?: number
}

export type TransactionPagination = {
  limit: number
  offset: number
}

// ── Core fields that map directly to Transaction scalar columns ───────────────
// These are always handled explicitly — never routed into `extra`.
const CORE_SCALAR_FIELDS = new Set([
  "name",
  "description",
  "merchant",
  "total",
  "currencyCode",
  "convertedTotal",
  "convertedCurrencyCode",
  "type",
  "note",
  "categoryCode",
  "projectCode",
  "issuedAt",
  "text",
  "data",
])

// ── Queries ───────────────────────────────────────────────────────────────────

export const getTransactions = cache(
  async (
    userId: string,
    filters?: TransactionFilters,
    pagination?: TransactionPagination
  ): Promise<{ transactions: Transaction[]; total: number }> => {
    const where: Prisma.TransactionWhereInput = { userId }
    let orderBy: Prisma.TransactionOrderByWithRelationInput = { issuedAt: "desc" }

    if (filters) {
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: "insensitive" } },
          { merchant: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
          { note: { contains: filters.search, mode: "insensitive" } },
          { text: { contains: filters.search, mode: "insensitive" } },
        ]
      }

      if (filters.dateFrom || filters.dateTo) {
        where.issuedAt = {
          gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
        }
      }

      if (filters.categoryCode) where.categoryCode = filters.categoryCode
      if (filters.projectCode) where.projectCode = filters.projectCode
      if (filters.type) where.type = filters.type

      if (filters.ordering) {
        const isDesc = filters.ordering.startsWith("-")
        const field = isDesc ? filters.ordering.slice(1) : filters.ordering
        orderBy = { [field]: isDesc ? "desc" : "asc" }
      }
    }

    if (pagination) {
      const total = await prisma.transaction.count({ where })
      const transactions = await prisma.transaction.findMany({
        where,
        include: { category: true, project: true },
        orderBy,
        take: pagination.limit,
        skip: pagination.offset,
      })
      return { transactions, total }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true, project: true },
      orderBy,
    })

    return { transactions, total: transactions.length }
  }
)

export const getTransactionById = cache(
  async (id: string, userId: string): Promise<Transaction | null> => {
    return prisma.transaction.findUnique({
      where: { id, userId },
      include: { category: true, project: true },
    })
  }
)

export const getTransactionsByFileId = cache(
  async (fileId: string, userId: string): Promise<Transaction[]> => {
    return prisma.transaction.findMany({
      where: { files: { array_contains: [fileId] }, userId },
    })
  }
)

// ── Mutations ─────────────────────────────────────────────────────────────────

export const findDuplicateTransaction = async (
  userId: string,
  data: TransactionData
) => {
  if (data.total && data.merchant && data.issuedAt) {
    return prisma.transaction.findFirst({
      where: {
        userId,
        total: data.total as number,
        merchant: data.merchant,
        issuedAt: new Date(data.issuedAt as string),
        currencyCode: data.currencyCode ?? "USD",
      },
    })
  }
  return null
}

export const createTransaction = async (
  userId: string,
  data: TransactionData
): Promise<Transaction> => {
  // Split fields: core scalars go directly, unknown dynamic fields go to extra
  const { scalar, extra: autoExtra } = splitFields(data)

  const mergedExtra: Record<string, unknown> = {
    ...autoExtra,
    ...(data.extra ?? {}),
  }

  return prisma.transaction.create({
    data: {
      // ── scalar columns ──
      name: scalar.name ?? null,
      description: scalar.description ?? null,
      merchant: scalar.merchant ?? null,
      total: scalar.total ? Number(scalar.total) : null,
      currencyCode: scalar.currencyCode ?? null,
      convertedTotal: scalar.convertedTotal ? Number(scalar.convertedTotal) : null,
      convertedCurrencyCode: scalar.convertedCurrencyCode ?? null,
      type: scalar.type ?? null,
      note: scalar.note ?? null,
      categoryCode: scalar.categoryCode ?? null,
      projectCode: scalar.projectCode ?? null,
      issuedAt: scalar.issuedAt ? new Date(scalar.issuedAt as string) : null,
      text: scalar.text ?? null,
      data: data.data ?? "{}",
      // ── json columns ──
      items: (data.items ?? []) as Prisma.InputJsonValue,
      extra: Object.keys(mergedExtra).length > 0
        ? (mergedExtra as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      // ── relation ──
      userId,
    },
  })
}

export const updateTransaction = async (
  id: string,
  userId: string,
  data: TransactionData
): Promise<Transaction> => {
  const { scalar, extra: autoExtra } = splitFields(data)

  const mergedExtra: Record<string, unknown> = {
    ...autoExtra,
    ...(data.extra ?? {}),
  }

  return prisma.transaction.update({
    where: { id, userId },
    data: {
      name: scalar.name ?? null,
      description: scalar.description ?? null,
      merchant: scalar.merchant ?? null,
      total: scalar.total ? Number(scalar.total) : null,
      currencyCode: scalar.currencyCode ?? null,
      convertedTotal: scalar.convertedTotal ? Number(scalar.convertedTotal) : null,
      convertedCurrencyCode: scalar.convertedCurrencyCode ?? null,
      type: scalar.type ?? null,
      note: scalar.note ?? null,
      categoryCode: scalar.categoryCode ?? null,
      projectCode: scalar.projectCode ?? null,
      issuedAt: scalar.issuedAt ? new Date(scalar.issuedAt as string) : null,
      text: scalar.text ?? null,
      data: data.data ?? "{}",
      items: (data.items ?? []) as Prisma.InputJsonValue,
      extra: Object.keys(mergedExtra).length > 0
        ? (mergedExtra as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
  })
}

export const updateTransactionFiles = async (
  id: string,
  userId: string,
  files: string[]
): Promise<Transaction> => {
  return prisma.transaction.update({
    where: { id, userId },
    data: { files },
  })
}

export const deleteTransaction = async (
  id: string,
  userId: string
): Promise<Transaction | undefined> => {
  const transaction = await getTransactionById(id, userId)
  if (!transaction) return

  const files = Array.isArray(transaction.files) ? transaction.files : []

  for (const fileId of files) {
    if (typeof fileId !== "string") continue
    const related = await getTransactionsByFileId(fileId, userId)
    if (related.length <= 1) await deleteFile(fileId, userId)
  }

  return prisma.transaction.delete({ where: { id, userId } })
}

export const bulkDeleteTransactions = async (ids: string[], userId: string) => {
  return prisma.transaction.deleteMany({
    where: { id: { in: ids }, userId },
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Splits a TransactionData object into:
 * - `scalar`: known core fields that map to Transaction columns
 * - `extra`: everything else (dynamic AI-extracted fields like invoice_number, iban, etc.)
 *
 * This replaces the old DB-query-based splitTransactionDataExtraFields which
 * silently dropped fields not defined in the Field table.
 */
function splitFields(data: TransactionData): {
  scalar: Partial<TransactionData>
  extra: Record<string, unknown>
} {
  const scalar: Partial<TransactionData> = {}
  const extra: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    // These are handled separately — never route into scalar or extra
    if (["extra", "items", "files", "data"].includes(key)) continue

    if (CORE_SCALAR_FIELDS.has(key)) {
      ;(scalar as any)[key] = value
    } else {
      // Dynamic field (invoice_number, iban, vat_rate, merchant_address, etc.)
      extra[key] = value
    }
  }

  return { scalar, extra }
}

// ── Utils ─────────────────────────────────────────────────────────────────────

export function flattenTransaction(transaction: Transaction): Record<string, any> {
  const { extra, ...core } = transaction as any
  return {
    ...core,
    ...(extra && typeof extra === "object" ? extra : {}),
  }
}