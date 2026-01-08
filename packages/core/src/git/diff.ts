import type { FileDiff, Hunk, HunkLine, DiffOptions, GetAllDiffsOptions } from "./types"

const DIFF_HEADER_REGEX = /^diff --git a\/(.+) b\/(.+)$/
const HUNK_HEADER_REGEX = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/

export async function getDiff(options: DiffOptions = {}): Promise<FileDiff[]> {
  const args = ["diff", "--no-color", "-U3"]
  if (options.staged) args.push("--cached")
  if (options.path) args.push("--", options.path)

  const result = await Bun.$`git ${args}`.quiet().text().catch(() => "")
  if (!result.trim()) return []

  return parseDiff(result, options.staged ?? false)
}

/** Get all diffs: staged changes + unstaged changes to tracked files + optionally untracked files */
export async function getAllDiffs(options: GetAllDiffsOptions = {}): Promise<FileDiff[]> {
  const [staged, unstaged, untracked] = await Promise.all([
    getDiff({ staged: true }),
    getDiff({ staged: false }),
    options.includeUntracked ? getUntrackedFiles() : Promise.resolve([]),
  ])

  // Merge: staged files, then unstaged files not already in staged, then untracked
  const fileMap = new Map<string, FileDiff>()

  for (const file of staged) {
    fileMap.set(file.path, file)
  }

  for (const file of unstaged) {
    const existing = fileMap.get(file.path)
    if (existing) {
      // File has both staged and unstaged changes - mark it and combine hunks
      // For now, we show unstaged changes separately
      fileMap.set(`${file.path}:unstaged`, file)
    } else {
      fileMap.set(file.path, file)
    }
  }

  for (const file of untracked) {
    if (!fileMap.has(file.path)) {
      fileMap.set(file.path, file)
    }
  }

  return Array.from(fileMap.values())
}

/** Get untracked files and generate diff-like content for them */
async function getUntrackedFiles(): Promise<FileDiff[]> {
  const result = await Bun.$`git ls-files --others --exclude-standard`.quiet().text().catch(() => "")
  if (!result.trim()) return []

  const files = result.trim().split("\n").filter(Boolean)
  const diffs: FileDiff[] = []

  for (const filePath of files) {
    try {
      const content = await Bun.file(filePath).text()
      const lines = content.split("\n")

      // Generate diff-like output for the new file
      const hunkLines: HunkLine[] = lines.map((line, i) => ({
        type: "add" as const,
        content: line,
        newLineNumber: i + 1,
      }))

      const hunk: Hunk = {
        index: 0,
        header: `@@ -0,0 +1,${lines.length} @@`,
        oldStart: 0,
        oldLines: 0,
        newStart: 1,
        newLines: lines.length,
        lines: hunkLines,
        raw: `@@ -0,0 +1,${lines.length} @@\n${lines.map(l => `+${l}`).join("\n")}`,
      }

      diffs.push({
        path: filePath,
        status: "untracked",
        staged: false,
        hunks: [hunk],
        raw: `diff --git a/${filePath} b/${filePath}\nnew file mode 100644\n${hunk.raw}`,
      })
    } catch {
      // Skip files we can't read (binary, permissions, etc.)
    }
  }

  return diffs
}

export function parseDiff(diffText: string, staged: boolean = false): FileDiff[] {
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
        staged,
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
