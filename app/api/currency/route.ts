import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Mock response for template: return static currency rate
  const mockRate = {
    rate: 1.2,
    cached: false,
  }
  return NextResponse.json(mockRate)
}
