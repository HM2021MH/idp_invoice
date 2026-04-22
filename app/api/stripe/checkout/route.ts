import config from "@/lib/config"
import { PLANS, stripeClient } from "@/lib/stripe"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  // Mock response for template: return static checkout session
  const mockSession = {
    id: "mock-session-id",
    url: "https://mock-checkout.example.com",
  }
  return NextResponse.json({ session: mockSession })
}
