import { useMemo } from "react"
import { useGit } from "../context/git"
import { useTheme } from "../context/theme"

function getFiletype(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase()
  const mapping: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    rs: "rust",
    go: "go",
    rb: "ruby",
    java: "java",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    css: "css",
    scss: "scss",
    html: "html",
    json: "json",
    md: "markdown",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
  }
  return mapping[ext || ""] || "text"
}

export function DiffView() {
  const { theme } = useTheme()
  const { state, computed } = useGit()

  if (state.loading) {
    return (
      <box style={{ flexGrow: 1, padding: 1 }}>
        <text style={{ fg: theme.muted }} content="Loading diff..." />
      </box>
    )
  }

  if (state.error) {
    return (
      <box style={{ flexGrow: 1, padding: 1 }}>
        <text style={{ fg: theme.diff.removedSign }} content={`Error: ${state.error}`} />
      </box>
    )
  }

  const currentFile = computed.currentFile
  if (!currentFile) {
    return (
      <box style={{ flexGrow: 1, padding: 1, justifyContent: "center", alignItems: "center" }}>
        <text style={{ fg: theme.muted }} content="No changes to review" />
      </box>
    )
  }

  const filetype = useMemo(() => getFiletype(currentFile.path), [currentFile.path])

  return (
    <box style={{ flexGrow: 1, flexDirection: "column" }}>
      <diff
        diff={currentFile.raw}
        view="unified"
        filetype={filetype}
        syntaxStyle={theme.syntaxStyle}
        showLineNumbers={true}
        wrapMode="none"
        addedBg={theme.diff.addedBg}
        removedBg={theme.diff.removedBg}
        contextBg={theme.diff.contextBg}
        addedSignColor={theme.diff.addedSign}
        removedSignColor={theme.diff.removedSign}
        lineNumberFg={theme.diff.lineNumberFg}
        lineNumberBg={theme.diff.lineNumberBg}
        addedLineNumberBg={theme.diff.addedLineNumberBg}
        removedLineNumberBg={theme.diff.removedLineNumberBg}
        selectionBg={theme.selection}
        selectionFg={theme.selectionFg}
        style={{ flexGrow: 1 }}
      />
    </box>
  )
}
