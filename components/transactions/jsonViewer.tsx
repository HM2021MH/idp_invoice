"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Braces, Download } from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

// ── Token coloriser (VSCode Dark+ palette) ───────────────────────────────────
function JsonNode({ value, depth = 0 }: { value: JsonValue; depth?: number }) {
  const [collapsed, setCollapsed] = useState(false)
  const indent = depth * 16

  if (value === null)
    return <span className="jv-null">null</span>

  if (typeof value === "boolean")
    return <span className="jv-bool">{String(value)}</span>

  if (typeof value === "number")
    return <span className="jv-number">{value}</span>

  if (typeof value === "string")
    return <span className="jv-string">&quot;{value}&quot;</span>

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="jv-bracket">[]</span>
    return (
      <span>
        <button onClick={() => setCollapsed(!collapsed)} className="jv-toggle" title={collapsed ? "Expand" : "Collapse"}>
          {collapsed ? "▶" : "▼"}
        </button>
        <span className="jv-bracket">[</span>
        {collapsed ? (
          <button onClick={() => setCollapsed(false)} className="jv-ellipsis">{value.length} items…</button>
        ) : (
          <div style={{ marginLeft: indent + 16 }}>
            {value.map((item, i) => (
              <div key={i} className="jv-line">
                <JsonNode value={item} depth={depth + 1} />
                {i < value.length - 1 && <span className="jv-comma">,</span>}
              </div>
            ))}
          </div>
        )}
        <span className="jv-bracket" style={collapsed ? undefined : { marginLeft: indent }}>]</span>
      </span>
    )
  }

  if (typeof value === "object") {
    const keys = Object.keys(value)
    if (keys.length === 0) return <span className="jv-bracket">{"{}"}</span>
    return (
      <span>
        <button onClick={() => setCollapsed(!collapsed)} className="jv-toggle" title={collapsed ? "Expand" : "Collapse"}>
          {collapsed ? "▶" : "▼"}
        </button>
        <span className="jv-bracket">{"{"}</span>
        {collapsed ? (
          <button onClick={() => setCollapsed(false)} className="jv-ellipsis">{keys.length} keys…</button>
        ) : (
          <div style={{ marginLeft: indent + 16 }}>
            {keys.map((k, i) => (
              <div key={k} className="jv-line">
                <span className="jv-key">&quot;{k}&quot;</span>
                <span className="jv-colon">: </span>
                <JsonNode value={(value as Record<string, JsonValue>)[k]} depth={depth + 1} />
                {i < keys.length - 1 && <span className="jv-comma">,</span>}
              </div>
            ))}
          </div>
        )}
        <span className="jv-bracket" style={collapsed ? undefined : { marginLeft: indent }}>{"}"}</span>
      </span>
    )
  }

  return <span>{String(value)}</span>
}

// ── Main component ────────────────────────────────────────────────────────────
interface JsonViewerProps {
  data: string | Record<string, unknown>
  label?: string
}

export function JsonViewer({ data, label = "Raw Data" }: JsonViewerProps) {
  const [open, setOpen] = useState(false)

  let parsed: JsonValue = null
  let parseError = false
  let prettyJson = ""

  try {
    parsed = typeof data === "string" ? JSON.parse(data) : data
    prettyJson = JSON.stringify(parsed, null, 2)
  } catch {
    parseError = true
    prettyJson = typeof data === "string" ? data : JSON.stringify(data)
  }

  const isEmpty =
    !data ||
    data === "{}" ||
    data === "null" ||
    (typeof data === "object" && Object.keys(data).length === 0)

  if (isEmpty) return null

  const handleDownload = () => {
    const blob = new Blob([prettyJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${label.replace(/\s+/g, "_").toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const lineCount = prettyJson.split("\n").length
  const byteSize = new Blob([prettyJson]).size

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
        onClick={() => setOpen(true)}
        title="View JSON data"
      >
        <Braces className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/*
          flex + flexDirection column + fixed maxHeight on the DialogContent
          lets the header/footer stay fixed while the body scrolls.
        */}
        <DialogContent
          className="max-w-2xl p-0 overflow-hidden gap-0 jv-dialog"
          style={{ maxHeight: "80vh", display: "flex", flexDirection: "column" }}
        >
          {/* ── fixed header ── */}
          <DialogHeader className="jv-header" style={{ flexShrink: 0 }}>
            <DialogTitle className="flex items-center gap-2 text-sm font-mono">
              <Braces className="h-4 w-4 jv-icon" />
              <span className="jv-filename">{label}</span>
              <span className="jv-lang-tag">JSON</span>
              <button onClick={handleDownload} className="jv-download-btn" title="Download JSON">
                <Download size={12} />
                Download
              </button>
            </DialogTitle>
          </DialogHeader>

          {/* ── scrollable body — flex:1 + minHeight:0 is the key ── */}
          <div className="jv-body" style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            {parseError ? (
              <pre className="jv-raw">{prettyJson}</pre>
            ) : (
              <div className="jv-tree">
                <JsonNode value={parsed} depth={0} />
              </div>
            )}
          </div>

          {/* ── fixed footer ── */}
          <div className="jv-footer" style={{ flexShrink: 0 }}>
            {lineCount} lines · {byteSize} bytes
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        .jv-dialog {
          background: #1e1e1e !important;
          border: 1px solid #3c3c3c !important;
          color: #d4d4d4 !important;
        }
        .jv-header {
          background: #252526;
          border-bottom: 1px solid #3c3c3c;
          padding: 10px 14px;
          flex-shrink: 0;
        }
        .jv-filename { color: #cccccc; font-size: 13px; }
        .jv-lang-tag {
          font-size: 11px;
          color: #858585;
          font-family: inherit;
          background: #2d2d2d;
          border: 1px solid #3c3c3c;
          border-radius: 3px;
          padding: 1px 6px;
        }
        .jv-icon { color: #e8c270; }

        .jv-download-btn {
          margin-left: auto;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #0e639c;
          border: none;
          border-radius: 4px;
          color: #fff;
          font-size: 11px;
          font-family: inherit;
          padding: 3px 10px;
          height: 24px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .jv-download-btn:hover { background: #1177bb; }

        /* scrollable content area */
        .jv-body {
          background: #1e1e1e;
          padding: 14px 16px;
          font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
          font-size: 13px;
          line-height: 1.7;
        }
        .jv-line { display: block; }

        /* Token colours – VSCode Dark+ */
        .jv-key    { color: #9cdcfe; }
        .jv-string { color: #ce9178; }
        .jv-number { color: #b5cea8; }
        .jv-bool   { color: #569cd6; }
        .jv-null   { color: #569cd6; }
        .jv-bracket{ color: #ffd700; }
        .jv-colon  { color: #d4d4d4; }
        .jv-comma  { color: #d4d4d4; }

        .jv-toggle {
          background: none;
          border: none;
          cursor: pointer;
          color: #858585;
          font-size: 9px;
          padding: 0 4px 0 0;
          line-height: 1;
          vertical-align: middle;
          transition: color 0.15s;
        }
        .jv-toggle:hover { color: #cccccc; }

        .jv-ellipsis {
          background: none;
          border: 1px solid #3c3c3c;
          border-radius: 3px;
          cursor: pointer;
          color: #858585;
          font-size: 11px;
          padding: 0 6px;
          margin: 0 4px;
          font-family: inherit;
          transition: all 0.15s;
        }
        .jv-ellipsis:hover { color: #cccccc; border-color: #6c6c6c; background: #2d2d2d; }

        .jv-raw {
          color: #f48771;
          font-size: 12px;
          white-space: pre-wrap;
          word-break: break-all;
          margin: 0;
        }

        /* status bar */
        .jv-footer {
          background: #007acc;
          color: #fff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          padding: 3px 14px;
        }

        /* custom scrollbar */
        .jv-body::-webkit-scrollbar { width: 8px; height: 8px; }
        .jv-body::-webkit-scrollbar-track { background: #1e1e1e; }
        .jv-body::-webkit-scrollbar-thumb { background: #424242; border-radius: 4px; }
        .jv-body::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>
    </>
  )
}