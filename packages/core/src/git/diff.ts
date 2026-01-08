import type { FileDiff, Hunk, HunkLine, DiffOptions } from "./types"

const DIFF_HEADER_REGEX = /^diff --git a\/(.+) b\/(.+)$/
const HUNK_HEADER_REGEX = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/

export async function getDiff(options: DiffOptions = {}): Promise<FileDiff[]> {
  const args = ["diff", "--no-color", "-U3"]
  if (options.staged) args.push("--cached")
  if (options.path) args.push("--", options.path)

  const result = await Bun.$`git ${args}`.text().catch(() => "")
  if (!result.trim()) return []

  return parseDiff(result)
}

export function parseDiff(diffText: string): FileDiff[] {
  const files: FileDiff[] = []
  const lines = diffText.split("\n")
  let currentFile: FileDiff | null = null
  let currentHunk: Hunk | null = null
  let hunkLineIndex = 0
  let oldLineNum = 0
  let newLineNum = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // New file diff header
    const diffMatch = line.match(DIFF_HEADER_REGEX)
    if (diffMatch) {
      if (currentFile) {
        if (currentHunk) {
          currentFile.hunks.push(currentHunk)
        }
        files.push(currentFile)
      }

      const [, oldPath, newPath] = diffMatch
      currentFile = {
        path: newPath,
        oldPath: oldPath !== newPath ? oldPath : undefined,
        status: "modified",
        hunks: [],
        raw: line,
      }
      currentHunk = null
      continue
    }

    if (!currentFile) continue

    // Track raw content
    currentFile.raw += "\n" + line

    // Detect file status from mode lines
    if (line.startsWith("new file mode")) {
      currentFile.status = "added"
      continue
    }
    if (line.startsWith("deleted file mode")) {
      currentFile.status = "deleted"
      continue
    }
    if (line.startsWith("rename from")) {
      currentFile.status = "renamed"
      continue
    }

    // Skip index and --- +++ lines
    if (line.startsWith("index ") || line.startsWith("--- ") || line.startsWith("+++ ")) {
      continue
    }

    // Hunk header
    const hunkMatch = line.match(HUNK_HEADER_REGEX)
    if (hunkMatch) {
      if (currentHunk) {
        currentFile.hunks.push(currentHunk)
      }

      const [, oldStart, oldLines, newStart, newLines] = hunkMatch
      currentHunk = {
        index: currentFile.hunks.length,
        header: line,
        oldStart: parseInt(oldStart, 10),
        oldLines: parseInt(oldLines || "1", 10),
        newStart: parseInt(newStart, 10),
        newLines: parseInt(newLines || "1", 10),
        lines: [],
        raw: line,
      }
      oldLineNum = currentHunk.oldStart
      newLineNum = currentHunk.newStart
      hunkLineIndex = 0
      continue
    }

    if (!currentHunk) continue

    // Hunk content lines
    currentHunk.raw += "\n" + line

    if (line.startsWith("+")) {
      currentHunk.lines.push({
        type: "add",
        content: line.slice(1),
        newLineNumber: newLineNum++,
      })
    } else if (line.startsWith("-")) {
      currentHunk.lines.push({
        type: "remove",
        content: line.slice(1),
        oldLineNumber: oldLineNum++,
      })
    } else if (line.startsWith(" ") || line === "") {
      currentHunk.lines.push({
        type: "context",
        content: line.slice(1),
        oldLineNumber: oldLineNum++,
        newLineNumber: newLineNum++,
      })
    }
  }

  // Push last hunk and file
  if (currentFile) {
    if (currentHunk) {
      currentFile.hunks.push(currentHunk)
    }
    files.push(currentFile)
  }

  return files
}
