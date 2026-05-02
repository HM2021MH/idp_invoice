export type LLMProvider = "local"

export interface LLMRequest {
  prompt: string
  schema?: Record<string, unknown>
  attachments?: any[]
  mode?: "extract" | "find" | "describe" | "query" | "ocr"
  model?: string
  field?: string
  question?: string
}

export interface LLMResponse {
  output: Record<string, unknown>
  tokensUsed?: number
  error?: string
}

// Server-side (Next.js API routes / server actions running inside Docker):
//   → use BACKEND_INTERNAL_URL = http://backend:8080  (Docker internal network)
// Browser-side (client components):
//   → use NEXT_PUBLIC_BACKEND_URL = http://localhost:8080  (exposed port on host)
function getBackendUrl(): string {
  if (typeof window === "undefined") {
    return process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8080"
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080"
}

export async function requestLLM(req: LLMRequest): Promise<LLMResponse> {
  try {
    const attachment = req.attachments?.[0]
    const formData = new FormData()

    // =========================
    // FILE HANDLING
    // =========================
    if (attachment instanceof File) {
      formData.append("file", attachment)
    } else if (attachment?.base64) {
      formData.append("base64File", attachment.base64)
    } else {
      return { output: {}, error: "Invalid attachment: must be File or base64 object" }
    }

    // =========================
    // META FIELDS
    // =========================
    formData.append("mode", req.mode ?? "extract")

    if (req.model)    formData.append("model", req.model)
    if (req.field)    formData.append("field", req.field)
    if (req.question) formData.append("question", req.question)

    // =========================
    // SCHEMA
    // =========================
    if (req.schema && Object.keys(req.schema).length > 0) {
      try {
        formData.append("schema", JSON.stringify(req.schema))
      } catch (e) {
        console.warn("⚠️ Invalid schema, not sent", e)
      }
    }

    // =========================
    // REQUEST
    // =========================
    const backendUrl = getBackendUrl()
    console.log(`🌐 Backend URL: ${backendUrl} (${typeof window === "undefined" ? "server" : "browser"})`)

    const res = await fetch(`${backendUrl}/api/invoice/process`, {
      method: "POST",
      body: formData,
    })

    const data = await res.json()

    if (!res.ok || !data?.success) {
      return { output: {}, error: data?.error || "Backend error" }
    }

    // =========================
    // RESPONSE PARSING
    // =========================

    // OCR mode
    if (req.mode === "ocr") {
      return { output: { raw_ocr: data.raw_ocr ?? "" }, tokensUsed: 0 }
    }

    // Extract mode
    const raw = data?.structured_data
    if (!raw) {
      return { output: {}, error: "No structured_data in response" }
    }

    let parsed: Record<string, unknown>
    if (typeof raw === "string") {
      try {
        parsed = JSON.parse(raw)
      } catch {
        return { output: { _raw: raw }, error: "structured_data was not valid JSON" }
      }
    } else {
      parsed = raw
    }

    return { output: parsed, tokensUsed: 0 }

  } catch (err: any) {
    return { output: {}, error: err.message || "Unknown error" }
  }
}