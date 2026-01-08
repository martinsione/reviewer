export interface HunkLine {
  type: "context" | "add" | "remove"
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

export interface Hunk {
  index: number
  header: string // @@ -1,5 +1,7 @@
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: HunkLine[]
  raw: string // Raw diff text for this hunk
}

export interface FileDiff {
  path: string
  oldPath?: string // For renames
  status: "added" | "modified" | "deleted" | "renamed" | "untracked"
  staged: boolean // Whether this diff is from staged changes
  hunks: Hunk[]
  raw: string // Raw diff text for this file
}

export interface DiffOptions {
  staged?: boolean
  path?: string
}

export interface GetAllDiffsOptions {
  includeUntracked?: boolean
}
