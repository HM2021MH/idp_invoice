import config from "@/lib/config"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  // Mock response for template: always return success without processing
  console.log("Mock webhook received - simulating success")
  return new NextResponse("Webhook processed successfully (mock)", { status: 200 })
}
