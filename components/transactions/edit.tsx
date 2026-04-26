"use client"

import { deleteTransactionAction, saveTransactionAction } from "@/app/(app)/transactions/actions"
import { ItemsDetectTool } from "@/components/agents/items-detect"
import ToolWindow from "@/components/agents/tool-window"
import { FormError } from "@/components/forms/error"
import { FormSelectCategory } from "@/components/forms/select-category"
import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormSelectProject } from "@/components/forms/select-project"
import { FormSelectType } from "@/components/forms/select-type"
import { FormInput, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { TransactionData } from "@/models/transactions"
import { Category, Currency, Field, Project, Transaction } from "@/prisma/client"
import { format } from "date-fns"
import { ChevronDown, ChevronUp, Loader2, Save, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { startTransition, useActionState, useEffect, useMemo, useState } from "react"

// ✅ NEW: Proper form data typing
type FormDataType = {
  name: string
  merchant: string
  description: string
  total: number
  currencyCode: string
  convertedTotal: number
  convertedCurrencyCode: string
  type: string
  categoryCode: string
  projectCode: string
  issuedAt: string
  note: string
  items: unknown[]
} & Record<string, any>

// ── Section config ───────────────────────────────────────────────────────────
const SECTION_GROUPS: { title: string; codes: string[] }[] = [
  { title: "Basic info", codes: ["name", "merchant", "description", "type", "issuedAt", "categoryCode", "projectCode"] },
  { title: "Amounts", codes: ["total", "currencyCode", "convertedTotal", "convertedCurrencyCode"] },
  { title: "Details", codes: ["note"] },
]

const GROUPED_CODES = new Set(SECTION_GROUPS.flatMap((g) => g.codes))

function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-border rounded-md mb-2">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border">
          {children}
        </div>
      )}
    </div>
  )
}

export default function TransactionEditForm({
  transaction,
  categories,
  projects,
  currencies,
  fields,
  settings,
}: {
  transaction: Transaction
  categories: Category[]
  projects: Project[]
  currencies: Currency[]
  fields: Field[]
  settings: Record<string, string>
}) {
  const router = useRouter()

  const [deleteState, deleteAction, isDeleting] = useActionState(deleteTransactionAction, null)
  const [saveState, saveAction, isSaving] = useActionState(saveTransactionAction, null)

  const extraFields = fields.filter((field) => field.isExtra)

  const [formData, setFormData] = useState<FormDataType>({
    name: transaction.name || "",
    merchant: transaction.merchant || "",
    description: transaction.description || "",
    total: transaction.total ? transaction.total / 100 : 0.0,
    currencyCode: transaction.currencyCode || settings.default_currency,
    convertedTotal: transaction.convertedTotal ? transaction.convertedTotal / 100 : 0.0,
    convertedCurrencyCode: transaction.convertedCurrencyCode || "",
    type: transaction.type || "expense",
    categoryCode: transaction.categoryCode || settings.default_category,
    projectCode: transaction.projectCode || settings.default_project,
    issuedAt: transaction.issuedAt ? format(transaction.issuedAt, "yyyy-MM-dd") : "",
    note: transaction.note || "",
    items: Array.isArray(transaction.items) ? transaction.items : [],
    ...extraFields.reduce((acc, field) => {
      acc[field.code] = transaction.extra?.[field.code as keyof typeof transaction.extra] || ""
      return acc
    }, {} as Record<string, any>),
  })

  const fieldMap = useMemo(
    () => fields.reduce((acc, field) => { acc[field.code] = field; return acc }, {} as Record<string, Field>),
    [fields]
  )

  const sf = (code: string, fallback: string) =>
    fieldMap[code] ?? { name: fallback, isRequired: false }

  const set = (key: string, value: any) =>
    setFormData((p) => ({ ...p, [key]: value }))

  const handleDelete = () => {
    if (confirm("Are you sure? This will permanently delete the transaction.")) {
      startTransition(async () => {
        await deleteAction(transaction.id)
        router.back()
      })
    }
  }

  useEffect(() => {
    if (saveState?.success) router.back()
  }, [saveState, router])

  const renderField = (code: string) => {
    switch (code) {
      case "name":
        return <FormInput key="name" title={sf("name", "Name").name} name="name" defaultValue={formData.name} isRequired={sf("name", "").isRequired} />

      case "merchant":
        return <FormInput key="merchant" title={sf("merchant", "Merchant").name} name="merchant" defaultValue={formData.merchant} isRequired={sf("merchant", "").isRequired} />

      case "description":
        return <FormInput key="description" title={sf("description", "Description").name} name="description" defaultValue={formData.description} isRequired={sf("description", "").isRequired} />

      case "type":
        return <FormSelectType key="type" title={sf("type", "Type").name} name="type" defaultValue={formData.type} isRequired={sf("type", "").isRequired} />

      case "issuedAt":
        return <FormInput key="issuedAt" type="date" title={sf("issuedAt", "Date").name} name="issuedAt" defaultValue={formData.issuedAt} isRequired={sf("issuedAt", "").isRequired} />

      case "categoryCode":
        return <FormSelectCategory key="categoryCode" title={sf("categoryCode", "Category").name} categories={categories} name="categoryCode" defaultValue={formData.categoryCode} isRequired={sf("categoryCode", "").isRequired} />

      case "projectCode":
        return <FormSelectProject key="projectCode" title={sf("projectCode", "Project").name} projects={projects} name="projectCode" defaultValue={formData.projectCode} isRequired={sf("projectCode", "").isRequired} />

      case "total":
        return <FormInput key="total" type="number" step="0.01" title={sf("total", "Total").name} name="total" defaultValue={formData.total.toFixed(2)} className="w-32" isRequired={sf("total", "").isRequired} />

      case "currencyCode":
        return <FormSelectCurrency key="currencyCode" title={sf("currencyCode", "Currency").name} name="currencyCode" value={formData.currencyCode} currencies={currencies} isRequired={sf("currencyCode", "").isRequired} />

      case "convertedTotal":
        return <FormInput key="convertedTotal" type="number" step="0.01" title={sf("convertedTotal", "Converted Total").name} name="convertedTotal" defaultValue={formData.convertedTotal ? formData.convertedTotal.toFixed(2) : ""} className="w-32" isRequired={sf("convertedTotal", "").isRequired} />

      case "convertedCurrencyCode":
        return <FormSelectCurrency key="convertedCurrencyCode" title={sf("convertedCurrencyCode", "Converted Currency").name} name="convertedCurrencyCode" value={formData.convertedCurrencyCode} currencies={currencies} isRequired={sf("convertedCurrencyCode", "").isRequired} />

      case "note":
        return <FormTextarea key="note" title={sf("note", "Note").name} name="note" defaultValue={formData.note} className="h-24" isRequired={sf("note", "").isRequired} />

      default:
        return null
    }
  }

  const otherFields = extraFields.filter((f) => !GROUPED_CODES.has(f.code))

  return (
    <form action={saveAction} className="space-y-2">
      <input type="hidden" name="transactionId" value={transaction.id} />

      {SECTION_GROUPS.map(({ title, codes }) => {
        const rendered = codes.map(renderField).filter(Boolean)
        if (rendered.length === 0) return null

        const isAmounts = title === "Amounts"
        return (
          <CollapsibleSection key={title} title={title}>
            {isAmounts ? <div className="flex flex-row flex-wrap gap-4">{rendered}</div> : rendered}
          </CollapsibleSection>
        )
      })}

      {otherFields.length > 0 && (
        <CollapsibleSection title="Other" defaultOpen={false}>
          <div className="flex flex-wrap gap-4">
            {otherFields.map((field) => (
              <FormInput
                key={field.code}
                type={field.type === "number" ? "number" : "text"}
                step={field.type === "number" ? "0.01" : undefined}
                title={field.name}
                name={field.code}
                defaultValue={formData[field.code] ?? ""}
                isRequired={field.isRequired}
                className={field.type === "number" ? "max-w-36" : "max-w-full"}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {formData.items.length > 0 && (
        <ToolWindow title="Detected items">
          <ItemsDetectTool data={formData as TransactionData} />
        </ToolWindow>
      )}

      <div className="flex justify-between space-x-4 pt-6">
        <Button type="button" onClick={handleDelete} variant="destructive" disabled={isDeleting}>
          <Trash2 className="h-4 w-4" />
          {isDeleting ? "Deleting…" : "Delete"}
        </Button>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Saving…" : "Save Transaction"}
        </Button>
      </div>

      {deleteState?.error && <FormError>{deleteState.error}</FormError>}
      {saveState?.error && <FormError>{saveState.error}</FormError>}
    </form>
  )
}