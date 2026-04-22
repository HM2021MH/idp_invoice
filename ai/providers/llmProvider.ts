export type LLMProvider = "local"

export interface LLMRequest {
  prompt: string
  schema?: Record<string, unknown>
  attachments?: any[]
}

export interface LLMResponse {
  output: Record<string, string>
  tokensUsed?: number
  error?: string
}

export async function requestLLM(_req: LLMRequest): Promise<LLMResponse> {
  // TODO: remplacer par fetch(`${baseUrl}/api/analyze`, { method: "POST", ... })
  return {
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
}