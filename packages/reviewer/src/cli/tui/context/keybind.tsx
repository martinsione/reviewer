import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { useKeyboard } from "@opentui/react"
import type { KeyEvent } from "@opentui/core"

export interface KeybindConfig {
  // Navigation
  nextFile: string[]
  prevFile: string[]
  nextHunk: string[]
  prevHunk: string[]
  scrollDown: string[]
  scrollUp: string[]
  firstHunk: string[]
  lastHunk: string[]

  // Actions
  stageHunk: string[]
  unstageHunk: string[]
  toggleStage: string[]

  // View
  toggleView: string[]
  toggleUntracked: string[]

  // Commands
  leader: string[]
  quit: string[]
  apply: string[]
  help: string[]
}

const DEFAULT_KEYBINDS: KeybindConfig = {
  // Navigation
  nextFile: ["j", "down"],
  prevFile: ["k", "up"],
  nextHunk: ["n", "tab"],
  prevHunk: ["p", "shift+tab"],
  scrollDown: ["ctrl+d", "pagedown"],
  scrollUp: ["ctrl+u", "pageup"],
  firstHunk: ["g"],
  lastHunk: ["shift+g"],

  // Actions
  stageHunk: ["s"],
  unstageHunk: ["u"],
  toggleStage: ["space", "return"],

  // View
  toggleView: ["v"],
  toggleUntracked: ["shift+u"],

  // Commands
  leader: ["\\"],
  quit: ["q", "ctrl+c"],
  apply: ["a"],
  help: ["?"],
}

interface KeybindContextValue {
  config: KeybindConfig
  match: (action: keyof KeybindConfig, key: KeyEvent) => boolean
  leader: boolean
  print: (action: keyof KeybindConfig) => string
}

const KeybindContext = createContext<KeybindContextValue | null>(null)

export function useKeybind() {
  const ctx = useContext(KeybindContext)
  if (!ctx) throw new Error("useKeybind must be used within KeybindProvider")
  return ctx
}

function matchKey(bindings: string[], key: KeyEvent): boolean {
  for (const binding of bindings) {
    const parts = binding.toLowerCase().split("+")
    const keyName = parts.pop()!
    const mods = parts

    const targetKey = keyName === "space" ? " " : keyName
    if (key.name?.toLowerCase() !== targetKey && key.raw !== targetKey) continue

    const ctrl = mods.includes("ctrl")
    const shift = mods.includes("shift")
    const alt = mods.includes("alt")
    const meta = mods.includes("meta") || mods.includes("cmd")

    if (
      (key.ctrl || false) === ctrl &&
      (key.shift || false) === shift &&
      (key.meta || false) === meta
    ) {
      return true
    }
  }
  return false
}

export function KeybindProvider({ children }: { children: ReactNode }) {
  const [leader, setLeader] = useState(false)
  const [config] = useState(DEFAULT_KEYBINDS)

  useKeyboard((key) => {
    if (matchKey(config.leader, key)) {
      setLeader(true)
      setTimeout(() => setLeader(false), 2000)
    } else if (leader) {
      setLeader(false)
    }
  })

  const match = useCallback(
    (action: keyof KeybindConfig, key: KeyEvent): boolean => {
      const bindings = config[action]
      return bindings.some((binding) => {
        if (binding.startsWith("<leader>")) {
          return leader && matchKey([binding.replace("<leader>", "")], key)
        }
        return matchKey([binding], key)
      })
    },
    [config, leader]
  )

  const print = useCallback(
    (action: keyof KeybindConfig): string => {
      const bindings = config[action]
      return bindings[0]?.replace("ctrl+", "^").replace("shift+", "S-") || ""
    },
    [config]
  )

  return (
    <KeybindContext.Provider value={{ config, match, leader, print }}>
      {children}
    </KeybindContext.Provider>
  )
}
