"use client"

import { Button } from "@/components/ui/button"
import { Check, Loader2, RotateCcw, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

interface EditableJsonPanelProps {
  transactionId: string
  initialData: string // raw JSON string from transaction.data
  onSave: (id: string, json: string) => Promise<{ success: boolean; error?: string }>
}

function formatJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

function validateJson(raw: string): string | null {
  try {
    JSON.parse(raw)
    return null
  } catch (e) {
    return (e as Error).message
  }
}

// ── Syntax highlighter (renders coloured spans over the textarea) ─────────────
function SyntaxHighlight({ code }: { code: string }) {
  const highlighted = code
    // strings (before keys so keys override)
    .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="jep-key">$1</span>:')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="jep-string">$1</span>')
    // numbers
    .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="jep-number">$1</span>')
    // booleans / null
    .replace(/:\s*(true|false|null)/g, ': <span class="jep-keyword">$1</span>')
    // brackets
    .replace(/([{}\[\]])/g, '<span class="jep-bracket">$1</span>')

  return (
    <pre
      aria-hidden
      className="jep-highlight"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  )
}

export function EditableJsonPanel({ transactionId, initialData, onSave }: EditableJsonPanelProps) {
  const [value, setValue] = useState(() => formatJson(initialData || "{}"))
  const [original, setOriginal] = useState(() => formatJson(initialData || "{}"))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const isDirty = value !== original

  const syncScroll = useCallback(() => {
    if (textareaRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = textareaRef.current.scrollTop
      scrollRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setValue(v)
    setSaved(false)
    setError(validateJson(v))
  }

  const handleFormat = () => {
    if (!error) setValue(formatJson(value))
  }

  const handleReset = () => {
    setValue(original)
    setError(null)
    setSaved(false)
  }

  const handleSave = async () => {
    const err = validateJson(value)
    if (err) { setError(err); return }
    setSaving(true)
    try {
      const result = await onSave(transactionId, value)
      if (result.success) {
        setOriginal(value)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        setError(result.error ?? "Save failed")
      }
    } finally {
      setSaving(false)
    }
  }

  // Tab key inserts spaces instead of losing focus
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const ta = textareaRef.current!
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const next = value.substring(0, start) + "  " + value.substring(end)
      setValue(next)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      })
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <div className="jep-root">
      {/* ── toolbar ── */}
      <div className="jep-toolbar">
        <span className="jep-title">
          <span className="jep-dot" />
          data.json
        </span>
        <div className="jep-actions">
          {isDirty && !saving && (
            <button className="jep-btn jep-btn-ghost" onClick={handleReset} title="Reset">
              <RotateCcw size={13} />
              Reset
            </button>
          )}
          <button
            className="jep-btn jep-btn-ghost"
            onClick={handleFormat}
            disabled={!!error}
            title="Format JSON"
          >
            {"{ }"}
          </button>
          <button
            className={`jep-btn jep-btn-primary ${saved ? "jep-saved" : ""}`}
            onClick={handleSave}
            disabled={saving || !!error || !isDirty}
          >
            {saving ? (
              <Loader2 size={13} className="jep-spin" />
            ) : saved ? (
              <Check size={13} />
            ) : null}
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {/* ── editor ── */}
      <div className="jep-editor-wrap">
        {/* syntax highlight layer */}
        <div ref={scrollRef} className="jep-highlight-layer">
          <SyntaxHighlight code={value} />
        </div>

        {/* real textarea on top (transparent text, caret visible) */}
        <textarea
          ref={textareaRef}
          className="jep-textarea"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      {/* ── error / hint bar ── */}
      <div className={`jep-statusbar ${error ? "jep-statusbar-error" : ""}`}>
        {error ? (
          <span className="jep-error-msg">
            <X size={11} /> {error}
          </span>
        ) : isDirty ? (
          <span className="jep-hint">Unsaved changes · Ctrl+S to save</span>
        ) : (
          <span className="jep-hint">Valid JSON</span>
        )}
      </div>

      {/* ── scoped styles (VSCode Dark+ palette) ── */}
      <style>{`
        .jep-root {
          font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
          background: #1e1e1e;
          border: 1px solid #3c3c3c;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* toolbar */
        .jep-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #252526;
          border-bottom: 1px solid #3c3c3c;
          padding: 0 12px;
          height: 38px;
          gap: 8px;
        }
        .jep-title {
          font-size: 12px;
          color: #cccccc;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .jep-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #e8c270;
        }
        .jep-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .jep-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border: none;
          border-radius: 4px;
          font-family: inherit;
          font-size: 11px;
          padding: 3px 10px;
          cursor: pointer;
          transition: all 0.15s;
          height: 24px;
        }
        .jep-btn:disabled { opacity: 0.4; cursor: default; }
        .jep-btn-ghost {
          background: transparent;
          color: #858585;
          border: 1px solid #3c3c3c;
        }
        .jep-btn-ghost:not(:disabled):hover {
          background: #2d2d2d;
          color: #cccccc;
          border-color: #6c6c6c;
        }
        .jep-btn-primary {
          background: #0e639c;
          color: #ffffff;
        }
        .jep-btn-primary:not(:disabled):hover { background: #1177bb; }
        .jep-saved {
          background: #16825d !important;
        }
        .jep-spin {
          animation: jep-rotate 0.8s linear infinite;
        }
        @keyframes jep-rotate { to { transform: rotate(360deg); } }

        /* editor */
        .jep-editor-wrap {
          position: relative;
          flex: 1;
          min-height: 260px;
          max-height: 520px;
          overflow: hidden;
        }
        .jep-highlight-layer {
          position: absolute;
          inset: 0;
          overflow: auto;
          pointer-events: none;
        }
        .jep-highlight {
          margin: 0;
          padding: 14px 16px;
          font-family: inherit;
          font-size: 13px;
          line-height: 1.7;
          color: #d4d4d4;
          white-space: pre;
          min-width: 100%;
        }
        .jep-textarea {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          padding: 14px 16px;
          margin: 0;
          border: none;
          outline: none;
          background: transparent;
          color: transparent;
          caret-color: #aeafad;
          font-family: inherit;
          font-size: 13px;
          line-height: 1.7;
          resize: none;
          white-space: pre;
          overflow: auto;
        }

        /* syntax colours — VSCode Dark+ */
        .jep-key     { color: #9cdcfe; }
        .jep-string  { color: #ce9178; }
        .jep-number  { color: #b5cea8; }
        .jep-keyword { color: #569cd6; }
        .jep-bracket { color: #ffd700; }

        /* status bar */
        .jep-statusbar {
          background: #007acc;
          color: #ffffff;
          font-size: 11px;
          padding: 2px 12px;
          min-height: 22px;
          display: flex;
          align-items: center;
          transition: background 0.2s;
        }
        .jep-statusbar-error { background: #c72e0f; }
        .jep-hint   { opacity: 0.85; }
        .jep-error-msg {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* scrollbars */
        .jep-highlight-layer::-webkit-scrollbar,
        .jep-textarea::-webkit-scrollbar { width: 8px; height: 8px; }
        .jep-highlight-layer::-webkit-scrollbar-track,
        .jep-textarea::-webkit-scrollbar-track { background: #1e1e1e; }
        .jep-highlight-layer::-webkit-scrollbar-thumb,
        .jep-textarea::-webkit-scrollbar-thumb {
          background: #424242;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}