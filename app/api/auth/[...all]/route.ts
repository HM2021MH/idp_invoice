import { NextRequest, NextResponse } from "next/server"

// Mock auth handlers for template
export async function POST(request: NextRequest) {
  // Mock response: simulate successful auth action
  return NextResponse.json({ success: true, message: "Mock auth POST success" })
}

export async function GET(request: NextRequest) {
  // Mock response: simulate user session
  const mockSession = {
    user: { id: "mock-user-id", email: "mock@example.com" },
    session: { id: "mock-session-id" }
  }
  return NextResponse.json(mockSession)
}
