import { createContext, useContext, useState, useMemo, type ReactNode } from "react"
import { parseColor, SyntaxStyle } from "@opentui/core"

export interface Theme {
  name: string
  background: string
  foreground: string
  border: string
  selection: string
  selectionFg: string
  muted: string
  diff: {
    addedBg: string
    removedBg: string
    contextBg: string
    addedSign: string
    removedSign: string
    lineNumberFg: string
    lineNumberBg: string
    addedLineNumberBg: string
    removedLineNumberBg: string
  }
  syntaxStyle: ReturnType<typeof SyntaxStyle.fromStyles>
}

const themes: Omit<Theme, "syntaxStyle">[] = [
  {
    name: "GitHub Dark",
    background: "#0D1117",
    foreground: "#E6EDF3",
    border: "#30363D",
    selection: "#264F78",
    selectionFg: "#FFFFFF",
    muted: "#8B949E",
    diff: {
      addedBg: "#1a4d1a",
      removedBg: "#4d1a1a",
      contextBg: "transparent",
      addedSign: "#22c55e",
      removedSign: "#ef4444",
      lineNumberFg: "#6b7280",
      lineNumberBg: "#161b22",
      addedLineNumberBg: "#0d3a0d",
      removedLineNumberBg: "#3a0d0d",
    },
  },
]

const syntaxStyles = {
  keyword: { fg: parseColor("#FF7B72"), bold: true },
  "keyword.import": { fg: parseColor("#FF7B72"), bold: true },
  string: { fg: parseColor("#A5D6FF") },
  comment: { fg: parseColor("#8B949E"), italic: true },
  number: { fg: parseColor("#79C0FF") },
  boolean: { fg: parseColor("#79C0FF") },
  constant: { fg: parseColor("#79C0FF") },
  function: { fg: parseColor("#D2A8FF") },
  "function.call": { fg: parseColor("#D2A8FF") },
  constructor: { fg: parseColor("#FFA657") },
  type: { fg: parseColor("#FFA657") },
  operator: { fg: parseColor("#FF7B72") },
  variable: { fg: parseColor("#E6EDF3") },
  property: { fg: parseColor("#79C0FF") },
  bracket: { fg: parseColor("#F0F6FC") },
  punctuation: { fg: parseColor("#F0F6FC") },
  default: { fg: parseColor("#E6EDF3") },
}

interface ThemeContextValue {
  theme: Theme
  themeIndex: number
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeIndex, setThemeIndex] = useState(0)

  const theme = useMemo((): Theme => {
    const base = themes[themeIndex]
    return {
      ...base,
      syntaxStyle: SyntaxStyle.fromStyles(syntaxStyles),
    }
  }, [themeIndex])

  const cycleTheme = () => {
    setThemeIndex((i) => (i + 1) % themes.length)
  }

  return (
    <ThemeContext.Provider value={{ theme, themeIndex, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
