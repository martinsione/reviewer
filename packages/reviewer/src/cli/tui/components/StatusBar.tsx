import { useGit } from "../context/git"
import { useTheme } from "../context/theme"
import { useKeybind } from "../context/keybind"

export function StatusBar() {
  const { theme } = useTheme()
  const { state } = useGit()
  const keybind = useKeybind()

  const keybinds = [
    `${keybind.print("prevFile")}/${keybind.print("nextFile")} nav`,
    `${keybind.print("toggleStage")} stage`,
    `${keybind.print("quit")} quit`,
    `${keybind.print("help")} help`,
  ].join("  ")

  const fileCount = `${state.files.length} file${state.files.length !== 1 ? "s" : ""}`

  return (
    <box
      style={{
        height: 1,
        border: ["top"],
        borderColor: theme.border,
        paddingLeft: 1,
        paddingRight: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: theme.background,
      }}
    >
      <text style={{ fg: theme.muted }} content={keybinds} />
      <text style={{ fg: theme.muted }} content={fileCount} />
    </box>
  )
}
