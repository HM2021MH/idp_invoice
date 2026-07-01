import ModelSettingsForm from "@/components/settings/model-form"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getSettings } from "@/models/settings"


export default async function ModelSettingsPage() {
  const user = await getCurrentUser()
  const [settings, models] = await Promise.all([
    getSettings(user.id),
    prisma.aIModel.findMany({ orderBy: { name: "asc" } }),
  ])

  return (
    <div className="w-full max-w-2xl">
      <ModelSettingsForm settings={settings} models={models} />
    </div>
  )
}