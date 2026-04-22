import { AnalyzeAttachment } from "@/ai/attachments"
import Tesseract from "tesseract.js"

export async function requestLocalAPI(
  baseUrl: string,
  request: {
    prompt: string
    schema: Record<string, unknown>
    attachments: AnalyzeAttachment[]
  }
): Promise<{ output: Record<string, string>; tokensUsed: number; error: null }> {
  
  // 1. OCR sur les images
  let extractedText = ""
  for (const attachment of request.attachments) {
    if (attachment.contentType?.startsWith("image/")) {
        const base64Url = `data:${attachment.contentType};base64,${attachment.base64}`
      const result = await Tesseract.recognize(base64Url, "fra+eng")
      extractedText += result.data.text + "\n"
    }
  }

  // 2. Appel à ton API Spring
  const response = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: request.prompt,
      text: extractedText.trim(),
      schema: request.schema,
    }),
  })

  if (!response.ok) {
    throw new Error(`Spring API error: ${response.status} ${response.statusText}`)
  }

  const json = await response.json()

  // 3. Spring retourne directement { output: {...}, tokensUsed: N }
  return {
    output: json.output ?? json, // si Spring retourne directement le JSON sans wrapper
    tokensUsed: json.tokensUsed || 0,
    error: null,
  }
}