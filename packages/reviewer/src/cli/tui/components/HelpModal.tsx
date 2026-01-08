import { useTheme } from "../context/theme"
import { useKeybind } from "../context/keybind"

interface HelpModalProps {
  visible: boolean
  onClose: () => void
}

export function HelpModal({ visible }: HelpModalProps) {
  const { theme } = useTheme()
  const keybind = useKeybind()

  if (!visible) return null

  const helpText = `Navigation:
  ${keybind.print("prevFile")}/${keybind.print("nextFile")}       Navigate files
  ${keybind.print("prevHunk")}/${keybind.print("nextHunk")}       Navigate hunks
  ${keybind.print("scrollUp")}/${keybind.print("scrollDown")}   Scroll hunks (5)
  ${keybind.print("firstHunk")}/${keybind.print("lastHunk")}     First/last hunk

Actions:
  ${keybind.print("toggleStage")}         Stage current hunk
  ${keybind.print("unstageHunk")}           Unstage current hunk

Other:
  ${keybind.print("help")}           Toggle this help
  ${keybind.print("quit")}           Quit`

  return (
    <box
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 50,
        height: 16,
        marginLeft: -25,
        marginTop: -8,
        border: true,
        borderStyle: "double",
        borderColor: theme.border,
        backgroundColor: theme.background,
        padding: 2,
        zIndex: 100,
      }}
      title="Keybindings"
      titleAlignment="center"
    >
      <text content={helpText} style={{ fg: theme.foreground }} />
    </box>
  )
}
