"use client"

import { saveSettingsAction } from "@/app/(app)/settings/actions"
import { addModelAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CircleCheckBig, Plus } from "lucide-react"
import { useActionState, useState } from "react"

type AIModel = {
  id: string
  name: string
  provider: string
  apiIdentifier: string
}

export default function ModelSettingsForm({
  settings,
  models,
}: {
  settings: Record<string, string>
  models: AIModel[]
}) {
  const [saveState, saveAction, pending] = useActionState(saveSettingsAction, null)
  const [addState, addAction, addPending] = useActionState(addModelAction, null)
  const [open, setOpen] = useState(false)
  const [allModels, setAllModels] = useState<AIModel[]>(models)

  // Close dialog and refresh model list on success
  if (addState?.success && addState?.model && open) {
    const alreadyAdded = allModels.find((m) => m.id === addState.model.id)
    if (!alreadyAdded) {
      setAllModels((prev) => [...prev, addState.model])
    }
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Save default model form */}
      <form action={saveAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="default_model">Default Model</Label>
          <div className="flex flex-row items-center gap-3">
            <Select name="default_model" defaultValue={settings.default_model}>
              <SelectTrigger className="w-[280px]" id="default_model">
                <SelectValue placeholder="Select a model..." />
              </SelectTrigger>
              <SelectContent>
                {allModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {model.provider} · {model.apiIdentifier}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Add Model Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add a Model</DialogTitle>
                </DialogHeader>
                <form action={addAction} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g. MODEL-1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Input
                      id="provider"
                      name="provider"
                      placeholder="e.g. Ensias"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiIdentifier">Model Identifier</Label>
                    <Input
                      id="apiIdentifier"
                      name="apiIdentifier"
                      placeholder="e.g. model-v1"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      The exact model string used in API calls.
                    </p>
                  </div>

                  {addState?.error && <FormError>{addState.error}</FormError>}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addPending}>
                      {addPending ? "Adding..." : "Add Model"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-row items-center gap-4">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Settings"}
          </Button>
          {saveState?.success && (
            <p className="text-green-500 flex flex-row items-center gap-2">
              <CircleCheckBig className="h-4 w-4" />
              Saved!
            </p>
          )}
        </div>

        {saveState?.error && <FormError>{saveState.error}</FormError>}
      </form>
    </div>
  )
}