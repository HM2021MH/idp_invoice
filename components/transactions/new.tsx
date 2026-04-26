import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { getCurrentUser } from "@/lib/auth"
import { getCategories } from "@/models/categories"
import { getCurrencies } from "@/models/currencies"
import { getProjects } from "@/models/projects"
import { getSettings } from "@/models/settings"

import { Button } from "../ui/button"
import TransactionCreateForm from "./create"

export async function NewTransactionDialog() {
  const user = await getCurrentUser()

  const [categories, currencies, settings, projects] = await Promise.all([
    getCategories(user.id),
    getCurrencies(user.id),
    getSettings(user.id),
    getProjects(user.id),
  ])

  return (
    <Dialog>
      {/* ✅ IMPORTANT: no children, no nesting issues */}
      <DialogTrigger asChild>
        <Button type="button">
          New Transaction
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            New Transaction
          </DialogTitle>
          <DialogDescription>
            Create a new transaction
          </DialogDescription>
        </DialogHeader>

        <TransactionCreateForm
          categories={categories}
          currencies={currencies}
          settings={settings}
          projects={projects}
        />
      </DialogContent>
    </Dialog>
  )
}