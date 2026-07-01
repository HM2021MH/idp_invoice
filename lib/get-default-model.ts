import { getCurrentUser } from "@/lib/auth"
import { getSettings } from "@/models/settings"
import { prisma } from "@/lib/db"

const FALLBACK_MODEL = "invoice-extractor"

export async function getDefaultModel(): Promise<string> {
  try {
    const user = await getCurrentUser()
    const settings = await getSettings(user.id)
    if (!settings.default_model) return FALLBACK_MODEL

    const aiModel = await prisma.aIModel.findUnique({
      where: { id: settings.default_model },
    })

    return aiModel?.apiIdentifier ?? FALLBACK_MODEL
  } catch {
    return FALLBACK_MODEL
  }
}