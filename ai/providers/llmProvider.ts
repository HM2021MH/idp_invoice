import Tesseract from "tesseract.js"

export type LLMProvider = "local"

export interface LLMConfig {
  provider: LLMProvider
  apiKey: string
  model: string
  baseUrl?: string
}

export interface LLMSettings {
  providers: LLMConfig[]
}

export interface LLMRequest {
  prompt: string
  schema?: Record<string, unknown>
  attachments?: any[]
}

export interface LLMResponse {
  output: Record<string, string>
  tokensUsed?: number
  provider: LLMProvider
  error?: string
}

const USE_MOCK = true // ← passer à false pour appeler le vrai Spring

export async function requestLLM(settings: LLMSettings, req: LLMRequest): Promise<LLMResponse> {
  const config = settings.providers[0]
  const baseUrl = config?.baseUrl?.trim() || "http://localhost:8080"

  try {
    // 1. OCR sur chaque image attachée
    let extractedText = ""
    if (req.attachments && req.attachments.length > 0) {
      for (const att of req.attachments) {
        if (att.contentType?.startsWith("image/")) {
          const base64Url = `data:${att.contentType};base64,${att.base64}`
          const result = await Tesseract.recognize(base64Url, "fra+eng")
          extractedText += result.data.text + "\n"
        }
      }
    }

    console.log("OCR extracted text:", extractedText.trim())

    // 2. Mock ou vrai appel Spring
    let json: { output: Record<string, string>; tokensUsed: number }

    if (USE_MOCK) {
      json = {
        output: {
          name: "Amazon Order #123",
          merchant: "Amazon",
          description: "Electronics purchase",
          total: "49.99",
          currencyCode: "EUR",
          type: "expense",
          categoryCode: "shopping",
          projectCode: "",
          issuedAt: "2024-01-15",
          note: "Mock response",
        },
        tokensUsed: 0,
      }
    } else {
      const response = await fetch(`${baseUrl}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: req.prompt,
          text: extractedText.trim(),
          schema: req.schema,
        }),
      })

      if (!response.ok) {
        throw new Error(`Spring API error: ${response.status} ${response.statusText}`)
      }

      json = await response.json()
    }

    return {
      output: json.output ?? json,
      tokensUsed: json.tokensUsed || 0,
      provider: "local",
    }
  } catch (error) {
    return {
      output: {},
      provider: "local",
      error: error instanceof Error ? error.message : "Local provider failed",
    }
  }
}