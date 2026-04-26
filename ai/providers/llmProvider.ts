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

export async function requestLLM(req: LLMRequest): Promise<LLMResponse> {
  try {
    const attachment = req.attachments?.[0]
    const formData = new FormData()

    // =========================
    // ✅ FILE HANDLING
    // =========================
    if (attachment instanceof File) {
      formData.append("file", attachment)
    } else if (attachment?.base64) {
      formData.append("base64File", attachment.base64)
    } else {
      return {
        output: {},
        error: "Invalid attachment: must be File or base64 object",
      }
    }

    // =========================
    // ✅ META FIELDS
    // =========================
    formData.append("mode", req.mode ?? "extract")

    if (req.model) {
      formData.append("model", req.model)
    }

    // =========================
    // ✅ SCHEMA FIX (IMPORTANT)
    // =========================
    if (req.schema && Object.keys(req.schema).length > 0) {
      try {
        const schemaString = JSON.stringify(req.schema)

        formData.append("schema", schemaString)

        console.log("📤 Schema sent to backend:", schemaString)
      } catch (e) {
        console.warn("⚠️ Invalid schema, not sent", e)
      }
    }

    if (req.field) {
      formData.append("field", req.field)
    }

    if (req.question) {
      formData.append("question", req.question)
    }

    // =========================
    // ✅ REQUEST
    // =========================
    const res = await fetch("http://localhost:8080/api/invoice/process", {
      method: "POST",
      body: formData,
    })

    const data = await res.json()

    if (!res.ok) {
      return {
        output: {},
        error: data?.error || "Backend error",
      }
    }

    return {
      output: data?.structured_data,
      tokensUsed: 0,
    }

  } catch (err: any) {
    return {
      output: {},
      error: err.message || "Unknown error",
    }
  }
}