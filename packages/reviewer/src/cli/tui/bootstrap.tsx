import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { App } from "./app"
import { GitProvider } from "./context/git"
import { KeybindProvider } from "./context/keybind"
import { ThemeProvider } from "./context/theme"

export interface TuiOptions {
  staged?: boolean
  all?: boolean
}

export async function tui(options: TuiOptions): Promise<void> {
  const renderer = await createCliRenderer({
    exitOnCtrlC: false,
    targetFps: 60,
    useKittyKeyboard: {
      disambiguate: true,
      alternateKeys: true,
    },
  })

  renderer.setBackgroundColor("#0D1117")

  const root = createRoot(renderer)

  return new Promise((resolve) => {
    const handleExit = () => {
      root.unmount()
      renderer.destroy()
      resolve()
    }

    root.render(
      <ThemeProvider>
        <KeybindProvider>
          <GitProvider options={options}>
            <App onExit={handleExit} />
          </GitProvider>
        </KeybindProvider>
      </ThemeProvider>
    )
  })
}
