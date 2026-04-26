import { FormTextarea } from "@/components/forms/simple"

import TransactionEditForm from "@/components/transactions/edit"
import TransactionFiles from "@/components/transactions/transaction-files"
import { Card } from "@/components/ui/card"

import { getCurrentUser } from "@/lib/auth"
import { incompleteTransactionFields } from "@/lib/stats"
import { getCategories } from "@/models/categories"
import { getCurrencies } from "@/models/currencies"
import { getFields } from "@/models/fields"
import { getFilesByTransactionId } from "@/models/files"
import { getProjects } from "@/models/projects"
import { getSettings } from "@/models/settings"
import { getTransactionById } from "@/models/transactions"
import Link from "next/link"
import { notFound } from "next/navigation"
import { EditableJsonPanel } from "../editable-json-panel"
import { updateTransactionDataAction } from "../transaction-data-action"

export default async function TransactionPage({
  params,
}: {
  params: Promise<{ transactionId: string }>
}) {
  const { transactionId } = await params

  const user = await getCurrentUser()
  const transaction = await getTransactionById(transactionId, user.id)

  if (!transaction) {
    notFound()
  }

  const files = await getFilesByTransactionId(transactionId, user.id)
  const categories = await getCategories(user.id)
  const currencies = await getCurrencies(user.id)
  const settings = await getSettings(user.id)
  const fields = await getFields(user.id)
  const projects = await getProjects(user.id)

  const incompleteFields = incompleteTransactionFields(fields, transaction)
  const rawData = (transaction as any).data ?? "{}"
  const hasJsonData = rawData && rawData !== "{}" && rawData !== "null"

  return (
    <div className="flex flex-wrap flex-row items-start justify-center gap-4 max-w-6xl">

      {/* ── MAIN CARD ── */}
      <Card className="w-full flex-1 flex flex-col justify-center items-start overflow-hidden bg-gradient-to-br from-violet-50/80 via-indigo-50/80 to-white border-violet-200/60">

        {/* ⚠️ Incomplete fields warning */}
        {incompleteFields.length > 0 && (
          <div className="w-full flex flex-col gap-1 bg-yellow-50 border-b border-yellow-100 p-5">
            <span>
              Some fields are incomplete:{" "}
              <strong>
                {incompleteFields.map((f) => f?.name).filter(Boolean).join(", ")}
              </strong>
            </span>
            <span className="text-xs text-muted-foreground">
              You can decide which fields are required in{" "}
              <Link href="/settings/fields" className="underline">Fields settings</Link>.
            </span>
          </div>
        )}

        <div className="w-full p-5 space-y-2">

          {/* ── 1. Sectioned edit form: Basic info / Amounts / Details / Other ── */}
          <TransactionEditForm
            transaction={transaction}
            categories={categories}
            currencies={currencies}
            settings={settings}
            fields={fields}
            projects={projects}
          />

          {/* ── 2. Recognized text — same collapsible style, closed by default ── */}
          {transaction?.text && (
            <div className="border border-border rounded-md">
              <details>
                <summary className="flex items-center justify-between px-4 py-3 text-sm font-medium cursor-pointer select-none list-none">
                  Recognized Text
                </summary>
                <div className="px-4 pb-4 pt-1 border-t border-border">
                  <Card className="flex items-stretch p-2">
                    <div className="flex-1">
                      <FormTextarea
                        name="text"
                        defaultValue={transaction.text || ""}
                        hideIfEmpty={true}
                        className="w-full h-[400px]"
                      />
                    </div>
                  </Card>
                </div>
              </details>
            </div>
          )}

          {/* ── 3. Raw JSON data — same collapsible style, open when data exists ── */}
          <div className="border border-border rounded-md">
            <details open={hasJsonData}>
              <summary className="flex items-center gap-2 px-4 py-3 text-sm font-medium cursor-pointer select-none list-none">
                Raw Data (JSON)
                {hasJsonData && (
                  <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                    has data
                  </span>
                )}
              </summary>
              <div className="px-4 pb-4 pt-1 border-t border-border">
                <EditableJsonPanel
                  transactionId={transactionId}
                  initialData={rawData}
                  onSave={updateTransactionDataAction}
                />
              </div>
            </details>
          </div>

        </div>
      </Card>

      {/* ── FILES SIDEBAR ── */}
      <div className="w-1/2 max-w-[400px] space-y-4">
        <TransactionFiles transaction={transaction} files={files} />
      </div>

    </div>
  )
}