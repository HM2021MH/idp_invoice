import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: Promise<{ progressId: string }> }) {
  // Mock response for template: return static progress data
  const mockProgress = {
    id: "mock-progress-id",
    current: 50,
    total: 100,
    status: "in_progress",
    type: "mock",
  }
  return NextResponse.json(mockProgress)
}
