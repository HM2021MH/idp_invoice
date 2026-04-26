import { fileExists, fullPathForFile } from "@/lib/files"
import { generateFilePreviews } from "@/lib/previews/generate"
import { File, User } from "@/prisma/client"
import fs from "fs/promises"

const MAX_PAGES_TO_ANALYZE = 4

export type AnalyzeAttachment = {
  filename: string
  contentType: string
  base64: string
}

export const loadAttachmentsForAI = async (user: User, file: File): Promise<AnalyzeAttachment[]> => {
  const fullFilePath = fullPathForFile(user, file)
  const isFileExists = await fileExists(fullFilePath)
  if (!isFileExists) {
    throw new Error("File not found on disk")
  }

  const { contentType, previews } = await generateFilePreviews(user, fullFilePath, file.mimetype)

  try {
    return await Promise.all(
      previews.slice(0, MAX_PAGES_TO_ANALYZE).map(async (preview) => ({
        filename: file.filename,
        contentType: contentType,
        base64: await loadFileAsBase64(preview),
      }))
    )
  } finally {
    // ✅ Clean up temp preview files after reading so their handles are
    // released before the caller renames the original file (EBUSY fix).
    // We skip deletion if the preview IS the original file (non-image/pdf path).
    await Promise.allSettled(
      previews.map((preview) => {
        if (preview !== fullFilePath) {
          return fs.unlink(preview).catch(() => {})
        }
        return Promise.resolve()
      })
    )
  }
}

export const loadFileAsBase64 = async (filePath: string): Promise<string> => {
  const buffer = await fs.readFile(filePath)
  return Buffer.from(buffer).toString("base64")
}