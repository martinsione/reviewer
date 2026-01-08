import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react"
import type { FileDiff, Hunk } from "@reviewer/core"
import { getAllDiffs, stageHunk, unstageHunk } from "@reviewer/core"
import type { TuiOptions } from "../bootstrap"

interface GitState {
  files: FileDiff[]
  selectedFileIndex: number
  selectedHunkIndex: number
  stagedHunks: Set<string> // "filepath:hunkIndex"
  showUntracked: boolean
  loading: boolean
  error: string | null
}

interface GitContextValue {
  state: GitState
  actions: {
    selectFile: (index: number) => void
    selectHunk: (index: number) => void
    toggleHunkStage: () => Promise<void>
    stageSelectedHunk: () => Promise<void>
    unstageSelectedHunk: () => Promise<void>
    toggleUntracked: () => void
    refresh: () => Promise<void>
  }
  computed: {
    currentFile: FileDiff | null
    currentHunk: Hunk | null
    isCurrentHunkStaged: boolean
    totalHunks: number
  }
}

const GitContext = createContext<GitContextValue | null>(null)

export function useGit() {
  const ctx = useContext(GitContext)
  if (!ctx) throw new Error("useGit must be used within GitProvider")
  return ctx
}

interface GitProviderProps {
  children: ReactNode
  options: TuiOptions
}

export function GitProvider({ children, options }: GitProviderProps) {
  const [state, setState] = useState<GitState>({
    files: [],
    selectedFileIndex: 0,
    selectedHunkIndex: 0,
    stagedHunks: new Set(),
    showUntracked: false,
    loading: true,
    error: null,
  })

  const doRefresh = useCallback(async (includeUntracked: boolean, showLoading = true) => {
    if (showLoading) {
      setState((s) => ({ ...s, loading: true, error: null }))
    }
    try {
      const files = await getAllDiffs({ includeUntracked })
      setState((s) => ({
        ...s,
        files,
        loading: false,
        selectedFileIndex: Math.min(s.selectedFileIndex, Math.max(0, files.length - 1)),
        selectedHunkIndex: 0,
      }))
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }))
    }
  }, [])

  // Initial load only
  useEffect(() => {
    doRefresh(false, true)
  }, [doRefresh])

  const refresh = useCallback(async () => {
    await doRefresh(state.showUntracked, true)
  }, [doRefresh, state.showUntracked])

  const selectFile = useCallback((index: number) => {
    setState((s) => {
      const newIndex = Math.max(0, Math.min(index, s.files.length - 1))
      return {
        ...s,
        selectedFileIndex: newIndex,
        selectedHunkIndex: 0,
      }
    })
  }, [])

  const selectHunk = useCallback((index: number) => {
    setState((s) => {
      const file = s.files[s.selectedFileIndex]
      if (!file) return s
      const maxHunks = file.hunks.length - 1
      const newIndex = Math.max(0, Math.min(index, maxHunks))
      return { ...s, selectedHunkIndex: newIndex }
    })
  }, [])

  const stageSelectedHunk = useCallback(async () => {
    const file = state.files[state.selectedFileIndex]
    if (!file) return

    try {
      await stageHunk(file, state.selectedHunkIndex)
      await refresh()
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : "Failed to stage hunk",
      }))
    }
  }, [state.files, state.selectedFileIndex, state.selectedHunkIndex, refresh])

  const unstageSelectedHunk = useCallback(async () => {
    const file = state.files[state.selectedFileIndex]
    if (!file) return

    try {
      await unstageHunk(file, state.selectedHunkIndex)
      await refresh()
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : "Failed to unstage hunk",
      }))
    }
  }, [state.files, state.selectedFileIndex, state.selectedHunkIndex, refresh])

  const toggleHunkStage = useCallback(async () => {
    // For now, just stage (we're viewing unstaged changes by default)
    await stageSelectedHunk()
  }, [stageSelectedHunk])

  const toggleUntracked = useCallback(() => {
    setState((s) => {
      const newShowUntracked = !s.showUntracked
      // Trigger refresh with new value, don't show loading to avoid flicker
      doRefresh(newShowUntracked, false)
      return { ...s, showUntracked: newShowUntracked }
    })
  }, [doRefresh])

  const computed = useMemo(() => {
    const currentFile = state.files[state.selectedFileIndex] ?? null
    const currentHunk = currentFile?.hunks[state.selectedHunkIndex] ?? null
    const hunkKey = currentFile
      ? `${currentFile.path}:${state.selectedHunkIndex}`
      : ""
    const isCurrentHunkStaged = state.stagedHunks.has(hunkKey)
    const totalHunks = currentFile?.hunks.length ?? 0

    return { currentFile, currentHunk, isCurrentHunkStaged, totalHunks }
  }, [state])

  const actions = useMemo(
    () => ({
      selectFile,
      selectHunk,
      toggleHunkStage,
      stageSelectedHunk,
      unstageSelectedHunk,
      toggleUntracked,
      refresh,
    }),
    [selectFile, selectHunk, toggleHunkStage, stageSelectedHunk, unstageSelectedHunk, toggleUntracked, refresh]
  )

  return (
    <GitContext.Provider value={{ state, actions, computed }}>
      {children}
    </GitContext.Provider>
  )
}
