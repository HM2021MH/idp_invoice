import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Mock response for template: return static portal URL
  const mockPortalUrl = "https://mock-stripe-portal.example.com"
  return NextResponse.redirect(mockPortalUrl)
}
