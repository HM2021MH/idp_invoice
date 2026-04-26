"use client"

import { useNotification } from "@/app/(app)/context"
import {
  analyzeFileAction,
  deleteUnsortedFileAction,
  saveFileAsTransactionAction,
} from "@/app/(app)/unsorted/actions"
import { CurrencyConverterTool } from "@/components/agents/currency-converter"
import { ItemsDetectTool } from "@/components/agents/items-detect"
import ToolWindow from "@/components/agents/tool-window"
import { FormError } from "@/components/forms/error"
import { FormSelectCategory } from "@/components/forms/select-category"
import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormSelectProject } from "@/components/forms/select-project"
import { FormSelectType } from "@/components/forms/select-type"
import { FormInput, FormTextarea } from "@/components/forms/simple"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ActionState } from "@/lib/actions"
import { Category, Currency, Field, File, Project, Transaction } from "@/prisma/client"
import { ArrowDownToLine, Brain, ChevronDown, ChevronUp, Loader2, Trash2 } from "lucide-react"
import { startTransition, useActionState, useMemo, useState } from "react"
import { deleteTransactionAction } from "@/app/(app)/transactions/actions"
import { DuplicateModal } from "../transactions/duplicate-modal"
import { EditableJsonPanel } from "@/app/(app)/transactions/editable-json-panel"

// ── Helpers ───────────────────────────────────────────────────────────────────

function isEmpty(value: any): boolean {
  if (value === null || value === undefined || value === "") return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

// ── Collapsible section ───────────────────────────────────────────────────────

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
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border">{children}</div>
      )}
    </div>
  )
}

// ── Section groups config ─────────────────────────────────────────────────────

const SECTION_GROUPS: { title: string; codes: string[] }[] = [
  { title: "Basic info", codes: ["name", "type", "issuedAt", "categoryCode", "projectCode"] },
  { title: "Amounts",    codes: ["total", "currencyCode", "convertedTotal"] },
  { title: "Details",   codes: ["text"] },
]

const GROUPED_CODES = new Set(SECTION_GROUPS.flatMap((g) => g.codes))

// ── Noop save for the panel in the analyze form (data not persisted yet) ──────
// The panel is purely for review/editing before the transaction is created.
// We update formData in-memory; the hidden <input name="data"> picks it up on submit.
async function noopSave(_id: string, _json: string) {
  return { success: true }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnalyzeForm({
  file,
  categories,
  projects,
  currencies,
  fields,
  settings,
}: {
  file: File
  categories: Category[]
  projects: Project[]
  currencies: Currency[]
  fields: Field[]
  settings: Record<string, string>
}) {
  const { showNotification } = useNotification()

  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState("")
  const [deleteState, deleteAction] = useActionState(deleteUnsortedFileAction, null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false)
  const [duplicateData, setDuplicateData] =
    useState<ActionState<Transaction>["duplicateData"] | null>(null)
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)

  const initialFormState: Record<string, any> = useMemo(() => {
    const dynamicState = fields.reduce<Record<string, any>>((acc, field) => {
      acc[field.code] = ""
      return acc
    }, {})

    const cachedResults = file.cachedParseResult
      ? Object.fromEntries(
          Object.entries(file.cachedParseResult as Record<string, any>).filter(
            ([_, v]) => v !== null && v !== ""
          )
        )
      : {}

    return {
      ...dynamicState,
      ...cachedResults,
      name: file.filename,
      currencyCode: settings.default_currency,
      type: settings.default_type,
      categoryCode: settings.default_category,
      projectCode: settings.default_project,
      items: [],
    }
  }, [fields, file, settings])

  const [formData, setFormData] = useState<Record<string, any>>(initialFormState)

  // ── Actions ───────────────────────────────────────────────────────────────

  async function saveAsTransaction(data: FormData) {
    setSaveError("")
    setIsSaving(true)
    startTransition(async () => {
      const result = await saveFileAsTransactionAction(null, data)
      setIsSaving(false)
      if (result.success) {
        showNotification({ code: "global.banner", message: "Saved!", type: "success" })
      } else if (result.error === "DUPLICATE_FOUND" && result.duplicateData) {
        setDuplicateData(result.duplicateData)
        setPendingFormData(data)
        setIsDuplicateModalOpen(true)
      } else {
        setSaveError(result.error || "Something went wrong...")
      }
    })
  }

  const handleReplaceOld = async () => {
    if (!duplicateData || !pendingFormData) return
    setIsDuplicateModalOpen(false)
    setIsSaving(true)
    try {
      await deleteTransactionAction(null, duplicateData.existingTransaction.id)
      await saveAsTransaction(pendingFormData)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to replace transaction")
    } finally {
      setIsSaving(false)
    }
  }

  const startAnalyze = async () => {
    setIsAnalyzing(true)
    setAnalyzeError("")
    try {
      const results = await analyzeFileAction(file, settings, fields, categories, projects)
      if (!results.success) {
        setAnalyzeError(results.error || "Something went wrong...")
      } else {
        const cleaned = Object.fromEntries(
          Object.entries(results.data?.output || {}).filter(([_, v]) => v !== null && v !== "")
        )
        setFormData((prev) => ({ ...prev, ...cleaned }))
        setHasAnalyzed(true) // ← reveal the JSON panel
      }
    } catch {
      setAnalyzeError("Analysis failed")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // ── Field renderer ────────────────────────────────────────────────────────

  const renderField = (field: Field) => {
    if (!field.isVisibleInAnalysis) return null
    const value = formData[field.code]
    if (isEmpty(value)) return null

    switch (field.code) {
      case "currencyCode":
        return (
          <FormSelectCurrency key={field.code} title={field.name} currencies={currencies}
            name={field.code} value={value}
            onValueChange={(v) => setFormData((p) => ({ ...p, [field.code]: v }))} />
        )
      case "categoryCode":
        return (
          <FormSelectCategory key={field.code} title={field.name} categories={categories}
            name={field.code} value={value}
            onValueChange={(v) => setFormData((p) => ({ ...p, [field.code]: v }))} />
        )
      case "projectCode":
        return (
          <FormSelectProject key={field.code} title={field.name} projects={projects}
            name={field.code} value={value}
            onValueChange={(v) => setFormData((p) => ({ ...p, [field.code]: v }))} />
        )
      case "type":
        return (
          <FormSelectType key={field.code} title={field.name} name={field.code} value={value}
            onValueChange={(v) => setFormData((p) => ({ ...p, [field.code]: v }))} />
        )
      case "issuedAt":
        return (
          <FormInput key={field.code} type="date" title={field.name} name={field.code}
            value={value || ""}
            onChange={(e) => setFormData((p) => ({ ...p, [field.code]: e.target.value }))} />
        )
      case "text":
        return (
          <FormTextarea key={field.code} title={field.name} name={field.code} value={value || ""}
            onChange={(e) => setFormData((p) => ({ ...p, [field.code]: e.target.value }))} />
        )
    }

    if (field.type === "number") {
      return (
        <FormInput key={field.code} type="number" step="0.01" title={field.name}
          name={field.code} value={value || ""}
          onChange={(e) => {
            const num = parseFloat(e.target.value || "0")
            if (!isNaN(num)) setFormData((p) => ({ ...p, [field.code]: num }))
          }} />
      )
    }

    return (
      <FormInput key={field.code} title={field.name} name={field.code} value={value || ""}
        onChange={(e) => setFormData((p) => ({ ...p, [field.code]: e.target.value }))} />
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const otherFields = fields.filter((f) => !GROUPED_CODES.has(f.code) && f.isVisibleInAnalysis)

  return (
    <>
      {/* ── Analyze button ── */}
      {!file.isSplitted ? (
        <Button className="w-full mb-6 py-6 text-lg" onClick={startAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? <Loader2 className="animate-spin" /> : <Brain />}
          Analyze with AI
        </Button>
      ) : (
        <div className="flex justify-end mb-4">
          <Badge variant="outline">This file has been split up</Badge>
        </div>
      )}

      {analyzeError && <FormError>{analyzeError}</FormError>}

      {/* ── Form ── */}
      <form action={saveAsTransaction} className="space-y-2">
        <input type="hidden" name="fileId" value={file.id} />
        {/* Always kept in sync with formData so save picks up edits from the JSON panel too */}
        <input type="hidden" name="data" value={JSON.stringify(formData)} />

        {/* Sections */}
        {SECTION_GROUPS.map(({ title, codes }) => {
          const sectionFields = fields.filter((f) => codes.includes(f.code))
          const renderedFields = sectionFields.map(renderField).filter(Boolean)
          if (renderedFields.length === 0) return null
          return (
            <CollapsibleSection key={title} title={title}>
              {renderedFields}
            </CollapsibleSection>
          )
        })}

        {/* Other */}
        {(() => {
          const renderedOther = otherFields.map(renderField).filter(Boolean)
          if (renderedOther.length === 0) return null
          return (
            <CollapsibleSection title="Other" defaultOpen={false}>
              {renderedOther}
            </CollapsibleSection>
          )
        })()}

        {/* Currency converter */}
        {formData.total &&
          formData.currencyCode &&
          formData.currencyCode !== settings.default_currency && (
            <ToolWindow title="Currency Conversion">
              <CurrencyConverterTool
                originalTotal={formData.total}
                originalCurrencyCode={formData.currencyCode}
                targetCurrencyCode={settings.default_currency}
                date={new Date(formData.issuedAt || Date.now())}
                onChange={(v) => setFormData((p) => ({ ...p, convertedTotal: v }))}
              />
            </ToolWindow>
          )}

        {/* Detected items */}
        {formData.items?.length > 0 && (
          <ToolWindow title="Detected items">
            <ItemsDetectTool file={file} data={formData} />
          </ToolWindow>
        )}

        <input type="hidden" name="items" value={JSON.stringify(formData.items)} />

        {/* ── Editable JSON panel — shown only after AI analysis ── */}
        {hasAnalyzed && (
          <CollapsibleSection title="AI Response (JSON)" defaultOpen={false}>
            <EditableJsonPanel
              transactionId={file.id}
              initialData={JSON.stringify(formData)}
              onSave={async (_id, json) => {
                // Parse the edited JSON back into formData so the form stays in sync
                try {
                  const parsed = JSON.parse(json)
                  setFormData((prev) => ({ ...prev, ...parsed }))
                  return { success: true }
                } catch (e) {
                  return { success: false, error: (e as Error).message }
                }
              }}
            />
          </CollapsibleSection>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="destructive"
            onClick={() => startTransition(() => deleteAction(file.id))}
          >
            <Trash2 />
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : <ArrowDownToLine />}
            Save
          </Button>
        </div>

        {deleteState?.error && <FormError>{deleteState.error}</FormError>}
        {saveError && <FormError>{saveError}</FormError>}
      </form>

      <DuplicateModal
        isOpen={isDuplicateModalOpen}
        onOpenChange={setIsDuplicateModalOpen}
        duplicateData={duplicateData}
        onKeepBoth={() => {
          if (!pendingFormData) return
          pendingFormData.append("forceSave", "true")
          saveAsTransaction(pendingFormData)
        }}
        onReplaceOld={handleReplaceOld}
        onCancel={() => setIsDuplicateModalOpen(false)}
      />
    </>
  )
}