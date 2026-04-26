"use server"

import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function updateTransactionDataAction(
  transactionId: string,
  json: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate JSON before touching the DB
    JSON.parse(json)

    const user = await getCurrentUser()

    await prisma.transaction.update({
      where: { id: transactionId, userId: user.id },
      data: { data: json },
    })

    revalidatePath(`/transactions/${transactionId}`)
    return { success: true }
  } catch (e) {
    console.error("updateTransactionDataAction error:", e)
    return { success: false, error: (e as Error).message }
  }
}