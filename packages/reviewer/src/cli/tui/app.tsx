import { useTerminalDimensions, useKeyboard } from "@opentui/react"
import { useGit } from "./context/git"
import { useKeybind } from "./context/keybind"
import { useTheme } from "./context/theme"
import { Header } from "./components/Header"
import { FileList } from "./components/FileList"
import { DiffView } from "./components/DiffView"
import { StatusBar } from "./components/StatusBar"
import { HelpModal } from "./components/HelpModal"
import { useState } from "react"

interface AppProps {
  onExit: () => void
}

export function App({ onExit }: AppProps) {
  const dimensions = useTerminalDimensions()
  const { theme } = useTheme()
  const git = useGit()
  const keybind = useKeybind()
  const [showHelp, setShowHelp] = useState(false)

  useKeyboard((key) => {
    // Help toggle
    if (keybind.match("help", key)) {
      setShowHelp((prev) => !prev)
      return
    }

    // Close help on any key if open
    if (showHelp) {
      setShowHelp(false)
      return
    }

    // Navigation
    if (keybind.match("nextFile", key)) {
      git.actions.selectFile(git.state.selectedFileIndex + 1)
    } else if (keybind.match("prevFile", key)) {
      git.actions.selectFile(git.state.selectedFileIndex - 1)
    } else if (keybind.match("nextHunk", key)) {
      git.actions.selectHunk(git.state.selectedHunkIndex + 1)
    } else if (keybind.match("prevHunk", key)) {
      git.actions.selectHunk(git.state.selectedHunkIndex - 1)
    }

    // Actions
    else if (keybind.match("toggleStage", key) || keybind.match("stageHunk", key)) {
      git.actions.stageSelectedHunk()
    } else if (keybind.match("unstageHunk", key)) {
      git.actions.unstageSelectedHunk()
    }

    // Quit
    else if (keybind.match("quit", key)) {
      onExit()
    }
  })

  return (
    <box
      style={{
        width: dimensions.width,
        height: dimensions.height,
        backgroundColor: theme.background,
        flexDirection: "column",
      }}
    >
      <Header />
      <box style={{ flexDirection: "row", flexGrow: 1, flexShrink: 1 }}>
        <FileList width={30} />
        <DiffView />
      </box>
      <StatusBar />
      <HelpModal visible={showHelp} onClose={() => setShowHelp(false)} />
    </box>
  )
}
