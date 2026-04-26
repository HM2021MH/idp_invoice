"use server"

import { AnalysisResult, analyzeTransaction } from "@/ai/analyze"
import { AnalyzeAttachment, loadAttachmentsForAI } from "@/ai/attachments"
import { buildLLMPrompt } from "@/ai/prompt"
import { fieldsToJsonSchema } from "@/ai/schema"
import { transactionFormSchema } from "@/forms/transactions"
import { ActionState } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import {
  getDirectorySize,
  getTransactionFileUploadPath,
  getUserUploadsDirectory,
  safePathJoin,
  unsortedFilePath,
} from "@/lib/files"
import { DEFAULT_PROMPT_ANALYSE_NEW_FILE } from "@/models/defaults"
import { createFile, deleteFile, getFileById, updateFile } from "@/models/files"
import {
  createTransaction,
  TransactionData,
  updateTransactionFiles,
  findDuplicateTransaction,
} from "@/models/transactions"
import { updateUser } from "@/models/users"
import { Category, Field, File, Project, Transaction } from "@/prisma/client"
import { randomUUID } from "crypto"
import { mkdir, readFile, copyFile, unlink, writeFile } from "fs/promises"
import { revalidatePath } from "next/cache"
import path from "path"

// ── Core field codes that map directly to Transaction columns ─────────────────
// Everything else from the form goes into the `extra` JSON column.
const CORE_FIELD_CODES = new Set([
  "name",
  "description",
  "merchant",
  "total",
  "currencyCode",
  "convertedTotal",
  "convertedCurrencyCode",
  "type",
  "items",
  "note",
  "categoryCode",
  "projectCode",
  "issuedAt",
  "text",
  "data", // ← the full AI JSON blob — stored in the `data` column, not extra
])

// ── Actions ───────────────────────────────────────────────────────────────────

export async function analyzeFileAction(
  file: File,
  settings: Record<string, string>,
  fields: Field[],
  categories: Category[],
  projects: Project[]
): Promise<ActionState<AnalysisResult>> {
  const user = await getCurrentUser()

  if (!file || file.userId !== user.id) {
    return { success: false, error: "File not found or does not belong to the user" }
  }

  let attachments: AnalyzeAttachment[] = []
  try {
    attachments = await loadAttachmentsForAI(user, file)
  } catch (error) {
    console.error("Failed to retrieve files:", error)
    return { success: false, error: "Failed to retrieve files: " + error }
  }

  const prompt = buildLLMPrompt(
    settings.prompt_analyse_new_file || DEFAULT_PROMPT_ANALYSE_NEW_FILE,
    fields,
    categories,
    projects
  )

  const schema = fieldsToJsonSchema(fields)
  const results = await analyzeTransaction(prompt, schema, attachments, file.id, user.id)

  console.log("Analysis results:", results)

  if (results.data?.tokensUsed && results.data.tokensUsed > 0) {
    await updateUser(user.id, { aiBalance: { decrement: 1 } })
  }

  return results
}

export async function saveFileAsTransactionAction(
  _prevState: ActionState<Transaction> | null,
  formData: FormData
): Promise<ActionState<Transaction>> {
  try {
    const user = await getCurrentUser()

    const allEntries = Object.fromEntries(formData.entries())
    const coreRaw: Record<string, any> = {}
    const extra: Record<string, any> = {}

    for (const [key, value] of Object.entries(allEntries)) {
      if (key === "fileId" || key === "forceSave") continue
      if (key === "data") continue // handled separately below
      if (value === null || value === undefined || value === "") continue

      if (CORE_FIELD_CODES.has(key)) {
        coreRaw[key] = value
      } else {
        extra[key] = value
      }
    }

    // Parse items back from JSON string
    if (typeof coreRaw.items === "string") {
      try {
        coreRaw.items = JSON.parse(coreRaw.items)
      } catch {
        coreRaw.items = []
      }
    }

    // Validate core fields
    const validatedForm = transactionFormSchema.safeParse(coreRaw)
    if (!validatedForm.success) {
      return { success: false, error: validatedForm.error.message }
    }

    // Get file record
    const fileId = formData.get("fileId") as string
    const file = await getFileById(fileId, user.id)
    if (!file) throw new Error("File not found")

    const forceSave = formData.get("forceSave") === "true"
    const transactionData = validatedForm.data

    // Deduplication check
    if (!forceSave) {
      const existingTransaction = await findDuplicateTransaction(user.id, transactionData)
      if (existingTransaction) {
        return {
          success: false,
          error: "DUPLICATE_FOUND",
          duplicateData: {
            existingTransaction,
            newTransactionData: transactionData,
            resumeIndex: 0,
          },
        }
      }
    }

    // Get the full AI JSON blob from the hidden <input name="data"> field
    const rawData = formData.get("data") as string | null

    // Create transaction — data column gets the full AI JSON, extra gets dynamic fields
    const transaction = await createTransaction(user.id, {
      ...transactionData,
      extra: Object.keys(extra).length > 0 ? extra : undefined,
      data: rawData ?? "{}",
    })

    // Move file safely using copy + delete
    const userUploadsDirectory = getUserUploadsDirectory(user)
    const originalFileName = path.basename(file.path)
    const newRelativeFilePath = getTransactionFileUploadPath(file.id, originalFileName, transaction)
    const oldFullFilePath = path.resolve(safePathJoin(userUploadsDirectory, file.path))
    const newFullFilePath = path.resolve(safePathJoin(userUploadsDirectory, newRelativeFilePath))

    await mkdir(path.dirname(newFullFilePath), { recursive: true })
    await copyFile(oldFullFilePath, newFullFilePath)
    await unlink(oldFullFilePath)

    // Update DB records
    await updateFile(file.id, user.id, {
      path: newRelativeFilePath,
      isReviewed: true,
    })
    await updateTransactionFiles(transaction.id, user.id, [file.id])

    revalidatePath("/unsorted")
    revalidatePath("/transactions")

    return { success: true, data: transaction }
  } catch (error) {
    console.error("Failed to save transaction:", error)
    return { success: false, error: `Failed to save transaction: ${error}` }
  }
}

export async function deleteUnsortedFileAction(
  _prevState: ActionState<Transaction> | null,
  fileId: string
): Promise<ActionState<Transaction>> {
  try {
    const user = await getCurrentUser()
    await deleteFile(fileId, user.id)
    revalidatePath("/unsorted")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete file:", error)
    return { success: false, error: "Failed to delete file" }
  }
}

export async function splitFileIntoItemsAction(
  _prevState: ActionState<null> | null,
  formData: FormData
): Promise<ActionState<null>> {
  try {
    const user = await getCurrentUser()
    const fileId = formData.get("fileId") as string
    const items = JSON.parse(formData.get("items") as string) as TransactionData[]

    if (!fileId || !items || items.length === 0) {
      return { success: false, error: "File ID and items are required" }
    }

    const originalFile = await getFileById(fileId, user.id)
    if (!originalFile) {
      return { success: false, error: "Original file not found" }
    }

    const userUploadsDirectory = getUserUploadsDirectory(user)
    const originalFilePath = safePathJoin(userUploadsDirectory, originalFile.path)
    const fileContent = await readFile(originalFilePath)

    for (const item of items) {
      const fileUuid = randomUUID()
      const fileName = `${originalFile.filename}-part-${item.name}`
      const relativeFilePath = unsortedFilePath(fileUuid, fileName)
      const fullFilePath = safePathJoin(userUploadsDirectory, relativeFilePath)

      await mkdir(path.dirname(fullFilePath), { recursive: true })
      await writeFile(fullFilePath, fileContent)

      await createFile(user.id, {
        id: fileUuid,
        filename: fileName,
        path: relativeFilePath,
        mimetype: originalFile.mimetype,
        metadata: originalFile.metadata,
        isSplitted: true,
        cachedParseResult: item,
      })
    }

    await deleteFile(fileId, user.id)

    const storageUsed = await getDirectorySize(getUserUploadsDirectory(user))
    await updateUser(user.id, { storageUsed })

    revalidatePath("/unsorted")
    return { success: true }
  } catch (error) {
    console.error("Failed to split file into items:", error)
    return { success: false, error: `Failed to split file into items: ${error}` }
  }
}