"use server"

import { ActionState } from "@/lib/actions"
import { updateFile } from "@/models/files"
import { AnalyzeAttachment } from "./attachments"
import { requestLLM } from "./providers/llmProvider"

export type AnalysisResult = {
  output: Record<string, unknown>
  tokensUsed: number
}

export async function analyzeTransaction(
  prompt: string,
  schema: Record<string, unknown>,
  attachments: AnalyzeAttachment[],
  fileId: string,
  userId: string
): Promise<ActionState<AnalysisResult>> {
  try {
    //console.log("Analyzing transaction with prompt:", prompt)
    //console.log("Using schema:", schema)
    //console.log("With attachments:", attachments)
    const response = await requestLLM({ prompt, schema, attachments })
    console.log("LLM response:", response)
    if (response.error) throw new Error(response.error)

    await updateFile(fileId, userId, { cachedParseResult: response.output })

    return {
      success: true,
      data: { output: response.output, tokensUsed: response.tokensUsed ?? 0 },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze invoice",
    }
  }
}